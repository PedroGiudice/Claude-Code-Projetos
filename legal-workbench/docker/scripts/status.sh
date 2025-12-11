#!/bin/bash
# Quick Status - Visão geral rápida do sistema
# Usage: ./status.sh [--refresh N]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$(dirname "$SCRIPT_DIR")"
REFRESH_INTERVAL=0

# Functions
print_header() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${NC}  ${BOLD}Legal Workbench - System Status${NC}                            ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  $(date '+%Y-%m-%d %H:%M:%S')                                      ${CYAN}║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

get_service_status() {
    local service=$1
    local container_name=$2

    if ! docker inspect "$container_name" &> /dev/null; then
        echo "NOT_FOUND"
        return
    fi

    local running=$(docker inspect -f '{{.State.Running}}' "$container_name" 2>/dev/null)
    local health=$(docker inspect -f '{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "none")

    if [ "$running" != "true" ]; then
        echo "STOPPED"
    elif [ "$health" = "healthy" ]; then
        echo "HEALTHY"
    elif [ "$health" = "unhealthy" ]; then
        echo "UNHEALTHY"
    elif [ "$health" = "starting" ]; then
        echo "STARTING"
    else
        echo "RUNNING"
    fi
}

get_status_icon() {
    local status=$1

    case "$status" in
        HEALTHY|RUNNING)
            echo -e "${GREEN}●${NC}"
            ;;
        STARTING)
            echo -e "${YELLOW}◐${NC}"
            ;;
        UNHEALTHY)
            echo -e "${RED}●${NC}"
            ;;
        STOPPED)
            echo -e "${RED}○${NC}"
            ;;
        NOT_FOUND)
            echo -e "${RED}✗${NC}"
            ;;
        *)
            echo -e "${YELLOW}?${NC}"
            ;;
    esac
}

show_services() {
    echo -e "${BOLD}Services:${NC}"
    echo ""

    # Define services
    declare -A services=(
        ["Streamlit Hub"]="lw-hub"
        ["Text Extractor"]="lw-text-extractor"
        ["Doc Assembler"]="lw-doc-assembler"
        ["STJ API"]="lw-stj-api"
        ["Trello MCP"]="lw-trello-mcp"
        ["Redis"]="lw-redis"
    )

    declare -A ports=(
        ["Streamlit Hub"]="8501"
        ["Text Extractor"]="8001"
        ["Doc Assembler"]="8002"
        ["STJ API"]="8003"
        ["Trello MCP"]="8004"
        ["Redis"]="6379"
    )

    printf "  %-20s %-12s %-10s %-15s\n" "SERVICE" "STATUS" "PORT" "URL"
    printf "  %-20s %-12s %-10s %-15s\n" "-------" "------" "----" "---"

    for service in "Streamlit Hub" "Text Extractor" "Doc Assembler" "STJ API" "Trello MCP" "Redis"; do
        local container="${services[$service]}"
        local port="${ports[$service]}"
        local status=$(get_service_status "$service" "$container")
        local icon=$(get_status_icon "$status")
        local url="http://localhost:$port"

        if [ "$service" = "Redis" ]; then
            url="localhost:$port"
        fi

        printf "  %-20s %b %-10s %-10s %-15s\n" "$service" "$icon" "$status" "$port" "$url"
    done

    echo ""
}

show_resources() {
    echo -e "${BOLD}Resource Usage:${NC}"
    echo ""

    # System resources
    local total_mem=$(free -h | awk '/^Mem:/ {print $2}')
    local used_mem=$(free -h | awk '/^Mem:/ {print $3}')
    local mem_percent=$(free | awk '/^Mem:/ {printf "%.1f", $3/$2*100}')

    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    local disk_used=$(df -h / | awk 'NR==2 {print $3}')
    local disk_total=$(df -h / | awk 'NR==2 {print $2}')

    echo -e "  ${CYAN}System:${NC}"
    printf "    Memory: %s / %s (%.1f%%)\n" "$used_mem" "$total_mem" "$mem_percent"
    printf "    Disk:   %s / %s (%s%%)\n" "$disk_used" "$disk_total" "$disk_usage"
    echo ""

    # Docker resources
    local container_count=$(docker ps -q --filter "name=lw-" | wc -l)
    local image_count=$(docker images -q --filter "reference=docker-*" | wc -l)
    local volume_count=$(docker volume ls -q --filter "name=docker_" | wc -l)

    echo -e "  ${CYAN}Docker:${NC}"
    printf "    Containers: %d running\n" "$container_count"
    printf "    Images:     %d\n" "$image_count"
    printf "    Volumes:    %d\n" "$volume_count"
    echo ""
}

show_recent_logs() {
    echo -e "${BOLD}Recent Errors (last 5 minutes):${NC}"
    echo ""

    cd "$DOCKER_DIR"

    local errors=$(docker compose logs --since 5m 2>&1 | grep -iE "ERROR|CRITICAL|Exception" | tail -5)

    if [ -z "$errors" ]; then
        echo -e "  ${GREEN}No errors found${NC}"
    else
        echo "$errors" | while read -r line; do
            echo "  $line" | sed -E "s/(ERROR|CRITICAL|Exception)/${RED}\1${NC}/gi" | cut -c1-100
        done
    fi

    echo ""
}

show_network() {
    echo -e "${BOLD}Network:${NC}"
    echo ""

    # Check if network exists
    if docker network inspect docker_legal-workbench-net &> /dev/null; then
        local subnet=$(docker network inspect docker_legal-workbench-net -f '{{range .IPAM.Config}}{{.Subnet}}{{end}}')
        local containers=$(docker network inspect docker_legal-workbench-net -f '{{len .Containers}}')

        printf "  Network:    docker_legal-workbench-net\n"
        printf "  Subnet:     %s\n" "$subnet"
        printf "  Containers: %s connected\n" "$containers"
    else
        echo -e "  ${YELLOW}Network not found${NC}"
    fi

    echo ""
}

show_volumes() {
    echo -e "${BOLD}Volumes:${NC}"
    echo ""

    printf "  %-25s %-10s\n" "VOLUME" "SIZE"
    printf "  %-25s %-10s\n" "------" "----"

    local volumes=("stj-duckdb-data" "text-extractor-cache" "app-data" "redis-data")

    for vol in "${volumes[@]}"; do
        local full_name="docker_${vol}"
        if docker volume inspect "$full_name" &> /dev/null; then
            # Get volume size (requires sudo or proper permissions)
            local size=$(docker system df -v | grep "$full_name" | awk '{print $3}' || echo "N/A")
            printf "  %-25s %-10s\n" "$vol" "$size"
        else
            printf "  %-25s %-10s\n" "$vol" "${YELLOW}Not found${NC}"
        fi
    done

    echo ""
}

show_quick_actions() {
    echo -e "${BOLD}Quick Actions:${NC}"
    echo ""
    echo "  [1] View logs         ./logs.sh"
    echo "  [2] Health check      ./health-check.sh"
    echo "  [3] Deploy            ./deploy.sh"
    echo "  [4] Backup            ./backup.sh"
    echo "  [5] Restart all       docker compose restart"
    echo ""
}

show_footer() {
    echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
    if [ $REFRESH_INTERVAL -gt 0 ]; then
        echo -e "${CYAN}Auto-refresh: ${REFRESH_INTERVAL}s | Press Ctrl+C to stop${NC}"
    else
        echo -e "${CYAN}Run with --refresh N to auto-refresh every N seconds${NC}"
    fi
    echo -e "${CYAN}────────────────────────────────────────────────────────────────${NC}"
}

show_status() {
    print_header
    show_services
    show_resources
    show_network
    show_volumes
    show_recent_logs
    show_quick_actions
    show_footer
}

show_help() {
    cat << EOF
${BLUE}Legal Workbench - Quick Status${NC}

${GREEN}Usage:${NC}
    ./status.sh [OPTIONS]

${GREEN}Options:${NC}
    --refresh N    Auto-refresh every N seconds
    -h, --help     Show this help message

${GREEN}Examples:${NC}
    ./status.sh              Show status once
    ./status.sh --refresh 5  Auto-refresh every 5 seconds

EOF
}

# Main
main() {
    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --refresh)
                REFRESH_INTERVAL="$2"
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

    # Show status
    if [ $REFRESH_INTERVAL -gt 0 ]; then
        # Auto-refresh mode
        while true; do
            show_status
            sleep "$REFRESH_INTERVAL"
        done
    else
        # Single run
        show_status
    fi
}

# Run main
main "$@"
