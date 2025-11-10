---
description: Busca todas as publicações DJEN de um processo pelo número CNJ
---

Busque todas as publicações do processo **{{ARGS}}** no DJEN.

**DELEGUE ao agente `djen-extractor`:**

Este comando simplesmente invoca o agente especializado que já tem toda a lógica de busca, análise de padrões e detecção de anomalias.

```
Task tool com agente djen-extractor:
"Buscar todas as publicações do processo {{ARGS}} no DJEN"
```

O agente fará automaticamente:
1. Validação do número CNJ (formato e dígitos verificadores)
2. Busca na API DJEN
3. Salvamento de JSON bruto em `E:/djen-data/`
4. **Análise inteligente de padrões** (processos antigos, gaps temporais, acórdão sem sentença, etc.)
5. Geração de relatório com alertas contextualizados
6. Retorno de sumário completo ao usuário

**Não criar scripts manualmente** - o agente djen-extractor já tem toda a infraestrutura necessária.
