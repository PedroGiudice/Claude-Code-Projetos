#!/usr/bin/env python3
"""
Testes de Validação para Rate Limiting Adaptativo (P1)

OBJETIVO: Validar que a implementação EXISTENTE segue as especificações.

Implementação atual (downloader.py):
- Rate limit: 280 req/min (configurável)
- Janela deslizante: 15 req/5s
- Retry para HTTP 429 com backoff
- Adaptive rate limit: True por padrão

Status: IMPLEMENTADO ✅
Testes: VALIDAÇÃO (não TDD RED→GREEN)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

import pytest
import time
from unittest.mock import Mock, patch, MagicMock
from downloader import DJENDownloader


class TestRateLimitingAdaptativoValidacao:
    """Validação do rate limiting adaptativo já implementado."""

    def test_init_aceita_parametros_rate_limit(self):
        """
        VALIDAÇÃO: DJENDownloader aceita parâmetros de rate limit.

        Implementação atual (downloader.py L61-67):
        - requests_per_minute: int = 280
        - adaptive_rate_limit: bool = True
        - max_retries: int = 3
        """
        downloader = DJENDownloader(
            data_root=Path('/tmp/test_rate_limit'),
            requests_per_minute=180,
            adaptive_rate_limit=True,
            max_retries=3
        )

        assert downloader.adaptive_rate_limit is True
        assert downloader.max_retries == 3
        # request_window_size e request_window_duration são hardcoded
        assert downloader.request_window_size == 15
        assert downloader.request_window_duration == 5.0

    def test_check_rate_limit_existe_e_callable(self):
        """
        VALIDAÇÃO: Método _check_rate_limit() existe.

        Implementação atual (downloader.py L164-196).
        """
        downloader = DJENDownloader(
            data_root=Path('/tmp/test_rate_limit'),
            adaptive_rate_limit=True
        )

        assert hasattr(downloader, '_check_rate_limit')
        assert callable(downloader._check_rate_limit)

    def test_adaptive_rate_limit_usa_janela_deslizante(self):
        """
        VALIDAÇÃO: Janela deslizante funciona (15 req/5s).

        Implementação atual (downloader.py L164-196):
        - Incrementa request_count
        - Pausa quando atinge request_window_size
        - Reseta janela após request_window_duration
        """
        downloader = DJENDownloader(
            data_root=Path('/tmp/test_rate_limit'),
            adaptive_rate_limit=True
        )

        # Estado inicial
        assert downloader.request_count == 0
        assert downloader.request_window_size == 15
        assert downloader.request_window_duration == 5.0

        # Simular 14 requisições (abaixo do limite)
        for i in range(14):
            downloader._check_rate_limit()

        assert downloader.request_count == 14  # Não deve ter resetado

        # 15ª requisição deve resetar janela (sem pausar se for primeira janela)
        start = time.time()
        downloader._check_rate_limit()
        elapsed = time.time() - start

        # Se foi primeira janela completa, não deveria pausar
        assert elapsed < 1.0, f"Primeira janela não deveria pausar, mas levou {elapsed:.2f}s"

    def test_adaptive_rate_limit_pausa_quando_excede_janela(self):
        """
        VALIDAÇÃO: Pausa quando janela está cheia e não expirou.

        Implementação atual (downloader.py L180-197):
        - Verifica se request_count >= request_window_size ANTES de incrementar
        - Se limite atingido: pausa, reseta janela, incrementa contador
        - 16ª requisição é que pausa (pois 15ª preenche janela)
        """
        downloader = DJENDownloader(
            data_root=Path('/tmp/test_rate_limit'),
            adaptive_rate_limit=True
        )

        # Preencher janela completa (15 requisições imediatas)
        for i in range(15):
            downloader._check_rate_limit()

        # Estado após 15 req: count=15, janela cheia
        assert downloader.request_count == 15, (
            f"Após 15 req, count deveria ser 15, mas é {downloader.request_count}"
        )

        # 16ª requisição deve PAUSAR (janela cheia)
        start = time.time()
        downloader._check_rate_limit()
        elapsed = time.time() - start

        # Deve ter pausado ~5s (window_duration)
        assert elapsed >= 4.5, (
            f"16ª req deveria pausar ~5s (janela cheia), "
            f"mas pausou apenas {elapsed:.1f}s"
        )

        # Após pausa, janela resetou e incrementou: count=1
        assert downloader.request_count == 1, (
            f"Após pausa+reset, count deveria ser 1, mas é {downloader.request_count}"
        )


class TestFazerRequisicaoComRetry:
    """Validação do retry com exponential backoff."""

    @patch('requests.Session.get')
    def test_fazer_requisicao_com_http_429_faz_retry(self, mock_get):
        """
        VALIDAÇÃO: Retry após HTTP 429.

        Implementação atual (downloader.py L234-253):
        - Se status_code == 429
        - Aguarda retry_after (header Retry-After)
        - Reseta janela de rate limit
        - Faz retry até max_retries
        """
        # Mock primeira resposta = 429, segunda = 200
        mock_response_429 = MagicMock()
        mock_response_429.status_code = 429
        mock_response_429.headers = {'Retry-After': '1'}

        mock_response_200 = MagicMock()
        mock_response_200.status_code = 200
        mock_response_200.json.return_value = {'content': []}

        mock_get.side_effect = [mock_response_429, mock_response_200]

        downloader = DJENDownloader(
            data_root=Path('/tmp/test_retry'),
            adaptive_rate_limit=True
        )

        # Fazer requisição (deve fazer retry após 429)
        start = time.time()
        response = downloader._fazer_requisicao('http://test.com')
        elapsed = time.time() - start

        # Verificações
        assert response.status_code == 200
        assert mock_get.call_count == 2  # 429 + retry
        assert elapsed >= 1.0, f"Deveria aguardar 1s (Retry-After), mas levou {elapsed:.2f}s"

        # Janela deve ter sido resetada após 429 E incrementada na tentativa bem-sucedida
        # (cada tentativa chama _check_rate_limit, que incrementa request_count)
        assert downloader.request_count == 1, (
            f"Após retry bem-sucedido, request_count deveria ser 1, "
            f"mas é {downloader.request_count}"
        )

    @patch('requests.Session.get')
    def test_fazer_requisicao_com_timeout_faz_exponential_backoff(self, mock_get):
        """
        VALIDAÇÃO: Exponential backoff para timeouts.

        Implementação atual (downloader.py L259-268):
        - Timeout → retry com backoff 2^tentativa (2s, 4s, 8s)
        """
        import requests

        # Mock: 2 timeouts, depois sucesso
        mock_get.side_effect = [
            requests.Timeout(),
            requests.Timeout(),
            MagicMock(status_code=200, json=lambda: {'content': []})
        ]

        downloader = DJENDownloader(
            data_root=Path('/tmp/test_backoff'),
            adaptive_rate_limit=True,
            max_retries=3
        )

        start = time.time()
        response = downloader._fazer_requisicao('http://test.com')
        elapsed = time.time() - start

        # Backoff esperado: 2s (tentativa 1) + 4s (tentativa 2) = 6s
        assert elapsed >= 5.5, f"Backoff deveria ser ~6s, mas foi {elapsed:.1f}s"
        assert response.status_code == 200
        assert mock_get.call_count == 3  # 2 timeouts + sucesso

    @patch('requests.Session.get')
    def test_fazer_requisicao_falha_apos_max_retries(self, mock_get):
        """
        VALIDAÇÃO: Lança exceção após max_retries.

        Implementação atual (downloader.py L250-253):
        - Se todas as tentativas falharem, lança Exception
        """
        # Mock: sempre retorna 429
        mock_response_429 = MagicMock()
        mock_response_429.status_code = 429
        mock_response_429.headers = {'Retry-After': '0.1'}
        mock_get.return_value = mock_response_429

        downloader = DJENDownloader(
            data_root=Path('/tmp/test_max_retries'),
            adaptive_rate_limit=True,
            max_retries=3
        )

        # Deve lançar exceção após 3 tentativas
        with pytest.raises(Exception, match="Rate limit exceeded"):
            downloader._fazer_requisicao('http://test.com')

        # Verificar que tentou 3 vezes
        assert mock_get.call_count == 3


class TestRateLimiterBackwardCompatibility:
    """Validação de compatibilidade com RateLimiter antigo."""

    def test_rate_limiter_antigo_existe_para_compatibilidade(self):
        """
        VALIDAÇÃO: RateLimiter de djen-tracker ainda existe.

        Implementação atual (downloader.py L98-103):
        - RateLimiter é mantido para compatibilidade
        - Não é usado quando adaptive_rate_limit=True
        """
        downloader = DJENDownloader(
            data_root=Path('/tmp/test_compat'),
            adaptive_rate_limit=True
        )

        assert hasattr(downloader, 'rate_limiter')
        assert downloader.rate_limiter is not None

    def test_rate_limiter_antigo_usado_quando_adaptive_false(self):
        """
        VALIDAÇÃO: RateLimiter antigo é usado se adaptive_rate_limit=False.

        Implementação atual (downloader.py L173-176):
        - Se not adaptive_rate_limit, usa self.rate_limiter.wait()
        """
        downloader = DJENDownloader(
            data_root=Path('/tmp/test_legacy'),
            adaptive_rate_limit=False,
            requests_per_minute=60
        )

        # Verificar que rate_limiter é usado
        with patch.object(downloader.rate_limiter, 'wait') as mock_wait:
            downloader._check_rate_limit()
            mock_wait.assert_called_once()


class TestPerformanceMetrics:
    """Testes de métricas de performance do rate limiting."""

    def test_rate_limit_permite_180_req_por_minuto(self):
        """
        VALIDAÇÃO: Taxa real é ~180 req/min (15 req/5s).

        Implementação atual:
        - 15 req/5s = 180 req/min
        - Com overhead, deve atingir pelo menos 150 req/min

        NOTA: Este teste valida apenas que pausa ocorre após 15 req.
        Taxa real pode ser maior em testes (sem latência de rede).
        """
        downloader = DJENDownloader(
            data_root=Path('/tmp/test_perf'),
            adaptive_rate_limit=True
        )

        # Simular 30 requisições (2 janelas completas)
        start = time.time()

        for i in range(30):
            downloader._check_rate_limit()

        elapsed = time.time() - start

        # Deve ter pausado pelo menos uma vez (15ª requisição)
        # 15 req imediatas + pausa ~5s + 15 req imediatas = ~5s total
        assert elapsed >= 4.5, (
            f"Deveria ter pausado ~5s (1 janela), mas levou {elapsed:.1f}s"
        )

        # Não deve pausar mais que 2 janelas (30 req = 2 janelas)
        assert elapsed <= 11, (
            f"Pausou muito: {elapsed:.1f}s para 30 req (esperado ~5-10s)"
        )


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
