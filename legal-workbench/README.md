# Legal Workbench

Dashboard integrado para ferramentas juridicas.

## Quick Start

```bash
# Iniciar Legal-Workbench (Streamlit)
lw

# Verificar ClaudeCodeUI (PM2)
ccui-status
```

## Acesso

| Servico | Local | Mobile (Tailscale) |
|---------|-------|-------------------|
| Legal-Workbench | http://localhost:8501 | http://100.x.x.x:8501 |
| ClaudeCodeUI | http://localhost:3001 | http://100.x.x.x:3001 |

## Modulos

- **Dashboard** - Status do sistema
- **Jurisprudence Search** - Busca de jurisprudencia
- **Document Assembler** - Montagem de documentos
- **Case Analytics** - Analise de casos (disabled)

## Tools

- **Claude Code UI** - Interface web para Claude CLI (via sidebar)

## Mobile

1. Instale Tailscale no celular
2. Autentique com mesma conta
3. Acesse `http://100.x.x.x:3001`
4. Adicione a home screen (PWA)

## Aliases

```bash
lw              # Inicia Legal-Workbench
ccui-status     # Status do PM2
ccui-logs       # Logs do claudecodeui
ccui-restart    # Reinicia claudecodeui
```

## Arquitetura

```
legal-workbench/
├── app.py              # Dashboard Streamlit (porta 8501)
├── config.yaml         # Configuracao
├── ferramentas/        # Modulos integrados
│   ├── claude-ui/      # ARCHIVED - substituido por siteboon/claudecodeui
│   ├── legal-text-extractor/
│   ├── legal-doc-assembler/
│   ├── prompt-library/
│   ├── stj-dados-abertos/
│   └── trello-mcp/
└── README.md
```

## Servicos Externos

- **ClaudeCodeUI** (siteboon/claudecodeui) - Gerenciado via PM2
  - Porta: 3001
  - Config: `~/pm2-ecosystem.config.js`
  - Logs: `~/.pm2/logs/claude-code-ui-*.log`
