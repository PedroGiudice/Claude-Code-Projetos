"""
Marker Engine - High-quality PDF extraction with layout preservation (STUB).

Marker is a powerful engine for PDF conversion that:
- Preserves document layout and structure
- Handles complex PDFs (multi-column, tables, images)
- Outputs markdown with formatting

REQUIREMENTS:
- High RAM: ~8GB minimum
- GPU: Optional but recommended for speed
- Dependencies: marker-pdf package

CURRENT STATUS: Stub implementation (engine unavailable on low-RAM systems)
"""

import logging
from pathlib import Path

try:
    import marker
    MARKER_AVAILABLE = True
except ImportError:
    MARKER_AVAILABLE = False

from .base import ExtractionEngine, ExtractionResult


logger = logging.getLogger(__name__)


class MarkerEngine(ExtractionEngine):
    """
    High-quality extraction engine using Marker.

    Características:
    - Pesado: ~8GB RAM mínimo
    - Lento mas preciso: Análise profunda de layout
    - Suporta: Tabelas, colunas, imagens, formatação complexa
    - Output: Markdown com estrutura preservada

    NOTA: Este é um STUB - implementação completa requer:
    1. Instalar marker-pdf: pip install marker-pdf
    2. Sistema com >= 8GB RAM disponível
    3. (Opcional) GPU para aceleração

    Example:
        >>> engine = MarkerEngine()
        >>> if engine.is_available():
        ...     result = engine.extract(Path("complex_document.pdf"))
        ...     print(result.metadata['markdown'])
    """

    name = "marker"
    min_ram_gb = 8.0
    dependencies = ["marker"]

    def __init__(self, use_gpu: bool = False):
        """
        Inicializa Marker engine.

        Args:
            use_gpu: Usar GPU se disponível (padrão: False)
        """
        self.use_gpu = use_gpu

    def is_available(self) -> bool:
        """
        Verifica se Marker está disponível.

        Returns:
            True se marker-pdf está instalado E RAM >= 8GB
        """
        if not MARKER_AVAILABLE:
            return False

        # Check RAM requirement
        ok, reason = self.check_resources()
        return ok

    def extract(self, pdf_path: Path) -> ExtractionResult:
        """
        STUB: Extração com Marker não implementada.

        Esta é uma implementação placeholder. A implementação completa
        será adicionada quando houver sistema com RAM suficiente.

        Args:
            pdf_path: Caminho para arquivo PDF

        Returns:
            ExtractionResult (nunca - sempre levanta exceção)

        Raises:
            NotImplementedError: Sempre (stub não implementado)
        """
        raise NotImplementedError(
            "Marker engine is not yet implemented. "
            "This is a placeholder for future implementation.\n"
            "Requirements:\n"
            "  - System with >= 8GB available RAM\n"
            "  - Install marker-pdf: pip install marker-pdf\n"
            "  - (Optional) CUDA GPU for acceleration"
        )

        # TODO: Implement when RAM is available
        # from marker.convert import convert_single_pdf
        # from marker.models import load_all_models
        #
        # models = load_all_models()
        # full_text, images, metadata = convert_single_pdf(
        #     str(pdf_path),
        #     models,
        #     ...
        # )
        #
        # return ExtractionResult(
        #     text=full_text,
        #     pages=metadata.get("pages", 0),
        #     engine_used=self.name,
        #     confidence=0.95,  # Marker typically high quality
        #     metadata={
        #         "markdown": full_text,
        #         "images_extracted": len(images),
        #         ...
        #     },
        # )
