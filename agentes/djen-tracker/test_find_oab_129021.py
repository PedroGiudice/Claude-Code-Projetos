#!/usr/bin/env python3
"""
Teste focado: Encontrar OAB 129021/SP em publicações do DJEN

Este script testa diferentes estratégias para localizar publicações
que mencionam a OAB 129021 de São Paulo.

Estratégias testadas:
1. Download de cadernos + extração de texto do PDF + busca local
2. API de busca/comunicação com filtros
3. API de busca em campo específico (numeroOAB, textoCompleto, etc)
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent / 'src'))

import requests
import zipfile
import io
import json
from datetime import datetime, timedelta

try:
    import PyPDF2
except ImportError:
    print("⚠️  PyPDF2 não instalado. Instalando...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "PyPDF2"])
    import PyPDF2

try:
    import pdfplumber
except ImportError:
    print("⚠️  pdfplumber não instalado. Instalando...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "pdfplumber"])
    import pdfplumber


def test_estrategia_1_download_e_busca():
    """
    Estratégia 1: Baixar caderno completo e buscar no PDF

    Prós: Controle total, busca offline depois
    Contras: Download pesado, processamento de PDF pode ser lento
    """
    print("\n" + "="*70)
    print("ESTRATÉGIA 1: Download de caderno + busca local no PDF")
    print("="*70)

    # Testar com TJSP dos últimos 3 dias (mais provável ter publicações)
    hoje = datetime.now()

    for dia_offset in range(3):
        data = (hoje - timedelta(days=dia_offset)).strftime('%Y-%m-%d')

        print(f"\n📅 Testando {data}...")

        # Testar meio E (eletrônico, mais comum)
        url_api = f"https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/{data}/E"

        try:
            # Passo 1: Consultar API para obter metadados
            print(f"   → Consultando API: {url_api}")
            resp = requests.get(url_api, timeout=30)

            if resp.status_code == 404:
                print(f"   ✗ Sem publicações em {data}")
                continue

            resp.raise_for_status()
            api_data = resp.json()

            # Verificar status
            status = api_data.get('status', '')
            if status != 'Processado':
                print(f"   ✗ Caderno não processado: {status}")
                continue

            # Obter URL do S3
            s3_url = api_data.get('url')
            if not s3_url:
                print(f"   ✗ URL de download não encontrada")
                continue

            print(f"   ✓ Caderno encontrado: {api_data.get('hash', '')[:8]}...")

            # Passo 2: Baixar ZIP do S3
            print(f"   → Baixando ZIP...")
            s3_resp = requests.get(s3_url, timeout=60)
            s3_resp.raise_for_status()

            zip_size = len(s3_resp.content) / 1024 / 1024
            print(f"   ✓ ZIP baixado: {zip_size:.1f}MB")

            # Passo 3: Extrair PDF do ZIP
            zip_bytes = io.BytesIO(s3_resp.content)
            with zipfile.ZipFile(zip_bytes, 'r') as zf:
                pdf_files = [f for f in zf.namelist() if f.endswith('.pdf')]

                if not pdf_files:
                    print(f"   ✗ Nenhum PDF no ZIP")
                    continue

                pdf_name = pdf_files[0]
                pdf_data = zf.read(pdf_name)
                pdf_size = len(pdf_data) / 1024 / 1024
                print(f"   ✓ PDF extraído: {pdf_name} ({pdf_size:.1f}MB)")

            # Passo 4: Buscar "129021" no PDF
            print(f"   → Buscando OAB 129021 no PDF...")

            # Tentar com PyPDF2
            encontrou = False
            try:
                pdf_file = io.BytesIO(pdf_data)
                pdf_reader = PyPDF2.PdfReader(pdf_file)

                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    texto = page.extract_text()

                    if '129021' in texto:
                        print(f"   ✅ ENCONTRADO na página {page_num + 1}!")

                        # Mostrar contexto
                        linhas = texto.split('\n')
                        for i, linha in enumerate(linhas):
                            if '129021' in linha:
                                print(f"\n   Contexto (linhas {max(0, i-2)}-{i+2}):")
                                for j in range(max(0, i-2), min(len(linhas), i+3)):
                                    print(f"      {linhas[j]}")
                                break

                        encontrou = True
                        break

                if not encontrou:
                    print(f"   ✗ OAB 129021 não encontrada no PDF (testado com PyPDF2)")

                    # Tentar com pdfplumber (mais robusto)
                    print(f"   → Tentando com pdfplumber...")
                    with pdfplumber.open(io.BytesIO(pdf_data)) as pdf:
                        for page_num, page in enumerate(pdf.pages):
                            texto = page.extract_text()
                            if texto and '129021' in texto:
                                print(f"   ✅ ENCONTRADO na página {page_num + 1} (via pdfplumber)!")
                                encontrou = True
                                break

                    if not encontrou:
                        print(f"   ✗ OAB 129021 não encontrada (testado com pdfplumber também)")

            except Exception as e:
                print(f"   ✗ Erro ao processar PDF: {e}")

            # Se encontrou, não precisa testar outros dias
            if encontrou:
                return True

        except Exception as e:
            print(f"   ✗ Erro: {e}")

    print("\n❌ OAB 129021 não encontrada nos últimos 3 dias do TJSP")
    return False


def test_estrategia_2_api_comunicacao():
    """
    Estratégia 2: Usar endpoint de busca/comunicação da API

    Prós: Filtro no servidor, download otimizado
    Contras: Depende de filtros disponíveis na API
    """
    print("\n" + "="*70)
    print("ESTRATÉGIA 2: API de comunicação/busca com filtros")
    print("="*70)

    # Endpoints possíveis de busca
    endpoints = [
        "https://comunicaapi.pje.jus.br/api/v1/comunicacao/TJSP",
        "https://comunicaapi.pje.jus.br/api/v1/publicacao/TJSP",
        "https://comunicaapi.pje.jus.br/api/v1/busca/TJSP"
    ]

    # Parâmetros de busca possíveis
    params_tests = [
        {"numeroOAB": "129021"},
        {"oab": "129021"},
        {"numero": "129021"},
        {"q": "129021"},
        {"search": "129021"},
        {"advogado": "129021"},
        {"numeroInscricaoOAB": "129021"}
    ]

    print("\nTestando endpoints de busca com diferentes parâmetros...")

    for endpoint in endpoints:
        print(f"\n📡 Endpoint: {endpoint}")

        for params in params_tests:
            try:
                print(f"   → Tentando: {params}")
                resp = requests.get(endpoint, params=params, timeout=10)

                if resp.status_code == 200:
                    data = resp.json()
                    print(f"   ✓ Sucesso! Status 200")
                    print(f"   Resposta: {json.dumps(data, indent=2, ensure_ascii=False)[:500]}...")

                    # Verificar se retornou resultados
                    if isinstance(data, list) and len(data) > 0:
                        print(f"   ✅ Encontrou {len(data)} resultados!")
                        return True
                    elif isinstance(data, dict):
                        if data.get('items') or data.get('results') or data.get('publicacoes'):
                            print(f"   ✅ Encontrou resultados!")
                            return True

                elif resp.status_code == 404:
                    print(f"   ✗ 404 Not Found")
                else:
                    print(f"   ✗ Status {resp.status_code}")

            except Exception as e:
                print(f"   ✗ Erro: {e}")

    print("\n❌ Nenhum endpoint de busca funcional encontrado")
    return False


def test_estrategia_3_busca_em_todos_tribunais():
    """
    Estratégia 3: Buscar em múltiplos tribunais (OAB/SP pode ter publicações em TRF, STJ, etc)
    """
    print("\n" + "="*70)
    print("ESTRATÉGIA 3: Buscar em múltiplos tribunais")
    print("="*70)

    # Tribunais mais prováveis para advogado de SP
    tribunais_prioritarios = [
        'TJSP',  # Tribunal de Justiça de SP (mais provável)
        'TRF3',  # Tribunal Regional Federal 3ª Região (SP/MS)
        'TST',   # Tribunal Superior do Trabalho
        'STJ',   # Superior Tribunal de Justiça
        'STF'    # Supremo Tribunal Federal
    ]

    hoje = datetime.now().strftime('%Y-%m-%d')

    print(f"\n📅 Buscando em {hoje} nos principais tribunais...\n")

    for tribunal in tribunais_prioritarios:
        print(f"🏛️  {tribunal}:")

        url = f"https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{hoje}/E"

        try:
            resp = requests.get(url, timeout=10)

            if resp.status_code == 404:
                print(f"   ✗ Sem publicações")
                continue

            resp.raise_for_status()
            data = resp.json()

            if data.get('status') == 'Processado':
                print(f"   ✓ Caderno disponível")
                # Aqui poderíamos baixar e buscar, mas por ora só verificamos disponibilidade
            else:
                print(f"   ⏳ Status: {data.get('status')}")

        except Exception as e:
            print(f"   ✗ Erro: {e}")


def main():
    print("\n" + "="*70)
    print("🔍 TESTE: Encontrar OAB 129021/SP no DJEN")
    print("="*70)
    print("\nObjetivo: Desenvolver estratégia eficiente para localizar")
    print("publicações diárias que mencionam a OAB 129021 de São Paulo.\n")

    # Testar estratégia 1 (download + busca local)
    sucesso_estrategia_1 = test_estrategia_1_download_e_busca()

    # Testar estratégia 2 (API de busca)
    sucesso_estrategia_2 = test_estrategia_2_api_comunicacao()

    # Testar estratégia 3 (múltiplos tribunais)
    test_estrategia_3_busca_em_todos_tribunais()

    # Resumo
    print("\n" + "="*70)
    print("📊 RESUMO DOS TESTES")
    print("="*70)
    print(f"\nEstratégia 1 (Download + busca local):    {'✅ Funciona' if sucesso_estrategia_1 else '❌ Não encontrou'}")
    print(f"Estratégia 2 (API de busca com filtros):  {'✅ Funciona' if sucesso_estrategia_2 else '❌ Não disponível'}")
    print("\n" + "="*70)

    if sucesso_estrategia_1:
        print("\n✅ SOLUÇÃO: Implementar download diário + extração de texto + busca local")
        print("\nPróximos passos:")
        print("1. Otimizar extração de texto do PDF (testar pdfplumber vs PyPDF2)")
        print("2. Implementar cache de cadernos já processados")
        print("3. Adicionar notificação quando OAB 129021 for encontrada")
    elif sucesso_estrategia_2:
        print("\n✅ SOLUÇÃO: Usar API de busca com filtros")
    else:
        print("\n⚠️  INVESTIGAÇÃO NECESSÁRIA:")
        print("- OAB 129021 pode não ter publicações nos dias testados")
        print("- Testar com outras OABs conhecidas para validar o método")
        print("- Considerar buscar em campo 'texto' ou 'textoCompleto'")


if __name__ == '__main__':
    main()
