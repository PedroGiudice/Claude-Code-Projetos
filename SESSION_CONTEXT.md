# Contexto de Sessao: LEX-VECTOR / LEGAL-WORKBENCH

## Resumo Executivo

Legal Workbench e uma plataforma de automacao juridica brasileira estruturada como monorepo. O projeto esta em migracao de webapp para aplicativo Tauri.

## Estado Atual

| Componente | Status |
|------------|--------|
| Web App (React SPA) | Funcional |
| Tauri App | Scaffold criado, desenvolvimento inicial |
| Extrator de Texto | Funcional (Marker + Modal GPU) |
| STJ Dados Abertos | Funcional (DuckDB + FTS) |

## Estrutura do Monorepo

```
lex-vector/
├── legal-workbench/
│   ├── frontend/          # React SPA (Vite + React 18)
│   ├── tauri-app/         # App Tauri 2.x (em desenvolvimento)
│   ├── ferramentas/
│   │   ├── legal-text-extractor/  # Extrator com Marker
│   │   ├── stj-dados-abertos/     # API jurisprudencia
│   │   └── ...
│   └── docker/            # Stack Docker (Traefik + services)
├── docs/
│   └── TAURI_CLAUDE_CODE_PLAYBOOK.md  # Guia completo Tauri
└── .claude/
    └── agents/            # Agentes especializados
```

## Extrator de Texto (Prioridade)

**Localizacao:** `legal-workbench/ferramentas/legal-text-extractor/`

### Arquitetura
- **Engine:** Marker (ML-based, GPU-accelerated)
- **Fallback:** pdfplumber (texto nativo)
- **GPU:** Modal API (A100-80GB, ~$3.50/h)
- **Cleaner:** 75+ padroes para 7 sistemas judiciais

### Arquivos Chave
- `main.py` - API principal (LegalTextExtractor)
- `src/engines/marker_engine.py` - Engine Marker
- `src/core/cleaner.py` - DocumentCleaner
- `modal_worker.py` - Worker GPU serverless

### Como Usar
```bash
cd ~/lex-vector/legal-workbench/ferramentas/legal-text-extractor
source .venv/bin/activate
python main.py documento.pdf
```

## Migracao Tauri

### Documentacao
- `docs/TAURI_CLAUDE_CODE_PLAYBOOK.md` (1.280 linhas)
- `.claude/agents/tauri-frontend-dev.md`

### Configuracao Existente
- Tauri 2.x com plugins (dialog, fs, notification, store, opener)
- React 19 + TypeScript no frontend
- Rust backend com tokio, rusqlite

### Status
- [x] Estrutura de projeto criada
- [x] Dependencias instaladas
- [x] Configuracao basica
- [ ] Integracao com APIs backend
- [ ] Componentes nativos completos

## Vedacoes Criticas

1. **NUNCA** manter duas arquiteturas concomitantemente
2. **NUNCA** usar `<input type="file">` em Tauri (usar `dialog.open()`)
3. **NUNCA** usar localStorage em Tauri (usar `store` plugin)
4. **Bun** sempre preferivel a npm/npx

## Comandos Rapidos

```bash
# Frontend web
cd ~/lex-vector/legal-workbench/frontend && bun run dev

# Extrator de texto
cd ~/lex-vector/legal-workbench/ferramentas/legal-text-extractor
source .venv/bin/activate && python main.py arquivo.pdf

# Modal GPU
modal run modal_worker.py --pdf-path arquivo.pdf

# Tauri dev
cd ~/lex-vector/legal-workbench/tauri-app && bun run tauri dev
```

## North Stars

- `ARCHITECTURE.md` - Principios globais
- `legal-workbench/CLAUDE.md` - Regras LW
- `ferramentas/legal-text-extractor/CLAUDE.md` - Regras Marker-only

## Proximos Passos

1. Integrar extrator de texto no Tauri app
2. Implementar componentes nativos (dialog, fs)
3. Conectar com APIs backend existentes
