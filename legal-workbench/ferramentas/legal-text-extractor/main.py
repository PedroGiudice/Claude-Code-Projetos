"""
Legal Text Extractor - Sistema de Extração de Texto Jurídico

Entry point e API principal do sistema.

Architecture (Marker-only):
- PDFPlumberEngine: PDFs com texto nativo (rápido, leve)
- MarkerEngine: PDFs escaneados (OCR de alta qualidade, ~10GB RAM)
"""
import logging
import time
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass

from src.engines.pdfplumber_engine import PDFPlumberEngine
from src.engines.marker_engine import MarkerEngine
from src.core.cleaner import DocumentCleaner
from src.exporters.text import TextExporter
from src.exporters.markdown import MarkdownExporter
from src.exporters.json import JSONExporter

# Configurar logging
logger = logging.getLogger(__name__)


@dataclass
class Section:
    """Seção de documento (estrutura simples sem dependência de SDK)"""
    type: str
    content: str
    start_pos: int
    end_pos: int
    confidence: float


@dataclass
class ExtractionResult:
    """Resultado completo da extração"""
    text: str
    sections: list[Section]
    system: str
    system_name: str
    confidence: int
    original_length: int
    final_length: int
    reduction_pct: float
    patterns_removed: list[str]
    engine_used: str = "unknown"


class LegalTextExtractor:
    """
    Sistema de extração de texto jurídico.

    Pipeline:
    1. Detecta tipo de PDF (nativo vs escaneado)
    2. Se nativo → PDFPlumber (rápido)
    3. Se escaneado → Marker (OCR de alta qualidade)
    4. Limpeza semântica do texto extraído
    """

    def __init__(self):
        self.pdfplumber_engine = PDFPlumberEngine()
        self.marker_engine = MarkerEngine()
        self.cleaner = DocumentCleaner()
        self.txt_exporter = TextExporter()
        self.md_exporter = MarkdownExporter()
        self.json_exporter = JSONExporter()

    def _is_scanned(self, pdf_path: Path) -> bool:
        """
        Detecta se PDF é escaneado (sem texto nativo).

        Usa pdfplumber para verificar densidade de texto.
        """
        import pdfplumber

        with pdfplumber.open(pdf_path) as pdf:
            if len(pdf.pages) == 0:
                return True

            # Verifica primeira página
            text = pdf.pages[0].extract_text()
            # Se tem menos de 50 caracteres, provavelmente é escaneado
            return not text or len(text.strip()) < 50

    def process_pdf(
        self,
        pdf_path: Path | str,
        system: str | None = None,
        blacklist: list[str] | None = None,
        output_format: str = "text",  # "text", "markdown", "json"
        force_ocr: bool = False,
    ) -> ExtractionResult:
        """
        Processa PDF completo.

        Args:
            pdf_path: Caminho do PDF
            system: Sistema judicial (None = auto-detect)
            blacklist: Termos customizados a remover
            output_format: Formato de saída ("text", "markdown", "json")
            force_ocr: Forçar uso de Marker mesmo para PDFs nativos

        Returns:
            ExtractionResult com texto limpo e metadados
        """
        start_time = time.time()
        pdf_path = Path(pdf_path)

        logger.info(f"=== PROCESSANDO: {pdf_path.name} ===")
        logger.info(f"Tamanho do arquivo: {pdf_path.stat().st_size / 1024 / 1024:.2f} MB")

        # 1. Detecta tipo e extrai texto
        logger.info("1/2 Extraindo texto do PDF...")
        extract_start = time.time()

        is_scanned = self._is_scanned(pdf_path)
        use_ocr = is_scanned or force_ocr

        if use_ocr:
            logger.info("PDF escaneado detectado - usando Marker OCR")

            if not self.marker_engine.is_available():
                ok, reason = self.marker_engine.check_resources()
                raise RuntimeError(f"Marker não disponível: {reason}")

            engine_result = self.marker_engine.extract(pdf_path)
            engine_used = "marker"
        else:
            logger.info("PDF com texto nativo - usando PDFPlumber")
            engine_result = self.pdfplumber_engine.extract(pdf_path)
            engine_used = "pdfplumber"

        raw_text = engine_result.text
        extract_time = time.time() - extract_start

        logger.info(f"✓ Texto extraído via {engine_used}: {len(raw_text):,} caracteres ({extract_time:.2f}s)")

        # 2. Limpa texto
        logger.info("2/2 Limpando documento...")
        clean_start = time.time()

        cleaning_result = self.cleaner.clean(
            text=raw_text,
            system=system,
            custom_blacklist=blacklist
        )
        clean_time = time.time() - clean_start

        logger.info(f"✓ Sistema detectado: {cleaning_result.stats.system_name} "
                   f"({cleaning_result.stats.confidence}% confiança)")
        logger.info(f"✓ Redução: {cleaning_result.stats.reduction_pct:.1f}% "
                   f"({cleaning_result.stats.original_length:,} → {cleaning_result.stats.final_length:,} chars)")
        logger.info(f"✓ Padrões removidos: {len(cleaning_result.stats.patterns_removed)} ({clean_time:.2f}s)")

        # Cria seção única para o documento
        sections = [Section(
            type="documento_completo",
            content=cleaning_result.text,
            start_pos=0,
            end_pos=len(cleaning_result.text),
            confidence=1.0
        )]

        # Retorna resultado
        total_time = time.time() - start_time
        logger.info(f"=== CONCLUÍDO: {total_time:.2f}s total "
                   f"(extração: {extract_time:.2f}s, limpeza: {clean_time:.2f}s) ===\n")

        return ExtractionResult(
            text=cleaning_result.text,
            sections=sections,
            system=cleaning_result.stats.system,
            system_name=cleaning_result.stats.system_name,
            confidence=cleaning_result.stats.confidence,
            original_length=cleaning_result.stats.original_length,
            final_length=cleaning_result.stats.final_length,
            reduction_pct=cleaning_result.stats.reduction_pct,
            patterns_removed=cleaning_result.stats.patterns_removed,
            engine_used=engine_used,
        )

    def save(self, result: ExtractionResult, output_path: Path | str, format: str = "text"):
        """
        Salva resultado em arquivo.

        Args:
            result: ExtractionResult
            output_path: Caminho de saída
            format: "text", "markdown" ou "json"
        """
        output_path = Path(output_path)

        metadata = {
            "system": result.system,
            "system_name": result.system_name,
            "confidence": result.confidence,
            "reduction_pct": result.reduction_pct,
            "patterns_removed_count": len(result.patterns_removed),
            "engine_used": result.engine_used,
        }

        if format == "text":
            # Cria CleaningResult temporário para compatibilidade com TextExporter
            from src.core.cleaner import CleaningResult, CleaningStats
            cleaning_result = CleaningResult(
                text=result.text,
                stats=CleaningStats(
                    system=result.system,
                    system_name=result.system_name,
                    confidence=result.confidence,
                    original_length=result.original_length,
                    final_length=result.final_length,
                    reduction_pct=result.reduction_pct,
                    patterns_removed=result.patterns_removed
                )
            )
            self.txt_exporter.export(cleaning_result, output_path)
        elif format == "markdown":
            self.md_exporter.export(result.sections, output_path, metadata)
        elif format == "json":
            self.json_exporter.export(result.sections, output_path, metadata)
        else:
            raise ValueError(f"Unknown format: {format}")


# CLI básico (para testes)
if __name__ == "__main__":
    import sys

    if len(sys.argv) < 2:
        print("Usage: python main.py <pdf_file> [--force-ocr]")
        sys.exit(1)

    # Configurar logging (console + arquivo)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    log_file = f"extraction_{timestamp}.log"

    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file),
            logging.StreamHandler()
        ]
    )

    logger.info(f"Log salvo em: {log_file}")

    pdf_file = Path(sys.argv[1])
    force_ocr = "--force-ocr" in sys.argv

    extractor = LegalTextExtractor()
    result = extractor.process_pdf(pdf_file, force_ocr=force_ocr)

    print(f"\n{'='*60}")
    print(f"RESULTADO - {pdf_file.name}")
    print(f"{'='*60}")
    print(f"Engine: {result.engine_used}")
    print(f"Sistema: {result.system_name} ({result.confidence}%)")
    print(f"Redução: {result.reduction_pct:.1f}%")
    print(f"Seções: {len(result.sections)}")
    print(f"\nTexto limpo ({result.final_length} caracteres):")
    print(result.text[:500] + "...")
    print(f"\n{'='*60}")
    print(f"Log completo salvo em: {log_file}")
    print(f"{'='*60}")
