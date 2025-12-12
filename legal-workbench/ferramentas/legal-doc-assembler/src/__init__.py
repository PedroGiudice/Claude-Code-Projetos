"""
legal-doc-assembler: Core engine for generating legal documents from JSON data.

A deterministic Python library for rendering Brazilian legal documents using
docxtpl (Jinja2 for MS Word) with fault-tolerant template processing.

Exports:
- DocumentEngine: Core rendering engine
- BatchProcessor: Parallel batch processing
- DocxParser: DOCX content extraction
- PatternDetector: Automatic pattern detection
- TemplateBuilder: Create templates from plain DOCX
- TemplateManager: Manage saved templates
- Normalizers: Brazilian legal document normalization
"""

__version__ = "2.0.0"
__author__ = "Claude Code Projetos"

from .normalizers import (
    normalize_whitespace,
    normalize_name,
    normalize_address,
    format_cpf,
    format_cnpj,
    format_cep,
    format_oab,
    normalize_punctuation,
    normalize_all,
)

from .engine import DocumentEngine
from .batch_engine import BatchProcessor
from .docx_parser import DocxParser
from .pattern_detector import PatternDetector
from .template_builder import TemplateBuilder
from .template_manager import TemplateManager

__all__ = [
    "DocumentEngine",
    "BatchProcessor",
    "DocxParser",
    "PatternDetector",
    "TemplateBuilder",
    "TemplateManager",
    "normalize_whitespace",
    "normalize_name",
    "normalize_address",
    "format_cpf",
    "format_cnpj",
    "format_cep",
    "format_oab",
    "normalize_punctuation",
    "normalize_all",
]
