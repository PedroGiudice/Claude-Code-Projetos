# TUI Elite Squad - Manifest

**Status:** OPERACIONAL
**Versao:** 1.0.0
**Data:** 2025-11-28

---

## Visao Geral

Squad de 4 agentes especializados + 1 generalista para desenvolvimento TUI com Textual.

**Principio:** Separacao de responsabilidades (SoC) com shared knowledge base.

---

## Agentes

| Agente | Role | Tools | Output |
|--------|------|-------|--------|
| `tui-architect` | Planejamento | Read, Grep, Glob | Diagramas, specs (MD) |
| `tui-designer` | TCSS/Temas | Read, Write, Edit, Glob, Grep | Arquivos .tcss, *_theme.py |
| `tui-developer` | Python | All | Widgets, screens, workers |
| `tui-debugger` | Diagnostico | Read, Bash, Grep, Glob | Relatorios de bugs |
| `tui-master` | Generalista | All | Qualquer coisa simples |

---

## Workflow Padrao

```
                    TAREFA TUI
                        |
                        v
               +------------------+
               | Claude Principal |
               | (Orquestrador)   |
               +------------------+
                        |
          +-------------+-------------+
          |                           |
          v                           v
    Tarefa Complexa?            Tarefa Simples?
          |                           |
          v                           v
    tui-architect              tui-master
    (planeja)                  (faz direto)
          |
          v
    +-----+-----+
    |           |
    v           v
tui-designer  tui-developer
(TCSS)        (Python)
    |           |
    +-----+-----+
          |
          v
    tui-debugger
    (valida)
```

---

## Regras de Invocacao

### Claude Principal DEVE:

1. **Avaliar complexidade** antes de invocar agentes
2. **Invocar tui-master** para tarefas simples (< 3 arquivos)
3. **Invocar especializados** para tarefas complexas
4. **Seguir workflow sequencial** quando ha dependencias
5. **Consolidar outputs** dos agentes para o usuario

### Claude Principal NAO DEVE:

1. Invocar multiplos especializados em paralelo sem coordenacao
2. Pular etapas do workflow (ex: designer antes de architect)
3. Fazer o trabalho que caberia aos agentes
4. Ignorar handoffs sugeridos pelos agentes

---

## Protocolos de Handoff

### Architect -> Designer/Developer

```markdown
## Handoff: tui-architect -> tui-designer

### Arquivos TCSS a criar:
- src/styles/widgets.tcss (classes listadas no spec)
- src/themes/new_theme.py (se necessario)

### Classes CSS requeridas:
- .panel-main
- .status-active
- .error-highlight

---

## Handoff: tui-architect -> tui-developer

### Widgets a implementar:
- StatusWidget (src/widgets/status.py)
- ProgressPanel (src/widgets/progress.py)

### Messages a definir:
- ProcessStarted(task_id: str)
- ProcessCompleted(result: dict)

### Specs detalhadas:
Ver docs/TUI_ARCHITECTURE.md
```

### Designer -> Developer

```markdown
## Handoff: tui-designer -> tui-developer

### Classes CSS adicionadas:
- .progress-bar (animacao via Python)
- .step-indicator (toggle de estados)

### Toggle de classes necessario:
- add_class("active") quando step ativo
- remove_class("active") quando step completo

### Responsividade:
- Widget deve implementar on_resize()
```

### Developer -> Debugger

```markdown
## Handoff: tui-developer -> tui-debugger

### Widgets implementados:
- src/widgets/status.py
- src/widgets/progress.py

### Verificacoes requeridas:
- [ ] Timer leaks em status.py
- [ ] Message flow correto
- [ ] Performance com muitos items
```

### Debugger -> Developer/Designer

```markdown
## Diagnostico Completo

### Bugs Encontrados:

**Para tui-developer:**
1. Timer leak em status.py:45 - falta on_unmount()
2. Message attribute 'task_id' inconsistente

**Para tui-designer:**
1. var(--color) em widgets.tcss:23 - trocar por $color

### Prioridade: ALTO

### Verificacao pos-fix:
```bash
grep -r "var(--" src/styles/  # deve ser vazio
./scripts/check_timer_leaks.sh  # deve passar
```
```

---

## Casos de Uso

### Caso 1: Novo Widget Complexo

```
1. Invoca tui-architect
   -> Output: spec em docs/WIDGET_SPEC.md

2. Em paralelo:
   - tui-designer cria TCSS
   - tui-developer cria Python

3. tui-debugger valida integracao
```

### Caso 2: Fix de Bug Visual

```
1. tui-debugger diagnostica
   -> Output: relatorio com causa

2. tui-designer ou tui-developer aplica fix
   (dependendo se CSS ou Python)

3. tui-debugger valida novamente
```

### Caso 3: Novo Tema

```
1. tui-designer apenas
   -> Cria arquivo theme em src/themes/
   -> Registra em app.py (ou sugere ao developer)
```

### Caso 4: Refactoring de Widget Existente

```
1. tui-architect analisa estrutura atual
2. tui-developer refatora Python
3. tui-designer ajusta TCSS se necessario
4. tui-debugger valida que nada quebrou
```

---

## Shared Knowledge Base

**TODOS os agentes DEVEM consultar `skills/tui-core/` antes de agir.**

| Arquivo | Uso |
|---------|-----|
| `KNOWLEDGE_INDEX.md` | Indice central (ler primeiro) |
| `rules.md` | SEMPRE - antes de qualquer TCSS |
| `tcss-reference.md` | Propriedades CSS validas |
| `patterns.md` | Padroes de codigo |
| `theme-guide.md` | Sistema de temas |
| `widget-catalog.md` | Widgets disponiveis |
| `bug-patterns.md` | Bugs conhecidos |
| `debugging-guide.md` | Workflow de debug |

---

## Metricas de Sucesso

### Por Agente:

- **tui-architect:** Spec completa e clara
- **tui-designer:** Zero erros de sintaxe TCSS
- **tui-developer:** Zero timer leaks, messages consistentes
- **tui-debugger:** Bugs identificados corretamente
- **tui-master:** Tarefa concluida sem quebrar nada

### Geral:

- App executa sem erros
- Temas aplicam corretamente
- Performance aceitavel
- Codigo segue patterns do knowledge base

---

## Troubleshooting

### "Agente nao encontrado"

Agentes so ficam disponiveis apos reiniciar sessao Claude Code.
Ver CLAUDE.md > "Custom Agents - Descoberta e Registro".

### "Agente fez trabalho errado"

1. Verificar se prompt foi claro sobre restricoes
2. Agentes tem hard constraints - se violou, e bug do prompt

### "Conflito entre agentes"

1. Claude Principal e o orquestrador
2. Seguir workflow: architect -> designer/developer -> debugger
3. Nao invocar em paralelo sem coordenacao

---

## Evolucao

### Proximos Passos:

- [ ] Script de verificacao automatica pos-debug
- [ ] Templates de handoff pre-formatados
- [ ] Metricas de uso por agente

### Historico:

- 2025-11-28: Criacao inicial da squad
