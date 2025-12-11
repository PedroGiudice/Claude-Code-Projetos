#!/bin/bash
# Rollback para versão anterior
# Usage: ./rollback.sh [service]

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
${BLUE}Legal Workbench Rollback Script${NC}

${GREEN}Usage:${NC}
    ./rollback.sh [SERVICE]

${GREEN}Arguments:${NC}
    SERVICE    Service to rollback (optional)
               If not specified, shows interactive menu
               Use "all" to rollback all services

${GREEN}Available Services:${NC}
    - streamlit-hub
    - text-extractor
    - doc-assembler
    - stj-api
    - trello-mcp
    - all (all services)

${GREEN}Examples:${NC}
    ./rollback.sh                    Interactive mode
    ./rollback.sh streamlit-hub      Rollback streamlit-hub
    ./rollback.sh all                Rollback all services

${GREEN}Notes:${NC}
    - This script lists available Docker images for each service
    - You can select which version to rollback to
    - Services are restarted with the selected image

EOF
}

get_service_images() {
    local service=$1
    local image_prefix="docker-${service}"

    # Get all images for this service, sorted by creation date
    docker images --format "{{.Repository}}:{{.Tag}}|{{.ID}}|{{.CreatedAt}}" \
        --filter "reference=${image_prefix}*" \
        2>/dev/null | sort -r
}

get_current_image() {
    local service=$1

    cd "$DOCKER_DIR"
    docker compose ps --format json "$service" 2>/dev/null | \
        jq -r '.Image' 2>/dev/null || echo "unknown"
}

list_service_versions() {
    local service=$1

    echo -e "\n${BLUE}Available versions for ${GREEN}$service${NC}:"
    echo ""

    local images=$(get_service_images "$service")
    local current_image=$(get_current_image "$service")

    if [ -z "$images" ]; then
        print_warning "No images found for $service"
        return 1
    fi

    local index=1
    local image_list=()

    printf "%-5s %-50s %-15s %-20s\n" "NUM" "IMAGE" "ID" "CREATED"
    printf "%-5s %-50s %-15s %-20s\n" "---" "-----" "--" "-------"

    while IFS='|' read -r image id created; do
        local marker=""
        if [[ "$current_image" == *"$id"* ]]; then
            marker="${GREEN}[CURRENT]${NC}"
        fi

        printf "%-5s %-50s %-15s %-20s %s\n" "$index" "$image" "${id:0:12}" "$created" "$marker"
        image_list+=("$image")
        ((index++))
    done <<< "$images"

    echo ""
    return 0
}

select_version() {
    local service=$1

    if ! list_service_versions "$service"; then
        return 1
    fi

    # Get images array
    local images=($(get_service_images "$service" | cut -d'|' -f1))

    if [ ${#images[@]} -eq 0 ]; then
        return 1
    fi

    # Prompt for selection
    echo -n "Select version number (1-${#images[@]}) or 'q' to quit: "
    read -r selection

    if [ "$selection" = "q" ]; then
        print_info "Rollback cancelled"
        return 1
    fi

    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -gt ${#images[@]} ]; then
        print_error "Invalid selection"
        return 1
    fi

    local selected_image="${images[$((selection-1))]}"
    echo "$selected_image"
}

rollback_service() {
    local service=$1
    local target_image=$2

    print_info "Rolling back $service to $target_image"

    cd "$DOCKER_DIR"

    # Update docker-compose to use specific image
    # Note: This is a temporary rollback - the docker-compose.yml is not modified

    # Stop the service
    print_info "Stopping $service..."
    docker compose stop "$service"

    # Remove the container
    docker compose rm -f "$service"

    # Start with specific image
    print_info "Starting $service with $target_image..."

    # We need to tag the selected image to match what docker-compose expects
    local service_image=$(docker compose config | grep -A 5 "^  $service:" | grep "image:" | awk '{print $2}')
    if [ -z "$service_image" ]; then
        service_image="docker-${service}:latest"
    fi

    docker tag "$target_image" "$service_image"
    docker compose up -d "$service"

    print_success "Rollback completed for $service"

    # Wait for health check
    print_info "Waiting for service to be healthy..."
    local wait_time=0
    local max_wait=60

    while [ $wait_time -lt $max_wait ]; do
        local health=$(docker inspect --format='{{.State.Health.Status}}' "$(docker compose ps -q "$service")" 2>/dev/null || echo "unknown")

        if [ "$health" = "healthy" ]; then
            print_success "$service is healthy"
            return 0
        fi

        echo -ne "\r${YELLOW}⏳${NC} Waiting for health check... (${wait_time}s/${max_wait}s)"
        sleep 5
        wait_time=$((wait_time + 5))
    done

    echo ""
    print_warning "$service did not become healthy within ${max_wait}s"
    print_info "Check logs with: docker compose logs $service"

    return 0
}

interactive_mode() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}Legal Workbench Rollback (Interactive)${NC}"
    echo -e "${BLUE}========================================${NC}"

    echo ""
    echo "Select a service to rollback:"
    echo ""

    local index=1
    for service in "${SERVICES[@]}"; do
        echo "  $index) $service"
        ((index++))
    done
    echo "  $index) all services"
    echo "  q) quit"

    echo ""
    echo -n "Select service (1-$index or 'q'): "
    read -r selection

    if [ "$selection" = "q" ]; then
        print_info "Rollback cancelled"
        exit 0
    fi

    if [ "$selection" = "$index" ]; then
        rollback_all_services
        return
    fi

    if ! [[ "$selection" =~ ^[0-9]+$ ]] || [ "$selection" -lt 1 ] || [ "$selection" -ge $index ]; then
        print_error "Invalid selection"
        exit 1
    fi

    local selected_service="${SERVICES[$((selection-1))]}"

    local target_image=$(select_version "$selected_service")
    if [ -z "$target_image" ]; then
        exit 1
    fi

    rollback_service "$selected_service" "$target_image"
}

rollback_all_services() {
    print_warning "Rolling back all services"
    echo ""

    for service in "${SERVICES[@]}"; do
        echo -e "${BLUE}Processing $service...${NC}"

        local target_image=$(select_version "$service")
        if [ -n "$target_image" ]; then
            rollback_service "$service" "$target_image"
        else
            print_warning "Skipping $service"
        fi

        echo ""
    done

    print_success "Rollback completed for all services"
}

# Main
main() {
    # Parse arguments
    case "${1:-}" in
        -h|--help)
            show_help
            exit 0
            ;;
        "")
            interactive_mode
            ;;
        all)
            rollback_all_services
            ;;
        *)
            local service="$1"

            # Check if service is valid
            if [[ ! " ${SERVICES[@]} " =~ " ${service} " ]]; then
                print_error "Invalid service: $service"
                echo ""
                echo "Available services:"
                for s in "${SERVICES[@]}"; do
                    echo "  - $s"
                done
                exit 1
            fi

            local target_image=$(select_version "$service")
            if [ -z "$target_image" ]; then
                exit 1
            fi

            rollback_service "$service" "$target_image"
            ;;
    esac
}

# Run main
main "$@"
