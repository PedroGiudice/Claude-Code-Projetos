# TUI Core Knowledge Index

**LEIA ESTE ARQUIVO PRIMEIRO** - Indice central do conhecimento TUI compartilhado.

---

## Arquivos por Ordem de Prioridade

| Prioridade | Arquivo | Descricao | Quando Usar |
|------------|---------|-----------|-------------|
| 1 | `rules.md` | Anti-alucinacao TCSS | SEMPRE - antes de qualquer codigo |
| 2 | `tcss-reference.md` | Referencia completa CSS/TCSS | Ao escrever estilos |
| 3 | `patterns.md` | Padroes de layout e widgets | Ao estruturar componentes |
| 4 | `theme-guide.md` | Sistema de temas Textual | Ao criar/modificar temas |
| 5 | `widget-catalog.md` | Catalogo de widgets | Ao escolher componentes |
| 6 | `bug-patterns.md` | Bugs criticos e solucoes | Ao debugar problemas |
| 7 | `debugging-guide.md` | Workflow de debug | Ao investigar issues |

---

## Leitura Obrigatoria por Agente

| Agente | Arquivos Obrigatorios | Arquivos Opcionais |
|--------|----------------------|-------------------|
| tui-architect | rules, patterns | widget-catalog |
| tui-designer | rules, tcss-reference, theme-guide | patterns |
| tui-developer | rules, patterns, widget-catalog | bug-patterns |
| tui-debugger | rules, debugging-guide, bug-patterns | todos |
| tui-master | TODOS | - |

---

## Resumo de Cada Arquivo

### rules.md (207 linhas)
**Conteudo:** Lista de propriedades CSS que NAO existem no Textual, sintaxe correta de variaveis ($name vs var(--name)), unidades validas, tipos de borda.

**Use quando:** Antes de escrever QUALQUER codigo TCSS para evitar erros de sintaxe.

### tcss-reference.md (~500 linhas)
**Conteudo:** Referencia completa de 88 propriedades TCSS suportadas, breaking changes entre versoes, pseudo-classes, formatos de cor.

**Use quando:** Precisa saber se uma propriedade existe ou como usa-la corretamente.

### patterns.md (461 linhas)
**Conteudo:** Padroes de arquitetura de widgets, comunicacao via mensagens, propriedades reativas, layouts (docking, grid, responsive).

**Use quando:** Estruturando novos widgets ou telas.

### theme-guide.md (~150 linhas)
**Conteudo:** Sistema de 11 cores base, variaveis auto-geradas, como criar temas customizados, registro de temas no App.

**Use quando:** Criando ou modificando temas visuais.

### widget-catalog.md (~200 linhas)
**Conteudo:** DataTable, Tree, Input, Button, Modal, TabbedContent - patterns de uso e estilizacao. Third-party widgets recomendados.

**Use quando:** Escolhendo qual widget usar ou como estiliza-lo.

### bug-patterns.md (~150 linhas)
**Conteudo:** 6 bugs criticos documentados (timer leaks, CSS variable syntax, message contracts), solucoes e verificacoes.

**Use quando:** Debugando problemas ou antes de commitar codigo.

### debugging-guide.md (~100 linhas)
**Conteudo:** textual console + --dev mode, logging, inspecao de DOM, problemas comuns e solucoes.

**Use quando:** Investigando por que algo nao funciona.

---

## Projetos de Referencia no Repositorio

**Implementacoes completas para consulta:**

| Projeto | Localizacao | Destaque |
|---------|-------------|----------|
| legal-extractor-tui | `legal-extractor-tui/` | Widgets customizados, extraction pipeline |
| tui-template | `tui-template/` | 5 temas, spinners, powerline widgets |

**Documentacao original (fontes primarias):**

| Documento | Localizacao |
|-----------|-------------|
| Guia CSS/TCSS completo | `legal-extractor-tui/Guia-completo-de-CSS-TCSS-Textual-0.80.0.md` |
| Research TUI templates | `legal-extractor-tui/Research-templates-guidance-TUI-TEXTUAL.md` |
| Bug fixes aplicados | `tui-template/BUG_FIXES_APPLIED.md` |
| Message contracts | `tui-template/MESSAGE_CONTRACT_FIXES.md` |

---

## Links Externos Essenciais

**Documentacao Oficial Textual:**
- CSS Guide: https://textual.textualize.io/guide/CSS/
- Theme/Design: https://textual.textualize.io/guide/design/
- Layout Guide: https://textual.textualize.io/guide/layout/
- Widget Gallery: https://textual.textualize.io/widget_gallery/

**Showcase Apps (referencia de design):**
- Harlequin (SQL IDE): https://github.com/tconbeer/harlequin
- Posting (HTTP client): https://github.com/darrenburns/posting
- Dolphie (MySQL monitor): https://github.com/charles-001/dolphie

**Catalogo de Widgets:**
- transcendent-textual: https://github.com/davep/transcendent-textual

---

## Regra de Ouro

**NUNCA assuma conhecimento proprio sobre TCSS/Textual.**

Antes de implementar qualquer estilo ou widget:
1. Leia `rules.md` para evitar erros de sintaxe
2. Consulte `tcss-reference.md` para verificar se a propriedade existe
3. Use `patterns.md` para seguir padroes aprovados

**Se nao esta documentado aqui, consulte a documentacao oficial ou pergunte.**
