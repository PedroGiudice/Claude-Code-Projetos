#!/bin/bash
# Visualização de logs
# Usage: ./logs.sh [service] [--tail N] [--errors] [--follow]

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

# Service definitions
SERVICES=(
    "streamlit-hub"
    "text-extractor"
    "doc-assembler"
    "stj-api"
    "trello-mcp"
    "redis"
)

# Default options
TAIL_LINES=100
ERRORS_ONLY=false
FOLLOW=false
SERVICE=""

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
${BLUE}Legal Workbench Logs Viewer${NC}

${GREEN}Usage:${NC}
    ./logs.sh [SERVICE] [OPTIONS]

${GREEN}Arguments:${NC}
    SERVICE    Service to show logs for (optional)
               If not specified, shows logs for all services

${GREEN}Options:${NC}
    --tail N       Show last N lines [default: 100]
    --errors       Show only error lines
    --follow, -f   Follow log output in real-time
    --since TIME   Show logs since timestamp (e.g., 2023-01-01T10:00:00)
    --until TIME   Show logs until timestamp
    -h, --help     Show this help message

${GREEN}Available Services:${NC}
    - streamlit-hub
    - text-extractor
    - doc-assembler
    - stj-api
    - trello-mcp
    - redis
    - all (default)

${GREEN}Examples:${NC}
    ./logs.sh                              Show last 100 lines from all services
    ./logs.sh streamlit-hub                Show logs for streamlit-hub
    ./logs.sh --tail 50                    Show last 50 lines
    ./logs.sh text-extractor --follow      Follow text-extractor logs
    ./logs.sh --errors                     Show only error lines
    ./logs.sh --since "1 hour ago"         Show logs from last hour
    ./logs.sh streamlit-hub --tail 200 -f  Tail 200 lines and follow

${GREEN}Error Patterns:${NC}
    When using --errors, the following patterns are matched:
    - ERROR
    - CRITICAL
    - Exception
    - Traceback
    - Failed
    - failed

EOF
}

validate_service() {
    local service=$1

    if [ "$service" = "all" ] || [ -z "$service" ]; then
        return 0
    fi

    if [[ ! " ${SERVICES[@]} " =~ " ${service} " ]]; then
        print_error "Invalid service: $service"
        echo ""
        echo "Available services:"
        for s in "${SERVICES[@]}"; do
            echo "  - $s"
        done
        return 1
    fi

    return 0
}

get_running_services() {
    cd "$DOCKER_DIR"
    docker compose ps --services --filter "status=running" 2>/dev/null
}

show_logs() {
    local service=$1

    cd "$DOCKER_DIR"

    # Build docker compose logs command
    local cmd="docker compose logs"

    # Add tail option
    if [ "$FOLLOW" = false ]; then
        cmd="$cmd --tail=$TAIL_LINES"
    fi

    # Add follow option
    if [ "$FOLLOW" = true ]; then
        cmd="$cmd -f"
    fi

    # Add timestamps
    cmd="$cmd -t"

    # Add service filter
    if [ -n "$service" ] && [ "$service" != "all" ]; then
        cmd="$cmd $service"
    fi

    # Execute command
    if [ "$ERRORS_ONLY" = true ]; then
        print_info "Showing error logs only..."
        echo ""

        # Filter for error patterns
        $cmd 2>&1 | grep -iE "ERROR|CRITICAL|Exception|Traceback|Failed|failed" | while read -r line; do
            # Colorize error lines
            echo "$line" | sed -E \
                -e "s/(ERROR|CRITICAL)/${RED}\1${NC}/gi" \
                -e "s/(Exception|Traceback)/${YELLOW}\1${NC}/gi" \
                -e "s/(Failed|failed)/${RED}\1${NC}/gi"
        done
    else
        # Show all logs with color highlighting
        $cmd 2>&1 | while read -r line; do
            # Colorize based on log level
            if echo "$line" | grep -qiE "ERROR|CRITICAL|Exception|Traceback|Failed"; then
                echo "$line" | sed -E \
                    -e "s/(ERROR|CRITICAL)/${RED}\1${NC}/gi" \
                    -e "s/(Exception|Traceback)/${YELLOW}\1${NC}/gi" \
                    -e "s/(Failed|failed)/${RED}\1${NC}/gi"
            elif echo "$line" | grep -qiE "WARNING|WARN"; then
                echo "$line" | sed -E "s/(WARNING|WARN)/${YELLOW}\1${NC}/gi"
            elif echo "$line" | grep -qiE "INFO"; then
                echo "$line" | sed -E "s/(INFO)/${BLUE}\1${NC}/gi"
            elif echo "$line" | grep -qiE "SUCCESS|OK"; then
                echo "$line" | sed -E "s/(SUCCESS|OK)/${GREEN}\1${NC}/gi"
            else
                echo "$line"
            fi
        done
    fi
}

show_service_status() {
    print_info "Running services:"
    echo ""

    local running_services=$(get_running_services)

    if [ -z "$running_services" ]; then
        print_warning "No services are running"
        return
    fi

    echo "$running_services" | while read -r svc; do
        echo "  - $svc"
    done

    echo ""
}

# Main
main() {
    # Parse arguments
    while [ $# -gt 0 ]; do
        case "$1" in
            -h|--help)
                show_help
                exit 0
                ;;
            --tail)
                TAIL_LINES="$2"
                shift 2
                ;;
            --errors)
                ERRORS_ONLY=true
                shift
                ;;
            --follow|-f)
                FOLLOW=true
                shift
                ;;
            --since)
                # Pass through to docker compose logs
                SINCE_TIME="$2"
                shift 2
                ;;
            --until)
                # Pass through to docker compose logs
                UNTIL_TIME="$2"
                shift 2
                ;;
            -*)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
            *)
                if [ -z "$SERVICE" ]; then
                    SERVICE="$1"
                else
                    print_error "Multiple services specified"
                    show_help
                    exit 1
                fi
                shift
                ;;
        esac
    done

    # Validate service
    if ! validate_service "$SERVICE"; then
        exit 1
    fi

    # Show header
    echo -e "${BLUE}========================================${NC}"
    if [ -n "$SERVICE" ] && [ "$SERVICE" != "all" ]; then
        echo -e "${BLUE}Logs for: ${GREEN}$SERVICE${NC}"
    else
        echo -e "${BLUE}Logs for: ${GREEN}all services${NC}"
    fi
    echo -e "${BLUE}========================================${NC}"
    echo ""

    # Show service status
    show_service_status

    # Show logs
    if [ "$FOLLOW" = true ]; then
        print_info "Following logs (Ctrl+C to stop)..."
    else
        print_info "Showing last $TAIL_LINES lines..."
    fi

    if [ "$ERRORS_ONLY" = true ]; then
        print_warning "Filtering for errors only"
    fi

    echo ""
    echo -e "${BLUE}----------------------------------------${NC}"
    echo ""

    show_logs "$SERVICE"
}

# Run main
main "$@"
