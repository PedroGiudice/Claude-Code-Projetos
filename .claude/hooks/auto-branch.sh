#!/bin/bash
# auto-branch.sh - Cria branch automaticamente se estiver na main
# Similar ao Claude Code Web que sempre trabalha em branches

set -e

cd "$CLAUDE_PROJECT_DIR" || exit 0

# Verificar se eh um repo git
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    exit 0
fi

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo "")

# Se nao esta na main, nao faz nada
if [ "$CURRENT_BRANCH" != "main" ] && [ "$CURRENT_BRANCH" != "master" ]; then
    echo "[auto-branch] Branch atual: $CURRENT_BRANCH (nao eh main, continuando)"
    exit 0
fi

# Verificar se ha mudancas nao commitadas
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "[auto-branch] AVISO: Ha mudancas nao commitadas na main. Stash ou commit antes."
    exit 0
fi

# Gerar nome da branch
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BRANCH_NAME="work/session-${TIMESTAMP}"

# Criar e mudar para nova branch
git checkout -b "$BRANCH_NAME" 2>/dev/null

echo "[auto-branch] Branch criada: $BRANCH_NAME"
echo "[auto-branch] Main protegida. Trabalhe livremente nesta branch."
echo "[auto-branch] Para mergear: git checkout main && git merge $BRANCH_NAME"
