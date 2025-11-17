#!/usr/bin/env python3
"""
Extrair detalhes completos das publicações da OAB 129021/SP
"""

import requests
import zipfile
import io
import json
import html
import re
from datetime import datetime

def search_oab_in_json(data_json, oab_number):
    """Busca OAB e retorna detalhes completos"""
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
        texto = item.get('texto', '') or ''  # Garantir que não seja None

        for var in variações:
            if var in texto:
                # Extrair texto limpo (remover HTML)
                texto_limpo = html.unescape(re.sub('<[^<]+?>', '', texto))

                # Encontrar contexto (300 chars antes e depois da OAB)
                idx = texto_limpo.find(var)
                if idx > 0:
                    inicio = max(0, idx - 300)
                    fim = min(len(texto_limpo), idx + 400)
                    contexto = texto_limpo[inicio:fim].strip()
                else:
                    contexto = texto_limpo[:700]

                resultados.append({
                    'id': item.get('id'),
                    'data': item.get('data_disponibilizacao'),
                    'tribunal': item.get('siglaTribunal'),
                    'orgao': item.get('nomeOrgao', 'N/A'),
                    'tipo': item.get('tipoComunicacao', 'N/A'),
                    'variacao_encontrada': var,
                    'texto_html': texto,  # Texto HTML completo
                    'texto_limpo': texto_limpo,  # Texto sem HTML
                    'contexto': contexto  # Contexto da OAB
                })
                break

    return resultados


def main():
    print("=" * 80)
    print("📋 DETALHES DAS PUBLICAÇÕES - OAB 129021/SP")
    print("=" * 80)

    # Buscar no dia 14/11, meio D (onde encontramos)
    data = '2025-11-14'
    tribunal = 'TJSP'
    meio = 'D'

    url_api = f"https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/{meio}"

    print(f"\n🔍 Buscando em: {tribunal} - {data} - Meio {meio}")
    print(f"📡 URL: {url_api}\n")

    try:
        # Obter metadados
        print("⬇️  Baixando caderno...")
        resp = requests.get(url_api, timeout=30)
        resp.raise_for_status()
        api_data = resp.json()

        # Baixar ZIP
        s3_url = api_data.get('url')
        s3_resp = requests.get(s3_url, timeout=120)
        s3_resp.raise_for_status()

        zip_size = len(s3_resp.content) / 1024 / 1024
        print(f"✓ ZIP baixado: {zip_size:.1f}MB")

        # Processar JSONs
        print(f"📦 Extraindo e processando JSONs...\n")

        resultados = []
        zip_bytes = io.BytesIO(s3_resp.content)

        with zipfile.ZipFile(zip_bytes, 'r') as zf:
            json_files = sorted([f for f in zf.namelist() if f.endswith('.json')])

            for json_file in json_files:
                print(f"   Processando {json_file}...", end=' ')
                json_content = zf.read(json_file)
                data_json = json.loads(json_content)

                matches = search_oab_in_json(data_json, '129021')
                if matches:
                    resultados.extend(matches)
                    print(f"✓ {len(matches)} encontradas")
                else:
                    print("✗")

        # Exibir resultados
        print("\n" + "=" * 80)
        print(f"📊 TOTAL: {len(resultados)} PUBLICAÇÕES ENCONTRADAS")
        print("=" * 80)

        for i, pub in enumerate(resultados, 1):
            print(f"\n{'━' * 80}")
            print(f"📄 PUBLICAÇÃO #{i}")
            print(f"{'━' * 80}")
            print(f"ID:               {pub['id']}")
            print(f"Data:             {pub['data']}")
            print(f"Tribunal:         {pub['tribunal']}")
            print(f"Tipo:             {pub['tipo']}")
            print(f"Órgão:            {pub['orgao']}")
            print(f"Variação OAB:     {pub['variacao_encontrada']}")
            print(f"\n{'─' * 80}")
            print(f"CONTEXTO:")
            print(f"{'─' * 80}")

            # Dividir contexto em linhas de 80 chars
            contexto = pub['contexto']
            palavras = contexto.split()
            linha_atual = ""

            for palavra in palavras:
                if len(linha_atual) + len(palavra) + 1 <= 78:
                    linha_atual += palavra + " "
                else:
                    print(f"  {linha_atual.strip()}")
                    linha_atual = palavra + " "

            if linha_atual:
                print(f"  {linha_atual.strip()}")

            print(f"\n{'─' * 80}")
            print(f"TEXTO COMPLETO:")
            print(f"{'─' * 80}")

            # Mostrar texto completo (primeiros 2000 chars)
            texto = pub['texto_limpo']
            if len(texto) > 2000:
                print(f"{texto[:2000]}")
                print(f"\n... (texto continua, total: {len(texto)} caracteres)")
            else:
                print(texto)

        # Salvar em arquivo para análise
        output_file = f"oab_129021_publicacoes_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(resultados, f, indent=2, ensure_ascii=False)

        print(f"\n{'=' * 80}")
        print(f"💾 Detalhes salvos em: {output_file}")
        print(f"{'=' * 80}")

    except Exception as e:
        print(f"\n❌ Erro: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
