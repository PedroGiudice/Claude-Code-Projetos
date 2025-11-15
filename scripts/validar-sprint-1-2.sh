#!/bin/bash
# Validação Sprint 1-2 WSL2 - Claude Code Projetos
# Data: 2025-11-15

echo "=========================================="
echo "VALIDAÇÃO SPRINT 1-2 WSL2"
echo "=========================================="
echo ""

# 1. Ferramentas Base
echo "=== 1. FERRAMENTAS BASE ==="
echo "Node.js: $(node --version 2>/dev/null || echo '❌ NÃO INSTALADO')"
echo "npm: $(npm --version 2>/dev/null || echo '❌ NÃO INSTALADO')"
echo "Claude Code: $(claude --version 2>/dev/null | head -1 || echo '❌ NÃO INSTALADO')"
echo "Python: $(python3 --version 2>/dev/null || echo '❌ NÃO INSTALADO')"
echo "pip: $(pip3 --version 2>/dev/null || echo '❌ NÃO INSTALADO')"
echo ""

# 2. Estrutura de Diretórios
echo "=== 2. ESTRUTURA DE DIRETÓRIOS ==="
echo "Working dir: $(pwd)"
[ "$(basename $(pwd))" = "Claude-Code-Projetos" ] && echo "✅ Diretório correto" || echo "⚠️ Execute de ~/claude-work/repos/Claude-Code-Projetos"
echo ""

# 3. Virtual Environments Python
echo "=== 3. VIRTUAL ENVIRONMENTS (5 agentes) ==="
VENVS_CRIADOS=0
for agente in agentes/djen-tracker agentes/legal-articles-finder agentes/legal-lens agentes/legal-rag agentes/oab-watcher; do
    if [ -d "$agente/.venv" ]; then
        echo "✅ $agente/.venv"
        cd "$agente"
        source .venv/bin/activate 2>/dev/null
        PYTHON_VERSION=$(python --version 2>&1)
        PACKAGES_COUNT=$(pip list 2>/dev/null | tail -n +3 | wc -l)
        echo "   Python: $PYTHON_VERSION | Packages: $PACKAGES_COUNT"
        deactivate 2>/dev/null
        cd - > /dev/null
        VENVS_CRIADOS=$((VENVS_CRIADOS + 1))
    else
        echo "❌ $agente/.venv NÃO EXISTE"
    fi
done
echo ""
echo "Total venvs: $VENVS_CRIADOS/5"
echo ""

# 4. npm Packages (MCP Server)
echo "=== 4. NPM PACKAGES (MCP Server) ==="
if [ -d "mcp-servers/djen-mcp-server/node_modules" ]; then
    PACKAGES_COUNT=$(ls mcp-servers/djen-mcp-server/node_modules | wc -l)
    echo "✅ mcp-servers/djen-mcp-server/node_modules ($PACKAGES_COUNT packages)"
else
    echo "❌ mcp-servers/djen-mcp-server/node_modules NÃO EXISTE"
fi
echo ""

# 5. Hooks
echo "=== 5. HOOKS (.claude/hooks/) ==="
HOOKS_JS=$(find .claude/hooks/ -name "*.js" 2>/dev/null | wc -l)
echo "Hooks JavaScript: $HOOKS_JS"
if [ $HOOKS_JS -gt 0 ]; then
    echo "Testando hook session-context-hybrid.js..."
    node .claude/hooks/session-context-hybrid.js 2>&1 | head -3
fi
echo ""

# 6. Skills
echo "=== 6. SKILLS ==="
SKILLS_RAIZ=$(ls skills/ 2>/dev/null | wc -l)
SKILLS_CLAUDE=$(ls .claude/skills/ 2>/dev/null | wc -l)
echo "skills/ (raiz): $SKILLS_RAIZ skills"
echo ".claude/skills/: $SKILLS_CLAUDE arquivos (deve ser apenas skill-rules.json)"
echo ""

# 7. Agentes Claude Code
echo "=== 7. AGENTES CLAUDE CODE (.claude/agents/) ==="
AGENTES_COUNT=$(ls .claude/agents/*.md 2>/dev/null | wc -l)
echo "Agentes: $AGENTES_COUNT"
ls .claude/agents/*.md 2>/dev/null | xargs -n1 basename
echo ""

# 8. Git Status
echo "=== 8. GIT STATUS ==="
git status --short | head -10
if [ -z "$(git status --short)" ]; then
    echo "✅ Working tree clean"
else
    echo "⚠️ Mudanças pendentes (ver acima)"
fi
echo ""

# 9. Resumo Final
echo "=========================================="
echo "RESUMO SPRINT 1-2"
echo "=========================================="
echo "Virtual Environments: $VENVS_CRIADOS/5"
echo "npm packages: $([ -d mcp-servers/djen-mcp-server/node_modules ] && echo '✅' || echo '❌')"
echo "Hooks: $HOOKS_JS"
echo "Skills: $SKILLS_RAIZ"
echo "Agentes Claude: $AGENTES_COUNT"
echo ""
echo "Status: $([ $VENVS_CRIADOS -eq 5 ] && echo '✅ SPRINT 1-2 COMPLETO' || echo '⚠️ PENDÊNCIAS')"
echo "=========================================="
