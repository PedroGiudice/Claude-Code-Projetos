#!/usr/bin/env python3
"""
Busca abrangente por OAB 129021/SP

Busca nos últimos 30 dias, múltiplos tribunais e múltiplos meios
"""

import requests
import zipfile
import io
import json
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

def search_oab_in_json(data_json, oab_number):
    """Busca OAB em um JSON (com variações de formato)"""
    resultados = []

    if not isinstance(data_json, dict) or 'items' not in data_json:
        return resultados

    # Variações do número
    oab_plain = str(oab_number)
    oab_dot = f"{oab_plain[:3]}.{oab_plain[3:]}" if len(oab_plain) == 6 else oab_plain

    variações = [
        oab_plain,
        oab_dot,
        f"{oab_plain}/SP",
        f"{oab_dot}/SP",
        f"OAB {oab_plain}",
        f"OAB/SP {oab_plain}",
        f"OAB/SP {oab_dot}",
        f"OAB nº {oab_plain}",
        f"OAB/SP nº {oab_dot}",
    ]

    for item in data_json['items']:
        texto = item.get('texto', '')

        for var in variações:
            if var in texto:
                resultados.append({
                    'id': item.get('id'),
                    'data': item.get('data_disponibilizacao'),
                    'tribunal': item.get('siglaTribunal'),
                    'orgao': item.get('nomeOrgao', 'N/A'),
                    'tipo': item.get('tipoComunicacao', 'N/A'),
                    'variacao_encontrada': var,
                    'texto': texto  # Texto completo para análise
                })
                break

    return resultados


def buscar_caderno(tribunal, data, meio):
    """Busca OAB 129021 em um caderno específico"""
    url_api = f"https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/{meio}"

    try:
        # Obter metadados
        resp = requests.get(url_api, timeout=30)

        if resp.status_code == 404:
            return None  # Sem publicações

        resp.raise_for_status()
        api_data = resp.json()

        if api_data.get('status') != 'Processado':
            return None

        # Baixar ZIP
        s3_url = api_data.get('url')
        if not s3_url:
            return None

        s3_resp = requests.get(s3_url, timeout=60)
        s3_resp.raise_for_status()

        # Processar JSONs
        resultados = []
        zip_bytes = io.BytesIO(s3_resp.content)

        with zipfile.ZipFile(zip_bytes, 'r') as zf:
            json_files = [f for f in zf.namelist() if f.endswith('.json')]

            for json_file in json_files:
                json_content = zf.read(json_file)
                data_json = json.loads(json_content)

                # Buscar OAB 129021
                resultados.extend(search_oab_in_json(data_json, '129021'))

        return {
            'tribunal': tribunal,
            'data': data,
            'meio': meio,
            'resultados': resultados
        }

    except Exception as e:
        return None


def main():
    print("=" * 70)
    print("🔍 BUSCA ABRANGENTE: OAB 129021/SP")
    print("=" * 70)
    print("\nConfigurações:")

    # Configurações de busca
    OAB_ALVO = '129021'
    DIAS_RETROATIVOS = 30
    TRIBUNAIS = ['TJSP', 'TRF3', 'TST', 'STJ', 'STF']  # Tribunais mais prováveis para SP
    MEIOS = ['E', 'D', 'A']  # E=Eletrônico (mais comum), D=Digital, A=Avulso

    print(f"   OAB: {OAB_ALVO}/SP")
    print(f"   Período: Últimos {DIAS_RETROATIVOS} dias")
    print(f"   Tribunais: {', '.join(TRIBUNAIS)}")
    print(f"   Meios: {', '.join(MEIOS)}")
    print()

    # Gerar lista de datas
    hoje = datetime.now()
    datas = [(hoje - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(DIAS_RETROATIVOS)]

    # Gerar todas as combinações tribunal+data+meio
    tarefas = []
    for tribunal in TRIBUNAIS:
        for data in datas:
            for meio in MEIOS:
                tarefas.append((tribunal, data, meio))

    print(f"📊 Total de cadernos a verificar: {len(tarefas)}")
    print(f"🚀 Iniciando busca paralela...\n")

    # Buscar em paralelo (max 10 threads)
    resultados_totais = []
    cadernos_verificados = 0
    cadernos_com_publicacoes = 0

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(buscar_caderno, t, d, m): (t, d, m) for t, d, m in tarefas}

        for future in as_completed(futures):
            tribunal, data, meio = futures[future]
            cadernos_verificados += 1

            try:
                resultado = future.result()

                if resultado and resultado['resultados']:
                    cadernos_com_publicacoes += 1
                    resultados_totais.extend(resultado['resultados'])

                    print(f"✅ {tribunal} {data} {meio}: {len(resultado['resultados'])} ocorrências!")

                # Progresso a cada 50 cadernos
                if cadernos_verificados % 50 == 0:
                    print(f"   [Progresso: {cadernos_verificados}/{len(tarefas)} cadernos verificados]")

            except Exception as e:
                pass

    # Resumo
    print("\n" + "=" * 70)
    print("📊 RESULTADO DA BUSCA")
    print("=" * 70)
    print(f"\nCadernos verificados: {cadernos_verificados}")
    print(f"Cadernos com publicações: {cadernos_com_publicacoes}")
    print(f"Total de ocorrências de OAB {OAB_ALVO}: {len(resultados_totais)}")

    if resultados_totais:
        print(f"\n✅ OAB {OAB_ALVO} ENCONTRADA! 🎉")
        print(f"\n📋 Detalhes das publicações:\n")

        for i, res in enumerate(resultados_totais, 1):
            print(f"{i}. {res['data']} - {res['tribunal']} - {res['tipo']}")
            print(f"   ID: {res['id']}")
            print(f"   Órgão: {res['orgao']}")
            print(f"   Variação: {res['variacao_encontrada']}")

            # Extrair trecho relevante (50 chars antes e depois da OAB)
            texto = res['texto']
            idx = texto.find(res['variacao_encontrada'])
            if idx > 0:
                inicio = max(0, idx - 100)
                fim = min(len(texto), idx + 200)
                trecho = texto[inicio:fim].replace('<', '').replace('>', '').replace('\n', ' ')
                print(f"   Trecho: ...{trecho}...")
            print()

    else:
        print(f"\n❌ OAB {OAB_ALVO} não encontrada nos últimos {DIAS_RETROATIVOS} dias")
        print(f"\nPossíveis razões:")
        print(f"1. OAB {OAB_ALVO} não teve publicações neste período")
        print(f"2. OAB pode estar em formato não contemplado pelos padrões de busca")
        print(f"3. Publicações podem estar em tribunal/meio não incluído na busca")

    print("=" * 70)


if __name__ == '__main__':
    main()
