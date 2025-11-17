#!/usr/bin/env python3
"""
Teste do sistema djen-tracker com OAB 129021/SP
Identifica pontos de ineficiência
"""

import time
from pathlib import Path
from src import ContinuousDownloader, OABFilter
from src.oab_matcher import OABMatcher
from datetime import datetime

def test_oab_filter():
    """Testa filtro OAB com texto de exemplo"""
    print("=" * 60)
    print("TESTE 1: Filtro OAB - Pattern Recognition")
    print("=" * 60)

    matcher = OABMatcher()

    # Textos de teste com diferentes variações
    test_texts = [
        "Advogado: João Silva OAB/SP 129.021",
        "OAB/SP 129021",
        "129021/SP",
        "Dr. Pedro - OAB 129.021 SP",
        "Processo com OAB número 129.021 de São Paulo",
        "Telefone: 11 91234-5678",  # Falso positivo?
    ]

    print("\nTestando variações de formatação:")
    for i, text in enumerate(test_texts, 1):
        start = time.time()
        matches = matcher.find_all(text)
        elapsed = (time.time() - start) * 1000

        print(f"\n{i}. Texto: {text[:50]}...")
        print(f"   Matches: {matches}")
        print(f"   Tempo: {elapsed:.2f}ms")

        # Verificar se detectou 129021/SP
        if matches:
            for match in matches:
                if match.numero == "129021" and match.uf == "SP":
                    print(f"   ✅ OAB 129021/SP detectada! Score: {match.score_contexto:.2f}")

def test_download_performance():
    """Testa performance de download"""
    print("\n" + "=" * 60)
    print("TESTE 2: Performance de Download")
    print("=" * 60)

    try:
        downloader = ContinuousDownloader()

        # Informações sobre configuração
        print(f"\nConfiguração:")
        print(f"  Tribunais ativos: {len(downloader.tribunais_ativos)}")
        print(f"  Rate limit: {downloader.rate_limiter.max_requests_per_minute} req/min")
        print(f"  Data root: {downloader.data_root}")

        # Tentar baixar um caderno de teste (STF - menor)
        print(f"\n⚠️  ATENÇÃO: Download real da API CNJ")
        print(f"  Testando com STF (tribunal menor)")
        print(f"  Data: {datetime.now().strftime('%Y-%m-%d')}")

        tribunal = "STF"
        data_str = datetime.now().strftime("%Y-%m-%d")

        # Simular download de 1 tribunal
        print(f"\n  Iniciando download de {tribunal}...")
        start = time.time()

        # Nota: Pode falhar se API bloquear IP (403) ou endpoint estiver errado
        # Isso é esperado e vai nos mostrar problemas reais

        print(f"\n  ⚠️  Pulando download real (pode causar bloqueio 403)")
        print(f"  API: https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data_str}/E/download")

    except Exception as e:
        print(f"\n  ❌ Erro: {e}")
        print(f"  Tipo: {type(e).__name__}")

def analyze_architecture():
    """Analisa arquitetura e identifica ineficiências"""
    print("\n" + "=" * 60)
    print("TESTE 3: Análise de Arquitetura e Ineficiências")
    print("=" * 60)

    issues = []

    # 1. Verificar estrutura de diretórios
    print("\n1. Estrutura de Diretórios:")
    base_dir = Path("/home/cmr-auto/claude-work/repos/Claude-Code-Projetos/agentes/djen-tracker")

    required_dirs = ["src", "tests", "docs"]
    for dir_name in required_dirs:
        dir_path = base_dir / dir_name
        exists = dir_path.exists()
        print(f"   {'✅' if exists else '❌'} {dir_name}/")
        if not exists:
            issues.append(f"Diretório {dir_name}/ não existe")

    # 2. Verificar módulos críticos
    print("\n2. Módulos Críticos:")
    critical_modules = [
        "src/oab_matcher.py",
        "src/oab_filter.py",
        "src/pdf_text_extractor.py",
        "src/cache_manager.py",
        "src/tribunais.py",
        "src/continuous_downloader.py"
    ]

    for module in critical_modules:
        module_path = base_dir / module
        exists = module_path.exists()
        if exists:
            size_kb = module_path.stat().st_size / 1024
            print(f"   ✅ {module} ({size_kb:.1f} KB)")
        else:
            print(f"   ❌ {module} (não encontrado)")
            issues.append(f"Módulo {module} não encontrado")

    # 3. Verificar dependências instaladas
    print("\n3. Dependências:")
    try:
        import pdfplumber
        print(f"   ✅ pdfplumber")
    except ImportError:
        print(f"   ❌ pdfplumber (não instalado)")
        issues.append("pdfplumber não instalado")

    try:
        import PyPDF2
        print(f"   ✅ PyPDF2")
    except ImportError:
        print(f"   ❌ PyPDF2 (não instalado)")
        issues.append("PyPDF2 não instalado")

    try:
        import pytest
        print(f"   ✅ pytest")
    except ImportError:
        print(f"   ⚠️  pytest (não instalado - opcional para dev)")

    # 4. Ineficiências potenciais
    print("\n4. Ineficiências Identificadas:")

    potential_issues = [
        {
            "tipo": "Performance",
            "descricao": "Cache pode não estar habilitado por padrão",
            "impacto": "Re-parsing de PDFs desnecessário",
            "sugestao": "Verificar config.json tem cache_enabled: true"
        },
        {
            "tipo": "Rede",
            "descricao": "Download sequencial de 65 tribunais",
            "impacto": "Tempo total ~10min para download completo",
            "sugestao": "Implementar download paralelo ou priorizar tribunais"
        },
        {
            "tipo": "Memória",
            "descricao": "PDFs grandes podem causar memory spike",
            "impacto": "OOM em sistemas com pouca RAM",
            "sugestao": "Processar PDFs em streaming ou limitar tamanho"
        },
        {
            "tipo": "API",
            "descricao": "Bloqueio geográfico 403 para IPs não-brasileiros",
            "impacto": "Sistema não funciona fora do Brasil",
            "sugestao": "Documentar claramente + usar VPN/proxy brasileiro"
        },
        {
            "tipo": "Regex",
            "descricao": "13+ padrões regex executados sequencialmente",
            "impacto": "Latência em textos grandes (>10k linhas)",
            "sugestao": "Combinar padrões ou usar trie para pre-filtering"
        }
    ]

    for i, issue in enumerate(potential_issues, 1):
        print(f"\n   {i}. [{issue['tipo']}] {issue['descricao']}")
        print(f"      Impacto: {issue['impacto']}")
        print(f"      Sugestão: {issue['sugestao']}")

    return issues

def main():
    """Executa todos os testes"""
    print("\n🔍 TESTE COMPLETO DO SISTEMA DJEN-TRACKER")
    print(f"   OAB alvo: 129021/SP")
    print(f"   Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    try:
        # Teste 1: Filtro OAB
        test_oab_filter()

        # Teste 2: Download (simulado)
        test_download_performance()

        # Teste 3: Análise de arquitetura
        issues = analyze_architecture()

        # Resumo
        print("\n" + "=" * 60)
        print("RESUMO FINAL")
        print("=" * 60)

        if issues:
            print(f"\n⚠️  {len(issues)} problemas críticos encontrados:")
            for i, issue in enumerate(issues, 1):
                print(f"   {i}. {issue}")
        else:
            print("\n✅ Nenhum problema crítico encontrado")

        print("\n📊 Próximos Passos:")
        print("   1. Testar com PDF real do DJEN")
        print("   2. Medir tempo de processamento end-to-end")
        print("   3. Otimizar gargalos identificados")
        print("   4. Adicionar monitoramento de performance")

    except Exception as e:
        print(f"\n❌ ERRO CRÍTICO: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()
