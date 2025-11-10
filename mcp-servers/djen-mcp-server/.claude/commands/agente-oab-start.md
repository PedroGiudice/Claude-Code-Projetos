---
description: Inicia o agente de monitoramento contínuo OAB 129021/SP
---

Execute o comando para iniciar o agente de monitoramento de publicações DJEN:

```bash
cd E:/projetos/djen-mcp-server && npx tsx ../agents/monitoramento-oab/main.ts
```

O agente ficará rodando continuamente e realizará:
- Busca imediata ao iniciar
- Busca agendada às 18:30
- Verificação a cada 5 minutos
- Geração automática de relatório em E:/djen-data/Publicacoes-OAB-129021-{data}.txt
