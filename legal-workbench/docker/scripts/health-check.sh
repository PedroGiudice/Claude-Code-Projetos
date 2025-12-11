#!/bin/bash
# Health check de todos os serviços
# Usage: ./health-check.sh [--quiet] [--json]

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
QUIET=false
JSON_OUTPUT=false

# Service definitions
declare -A SERVICES=(
    ["streamlit-hub"]="http://localhost:8501/healthz"
    ["text-extractor"]="http://localhost:8001/health"
    ["doc-assembler"]="http://localhost:8002/health"
    ["stj-api"]="http://localhost:8003/health"
    ["trello-mcp"]="http://localhost:8004/health"
    ["redis"]="redis"
)

declare -A SERVICE_CONTAINERS=(
    ["streamlit-hub"]="lw-hub"
    ["text-extractor"]="lw-text-extractor"
    ["doc-assembler"]="lw-doc-assembler"
    ["stj-api"]="lw-stj-api"
    ["trello-mcp"]="lw-trello-mcp"
    ["redis"]="lw-redis"
)

# Functions
print_success() {
    [ "$QUIET" = false ] && echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    [ "$QUIET" = false ] && echo -e "${RED}✗${NC} $1"
}

print_info() {
    [ "$QUIET" = false ] && echo -e "${BLUE}ℹ${NC} $1"
}

print_warning() {
    [ "$QUIET" = false ] && echo -e "${YELLOW}⚠${NC} $1"
}

show_help() {
    cat << EOF
${BLUE}Legal Workbench Health Check${NC}

${GREEN}Usage:${NC}
    ./health-check.sh [OPTIONS]

${GREEN}Options:${NC}
    --quiet        Suppress output (only exit code)
    --json         Output results in JSON format
    -h, --help     Show this help message

${GREEN}Exit Codes:${NC}
    0    All services are healthy
    1    One or more services are unhealthy

${GREEN}Examples:${NC}
    ./health-check.sh              Run health checks with output
    ./health-check.sh --quiet      Run silently
    ./health-check.sh --json       Output JSON results

EOF
}

check_container_running() {
    local container=$1
    docker inspect "$container" &> /dev/null && \
    [ "$(docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null)" = "true" ]
}

check_http_endpoint() {
    local url=$1
    local timeout=5

    curl -sf --max-time "$timeout" "$url" &> /dev/null
}

check_redis() {
    docker exec lw-redis redis-cli ping &> /dev/null
}

get_container_stats() {
    local container=$1

    if ! check_container_running "$container"; then
        echo "N/A|N/A"
        return
    fi

    local stats=$(docker stats "$container" --no-stream --format "{{.CPUPerc}}|{{.MemUsage}}" 2>/dev/null)
    echo "$stats"
}

check_service() {
    local service=$1
    local endpoint="${SERVICES[$service]}"
    local container="${SERVICE_CONTAINERS[$service]}"

    # Check if container is running
    if ! check_container_running "$container"; then
        return 1
    fi

    # Check health endpoint
    if [ "$endpoint" = "redis" ]; then
        check_redis
    else
        check_http_endpoint "$endpoint"
    fi
}

run_health_checks() {
    local all_healthy=true
    local results=()

    [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ] && echo -e "${BLUE}Checking service health...${NC}\n"

    for service in "${!SERVICES[@]}"; do
        local container="${SERVICE_CONTAINERS[$service]}"
        local status="healthy"
        local message=""

        # Check if container is running
        if ! check_container_running "$container"; then
            status="down"
            message="Container not running"
            all_healthy=false
            [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ] && print_error "$service: $message"
        elif ! check_service "$service"; then
            status="unhealthy"
            message="Health check failed"
            all_healthy=false
            [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ] && print_error "$service: $message"
        else
            message="OK"
            [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ] && print_success "$service: $message"
        fi

        # Get container stats
        local stats=$(get_container_stats "$container")
        local cpu=$(echo "$stats" | cut -d'|' -f1)
        local memory=$(echo "$stats" | cut -d'|' -f2)

        # Store results
        results+=("{\"service\":\"$service\",\"status\":\"$status\",\"message\":\"$message\",\"cpu\":\"$cpu\",\"memory\":\"$memory\"}")
    done

    # Output results
    if [ "$JSON_OUTPUT" = true ]; then
        local json_results=$(printf ",%s" "${results[@]}")
        json_results="${json_results:1}"  # Remove leading comma
        echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"healthy\":$all_healthy,\"services\":[$json_results]}"
    elif [ "$QUIET" = false ]; then
        echo ""
        show_resource_usage
    fi

    [ "$all_healthy" = true ]
}

show_resource_usage() {
    echo -e "${BLUE}Resource Usage:${NC}\n"

    printf "%-20s %-10s %-20s\n" "SERVICE" "CPU" "MEMORY"
    printf "%-20s %-10s %-20s\n" "-------" "---" "------"

    for service in "${!SERVICES[@]}"; do
        local container="${SERVICE_CONTAINERS[$service]}"

        if check_container_running "$container"; then
            local stats=$(get_container_stats "$container")
            local cpu=$(echo "$stats" | cut -d'|' -f1)
            local memory=$(echo "$stats" | cut -d'|' -f2)
            printf "%-20s %-10s %-20s\n" "$service" "$cpu" "$memory"
        else
            printf "%-20s %-10s %-20s\n" "$service" "N/A" "N/A"
        fi
    done
}

# Main
main() {
    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            --quiet)
                QUIET=true
                shift
                ;;
            --json)
                JSON_OUTPUT=true
                shift
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

    # Run health checks
    if run_health_checks; then
        [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ] && echo -e "\n${GREEN}✓ All services are healthy${NC}"
        exit 0
    else
        [ "$QUIET" = false ] && [ "$JSON_OUTPUT" = false ] && echo -e "\n${RED}✗ Some services are unhealthy${NC}"
        exit 1
    fi
}

# Run main
main "$@"
