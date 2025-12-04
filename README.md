# Claude Code Projetos

Sistema de automacao juridica brasileira com agentes Python.

## Numeros

| Componente | Quantidade |
|------------|------------|
| Agentes Python | 9 |
| Agentes Claude | 30 |
| Skills custom | 17 |
| Skills managed | 7 |
| Comandos | 5 |
| Hooks | 24 |

**Stack:** Python 3.11, Node.js v22, Ubuntu 24.04 (WSL2)

---

## Agentes Python

| Agente | Funcao |
|--------|--------|
| oab-watcher | Monitora Diario OAB |
| djen-tracker | Monitora DJEN |
| legal-lens | Analise NLP |
| legal-text-extractor | OCR de PDFs |
| legal-articles-finder | Busca artigos de leis |
| legal-rag | RAG juridico |
| jurisprudencia-collector | Coleta jurisprudencia |
| stj-dados-abertos | Dados abertos STJ |
| aesthetic-master | Design system |

---

## Comandos

| Comando | Funcao |
|---------|--------|
| fetch-doc | Baixa documentos |
| extract-core | Extrai metadados |
| validate-id | Valida CPF/CNPJ/OAB |
| parse-legal | Parser juridico |
| send-alert | Alertas |

---

## Estrutura

```
Claude-Code-Projetos/
├── .claude/           # Config (agents, hooks, skills managed)
├── agentes/           # 9 agentes Python
├── comandos/          # 5 comandos
├── skills/            # 17 skills custom
└── shared/            # Codigo compartilhado
```

---

## Setup

```bash
cd agentes/oab-watcher
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

---

## Documentacao

| Arquivo | Conteudo |
|---------|----------|
| ARCHITECTURE.md | North Star (arquitetura) |
| CLAUDE.md | Instrucoes operacionais |
| DISASTER_HISTORY.md | Licoes aprendidas |

---

**Atualizacao:** 2025-12-04
