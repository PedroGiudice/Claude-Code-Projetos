"""
PipelineOrchestrator - Integrates all extraction components.

Workflow:
1. Analyze PDF layout (step_01)
2. For each page:
   a. Compute signature
   b. Query ContextStore for hints
   c. Select engine (considering hints)
   d. Extract text
   e. Learn from result (feed back to ContextStore)
3. Return final markdown

Features:
- Optional learning mode (with/without ContextStore)
- Automatic engine selection with fallback
- Pattern-based optimization hints
- Feedback loop for continuous improvement
"""

import logging
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field
from datetime import datetime

from src.context import (
    ContextStore,
    PatternHint,
    ObservationResult,
    SignatureVector,
    EngineType,
    PatternType,
    Caso,
)
from src.context.signature import (
    compute_signature_from_layout,
    PageSignatureInput,
    infer_pattern_type,
)
from src.engines import EngineSelector, get_selector
from src.engines.base import ExtractionResult
from src.steps.step_01_layout import LayoutAnalyzer
from src.config import PageType, PageComplexity, COMPLEXITY_ENGINE_MAP

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    """
    Result from complete pipeline extraction.

    Attributes:
        text: Final extracted text (markdown)
        total_pages: Number of pages processed
        success: Overall success status
        metadata: Additional metadata
        patterns_learned: Number of patterns learned (0 if no ContextStore)
        processing_time_ms: Total processing time in milliseconds
        warnings: List of warnings during processing
        layout: Layout analysis result (optional)
    """
    text: str
    total_pages: int
    success: bool
    metadata: dict = field(default_factory=dict)
    patterns_learned: int = 0
    processing_time_ms: Optional[int] = None
    warnings: list[str] = field(default_factory=list)
    layout: Optional[dict] = None


class PipelineOrchestrator:
    """
    Orchestrates the complete PDF extraction pipeline.

    Integrates:
    - LayoutAnalyzer: Analyzes PDF structure
    - ContextStore: Learns and suggests patterns (optional)
    - EngineSelector: Selects best extraction engine
    - Extraction engines: Extracts text

    Workflow:
    1. Analyze layout
    2. For each page:
       - Compute signature
       - Query ContextStore for hints
       - Select engine (considering hints)
       - Extract text
       - Learn from result
    3. Combine results
    """

    def __init__(
        self,
        context_db_path: Optional[Path] = None,
        caso_info: Optional[dict] = None,
    ):
        """
        Initialize pipeline orchestrator.

        Args:
            context_db_path: Path to ContextStore database (None = no learning)
            caso_info: Case information dict with keys:
                - numero_cnj: CNJ process number
                - sistema: System name ('pje', 'eproc', etc)
        """
        # Initialize ContextStore if db_path provided
        self.context_store: Optional[ContextStore] = None
        self.caso: Optional[Caso] = None

        if context_db_path is not None:
            self.context_store = ContextStore(db_path=context_db_path)
            logger.info(f"ContextStore enabled: {context_db_path}")

            # Create/get caso if info provided
            if caso_info:
                self.caso = self.context_store.get_or_create_caso(
                    numero_cnj=caso_info.get("numero_cnj", "UNKNOWN"),
                    sistema=caso_info.get("sistema", "UNKNOWN"),
                )
                logger.info(f"Case loaded: {self.caso.numero_cnj} (id={self.caso.id})")
        else:
            logger.info("ContextStore disabled - one-off extraction mode")

        # Initialize LayoutAnalyzer
        self.layout_analyzer = LayoutAnalyzer()

        # Initialize EngineSelector
        self.engine_selector: EngineSelector = get_selector()

    def process(self, pdf_path: Path) -> PipelineResult:
        """
        Process a PDF through the complete pipeline.

        Args:
            pdf_path: Path to PDF file

        Returns:
            PipelineResult with extracted text and metadata

        Raises:
            FileNotFoundError: PDF not found
            RuntimeError: No extraction engines available
        """
        start_time = datetime.now()
        warnings = []
        patterns_learned = 0

        try:
            # 1. Layout analysis
            logger.info(f"Analyzing layout: {pdf_path.name}")
            layout = self.layout_analyzer.analyze(pdf_path)
            total_pages = layout["total_pages"]
            logger.info(f"Layout analyzed: {total_pages} pages")

            # 2. Process each page
            page_texts = []
            for page_data in layout["pages"]:
                try:
                    page_result = self._process_page(pdf_path, page_data, layout)
                    page_texts.append(page_result["text"])

                    # Learn from result if ContextStore active
                    if page_result.get("observation"):
                        patterns_learned += 1

                except Exception as e:
                    warning = f"Failed to process page {page_data['page_num']}: {e}"
                    logger.warning(warning)
                    warnings.append(warning)
                    page_texts.append("")  # Empty text for failed page

            # 3. Combine text
            final_text = self._combine_page_texts(page_texts)

            # 4. Clean text
            final_text = self._clean_text(final_text)

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            return PipelineResult(
                text=final_text,
                total_pages=total_pages,
                success=True,
                metadata={
                    "pdf_path": str(pdf_path),
                    "doc_id": layout["doc_id"],
                    "learning_enabled": self.context_store is not None,
                    "caso_id": self.caso.id if self.caso else None,
                },
                patterns_learned=patterns_learned,
                processing_time_ms=int(processing_time),
                warnings=warnings,
                layout=layout,
            )

        except Exception as e:
            logger.error(f"Pipeline failed: {e}", exc_info=True)
            processing_time = (datetime.now() - start_time).total_seconds() * 1000

            return PipelineResult(
                text="",
                total_pages=0,
                success=False,
                metadata={"error": str(e)},
                processing_time_ms=int(processing_time),
                warnings=[f"Pipeline failure: {e}"],
            )

    def _process_page(
        self,
        pdf_path: Path,
        page_data: dict,
        layout: dict,
    ) -> dict:
        """
        Process a single page.

        Args:
            pdf_path: Path to PDF
            page_data: Page data from layout analysis
            layout: Full layout dict (for page dimensions)

        Returns:
            Dict with:
            - text: Extracted text
            - observation: ObservationResult (if learning enabled)
        """
        page_num = page_data["page_num"]
        logger.debug(f"Processing page {page_num}")

        # Compute signature
        signature = self._compute_page_signature(page_data)

        # Query ContextStore for hints (if enabled)
        hint = None
        if self.context_store and self.caso:
            hint = self.context_store.find_similar_pattern(
                caso_id=self.caso.id,
                signature_vector=signature.features,
            )

            if hint:
                logger.debug(
                    f"Found hint for page {page_num}: "
                    f"similarity={hint.similarity:.3f}, "
                    f"engine={hint.suggested_engine.value if hint.suggested_engine else 'none'}"
                )

        # Select engine (considering hint)
        engine_name = self._select_engine_for_page(page_data, hint)

        # Extract text (simplified - would need actual per-page extraction)
        # NOTE: This is a simplified version. Real implementation would:
        # 1. Extract only this page (using safe_bbox)
        # 2. Use the selected engine
        # 3. Handle fallback if extraction fails
        text = self._extract_page_text(pdf_path, page_num, engine_name)

        # Create ObservationResult
        observation = self._create_observation(
            page_data, engine_name, text, signature
        )

        # Learn from result (if ContextStore enabled)
        if self.context_store and self.caso and observation:
            try:
                self.context_store.learn_from_page(
                    caso_id=self.caso.id,
                    signature=signature,
                    result=observation,
                    hint=hint,
                )
                logger.debug(f"Learned from page {page_num}")
            except Exception as e:
                logger.warning(f"Failed to learn from page {page_num}: {e}")

        return {
            "text": text,
            "observation": observation,
        }

    def _compute_page_signature(self, page_data: dict) -> SignatureVector:
        """
        Compute signature for a page.

        Args:
            page_data: Page data from layout analysis

        Returns:
            SignatureVector
        """
        # Use signature computation from context module
        return compute_signature_from_layout(page_data)

    def _select_engine_for_page(
        self,
        page_data: dict,
        hint: Optional[PatternHint] = None,
    ) -> str:
        """
        Select best engine for a page.

        Args:
            page_data: Page data from layout analysis
            hint: Pattern hint from ContextStore (optional)

        Returns:
            Engine name (e.g., 'pdfplumber', 'tesseract')
        """
        # If hint is strong and suggests an engine, use it
        if hint and hint.should_use and hint.suggested_engine:
            logger.debug(f"Using hint engine: {hint.suggested_engine.value}")
            return hint.suggested_engine.value

        # Otherwise, use recommended engine from layout analysis
        recommended = page_data.get("recommended_engine")
        if recommended:
            logger.debug(f"Using recommended engine: {recommended}")
            return recommended

        # Fallback: Use complexity mapping
        complexity = page_data.get("complexity", PageComplexity.NATIVE_CLEAN)
        engine = COMPLEXITY_ENGINE_MAP.get(complexity, "pdfplumber")
        logger.debug(f"Using fallback engine: {engine}")
        return engine

    def _extract_page_text(
        self,
        pdf_path: Path,
        page_num: int,
        engine_name: str,
    ) -> str:
        """
        Extract text from a single page.

        NOTE: This is a simplified placeholder implementation.
        Real implementation would:
        1. Use the selected engine to extract only this page
        2. Apply safe_bbox cropping
        3. Handle fallback if extraction fails

        Args:
            pdf_path: Path to PDF
            page_num: Page number (1-indexed)
            engine_name: Engine to use

        Returns:
            Extracted text for this page
        """
        # PLACEHOLDER: For now, use engine selector's extract_with_fallback
        # In real implementation, this would extract just one page
        try:
            # This extracts ALL pages - real implementation would extract just one
            result = self.engine_selector.extract_with_fallback(
                pdf_path=pdf_path,
                force_engine=engine_name,
            )
            # For now, return full text (real impl would split by page)
            return result.text
        except Exception as e:
            logger.error(f"Extraction failed for page {page_num}: {e}")
            return ""

    def _create_observation(
        self,
        page_data: dict,
        engine_name: str,
        text: str,
        signature: SignatureVector,
    ) -> Optional[ObservationResult]:
        """
        Create ObservationResult from extraction.

        Args:
            page_data: Page data from layout
            engine_name: Engine used
            text: Extracted text
            signature: Page signature

        Returns:
            ObservationResult or None if creation fails
        """
        try:
            # Map engine name to EngineType
            engine_type = self._engine_name_to_type(engine_name)

            # Infer pattern type
            page_input = PageSignatureInput.from_layout_page(page_data)
            pattern_type, _ = infer_pattern_type(page_input)

            # Estimate confidence based on text quality
            confidence = self._estimate_confidence(text, page_data)

            return ObservationResult(
                page_num=page_data["page_num"],
                engine_used=engine_type,
                confidence=confidence,
                text_length=len(text),
                bbox=page_data.get("safe_bbox"),
                pattern_type=pattern_type,
                success=len(text) > 0,
            )
        except Exception as e:
            logger.warning(f"Failed to create observation: {e}")
            return None

    def _engine_name_to_type(self, engine_name: str) -> EngineType:
        """Map engine name string to EngineType enum."""
        mapping = {
            "pdfplumber": EngineType.PDFPLUMBER,
            "tesseract": EngineType.TESSERACT,
            "marker": EngineType.MARKER,
        }
        return mapping.get(engine_name.lower(), EngineType.PDFPLUMBER)

    def _estimate_confidence(self, text: str, page_data: dict) -> float:
        """
        Estimate extraction confidence based on text quality.

        Args:
            text: Extracted text
            page_data: Page data from layout

        Returns:
            Confidence score (0.0-1.0)
        """
        if not text:
            return 0.0

        # Base confidence on text length vs expected
        char_count = page_data.get("char_count", 0)
        if char_count == 0:
            # Raster page - OCR confidence
            # Heuristic: assume good OCR if got reasonable text
            return 0.7 if len(text) > 100 else 0.5
        else:
            # Native page - compare extraction vs expected
            ratio = len(text) / max(char_count, 1)
            # Expect extracted text to be similar to char count
            # (some variation due to whitespace/formatting)
            if 0.8 <= ratio <= 1.5:
                return 0.95
            elif 0.5 <= ratio <= 2.0:
                return 0.8
            else:
                return 0.6

    def _combine_page_texts(self, page_texts: list[str]) -> str:
        """
        Combine page texts into single document.

        Args:
            page_texts: List of text strings (one per page)

        Returns:
            Combined text
        """
        # Simple newline-based combination
        # Real implementation might add page breaks, headers, etc.
        return "\n\n".join(filter(None, page_texts))

    def _clean_text(self, text: str) -> str:
        """
        Clean extracted text.

        Args:
            text: Raw extracted text

        Returns:
            Cleaned text
        """
        # Simple cleanup
        # Real implementation would:
        # - Remove duplicate spaces
        # - Fix encoding issues
        # - Remove artifacts
        # - Normalize line breaks

        lines = text.split("\n")
        # Remove empty lines at start/end
        while lines and not lines[0].strip():
            lines.pop(0)
        while lines and not lines[-1].strip():
            lines.pop()

        return "\n".join(lines)
