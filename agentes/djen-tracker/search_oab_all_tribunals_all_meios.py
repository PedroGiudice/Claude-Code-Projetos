#!/usr/bin/env python3
"""
Busca ABRANGENTE: OAB 129021/SP em TODOS os tribunais e TODOS os meios

Cobertura:
- 65 tribunais brasileiros
- Todos os meios disponíveis (E, D, A, B, C, I, R, etc)
- Últimos N dias (configurável)
- Processamento paralelo otimizado
"""

import requests
import zipfile
import io
import json
import html
import re
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict
import time

# Lista completa de tribunais (65 tribunais)
TRIBUNAIS = [
    # Supremo Tribunal e Superiores
    'STF', 'STJ', 'TST', 'TSE', 'STM',

    # Tribunais Regionais Federais
    'TRF1', 'TRF2', 'TRF3', 'TRF4', 'TRF5', 'TRF6',

    # Tribunais de Justiça Estaduais
    'TJAC', 'TJAL', 'TJAP', 'TJAM', 'TJBA', 'TJCE', 'TJDF', 'TJES',
    'TJGO', 'TJMA', 'TJMT', 'TJMS', 'TJMG', 'TJPA', 'TJPB', 'TJPR',
    'TJPE', 'TJPI', 'TJRJ', 'TJRN', 'TJRS', 'TJRO', 'TJRR', 'TJSC',
    'TJSP', 'TJSE', 'TJTO',

    # Tribunais Regionais do Trabalho
    'TRT1', 'TRT2', 'TRT3', 'TRT4', 'TRT5', 'TRT6', 'TRT7', 'TRT8',
    'TRT9', 'TRT10', 'TRT11', 'TRT12', 'TRT13', 'TRT14', 'TRT15',
    'TRT16', 'TRT17', 'TRT18', 'TRT19', 'TRT20', 'TRT21', 'TRT22',
    'TRT23', 'TRT24',

    # Tribunais Regionais Eleitorais
    'TREAC', 'TREAL', 'TREAP', 'TREAM', 'TREBA', 'TRECE', 'TREDF',
    'TREES', 'TREGO', 'TREMA', 'TREMT', 'TREMS', 'TREMG', 'TREPA',
    'TREPB', 'TREPR', 'TREPE', 'TREPI', 'TRERJ', 'TRERN', 'TRERS',
    'TRERO', 'TRERR', 'TRESC', 'TRESP', 'TRESE', 'TRETO',
]

# Meios de publicação conhecidos
MEIOS = ['E', 'D', 'A', 'B', 'C', 'I', 'R', 'J']


def search_oab_in_json(data_json, oab_number):
    """Busca OAB em um JSON"""
    resultados = []

    if not isinstance(data_json, dict) or 'items' not in data_json:
        return resultados

    oab_plain = str(oab_number)
    oab_dot = f"{oab_plain[:3]}.{oab_plain[3:]}" if len(oab_plain) == 6 else oab_plain

    variações = [
        oab_plain, oab_dot, f"{oab_plain}/SP", f"{oab_dot}/SP",
        f"OAB {oab_plain}", f"OAB/SP {oab_plain}", f"OAB/SP {oab_dot}",
        f"OAB nº {oab_plain}", f"OAB/SP nº {oab_dot}",
    ]

    for item in data_json['items']:
        texto = item.get('texto', '') or ''

        for var in variações:
            if var in texto:
                # Extrair texto limpo
                texto_limpo = html.unescape(re.sub('<[^<]+?>', '', texto))

                # Contexto
                idx = texto_limpo.find(var)
                if idx > 0:
                    inicio = max(0, idx - 200)
                    fim = min(len(texto_limpo), idx + 300)
                    contexto = texto_limpo[inicio:fim].strip()
                else:
                    contexto = texto_limpo[:500]

                resultados.append({
                    'id': item.get('id'),
                    'data': item.get('data_disponibilizacao'),
                    'tribunal': item.get('siglaTribunal'),
                    'orgao': item.get('nomeOrgao', 'N/A'),
                    'tipo': item.get('tipoComunicacao', 'N/A'),
                    'variacao': var,
                    'contexto': contexto,
                    'texto_completo': texto_limpo
                })
                break

    return resultados


def buscar_caderno(tribunal, data, meio, oab_alvo='129021'):
    """Busca OAB em um caderno específico"""
    url_api = f"https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/{meio}"

    try:
        # Obter metadados
        resp = requests.get(url_api, timeout=30)

        if resp.status_code == 404:
            return None

        if resp.status_code != 200:
            return None

        api_data = resp.json()

        if api_data.get('status') != 'Processado':
            return None

        # Baixar ZIP
        s3_url = api_data.get('url')
        if not s3_url:
            return None

        s3_resp = requests.get(s3_url, timeout=120)
        s3_resp.raise_for_status()

        # Processar JSONs
        resultados = []
        total_publicacoes = 0
        zip_bytes = io.BytesIO(s3_resp.content)

        with zipfile.ZipFile(zip_bytes, 'r') as zf:
            json_files = [f for f in zf.namelist() if f.endswith('.json')]

            for json_file in json_files:
                json_content = zf.read(json_file)
                data_json = json.loads(json_content)

                if 'count' in data_json:
                    total_publicacoes += data_json['count']

                resultados.extend(search_oab_in_json(data_json, oab_alvo))

        if resultados:
            return {
                'tribunal': tribunal,
                'data': data,
                'meio': meio,
                'total_publicacoes': total_publicacoes,
                'matches': resultados
            }
        return None

    except Exception as e:
        return None


def main():
    print("=" * 80)
    print("🔍 BUSCA ABRANGENTE: OAB 129021/SP")
    print("=" * 80)

    # Configurações
    OAB_ALVO = '129021'
    DIAS_RETROATIVOS = 7  # Últimos 7 dias (pode ajustar)
    MAX_WORKERS = 20  # Threads paralelas

    print(f"\n⚙️  CONFIGURAÇÕES:")
    print(f"   OAB alvo:            {OAB_ALVO}/SP")
    print(f"   Período:             Últimos {DIAS_RETROATIVOS} dias")
    print(f"   Tribunais:           {len(TRIBUNAIS)} tribunais")
    print(f"   Meios:               {len(MEIOS)} meios ({', '.join(MEIOS)})")
    print(f"   Threads paralelas:   {MAX_WORKERS}")

    # Gerar lista de datas
    hoje = datetime.now()
    datas = [(hoje - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(DIAS_RETROATIVOS)]

    # Gerar todas as combinações
    tarefas = []
    for tribunal in TRIBUNAIS:
        for data in datas:
            for meio in MEIOS:
                tarefas.append((tribunal, data, meio))

    total_tarefas = len(tarefas)

    print(f"\n📊 ESCOPO:")
    print(f"   Total de cadernos a verificar: {total_tarefas:,}")
    print(f"   ({len(TRIBUNAIS)} tribunais × {DIAS_RETROATIVOS} dias × {len(MEIOS)} meios)")
    print(f"\n⚠️  Isso pode levar alguns minutos. Iniciando automaticamente...\n")
    print(f"🚀 Busca paralela em andamento...\n")

    # Buscar em paralelo
    resultados_totais = []
    cadernos_verificados = 0
    cadernos_com_publicacoes = 0
    cadernos_com_matches = 0
    inicio_geral = time.time()

    stats_por_tribunal = defaultdict(lambda: {'cadernos': 0, 'publicacoes': 0, 'matches': 0})

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(buscar_caderno, t, d, m): (t, d, m) for t, d, m in tarefas}

        for future in as_completed(futures):
            tribunal, data, meio = futures[future]
            cadernos_verificados += 1

            try:
                resultado = future.result()

                if resultado:
                    cadernos_com_publicacoes += 1
                    stats_por_tribunal[tribunal]['cadernos'] += 1
                    stats_por_tribunal[tribunal]['publicacoes'] += resultado['total_publicacoes']

                    if resultado['matches']:
                        cadernos_com_matches += 1
                        stats_por_tribunal[tribunal]['matches'] += len(resultado['matches'])
                        resultados_totais.append(resultado)

                        print(f"✅ {tribunal:6} {data} {meio}: {len(resultado['matches'])} matches!")

                # Progresso a cada 100 cadernos
                if cadernos_verificados % 100 == 0:
                    pct = (cadernos_verificados / total_tarefas) * 100
                    print(f"   [{cadernos_verificados:,}/{total_tarefas:,}] {pct:.1f}% concluído")

            except Exception:
                pass

    tempo_total = time.time() - inicio_geral

    # Resumo detalhado
    print("\n" + "=" * 80)
    print("📊 RESULTADO FINAL")
    print("=" * 80)

    print(f"\n⏱️  Tempo de execução: {tempo_total:.1f}s ({tempo_total/60:.1f} minutos)")
    print(f"\n📈 ESTATÍSTICAS:")
    print(f"   Cadernos verificados:        {cadernos_verificados:,}")
    print(f"   Cadernos com publicações:    {cadernos_com_publicacoes:,}")
    print(f"   Cadernos com matches OAB:    {cadernos_com_matches:,}")

    total_matches = sum(len(r['matches']) for r in resultados_totais)
    total_publicacoes_analisadas = sum(r['total_publicacoes'] for r in resultados_totais if 'total_publicacoes' in r)

    print(f"\n🎯 RESULTADOS OAB {OAB_ALVO}:")
    print(f"   Total de ocorrências:        {total_matches}")
    print(f"   Publicações analisadas:      {total_publicacoes_analisadas:,}")

    if total_matches > 0:
        print(f"\n✅ OAB {OAB_ALVO} ENCONTRADA! 🎉")

        print(f"\n📋 DISTRIBUIÇÃO POR TRIBUNAL:")
        tribunais_com_matches = [(t, s['matches']) for t, s in stats_por_tribunal.items() if s['matches'] > 0]
        tribunais_com_matches.sort(key=lambda x: x[1], reverse=True)

        for tribunal, matches in tribunais_com_matches:
            print(f"   {tribunal:6}: {matches} ocorrências")

        print(f"\n📄 DETALHES DAS PUBLICAÇÕES:\n")

        for i, resultado in enumerate(resultados_totais, 1):
            print(f"{'─' * 80}")
            print(f"Caderno: {resultado['tribunal']} - {resultado['data']} - Meio {resultado['meio']}")
            print(f"Total de publicações neste caderno: {resultado['total_publicacoes']:,}")
            print(f"Matches encontrados: {len(resultado['matches'])}\n")

            for j, pub in enumerate(resultado['matches'], 1):
                print(f"  {i}.{j}) ID: {pub['id']}")
                print(f"      Tipo: {pub['tipo']}")
                print(f"      Órgão: {pub['orgao']}")
                print(f"      Variação: {pub['variacao']}")
                print(f"      Contexto: {pub['contexto'][:200]}...")
                print()

        # Salvar resultados completos em JSON
        output_file = f"oab_{OAB_ALVO}_search_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        output_data = {
            'oab': OAB_ALVO,
            'periodo': f"{datas[-1]} até {datas[0]}",
            'tribunais_pesquisados': TRIBUNAIS,
            'meios_pesquisados': MEIOS,
            'tempo_execucao_segundos': tempo_total,
            'total_matches': total_matches,
            'resultados': resultados_totais
        }

        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)

        print(f"\n💾 Resultados salvos em: {output_file}")

    else:
        print(f"\n❌ OAB {OAB_ALVO} não encontrada no período pesquisado")

    print("=" * 80)


if __name__ == '__main__':
    main()
