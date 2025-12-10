"""Módulo de integração com Gemini."""

from .client import GeminiClient, GeminiConfig, GeminiResponse
from .schemas import (
    PecaType,
    SectionClassification,
    ClassificationResult,
    CleanedSection,
    CleaningResult,
)

__all__ = [
    "GeminiClient",
    "GeminiConfig",
    "GeminiResponse",
    "PecaType",
    "SectionClassification",
    "ClassificationResult",
    "CleanedSection",
    "CleaningResult",
]
