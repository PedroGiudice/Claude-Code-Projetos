# Guia Completo de Prompt Engineering para Claude Code com Opus 4.5

Este relatório preenche os gaps identificados no guia existente, fornecendo documentação atualizada (2025-2026) sobre recursos disponíveis via autenticação Login.

---

## 1. Sistema de Hooks: Automação de Eventos

O Claude Code oferece **10 eventos de hook** que permitem executar scripts em pontos específicos do workflow:

| Hook Event | Quando Dispara | Pode Bloquear? |
|------------|----------------|----------------|
| **PreToolUse** | Antes da execução de tools | Sim (exit code 2) |
| **PostToolUse** | Após tools completarem | Não |
| **UserPromptSubmit** | Quando usuário submete prompt | Sim |
| **PermissionRequest** | Quando diálogo de permissão apareceria | Sim |
| **Notification** | Quando Claude envia notificações | Não |
| **Stop** | Quando Claude termina resposta | Sim (pode forçar continuar) |
| **SubagentStop** | Quando subagents completam | Sim |
| **PreCompact** | Antes de compactação de contexto | Não |
| **SessionStart** | Quando sessão inicia | Não |
| **SessionEnd** | Quando sessão termina | Não |

### Configuração em settings.json

Hooks são configurados em três níveis de precedência:
- **Projeto compartilhado**: `.claude/settings.json`
- **Projeto local**: `.claude/settings.local.json` (não commitado)
- **Usuário**: `~/.claude/settings.json`

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.command' | ./validate.sh",
            "timeout": 60
          }
        ]
      }
    ]
  }
}
```

### Sintaxe de Matcher

- String simples: `"Write"` - apenas tool Write
- Múltiplos: `"Write|Edit|MultiEdit"` - vários tools
- Wildcard: `"*"` ou `""` - todos os tools
- Com argumentos: `"Bash(npm test*)"` - comandos específicos
- MCP tools: `"mcp__memory__create_entities"`

### Exemplos Práticos de Hooks

**Auto-formatação após edição TypeScript:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '.tool_input.file_path' | { read file_path; if echo \"$file_path\" | grep -q '\\.ts$'; then npx prettier --write \"$file_path\"; fi; }"
          }
        ]
      }
    ]
  }
}
```

**Bloqueio de comandos perigosos:**
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_COMMAND\" | grep -E \"(rm -rf /|sudo rm|chmod 777)\" > /dev/null; then echo '❌ Comando perigoso bloqueado' && exit 2; fi"
          }
        ]
      }
    ]
  }
}
```

**Injeção de contexto no início de sessão:**
```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "git status --short && echo '---' && cat TODO.md"
          }
        ]
      }
    ]
  }
}
```

**Variáveis de ambiente disponíveis:**
- `CLAUDE_PROJECT_DIR`: Caminho absoluto do projeto
- `CLAUDE_CODE_REMOTE`: "true" para ambiente web
- `CLAUDE_ENV_FILE`: Para persistir variáveis em SessionStart

**Exit codes:**
- `0`: Sucesso - stdout mostrado ao usuário
- `2`: Bloquear/Erro - stderr vira mensagem de erro, ação impedida

---

## 2. Sistema de Skills: Conhecimento Modular

Skills são pacotes de instruções que Claude carrega dinamicamente baseado no contexto da conversa.

### Estrutura de Diretórios

```
~/.claude/skills/skill-name/     # Skills pessoais (todos projetos)
.claude/skills/skill-name/       # Skills do projeto (compartilhados via git)
```

```
my-skill/
├── SKILL.md           # Obrigatório - instruções principais
├── reference.md       # Documentação adicional
├── examples.md        # Exemplos de uso
├── scripts/
│   └── helper.py      # Scripts utilitários
└── templates/
    └── template.txt   # Templates
```

### Formato YAML Frontmatter

```yaml
---
name: code-reviewer
description: Review code for best practices and security issues. Use when reviewing code, checking PRs, or analyzing quality.
allowed-tools: Read, Grep, Glob
dependencies:
  - eslint
  - prettier
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/security-check.sh"
user-invocable: true
---

# Code Reviewer

## Review Checklist
1. Code organization and structure
2. Error handling
3. Performance considerations
4. Security concerns
5. Test coverage
```

**Campos obrigatórios:**
- `name`: Letras minúsculas, números, hífens (max 64 caracteres)
- `description`: O que faz e quando usar (max 1024 caracteres) - **crítico para descoberta**

**Campos opcionais:**
- `allowed-tools`: Restringe tools disponíveis quando skill ativa
- `dependencies`: Pacotes necessários
- `hooks`: Hooks específicos do componente
- `user-invocable`: false para esconder do menu

### Trigger Patterns

Skills são **model-invoked** - Claude decide autonomamente quando usar baseado na descrição:

```yaml
# ❌ Muito vago
description: Helps with documents

# ✅ Específico com triggers
description: Extract text and tables from PDF files, fill forms, merge documents. Use when working with PDF files or when user mentions PDFs, forms, or document extraction.
```

### Progressive Disclosure (3 Níveis)

1. **Metadados** (sempre carregados): `name` e `description` no system prompt
2. **Conteúdo principal** (carregado no trigger): Corpo do SKILL.md
3. **Arquivos adicionais** (sob demanda): Referências, templates, scripts

### Marketplaces de Skills

```bash
# Marketplace oficial Anthropic
/plugin marketplace add anthropics/claude-code
/plugin install document-skills@anthropic-agent-skills

# Registros da comunidade
# claude-plugins.dev - 9,595+ plugins e 52,000+ skills
npx claude-plugins install @anthropics/skills/pdf-processing
```

---

## 3. Sistema de Slash Commands Customizados

### Comandos Built-in Principais

| Comando | Propósito |
|---------|-----------|
| `/compact [instructions]` | Compacta conversa com instruções opcionais |
| `/clear` | Limpa histórico de conversa |
| `/context` | Visualiza uso de contexto |
| `/cost` | Mostra estatísticas de tokens |
| `/init` | Inicializa projeto com CLAUDE.md |
| `/mcp` | Gerencia conexões MCP |
| `/model` | Seleciona modelo AI |
| `/rewind` | Reverte conversa e/ou código |
| `/sandbox` | Habilita bash sandboxed |
| `/security-review` | Review de segurança |
| `/usage` | Mostra limites de uso |

### Criando Commands Customizados

**Localizações:**
- **Projeto**: `.claude/commands/` → prefixo `/project:`
- **Pessoal**: `~/.claude/commands/` → prefixo `/user:`

**Exemplo completo com frontmatter:**

```markdown
---
allowed-tools: Bash(git add:*), Bash(git commit:*), Bash(git status:*)
argument-hint: [message]
description: Create a git commit with auto-generated message
model: claude-sonnet-4-5
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate-commit.sh"
---

## Context
- Current changes: !`git diff HEAD`
- Staged files: !`git diff --cached`

Create a meaningful commit message based on the changes above. Follow conventional commits format: type(scope): description

Commit message for: $ARGUMENTS
```

### Argumentos e Parâmetros

```markdown
# Todos argumentos com $ARGUMENTS
Fix issue #$ARGUMENTS following our coding standards
# Usage: /fix-issue 123 high-priority

# Argumentos posicionais $1, $2, $3...
Review PR #$1 with priority $2 and assign to $3
# Usage: /review-pr 456 high alice
```

### Features Avançadas

**Execução Bash (prefixo `!`):**
```markdown
Current status: !`git status`
Current diff: !`git diff HEAD`
```

**Referências de arquivo (prefixo `@`):**
```markdown
Review the implementation in @src/utils/helpers.js
```

---

## 4. Integração MCP (Model Context Protocol)

### Configuração .mcp.json

```json
{
  "mcpServers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/"
    },
    "database": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@bytebase/dbhub", "--dsn", "postgresql://user:pass@host:5432/db"],
      "env": {
        "DB_TIMEOUT": "30000"
      }
    }
  }
}
```

### Métodos de Instalação

```bash
# HTTP remoto (recomendado para serviços cloud)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/
claude mcp add --transport http sentry https://mcp.sentry.dev/mcp
claude mcp add --transport http notion https://mcp.notion.com/mcp

# Stdio local
claude mcp add --transport stdio airtable --env AIRTABLE_API_KEY=YOUR_KEY \
  -- npx -y airtable-mcp-server

# De JSON
claude mcp add-json weather-api '{"type":"http","url":"https://api.weather.com/mcp"}'
```

### Escopos de Instalação

| Escopo | Armazenamento | Uso |
|--------|---------------|-----|
| `local` (default) | `~/.claude.json` | Pessoal, projeto atual |
| `project` | `.mcp.json` | Time (via git) |
| `user` | `~/.claude.json` | Todos seus projetos |

### Servidores MCP Populares

| Servidor | Propósito |
|----------|-----------|
| **GitHub** | PRs, issues, repos |
| **Sentry** | Monitoramento de erros |
| **Notion** | Knowledge base |
| **PostgreSQL** | Queries em banco |
| **Filesystem** | Operações de arquivo |
| **Puppeteer** | Automação browser |

### Limitações no Modo Login

- **Pro ($20/mo)**: ~45 mensagens/5h, 10-40 prompts Claude Code
- **Max 5x ($100/mo)**: ~225 mensagens/5h, 50-200 prompts
- **Max 20x ($200/mo)**: ~900 mensagens/5h, 200-800 prompts
- **API key sobrepõe**: Se `ANTHROPIC_API_KEY` está definida, usa API em vez de subscription

**Impacto de tokens MCP:**
- Linear MCP: ~14K tokens (7% de 200K contexto)
- 5 servidores: ~55K tokens antes da conversa começar
- **Recomendação**: Desabilitar servidores não essenciais

---

## 5. Otimização de Tokens

### Estratégias de Batching

```
# ❌ Desperdiça tokens
Update line 45 of auth.js
Then update line 67 of auth.js

# ✅ Eficiente
Batch these auth.js changes:
- Line 45: [change]
- Line 67: [change]
- Line 89: [change]
```

### Best Practices do /compact

**Quando usar:**
- A **70% de capacidade** do contexto (não esperar auto-compact a 95%)
- Em milestones quando algo funciona
- Após longas sessões de debug

**Instruções customizadas:**
```
/compact summarize only architectural decisions and file changes, omit debugging attempts
/compact preserve the coding patterns we established
```

### Padrão "Document & Clear"

Para tarefas complexas:
1. Claude despeja plano e progresso em arquivo .md
2. `/clear` o contexto
3. Nova sessão referenciando o arquivo .md

### Resultados Quantitativos

- **54% redução** em tokens iniciais com otimização de contexto
- **50-70% economia** com gerenciamento adequado
- **60% redução de custo** com documentação em camadas
- **85% redução** com Tool Search Tool (API)

### Configuração de Ambiente

```bash
export MAX_THINKING_TOKENS=0       # Desabilita thinking
export MAX_THINKING_TOKENS=10000   # Define budget específico
export DISABLE_COST_WARNINGS=1     # Oculta avisos de custo
```

---

## 6. Modos de Thinking

### Modos Disponíveis

1. **Standard** (default para maioria): Sem extended thinking
2. **Extended Thinking**: Raciocínio dedicado antes da resposta
3. **Interleaved Thinking** (Claude 4 apenas): Raciocínio entre tool calls

**Defaults por modelo:**
- **Opus 4.5 e Sonnet 4.5**: Thinking habilitado por default
- Outros modelos: Thinking desabilitado

### Como Configurar

**Toggle durante sessão:**
- **Tab**: Alterna thinking on/off (persistente entre sessões)
- **Shift+Tab**: Cicla entre modos de permissão
- **Ctrl+O**: Modo verbose (ver thinking)

**Palavras-gatilho (budget crescente):**
```
"think" < "think hard" < "think harder" < "ultrathink"
```

### Parâmetro budget_tokens (API)

```json
{
    "model": "claude-opus-4-5",
    "max_tokens": 16000,
    "thinking": {
        "type": "enabled",
        "budget_tokens": 10000
    }
}
```

**Especificações:**
- **Mínimo**: 1,024 tokens
- **Recomendado**: 16k+ para tarefas complexas
- **Máximo testado**: 32k+ (use batch processing acima disso)
- `budget_tokens` deve ser MENOR que `max_tokens`

### Impacto no Rate Limit

- Tokens de thinking contam como output tokens
- Contam para limite de tokens-por-minuto (TPM)
- **Para Login tier**: Use thinking estrategicamente apenas para tarefas genuinamente complexas

### Trade-offs de Performance

| Aspecto | Standard | Extended | Interleaved |
|---------|----------|----------|-------------|
| **Latência** | Rápida | Mais lenta (10-30s) | Variável |
| **Precisão** | Boa | Muito melhor | Melhor para tool chains |
| **Custo** | Menor | Maior | Maior |
| **Uso** | Queries simples | Raciocínio complexo | Workflows agênticos |

---

## 7. Padrões de Error Handling

### Retry com Exponential Backoff

```python
def retry_with_backoff(func, max_retries=5, base_delay=1, max_delay=60):
    for attempt in range(max_retries):
        try:
            return func()
        except TransientError as e:
            if attempt == max_retries - 1:
                raise
            delay = min(base_delay * (2 ** attempt), max_delay)
            jitter = delay * 0.25 * (2 * random.random() - 1)
            time.sleep(delay + jitter)
```

### Classificação de Erros

| Tipo | Status Codes | Estratégia |
|------|--------------|------------|
| Transiente | 429, 500, 502, 503 | Retry com backoff |
| Permanente | 400, 401, 403, 404 | Não retry - corrigir |
| Rate Limit | 429 | Respeitar header Retry-After |

### Circuit Breaker Pattern

```python
class CircuitBreaker:
    """Três estados: CLOSED (normal), OPEN (fail fast), HALF_OPEN (testando)"""
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failure_count = 0
        self.state = "CLOSED"
```

### Prompt Template para Debugging

```markdown
I'm experiencing this bug: {{BUG_DESCRIPTION}}

Use the four-phase debugging methodology:
1. REPRODUCE: Confirm bug exists with minimal test case
2. ISOLATE: Binary search through code/commits
3. DIAGNOSE: Identify root cause (not symptoms)
4. FIX: Apply minimal, targeted fix

Think step by step. Do NOT jump to solutions before understanding root cause.
```

### Configuração em CLAUDE.md

```markdown
## Error Recovery Patterns

IMPORTANT: When encountering errors:
1. YOU MUST read error messages completely before attempting fixes
2. Run tests after EACH change to verify the fix
3. If the same error occurs 3 times, try a different approach
4. Document the root cause in comments
```

---

## 8. Padrões de Workflow Agêntico

### Workflow Recomendado: Explore → Plan → Code → Commit

```markdown
1. **Explore**: Ask Claude to read files, images, URLs
   - "Read the file that handles logging, but don't write code yet"

2. **Plan**: Use extended thinking
   - Trigger words: "think" < "think hard" < "ultrathink"
   - Save plan to document for rollback point

3. **Code**: Implement with verification
   - Use sub-agents to verify implementation

4. **Commit**: Create PR and update docs
```

### Padrão TDD

```markdown
1. Write tests based on expected input/output pairs
   - "We're doing TDD, avoid mock implementations"
2. Run tests and confirm they FAIL
   - "Don't write implementation code yet"
3. Commit the tests when satisfied
4. Write code that passes tests
   - "Don't modify the tests"
5. Commit the passing code
```

### Arquitetura de Dois Agentes para Tarefas Longas

**Initializer Agent** (primeira sessão):
- Cria `feature_list.json` com casos de teste
- Escreve `init.sh` para setup
- Cria `claude-progress.txt` para handoff

**Coding Agent** (sessões subsequentes):
- Lê arquivos de progresso e git logs
- Trabalha em UMA feature por vez
- Commita após cada feature
- Atualiza arquivo de progresso antes de terminar

### Human-in-the-Loop Patterns

**Configuração de aprovação em CLAUDE.md:**
```markdown
## Approval Requirements

IMPORTANT: For the following actions, YOU MUST ask for confirmation:
- Database schema changes
- Deleting files or directories
- Git push to main/master
- Infrastructure changes
- Changes affecting more than 10 files

Present summary and wait for "proceed" or "abort".
```

### Modos de Permissão

| Modo | Comando | Uso |
|------|---------|-----|
| Interactive | `claude` | Desenvolvimento normal |
| Auto-accept | `shift+tab` | Semi-autônomo |
| YOLO Mode | `--dangerously-skip-permissions` | Totalmente autônomo |
| Sandboxed | `/sandbox` | Autônomo seguro |

### Execução Paralela com Git Worktrees

```bash
git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b

# Lançar Claude em cada (terminais separados)
cd ../project-feature-a && claude
cd ../project-feature-b && claude
```

---

## 9. Prompts Específicos por Tipo de Projeto

### CLAUDE.md para Monorepo

```markdown
# Full-stack Application Monorepo

## Architecture
- Using pnpm workspaces
- apps/: Applications (web, mobile, api)
- packages/: Shared packages (ui, utils, types)

## Navigation
- Run commands from root: `pnpm --filter {{package}} {{command}}`
- Shared types: `packages/types/src/`

## Cross-Package Changes
When modifying shared packages:
1. Check all consumers: `pnpm why {{package}}`
2. Update types first, then implementations
3. Run full test suite: `pnpm test`

## Commands
pnpm install          # Install all dependencies
pnpm run dev          # Start all apps
pnpm --filter web dev # Start only web app
```

### CLAUDE.md para React

```markdown
# React Application

## Stack
- React 18 with TypeScript
- Vite for bundling
- React Query for server state
- Zustand for client state
- Tailwind CSS for styling

## Component Patterns
- Use functional components with hooks
- Prefer composition over inheritance
- Extract logic into custom hooks
- Co-locate tests: Component.test.tsx

## Code Style
- Named exports for components
- Props interface above component
- Destructure props in function signature
```

### CLAUDE.md para Python Backend

```markdown
# Python Backend Service

## Stack
- Python 3.12+
- FastAPI for REST API
- SQLAlchemy 2.0 for ORM
- Pydantic v2 for validation

## Type Hints
- Modern syntax: `str | int` not `Union[str, int]`
- `dict[str, str]` not `Dict[str, str]`

## Commands
uv run pytest              # Run tests
uv run ruff check .        # Lint
uv run ruff format .       # Format
uv run alembic upgrade head # Run migrations
```

### CLAUDE.md para Go

```markdown
# Go Service

## Patterns
- Accept interfaces, return structs
- Error wrapping with %w
- Context propagation
- Table-driven tests

## Commands
go run ./cmd/api      # Run API
go test ./...         # Run all tests
go test -race ./...   # Test with race detector
golangci-lint run     # Lint
```

---

## 10. Anti-Patterns para Opus 4.5

### ❌ Não usar palavra "think" com thinking desabilitado

Opus 4.5 é particularmente sensível:

```
❌ Ruim: "Think about how to solve this"
✅ Bom: "Consider how to solve this" / "Evaluate the options"
```

### ❌ Não usar linguagem agressiva para tools

Opus 4.5 é MAIS responsivo a system prompts:

```
❌ Ruim: "CRITICAL: You MUST use this tool when..."
✅ Bom: "Use this tool when..."

❌ Ruim: "ALWAYS call the search function before..."
✅ Bom: "Call the search function before..."
```

### ❌ Não deixar contexto encher

```
❌ Ruim: Esperar compactação automática a 200k tokens
✅ Bom: Limpar a 60k tokens (30% threshold) com /clear
```

### ❌ Não usar MCP pesado (>20k tokens)

"Se você está usando mais de 20k tokens de MCPs, está prejudicando Claude. Isso deixaria apenas 20k tokens de trabalho real antes do contexto estar comprometido."

### ❌ Não criar CLAUDE.md com mais de 2,000 tokens

- Baseline de 20k tokens (10% de 200K contexto) causa degradação
- Manter root CLAUDE.md em 100-200 linhas máximo

### ❌ Não dizer "can you suggest" quando quer implementação

```
❌ Ruim: "Can you suggest some changes?"
✅ Bom: "Implement these changes" / "Make the fix"
```

### ❌ Não pular planejamento

- Use Shift+Tab para entrar em planning mode 90% do tempo
- Sem planejamento, Claude tende a pular direto para código

---

## 11. Atualizações Recentes 2025-2026

### Timeline de Features Principais

**Abril 2025:**
- CLAUDE.md memory files com suporte `@import`
- Custom slash commands em `.claude/commands/`
- Modo "Ultrathink": Diga 'think', 'think harder', ou 'ultrathink'

**Setembro 2025 - VS Code Extension & Version 2.0:**
- **Extensão nativa VS Code (Beta)** com painel sidebar
- **Checkpoints** com comando `/rewind`
- **Sonnet 4.5** como modelo default
- Claude Agent SDK

**Outubro 2025:**
- Sistema de Skills (beta `skills-2025-10-02`)
- Agent Skills: pastas organizadas de instruções

**Novembro 2025 - Claude Opus 4.5:**
- **Claude Opus 4.5** (`claude-opus-4-5-20251101`)
- Preço: $5/$25 por milhão de tokens (antes $15/$75)
- **Parâmetro effort** (low/medium/high)
- 200k context window, 64k output limit

**Dezembro 2025:**
- **Sistema de plugins** com marketplaces
- Claude in Chrome (Beta)
- Background agents e named sessions
- `/teleport` para continuidade de sessão no claude.ai
- LSP support
- Async sub-agents para execução paralela

### Deprecations e Breaking Changes

| Item | Status | Migração |
|------|--------|----------|
| Claude Sonnet 3.5 | **Retired** Out 2025 | Use Sonnet 4.5 |
| Claude Sonnet 3.7 | Deprecated | Use Sonnet 4.5 |
| Claude Opus 3 | Deprecated | Use Opus 4.5 |
| Atalho `#` | **Removido** | Peça ao Claude editar CLAUDE.md |
| Ctrl+Z | **Mudou** | Agora suspende (era undo, agora Ctrl+U) |

### Novos Slash Commands

| Comando | Descrição |
|---------|-----------|
| `/model` | Trocar modelos |
| `/rewind` | Reverter para checkpoint |
| `/agents` | Criar subagents customizados |
| `/skills` | Gerenciar skills |
| `/teleport` | Retomar sessão no claude.ai |
| `/plugin install` | Instalar plugins |

---

## 12. Biblioteca de Templates

### Code Review Completo

```markdown
---
description: Comprehensive code review with checklist
allowed-tools: Bash(git:*), Read, Grep
---

Perform comprehensive code review of recent changes:
1. Check code follows TypeScript and React conventions
2. Verify proper error handling and loading states
3. Ensure accessibility standards are met
4. Review test coverage for new functionality
5. Check for security vulnerabilities
6. Validate performance implications
7. Confirm documentation is updated

Current diff: !`git diff origin/main...HEAD`
```

### Refactoring Seguro

```markdown
I need to refactor {{FILE_PATH}}. Before any code changes:
1. Research existing patterns in this codebase
2. Analyze related files and dependencies
3. Create step-by-step refactoring plan
4. Estimate token/time requirements

WAIT for my approval before making any code changes!

Refactoring goal: {{DESCRIBE_REFACTORING_GOAL}}
Constraints: {{ANY_CONSTRAINTS}}
```

### Bug Fixing Sistemático

```markdown
I'm experiencing this bug: {{BUG_DESCRIPTION}}

Use four-phase debugging methodology:
1. REPRODUCE: Confirm bug exists with minimal test case
2. ISOLATE: Narrow down to smallest reproducing case
3. DIAGNOSE: Identify root cause (not symptoms)
4. FIX: Apply minimal, targeted fix

Think step by step. Do NOT jump to solutions before understanding root cause.
```

### Geração de Testes

```markdown
Create comprehensive tests for {{FILE_PATH}}:
- Use Jest and testing-library conventions
- Target 80%+ code coverage
- Include: happy path, error handling, boundary conditions, edge cases
- Use factory functions for test data: getMock{{Entity}}(overrides)
- Follow AAA pattern: Arrange, Act, Assert

Do NOT use mocks for internal modules.
```

### Security Audit

```markdown
Run security review on current diff. Flag:
- Authentication/authorization boundaries
- Cookie/CSRF settings
- Header parsing vulnerabilities
- Secret/credential exposure
- SQL injection risks
- XSS vulnerabilities
- Path traversal issues
- Input validation problems

Provide line-anchored fixes with rationale for each finding.
Focus on EXPLOITABLE vulnerabilities, not theoretical risks.
```

---

## 13. Padrões de Context Injection

### Prefilling (API)

```python
messages=[
    {"role": "user", "content": "Analyze this code for bugs: {{CODE}}"},
    {"role": "assistant", "content": "## Bug Analysis\n\n"}  # Prefill
]
```

### Forçar JSON Output

```python
messages=[
    {"role": "user", "content": "Return the data as JSON"},
    {"role": "assistant", "content": "{"}  # Força início JSON
]
```

### Hook para Injeção Dinâmica

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "\"$CLAUDE_PROJECT_DIR\"/.claude/hooks/inject-context.sh",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

### CLAUDE.md Otimizado (Manter <100 linhas)

```markdown
# Project: {{NAME}}

## Quick Facts
- Stack: {{STACK}}
- Test: `{{TEST_COMMAND}}`
- Lint: `{{LINT_COMMAND}}`

## Key Rules
1. {{CRITICAL_RULE_1}}
2. {{CRITICAL_RULE_2}}

## Skill Triggers
| Trigger Keywords | Skill to Load |
|------------------|---------------|
| test, spec, tdd | testing-patterns |
| form, validation | form-patterns |
```

---

## 14. Benchmarks de Performance

### SWE-bench Verified

| Modelo | Score |
|--------|-------|
| **Claude Opus 4.5** | **80.9%** (primeiro a exceder 80%) |
| Claude Sonnet 4.5 | 77.2% |
| GPT-5.1 | ~76.3% |
| Gemini 3 Pro | ~76.2% |

### Eficiência de Tokens (Opus 4.5)

- **67% mais barato**: $5/$25 por milhão (antes $15/$75)
- **76% menos output tokens** para trabalho equivalente
- **65% menos tokens** alcançando maior taxa de sucesso

### Terminal-Bench

| Modelo | Score |
|--------|-------|
| Claude Opus 4.5 | 59.3% |
| Gemini 3 Pro | 54.2% |
| GPT-5.1 | 47.6% |

### Relatórios Enterprise

- "50% a 75% reduções em erros de tool calling e build/lint com Opus 4.5"
- "Consistentemente termina tarefas complexas em menos iterações"

---

## 15. Integração com IDEs

### VS Code (Extensão Oficial Beta - Set 2025)

**Instalação**: [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)

**Features:**
- Painel sidebar nativo
- Plan mode com review antes de aceitar
- Auto-accept edits mode
- Extended thinking toggle
- @-mention files com ranges de linha
- Múltiplas sessões simultâneas

**Não implementado ainda:**
- UI para configuração MCP/Plugin (usar `/mcp` ou `/plugin`)
- Checkpoints e `/rewind`
- Atalhos `#` e `!`

### JetBrains (Plugin Oficial)

**Atalhos:**
- `Cmd+Esc` (Mac) / `Ctrl+Esc` (Windows/Linux): Quick launch
- `Cmd+Option+K` / `Alt+Ctrl+K`: Referência de arquivo

**Features:**
- Diff viewing no IDE
- Selection context compartilhado
- Diagnostic sharing automático

### Neovim

**Plugin recomendado**: `claudecode.nvim` (by Coder)

```lua
{
  "coder/claudecode.nvim",
  dependencies = { "folke/snacks.nvim" },
  opts = {
    auto_start = true,
    track_selection = true,
    terminal = {
      split_side = "right",
      split_width_percentage = 0.30,
    },
  },
}
```

### Emacs

**Package**: `claude-code-ide.el`

**Features:**
- Integração MCP nativa
- Detecção automática de projeto via project.el
- Integração LSP via xref
- Análise Tree-sitter
- Diff via ediff

**Instalação:**
```elisp
(use-package claude-code-ide
  :vc (:url "https://github.com/manzaltu/claude-code-ide.el" :rev :newest)
  :bind ("C-c C-'" . claude-code-ide))
```

### Comparativo Cross-IDE

| Feature | VS Code Ext | VS Code CLI | JetBrains | Neovim |
|---------|-------------|-------------|-----------|--------|
| UI Gráfica | ✅ Sidebar | ❌ Terminal | ❌ Terminal | ❌ Terminal |
| Plan Mode | ✅ | ✅ | ✅ | ✅ |
| Inline Diffs | ✅ Nativo | ✅ IDE diff | ✅ IDE diff | ✅ Vim diff |
| Checkpoints | ❌ (coming) | ✅ | ✅ | ✅ |

---

## Resumo de Recomendações Prioritárias

### Prioridade 1: Essencial
1. ✅ Criar CLAUDE.md (100-200 linhas máximo)
2. ✅ Usar Planning Mode antes de codificar
3. ✅ Limpar contexto a 60k tokens
4. ✅ Escrever testes primeiro (TDD)
5. ✅ Ser específico nas instruções
6. ✅ Revisar todo código gerado

### Prioridade 2: Alto Impacto
1. ✅ Sistema de docs (plan/context/tasks)
2. ✅ Skills com hooks de auto-ativação
3. ✅ Quality gate hooks (build/test/lint)
4. ✅ Referências visuais para trabalho UI

### Evitar
- ❌ Auto-formatting hooks (desperdício de tokens)
- ❌ MCP pesado (>20k tokens)
- ❌ Sistemas multi-agente complexos
- ❌ RAG para code search
- ❌ Instruções vagas
- ❌ Pular fase de planejamento
- ❌ Usar "think" com Opus 4.5 (extended thinking desabilitado)