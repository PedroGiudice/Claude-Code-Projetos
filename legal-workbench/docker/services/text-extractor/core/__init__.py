"""
Core module for document cleaning.

Provides DocumentCleaner for removing signatures, headers/footers,
and noise from Brazilian legal documents.
"""

from .cleaner import DocumentCleaner, CleaningResult, CleaningStats

__all__ = ["DocumentCleaner", "CleaningResult", "CleaningStats"]
