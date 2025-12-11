#!/bin/bash
# Backup dos volumes Docker
# Usage: ./backup.sh [--keep N] [--output DIR]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${DOCKER_DIR}/backups"
KEEP_BACKUPS=5
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Volumes to backup
VOLUMES=(
    "stj-duckdb-data"
    "text-extractor-cache"
    "app-data"
    "redis-data"
)

# Functions
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

show_help() {
    cat << EOF
${BLUE}Legal Workbench Backup Script${NC}

${GREEN}Usage:${NC}
    ./backup.sh [OPTIONS]

${GREEN}Options:${NC}
    --keep N           Keep last N backups [default: 5]
    --output DIR       Backup directory [default: docker/backups]
    -h, --help         Show this help message

${GREEN}Volumes backed up:${NC}
    - stj-duckdb-data (STJ database)
    - text-extractor-cache (Marker cache)
    - app-data (Application data)
    - redis-data (Redis persistence)

${GREEN}Examples:${NC}
    ./backup.sh                    Create backup with defaults
    ./backup.sh --keep 10          Keep last 10 backups
    ./backup.sh --output /backups  Save to custom directory

${GREEN}Backup format:${NC}
    backup_YYYYMMDD_HHMMSS_<volume>.tar.gz

EOF
}

check_prerequisites() {
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi

    # Check if volumes exist
    local missing_volumes=()
    for volume in "${VOLUMES[@]}"; do
        if ! docker volume inspect "docker_${volume}" &> /dev/null; then
            missing_volumes+=("$volume")
        fi
    done

    if [ ${#missing_volumes[@]} -gt 0 ]; then
        print_warning "Some volumes don't exist yet:"
        for vol in "${missing_volumes[@]}"; do
            echo "  - $vol"
        done
        print_info "This is normal if you haven't run the application yet"
    fi
}

create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        print_info "Created backup directory: $BACKUP_DIR"
    fi
}

backup_volume() {
    local volume=$1
    local full_volume_name="docker_${volume}"
    local backup_file="${BACKUP_DIR}/backup_${TIMESTAMP}_${volume}.tar.gz"

    # Check if volume exists
    if ! docker volume inspect "$full_volume_name" &> /dev/null; then
        print_warning "Volume $volume does not exist, skipping"
        return 0
    fi

    print_info "Backing up volume: $volume"

    # Create backup using a temporary container
    docker run --rm \
        -v "${full_volume_name}:/source:ro" \
        -v "${BACKUP_DIR}:/backup" \
        alpine \
        tar czf "/backup/backup_${TIMESTAMP}_${volume}.tar.gz" -C /source .

    # Get backup size
    local size=$(du -h "$backup_file" | cut -f1)
    print_success "Backed up $volume ($size)"
}

cleanup_old_backups() {
    print_info "Cleaning up old backups (keeping last $KEEP_BACKUPS)..."

    for volume in "${VOLUMES[@]}"; do
        # List backups for this volume, sorted by date (newest first)
        local backups=($(ls -t "${BACKUP_DIR}"/backup_*_${volume}.tar.gz 2>/dev/null || true))
        local count=${#backups[@]}

        if [ $count -gt $KEEP_BACKUPS ]; then
            print_info "Found $count backups for $volume, removing $((count - KEEP_BACKUPS)) old ones"

            # Remove old backups
            for ((i=KEEP_BACKUPS; i<count; i++)); do
                local backup="${backups[$i]}"
                rm -f "$backup"
                print_success "Removed old backup: $(basename "$backup")"
            done
        fi
    done
}

show_backup_summary() {
    echo ""
    print_info "Backup summary:"
    echo ""

    printf "%-30s %-10s %-20s\n" "BACKUP FILE" "SIZE" "DATE"
    printf "%-30s %-10s %-20s\n" "-----------" "----" "----"

    for volume in "${VOLUMES[@]}"; do
        local backup_file="${BACKUP_DIR}/backup_${TIMESTAMP}_${volume}.tar.gz"
        if [ -f "$backup_file" ]; then
            local size=$(du -h "$backup_file" | cut -f1)
            local date=$(date -r "$backup_file" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || stat -c %y "$backup_file" | cut -d'.' -f1)
            printf "%-30s %-10s %-20s\n" "$(basename "$backup_file")" "$size" "$date"
        fi
    done

    echo ""
    print_info "Total backups in $BACKUP_DIR:"
    ls -1 "${BACKUP_DIR}"/backup_*.tar.gz 2>/dev/null | wc -l || echo "0"
}

restore_info() {
    echo ""
    print_info "To restore a backup, use:"
    echo "  docker run --rm -v <volume>:/target -v ${BACKUP_DIR}:/backup alpine sh -c 'rm -rf /target/* && tar xzf /backup/<backup_file> -C /target'"
}

# Main
main() {
    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --keep)
                KEEP_BACKUPS="$2"
                shift 2
                ;;
            --output)
                BACKUP_DIR="$2"
                shift 2
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Legal Workbench Backup${NC}"
    echo -e "${BLUE}Timestamp: ${GREEN}$TIMESTAMP${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo ""

    check_prerequisites
    create_backup_dir

    # Backup each volume
    for volume in "${VOLUMES[@]}"; do
        backup_volume "$volume"
    done

    # Cleanup old backups
    cleanup_old_backups

    # Show summary
    show_backup_summary
    restore_info

    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✓ Backup completed successfully!${NC}"
    echo -e "${GREEN}========================================${NC}"
}

# Run main
main "$@"
