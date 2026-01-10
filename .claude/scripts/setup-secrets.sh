#!/bin/bash
##
# setup-secrets.sh - Bootstrap de secrets para Claude Code Projetos
#
# Garante que as chaves necessárias estão configuradas no ambiente.
# Roda automaticamente no SessionStart ou manualmente após git pull.
#
# Secrets são armazenados em ~/.secrets/ (diretório local, nunca commitado)
##

SECRETS_DIR="$HOME/.secrets"
SECRETS_FILE="$SECRETS_DIR/lex-vector.env"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Claude Code Projetos - Secrets Bootstrap${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"

# Criar diretório de secrets se não existir
if [ ! -d "$SECRETS_DIR" ]; then
    mkdir -p "$SECRETS_DIR"
    chmod 700 "$SECRETS_DIR"
    echo -e "${YELLOW}Created $SECRETS_DIR${NC}"
fi

# Verificar se arquivo de secrets existe
if [ ! -f "$SECRETS_FILE" ]; then
    echo -e "${YELLOW}Secrets file not found. Creating template...${NC}"
    cat > "$SECRETS_FILE" << 'TEMPLATE'
# Claude Code Projetos - Secrets
# Este arquivo NÃO deve ser commitado no git
# Localização: ~/.secrets/lex-vector.env

# Google API Key (para Gemini - Context Memory System)
# Obter em: https://aistudio.google.com/app/apikey
GOOGLE_API_KEY=

# Trello API (para Legal Workbench Trello integration)
# Obter em: https://trello.com/app-key
TRELLO_API_KEY=
TRELLO_API_TOKEN=
TEMPLATE
    chmod 600 "$SECRETS_FILE"
    echo -e "${RED}╔═══════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║  AÇÃO NECESSÁRIA: Configure suas chaves!          ║${NC}"
    echo -e "${RED}╠═══════════════════════════════════════════════════╣${NC}"
    echo -e "${RED}║  Edite: ~/.secrets/lex-vector.env       ║${NC}"
    echo -e "${RED}║  E adicione suas API keys                         ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════╝${NC}"
    exit 1
fi

# Carregar secrets
source "$SECRETS_FILE"

# Verificar chaves obrigatórias
MISSING=0

if [ -z "$GOOGLE_API_KEY" ]; then
    echo -e "${RED}✗ GOOGLE_API_KEY não configurada${NC}"
    MISSING=1
else
    echo -e "${GREEN}✓ GOOGLE_API_KEY configurada${NC}"
fi

# Chaves opcionais (só avisa)
if [ -z "$TRELLO_API_KEY" ]; then
    echo -e "${YELLOW}○ TRELLO_API_KEY não configurada (opcional)${NC}"
fi

if [ $MISSING -eq 1 ]; then
    echo -e "\n${RED}Algumas chaves obrigatórias não estão configuradas.${NC}"
    echo -e "${YELLOW}Edite: ~/.secrets/lex-vector.env${NC}"
    exit 1
fi

# Exportar para o ambiente atual
export GOOGLE_API_KEY
export TRELLO_API_KEY
export TRELLO_API_TOKEN

# Adicionar ao .bashrc se não estiver lá
if ! grep -q "lex-vector.env" "$HOME/.bashrc" 2>/dev/null; then
    echo -e "\n${YELLOW}Adicionando source ao .bashrc...${NC}"
    cat >> "$HOME/.bashrc" << 'BASHRC'

# Claude Code Projetos - Auto-load secrets
if [ -f ~/.secrets/lex-vector.env ]; then
    set -a
    source ~/.secrets/lex-vector.env
    set +a
fi
BASHRC
    echo -e "${GREEN}✓ Secrets serão carregadas automaticamente em novos terminais${NC}"
fi

echo -e "\n${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  ✓ Secrets configuradas com sucesso!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
