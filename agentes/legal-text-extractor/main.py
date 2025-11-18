"""
Legal Text Extractor - Agente de Extração de Texto Jurídico

Entry point e API principal do agente.
"""
from pathlib import Path
from dataclasses import dataclass

from src.extractors.text_extractor import TextExtractor
from src.extractors.ocr_extractor import OCRExtractor
from src.core.cleaner import DocumentCleaner
from src.analyzers.section_analyzer import SectionAnalyzer, Section
from src.exporters.text import TextExporter
from src.exporters.markdown import MarkdownExporter
from src.exporters.json import JSONExporter


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


class LegalTextExtractor:
    """
    Agente de extração de texto jurídico.

    Combina extração, limpeza e separação de seções.
    """

    def __init__(self):
        self.text_extractor = TextExtractor()
        self.ocr_extractor = OCRExtractor()
        self.cleaner = DocumentCleaner()
        self.section_analyzer = SectionAnalyzer()
        self.txt_exporter = TextExporter()
        self.md_exporter = MarkdownExporter()
        self.json_exporter = JSONExporter()

    def process_pdf(
        self,
        pdf_path: Path | str,
        system: str | None = None,
        separate_sections: bool = False,
        blacklist: list[str] | None = None,
        output_format: str = "text"  # "text", "markdown", "json"
    ) -> ExtractionResult:
        """
        Processa PDF completo.

        Args:
            pdf_path: Caminho do PDF
            system: Sistema judicial (None = auto-detect)
            separate_sections: Separar seções usando Claude
            blacklist: Termos customizados a remover
            output_format: Formato de saída ("text", "markdown", "json")

        Returns:
            ExtractionResult com texto limpo e metadados
        """
        pdf_path = Path(pdf_path)

        # 1. Extrai texto
        if self.text_extractor.is_scanned(pdf_path):
            raise NotImplementedError("OCR not implemented yet (Fase 2)")

        raw_text = self.text_extractor.extract(pdf_path)

        # 2. Limpa texto
        cleaning_result = self.cleaner.clean(
            text=raw_text,
            system=system,
            custom_blacklist=blacklist
        )

        # 3. Separa seções (opcional)
        sections = []
        if separate_sections:
            sections = self.section_analyzer.analyze(cleaning_result.text)
        else:
            # Seção única
            sections = [Section(
                type="documento_completo",
                content=cleaning_result.text,
                start_pos=0,
                end_pos=len(cleaning_result.text),
                confidence=1.0
            )]

        # 4. Retorna resultado
        return ExtractionResult(
            text=cleaning_result.text,
            sections=sections,
            system=cleaning_result.stats.system,
            system_name=cleaning_result.stats.system_name,
            confidence=cleaning_result.stats.confidence,
            original_length=cleaning_result.stats.original_length,
            final_length=cleaning_result.stats.final_length,
            reduction_pct=cleaning_result.stats.reduction_pct,
            patterns_removed=cleaning_result.stats.patterns_removed
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
            "patterns_removed_count": len(result.patterns_removed)
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
        print("Usage: python main.py <pdf_file>")
        sys.exit(1)

    pdf_file = Path(sys.argv[1])

    extractor = LegalTextExtractor()
    result = extractor.process_pdf(pdf_file, separate_sections=False)

    print(f"Sistema: {result.system_name} ({result.confidence}%)")
    print(f"Redução: {result.reduction_pct:.1f}%")
    print(f"Seções: {len(result.sections)}")
    print(f"\nTexto limpo ({result.final_length} caracteres):")
    print(result.text[:500] + "...")
