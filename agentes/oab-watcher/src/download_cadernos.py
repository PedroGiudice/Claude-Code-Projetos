"""
Download Cadernos - Download massivo de cadernos de tribunais
"""
import json
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from tqdm import tqdm
from .api_client import DJENClient
from .models import CadernoTribunal

logger = logging.getLogger(__name__)


class DownloadCadernos:
    """Gerenciador de downloads massivos de cadernos"""

    def __init__(self, config: Dict):
        self.client = DJENClient(config)
        self.data_root = Path(config['paths']['data_root'])
        self.output_dir = self.data_root / config['paths']['downloads_cadernos']
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.checkpoint_file = self.data_root / "checkpoint_cadernos.json"

    def baixar_periodo(
        self,
        tribunal: str,
        data_inicial: str,
        data_final: str,
        tipos_meio: Optional[List[str]] = None
    ) -> Dict:
        """
        Download de cadernos para período específico

        Args:
            tribunal: Sigla (ex: "TJSP")
            data_inicial: YYYY-MM-DD
            data_final: YYYY-MM-DD
            tipos_meio: Lista de meios (ex: ["1", "2"]) ou None para todos

        Returns:
            Dict com estatísticas:
            {
                "tribunal": str,
                "periodo": "YYYY-MM-DD a YYYY-MM-DD",
                "total_cadernos": int,
                "sucesso": int,
                "falhas": int,
                "duplicatas": int,
                "tempo_execucao": str,
                "arquivos": [lista paths]
            }
        """
        inicio = datetime.fromisoformat(data_inicial)
        fim = datetime.fromisoformat(data_final)

        logger.info(f"Iniciando download: {tribunal} ({data_inicial} a {data_final})")

        stats = {
            "tribunal": tribunal,
            "periodo": f"{data_inicial} a {data_final}",
            "total_cadernos": 0,
            "sucesso": 0,
            "falhas": 0,
            "duplicatas": 0,
            "arquivos": []
        }

        # Iterar por cada dia
        data_atual = inicio
        tempo_inicio = datetime.now()

        total_dias = (fim - inicio).days + 1

        with tqdm(total=total_dias, desc=f"{tribunal}") as pbar:
            while data_atual <= fim:
                data_str = data_atual.strftime('%Y-%m-%d')

                # Buscar cadernos do dia
                params = {
                    'siglaTribunal': tribunal.upper(),
                    'data': data_str
                }

                if tipos_meio:
                    params['meio'] = ','.join(tipos_meio)

                try:
                    response = self.client.get('/api/v1/cadernos', params)
                    cadernos = response.get('items', [])

                    stats['total_cadernos'] += len(cadernos)

                    # Baixar cada caderno
                    for caderno_data in cadernos:
                        resultado = self._baixar_caderno(caderno_data)

                        if resultado['status'] == 'sucesso':
                            stats['sucesso'] += 1
                            stats['arquivos'].append(resultado['arquivo'])
                        elif resultado['status'] == 'duplicata':
                            stats['duplicatas'] += 1
                        else:
                            stats['falhas'] += 1

                except Exception as e:
                    logger.error(f"Erro ao processar {data_str}: {e}")
                    stats['falhas'] += 1

                data_atual += timedelta(days=1)
                pbar.update(1)

        tempo_fim = datetime.now()
        stats['tempo_execucao'] = str(tempo_fim - tempo_inicio)

        logger.info(f"Download concluído: {stats['sucesso']} sucessos, {stats['falhas']} falhas, {stats['duplicatas']} duplicatas")

        # Salvar relatório
        self._salvar_relatorio(stats)

        return stats

    def _baixar_caderno(self, caderno_data: Dict) -> Dict:
        """
        Baixa um caderno individual

        Args:
            caderno_data: Dict com dados do caderno (schema CadernoTribunal)

        Returns:
            Dict com status:
            {
                "status": "sucesso" | "duplicata" | "falha",
                "arquivo": str (caminho do arquivo, se sucesso)
            }
        """
        try:
            # Extrair campos necessários
            sigla = caderno_data.get('sigla_tribunal', caderno_data.get('siglaTribunal', 'UNKNOWN'))
            data = caderno_data.get('data', 'unknown-date')
            hash_caderno = caderno_data.get('hash', 'unknown-hash')
            url = caderno_data.get('url', '')

            if not url:
                logger.warning(f"Caderno sem URL: {caderno_data}")
                return {"status": "falha", "arquivo": None}

            # Nome do arquivo baseado em hash
            filename = f"{sigla}_{data}_{hash_caderno}.pdf"
            tribunal_dir = self.output_dir / sigla
            output_path = tribunal_dir / filename

            # Verificar duplicata
            if output_path.exists():
                logger.debug(f"Duplicata: {filename}")
                return {"status": "duplicata", "arquivo": str(output_path)}

            # Baixar
            if self.client.download_file(url, output_path):
                return {"status": "sucesso", "arquivo": str(output_path)}
            else:
                return {"status": "falha", "arquivo": None}

        except Exception as e:
            logger.error(f"Erro ao baixar caderno: {e}", exc_info=True)
            return {"status": "falha", "arquivo": None}

    def _salvar_relatorio(self, stats: Dict):
        """
        Salva relatório do download em arquivo JSON

        Args:
            stats: Dict com estatísticas do download
        """
        try:
            relatorios_dir = self.data_root / "outputs" / "relatorios"
            relatorios_dir.mkdir(parents=True, exist_ok=True)

            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"download_{stats['tribunal']}_{timestamp}.json"
            output_file = relatorios_dir / filename

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(stats, f, ensure_ascii=False, indent=2)

            logger.info(f"Relatório salvo em: {output_file}")

        except Exception as e:
            logger.error(f"Erro ao salvar relatório: {e}")

    def listar_cadernos_disponiveis(
        self,
        tribunal: str,
        data: str
    ) -> List[Dict]:
        """
        Lista cadernos disponíveis para um tribunal em uma data específica

        Args:
            tribunal: Sigla do tribunal (ex: "TJSP")
            data: Data no formato YYYY-MM-DD

        Returns:
            Lista de dicts com informações dos cadernos disponíveis
        """
        params = {
            'siglaTribunal': tribunal.upper(),
            'data': data
        }

        try:
            response = self.client.get('/api/v1/cadernos', params)
            cadernos = response.get('items', [])

            logger.info(f"Encontrados {len(cadernos)} cadernos para {tribunal} em {data}")

            return cadernos

        except Exception as e:
            logger.error(f"Erro ao listar cadernos: {e}")
            return []
