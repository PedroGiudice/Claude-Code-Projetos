# vibe-analyze-prompt.js - Gordon AI Coach Hook

**Versão:** 1.0.0
**Data:** 2025-11-17
**Tipo:** UserPromptSubmit Hook
**Personalidade:** Gordon (Aggressive Coaching)

---

## 📋 Visão Geral

Hook que integra o sistema de análise de prompts do vibe-log-cli (Gordon AI Coach) no fluxo UserPromptSubmit do Claude Code. Fornece feedback em tempo real sobre qualidade de prompts via statusline.

### Funcionalidades

- ✅ **Análise em background** - Non-blocking via spawn + detach
- ✅ **Scoring 0-100** - Claude SDK-based quality assessment
- ✅ **Gordon personality** - Aggressive, pushy, results-focused coaching
- ✅ **Loading state** - Instant feedback no statusline ("Gordon is analyzing...")
- ✅ **Graceful failure** - Always returns `continue: true`
- ✅ **Hook wrapper integration** - Tracked em hooks-status.json

---

## 🏗️ Arquitetura

### Fluxo de Execução

```
UserPromptSubmit Trigger
    ↓
prompt-enhancer.js (intent detection)
    ↓
context-collector.js (Legal-Braniac decisions)
    ↓
vibe-analyze-prompt.js ← ESTE HOOK
    ↓
├─→ Write loading state (instant)
│   └─→ ~/.vibe-log/analyzed-prompts/{sessionId}.json
│       {"type":"loading", "message":"🔥 Gordon is analyzing..."}
│
└─→ Spawn background process (detached)
    └─→ node dist/index.js analyze-prompt --silent --stdin
        ├─→ Claude SDK analysis (2-10s)
        ├─→ Quality scoring (0-100)
        ├─→ Gordon personality transformation
        └─→ Update file with analysis
            {"type":"analysis", "quality":"good", "score":75, ...}
```

### Integração com Statusline

```javascript
// professional-statusline.js
const gordonFeedback = execSync('npx vibe-log-cli statusline --format compact');
// Lê ~/.vibe-log/analyzed-prompts/{currentSessionId}.json
// Exibe: "🟢 85/100 | 🔥 Gordon: Ship faster! Add error handling"
```

---

## 📥 Interface

### Input (stdin)

```json
{
  "userPrompt": "Implementar cache Redis",
  "sessionId": "abc123",
  "transcriptPath": "/path/to/transcript.jsonl"
}
```

**Campos:**
- `userPrompt` (string, required) - Prompt do usuário
- `sessionId` (string, required) - ID da sessão Claude Code
- `transcriptPath` (string, optional) - Path para histórico de mensagens

### Output (stdout)

```json
{"continue": true, "systemMessage": ""}
```

**Sempre retorna continue: true** para não bloquear hook chain.

---

## 🔧 Configuração

### Variáveis de Ambiente

```bash
DEBUG_GORDON=true    # Ativa logs de debug em stderr
HOME=/home/username  # Diretório home para ~/.vibe-log/
```

### Paths Hardcoded

```javascript
CLI_PATH: '../VibbinLoggin/vibe-log-cli/dist/index.js'  // Relativo a .claude/hooks/
ANALYZED_PROMPTS_DIR: '~/.vibe-log/analyzed-prompts'   // Output directory
MAX_EXECUTION_TIME_MS: 15000                            // 15s timeout
```

---

## 🧪 Testes

### Teste Isolado

```bash
cd /home/cmr-auto/claude-work/repos/Claude-Code-Projetos

echo '{"userPrompt":"fix bug","sessionId":"test-001"}' | \
  DEBUG_GORDON=true \
  node .claude/hooks/vibe-analyze-prompt.js
```

**Output esperado:**
```
[vibe-analyze-prompt] Processing prompt for session: test-001
[vibe-analyze-prompt] Prompt length: 7 chars
[vibe-analyze-prompt] Loading state written to ~/.vibe-log/analyzed-prompts/test-001.json
[vibe-analyze-prompt] Spawning background analysis process...
[vibe-analyze-prompt] Background process spawned (detached)
{"continue":true,"systemMessage":""}
```

### Teste com Hook Wrapper

```bash
echo '{"userPrompt":"Implementar API REST","sessionId":"test-002"}' | \
  node .claude/hooks/hook-wrapper.js .claude/hooks/vibe-analyze-prompt.js
```

**Verificar tracking:**
```bash
cat .claude/statusline/hooks-status.json | jq '.["vibe-analyze-prompt"]'
```

### Teste End-to-End

1. Iniciar nova sessão Claude Code
2. Enviar prompt: "Criar dashboard com gráficos"
3. Verificar statusline atualiza em ~2-5s
4. Verificar arquivo criado:
   ```bash
   ls -l ~/.vibe-log/analyzed-prompts/
   cat ~/.vibe-log/analyzed-prompts/{sessionId}.json
   ```

---

## 📊 Exemplo de Análise Completa

```json
{
  "sessionId": "session-abc123",
  "timestamp": 1763353294383,
  "quality": "good",
  "score": 75,
  "suggestion": "Ship faster! Add error handling for edge cases",
  "actionableSteps": "Handle: network timeouts | Invalid responses | Rate limits. Deploy by Friday!",
  "missing": ["error_handling", "edge_cases"],
  "contextualEmoji": "🔥",
  "personality": "gordon"
}
```

**Statusline display:**
```
🟡 75/100 | 🔥 Gordon: Ship faster! Add error handling for edge cases
✅ TRY THIS: Handle: network timeouts | Invalid responses | Rate limits. Deploy by Friday!
```

---

## ⚠️ Troubleshooting

### Hook retorna continue mas nenhum arquivo criado

**Sintomas:**
- `~/.vibe-log/analyzed-prompts/` vazio
- Statusline mostra "Gordon is ready" (não "analyzing")

**Diagnóstico:**
```bash
DEBUG_GORDON=true node .claude/hooks/vibe-analyze-prompt.js <<< '{"userPrompt":"test","sessionId":"debug-001"}'
```

**Possíveis causas:**
1. vibe-log-cli não instalado → `cd VibbinLoggin/vibe-log-cli && npm run build`
2. Path incorreto para CLI → Verificar `CONFIG.CLI_PATH`
3. Permissões → `chmod +x .claude/hooks/vibe-analyze-prompt.js`

### Análise fica em "loading" indefinidamente

**Sintomas:**
- Arquivo JSON contém `{"type":"loading", ...}` mas nunca atualiza
- Statusline mostra "Gordon is analyzing..." por >30s

**Diagnóstico:**
```bash
# Testar analyze-prompt diretamente
cd VibbinLoggin/vibe-log-cli
echo '{"prompt":"test","session_id":"debug-002"}' | \
  node dist/index.js analyze-prompt --verbose --stdin
```

**Possíveis causas:**
1. Claude SDK API key ausente → Verificar `ANTHROPIC_API_KEY` env var
2. Processo background morreu → Verificar `ps aux | grep analyze-prompt`
3. Timeout muito curto → Aumentar `MAX_EXECUTION_TIME_MS`

### Latência perceptível no UserPromptSubmit

**Sintomas:**
- Delay >200ms entre prompt submit e resposta Claude
- User percebe "lag" ao enviar prompts

**Diagnóstico:**
```bash
cat .claude/statusline/hooks-status.json | \
  jq '.["vibe-analyze-prompt"].duration'
```

**Solução:**
- Hook deve spawnar processo detached (já implementado)
- Verificar que não há blocking I/O no main thread
- Se >50ms, mover spawn para setTimeout(0)

---

## 🔄 Rollback

### Remover hook sem afetar outros

```bash
# Editar .claude/settings.json
# Remover o objeto do hook vibe-analyze-prompt dos hooks UserPromptSubmit

# Validar JSON
cat .claude/settings.json | jq .

# Reiniciar Claude Code
```

### Restaurar configuração anterior

```bash
git checkout HEAD~1 .claude/settings.json
```

---

## 📚 Referências

- **vibe-log-cli analyze-prompt**: `VibbinLoggin/vibe-log-cli/src/commands/analyze-prompt.ts`
- **Gordon personality**: `VibbinLoggin/vibe-log-cli/src/lib/personality-manager.ts:162-186`
- **Statusline integration**: `.claude/statusline/professional-statusline.js:52-68`
- **Hook wrapper**: `.claude/hooks/hook-wrapper.js`
- **Architecture docs**: `.claude/hooks/MIGRATION.md`

---

## 🚀 Próximas Melhorias

- [ ] Throttling: max 1 análise/10s para evitar API rate limits
- [ ] Cache: evitar re-análise de prompts similares
- [ ] Metrics: dashboard de qualidade de prompts ao longo do tempo
- [ ] Multi-personality: suporte para Vibe-Log e Custom além de Gordon
- [ ] Offline mode: fallback para análise local quando Claude SDK indisponível

---

**Autor:** Legal-Braniac + Claude Code
**Última atualização:** 2025-11-17
**Status:** ✅ Produção (Fase de Testes)
