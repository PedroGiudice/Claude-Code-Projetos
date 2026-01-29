# Issues - Lex Vector

## Abertos

### [#2] Modal Cold Start em Todo Job
- **Status:** Aberto
- **Data:** 2026-01-29
- **Componente:** text-extractor / Modal
- **Descricao:** Todo job de extracao inicia com cold start no Modal, baixando modelos (~1.35GB) do zero.
- **Evidencia:** Job c0b07a17 (PDF 24MB) levou 542s (9min), sendo ~5min de cold start
- **Impacto:** Latencia alta (9min para PDF de 24MB), custo computacional extra
- **Solucao Proposta:** Implementar keep-warm ou pre-warming do container Modal

---

## Em Progresso

(nenhum)

---

## Resolvidos

### [#1] CORS para App Tauri
- **Status:** Resolvido
- **Data:** 2026-01-27
- **Solucao:** Adicionadas origins explicitas no CORS middleware do text-extractor

