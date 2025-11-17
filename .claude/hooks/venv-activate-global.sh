#!/bin/bash
##
# venv-activate-global.sh - Ativa venv global do projeto
#
# Chamado pelo SessionStart hook para garantir que .venv está sempre ativo
##

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
VENV_PATH="$PROJECT_DIR/.venv"

# Verificar se venv existe
if [ ! -d "$VENV_PATH" ]; then
  echo "⚠️  venv not found at $VENV_PATH"
  exit 0
fi

# Ativar venv (exporta VIRTUAL_ENV)
export VIRTUAL_ENV="$VENV_PATH"
export PATH="$VENV_PATH/bin:$PATH"

# Verificar Python version
PYTHON_VERSION=$("$VENV_PATH/bin/python" --version 2>&1)

echo "✅ Python venv activated: $VENV_PATH"
echo "   Python version: $PYTHON_VERSION"

# Success
exit 0
