#!/bin/bash
##
# verify-secrets.sh - SessionStart hook to verify secrets are configured
#
# Quick check (< 100ms) that required secrets exist.
# If not, outputs a warning message to systemMessage.
##

SECRETS_FILE="$HOME/.secrets/lex-vector.env"
OUTPUT='{"continue": true}'

# Check if secrets file exists
if [ ! -f "$SECRETS_FILE" ]; then
    # Run setup script if it exists
    SETUP_SCRIPT="${CLAUDE_PROJECT_DIR:-.}/.claude/scripts/setup-secrets.sh"
    if [ -f "$SETUP_SCRIPT" ]; then
        echo '{"continue": true, "systemMessage": "⚠️ Secrets não configuradas. Execute: .claude/scripts/setup-secrets.sh"}'
    else
        echo '{"continue": true, "systemMessage": "⚠️ ~/.secrets/lex-vector.env não encontrado"}'
    fi
    exit 0
fi

# Source and check GOOGLE_API_KEY
source "$SECRETS_FILE" 2>/dev/null

if [ -z "$GOOGLE_API_KEY" ]; then
    echo '{"continue": true, "systemMessage": "⚠️ GOOGLE_API_KEY não configurada em ~/.secrets/lex-vector.env"}'
    exit 0
fi

# All good - silent success
echo '{"continue": true}'
