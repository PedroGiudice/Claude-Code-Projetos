#!/usr/bin/env python3
"""
Teste do filtro de tipo de publicação - Dry Run

Baixa publicações do STJ de um dia específico e testa o filtro.
NÃO persiste no banco (apenas simula).
"""

import sys
from pathlib import Path
from datetime import datetime, timedelta
import logging

# Adicionar src/ ao path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

from downloader import DJENDownloader
from scheduler import processar_publicacoes, normalizar_tipo_publicacao
import sqlite3

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


def criar_banco_temporario() -> sqlite3.Connection:
    """Cria banco SQLite em memória para teste."""
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()

    # Criar tabela publicacoes
    cursor.execute("""
        CREATE TABLE publicacoes (
            id                  TEXT PRIMARY KEY,
            hash_conteudo       TEXT NOT NULL UNIQUE,
            numero_processo     TEXT,
            numero_processo_fmt TEXT,
            tribunal            TEXT NOT NULL,
            orgao_julgador      TEXT,
            tipo_publicacao     TEXT NOT NULL,
            classe_processual   TEXT,
            assuntos            TEXT,
            texto_html          TEXT NOT NULL,
            texto_limpo         TEXT NOT NULL,
            ementa              TEXT,
            data_publicacao     TEXT NOT NULL,
            data_julgamento     TEXT,
            relator             TEXT,
            fonte               TEXT NOT NULL
        )
    """)

    # Criar tabela downloads_historico
    cursor.execute("""
        CREATE TABLE downloads_historico (
            id                  INTEGER PRIMARY KEY AUTOINCREMENT,
            tribunal            TEXT NOT NULL,
            data_publicacao     TEXT NOT NULL,
            tipo_download       TEXT NOT NULL,
            timestamp           TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            total_publicacoes   INTEGER NOT NULL,
            total_novas         INTEGER NOT NULL,
            total_duplicadas    INTEGER NOT NULL,
            tempo_processamento REAL NOT NULL,
            status              TEXT NOT NULL,
            erro                TEXT
        )
    """)

    conn.commit()
    logger.info("✅ Banco temporário criado (memória)")
    return conn


def testar_normalizacao():
    """Testa função de normalização com casos de borda."""
    logger.info("\n" + "=" * 80)
    logger.info("TESTE 1: Normalização de tipos")
    logger.info("=" * 80)

    casos_teste = [
        ('Acórdão', 'acordao'),
        ('ACÓRDÃO', 'acordao'),
        ('acordão', 'acordao'),
        ('acordao', 'acordao'),
        ('  Acórdão  ', 'acordao'),
        ('Acórdão\n', 'acordao'),
        ('\tAcórdão\t', 'acordao'),
        ('Sentença', 'sentenca'),
        ('DECISÃO', 'decisao'),
        ('Intimação', 'intimacao'),
    ]

    sucesso = 0
    for entrada, esperado in casos_teste:
        resultado = normalizar_tipo_publicacao(entrada)
        status = "✅" if resultado == esperado else "❌"
        if resultado == esperado:
            sucesso += 1
        logger.info(f"{status} '{entrada!r}' → '{resultado}' (esperado: '{esperado}')")

    logger.info(f"\n📊 Resultado: {sucesso}/{len(casos_teste)} testes passaram")
    return sucesso == len(casos_teste)


def testar_filtro_dry_run():
    """Testa filtro com download real (sem persistir)."""
    logger.info("\n" + "=" * 80)
    logger.info("TESTE 2: Filtro com dados reais do STJ")
    logger.info("=" * 80)

    # Data de teste (ontem)
    data_teste = (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d')
    logger.info(f"📅 Data de teste: {data_teste}")

    # Criar downloader
    data_root = Path(__file__).parent / 'data_test'
    downloader = DJENDownloader(
        data_root=data_root,
        requests_per_minute=30,
        delay_seconds=2.0,
        max_retries=3
    )

    logger.info("🌐 Baixando publicações do STJ via API...")
    publicacoes = downloader.baixar_api(
        tribunal='STJ',
        data=data_teste,
        limit=100,
        max_pages=1  # Apenas 1 página para teste
    )

    logger.info(f"✅ Baixadas: {len(publicacoes)} publicações")

    if not publicacoes:
        logger.warning("⚠️  Nenhuma publicação retornada - teste inconclusivo")
        return False

    # Criar banco temporário
    conn = criar_banco_temporario()

    # Testar processamento COM filtro (apenas Acórdãos)
    logger.info("\n--- Teste A: Filtrar apenas Acórdãos ---")
    stats_com_filtro = processar_publicacoes(
        conn=conn,
        publicacoes=publicacoes,
        tribunal='STJ',
        tipos_desejados=['Acórdão']
    )

    logger.info(f"📊 Estatísticas COM filtro:")
    logger.info(f"   Total: {stats_com_filtro['total']}")
    logger.info(f"   Novas: {stats_com_filtro['novas']}")
    logger.info(f"   Filtrados: {stats_com_filtro['filtrados']}")
    logger.info(f"   Erros: {stats_com_filtro['erros']}")
    logger.info(f"   Taxa de aproveitamento: {stats_com_filtro['novas']/stats_com_filtro['total']*100:.1f}%")

    # Validações
    validacao_ok = True

    if stats_com_filtro['novas'] + stats_com_filtro['filtrados'] + stats_com_filtro['erros'] != stats_com_filtro['total']:
        logger.error("❌ Contadores não batem! (novas + filtrados + erros ≠ total)")
        validacao_ok = False

    if stats_com_filtro['novas'] == 0:
        logger.warning("⚠️  Nenhum Acórdão encontrado - verifique manualmente")

    if stats_com_filtro['filtrados'] == 0:
        logger.warning("⚠️  Nenhuma publicação filtrada - todas eram Acórdãos?")

    conn.close()
    logger.info("\n✅ Teste de filtro concluído")
    return validacao_ok


def main():
    """Executa todos os testes."""
    logger.info("=" * 80)
    logger.info("TESTE DE FILTRO DE TIPO DE PUBLICAÇÃO - DRY RUN")
    logger.info("=" * 80)

    # Teste 1: Normalização
    teste1_ok = testar_normalizacao()

    # Teste 2: Filtro com dados reais
    teste2_ok = testar_filtro_dry_run()

    # Resultado final
    logger.info("\n" + "=" * 80)
    logger.info("RESULTADO FINAL")
    logger.info("=" * 80)
    logger.info(f"Teste 1 (Normalização): {'✅ PASSOU' if teste1_ok else '❌ FALHOU'}")
    logger.info(f"Teste 2 (Filtro real):  {'✅ PASSOU' if teste2_ok else '❌ FALHOU'}")

    if teste1_ok and teste2_ok:
        logger.info("\n🎉 TODOS OS TESTES PASSARAM!")
        return 0
    else:
        logger.error("\n❌ ALGUNS TESTES FALHARAM")
        return 1


if __name__ == '__main__':
    sys.exit(main())
