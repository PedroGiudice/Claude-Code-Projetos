# Lex-Vector (LV)

> **Idioma:** Português brasileiro com acentuação correta. "eh" em vez de "é" é inaceitável.

Plataforma de automação jurídica brasileira. Extração de documentos PDF, análise com LLM, e organização de dados jurídicos.

> **Nota:** O diretório `legal-workbench/` é o nome de código interno do projeto Lex-Vector.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind, Shadcn/UI |
| Backend | Python 3.12, FastAPI |
| PDF Extraction | Marker (deep learning), pdfplumber (fallback) |
| LLM | Google Gemini |
| Database | PostgreSQL (Supabase) |
| Package Managers | Bun (frontend), uv (backend) |
| Containers | Docker, Docker Compose |

## Estrutura

```
legal-workbench/
├── frontend/        # Next.js SPA
├── ferramentas/     # Python backends e tools
│   └── legal-text-extractor/  # LTE (Marker + Gemini)
├── docker/          # Serviços Docker
└── docs/            # Documentação
```

## Serviços

| Serviço | Porta | Propósito |
|---------|-------|-----------|
| legal-frontend | 3000 | Interface Next.js |
| legal-api | 8000 | API principal |

## Comandos

```bash
# Subir ambiente
cd legal-workbench && docker compose up -d

# Frontend dev
cd legal-workbench/frontend && bun install && bun run dev

# LTE dev
cd legal-workbench/ferramentas/legal-text-extractor && source .venv/bin/activate && python main.py
```

## Documentação

| Arquivo | Conteúdo |
|---------|----------|
| `CLAUDE.md` | Regras operacionais para Claude Code |
| `ARCHITECTURE.md` | North Star (princípios invioláveis) |
| `legal-workbench/CLAUDE.md` | Regras específicas do LV |

## Task Execution Patterns

- **Swarm**: Tarefas médio-complexas com subagentes paralelos
- **Breakdown**: Decompor tarefas grandes em unidades atômicas antes da execução

> **Terminologia:** "Subagentes" são Task tools (`.claude/agents/*.md`) executados via Claude Code. "Agentes" ADK autônomos estão em repositório separado.

## Git

**OBRIGATÓRIO:**

1. **Branch para alterações significativas** — >3 arquivos OU mudança estrutural = criar branch
2. **Pull antes de trabalhar** — `git pull origin main`
3. **Commit ao finalizar** — Nunca deixar trabalho não commitado
4. **Deletar branch após merge** — Local e remota

## Experimental Projects

Projetos experimentais foram migrados para [claude-experiments](https://github.com/PedroGiudice/claude-experiments).
