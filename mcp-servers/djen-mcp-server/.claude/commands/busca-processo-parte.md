---
description: Busca processos DJEN pelo nome de uma parte (autor ou réu)
---

Busque todos os processos onde "**{{ARGS}}**" é parte (autor ou réu) no DJEN.

**DELEGUE ao agente `djen-extractor`:**

```
Task tool com agente djen-extractor:
"Buscar processos onde {{ARGS}} é parte (autor ou réu) no DJEN"
```

O agente fará automaticamente:
1. Busca na API DJEN por nome de parte
2. Agrupamento por número de processo (pode haver múltiplas partes com nomes similares)
3. Salvamento de JSON em `E:/djen-data/parte-{nome}-{timestamp}.json`
4. Geração de relatório com:
   - Lista de processos encontrados (número, tribunal, última publicação)
   - Partes envolvidas em cada processo
   - Advogados identificados
   - Resumo estatístico: total de processos, tribunais frequentes
5. Análise de padrões (se houver anomalias)

**Exemplo de uso:**
- `/busca-processo-parte COMEX DISTRIBUIDORA`
- `/busca-processo-parte Maria da Silva`
- `/busca-processo-parte Banco do Brasil S.A.`
