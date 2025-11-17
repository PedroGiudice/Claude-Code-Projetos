#!/usr/bin/env python3
"""
Teste: Validar método de busca encontrando OABs reais nos cadernos
"""

import requests
import zipfile
import io
import json
import re
from datetime import datetime
from collections import defaultdict

def extract_oabs_from_json(data_json):
    """Extrai todos os números de OAB encontrados no JSON"""
    oabs = defaultdict(list)

    if not isinstance(data_json, dict) or 'items' not in data_json:
        return oabs

    # Padrões de OAB comuns:
    # - OAB/SP 123.456
    # - OAB 123456
    # - OAB/SP nº 123.456
    # - 123456/SP (menos comum mas ocorre)

    patterns = [
        r'OAB[/\s]*(?:SP|sp)?[/\s]*[nº°]*\s*(\d{1,3}\.?\d{3})',  # OAB/SP 123.456
        r'\b(\d{6})[/\s]*(?:SP|sp)\b',  # 123456/SP
        r'(?:advogad[oa]|procurador[a]?).*?OAB.*?(\d{1,3}\.?\d{3})',  # contexto advogado
    ]

    compiled_patterns = [re.compile(p, re.IGNORECASE) for p in patterns]

    for item in data_json['items']:
        texto = item.get('texto', '')

        # Buscar com todos os padrões
        found_oabs = set()
        for pattern in compiled_patterns:
            matches = pattern.findall(texto)
            for match in matches:
                # Normalizar: remover pontos e converter para número
                oab_num = match.replace('.', '')
                if oab_num.isdigit():
                    found_oabs.add(oab_num)

        # Adicionar à lista
        for oab in found_oabs:
            oabs[oab].append({
                'id': item.get('id'),
                'orgao': item.get('nomeOrgao', 'N/A'),
                'tipo': item.get('tipoComunicacao', 'N/A'),
                'texto_preview': texto[:200] + '...'
            })

    return oabs


def search_specific_oab(data_json, oab_number):
    """Busca uma OAB específica (com variações de formato)"""
    resultados = []

    if not isinstance(data_json, dict) or 'items' not in data_json:
        return resultados

    # Variações do número
    oab_plain = str(oab_number)  # "129021"
    oab_dot = f"{oab_plain[:3]}.{oab_plain[3:]}" if len(oab_plain) == 6 else oab_plain  # "129.021"

    variações = [
        oab_plain,
        oab_dot,
        f"{oab_plain}/SP",
        f"{oab_dot}/SP",
        f"OAB {oab_plain}",
        f"OAB/SP {oab_plain}",
        f"OAB/SP {oab_dot}",
    ]

    for item in data_json['items']:
        texto = item.get('texto', '')

        # Buscar qualquer variação
        for var in variações:
            if var in texto:
                resultados.append({
                    'id': item.get('id'),
                    'data': item.get('data_disponibilizacao'),
                    'orgao': item.get('nomeOrgao', 'N/A'),
                    'tipo': item.get('tipoComunicacao', 'N/A'),
                    'variacao_encontrada': var,
                    'texto_preview': texto[:500] + '...'
                })
                break  # Não precisa testar outras variações para este item

    return resultados


def main():
    print("=" * 70)
    print("🔍 VALIDAÇÃO DO MÉTODO DE BUSCA DE OAB")
    print("=" * 70)
    print("\nEtapa 1: Extrair TODAS as OABs presentes no caderno de hoje")
    print("Etapa 2: Validar se método funciona (deve encontrar várias OABs)")
    print("Etapa 3: Buscar especificamente OAB 129021\n")

    # Baixar caderno de hoje
    data = datetime.now().strftime('%Y-%m-%d')
    url_api = f"https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/{data}/E"

    print(f"📡 Baixando caderno TJSP {data}...")

    try:
        # Obter metadados
        resp = requests.get(url_api, timeout=30)
        resp.raise_for_status()
        api_data = resp.json()

        # Baixar ZIP
        s3_url = api_data.get('url')
        s3_resp = requests.get(s3_url, timeout=60)
        s3_resp.raise_for_status()

        print(f"✓ ZIP baixado: {len(s3_resp.content) / 1024 / 1024:.2f}MB\n")

        # Processar JSONs
        zip_bytes = io.BytesIO(s3_resp.content)
        all_oabs = defaultdict(list)
        total_publicacoes = 0
        oab_129021_encontrada = False

        with zipfile.ZipFile(zip_bytes, 'r') as zf:
            json_files = [f for f in zf.namelist() if f.endswith('.json')]

            for json_file in json_files:
                print(f"📄 Analisando {json_file}...")

                json_content = zf.read(json_file)
                data_json = json.loads(json_content)

                # Contar publicações
                if 'count' in data_json:
                    count = data_json['count']
                    total_publicacoes += count
                    print(f"   Total de publicações: {count}")

                # ETAPA 1: Extrair todas as OABs
                print(f"   Extraindo OABs...")
                oabs_encontradas = extract_oabs_from_json(data_json)

                for oab, ocorrencias in oabs_encontradas.items():
                    all_oabs[oab].extend(ocorrencias)

                print(f"   ✓ {len(oabs_encontradas)} OABs únicas encontradas neste JSON")

                # ETAPA 2: Buscar OAB 129021 especificamente
                resultados_129021 = search_specific_oab(data_json, '129021')
                if resultados_129021:
                    oab_129021_encontrada = True
                    print(f"   🎯 OAB 129021 ENCONTRADA! ({len(resultados_129021)} ocorrências)")

                    for res in resultados_129021:
                        print(f"\n   📍 Publicação ID: {res['id']}")
                        print(f"      Órgão: {res['orgao']}")
                        print(f"      Tipo: {res['tipo']}")
                        print(f"      Variação: {res['variacao_encontrada']}")

                print()

        # RESUMO
        print("=" * 70)
        print("📊 RESUMO DA ANÁLISE")
        print("=" * 70)
        print(f"\nTotal de publicações analisadas: {total_publicacoes}")
        print(f"Total de OABs únicas encontradas: {len(all_oabs)}")

        if len(all_oabs) > 0:
            print(f"\n✅ MÉTODO VALIDADO! Conseguimos extrair OABs dos JSONs.\n")

            # Top 10 OABs mais mencionadas
            sorted_oabs = sorted(all_oabs.items(), key=lambda x: len(x[1]), reverse=True)

            print("🏆 Top 10 OABs mais mencionadas hoje:")
            for i, (oab, ocorrencias) in enumerate(sorted_oabs[:10], 1):
                print(f"   {i}. OAB {oab}: {len(ocorrencias)} publicações")

            # Mostrar exemplo de uma publicação
            if sorted_oabs:
                exemplo_oab = sorted_oabs[0][0]
                exemplo = all_oabs[exemplo_oab][0]
                print(f"\n📄 Exemplo de publicação (OAB {exemplo_oab}):")
                print(f"   ID: {exemplo['id']}")
                print(f"   Órgão: {exemplo['orgao']}")
                print(f"   Tipo: {exemplo['tipo']}")
                print(f"   Trecho: {exemplo['texto_preview'][:200]}...")
        else:
            print(f"\n⚠️  Nenhuma OAB encontrada (pode ser problema de regex)")

        print("\n" + "=" * 70)
        print("🎯 STATUS: OAB 129021")
        print("=" * 70)

        if oab_129021_encontrada:
            print("✅ OAB 129021 ENCONTRADA NOS CADERNOS DE HOJE!")
        else:
            print("❌ OAB 129021 não encontrada nos cadernos de hoje.")
            print("\nPossíveis razões:")
            print("1. Não houve publicações para essa OAB hoje")
            print("2. A OAB pode estar em outro tribunal (TRF3, TST, etc)")
            print("3. A OAB pode estar em outro meio (A, D, J)")
            print("\n💡 Próximos passos:")
            print("- Buscar em múltiplos dias (últimos 7 dias)")
            print("- Buscar em múltiplos tribunais")
            print("- Buscar em múltiplos meios")

        print("=" * 70)

    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
