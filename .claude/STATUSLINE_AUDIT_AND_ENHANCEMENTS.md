# 📊 Status Line UI - Auditoria e Propostas de Melhoria

**Data:** 2025-11-15
**Ambiente:** Linux/WSL
**Status Line Atual:** `legal-braniac-statusline.js`

---

## ✅ AUDITORIA DE FUNCIONALIDADES OBRIGATÓRIAS

### 1. Agent Tracking (CRÍTICO) ✅ **IMPLEMENTADO**

**Status:** ✅ COMPLETO

**Implementação Atual:**
- Hook wrapper (`hook-wrapper.js`) tracka execução de todos os hooks
- Arquivo `hooks-status.json` mantém estado em tempo real
- Active agents detector (`active-agents-detector.js`) identifica agentes ativos (últimos 5 min)
- Status line exibe:
  - ✅ Contagem de agentes ativos
  - ✅ Nomes dos agentes ativos
  - ✅ Status de cada hook (success/error)
  - ✅ Indicador visual de erros: `(all ✓)`, `(6/7 ✓)`, `(X ✗)`

**Exemplo de Output:**
```
├ 🤖 7 agentes (1 ativo: legal-braniac) | 📦 31 skills | 🔧 7 hooks (all ✓)
└ ✅ LEGAL-BRANIAC success (2m ago)
```

**Capacidades de Diagnóstico:**
- ✅ Detecção instantânea de falhas em hooks
- ✅ Timestamp da última execução do orquestrador
- ✅ Identificação de agentes inativos há muito tempo

---

### 2. Git Status ✅ **IMPLEMENTADO**

**Status:** ✅ COMPLETO

**Implementação Atual:**
- Branch atual exibida com truncamento inteligente (25 chars)
- Colorização: verde para branch
- Emoji: 🌿

**Exemplo de Output:**
```
🌿 claude/project-progress...
```

**Limitação Identificada:**
- ❌ NÃO exibe status de mudanças pendentes (dirty/clean)
- ❌ NÃO exibe commits ahead/behind do remote

**Proposta de Melhoria:** Ver seção "Melhorias Propostas"

---

### 3. Virtual Environment Status ❌ **AUSENTE**

**Status:** ⚠️ PARCIALMENTE IMPLEMENTADO

**Implementação Atual:**
- Hook `venv-check.js` valida se venv está ativo
- Aviso aparece apenas quando venv NÃO está ativo
- **NÃO aparece no status line**

**Evidência (hooks-status.json):**
```json
"venv-check": {
  "status": "success",
  "output": "{\"systemMessage\":\"⚠️ RULE_006: venv não ativo! Ative com: source .venv/bin/activate\"}"
}
```

**Problema:**
- ✅ Detecção funciona
- ❌ Não há indicador visual persistente no status line

**Proposta de Melhoria:** Adicionar indicador de venv ao status line

---

### 4. Resource Consumption (CRÍTICO) ✅ **IMPLEMENTADO**

**Status:** ✅ COMPLETO

**Implementação Atual:**
- Uso de tokens em tempo real: formatação inteligente (k, M)
- Custo em USD: formatação monetária
- Emojis: 💰 (custo), 📊 (tokens)

**Exemplo de Output:**
```
💰 $1.25 | 📊 95k
```

**Formatação:**
- < 1.000 tokens: exibe número exato
- 1.000 - 999.999: exibe em "k" (ex: 95k)
- ≥ 1.000.000: exibe em "M" (ex: 1.2M)

---

## 🚀 MELHORIAS PROPOSTAS

### Melhoria 1: Adicionar Virtual Environment Indicator

**Prioridade:** 🔥 ALTA

**Objetivo:** Exibir status do venv Python no status line

**Implementação:**

Adicionar ao `legal-braniac-statusline.js`:

```javascript
/**
 * Detecta se venv está ativo
 */
async function getVenvStatus(projectDir) {
  try {
    const statusFile = path.join(projectDir, '.claude', 'statusline', 'hooks-status.json');
    const content = await fs.readFile(statusFile, 'utf8');
    const hooksStatus = JSON.parse(content);

    const venvCheck = hooksStatus['venv-check'];

    if (!venvCheck) return { active: false };

    // Se output contém "venv não ativo", então não está ativo
    const isInactive = venvCheck.output && venvCheck.output.includes('venv não ativo');

    return {
      active: !isInactive,
      warning: isInactive
    };
  } catch {
    return { active: false };
  }
}
```

**Output Proposto:**
```
├ 🤖 7 agentes | 📦 31 skills | 🔧 7 hooks (all ✓) | 🐍 venv ✓
```

Ou se inativo:
```
├ 🤖 7 agentes | 📦 31 skills | 🔧 7 hooks (all ✓) | 🐍 venv ✗
```

**Benefícios:**
- ✅ Visibilidade instantânea do estado venv
- ✅ Previne execução de código Python sem venv ativo
- ✅ Alinhado com RULE_006 (venv obrigatório)

---

### Melhoria 2: Expandir Git Status (Dirty/Clean + Ahead/Behind)

**Prioridade:** 🚀 MÉDIA

**Objetivo:** Exibir mais informações sobre o repositório Git

**Implementação:**

Usar `claudeData.git` que já vem com dados adicionais:

```javascript
function generateGitInfo(git) {
  const branch = truncate(git.branch, 25);
  let indicators = '';

  // Verificar se há mudanças não commitadas
  if (git.status && git.status !== 'clean') {
    indicators += ` ${colors.yellow}●${colors.reset}`; // dirty
  }

  // Verificar se está ahead/behind
  if (git.ahead > 0) {
    indicators += ` ${colors.green}↑${git.ahead}${colors.reset}`;
  }
  if (git.behind > 0) {
    indicators += ` ${colors.red}↓${git.behind}${colors.reset}`;
  }

  return `🌿 ${colors.green}${branch}${colors.reset}${indicators}`;
}
```

**Output Proposto:**
```
🌿 main ● ↑3        # Dirty, 3 commits ahead
🌿 main ↓2          # Clean, 2 commits behind
🌿 main             # Clean, up to date
```

**Benefícios:**
- ✅ Visibilidade de mudanças não salvas
- ✅ Alerta de dessincronização com remote
- ✅ Reduz necessidade de `git status` manual

---

### Melhoria 3: Adicionar Model Context Window Usage

**Prioridade:** 💡 BAIXA (Nice to Have)

**Objetivo:** Exibir % de uso da janela de contexto

**Implementação:**

```javascript
function generateModelInfo(model, tokens) {
  const modelName = model.display_name.replace('claude-', '').replace('sonnet-', 'snt-');

  // Context window por modelo
  const contextLimits = {
    'snt-4.5': 200000,
    'snt-3.5': 200000,
    'opus-3': 200000,
    'haiku-3': 200000
  };

  const limit = contextLimits[modelName] || 200000;
  const used = tokens.total || 0;
  const percentage = Math.floor((used / limit) * 100);

  let usageColor = colors.green;
  if (percentage > 80) usageColor = colors.red;
  else if (percentage > 60) usageColor = colors.yellow;

  return `${colors.yellow}${modelName}${colors.reset} ${usageColor}(${percentage}%)${colors.reset}`;
}
```

**Output Proposto:**
```
🧠 LEGAL-BRANIAC snt-4.5 (47%) | ...
```

**Benefícios:**
- ✅ Alerta quando contexto está cheio
- ✅ Ajuda a planejar quando criar nova sessão
- ✅ Visibilidade de consumo de recursos

---

### Melhoria 4: Indicador de Sessão Ativa (Session Timer)

**Prioridade:** 💡 BAIXA (Nice to Have)

**Objetivo:** Exibir tempo de sessão ativa

**Implementação:**

Usar `claudeData.session.elapsed_seconds`:

```javascript
function formatSessionTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h${minutes}m`;
  }
  return `${minutes}m`;
}
```

**Output Proposto:**
```
🧠 LEGAL-BRANIAC snt-4.5 | ⏱️ 2h15m | ...
```

**Benefícios:**
- ✅ Consciência de tempo de trabalho
- ✅ Ajuda a planejar pausas
- ✅ Útil para tracking de produtividade

---

### Melhoria 5: Skill Auto-Activation Indicator

**Prioridade:** 🚀 MÉDIA

**Objetivo:** Exibir quais skills foram auto-ativados no prompt atual

**Pré-requisito:** Reativar `skill-activation-prompt.sh`

**Implementação:**

Criar arquivo `.claude/statusline/active-skills.json` atualizado pelo hook:

```json
{
  "skills": ["ocr-pro", "deep-parser"],
  "timestamp": 1763224844420
}
```

Status line lê e exibe:

```
├ 🤖 7 agentes | 📦 31 skills (2 ativos: ocr-pro, deep-parser) | ...
```

**Benefícios:**
- ✅ Visibilidade de skills ativados automaticamente
- ✅ Ajuda a entender comportamento do sistema
- ✅ Facilita debugging de problemas com skills

---

## 📋 PLANO DE IMPLEMENTAÇÃO

### Sprint 1 (PRIORIDADE ALTA) - 30 min

- [ ] **Melhoria 1:** Virtual Environment Indicator
  - Adicionar função `getVenvStatus()`
  - Modificar `generateSystemInfo()` para incluir indicador
  - Testar com venv ativo/inativo

**Entregável:** Status line com `🐍 venv ✓/✗`

---

### Sprint 2 (PRIORIDADE MÉDIA) - 45 min

- [ ] **Melhoria 2:** Git Status Expandido
  - Modificar `generateHeader()` para usar `generateGitInfo()`
  - Adicionar indicadores dirty/ahead/behind
  - Testar em diferentes estados do repositório

- [ ] **Melhoria 5:** Skill Auto-Activation Indicator
  - Reativar `skill-activation-prompt.sh`
  - Criar `active-skills.json`
  - Integrar ao status line

**Entregável:** Status line com indicadores Git completos + skills ativos

---

### Sprint 3 (NICE TO HAVE) - 30 min

- [ ] **Melhoria 3:** Model Context Window Usage
  - Adicionar `generateModelInfo()` com % de uso
  - Colorização baseada em threshold
  - Testar com diferentes níveis de uso

- [ ] **Melhoria 4:** Session Timer
  - Adicionar `formatSessionTime()`
  - Integrar ao header
  - Testar com sessões longas

**Entregável:** Status line com contexto % e timer

---

## 🎨 MOCKUP COMPLETO (APÓS TODAS AS MELHORIAS)

### Exemplo 1: Sessão Saudável
```
🧠 LEGAL-BRANIAC snt-4.5 (47%) | ⏱️ 1h23m | 📂 Claude-Code-Projetos | 🌿 main | 💰 $1.25 | 📊 95k
├ 🤖 7 agentes (1 ativo: legal-braniac) | 📦 31 skills (2 ativos: ocr-pro, deep-parser) | 🔧 7 hooks (all ✓) | 🐍 venv ✓
└ ✅ LEGAL-BRANIAC success (30s ago)
```

### Exemplo 2: Alerta de Problemas
```
🧠 LEGAL-BRANIAC snt-4.5 (83%) | ⏱️ 3h45m | 📂 Claude-Code-Projetos | 🌿 feature/new-hook ● ↑5 | 💰 $4.50 | 📊 167k
├ 🤖 7 agentes | 📦 31 skills | 🔧 7 hooks (6/7 ✓) | 🐍 venv ✗
└ ❌ LEGAL-BRANIAC error (1m ago) - Failed to load context
```

**Indicadores de Alerta:**
- 🔴 Context window 83% (próximo do limite)
- 🔴 Venv inativo (🐍 ✗)
- 🟡 Git dirty (●) + ahead do remote (↑5)
- 🔴 Hook com erro (6/7 ✓)
- 🔴 LEGAL-BRANIAC falhou

---

## 🔧 CONFIGURAÇÃO RECOMENDADA

### Após Implementar Melhorias

**settings.json:**
```json
{
  "statusLine": {
    "type": "command",
    "command": "node .claude/statusline/legal-braniac-statusline.js",
    "padding": 0,
    "_note": "Status line v2 - venv tracking, git expanded, skill activation"
  }
}
```

**Hooks Necessários:**
- ✅ `hook-wrapper.js` (já implementado)
- ✅ `venv-check.js` (já implementado)
- ⚠️ `skill-activation-prompt.sh` (reativar)

---

## 📊 COMPARAÇÃO: ANTES vs. DEPOIS

### ANTES (Status Atual)
```
🧠 LEGAL-BRANIAC snt-4.5 | 📂 Claude-Code-Projetos | 🌿 main | 💰 $1.25 | 📊 95k
├ 🤖 7 agentes (1 ativo: legal-braniac) | 📦 31 skills | 🔧 7 hooks (all ✓)
└ ✅ LEGAL-BRANIAC success (2m ago)
```

**Informações Ausentes:**
- ❌ Status de venv
- ❌ Git dirty/ahead/behind
- ❌ % de uso do contexto
- ❌ Tempo de sessão
- ❌ Skills ativados

---

### DEPOIS (Com Todas as Melhorias)
```
🧠 LEGAL-BRANIAC snt-4.5 (47%) | ⏱️ 1h23m | 📂 Claude-Code-Projetos | 🌿 main ● ↑3 | 💰 $1.25 | 📊 95k
├ 🤖 7 agentes (1 ativo: legal-braniac) | 📦 31 skills (2 ativos: ocr-pro, deep-parser) | 🔧 7 hooks (all ✓) | 🐍 venv ✓
└ ✅ LEGAL-BRANIAC success (30s ago)
```

**Novas Informações:**
- ✅ Status de venv (🐍 venv ✓)
- ✅ Git dirty + ahead (● ↑3)
- ✅ % de uso do contexto (47%)
- ✅ Tempo de sessão (⏱️ 1h23m)
- ✅ Skills ativados (ocr-pro, deep-parser)

---

## ✅ CONCLUSÃO

**Status Atual:** 75% das funcionalidades obrigatórias implementadas

**Funcionalidades Completas:**
- ✅ Agent Tracking (CRÍTICO)
- ✅ Git Status (parcial)
- ✅ Resource Consumption (CRÍTICO)

**Funcionalidades Ausentes:**
- ⚠️ Virtual Environment Status (25% faltando)

**Recomendação:** Implementar Sprint 1 (venv indicator) IMEDIATAMENTE para atingir 100% das funcionalidades obrigatórias.

**Sprints Opcionais (2 e 3):** Agregar valor significativo mas não são críticos.

---

**Próximo Passo:** Implementar Sprint 1 (15-30 min) para completar funcionalidades obrigatórias.
