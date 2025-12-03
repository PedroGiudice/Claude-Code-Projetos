#!/bin/bash
# sync-agents.sh
# Sincroniza agentes do repositorio para ~/.claude/agents/
# Fonte da verdade: .claude/agents/ (repo)
# Destino: ~/.claude/agents/ (global)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
SOURCE_DIR="$REPO_ROOT/.claude/agents"
TARGET_DIR="$HOME/.claude/agents"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[sync-agents]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[sync-agents]${NC} $1"
}

log_error() {
    echo -e "${RED}[sync-agents]${NC} $1"
}

# Verificar se diretorio fonte existe
if [ ! -d "$SOURCE_DIR" ]; then
    log_error "Diretorio fonte nao encontrado: $SOURCE_DIR"
    exit 1
fi

# Criar diretorio destino se nao existir
mkdir -p "$TARGET_DIR"

# Contar arquivos
SOURCE_COUNT=$(find "$SOURCE_DIR" -maxdepth 1 -name "*.md" -type f | wc -l)
if [ "$SOURCE_COUNT" -eq 0 ]; then
    log_warn "Nenhum agente encontrado em $SOURCE_DIR"
    exit 0
fi

# Sincronizar arquivos (substituir existentes)
log_info "Sincronizando $SOURCE_COUNT agentes..."
log_info "Fonte: $SOURCE_DIR"
log_info "Destino: $TARGET_DIR"

# Usar rsync se disponivel, senao cp
if command -v rsync &> /dev/null; then
    rsync -av --delete "$SOURCE_DIR/"*.md "$TARGET_DIR/" 2>/dev/null || \
    rsync -av "$SOURCE_DIR/"*.md "$TARGET_DIR/"
else
    cp -v "$SOURCE_DIR/"*.md "$TARGET_DIR/"
fi

# Contar arquivos sincronizados
SYNCED_COUNT=$(find "$TARGET_DIR" -maxdepth 1 -name "*.md" -type f | wc -l)
log_info "Sincronizacao concluida: $SYNCED_COUNT agentes em ~/.claude/agents/"

# Listar novos ou atualizados
echo ""
log_info "Agentes disponiveis:"
ls -1 "$TARGET_DIR"/*.md 2>/dev/null | xargs -n1 basename | sed 's/.md$//' | head -20
if [ "$SYNCED_COUNT" -gt 20 ]; then
    echo "... e mais $(($SYNCED_COUNT - 20)) agentes"
fi
