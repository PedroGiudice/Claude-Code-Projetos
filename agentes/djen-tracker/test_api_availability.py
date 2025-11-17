#!/usr/bin/env python3
"""
Teste de disponibilidade da API DJEN
Valida endpoint com múltiplas datas e tribunais
"""
import requests
from datetime import datetime, timedelta
from typing import List, Tuple

def test_endpoint(tribunal: str, data: str, meio: str = 'E') -> Tuple[int, str]:
    """
    Testa endpoint da API DJEN.

    Returns:
        (status_code, mensagem)
    """
    url = f"https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/{meio}/download"

    try:
        response = requests.head(url, timeout=10)
        return (response.status_code, f"{response.status_code} - {response.reason}")
    except requests.RequestException as e:
        return (0, f"Erro: {e}")

def main():
    """Executa bateria de testes"""
    print("=" * 80)
    print("TESTE DE DISPONIBILIDADE API DJEN")
    print("=" * 80)

    # Tribunais para testar
    tribunais = ["STF", "TJSP", "TRF1"]

    # Datas para testar (últimos 30 dias)
    hoje = datetime.now()
    datas = []
    for i in range(30):
        data = hoje - timedelta(days=i)
        # Pular fins de semana (5=sábado, 6=domingo)
        if data.weekday() < 5:
            datas.append(data.strftime("%Y-%m-%d"))

    print(f"\nTestando {len(tribunais)} tribunais × {len(datas)} datas = {len(tribunais) * len(datas)} requisições")
    print(f"Tribunais: {', '.join(tribunais)}")
    print(f"Range: {datas[-1]} até {datas[0]}\n")

    # Executar testes
    resultados_ok = []
    resultados_404 = []
    resultados_erro = []

    for tribunal in tribunais:
        print(f"\n[{tribunal}]")
        for data in datas:
            status, msg = test_endpoint(tribunal, data)

            if status == 200:
                resultados_ok.append((tribunal, data, msg))
                print(f"  ✅ {data}: {msg}")
            elif status == 404:
                resultados_404.append((tribunal, data, msg))
                # Não printar 404s (esperado)
            else:
                resultados_erro.append((tribunal, data, msg))
                print(f"  ❌ {data}: {msg}")

    # Resumo
    print("\n" + "=" * 80)
    print("RESUMO")
    print("=" * 80)

    total = len(tribunais) * len(datas)
    print(f"\n✅ 200 OK: {len(resultados_ok)}/{total} ({len(resultados_ok)/total*100:.1f}%)")
    print(f"❌ 404 Not Found: {len(resultados_404)}/{total} ({len(resultados_404)/total*100:.1f}%)")
    print(f"⚠️  Outros erros: {len(resultados_erro)}/{total}")

    if resultados_ok:
        print(f"\n📄 Cadernos encontrados ({len(resultados_ok)}):")
        for tribunal, data, msg in resultados_ok[:10]:  # Primeiros 10
            print(f"   {tribunal} - {data}")
        if len(resultados_ok) > 10:
            print(f"   ... e mais {len(resultados_ok) - 10}")

    # Análise
    print("\n" + "=" * 80)
    print("ANÁLISE")
    print("=" * 80)

    if len(resultados_ok) > 0:
        print("\n✅ API está FUNCIONAL")
        print("   Endpoint correto: https://comunicaapi.pje.jus.br/api/v1/caderno/{tribunal}/{data}/E/download")
        print("   Formato de data: YYYY-MM-DD")

        # Detectar padrão de publicação
        datas_disponiveis = [data for _, data, _ in resultados_ok]
        dias_semana = [datetime.strptime(d, "%Y-%m-%d").strftime("%A") for d in datas_disponiveis]

        print(f"\n   Padrão de publicação:")
        from collections import Counter
        contador = Counter(dias_semana)
        for dia, count in contador.most_common():
            print(f"   - {dia}: {count} publicações")

    elif len(resultados_404) == total:
        print("\n⚠️  100% de respostas 404")
        print("   Possíveis causas:")
        print("   1. ✅ Comportamento normal: sem publicações no período testado")
        print("   2. ⚠️  Restrição geográfica: API pode bloquear IPs não-brasileiros")
        print("   3. ⚠️  Período de testes incorreto: publicações podem ter delay ou janela específica")
        print("\n   Recomendação: Testar com período mais amplo (ex: 6 meses)")

    else:
        print("\n❌ API com problemas")
        print(f"   Erros não-404: {len(resultados_erro)}")
        for tribunal, data, msg in resultados_erro[:5]:
            print(f"   - {tribunal} {data}: {msg}")

    print("\n" + "=" * 80)

if __name__ == "__main__":
    main()
