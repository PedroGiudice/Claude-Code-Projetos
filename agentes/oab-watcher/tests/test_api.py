"""
Testes básicos da API DJEN
"""
import pytest
from pathlib import Path
import sys

# Adicionar src ao path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.utils import formatar_oab


def test_formatar_oab():
    """Testa formatação de número de OAB"""
    assert formatar_oab("129021", "SP") == "OAB 129021/SP"
    assert formatar_oab("123456", "rj") == "OAB 123456/RJ"
    assert formatar_oab("1", "MG") == "OAB 1/MG"


def test_formatar_oab_case_insensitive():
    """Testa que UF é sempre convertida para uppercase"""
    assert formatar_oab("129021", "sp") == "OAB 129021/SP"
    assert formatar_oab("129021", "Sp") == "OAB 129021/SP"
    assert formatar_oab("129021", "sP") == "OAB 129021/SP"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
