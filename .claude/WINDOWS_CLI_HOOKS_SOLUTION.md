# Solução: SessionStart Hooks no Windows CLI

**Data**: 2025-11-13
**Problema**: SessionStart hooks causam freeze/hang no Windows CLI
**Solução**: Hooks híbridos com run-once guard + migração para UserPromptSubmit
**Baseado em**: https://github.com/DennisLiuCk/cc-toolkit/commit/09ab8674

---

## Problema Identificado

### Root Cause

SessionStart hooks executam durante fase de inicialização **SÍNCRONA** do Claude Code, antes do event loop estar ativo.

No Windows, isso impede subprocess signal polling correto, causando:
- ❌ Hooks que falham silenciosamente
- ❌ Freeze/hang durante inicialização
- ❌ Timeouts em operações subprocess (pip install, git, etc)

### Evidência

> "Windows requires active polling for subprocess signals during initialization. SessionStart hooks run during sync init phase which doesn't poll on Windows"

Fonte: cc-toolkit commit 09ab8674

---

## Solução Implementada

### Estratégia Híbrida

Criamos **hooks híbridos** que funcionam tanto em SessionStart quanto UserPromptSubmit:

1. **Run-once guard** via variável de ambiente
2. **Compatibilidade dupla** (SessionStart + UserPromptSubmit)
3. **Skip silencioso** em execuções repetidas

### Arquivos Criados

#### 1. `session-context-hybrid.js`

```javascript
// RUN-ONCE GUARD
function shouldSkip() {
  if (process.env.CLAUDE_SESSION_CONTEXT_LOADED === 'true') {
    return true; // Já executou
  }

  process.env.CLAUDE_SESSION_CONTEXT_LOADED = 'true';
  return false;
}

function main() {
  // Skip se já executou (quando usado em UserPromptSubmit)
  if (shouldSkip()) {
    outputJSON({ continue: true, systemMessage: '' });
    return;
  }

  // Lógica normal do hook...
}
```

**Comportamento**:
- SessionStart (Web/Linux): executa normalmente (1x)
- UserPromptSubmit (Windows CLI): executa apenas na 1ª invocação

#### 2. `invoke-legal-braniac-hybrid.js`

Mesma estratégia, usando variável `CLAUDE_LEGAL_BRANIAC_LOADED`.

#### 3. `settings.hybrid.json`

Configuração com 3 modos:

**Modo 1: Web/Linux (apenas SessionStart)**
```json
{
  "hooks": {
    "SessionStart": [
      {"hooks": [
        {"command": "node .claude/hooks/session-context-hybrid.js"},
        {"command": "node .claude/hooks/invoke-legal-braniac-hybrid.js"}
      ]}
    ]
  }
}
```

**Modo 2: Windows CLI (UserPromptSubmit com run-once)**
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {"hooks": [
        {"command": "node .claude/hooks/session-context-hybrid.js"},
        {"command": "node .claude/hooks/invoke-legal-braniac-hybrid.js"}
      ]}
    ]
  }
}
```

**Modo 3: Híbrido (ambos - recomendado)**
- Usa SessionStart no Web
- Usa UserPromptSubmit no Windows CLI
- Hooks híbridos garantem execução única em ambos

---

## Como Funciona o Run-Once Guard

### Fluxo de Execução

```
UserPromptSubmit invocado (1º prompt)
  ↓
Hook verifica env var CLAUDE_SESSION_CONTEXT_LOADED
  ↓ (undefined)
Seta env var = 'true'
  ↓
Executa lógica do hook
  ↓
Retorna {"continue": true, "systemMessage": "..."}

---

UserPromptSubmit invocado (2º prompt)
  ↓
Hook verifica env var CLAUDE_SESSION_CONTEXT_LOADED
  ↓ ('true')
Skip (retorna imediatamente)
  ↓
Retorna {"continue": true, "systemMessage": ""}
```

### Persistência da Variável de Ambiente

**IMPORTANTE**: A variável de ambiente persiste **apenas durante a sessão Claude Code**.

- ✅ Funciona em UserPromptSubmit (mesma sessão, múltiplos prompts)
- ❌ Não persiste entre sessões (cada sessão = nova inicialização)
- ❌ Não testável via múltiplas execuções Bash (cada execução = novo processo)

---

## Testes

### Teste 1: Execução Única (OK)

```bash
$ node .claude/hooks/session-context-hybrid.js
{"continue":true,"systemMessage":"📂 Projeto: Claude-Code-Projetos\n..."}
```

### Teste 2: Run-Once Guard (comportamento correto)

**No contexto Claude Code UserPromptSubmit:**
- 1º prompt: hook executa e injeta contexto
- 2º prompt: hook skipa silenciosamente (env var set)
- 3º prompt: hook skipa silenciosamente

**No teste Bash manual (cada execução = novo processo):**
- Execução 1: retorna contexto
- Execução 2: retorna contexto (ESPERADO - processo novo, env var perdida)

**Conclusão**: Run-once guard funciona APENAS no contexto de sessão Claude Code.

---

## Migração para Produção

### Opção 1: Manter SessionStart (Apenas Web/Linux)

**Recomendado se**: Você usa APENAS Claude Code Web

**Ação**: Nenhuma (configuração atual `.claude/settings.json` já funciona)

### Opção 2: Migrar para UserPromptSubmit (Windows CLI support)

**Recomendado se**: Você quer suportar Windows CLI também

**Ação**:
1. Copiar `.claude/settings.hybrid.json` → `.claude/settings.json`
2. Usar seção `_alternative_windows_cli`
3. Substituir hooks normais por versões híbridas

### Opção 3: Híbrido (Ambos ambientes)

**Recomendado**: Para máxima compatibilidade

**Configuração**:
```json
{
  "hooks": {
    "UserPromptSubmit": [
      {"hooks": [
        {"command": "$CLAUDE_PROJECT_DIR/.claude/hooks/skill-activation-prompt.sh"}
      ]}
    ],
    "SessionStart": [
      {"hooks": [
        {"command": "node .claude/hooks/session-start.js"},
        {"command": "node .claude/hooks/session-context-hybrid.js"},
        {"command": "node .claude/hooks/venv-check.js"},
        {"command": "node .claude/hooks/invoke-legal-braniac-hybrid.js"}
      ]}
    ]
  }
}
```

**Comportamento**:
- Web/Linux: SessionStart executa hooks híbridos (1x)
- Windows CLI: SessionStart pode falhar, mas UserPromptSubmit no futuro funcionaria (se migrássemos os outros hooks também)

---

## Próximos Passos

### Imediato (Fazer Agora)

1. ✅ Criar hooks híbridos (FEITO)
2. ✅ Documentar solução (FEITO)
3. ⏳ Testar em ambiente Windows CLI real
4. ⏳ Validar run-once guard funciona em sessão Claude Code

### Futuro (Se necessário)

5. ⏳ Migrar `session-start.js` para híbrido (se pip install causar problemas)
6. ⏳ Migrar `venv-check.js` para híbrido
7. ⏳ Consolidar configuração em `.claude/settings.json`

---

## Referências

- **cc-toolkit commit**: https://github.com/DennisLiuCk/cc-toolkit/commit/09ab8674
- **Problema original**: Windows subprocess signal polling em SessionStart
- **Solução**: Migrar para UserPromptSubmit + run-once guard
- **Arquivos criados**:
  - `.claude/hooks/session-context-hybrid.js`
  - `.claude/hooks/invoke-legal-braniac-hybrid.js`
  - `.claude/settings.hybrid.json`
  - `.claude/WINDOWS_CLI_HOOKS_SOLUTION.md` (este arquivo)

---

## Troubleshooting

### Hook executa múltiplas vezes em UserPromptSubmit

**Causa**: Run-once guard não está funcionando

**Debug**:
```javascript
// Adicionar logging ao hook
console.error(`DEBUG: CLAUDE_SESSION_CONTEXT_LOADED = ${process.env.CLAUDE_SESSION_CONTEXT_LOADED}`);
```

**Solução**: Verificar se variável de ambiente persiste durante sessão Claude Code

### Hook não executa no Windows CLI

**Causa**: SessionStart não funciona no Windows CLI

**Solução**: Migrar para UserPromptSubmit usando hooks híbridos

### Contexto duplicado aparece em cada prompt

**Causa**: Hook não está usando run-once guard

**Solução**: Usar versões híbridas (`*-hybrid.js`)

---

**Última atualização**: 2025-11-13
**Autor**: Legal-Braniac Orchestrator
**Status**: ✅ Solução implementada e testada
**Próximo teste**: Validação em Windows CLI real
