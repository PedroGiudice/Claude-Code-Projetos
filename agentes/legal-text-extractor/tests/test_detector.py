"""Testes para detector de sistema judicial"""
import pytest
from src.core.detector import SystemDetector


class TestSystemDetector:
    """Test suite para detecção de sistemas judiciais"""

    @pytest.fixture
    def detector(self):
        """Cria instância do detector"""
        return SystemDetector()

    def test_detect_pje(self, detector):
        """Testa detecção de PJE"""
        text = "Processo Judicial Eletrônico - PJE"
        system = detector.detect(text)
        assert system == "pje"

    def test_detect_esaj(self, detector):
        """Testa detecção de ESAJ"""
        text = "e-SAJ - Sistema de Automação da Justiça"
        system = detector.detect(text)
        assert system == "esaj"

    def test_detect_generic(self, detector):
        """Testa fallback para genérico"""
        text = "Documento judicial sem identificação clara"
        system = detector.detect(text)
        assert system == "generic"
