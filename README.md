# Claude Code Projetos

Sistema de automacao juridica brasileira. Monitoramento de publicacoes, extracao de documentos, analise NLP e RAG juridico.

## Stack

- **Runtime:** Python 3.11, Node.js v22
- **Ambiente:** Ubuntu 24.04 (WSL2)
- **Orquestracao:** Claude Code com hooks e skills

## Estrutura do Projeto

| Diretorio | Proposito | Quando Usar |
|-----------|-----------|-------------|
| `agentes/` | Processos autonomos (monitoramento continuo) | Tarefas que rodam em background |
| `ferramentas/` | Utilitarios sob demanda | Tarefas pontuais invocadas manualmente |
| `comandos/` | CLI scripts | Operacoes atomicas (fetch, parse, validate) |
| `mcp-servers/` | Servidores MCP | Integracao com Claude Code |
| `legal-workbench/` | Ambiente de trabalho legal | UI/dashboard juridico |
| `shared/` | Codigo compartilhado | Utils, path helpers, memoria |
| `skills/` | Skills custom | Guidelines especializadas |
| `.claude/` | Config Claude Code | Agents, hooks, skills managed |

## Comandos Essenciais

```bash
# Executar agente
cd agentes/<nome> && source .venv/bin/activate && python main.py

# Validar hooks
tail -50 ~/.vibe-log/hooks.log

# Testar ferramenta
cd ferramentas/<nome> && source .venv/bin/activate && pytest
```

## Documentacao

| Arquivo | Conteudo |
|---------|----------|
| `CLAUDE.md` | Regras operacionais para Claude Code |
| `ARCHITECTURE.md` | North Star (principios inviolaveis) |
| `DISASTER_HISTORY.md` | Licoes aprendidas de falhas |

## Hierarquia de Rules

```
CLAUDE.md              # Root: regras globais
agentes/CLAUDE.md      # Regras para agentes Python
ferramentas/CLAUDE.md  # Regras para ferramentas
```

Regras mais especificas (subdiretorio) complementam as regras globais.

## Task Execution Patterns

- **Swarm**: Medium-complex tasks with parallel subagents
- **Breakdown**: Decompose large tasks into atomic units before execution
