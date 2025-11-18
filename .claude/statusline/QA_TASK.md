# Tarefa QA: Code Review Unified Statusline

**Delegado por**: Legal-Braniac
**Agente responsável**: qualidade-codigo
**Prioridade**: ALTA
**Data**: 2025-11-18

---

## Contexto

Foi criado `unified-statusline.js` que combina:
- Gordon Co-pilot (vibe-log analysis)
- Legal-Braniac tracking (agents, skills, hooks)
- Powerline visual (ANSI 256 colors + arrows)

**Validação inicial**: PASSOU (ver VALIDATION_REPORT.md)
**Performance**: 57-63ms com cache, 188ms cold start (target: <200ms) ✅
**Layouts**: 4 modos funcionando (minimal, compact, comfortable, wide) ✅

---

## Tarefa

Executar code review COMPLETO usando suas skills:

### 1. Code Auditor (OBRIGATÓRIO)
```bash
USE code-auditor em /home/user/Claude-Code-Projetos/.claude/statusline/unified-statusline.js
```

Verificar:
- ❌ **BLOCKERS**: Segurança, bugs críticos
- ⚠️ **CRITICAL**: Performance, arquitetura, compliance com CLAUDE.md
- 🔍 **MAJOR**: Code smells, duplicação
- 📝 **MINOR**: Estilo, documentação

### 2. Casos de Teste Pendentes

Executar manualmente os seguintes testes (do prompt CLAUDE-CODE-WEB-PROMPT.md):

#### Teste 1: Gordon Analysis Disponível
**Setup**: Criar análise mock em `~/.vibe-log/analyzed-prompts/{sessionId}.json`:
```json
{
  "score": 85,
  "quality": "good",
  "suggestion": "Clear and focused prompt structure",
  "contextualEmoji": "🎯",
  "timestamp": "<now>",
  "sessionId": "<current_session_id>"
}
```
**Comando**: `node .claude/statusline/unified-statusline.js comfortable`
**Esperado**: "🎯 Gordon: 85/100 - Clear and focused prompt..."

#### Teste 2: Gordon Stale (>5min)
**Setup**: Criar análise com timestamp >5min atrás
**Comando**: `node .claude/statusline/unified-statusline.js`
**Esperado**: Fallback para "Gordon ready" ou loading state

#### Teste 3: Session ID Mismatch
**Setup**: Análise existe para sessionId diferente do atual
**Comando**: `node .claude/statusline/unified-statusline.js`
**Esperado**: Loading state ou fallback (não encontra análise)

#### Teste 4: Legal-Braniac Session File Ausente
**Setup**: Renomear temporariamente `.claude/hooks/legal-braniac-session.json`
**Comando**: `node .claude/statusline/unified-statusline.js`
**Esperado**: Graceful degradation ("Braniac ○", session "0m")

### 3. Compliance Check

Validar contra CLAUDE.md:
- [ ] Zero hardcoded paths (LESSON_004)
- [ ] Graceful error handling (DISASTER_HISTORY compliance)
- [ ] Performance <200ms (target atingido)
- [ ] Respects 3-layer separation (CODE/ENV/DATA)

### 4. Security Audit

Verificar:
- [ ] Sem command injection vectors (execSync usage)
- [ ] Path traversal prevention (file reads)
- [ ] Input validation (sessionId, terminal width)
- [ ] No sensitive data logging

### 5. Performance Validation

```bash
# Executar 10 vezes e calcular média
for i in {1..10}; do
  time node .claude/statusline/unified-statusline.js
done
```

**Target**: <200ms (média)
**Cache hit target**: <100ms

---

## Entregáveis

### 1. Relatório de Auditoria
Criar `/home/user/Claude-Code-Projetos/.claude/statusline/QA_REPORT.md` com:

```markdown
# QA Report: Unified Statusline

## Auditoria code-auditor

### BLOCKERS
(lista ou "Nenhum")

### CRITICAL
(lista ou "Nenhum")

### MAJOR
(lista ou "Nenhum")

### MINOR
(lista ou "Nenhum")

## Casos de Teste

### Teste 1: Gordon Analysis Disponível
- Status: PASSOU/FALHOU
- Observações: ...

### Teste 2: Gordon Stale
- Status: PASSOU/FALHOU
- Observações: ...

(etc para todos os testes)

## Compliance Check
- [ ] LESSON_004: ...
- [ ] Error handling: ...
- [ ] Performance: ...
- [ ] 3-layer separation: ...

## Security Audit
- [ ] Command injection: ...
- [ ] Path traversal: ...
- [ ] Input validation: ...
- [ ] Data logging: ...

## Performance Validation
- Média 10 execuções: Xms
- Cache hit avg: Xms
- Conclusão: APROVADO/REJEITADO

## Pontos Positivos
- ...

## Recomendações
1. [P0] (se houver blockers)
2. [P1] (se houver critical)
3. [P2] (melhorias)

## Conclusão
APROVADO / APROVADO COM RESSALVAS / REJEITADO
```

### 2. Lista de Issues (se houver)
Criar arquivo `.claude/statusline/ISSUES.md` se encontrar bugs/problemas.

---

## Skills a Usar

1. **code-auditor** - Primeiro passo (auditoria automática)
2. **systematic-debugging** - Se encontrar bugs, debugar metodicamente
3. **root-cause-tracing** - Para bugs complexos (5 Whys)
4. **verification-before-completion** - Checklist final antes de aprovar

---

## Arquivos de Referência

- `/home/user/Claude-Code-Projetos/.claude/statusline/unified-statusline.js` - Código a auditar
- `/home/user/Claude-Code-Projetos/.claude/statusline/VALIDATION_REPORT.md` - Validação inicial
- `/home/user/Claude-Code-Projetos/.claude/statusline/CLAUDE-CODE-WEB-PROMPT.md` - Especificações originais
- `/home/user/Claude-Code-Projetos/CLAUDE.md` - Regras de compliance
- `/home/user/Claude-Code-Projetos/DISASTER_HISTORY.md` - Lições de erros passados

---

## Timeline

**Início**: Após receber esta tarefa
**Estimativa**: 30-45 minutos
**Prioridade**: ALTA (bloqueia deploy)

---

## Notas Importantes

1. **Foco em segurança**: Este código roda a cada render do statusline (~100ms). Qualquer bug pode crashar Claude Code.
2. **Performance crítica**: Se ultrapassar 200ms consistentemente, statusline será desabilitado.
3. **Session ID matching**: Se não funcionar, Gordon analysis nunca aparecerá.
4. **Graceful degradation**: Falhas devem resultar em fallback visual, NÃO em crash.

---

**Delegado por**: Legal-Braniac v2.0
**Orquestração ID**: unified-statusline-qa-001
