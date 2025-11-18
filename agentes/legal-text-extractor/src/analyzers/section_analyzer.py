"""Análise de seções usando Claude"""
import os
from anthropic import Anthropic
from dataclasses import dataclass


@dataclass
class Section:
    """Seção identificada"""
    type: str  # "petição inicial", "contestação", etc
    content: str
    start_pos: int
    end_pos: int
    confidence: float  # 0-1


class SectionAnalyzer:
    """Analisa e separa seções de documentos jurídicos usando Claude"""

    def __init__(self):
        self.client = Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

    def analyze(self, text: str) -> list[Section]:
        """
        Analisa texto e identifica seções de peças processuais.

        Args:
            text: Texto limpo do documento

        Returns:
            Lista de Section identificadas
        """
        # IMPORTANTE: Implementar lógica de separação usando Claude
        # Usar prompt específico para identificar delimitadores de seções
        # Retornar lista de Section com type, content, posições

        # Por enquanto, retorna texto inteiro como seção única
        return [
            Section(
                type="documento_completo",
                content=text,
                start_pos=0,
                end_pos=len(text),
                confidence=1.0
            )
        ]

    def _call_claude(self, text: str) -> str:
        """
        Chama Claude para análise.

        Prompt deve pedir para:
        1. Identificar tipos de peças (petição, contestação, sentença, etc)
        2. Encontrar delimitadores entre seções
        3. Retornar JSON estruturado com posições
        """
        # TODO: Implementar na Fase 2
        pass
