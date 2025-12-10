"""
Engines module for text processing.

This module provides:
- Base classes for extraction engines
- PDFPlumber: For PDFs with native text (fast, lightweight)
- Marker: For scanned PDFs (high-quality OCR, ~10GB RAM)
- Cleaning engine for judicial system artifacts
"""

from .base import ExtractionEngine, ExtractionResult
from .cleaning_engine import CleanerEngine, DetectionResult, get_cleaner
from .pdfplumber_engine import PDFPlumberEngine
from .marker_engine import MarkerEngine

__all__ = [
    # Base interfaces
    "ExtractionEngine",
    "ExtractionResult",

    # Extraction engines
    "PDFPlumberEngine",
    "MarkerEngine",

    # Cleaning
    "CleanerEngine",
    "DetectionResult",
    "get_cleaner",
]
