"""
Busca OAB - Consulta publicações por número de OAB
"""
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, List
from .api_client import DJENClient
from .models import RespostaBuscaOAB
from .utils import formatar_oab

logger = logging.getLogger(__name__)


class BuscaOAB:
    """Gerenciador de buscas por número OAB"""

    def __init__(self, config: Dict):
        self.client = DJENClient(config)
        self.data_root = Path(config['paths']['data_root'])
        self.output_dir = self.data_root / config['paths']['downloads_busca']
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def buscar(
        self,
        numero_oab: str,
        uf_oab: str,
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None,
        tribunal: Optional[str] = None
    ) -> Dict:
        """
        Busca publicações por número de OAB

        Args:
            numero_oab: Número da OAB (ex: "129021")
            uf_oab: UF da OAB (ex: "SP")
            data_inicio: Data início (formato: YYYY-MM-DD)
            data_fim: Data fim (formato: YYYY-MM-DD)
            tribunal: Sigla tribunal (opcional, ex: "TJSP")

        Returns:
            Dict com resultado processado:
            {
                "oab": "OAB 129021/SP",
                "data_busca": "2025-11-07T14:30:00",
                "total_publicacoes": int,
                "tribunais": [lista],
                "arquivo_json": "path/to/file.json",
                "items": [lista de ComunicacaoOAB]
            }
        """
        # Validar inputs
        if not numero_oab or not uf_oab:
            raise ValueError("numero_oab e uf_oab são obrigatórios")

        # Formatar OAB no padrão correto
        oab_formatada = formatar_oab(numero_oab, uf_oab)

        # Montar params da API
        params = {
            'numero_oab': numero_oab,
            'uf_oab': uf_oab.upper()
        }

        if data_inicio:
            params['data_inicio'] = data_inicio
        if data_fim:
            params['data_fim'] = data_fim
        if tribunal:
            params['siglaTribunal'] = tribunal.upper()

        logger.info(f"Buscando {oab_formatada}")
        if data_inicio and data_fim:
            logger.info(f"Período: {data_inicio} a {data_fim}")
        if tribunal:
            logger.info(f"Tribunal: {tribunal}")

        # Chamar API
        try:
            response_data = self.client.get('/api/v1/comunicacao', params)

            # Verificar se response é válida
            if not isinstance(response_data, dict):
                raise ValueError(f"Response inválida: esperado dict, recebido {type(response_data)}")

            # Extrair campos
            status = response_data.get('status', 'unknown')
            message = response_data.get('message', '')
            count = response_data.get('count', 0)
            items = response_data.get('items', [])

            # Processar resultado
            tribunais = list(set(item.get('siglaTribunal', 'N/A') for item in items))

            resultado = {
                "oab": oab_formatada,
                "numero_oab": numero_oab,
                "uf_oab": uf_oab.upper(),
                "data_busca": datetime.now().isoformat(),
                "total_publicacoes": count,
                "tribunais": sorted(tribunais),
                "status": status,
                "message": message,
                "items": items
            }

            # Salvar JSON
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"oab_{uf_oab}_{numero_oab}_{timestamp}.json"
            output_file = self.output_dir / filename

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(resultado, f, ensure_ascii=False, indent=2)

            resultado['arquivo_json'] = str(output_file)

            logger.info(f"Busca concluída: {count} publicações encontradas")
            logger.info(f"Tribunais: {', '.join(tribunais)}")
            logger.info(f"Salvo em: {output_file}")

            return resultado

        except Exception as e:
            logger.error(f"Erro na busca: {e}", exc_info=True)
            raise

    def buscar_multiplas_oabs(
        self,
        oabs: List[tuple],
        data_inicio: Optional[str] = None,
        data_fim: Optional[str] = None
    ) -> List[Dict]:
        """
        Busca publicações para múltiplas OABs

        Args:
            oabs: Lista de tuplas (numero, uf). Ex: [("129021", "SP"), ("234567", "RJ")]
            data_inicio: Data início (formato: YYYY-MM-DD)
            data_fim: Data fim (formato: YYYY-MM-DD)

        Returns:
            Lista de resultados (um Dict por OAB)
        """
        resultados = []

        logger.info(f"Iniciando busca para {len(oabs)} OABs")

        for numero, uf in oabs:
            try:
                resultado = self.buscar(
                    numero_oab=numero,
                    uf_oab=uf,
                    data_inicio=data_inicio,
                    data_fim=data_fim
                )
                resultados.append(resultado)

            except Exception as e:
                logger.error(f"Erro ao buscar {formatar_oab(numero, uf)}: {e}")
                # Continua com próximas OABs mesmo se uma falhar
                continue

        logger.info(f"Busca múltipla concluída: {len(resultados)}/{len(oabs)} sucessos")

        return resultados
