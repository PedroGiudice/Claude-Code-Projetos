# 📊 Plano: Status Line Customizado para Legal-Braniac

**Objetivo:** Criar statusline que mostre em tempo real: agentes ativos, skills disponíveis, hooks executados e eventuais erros.

**Motivação:** Na Web, os hooks SessionStart só aparecem no início da conversa. Depois, perde-se visibilidade sobre quais agentes/skills estão sendo usados. Com statusline customizado, você tem controle e visibilidade total o tempo todo.

---

## 🎯 Visão Geral

### O Que Queremos Mostrar

```
┌─ LEGAL-BRANIAC STATUS ─────────────────────────────────────────────────┐
│ 🤖 AGENTES: 7/7 ativo | 📦 SKILLS: 34 | 🔧 HOOKS: 7 OK (0 erros)       │
│ 🧠 legal-braniac, planejamento-legal, desenvolvimento                   │
│ 📂 /home/user/Claude-Code-Projetos | 🌿 claude/analyze-repo-docs...   │
└─────────────────────────────────────────────────────────────────────────┘
```

**Linha 1:** Contadores e status geral
**Linha 2:** Agentes/skills sendo usados no momento (se detectável)
**Linha 3:** Contexto (diretório, branch, modelo)

---

## 🔧 Como Funciona o Statusline

### Arquitetura

1. **Claude Code CLI** → Passa JSON via stdin para script customizado
2. **Script customizado** → Lê JSON + lê configurações do projeto
3. **Output formatado** → Exibido no rodapé do terminal

### JSON Recebido do Claude Code

```json
{
  "workspace": {
    "current_dir": "/home/user/Claude-Code-Projetos"
  },
  "model": {
    "display_name": "claude-3-5-sonnet"
  },
  "git": {
    "branch": "claude/analyze-repo-docs-01NoXr9UCxzdbYycUaUspBVw",
    "status": "clean"
  },
  "tokens": {
    "input": 50000,
    "output": 15000,
    "cached": 30000,
    "total": 95000
  },
  "cost": {
    "total_usd": 1.25
  },
  "session": {
    "elapsed_seconds": 3600
  }
}
```

### Configuração no settings.json

```json
{
  "statusLine": {
    "type": "command",
    "command": "node .claude/statusline/legal-braniac-statusline.js",
    "padding": 0
  }
}
```

---

## 📋 Plano de Implementação

### Fase 1: Script Básico (1-2h)

**Objetivo:** Criar statusline que lê JSON do Claude Code e exibe informações básicas.

**Arquivo:** `.claude/statusline/legal-braniac-statusline.js`

**Funcionalidades:**
- ✅ Lê JSON via stdin
- ✅ Exibe modelo, diretório, branch
- ✅ Exibe tokens e custo
- ✅ Formatação colorida (ANSI colors)

**Exemplo:**
```
🧠 sonnet-3.5 | 📂 Claude-Code-Projetos | 🌿 main | 💰 $1.25 | 📊 95k tokens
```

---

### Fase 2: Detecção de Agentes/Skills/Hooks (2-3h)

**Objetivo:** Auto-descobrir agentes, skills e hooks do projeto.

**Lógica de Detecção:**

#### 2.1. Agentes (.claude/agents/*.md)
```javascript
async function discoverAgents() {
  const agentsDir = path.join(workspace.current_dir, '.claude/agents');
  const files = await fs.readdir(agentsDir);
  const agents = files
    .filter(f => f.endsWith('.md'))
    .map(f => ({
      name: f.replace('.md', ''),
      file: f,
      active: false  // Será detectado dinamicamente
    }));
  return agents;
}
```

**Saída:**
```
🤖 AGENTES (7): legal-braniac | planejamento-legal | desenvolvimento | ...
```

#### 2.2. Skills (.claude/skills/*.md)
```javascript
async function discoverSkills() {
  const skillsDir = path.join(workspace.current_dir, '.claude/skills');
  // Mesma lógica que agentes
  return skills;
}
```

**Saída:**
```
📦 SKILLS (34): ocr-pro | deep-parser | sign-recognition | ...
```

#### 2.3. Hooks (.claude/settings.json)
```javascript
async function getActiveHooks() {
  const settingsPath = path.join(workspace.current_dir, '.claude/settings.json');
  const settings = JSON.parse(await fs.readFile(settingsPath, 'utf8'));

  const hooks = [];
  if (settings.hooks && settings.hooks.UserPromptSubmit) {
    for (const entry of settings.hooks.UserPromptSubmit) {
      if (entry.hooks) {
        hooks.push(...entry.hooks.map(h => {
          const cmd = h.command;
          const name = cmd.split('/').pop().replace('.js', '');
          return {
            name,
            type: 'UserPromptSubmit',
            command: cmd
          };
        }));
      }
    }
  }

  return hooks;
}
```

**Saída:**
```
🔧 HOOKS (7): session-context | legal-braniac | venv-check | git-status | ...
```

---

### Fase 3: Detecção de Hooks Executados (3-4h)

**Objetivo:** Mostrar quais hooks foram executados na sessão atual e se houve erros.

**Estratégia 1: Hook Wrapper com Logging**

Criar um wrapper que intercepta execução de hooks e registra status.

**Arquivo:** `.claude/hooks/hook-wrapper.js`

```javascript
#!/usr/bin/env node
/**
 * hook-wrapper.js - Intercepta execução de hooks para logging
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  const hookCommand = process.argv[2];
  const hookName = path.basename(hookCommand, '.js');

  const statusFile = path.join(
    process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    '.claude/statusline/hooks-status.json'
  );

  // Registrar início
  await updateHookStatus(statusFile, hookName, 'running', Date.now());

  // Executar hook original
  const child = spawn('node', [hookCommand], {
    stdio: ['inherit', 'inherit', 'pipe']
  });

  let stderr = '';
  child.stderr.on('data', data => stderr += data.toString());

  child.on('exit', async (code) => {
    const status = code === 0 ? 'success' : 'error';
    await updateHookStatus(statusFile, hookName, status, Date.now(), stderr);
  });
}

async function updateHookStatus(file, hookName, status, timestamp, error = '') {
  let data = {};

  try {
    const content = await fs.readFile(file, 'utf8');
    data = JSON.parse(content);
  } catch {
    // Arquivo não existe, criar novo
  }

  data[hookName] = {
    status,
    timestamp,
    lastRun: new Date(timestamp).toISOString(),
    error: error || undefined
  };

  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

main();
```

**hooks-status.json (exemplo):**
```json
{
  "session-context-hybrid": {
    "status": "success",
    "timestamp": 1736812345678,
    "lastRun": "2025-11-13T10:30:45.678Z"
  },
  "git-status-watcher": {
    "status": "success",
    "timestamp": 1736812345700,
    "lastRun": "2025-11-13T10:30:45.700Z"
  },
  "venv-check": {
    "status": "error",
    "timestamp": 1736812345720,
    "lastRun": "2025-11-13T10:30:45.720Z",
    "error": "VIRTUAL_ENV not set"
  }
}
```

**Statusline lê esse arquivo e exibe:**
```
🔧 HOOKS: 7 total | ✅ 6 OK | ❌ 1 erro (venv-check)
```

**ATENÇÃO:** Esta estratégia requer modificar settings.json para usar wrapper:
```json
{
  "hooks": {
    "UserPromptSubmit": [{
      "hooks": [
        { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/session-context-hybrid.js" },
        { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/git-status-watcher.js" }
      ]
    }]
  }
}
```

**Alternativa: Estratégia 2 - Parsing de Logs do Claude Code**

Se Claude Code logga execução de hooks, podemos parsear o log.

**Arquivo:** `~/.claude/logs/session-XXXXX.log` (verificar se existe)

**Exemplo de parsing:**
```javascript
async function parseClaudeLogs() {
  const logsDir = path.join(os.homedir(), '.claude/logs');
  // Encontrar log mais recente
  // Parsear linhas tipo: "[INFO] Hook executed: session-context-hybrid.js"
  // Extrair status e timestamp
}
```

---

### Fase 4: Detecção de Agentes Ativos (Difícil - 4-6h)

**Objetivo:** Detectar quais agentes estão sendo USADOS no momento (não apenas disponíveis).

**Desafio:** Claude Code não passa informação sobre qual agente está ativo via JSON.

**Estratégias:**

#### 4.1. Heurística: Parsing de Mensagens do Sistema

Se `invoke-legal-braniac-hybrid.js` injeta mensagem tipo:
```
🧠 Legal-Braniac: Orquestrador ativo
📋 Agentes (3): oab-watcher, djen-tracker, legal-lens
```

Podemos criar hook que registra quais agentes foram mencionados.

**Arquivo:** `.claude/hooks/agent-tracker.js`

```javascript
#!/usr/bin/env node
/**
 * agent-tracker.js - Registra quais agentes foram invocados
 */

const fs = require('fs').promises;
const path = require('path');

async function main() {
  // Lê stdin (HookInput)
  const input = JSON.parse(await readStdin());

  const prompt = input.prompt || '';

  // Detectar menções a agentes no prompt
  const agentMentions = detectAgentMentions(prompt);

  if (agentMentions.length > 0) {
    await updateActiveAgents(agentMentions);
  }

  console.log(JSON.stringify({ continue: true }));
}

function detectAgentMentions(prompt) {
  const knownAgents = [
    'legal-braniac',
    'planejamento-legal',
    'desenvolvimento',
    'documentacao',
    'qualidade-codigo',
    'analise-dados-legal',
    'legal-articles-finder'
  ];

  const mentioned = [];

  for (const agent of knownAgents) {
    // Case-insensitive match
    if (new RegExp(agent, 'i').test(prompt)) {
      mentioned.push(agent);
    }
  }

  return mentioned;
}

async function updateActiveAgents(agents) {
  const statusFile = path.join(
    process.env.CLAUDE_PROJECT_DIR || process.cwd(),
    '.claude/statusline/active-agents.json'
  );

  const data = {
    agents,
    timestamp: Date.now(),
    lastUpdate: new Date().toISOString()
  };

  await fs.writeFile(statusFile, JSON.stringify(data, null, 2));
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

main();
```

**active-agents.json (exemplo):**
```json
{
  "agents": ["legal-braniac", "desenvolvimento"],
  "timestamp": 1736812345678,
  "lastUpdate": "2025-11-13T10:30:45.678Z"
}
```

**Statusline lê esse arquivo e exibe:**
```
🤖 ATIVOS: legal-braniac | desenvolvimento
```

#### 4.2. Alternativa: Session Context Hook

Modificar `invoke-legal-braniac-hybrid.js` para registrar em arquivo separado quais agentes estão sendo injetados no contexto.

**No invoke-legal-braniac-hybrid.js, adicionar:**
```javascript
// No final da função main()
await fs.writeFile(
  path.join(projectDir, '.claude/statusline/active-context.json'),
  JSON.stringify({
    agentes: agentesDisponiveis,
    skills: skillsDisponiveis,
    timestamp: Date.now()
  }, null, 2)
);
```

---

### Fase 5: Interface Visual Completa (2-3h)

**Objetivo:** Criar interface bonita, colorida e informativa.

**Biblioteca:** Usar ANSI colors (nativo) ou chalk (npm)

**Layout Proposto:**

```
┌─ LEGAL-BRANIAC ────────────────────────────────────────────────────────┐
│ 🧠 sonnet-3.5 | 📂 Claude-Code-Projetos | 🌿 main | 💰 $1.25 | 📊 95k  │
├─ SISTEMA ─────────────────────────────────────────────────────────────┤
│ 🤖 AGENTES: 7 disponíveis | 🧠 ATIVOS: legal-braniac, desenvolvimento  │
│ 📦 SKILLS: 34 disponíveis                                               │
│ 🔧 HOOKS: 7 ativos | ✅ 6 OK | ❌ 1 erro (venv-check)                   │
├─ ÚLTIMA EXECUÇÃO ────────────────────────────────────────────────────┤
│ session-context ✅ | legal-braniac ✅ | venv-check ❌ (10:30:45)        │
└─────────────────────────────────────────────────────────────────────────┘
```

**Arquivo:** `.claude/statusline/legal-braniac-statusline.js`

```javascript
#!/usr/bin/env node
/**
 * legal-braniac-statusline.js - Status line customizado
 */

const fs = require('fs').promises;
const path = require('path');

// ANSI Colors
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
};

async function main() {
  try {
    // Lê JSON do Claude Code via stdin
    const claudeData = JSON.parse(await readStdin());

    // Lê dados do projeto
    const projectData = await getProjectData(claudeData.workspace.current_dir);

    // Gera statusline
    const statusline = generateStatusline(claudeData, projectData);

    console.log(statusline);
  } catch (error) {
    // Graceful fallback
    console.log('⚠️ Legal-Braniac Status: Error loading data');
  }
}

async function getProjectData(projectDir) {
  // Descobrir agentes
  const agents = await discoverAgents(projectDir);

  // Descobrir skills
  const skills = await discoverSkills(projectDir);

  // Ler hooks ativos
  const hooks = await getActiveHooks(projectDir);

  // Ler status de hooks executados
  const hooksStatus = await getHooksStatus(projectDir);

  // Ler agentes ativos
  const activeAgents = await getActiveAgents(projectDir);

  return {
    agents,
    skills,
    hooks,
    hooksStatus,
    activeAgents
  };
}

function generateStatusline(claudeData, projectData) {
  const { workspace, model, git, tokens, cost } = claudeData;
  const { agents, skills, hooks, hooksStatus, activeAgents } = projectData;

  const lines = [];

  // Linha 1: Cabeçalho
  lines.push(generateHeader(model, workspace, git, cost, tokens));

  // Linha 2: Sistema
  lines.push(generateSystemInfo(agents, skills));

  // Linha 3: Hooks
  lines.push(generateHooksInfo(hooks, hooksStatus));

  // Linha 4: Agentes ativos
  if (activeAgents.length > 0) {
    lines.push(generateActiveAgents(activeAgents));
  }

  return lines.join('\n');
}

function generateHeader(model, workspace, git, cost, tokens) {
  const modelName = model.display_name.replace('claude-', '');
  const dirName = path.basename(workspace.current_dir);
  const branch = git?.branch ? git.branch.substring(0, 30) : 'no-git';
  const costUsd = cost?.total_usd ? `$${cost.total_usd.toFixed(2)}` : '$0.00';
  const totalTokens = tokens?.total ? `${Math.floor(tokens.total / 1000)}k` : '0k';

  return `${colors.bold}${colors.cyan}┌─ LEGAL-BRANIAC ─${colors.reset}` +
         ` 🧠 ${colors.yellow}${modelName}${colors.reset}` +
         ` | 📂 ${colors.blue}${dirName}${colors.reset}` +
         ` | 🌿 ${colors.green}${branch}${colors.reset}` +
         ` | 💰 ${colors.magenta}${costUsd}${colors.reset}` +
         ` | 📊 ${colors.white}${totalTokens}${colors.reset}`;
}

function generateSystemInfo(agents, skills) {
  const agentCount = agents.length;
  const skillCount = skills.length;

  return `${colors.cyan}│${colors.reset}` +
         ` 🤖 AGENTES: ${colors.green}${agentCount}${colors.reset}` +
         ` | 📦 SKILLS: ${colors.green}${skillCount}${colors.reset}`;
}

function generateHooksInfo(hooks, hooksStatus) {
  const totalHooks = hooks.length;
  const successCount = Object.values(hooksStatus).filter(h => h.status === 'success').length;
  const errorCount = Object.values(hooksStatus).filter(h => h.status === 'error').length;

  let line = `${colors.cyan}│${colors.reset}` +
             ` 🔧 HOOKS: ${colors.white}${totalHooks}${colors.reset}`;

  if (successCount > 0) {
    line += ` | ✅ ${colors.green}${successCount} OK${colors.reset}`;
  }

  if (errorCount > 0) {
    const errorHooks = Object.entries(hooksStatus)
      .filter(([, h]) => h.status === 'error')
      .map(([name]) => name)
      .join(', ');

    line += ` | ❌ ${colors.red}${errorCount} erro${colors.reset} (${errorHooks})`;
  }

  return line;
}

function generateActiveAgents(activeAgents) {
  const agentsList = activeAgents.join(' | ');

  return `${colors.cyan}│${colors.reset}` +
         ` 🧠 ATIVOS: ${colors.yellow}${agentsList}${colors.reset}`;
}

async function discoverAgents(projectDir) {
  // ... (implementação da Fase 2.1)
}

async function discoverSkills(projectDir) {
  // ... (implementação da Fase 2.2)
}

async function getActiveHooks(projectDir) {
  // ... (implementação da Fase 2.3)
}

async function getHooksStatus(projectDir) {
  try {
    const statusFile = path.join(projectDir, '.claude/statusline/hooks-status.json');
    const content = await fs.readFile(statusFile, 'utf8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function getActiveAgents(projectDir) {
  try {
    const statusFile = path.join(projectDir, '.claude/statusline/active-agents.json');
    const content = await fs.readFile(statusFile, 'utf8');
    const data = JSON.parse(content);
    return data.agents || [];
  } catch {
    return [];
  }
}

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

main();
```

---

## 🚀 Roadmap de Implementação

### Sprint 1: MVP (2-3h)
- [ ] Criar `.claude/statusline/legal-braniac-statusline.js`
- [ ] Implementar leitura de JSON via stdin
- [ ] Exibir informações básicas (modelo, diretório, branch, tokens, custo)
- [ ] Adicionar cores ANSI
- [ ] Configurar em `settings.json`
- [ ] Testar no Linux CLI

### Sprint 2: Auto-Discovery (2-3h)
- [ ] Implementar `discoverAgents()`
- [ ] Implementar `discoverSkills()`
- [ ] Implementar `getActiveHooks()`
- [ ] Exibir contadores de agentes/skills/hooks
- [ ] Testar visualização

### Sprint 3: Tracking de Hooks (3-4h)
- [ ] Implementar `hook-wrapper.js`
- [ ] Modificar `settings.json` para usar wrapper
- [ ] Criar `.claude/statusline/hooks-status.json`
- [ ] Implementar `getHooksStatus()`
- [ ] Exibir hooks executados + erros
- [ ] Testar detecção de erros

### Sprint 4: Detecção de Agentes Ativos (4-6h)
- [ ] Implementar `agent-tracker.js`
- [ ] Adicionar ao `settings.json`
- [ ] Criar `.claude/statusline/active-agents.json`
- [ ] Implementar `getActiveAgents()`
- [ ] Exibir agentes ativos no statusline
- [ ] Testar detecção dinâmica

### Sprint 5: UI Final (2-3h)
- [ ] Implementar layout completo com bordas
- [ ] Adicionar cores e formatação
- [ ] Implementar truncamento inteligente (se terminal pequeno)
- [ ] Adicionar modo verbose vs compact
- [ ] Testar em vários tamanhos de terminal
- [ ] Documentar customização

---

## 📊 Estrutura de Arquivos

```
.claude/
├── statusline/
│   ├── legal-braniac-statusline.js      # Script principal
│   ├── hooks-status.json                # Status de hooks executados
│   ├── active-agents.json               # Agentes ativos detectados
│   ├── active-context.json              # Contexto injetado (alternativa)
│   └── README.md                        # Documentação
├── hooks/
│   ├── hook-wrapper.js                  # Wrapper para tracking
│   ├── agent-tracker.js                 # Detecta menções a agentes
│   └── ... (hooks existentes)
└── settings.json                        # Configuração (modificado)
```

---

## ⚙️ Configuração Final (settings.json)

```json
{
  "_comment": "Status line customizado Legal-Braniac",
  "statusLine": {
    "type": "command",
    "command": "node .claude/statusline/legal-braniac-statusline.js",
    "padding": 0
  },

  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/session-context-hybrid.js" },
          { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/invoke-legal-braniac-hybrid.js" },
          { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/venv-check.js" },
          { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/git-status-watcher.js" },
          { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/data-layer-validator.js" },
          { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/dependency-drift-checker.js" },
          { "command": "node .claude/hooks/hook-wrapper.js .claude/hooks/corporate-detector.js" },
          { "command": "node .claude/hooks/agent-tracker.js", "_note": "Detecta agentes ativos" }
        ]
      }
    ]
  }
}
```

---

## 🧪 Testes

### Teste 1: Leitura de JSON
```bash
echo '{"workspace":{"current_dir":"/home/user/Claude-Code-Projetos"},"model":{"display_name":"claude-3-5-sonnet"}}' | \
  node .claude/statusline/legal-braniac-statusline.js
```

Resultado esperado:
```
┌─ LEGAL-BRANIAC ─ 🧠 sonnet-3.5 | 📂 Claude-Code-Projetos | ...
```

### Teste 2: Auto-Discovery
```bash
node .claude/statusline/legal-braniac-statusline.js
# (simular entrada com JSON mock)
```

Resultado esperado:
```
│ 🤖 AGENTES: 7 | 📦 SKILLS: 34 | 🔧 HOOKS: 7
```

### Teste 3: Detecção de Erros
```bash
# Simular hook com erro
node .claude/hooks/hook-wrapper.js .claude/hooks/venv-check.js
# (sem venv ativo)

# Verificar status
cat .claude/statusline/hooks-status.json
```

### Teste 4: Integração Completa
```bash
claude
# Statusline deve aparecer no rodapé
```

---

## 🔧 Manutenção

### Adicionar Novo Agente
1. Criar `.claude/agents/novo-agente.md`
2. Reiniciar Claude CLI
3. Statusline auto-detecta via `discoverAgents()`

### Adicionar Novo Hook
1. Criar hook em `.claude/hooks/novo-hook.js`
2. Adicionar a `settings.json` com wrapper
3. Statusline auto-detecta e trackeia execução

### Debugar Problemas
```bash
# Verificar logs de hooks
cat .claude/statusline/hooks-status.json

# Verificar agentes ativos
cat .claude/statusline/active-agents.json

# Testar statusline isoladamente
echo '{"workspace":{"current_dir":"."}}' | \
  node .claude/statusline/legal-braniac-statusline.js
```

---

## 📚 Referências

- **Claude Code Docs:** https://docs.claude.com/en/docs/claude-code/statusline
- **ccstatusline:** https://github.com/sirmalloc/ccstatusline
- **claude-code-statusline:** https://github.com/rz1989s/claude-code-statusline
- **ANSI Colors:** https://en.wikipedia.org/wiki/ANSI_escape_code

---

## 🎯 Resultado Final Esperado

Ao executar `claude` no terminal, você verá:

```
┌─ LEGAL-BRANIAC ────────────────────────────────────────────────────────┐
│ 🧠 sonnet-3.5 | 📂 Claude-Code-Projetos | 🌿 main | 💰 $1.25 | 📊 95k  │
├─ SISTEMA ─────────────────────────────────────────────────────────────┤
│ 🤖 AGENTES: 7 disponíveis | 📦 SKILLS: 34 disponíveis                   │
│ 🔧 HOOKS: 7 ativos | ✅ 6 OK | ❌ 1 erro (venv-check)                   │
├─ ATIVOS AGORA ────────────────────────────────────────────────────────┤
│ 🧠 legal-braniac | desenvolvimento                                       │
└─────────────────────────────────────────────────────────────────────────┘

> Digite sua mensagem...
```

**Benefícios:**
- ✅ Visibilidade total em tempo real
- ✅ Controle sobre agentes/skills/hooks ativos
- ✅ Detecção imediata de erros
- ✅ Acompanhamento de custos e tokens
- ✅ Contexto completo sempre visível

---

**Próximos Passos:** Implementar Sprint 1 (MVP) e testar!

**Tempo estimado total:** 13-19 horas (pode ser feito em 2-3 dias)

**Prioridade:** Alta (resolve problema crítico de visibilidade)
