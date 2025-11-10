---
description: Busca processos DJEN pelo nome de um advogado
---

Busque todos os processos onde "**{{ARGS}}**" atua como advogado no DJEN.

**DELEGUE ao agente `djen-extractor`:**

```
Task tool com agente djen-extractor:
"Buscar processos onde {{ARGS}} atua como advogado no DJEN"
```

O agente fará automaticamente:
1. Busca na API DJEN por nome de advogado
2. Agrupamento por número de processo (advogado pode ter múltiplas atuações)
3. Salvamento de JSON em `E:/djen-data/advogado-{nome}-{timestamp}.json`
4. Geração de relatório com:
   - Lista de processos encontrados (número, tribunal, parte representada, última publicação)
   - Qual parte o advogado representa em cada processo
   - Outros advogados envolvidos
   - Resumo estatístico: total de processos, tribunais frequentes, OAB (se disponível)
   - Distribuição temporal: processos ativos vs arquivados
5. Análise de padrões (se houver anomalias)

**Exemplo de uso:**
- `/busca-processo-advogado João da Silva`
- `/busca-processo-advogado Maria Santos OAB/SP 123456`

**Nota:** A API pode retornar processos de múltiplos advogados com nomes similares. O agente agrupa e identifica automaticamente.
