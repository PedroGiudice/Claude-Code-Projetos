"""
Utils - Funções auxiliares
"""
import logging
from pathlib import Path
from typing import Dict


def configurar_logging(config: Dict):
    """
    Configura sistema de logging

    Args:
        config: Dicionário de configuração com paths.data_root e paths.logs
    """
    data_root = Path(config['paths']['data_root'])
    log_dir = data_root / config['paths']['logs']
    log_dir.mkdir(parents=True, exist_ok=True)

    # Formato
    formato = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )

    # Handler para arquivo de execuções gerais
    file_handler = logging.FileHandler(
        log_dir / 'execucoes.log',
        encoding='utf-8'
    )
    file_handler.setFormatter(formato)
    file_handler.setLevel(logging.DEBUG)

    # Handler para arquivo de erros
    error_handler = logging.FileHandler(
        log_dir / 'errors.log',
        encoding='utf-8'
    )
    error_handler.setFormatter(formato)
    error_handler.setLevel(logging.ERROR)

    # Handler para arquivo de chamadas API
    api_handler = logging.FileHandler(
        log_dir / 'api_calls.log',
        encoding='utf-8'
    )
    api_handler.setFormatter(formato)
    api_handler.setLevel(logging.DEBUG)

    # Handler para console
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(formato)
    console_handler.setLevel(logging.INFO)

    # Configurar root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(file_handler)
    root_logger.addHandler(error_handler)
    root_logger.addHandler(console_handler)

    # Logger específico para API (também vai para api_calls.log)
    api_logger = logging.getLogger('src.api_client')
    api_logger.addHandler(api_handler)

    logging.info("Sistema de logging configurado")
    logging.debug(f"Logs salvos em: {log_dir}")


def formatar_oab(numero: str, uf: str) -> str:
    """
    Formata número de OAB no padrão "OAB 123456/SP"

    Args:
        numero: Número da OAB (ex: "129021")
        uf: UF da OAB (ex: "SP")

    Returns:
        String formatada (ex: "OAB 129021/SP")
    """
    return f"OAB {numero}/{uf.upper()}"
