#!/usr/bin/env python3
"""
Teste: Analisar estrutura dos JSONs e buscar OAB 129021
"""

import requests
import zipfile
import io
import json
from datetime import datetime

def analyze_json_and_search_oab():
    # Baixar ZIP de hoje do TJSP
    data = datetime.now().strftime('%Y-%m-%d')
    url_api = f"https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/{data}/E"

    print(f"🔍 Analisando JSONs e buscando OAB 129021\n")
    print(f"📡 Consultando API: {url_api}\n")

    # Passo 1: Obter metadados
    resp = requests.get(url_api, timeout=30)
    resp.raise_for_status()
    api_data = resp.json()

    # Passo 2: Baixar ZIP
    s3_url = api_data.get('url')
    print("⬇️  Baixando ZIP...")
    s3_resp = requests.get(s3_url, timeout=60)
    s3_resp.raise_for_status()
    print(f"✓ ZIP baixado: {len(s3_resp.content) / 1024 / 1024:.2f}MB\n")

    # Passo 3: Processar JSONs
    zip_bytes = io.BytesIO(s3_resp.content)
    total_publicacoes = 0
    encontrou_oab = False

    with zipfile.ZipFile(zip_bytes, 'r') as zf:
        json_files = [f for f in zf.namelist() if f.endswith('.json')]

        print(f"📋 Arquivos JSON encontrados: {len(json_files)}\n")

        for json_file in json_files:
            print(f"📄 Processando {json_file}...")

            # Ler JSON
            json_content = zf.read(json_file)
            data_json = json.loads(json_content)

            # Analisar estrutura (primeira vez)
            if total_publicacoes == 0:
                print("\n🔍 Estrutura do JSON:")
                print(f"   Tipo: {type(data_json)}")

                if isinstance(data_json, dict):
                    print(f"   Chaves: {list(data_json.keys())}")

                    # Mostrar amostra
                    print("\n   Amostra dos primeiros dados:")
                    print(json.dumps(data_json, indent=4, ensure_ascii=False)[:1000])
                    print("   [...]\n")

                elif isinstance(data_json, list):
                    print(f"   Número de itens: {len(data_json)}")

                    if len(data_json) > 0:
                        print(f"   Tipo do item: {type(data_json[0])}")
                        print(f"\n   Estrutura do primeiro item:")

                        primeiro = data_json[0]
                        if isinstance(primeiro, dict):
                            print(f"   Chaves: {list(primeiro.keys())}")

                            print("\n   Primeiro item completo:")
                            print(json.dumps(primeiro, indent=4, ensure_ascii=False)[:2000])
                            print("   [...]\n")

            # Buscar OAB 129021
            print(f"\n🔍 Buscando OAB 129021 em {json_file}...")

            # Converter para string e buscar
            json_str = json.dumps(data_json, ensure_ascii=False)

            if '129021' in json_str:
                print(f"   ✅ ENCONTRADO! OAB 129021 está presente no JSON!")
                encontrou_oab = True

                # Encontrar onde exatamente
                if isinstance(data_json, list):
                    for idx, item in enumerate(data_json):
                        item_str = json.dumps(item, ensure_ascii=False)
                        if '129021' in item_str:
                            print(f"\n   📍 Localizado no item #{idx}:")
                            print(json.dumps(item, indent=4, ensure_ascii=False)[:2000])
                            print("\n   [...]")
                            break

                elif isinstance(data_json, dict):
                    # Buscar recursivamente
                    def find_in_dict(d, path=""):
                        for key, value in d.items():
                            current_path = f"{path}.{key}" if path else key

                            if isinstance(value, str) and '129021' in value:
                                print(f"\n   📍 Encontrado em: {current_path}")
                                print(f"   Valor: {value[:500]}")

                            elif isinstance(value, dict):
                                find_in_dict(value, current_path)

                            elif isinstance(value, list):
                                for i, item in enumerate(value):
                                    if isinstance(item, dict):
                                        item_str = json.dumps(item, ensure_ascii=False)
                                        if '129021' in item_str:
                                            print(f"\n   📍 Encontrado em: {current_path}[{i}]")
                                            print(json.dumps(item, indent=4, ensure_ascii=False)[:1000])
                                            return

                    find_in_dict(data_json)

            else:
                print(f"   ✗ OAB 129021 não encontrada neste JSON")

            # Contar publicações
            if isinstance(data_json, list):
                total_publicacoes += len(data_json)
                print(f"   Total de publicações neste JSON: {len(data_json)}")
            elif isinstance(data_json, dict) and 'publicacoes' in data_json:
                total_publicacoes += len(data_json['publicacoes'])
                print(f"   Total de publicações neste JSON: {len(data_json['publicacoes'])}")

            print()

    print("=" * 70)
    print(f"📊 RESUMO")
    print("=" * 70)
    print(f"Total de publicações analisadas: {total_publicacoes}")
    print(f"OAB 129021 encontrada: {'✅ SIM' if encontrou_oab else '❌ NÃO'}")
    print("=" * 70)

    if not encontrou_oab:
        print("\n⚠️  OAB 129021 não encontrada nos cadernos de hoje.")
        print("Isso pode significar:")
        print("1. Não houve publicações para esta OAB hoje")
        print("2. A OAB está em formato diferente (129.021, 129021/SP, etc)")
        print("3. A publicação está em outro tribunal ou meio")
        print("\n💡 Sugestão: Buscar por OABs mais comuns para validar o método")


if __name__ == '__main__':
    try:
        analyze_json_and_search_oab()
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
