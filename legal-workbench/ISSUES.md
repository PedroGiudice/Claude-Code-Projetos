# Issues Conhecidos

Problemas identificados aguardando resolucao.

---

## Abertos

### #1 - Text Extractor: "Submission failed: Network Error"

**Modulo:** Text Extractor (frontend/pages/TextExtractorModule)
**Sintoma:** Ao submeter PDF para extracao, erro "Submission failed: Network Error"
**Status:** Aberto
**Data:** 2026-01-29

**Contexto:**
- App Tauri conectando ao backend via Tailscale
- Backend LTE rodando em Modal (serverless)

**Hipoteses:**
1. CORS bloqueando request do Tauri
2. Endpoint do Modal nao acessivel
3. Timeout na conexao

**Proximos passos:**
- [ ] Verificar logs do DevTools (Network tab)
- [ ] Testar endpoint diretamente via curl
- [ ] Verificar configuracao CORS no backend

---

## Resolvidos

(nenhum ainda)
