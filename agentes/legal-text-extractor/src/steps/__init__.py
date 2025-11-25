"""
Pipeline de extração em 3 estágios.

Estágio 1: step_01_layout.py (Cartógrafo) - Análise de layout e zoning
Estágio 2: step_02_vision.py (Saneador) - Processamento de imagem
Estágio 3: step_03_extract.py (Extrator) - Extração de texto
"""

from .step_01_layout import LayoutAnalyzer
from .step_02_vision import VisionProcessor
from .step_03_extract import TextExtractor

__all__ = ["LayoutAnalyzer", "VisionProcessor", "TextExtractor"]
