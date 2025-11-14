# Status Line - Legal-Braniac System

Sistema de status line customizado para o projeto Claude-Code-Projetos. Exibe informações em tempo real sobre agentes, skills, hooks e contexto do projeto.

---

## 📋 Statuslines Disponíveis

### 1. **legal-braniac-statusline.js** ✨ (Orquestrador Principal)
**Agente:** Legal-Braniac (Coordenador Mestre)
**Características:**
- ✅ Único com emoji 🧠 (decisão de design)
- ✅ Tracking de execução via hook wrapper
- ✅ Exibe status de sucesso/erro do orquestrador
- ✅ Timestamp da última execução

**Formato:**
```
🧠 LEGAL-BRANIAC snt-4.5 | 📂 Claude-Code-Projetos | 🌿 main | 💰 $1.25 | 📊 95k
├ 🤖 7 agentes | 📦 34 skills | 🔧 7 hooks
└ ✅ LEGAL-BRANIAC success (5s ago)
```

---

### 2. **analise-dados-legal-statusline.js** (Clean UI)
**Agente:** Análise de Dados Legais
**Especialização:** Análise de métricas legais, publicações DJEN, estatísticas OAB

**Formato:**
```
[ANALISE-DADOS-LEGAL] snt-4.5 | DIR: Claude-Code-Projetos | BRANCH: main | COST: $1.25 | TOKENS: 95k
└ 7 agentes | 34 skills | 7 hooks
```

---

### 3. **desenvolvimento-statusline.js** (Clean UI)
**Agente:** Desenvolvimento
**Especialização:** Implementação técnica, coding, refactoring, Git operations, TDD

**Formato:**
```
[DESENVOLVIMENTO] snt-4.5 | DIR: Claude-Code-Projetos | BRANCH: main | COST: $1.25 | TOKENS: 95k
└ 7 agentes | 34 skills | 7 hooks
```

---

### 4. **documentacao-statusline.js** (Clean UI)
**Agente:** Documentação
**Especialização:** Documentação técnica, arquitetura, APIs, guias, onboarding

**Formato:**
```
[DOCUMENTACAO] snt-4.5 | DIR: Claude-Code-Projetos | BRANCH: main | COST: $1.25 | TOKENS: 95k
└ 7 agentes | 34 skills | 7 hooks
```

---

### 5. **legal-articles-finder-statusline.js** (Clean UI)
**Agente:** Legal Articles Finder
**Especialização:** Identificação de citações legais, extração de artigos de leis brasileiras

**Formato:**
```
[LEGAL-ARTICLES-FINDER] snt-4.5 | DIR: Claude-Code-Projetos | BRANCH: main | COST: $1.25 | TOKENS: 95k
└ 7 agentes | 34 skills | 7 hooks
```

---

### 6. **planejamento-legal-statusline.js** (Clean UI)
**Agente:** Planejamento Legal
**Especialização:** Planejamento de sistemas de automação legal, arquitetura de software jurídico

**Formato:**
```
[PLANEJAMENTO-LEGAL] snt-4.5 | DIR: Claude-Code-Projetos | BRANCH: main | COST: $1.25 | TOKENS: 95k
└ 7 agentes | 34 skills | 7 hooks
```

---

### 7. **qualidade-codigo-statusline.js** (Clean UI)
**Agente:** Qualidade de Código
**Especialização:** Code review, testing, debugging, auditoria, segurança

**Formato:**
```
[QUALIDADE-CODIGO] snt-4.5 | DIR: Claude-Code-Projetos | BRANCH: main | COST: $1.25 | TOKENS: 95k
└ 7 agentes | 34 skills | 7 hooks
```

---

## ⚙️ Como Configurar

Edite `.claude/settings.json` e adicione a configuração `statusLine`:

```json
{
  "statusLine": {
    "type": "command",
    "command": "node .claude/statusline/<nome-do-agente>-statusline.js",
    "padding": 0,
    "_note": "Status line customizado para <nome-do-agente>"
  }
}
```

**Exemplos:**
```json
// Para Legal-Braniac (orquestrador)
"command": "node .claude/statusline/legal-braniac-statusline.js"

// Para Desenvolvimento
"command": "node .claude/statusline/desenvolvimento-statusline.js"

// Para Documentação
"command": "node .claude/statusline/documentacao-statusline.js"
```

---

## 🧩 Arquitetura

### Auto-Discovery
Todos os statuslines detectam automaticamente:
- **Agentes:** Lê `.claude/agents/*.md`
- **Skills:** Lê `skills/*/SKILL.md`
- **Hooks:** Lê `.claude/settings.json`

### Hook Wrapper (apenas Legal-Braniac)
O Legal-Braniac usa o `hook-wrapper.js` para tracking de execução:
- Intercepta `invoke-legal-braniac-hybrid.js`
- Registra timestamp, status (success/error), output
- Salva em `.claude/statusline/hooks-status.json`

### Graceful Fallback
Se houver erro ao carregar dados, exibe mensagem genérica sem quebrar o Claude Code:
```
<Agente> Status (error loading data)
```

---

## 🎨 Decisões de Design

### Emojis
- **Legal-Braniac:** ✅ Único agente com emojis decorativos (🧠 📂 🌿 💰 📊)
- **Demais agentes:** ❌ SEM emojis (clean UI para não poluir interface)

**Motivo:** Legal-Braniac é o orquestrador principal - merece destaque visual.

### Cores ANSI
Todos usam a mesma paleta:
- **Cyan:** Nome do agente
- **Yellow:** Modelo (snt-4.5)
- **Blue:** Diretório
- **Green:** Branch, contadores
- **Magenta:** Custo
- **White:** Tokens
- **Dim:** Separadores

---

## 📁 Estrutura de Arquivos

```
.claude/statusline/
├── README.md                                   ← Você está aqui
├── legal-braniac-statusline.js                ← Orquestrador (com emojis)
├── analise-dados-legal-statusline.js          ← Clean UI
├── desenvolvimento-statusline.js              ← Clean UI
├── documentacao-statusline.js                 ← Clean UI
├── legal-articles-finder-statusline.js        ← Clean UI
├── planejamento-legal-statusline.js           ← Clean UI
├── qualidade-codigo-statusline.js             ← Clean UI
└── hooks-status.json                          ← Gerado automaticamente (gitignored)
```

---

## 🔧 Manutenção

### Adicionar Novo Statusline
1. Copiar template de um statusline existente (ex: `desenvolvimento-statusline.js`)
2. Trocar nome do agente no cabeçalho e função `generateHeader()`
3. Validar sintaxe: `node -c .claude/statusline/<novo>-statusline.js`
4. Configurar em `.claude/settings.json`

### Testar Statusline
```bash
echo '{"workspace":{"current_dir":"C:\\claude-work\\repos\\Claude-Code-Projetos"},"model":{"display_name":"claude-sonnet-4.5"},"git":{"branch":"main"},"tokens":{"total":95000},"cost":{"total_usd":1.25}}' | node .claude/statusline/<agente>-statusline.js
```

---

## 📜 Histórico

**2025-11-14 (Commit 1fefd6f):** Implementação inicial do Legal-Braniac com hook wrapper
**2025-11-14 (Este commit):** Expansão para os 6 agentes restantes (clean UI)

---

## 🚀 Próximos Passos (Opcional)

1. Adicionar tracking de execução para outros agentes (via hook wrappers)
2. Implementar detecção de agentes ativos (Sprint 4 do plano original)
3. UI final completa com bordas decorativas (Sprint 5 do plano original)

---

**Última atualização:** 2025-11-14
**Mantido por:** PedroGiudice
**Sistema:** Claude Code v2.0.31
