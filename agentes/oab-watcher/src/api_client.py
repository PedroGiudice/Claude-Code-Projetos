"""
API Client - Cliente HTTP para comunicação com DJEN
"""
import requests
import logging
import json
from pathlib import Path
from typing import Dict, Optional
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class DJENClient:
    """Cliente HTTP para API DJEN com retry e logging"""

    def __init__(self, config: Dict):
        self.base_url = config['api']['base_url']
        self.timeout = config['api']['timeout']
        self.max_retries = config['api']['max_retries']
        self.session = requests.Session()
        self.session.headers.update({
            'Accept': 'application/json',
            'User-Agent': 'OAB-Watcher/1.0'
        })

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10)
    )
    def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict:
        """
        GET request com retry automático

        Args:
            endpoint: Caminho da API (ex: '/api/v1/comunicacao')
            params: Query parameters

        Returns:
            Dict com response JSON

        Raises:
            requests.RequestException em caso de falha
        """
        url = f"{self.base_url}{endpoint}"

        logger.info(f"GET {url}")
        logger.debug(f"Params: {params}")

        try:
            response = self.session.get(
                url,
                params=params,
                timeout=self.timeout
            )
            response.raise_for_status()

            data = response.json()
            logger.info(f"Response: {response.status_code} - {len(data.get('items', []))} items")

            return data

        except requests.RequestException as e:
            logger.error(f"Erro na requisição: {e}")
            raise

    def download_file(self, url: str, output_path: Path) -> bool:
        """
        Download de arquivo (PDF do caderno)

        Args:
            url: URL completa do arquivo
            output_path: Caminho onde salvar

        Returns:
            True se sucesso, False se falha
        """
        logger.info(f"Baixando: {url}")

        try:
            response = self.session.get(url, timeout=self.timeout, stream=True)
            response.raise_for_status()

            output_path.parent.mkdir(parents=True, exist_ok=True)

            with open(output_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            logger.info(f"Salvo em: {output_path}")
            return True

        except requests.RequestException as e:
            logger.error(f"Erro no download: {e}")
            return False
