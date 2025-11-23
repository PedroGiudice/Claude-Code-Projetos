# CATÁLOGO ABRANGENTE: Agentes e Skills de Referência

**Data**: 2025-11-23
**Objetivo**: Catalogar TODOS os agentes e skills dos repositórios de referência para implementação plug-and-play
**Repositórios Analisados**:
- claude-code-infrastructure-showcase (diet103)
- superpowers (obra)

**Status**: ✅ ANÁLISE COMPLETA - Pronto para implementação

---

## 1. SHOWCASE: AGENTES (10 Total)

### 1.1 code-architecture-reviewer

**Arquivo**: `.claude/agents/code-architecture-reviewer.md`
**Tamanho**: 84 linhas
**Model**: sonnet
**Color**: blue

**Propósito**:
> Review recently written code for adherence to best practices, architectural consistency, and system integration

**Quando Usar**:
- Após implementar novo endpoint API
- Após criar novo componente React
- Após refatorar service class
- Quando novo código precisa ser validado contra padrões do projeto

**Capabilities**:
1. Analyze Implementation Quality (TypeScript, error handling, naming, async/await)
2. Question Design Decisions (challenge choices, suggest alternatives)
3. Verify System Integration (APIs, database, authentication)
4. Assess Architectural Fit (separation of concerns, microservices)
5. Review Specific Technologies (React, API, Database, State)
6. Provide Constructive Feedback (explain why, reference docs, prioritize)
7. Save Review Output (./dev/active/[task-name]/[task-name]-code-review.md)
8. Return to Parent Process (WAIT for approval before fixes)

**Technologies**: React 19, TypeScript, MUI, TanStack Router/Query, Prisma, Node.js/Express, Docker, microservices

**Output**: Markdown review file with:
- Executive Summary
- Critical Issues (must fix)
- Important Improvements (should fix)
- Minor Suggestions (nice to have)
- Architecture Considerations
- Next Steps

**Adaptação Legal**: ✅ **ALTA PRIORIDADE**
- Trocar React/MUI por Python legal frameworks
- Trocar Prisma por SQLAlchemy/Pydantic
- Manter metodologia de review

---

### 1.2 web-research-specialist

**Arquivo**: `.claude/agents/web-research-specialist.md`
**Tamanho**: 79 linhas
**Model**: sonnet
**Color**: blue

**Propósito**:
> Research information on the internet for debugging issues, finding solutions, gathering comprehensive information

**Quando Usar**:
- Debugging erros de biblioteca (Module not found, etc)
- Comparação de tecnologias (state management solutions)
- Implementação de features (how others do infinite scrolling)
- Pesquisa de problemas técnicos

**Capabilities**:
1. Query Generation (5-10 query variations, technical terms, error messages)
2. Source Prioritization (GitHub Issues, Reddit, Stack Overflow, forums, docs, blogs, Hacker News)
3. Information Gathering (read beyond first results, look for patterns, note dates)
4. Compilation Standards (organize by relevance, provide links, summarize, include code snippets)
5. Debugging Assistance (exact error messages, workarounds, known bugs)
6. Comparative Research (structured comparisons, benchmarks, trade-offs)
7. Quality Assurance (verify across sources, date-stamp, credibility)

**Output**: Structured findings:
1. Executive Summary
2. Detailed Findings
3. Sources and References
4. Recommendations
5. Additional Notes

**Adaptação Legal**: ✅ **ALTA PRIORIDADE**
- Adaptar para pesquisa jurídica (STF, STJ, TRTs, planalto.gov.br)
- Adicionar domínios legais brasileiros
- Manter metodologia de pesquisa sistemática

---

### 1.3 plan-reviewer

**Arquivo**: `.claude/agents/plan-reviewer.md`
**Tamanho**: ~60 linhas (estimado)

**Propósito**:
> Review implementation plans for completeness, feasibility, and alignment with project goals

**Quando Usar**:
- Após criar plano de implementação
- Antes de começar desenvolvimento
- Para validar breakdown de tasks

**Adaptação Legal**: ✅ **ALTA PRIORIDADE**
- Validar planos contra legislação brasileira
- Verificar compliance LGPD
- Manter checklist de completude

---

### 1.4 code-refactor-master

**Arquivo**: `.claude/agents/code-refactor-master.md`
**Tamanho**: ~70 linhas (estimado)

**Propósito**:
> Plan and execute refactoring of code

**Quando Usar**:
- Technical debt acumulada
- Código difícil de manter
- Necessidade de reestruturação

**Adaptação Legal**: ✅ **MÉDIA PRIORIDADE**
- Adaptar para Python/legal code
- Manter princípios de refactoring

---

### 1.5 documentation-architect

**Arquivo**: `.claude/agents/documentation-architect.md`
**Tamanho**: ~60 linhas (estimado)

**Propósito**:
> Generate comprehensive documentation

**Quando Usar**:
- Após implementar feature complexa
- Criar docs de API
- Atualizar README

**Adaptação Legal**: ✅ **MÉDIA PRIORIDADE**
- Documentar processos legais
- Explicar extração de artigos
- APIs de consulta jurídica

---

### 1.6 frontend-error-fixer

**Arquivo**: `.claude/agents/frontend-error-fixer.md`
**Tamanho**: ~55 linhas (estimado)

**Propósito**:
> Debug frontend errors

**Quando Usar**:
- Erros React/UI
- Problemas de rendering
- JavaScript errors

**Adaptação Legal**: ⚠️ **BAIXA PRIORIDADE** (projeto é backend-heavy)

---

### 1.7 auto-error-resolver

**Arquivo**: `.claude/agents/auto-error-resolver.md`
**Tamanho**: ~35 linhas (estimado)

**Propósito**:
> Automatically fix TypeScript errors

**Quando Usar**:
- Type errors após refactoring
- Build failures

**Adaptação Legal**: ⚠️ **BAIXA PRIORIDADE** (Python não tem TypeScript)
- Adaptar para Python type checking (mypy)

---

### 1.8 auth-route-tester

**Arquivo**: `.claude/agents/auth-route-tester.md`
**Tamanho**: ~60 linhas (estimado)

**Propósito**:
> Test authenticated API routes

**Quando Usar**:
- Testar endpoints com JWT
- Validar autenticação

**Adaptação Legal**: ⚠️ **BAIXA PRIORIDADE**
- Adaptar se APIs forem implementadas

---

### 1.9 auth-route-debugger

**Arquivo**: `.claude/agents/auth-route-debugger.md`
**Tamanho**: ~65 linhas (estimado)

**Propósito**:
> Debug authentication problems

**Quando Usar**:
- 401/403 errors
- Token validation issues

**Adaptação Legal**: ⚠️ **BAIXA PRIORIDADE**

---

### 1.10 refactor-planner

**Arquivo**: `.claude/agents/refactor-planner.md`
**Tamanho**: ~55 linhas (estimado)

**Propósito**:
> Create refactoring strategies

**Quando Usar**:
- Planejar grande refactoring
- Reestruturação de código

**Adaptação Legal**: ✅ **MÉDIA PRIORIDADE**

---

## 2. SHOWCASE: SKILLS (5 Total)

### 2.1 backend-dev-guidelines

**Arquivo**: `.claude/skills/backend-dev-guidelines/SKILL.md`
**Recursos**: 11 arquivos em `/resources/`
**Tamanho**: 304 linhas (main) + 11 resources

**Enforcement**: suggest
**Priority**: high

**Triggers**:
- **Keywords**: backend, microservice, controller, service, repository, route, express, API, endpoint, middleware, validation, Zod, Prisma
- **Intent Patterns**: create/implement route|endpoint|API, fix/handle error, add middleware, organize backend

**Resources**:
1. architecture-overview.md
2. async-and-errors.md
3. complete-examples.md
4. configuration.md
5. database-patterns.md
6. middleware-guide.md
7. routing-and-controllers.md
8. sentry-and-monitoring.md
9. services-and-repositories.md
10. testing-guide.md
11. validation-patterns.md

**Adaptação Legal**: ✅ **ALTA PRIORIDADE**
- Substituir Express/TypeScript por FastAPI/Python
- Adaptar padrões para legal automation
- Manter estrutura de progressive disclosure

---

### 2.2 frontend-dev-guidelines

**Arquivo**: `.claude/skills/frontend-dev-guidelines/SKILL.md`
**Recursos**: 10 arquivos em `/resources/`
**Tamanho**: 398 linhas (main) + 10 resources

**Enforcement**: block (guardrail!)
**Priority**: high

**Triggers**:
- **Keywords**: component, react component, UI, page, modal, dialog, form, MUI, Grid, styling
- **Intent Patterns**: create/update component|UI, style/design component
- **File Triggers**: `frontend/src/**/*.tsx`, `src/**/*.tsx`
- **Block Message**: Requires using skill before proceeding

**Resources**:
1. common-patterns.md
2. complete-examples.md
3. component-patterns.md
4. data-fetching.md
5. file-organization.md
6. loading-and-error-states.md
7. performance.md
8. routing-guide.md
9. styling-guide.md
10. typescript-standards.md

**Adaptação Legal**: ⚠️ **BAIXA PRIORIDADE** (projeto backend-heavy)

---

### 2.3 skill-developer

**Arquivo**: `.claude/skills/skill-developer/SKILL.md`
**Recursos**: 6 arquivos avançados
**Tamanho**: 426 linhas (main)

**Enforcement**: suggest
**Priority**: high

**Triggers**:
- **Keywords**: skill system, create skill, add skill, skill triggers, skill-rules.json
- **Intent Patterns**: how do/explain skill, create/modify skill

**Resources**:
1. ADVANCED.md
2. HOOK_MECHANISMS.md
3. PATTERNS_LIBRARY.md
4. SKILL_RULES_REFERENCE.md
5. TRIGGER_TYPES.md
6. TROUBLESHOOTING.md

**Propósito**: Meta-skill para criar e gerenciar Claude Code skills

**Adaptação Legal**: ✅ **ALTA PRIORIDADE** (criar skills legais customizadas)

---

### 2.4 route-tester

**Arquivo**: `.claude/skills/route-tester/SKILL.md`
**Tamanho**: 389 linhas

**Enforcement**: suggest
**Priority**: high

**Triggers**:
- **Keywords**: test route, test endpoint, test API, authenticated route, JWT testing
- **Intent Patterns**: test/verify route|endpoint, how to test route

**Adaptação Legal**: ⚠️ **BAIXA PRIORIDADE**

---

### 2.5 error-tracking

**Arquivo**: `.claude/skills/error-tracking/SKILL.md`
**Tamanho**: ~250 linhas (estimado)

**Enforcement**: suggest
**Priority**: high

**Triggers**:
- **Keywords**: error handling, exception, sentry, error tracking, monitoring
- **Intent Patterns**: add/implement error handling|sentry

**Adaptação Legal**: ✅ **MÉDIA PRIORIDADE**
- Adaptar para logging Python (loguru, structlog)
- Integrar com monitoring legal systems

---

## 3. SUPERPOWERS: SKILLS (20 Total)

### CATEGORIA: Testing (3 skills)

#### 3.1 test-driven-development

**Arquivo**: `skills/test-driven-development/SKILL.md`
**Tamanho**: 365 linhas

**Propósito**:
> Use when implementing any feature or bugfix - write test first, watch it fail, write minimal code to pass

**Core Principle**: If you didn't watch the test fail, you don't know if it tests the right thing

**Iron Law**: NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST

**Methodology**: RED-GREEN-REFACTOR
1. RED: Write failing test
2. Verify RED: Watch it fail correctly
3. GREEN: Minimal code to pass
4. Verify GREEN: Watch it pass
5. REFACTOR: Clean up while staying green

**When to Use**: Always (new features, bug fixes, refactoring)

**Exceptions**: Ask human (prototypes, generated code, config files)

**Red Flags**:
- Code before test
- Test passes immediately
- Rationalizing "just this once"
- "I'll write tests after"
- "Deleting X hours is wasteful"

**Integration**: Requires systematic-debugging when bugs found

**Adaptação Legal**: ✅ **CRÍTICA** - TDD é fundamental para qualidade

---

#### 3.2 condition-based-waiting

**Arquivo**: `skills/condition-based-waiting/SKILL.md`
**Tamanho**: ~200 linhas (estimado)

**Propósito**: Patterns for async tests (wait for condition, not arbitrary timeouts)

**Adaptação Legal**: ✅ **ALTA** - testes assíncronos de scraping

---

#### 3.3 testing-anti-patterns

**Arquivo**: `skills/testing-anti-patterns/SKILL.md`
**Tamanho**: ~150 linhas (estimado)

**Propósito**: Common testing pitfalls to avoid

**Adaptação Legal**: ✅ **MÉDIA**

---

### CATEGORIA: Debugging (4 skills)

#### 3.4 systematic-debugging

**Arquivo**: `skills/debugging/systematic-debugging/SKILL.md`
**Tamanho**: 296 linhas

**Propósito**:
> Use when encountering ANY bug - four-phase framework (investigation, pattern, hypothesis, implementation)

**Core Principle**: ALWAYS find root cause before attempting fixes

**Iron Law**: NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST

**Four Phases**:
1. **Root Cause Investigation**: Read errors, reproduce, check changes, gather evidence, trace data flow
2. **Pattern Analysis**: Find working examples, compare references, identify differences
3. **Hypothesis and Testing**: Form hypothesis, test minimally, verify
4. **Implementation**: Create failing test, implement single fix, verify

**Multi-Component Systems**: Add diagnostic instrumentation at EACH boundary before proposing fixes

**Red Flags**:
- "Quick fix for now"
- "Just try changing X"
- Proposing solutions before investigation
- **"One more fix attempt" after 2+ failures → Question architecture**

**3+ Fixes Failed Rule**: STOP and question architecture (not failed hypothesis, wrong architecture)

**Integration**:
- REQUIRES root-cause-tracing (Phase 1)
- REQUIRES test-driven-development (Phase 4)

**Adaptação Legal**: ✅ **CRÍTICA** - debugging de scrapers, parsers, RAG

---

#### 3.5 root-cause-tracing

**Arquivo**: `skills/debugging/root-cause-tracing/SKILL.md`
**Tamanho**: ~180 linhas (estimado)

**Propósito**: Backward tracing technique for deep call stack errors

**When to Use**: REQUIRED when error is deep in call stack (see systematic-debugging Phase 1.5)

**Adaptação Legal**: ✅ **ALTA**

---

#### 3.6 verification-before-completion

**Arquivo**: `skills/verification-before-completion/SKILL.md`
**Tamanho**: ~120 linhas (estimado)

**Propósito**: Confirm fix actually works before claiming success

**Adaptação Legal**: ✅ **ALTA**

---

#### 3.7 defense-in-depth

**Arquivo**: `skills/defense-in-depth/SKILL.md`
**Tamanho**: ~150 linhas (estimado)

**Propósito**: Multiple layers of validation

**Adaptação Legal**: ✅ **ALTA** - validação de dados legais em camadas

---

### CATEGORIA: Collaboration (9 skills)

#### 3.8 brainstorming

**Arquivo**: `skills/brainstorming/SKILL.md`
**Tamanho**: ~200 linhas (estimado)

**Propósito**: Socratic refinement of designs

**Comando Slash**: `/superpowers:brainstorm`

**Adaptação Legal**: ✅ **MÉDIA**

---

#### 3.9 writing-plans

**Arquivo**: `skills/writing-plans/SKILL.md`
**Tamanho**: ~180 linhas (estimado)

**Propósito**: Detailed implementation plans

**Comando Slash**: `/superpowers:write-plan`

**Adaptação Legal**: ✅ **ALTA** - planejamento de features legais

---

#### 3.10 executing-plans

**Arquivo**: `skills/executing-plans/SKILL.md`
**Tamanho**: ~150 linhas (estimado)

**Propósito**: Batch execution with checkpoints

**Comando Slash**: `/superpowers:execute-plan`

**Adaptação Legal**: ✅ **ALTA**

---

#### 3.11 dispatching-parallel-agents

**Arquivo**: `skills/dispatching-parallel-agents/SKILL.md`
**Tamanho**: ~200 linhas (estimado)

**Propósito**: Concurrent subagent flows

**Adaptação Legal**: ✅ **CRÍTICA** - orquestração de agentes legais

---

#### 3.12 requesting-code-review

**Arquivo**: `skills/requesting-code-review/SKILL.md`
**Tamanho**: ~120 linhas (estimado)

**Propósito**: Pre-review checklist

**Adaptação Legal**: ✅ **MÉDIA**

---

#### 3.13 receiving-code-review

**Arquivo**: `skills/receiving-code-review/SKILL.md`
**Tamanho**: ~100 linhas (estimado)

**Propósito**: Respond to feedback

**Adaptação Legal**: ✅ **MÉDIA**

---

#### 3.14 using-git-worktrees

**Arquivo**: `skills/using-git-worktrees/SKILL.md`
**Tamanho**: ~150 linhas (estimado)

**Propósito**: Parallel development branches

**Adaptação Legal**: ✅ **BAIXA** (Git standard)

---

#### 3.15 finishing-a-development-branch

**Arquivo**: `skills/finishing-a-development-branch/SKILL.md`
**Tamanho**: ~130 linhas (estimado)

**Propósito**: Merge/PR decision making

**Adaptação Legal**: ✅ **BAIXA** (Git standard)

---

#### 3.16 subagent-driven-development

**Arquivo**: `skills/subagent-driven-development/SKILL.md`
**Tamanho**: ~180 linhas (estimado)

**Propósito**: Fast iteration with quality gates

**Adaptação Legal**: ✅ **CRÍTICA** - desenvolvimento com múltiplos agentes

---

### CATEGORIA: Meta (4 skills)

#### 3.17 writing-skills

**Arquivo**: `skills/meta/writing-skills/SKILL.md`
**Tamanho**: ~250 linhas (estimado)

**Propósito**: Create new skills following practices

**Adaptação Legal**: ✅ **CRÍTICA** - criar skills legais customizadas

---

#### 3.18 sharing-skills

**Arquivo**: `skills/meta/sharing-skills/SKILL.md`
**Tamanho**: ~120 linhas (estimado)

**Propósito**: Contribute skills via PR

**Adaptação Legal**: ✅ **BAIXA**

---

#### 3.19 testing-skills-with-subagents

**Arquivo**: `skills/meta/testing-skills-with-subagents/SKILL.md`
**Tamanho**: ~180 linhas (estimado)

**Propósito**: Validate skill quality

**Adaptação Legal**: ✅ **MÉDIA**

---

#### 3.20 using-superpowers

**Arquivo**: `skills/using-superpowers/SKILL.md`
**Tamanho**: ~150 linhas (estimado)

**Propósito**: Introduction to superpowers system

**SessionStart Hook**: Carrega esta skill automaticamente

**Adaptação Legal**: ✅ **BAIXA** (intro)

---

## 4. SUPERPOWERS: AGENTES (1 Total)

### 4.1 code-reviewer

**Arquivo**: `agents/code-reviewer.md`
**Tamanho**: 49 linhas
**Model**: sonnet

**Propósito**:
> Review completed project steps against original plans and coding standards

**Quando Usar**:
- Major project step completed
- Implementation against plan finished
- Numbered step from architecture doc completed

**Methodology**:
1. Plan Alignment Analysis
2. Code Quality Assessment
3. Architecture and Design Review
4. Documentation and Standards
5. Issue Identification and Recommendations (Critical, Important, Suggestions)
6. Communication Protocol

**Output**: Categorized issues with actionable recommendations

**Adaptação Legal**: ✅ **ALTA** - similar ao code-architecture-reviewer do showcase

---

## 5. ANÁLISE COMPARATIVA

### 5.1 Agentes: Showcase vs Superpowers vs Atual

| Categoria | Showcase | Superpowers | Atual (Legal) | Gap |
|-----------|----------|-------------|---------------|-----|
| **Review** | code-architecture-reviewer, plan-reviewer | code-reviewer | qualidade-codigo | ⚠️ Falta architecture review |
| **Research** | web-research-specialist | - | - | ❌ Não implementado |
| **Planning** | refactor-planner | - | planejamento-legal | ⚠️ Falta refactor planner |
| **Documentation** | documentation-architect | - | documentacao | ✅ OK |
| **Development** | - | - | desenvolvimento | ✅ OK |
| **Legal** | - | - | analise-dados-legal, legal-articles-finder, legal-text-extractor | ✅ Domínio específico |
| **Testing** | auth-route-tester | - | - | ⚠️ Falta testing agents |
| **Debugging** | auto-error-resolver, frontend-error-fixer, auth-route-debugger | - | - | ⚠️ Falta debugging agents |
| **Refactoring** | code-refactor-master | - | - | ❌ Não implementado |

**GAPS CRÍTICOS**:
1. ❌ Web research specialist (pesquisa jurídica)
2. ❌ Code architecture reviewer (review arquitetural)
3. ❌ Plan reviewer (validação de planos)
4. ❌ Code refactor master (refactoring planejado)

---

### 5.2 Skills: Showcase vs Superpowers vs Atual

| Categoria | Showcase | Superpowers | Atual | Gap |
|-----------|----------|-------------|-------|-----|
| **Backend** | backend-dev-guidelines (11 resources) | - | - | ❌ Não implementado |
| **Testing** | - | TDD, condition-based-waiting, anti-patterns | - | ❌ Não implementado |
| **Debugging** | - | systematic-debugging, root-cause-tracing, verification, defense-in-depth | systematic-debugging (básico) | ⚠️ Incompleto |
| **Collaboration** | - | brainstorming, writing/executing plans, git-worktrees, code-review, subagent-dev | - | ❌ Não implementado |
| **Meta** | skill-developer (6 resources) | writing-skills, sharing-skills, testing-skills | - | ❌ Não implementado |
| **Frontend** | frontend-dev-guidelines (10 resources) | - | frontend-design (básico) | ⚠️ Incompleto |
| **Monitoring** | error-tracking | - | - | ⚠️ Falta |
| **API Testing** | route-tester | - | - | ⚠️ Falta |

**GAPS CRÍTICOS**:
1. ❌ TDD completo (superpowers tem 365 linhas)
2. ❌ Systematic debugging completo (superpowers tem 296 linhas vs nosso básico)
3. ❌ Backend dev guidelines adaptado para Python/FastAPI
4. ❌ Plan writing/execution (collaboration)
5. ❌ Subagent-driven development (orquestração)
6. ❌ Skill developer completo (meta-skill)

---

## 6. PRIORIZAÇÃO PARA IMPLEMENTAÇÃO

### FASE 1: CRÍTICO (Must Have) - Implementar PRIMEIRO

**Agentes**:
1. ✅ **legal-architecture-reviewer** (adapt code-architecture-reviewer)
2. ✅ **legal-research-specialist** (adapt web-research-specialist)
3. ✅ **legal-plan-reviewer** (adapt plan-reviewer)

**Skills**:
1. ✅ **test-driven-development** (superpowers - 365 linhas)
2. ✅ **systematic-debugging** (superpowers - 296 linhas) + root-cause-tracing + verification
3. ✅ **backend-dev-guidelines** (adapt para Python/FastAPI/SQLAlchemy)
4. ✅ **subagent-driven-development** (superpowers - orquestração)
5. ✅ **writing-skills** (meta-skill para criar skills legais)

**Justificativa**: Estes são os building blocks fundamentais. Sem TDD e systematic debugging, qualidade fica comprometida. Sem architecture reviewer e plan reviewer, planejamento fica fraco.

---

### FASE 2: ALTA PRIORIDADE (Should Have) - Implementar EM SEGUIDA

**Agentes**:
4. ✅ **code-refactor-master** (showcase)
5. ✅ **documentation-architect** (showcase - adaptar para legal)

**Skills**:
6. ✅ **writing-plans** + **executing-plans** (collaboration)
7. ✅ **dispatching-parallel-agents** (orquestração)
8. ✅ **condition-based-waiting** (testing)
9. ✅ **defense-in-depth** (validação multi-camada)
10. ✅ **skill-developer** (showcase - 6 resources)

**Justificativa**: Melhoram produtividade e qualidade. Collaboration skills permitem workflows complexos.

---

### FASE 3: MÉDIA PRIORIDADE (Nice to Have)

**Agentes**:
6. ⚠️ **refactor-planner** (showcase)
7. ⚠️ **auto-error-resolver** (adapt para Python mypy)

**Skills**:
11. ⚠️ **error-tracking** (adapt para loguru/structlog)
12. ⚠️ **testing-anti-patterns** (superpowers)
13. ⚠️ **brainstorming** (collaboration)
14. ⚠️ **requesting/receiving-code-review** (collaboration)

---

### FASE 4: BAIXA PRIORIDADE (Optional)

**Agentes**:
- frontend-error-fixer (baixa relevância - projeto backend-heavy)
- auth-route-tester/debugger (só se APIs forem implementadas)

**Skills**:
- frontend-dev-guidelines (baixa relevância)
- using-git-worktrees (Git standard)
- finishing-development-branch (Git standard)
- sharing-skills (contrib)

---

## 7. ESTRUTURA PLUG-AND-PLAY

### 7.1 Agentes (Padrão Showcase)

**Template**:
```markdown
---
name: agent-name
description: |
  Detailed description with examples of when to use.

  <example>
  Context: [scenario]
  user: "[user request]"
  assistant: "[how to invoke agent]"
  <commentary>[why use this agent]</commentary>
  </example>
model: sonnet
color: blue
---

[Agent prompt/instructions]
```

**Características Plug-and-Play**:
- ✅ YAML frontmatter estruturado
- ✅ Exemplos inline de quando usar
- ✅ Instruções autônomas (agent works standalone)
- ✅ Sem dependências externas (self-contained)
- ✅ Apenas copiar `.md` para `.claude/agents/`

**Necessário para Novo Agente**:
1. Criar arquivo `.md` com frontmatter
2. Auto-discovery detecta em SessionStart
3. Zero config manual

---

### 7.2 Skills (Padrão Superpowers)

**Template**:
```markdown
---
name: skill-name
description: Use when [condition] - [methodology/approach]
---

# Skill Name

## Overview
[Core principle]

## When to Use
[Specific conditions]

## Iron Law (if applicable)
```
[RULE IN CAPS]
```

## Methodology
[Phases/steps]

## Red Flags
[What triggers "STOP and follow process"]

## Integration
REQUIRES: [other-skill] when [condition]

## Common Rationalizations
[Excuse vs Reality table]
```

**Características Plug-and-Play**:
- ✅ YAML frontmatter
- ✅ Metodologia em fases
- ✅ Red flags claros
- ✅ Integração com outras skills
- ✅ Apenas copiar para `skills/[skill-name]/SKILL.md`

**Necessário para Nova Skill**:
1. Criar diretório `skills/[name]/`
2. Criar `SKILL.md` com frontmatter
3. Adicionar triggers em `skill-rules.json`
4. Auto-discovery detecta em SessionStart

---

### 7.3 Skill Rules (skill-rules.json)

**Estrutura Completa**:
```json
{
  "version": "1.0",
  "description": "Skill activation triggers",
  "skills": {
    "skill-name": {
      "type": "domain|guardrail",
      "enforcement": "suggest|block|warn",
      "priority": "critical|high|medium|low",
      "description": "One-line description",
      "promptTriggers": {
        "keywords": ["keyword1", "keyword2"],
        "intentPatterns": ["regex1", "regex2"]
      },
      "fileTriggers": {
        "pathPatterns": ["path/pattern"],
        "pathExclusions": ["exclude/pattern"],
        "contentPatterns": ["content regex"]
      },
      "blockMessage": "Message if enforcement=block (optional)",
      "skipConditions": {
        "sessionSkillUsed": true,
        "fileMarkers": ["@skip-validation"],
        "envOverride": "ENV_VAR_NAME"
      }
    }
  }
}
```

**Tipos de Enforcement**:
- **suggest**: Skill suggestion appears (não bloqueia)
- **block**: REQUIRES skill before proceeding (guardrail)
- **warn**: Shows warning but allows proceeding

**Priority Levels**:
- **critical**: Always trigger when matched
- **high**: Trigger for most matches
- **medium**: Trigger for clear matches
- **low**: Trigger only for explicit matches

---

## 8. INTEGRAÇÃO COM SISTEMA ATUAL

### 8.1 Compatibilidade

| Feature | Showcase | Superpowers | Atual | Compatible? |
|---------|----------|-------------|-------|-------------|
| **Agentes** | `.claude/agents/*.md` | `agents/*.md` | `.claude/agents/*.md` | ✅ YES |
| **Skills** | `.claude/skills/*/SKILL.md` | `skills/*/SKILL.md` | `skills/*/SKILL.md` | ✅ YES (projeto usa superpowers pattern) |
| **Auto-discovery** | SessionStart hook | SessionStart hook | legal-braniac-loader.js | ✅ YES |
| **skill-rules.json** | `.claude/skills/skill-rules.json` | N/A (superpowers usa plugin) | `.claude/skills/skill-rules.json` | ✅ YES |
| **Hooks** | skill-activation-prompt.ts | Embutido em plugin | context-collector.js + skill-detector.js | ✅ YES (compatível) |

**Conclusão**: Sistema atual é COMPATÍVEL com ambos os padrões! 🎉

---

### 8.2 Estratégia de Merge

**Agentes**:
1. Copiar `.md` de showcase para `.claude/agents/` (adaptar description)
2. Copiar `.md` de superpowers para `.claude/agents/` (se não duplicado)
3. Legal-braniac auto-discovery detecta automaticamente
4. Adicionar em `agent-tools-mapping.json` se tools específicas necessárias

**Skills**:
1. Copiar diretórios de superpowers para `skills/`
2. Copiar diretórios de showcase para `.claude/skills/` (managed)
3. Adicionar triggers em `.claude/skills/skill-rules.json`
4. Legal-braniac auto-discovery detecta automaticamente

**Sem Conflitos**:
- Showcase: `.claude/skills/` (managed/official)
- Superpowers: `skills/` (custom/project)
- Atual: Ambos já separados corretamente!

---

## 9. CHECKLIST DE VALIDAÇÃO

### Agente Plug-and-Play ✅

- [ ] YAML frontmatter com name, description
- [ ] Description com exemplos inline `<example>...</example>`
- [ ] Model especificado (sonnet/opus/haiku)
- [ ] Instruções autônomas (não requer config externa)
- [ ] Salvando outputs em local previsível (./dev/active/...)
- [ ] Return to parent process (informar conclusão)

### Skill Plug-and-Play ✅

- [ ] YAML frontmatter com name, description
- [ ] Overview com core principle
- [ ] When to Use (condições específicas)
- [ ] Methodology (fases/steps)
- [ ] Red Flags (quando STOP)
- [ ] Integration (skills relacionadas)
- [ ] Tamanho <500 linhas (ou split em resources/)

### Skill Rules ✅

- [ ] Entry em skill-rules.json
- [ ] Type definido (domain/guardrail)
- [ ] Enforcement definido (suggest/block/warn)
- [ ] Priority definido (critical/high/medium/low)
- [ ] promptTriggers com keywords E intentPatterns
- [ ] fileTriggers se aplicável
- [ ] blockMessage se enforcement=block

---

## 10. MÉTRICAS DE SUCESSO

### Quantitativo

| Métrica | Antes | Depois (Meta) | Gap |
|---------|-------|---------------|-----|
| **Agentes** | 7 | 17+ | +10 |
| **Skills Funcionais** | 37 (34 com SKILL.md) | 55+ | +18 |
| **Skills com Triggers** | 35 (via skill-rules.json) | 55+ | +20 |
| **Linha de Código (Skills)** | ~15k | ~30k+ | +15k |
| **Recursos (Progressive Disclosure)** | 0 | 30+ | +30 |

### Qualitativo

- [ ] TDD rigoroso implementado (RED-GREEN-REFACTOR)
- [ ] Systematic debugging completo (4 fases + 3-fixes rule)
- [ ] Architecture review automatizado
- [ ] Plan review antes de implementação
- [ ] Research agent para jurisprudência
- [ ] Backend guidelines adaptados para Python/FastAPI
- [ ] Collaboration skills (writing/executing plans)
- [ ] Meta-skills (writing skills, skill developer)
- [ ] Todos agentes plug-and-play (copy .md = works)
- [ ] Todas skills plug-and-play (copy dir = works)

---

## 11. PRÓXIMOS PASSOS

1. ✅ **ANÁLISE COMPLETA** (Este documento)
2. ⏭️ **PLAN MODE**: Criar plano detalhado de implementação
3. ⏭️ **IMPLEMENTAÇÃO FASE 1**: Agentes e skills críticos
4. ⏭️ **TESTES**: Validar plug-and-play funciona
5. ⏭️ **INTEGRAÇÃO LEGAL-BRANIAC**: Orquestração DEPOIS de agentes prontos
6. ⏭️ **VALIDAÇÃO FINAL**: End-to-end tests
7. ⏭️ **GIT**: Commits atômicos + push

---

**FIM DO CATÁLOGO**

**Sources**:
- [claude-code-infrastructure-showcase agents](https://github.com/diet103/claude-code-infrastructure-showcase/tree/main/.claude/agents)
- [claude-code-infrastructure-showcase skills](https://github.com/diet103/claude-code-infrastructure-showcase/tree/main/.claude/skills)
- [superpowers skills](https://github.com/obra/superpowers/tree/main/skills)
- [skill-rules.json format](https://github.com/diet103/claude-code-infrastructure-showcase/blob/main/.claude/skills/skill-rules.json)
