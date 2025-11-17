#!/usr/bin/env python3
"""
Teste: Inspecionar conteúdo do ZIP retornado pela API
"""

import requests
import zipfile
import io
from datetime import datetime

def inspect_zip():
    # Baixar ZIP de hoje do TJSP
    data = datetime.now().strftime('%Y-%m-%d')
    url_api = f"https://comunicaapi.pje.jus.br/api/v1/caderno/TJSP/{data}/E"

    print(f"📡 Consultando API: {url_api}\n")

    # Passo 1: Obter metadados
    resp = requests.get(url_api, timeout=30)
    resp.raise_for_status()
    api_data = resp.json()

    print("📋 Metadados da API:")
    print(f"   Status: {api_data.get('status')}")
    print(f"   Hash: {api_data.get('hash')}")
    print(f"   Data: {api_data.get('data')}")
    print(f"   Tribunal: {api_data.get('tribunal')}")
    print(f"   Meio: {api_data.get('meio')}")
    print()

    # Passo 2: Baixar ZIP
    s3_url = api_data.get('url')
    print(f"🔗 URL S3: {s3_url[:80]}...\n")

    print("⬇️  Baixando ZIP...")
    s3_resp = requests.get(s3_url, timeout=60)
    s3_resp.raise_for_status()

    zip_size = len(s3_resp.content) / 1024 / 1024
    print(f"✓ ZIP baixado: {zip_size:.2f}MB\n")

    # Passo 3: Inspecionar conteúdo
    print("📦 Conteúdo do ZIP:")
    print("-" * 70)

    zip_bytes = io.BytesIO(s3_resp.content)
    with zipfile.ZipFile(zip_bytes, 'r') as zf:
        files = zf.namelist()
        print(f"Total de arquivos: {len(files)}\n")

        for filename in files:
            file_info = zf.getinfo(filename)
            file_size = file_info.file_size / 1024  # KB

            print(f"📄 {filename}")
            print(f"   Tamanho: {file_size:.2f} KB")
            print(f"   Comprimido: {file_info.compress_size / 1024:.2f} KB")
            print()

            # Se for arquivo pequeno (< 100KB), mostrar conteúdo
            if file_size < 100:
                try:
                    content = zf.read(filename)
                    if filename.endswith('.json'):
                        import json
                        data = json.loads(content)
                        print(f"   Conteúdo (JSON):")
                        print(f"   {json.dumps(data, indent=4, ensure_ascii=False)[:500]}")
                    elif filename.endswith('.xml') or filename.endswith('.html'):
                        print(f"   Conteúdo (primeiros 500 chars):")
                        print(f"   {content.decode('utf-8', errors='ignore')[:500]}")
                    print()
                except Exception as e:
                    print(f"   ⚠️ Erro ao ler: {e}")
                    print()


if __name__ == '__main__':
    try:
        inspect_zip()
    except Exception as e:
        print(f"❌ Erro: {e}")
        import traceback
        traceback.print_exc()
