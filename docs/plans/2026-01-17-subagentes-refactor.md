# Plano: Refatoracao de Subagentes

> **Data:** 2026-01-17
> **Sessao:** Revisao completa de subagentes e infraestrutura
> **Status:** Em Execucao

---

## Resumo da Sessao

### Configuracoes Realizadas

| Item | Status | Detalhes |
|------|--------|----------|
| `ENABLE_TOOL_SEARCH=auto` | Feito | Em `~/.claude/settings.json` |
| MCP `sequential-thinking` | Feito | Adicionado globalmente |
| MCP `magic` (21st.dev) | Feito | Precisa configurar API_KEY |

### Subagentes Removidos

| Subagente | Motivo |
|-----------|--------|
| `vibe-log-report-generator` | Nao usado |
| `analise-dados-legal` | Juridico (fora de escopo) |
| `legal-articles-finder` | Juridico (fora de escopo) |

---

## Plano de Execucao

### FASE 1: Mudar/Editar/Ajustar (Subagentes Existentes)

#### 1.1 `qualidade-codigo.md` - SEPARAR em 3 agentes

**Problema:** Muito abrangente, encoding quebrado, skills inexistentes

**Acao:** Separar em:

| Novo Agente | Responsabilidade | Skills Necessarias |
|-------------|------------------|-------------------|
| `tdd-coach` | Red-Green-Refactor workflow | `test-driven-development` |
| `frontend-auditor` | Tech debt, lint, TS errors | `eslint`, `tsc` |
| `backend-auditor` | Tech debt, ruff, mypy, security | `ruff`, `mypy`, `bandit` |

**Esforco:** Medio

---

#### 1.2 `auth-route-debugger.md` - ATUALIZAR

**Problema:** Referencia Keycloak/Express (projeto antigo)

**Acao:** Atualizar para Basic Auth atual, mas preparar para novo sistema de auth

**Esforco:** Baixo (aguardar definicao do novo auth)

---

#### 1.3 `frontend-developer.md` - ATUALIZAR tools

**Problema:** Referencia `mcp__magic__*` que agora existe

**Acao:** Verificar se tools estao corretos apos adicao do MCP Magic

**Esforco:** Baixo

---

#### 1.4 `backend-architect.md` - ATUALIZAR tools

**Problema:** Referencia `mcp__sequential-thinking__*` que agora existe

**Acao:** Verificar se tools estao corretos apos adicao do MCP

**Esforco:** Baixo

---

#### 1.5 `ai-engineer.md` - ATUALIZAR tools

**Problema:** Referencia `mcp__sequential-thinking__*` que agora existe

**Acao:** Verificar se tools estao corretos apos adicao do MCP

**Esforco:** Baixo

---

### FASE 2: Melhorar (Subagentes Funcionais)

#### 2.1 `gemini-assistant.md` - MELHORAR prompt

**Estado:** Funcional
**Melhoria:** Tornar mais especifico para casos de uso do LW

---

#### 2.2 `cicd-operator.md` - MELHORAR

**Estado:** Funcional e completo
**Melhoria:** Adicionar workflows para OCIR (quando pronto)

---

#### 2.3 `devops-automator.md` - CLARIFICAR escopo

**Estado:** Funcional
**Melhoria:** Clarificar que e para PLANEJAMENTO de pipelines, nao execucao

---

#### 2.4 Todos os demais - REVISAR descriptions

**Acao:** Garantir que descriptions estao claras para trigger automatico

---

### FASE 3: Criar do Zero

#### 3.1 Skills Faltantes

| Skill | Fonte | Acao |
|-------|-------|------|
| `test-driven-development` | [obra/superpowers](https://github.com/obra/superpowers) | Copiar |
| `systematic-debugging` | [obra/superpowers](https://github.com/obra/superpowers) | Copiar |
| `code-auditor` | [trailofbits/skills](https://github.com/trailofbits/skills) | Copiar |
| `root-cause-tracing` | Criar | 5 Whys methodology |
| `verification-before-completion` | Criar | Checklist antes de finalizar |

---

#### 3.2 Novos Subagentes (apos separacao do qualidade-codigo)

| Agente | Responsabilidade |
|--------|------------------|
| `tdd-coach` | TDD workflow, red-green-refactor |
| `frontend-auditor` | Auditoria estatica de React/TS |
| `backend-auditor` | Auditoria estatica de Python/FastAPI |

---

### FASE 4: Configuracoes Pendentes

| Item | Acao | Quem |
|------|------|------|
| Magic API Key | Gerar em https://21st.dev/magic/console | Usuario |
| MCP GitHub | Verificar autenticacao | Usuario |
| MCP Atlassian | Configurar auth se necessario | Usuario |
| MCP Linear | Configurar auth se necessario | Usuario |

---

## Ordem de Execucao Recomendada

```
PRIORIDADE 1 (Bloqueantes)
[_] Usuario: Configurar Magic API Key
[_] Usuario: Copiar skills de obra/superpowers
[_] Usuario: Copiar skills de trailofbits/skills

PRIORIDADE 2 (Separacao do qualidade-codigo)
[_] Criar skill root-cause-tracing
[_] Criar skill verification-before-completion
[_] Criar tdd-coach.md
[_] Criar frontend-auditor.md
[_] Criar backend-auditor.md
[_] Remover qualidade-codigo.md

PRIORIDADE 3 (Atualizacoes)
[_] Atualizar frontend-developer.md (verificar tools Magic)
[_] Atualizar backend-architect.md (verificar tools sequential-thinking)
[_] Atualizar ai-engineer.md (verificar tools sequential-thinking)
[_] Atualizar auth-route-debugger.md (quando auth mudar)

PRIORIDADE 4 (Melhorias)
[_] Melhorar gemini-assistant.md (prompt mais especifico)
[_] Clarificar devops-automator.md (escopo de planejamento)
[_] Revisar descriptions de todos os agentes
```

---

## Principios a Seguir

1. **Separacao de responsabilidades** - Cada agente faz UMA coisa bem
2. **Sandboxing** - Agentes isolados, contextos separados
3. **Skills/MCPs inexistentes = ADICIONAR** - Nao e motivo para remover agente
4. **Descriptions claras** - Para trigger automatico funcionar

---

## Metricas de Sucesso

- [ ] 0 subagentes com encoding quebrado
- [ ] 0 subagentes referenciando skills/MCPs inexistentes
- [ ] Todos os agentes com descriptions claras e especificas
- [ ] Separacao clara: planejamento vs execucao vs auditoria

---

*Plano gerado automaticamente com base na sessao de 2026-01-17*
