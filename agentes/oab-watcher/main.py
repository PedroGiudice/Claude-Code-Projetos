"""
OAB Watcher - Menu Principal
Execução: python main.py ou via run_agent.ps1
"""
import json
import logging
from pathlib import Path
from src.busca_oab import BuscaOAB
from src.download_cadernos import DownloadCadernos
from src.utils import configurar_logging, formatar_oab


def carregar_config() -> dict:
    """Carrega configuração de config.json"""
    config_path = Path(__file__).parent / 'config.json'
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def menu_principal():
    """Menu principal interativo"""
    print("\n" + "="*60)
    print("OAB WATCHER - Monitor DJEN".center(60))
    print("="*60)
    print("\n1. Buscar publicações por número de OAB")
    print("2. Buscar múltiplas OABs")
    print("3. Download massivo de cadernos")
    print("4. Listar cadernos disponíveis (data específica)")
    print("5. Relatório de dados coletados")
    print("0. Sair")
    print("-"*60)

    return input("\nEscolha uma opção: ").strip()


def menu_busca_oab(config):
    """Menu para busca por OAB única"""
    print("\n" + "-"*60)
    print("BUSCA POR OAB".center(60))
    print("-"*60)

    numero = input("Número da OAB (ex: 129021): ").strip()
    uf = input("UF (ex: SP): ").strip().upper()

    # Validar inputs básicos
    if not numero or not uf:
        print("\n✗ Erro: Número e UF são obrigatórios!")
        return

    print(f"\nBuscando: {formatar_oab(numero, uf)}")

    # Perguntar filtros opcionais
    print("\nFiltros opcionais (Enter para ignorar):")
    data_inicio = input("  Data início (YYYY-MM-DD): ").strip()
    data_fim = input("  Data fim (YYYY-MM-DD): ").strip()
    tribunal = input("  Tribunal (ex: TJSP): ").strip().upper()

    try:
        busca = BuscaOAB(config)
        resultado = busca.buscar(
            numero_oab=numero,
            uf_oab=uf,
            data_inicio=data_inicio or None,
            data_fim=data_fim or None,
            tribunal=tribunal or None
        )

        print("\n" + "="*60)
        print("RESULTADO DA BUSCA".center(60))
        print("="*60)
        print(f"\n✓ Busca concluída para: {resultado['oab']}")
        print(f"  Total de publicações: {resultado['total_publicacoes']}")
        print(f"  Tribunais: {', '.join(resultado['tribunais']) if resultado['tribunais'] else 'Nenhum'}")
        print(f"  Arquivo salvo em: {resultado['arquivo_json']}")
        print("-"*60)

        # Mostrar algumas publicações (primeiras 3)
        if resultado['items']:
            print(f"\nPrimeiras publicações (total: {len(resultado['items'])}):")
            for i, item in enumerate(resultado['items'][:3], 1):
                print(f"\n  [{i}] {item.get('siglaTribunal', 'N/A')} - {item.get('tipoComunicacao', 'N/A')}")
                print(f"      Processo: {item.get('numero_processo', 'N/A')}")
                print(f"      Data: {item.get('data_disponibilizacao', 'N/A')}")

            if len(resultado['items']) > 3:
                print(f"\n  ... e mais {len(resultado['items']) - 3} publicações")

    except Exception as e:
        print(f"\n✗ Erro na busca: {e}")
        logging.error(f"Erro ao buscar OAB: {e}", exc_info=True)


def menu_busca_multiplas(config):
    """Menu para busca de múltiplas OABs"""
    print("\n" + "-"*60)
    print("BUSCA MÚLTIPLAS OABs".center(60))
    print("-"*60)

    print("\nFormato: NUMERO,UF (um por linha, linha vazia para encerrar)")
    print("Exemplo: 129021,SP")

    oabs = []
    while True:
        entrada = input(f"OAB #{len(oabs)+1} (ou Enter para continuar): ").strip()
        if not entrada:
            break

        try:
            numero, uf = entrada.split(',')
            oabs.append((numero.strip(), uf.strip().upper()))
        except ValueError:
            print("  ✗ Formato inválido! Use: NUMERO,UF")

    if not oabs:
        print("\n✗ Nenhuma OAB informada!")
        return

    print(f"\nBuscando {len(oabs)} OABs:")
    for numero, uf in oabs:
        print(f"  - {formatar_oab(numero, uf)}")

    # Filtros opcionais
    print("\nFiltros opcionais (Enter para ignorar):")
    data_inicio = input("  Data início (YYYY-MM-DD): ").strip()
    data_fim = input("  Data fim (YYYY-MM-DD): ").strip()

    try:
        busca = BuscaOAB(config)
        resultados = busca.buscar_multiplas_oabs(
            oabs=oabs,
            data_inicio=data_inicio or None,
            data_fim=data_fim or None
        )

        print("\n" + "="*60)
        print("RESULTADO DA BUSCA MÚLTIPLA".center(60))
        print("="*60)
        print(f"\n✓ Buscas concluídas: {len(resultados)}/{len(oabs)}")

        total_publicacoes = sum(r['total_publicacoes'] for r in resultados)
        print(f"  Total de publicações: {total_publicacoes}")

        print("\nDetalhes por OAB:")
        for resultado in resultados:
            print(f"\n  {resultado['oab']}: {resultado['total_publicacoes']} publicações")
            print(f"    Tribunais: {', '.join(resultado['tribunais']) if resultado['tribunais'] else 'Nenhum'}")
            print(f"    Arquivo: {resultado['arquivo_json']}")

    except Exception as e:
        print(f"\n✗ Erro na busca: {e}")
        logging.error(f"Erro ao buscar múltiplas OABs: {e}", exc_info=True)


def menu_download_cadernos(config):
    """Menu para download massivo de cadernos"""
    print("\n" + "-"*60)
    print("DOWNLOAD MASSIVO DE CADERNOS".center(60))
    print("-"*60)

    tribunal = input("Tribunal (ex: TJSP): ").strip().upper()
    data_inicio = input("Data início (YYYY-MM-DD): ").strip()
    data_fim = input("Data fim (YYYY-MM-DD): ").strip()

    if not tribunal or not data_inicio or not data_fim:
        print("\n✗ Erro: Todos os campos são obrigatórios!")
        return

    print(f"\nIniciando download de cadernos:")
    print(f"  Tribunal: {tribunal}")
    print(f"  Período: {data_inicio} a {data_fim}")

    try:
        downloader = DownloadCadernos(config)
        stats = downloader.baixar_periodo(
            tribunal=tribunal,
            data_inicial=data_inicio,
            data_final=data_fim
        )

        print("\n" + "="*60)
        print("DOWNLOAD CONCLUÍDO".center(60))
        print("="*60)
        print(f"\n✓ Tribunal: {stats['tribunal']}")
        print(f"  Período: {stats['periodo']}")
        print(f"  Total processado: {stats['total_cadernos']} cadernos")
        print(f"  Sucessos: {stats['sucesso']}")
        print(f"  Falhas: {stats['falhas']}")
        print(f"  Duplicatas: {stats['duplicatas']}")
        print(f"  Tempo de execução: {stats['tempo_execucao']}")
        print("-"*60)

    except Exception as e:
        print(f"\n✗ Erro no download: {e}")
        logging.error(f"Erro ao baixar cadernos: {e}", exc_info=True)


def menu_listar_cadernos(config):
    """Menu para listar cadernos disponíveis em data específica"""
    print("\n" + "-"*60)
    print("LISTAR CADERNOS DISPONÍVEIS".center(60))
    print("-"*60)

    tribunal = input("Tribunal (ex: TJSP): ").strip().upper()
    data = input("Data (YYYY-MM-DD): ").strip()

    if not tribunal or not data:
        print("\n✗ Erro: Tribunal e data são obrigatórios!")
        return

    try:
        downloader = DownloadCadernos(config)
        cadernos = downloader.listar_cadernos_disponiveis(tribunal, data)

        print("\n" + "="*60)
        print(f"CADERNOS DISPONÍVEIS - {tribunal} ({data})".center(60))
        print("="*60)

        if not cadernos:
            print("\n  Nenhum caderno disponível para esta data.")
        else:
            print(f"\n  Total: {len(cadernos)} cadernos")
            print("\n" + "-"*60)

            for i, caderno in enumerate(cadernos, 1):
                print(f"\n  [{i}] {caderno.get('meio', 'N/A')} - {caderno.get('versao', 'N/A')}")
                print(f"      Páginas: {caderno.get('numero_paginas', 'N/A')}")
                print(f"      Comunicações: {caderno.get('total_comunicacoes', 'N/A')}")
                print(f"      Hash: {caderno.get('hash', 'N/A')[:16]}...")

    except Exception as e:
        print(f"\n✗ Erro ao listar cadernos: {e}")
        logging.error(f"Erro ao listar cadernos: {e}", exc_info=True)


def gerar_relatorio(config):
    """Gera relatório dos dados coletados"""
    print("\n" + "-"*60)
    print("RELATÓRIO DE STATUS".center(60))
    print("-"*60)

    data_root = Path(config['paths']['data_root'])

    # Contar arquivos
    busca_dir = data_root / config['paths']['downloads_busca']
    cadernos_dir = data_root / config['paths']['downloads_cadernos']
    logs_dir = data_root / config['paths']['logs']

    total_buscas = len(list(busca_dir.glob('*.json'))) if busca_dir.exists() else 0
    total_cadernos = len(list(cadernos_dir.rglob('*.pdf'))) if cadernos_dir.exists() else 0
    total_logs = len(list(logs_dir.glob('*.log'))) if logs_dir.exists() else 0

    # Tamanho dos dados
    tamanho_cadernos = sum(f.stat().st_size for f in cadernos_dir.rglob('*.pdf')) if cadernos_dir.exists() else 0
    tamanho_mb = tamanho_cadernos / (1024 * 1024)

    print(f"\nBuscas OAB realizadas: {total_buscas}")
    print(f"Cadernos baixados: {total_cadernos}")
    print(f"Tamanho total: {tamanho_mb:.2f} MB")
    print(f"Arquivos de log: {total_logs}")
    print(f"\nDiretório de dados: {data_root}")
    print(f"  Buscas: {busca_dir}")
    print(f"  Cadernos: {cadernos_dir}")
    print(f"  Logs: {logs_dir}")
    print("-"*60)


if __name__ == "__main__":
    # Configurar logging
    config = carregar_config()
    configurar_logging(config)

    logger = logging.getLogger(__name__)
    logger.info("="*60)
    logger.info("OAB Watcher iniciado")
    logger.info("="*60)

    # Loop do menu
    while True:
        try:
            opcao = menu_principal()

            if opcao == '1':
                menu_busca_oab(config)
            elif opcao == '2':
                menu_busca_multiplas(config)
            elif opcao == '3':
                menu_download_cadernos(config)
            elif opcao == '4':
                menu_listar_cadernos(config)
            elif opcao == '5':
                gerar_relatorio(config)
            elif opcao == '0':
                print("\nEncerrando OAB Watcher...")
                logger.info("OAB Watcher encerrado pelo usuário")
                break
            else:
                print("\n✗ Opção inválida! Escolha entre 0-5.")

        except KeyboardInterrupt:
            print("\n\nInterrompido pelo usuário (Ctrl+C)")
            logger.info("OAB Watcher interrompido por Ctrl+C")
            break
        except Exception as e:
            logger.error(f"Erro não tratado no menu: {e}", exc_info=True)
            print(f"\n✗ Erro não tratado: {e}")
            print("Verifique os logs para mais detalhes.")
