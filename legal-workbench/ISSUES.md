# Issues Conhecidos

Problemas identificados aguardando resolucao.

---

## Abertos

(nenhum no momento)

---

## Resolvidos

### #1 - Text Extractor: "Submission failed: Network Error"

**Modulo:** Text Extractor (frontend/pages/TextExtractorModule)
**Sintoma:** Ao submeter PDF para extracao, erro "Submission failed: Network Error"
**Status:** Resolvido
**Data:** 2026-01-29
**Resolvido em:** 2026-01-29 (commit d218a19)

**Causa Raiz:**
1. CORS invalido: `allow_origins=["*"]` + `allow_credentials=True` viola spec HTTP
2. IP hardcoded em `dynamic.yml` (10.89.0.57) apontava para container antigo

**Solucao:**
- Backend: origins explicitas (tauri://localhost, http://100.114.203.28)
- Frontend: CSP com http://localhost:* para dev
- Frontend: logging melhorado para detectar erro CORS
- Traefik: removida config estatica, usando Docker labels

**Tech Debt Identificado (baixa prioridade):**
- `textExtractorApi.ts`: healthCheck usa string manipulation fragil
- `main.py`: IP Tailscale hardcoded (considerar env var)
