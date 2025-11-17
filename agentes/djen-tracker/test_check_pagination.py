#!/usr/bin/env python3
"""
Teste: Verificar se há paginação nos JSONs
"""

import requests
import zipfile
import io
import json
from datetime import datetime

def check_pagination():
    data = datetime.now().strftime('%Y-%m-%d')
    url_api = f"https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/{data}/E"

    print(f"🔍 Verificando paginação em {url_api}\n")

    # Baixar ZIP
    resp = requests.get(url_api, timeout=30)
    resp.raise_for_status()
    api_data = resp.json()

    s3_url = api_data.get('url')
    s3_resp = requests.get(s3_url, timeout=60)
    s3_resp.raise_for_status()

    print(f"✓ ZIP baixado: {len(s3_resp.content) / 1024 / 1024:.2f}MB\n")

    # Analisar JSONs
    zip_bytes = io.BytesIO(s3_resp.content)

    with zipfile.ZipFile(zip_bytes, 'r') as zf:
        json_files = [f for f in zf.namelist() if f.endswith('.json')]

        print(f"📋 Total de arquivos JSON: {len(json_files)}\n")

        total_count = 0
        total_items = 0

        for json_file in json_files:
            json_content = zf.read(json_file)
            data_json = json.loads(json_content)

            count = data_json.get('count', 0)
            items_len = len(data_json.get('items', []))

            total_count += count
            total_items += items_len

            print(f"📄 {json_file}")
            print(f"   count (total declarado): {count}")
            print(f"   items (itens no array):  {items_len}")

            if count != items_len:
                print(f"   ⚠️  ATENÇÃO: count ({count}) != items ({items_len})")
                print(f"   ⚠️  Pode haver {count - items_len} itens faltando (paginação?)")

            # Verificar se há campos de paginação
            if 'page' in data_json or 'nextPage' in data_json or 'offset' in data_json:
                print(f"   📌 Campos de paginação encontrados:")
                if 'page' in data_json:
                    print(f"      page: {data_json['page']}")
                if 'nextPage' in data_json:
                    print(f"      nextPage: {data_json['nextPage']}")
                if 'offset' in data_json:
                    print(f"      offset: {data_json['offset']}")

            # Mostrar todas as chaves do JSON
            print(f"   Chaves disponíveis: {list(data_json.keys())}")

            print()

        print("=" * 70)
        print("📊 TOTAIS")
        print("=" * 70)
        print(f"Total count (declarado):  {total_count}")
        print(f"Total items (recebidos):  {total_items}")

        if total_count != total_items:
            print(f"\n⚠️  PROBLEMA: Faltam {total_count - total_items} publicações!")
            print(f"\n💡 Possíveis causas:")
            print(f"   1. Paginação: API retorna apenas subset, precisa consultar próximas páginas")
            print(f"   2. Múltiplos arquivos: Cada JSON é uma 'página', soma dos arquivos = total")
            print(f"   3. Campo 'count' incorreto: Bug da API")
        else:
            print(f"\n✅ OK: Todos os itens declarados foram recebidos")

    # Testar se API aceita parâmetros de paginação
    print("\n" + "=" * 70)
    print("🔍 Testando parâmetros de paginação na API")
    print("=" * 70)

    params_tests = [
        {},
        {'page': 1},
        {'page': 2},
        {'offset': 0, 'limit': 100},
        {'offset': 100, 'limit': 100},
        {'skip': 0, 'take': 100},
    ]

    for params in params_tests:
        try:
            print(f"\nTestando: {params if params else 'sem parâmetros'}")
            resp = requests.get(url_api, params=params, timeout=10)

            if resp.status_code == 200:
                data = resp.json()
                print(f"   ✓ Status 200")

                # Ver se URL mudou (indica que aceitou o parâmetro)
                if params:
                    print(f"   URL final: {resp.url}")

            else:
                print(f"   ✗ Status {resp.status_code}")

        except Exception as e:
            print(f"   ✗ Erro: {e}")


if __name__ == '__main__':
    try:
        check_pagination()
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
