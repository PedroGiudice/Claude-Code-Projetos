# Legal Workbench - Makefile
# Facilita execução dos scripts de deployment

.PHONY: help deploy deploy-prod status health logs backup rollback clean restart stop start

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

# Directories
SCRIPTS_DIR := ./scripts
COMPOSE := docker compose

help: ## Show this help message
	@echo "$(BLUE)Legal Workbench - Available Commands$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Examples:$(NC)"
	@echo "  make deploy          # Deploy in development mode"
	@echo "  make deploy-prod     # Deploy in production mode"
	@echo "  make status          # Show system status"
	@echo "  make logs            # View logs"
	@echo "  make backup          # Create backup"
	@echo ""

# Deployment
deploy: ## Deploy in development mode
	@echo "$(BLUE)Deploying Legal Workbench (dev)...$(NC)"
	@$(SCRIPTS_DIR)/deploy.sh dev

deploy-prod: ## Deploy in production mode (no cache)
	@echo "$(BLUE)Deploying Legal Workbench (production)...$(NC)"
	@$(SCRIPTS_DIR)/deploy.sh prod

# Status & Health
status: ## Show quick system status
	@$(SCRIPTS_DIR)/status.sh

status-watch: ## Watch system status (refresh every 5s)
	@$(SCRIPTS_DIR)/status.sh --refresh 5

health: ## Run health checks
	@$(SCRIPTS_DIR)/health-check.sh

health-json: ## Run health checks (JSON output)
	@$(SCRIPTS_DIR)/health-check.sh --json

# Logs
logs: ## View all logs (last 100 lines)
	@$(SCRIPTS_DIR)/logs.sh

logs-follow: ## Follow all logs in real-time
	@$(SCRIPTS_DIR)/logs.sh --follow

logs-errors: ## Show only error logs
	@$(SCRIPTS_DIR)/logs.sh --errors

logs-hub: ## Show streamlit-hub logs
	@$(SCRIPTS_DIR)/logs.sh streamlit-hub

logs-extractor: ## Show text-extractor logs
	@$(SCRIPTS_DIR)/logs.sh text-extractor

logs-assembler: ## Show doc-assembler logs
	@$(SCRIPTS_DIR)/logs.sh doc-assembler

logs-stj: ## Show stj-api logs
	@$(SCRIPTS_DIR)/logs.sh stj-api

logs-trello: ## Show trello-mcp logs
	@$(SCRIPTS_DIR)/logs.sh trello-mcp

# Backup & Restore
backup: ## Create backup of all volumes
	@echo "$(BLUE)Creating backup...$(NC)"
	@$(SCRIPTS_DIR)/backup.sh

backup-keep-10: ## Create backup (keep last 10)
	@echo "$(BLUE)Creating backup (keep last 10)...$(NC)"
	@$(SCRIPTS_DIR)/backup.sh --keep 10

# Rollback
rollback: ## Interactive rollback
	@$(SCRIPTS_DIR)/rollback.sh

rollback-all: ## Rollback all services
	@$(SCRIPTS_DIR)/rollback.sh all

rollback-hub: ## Rollback streamlit-hub
	@$(SCRIPTS_DIR)/rollback.sh streamlit-hub

rollback-extractor: ## Rollback text-extractor
	@$(SCRIPTS_DIR)/rollback.sh text-extractor

# Container Management
start: ## Start all services
	@echo "$(GREEN)Starting services...$(NC)"
	@$(COMPOSE) up -d

stop: ## Stop all services
	@echo "$(YELLOW)Stopping services...$(NC)"
	@$(COMPOSE) stop

restart: ## Restart all services
	@echo "$(YELLOW)Restarting services...$(NC)"
	@$(COMPOSE) restart

restart-hub: ## Restart streamlit-hub
	@$(COMPOSE) restart streamlit-hub

restart-extractor: ## Restart text-extractor
	@$(COMPOSE) restart text-extractor

restart-assembler: ## Restart doc-assembler
	@$(COMPOSE) restart doc-assembler

restart-stj: ## Restart stj-api
	@$(COMPOSE) restart stj-api

restart-trello: ## Restart trello-mcp
	@$(COMPOSE) restart trello-mcp

# Build
build: ## Build all images
	@echo "$(BLUE)Building images...$(NC)"
	@$(COMPOSE) build

build-nocache: ## Build all images (no cache)
	@echo "$(BLUE)Building images (no cache)...$(NC)"
	@$(COMPOSE) build --no-cache

# Cleanup
clean: ## Remove all containers and volumes
	@echo "$(YELLOW)WARNING: This will remove all containers and volumes!$(NC)"
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@$(COMPOSE) down -v

clean-containers: ## Remove all containers (keep volumes)
	@echo "$(YELLOW)Removing containers...$(NC)"
	@$(COMPOSE) down

clean-images: ## Remove all images
	@echo "$(YELLOW)Removing images...$(NC)"
	@docker images --filter "reference=docker-*" -q | xargs -r docker rmi

prune: ## Clean up Docker system
	@echo "$(YELLOW)Cleaning up Docker system...$(NC)"
	@docker system prune -f

prune-all: ## Clean up everything (including volumes)
	@echo "$(YELLOW)WARNING: This will remove all unused Docker resources!$(NC)"
	@echo -n "Are you sure? [y/N] " && read ans && [ $${ans:-N} = y ]
	@docker system prune -af --volumes

# Development
shell-hub: ## Open shell in streamlit-hub container
	@$(COMPOSE) exec streamlit-hub /bin/bash

shell-extractor: ## Open shell in text-extractor container
	@$(COMPOSE) exec text-extractor /bin/bash

shell-assembler: ## Open shell in doc-assembler container
	@$(COMPOSE) exec doc-assembler /bin/bash

shell-stj: ## Open shell in stj-api container
	@$(COMPOSE) exec stj-api /bin/bash

shell-redis: ## Open Redis CLI
	@$(COMPOSE) exec redis redis-cli

# Testing
test-endpoints: ## Test all service endpoints
	@echo "$(BLUE)Testing service endpoints...$(NC)"
	@echo -n "Streamlit Hub:    " && curl -sf http://localhost:8501/healthz > /dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"
	@echo -n "Text Extractor:   " && curl -sf http://localhost:8001/health > /dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"
	@echo -n "Doc Assembler:    " && curl -sf http://localhost:8002/health > /dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"
	@echo -n "STJ API:          " && curl -sf http://localhost:8003/health > /dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"
	@echo -n "Trello MCP:       " && curl -sf http://localhost:8004/health > /dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"
	@echo -n "Redis:            " && docker exec lw-redis redis-cli ping > /dev/null && echo "$(GREEN)✓$(NC)" || echo "$(RED)✗$(NC)"

# Monitoring
ps: ## Show running containers
	@$(COMPOSE) ps

top: ## Show container processes
	@$(COMPOSE) top

stats: ## Show container resource usage
	@docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# Configuration
env: ## Create .env from example
	@if [ -f .env ]; then \
		echo "$(YELLOW).env already exists$(NC)"; \
	else \
		cp .env.example .env; \
		echo "$(GREEN).env created from .env.example$(NC)"; \
		echo "$(YELLOW)Please edit .env with your credentials$(NC)"; \
	fi

validate-env: ## Validate .env file
	@if [ ! -f .env ]; then \
		echo "$(RED).env file not found$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN).env file exists$(NC)"
	@source .env && \
		if [ -z "$$GEMINI_API_KEY" ] || [ -z "$$TRELLO_API_KEY" ] || [ -z "$$TRELLO_API_TOKEN" ]; then \
			echo "$(RED)Missing required environment variables$(NC)"; \
			exit 1; \
		else \
			echo "$(GREEN)All required environment variables are set$(NC)"; \
		fi

# CI/CD
ci-test: health test-endpoints ## Run CI tests

ci-deploy: validate-env deploy health ## Deploy for CI

# Quick shortcuts
up: start ## Alias for start
down: stop ## Alias for stop
log: logs ## Alias for logs
st: status ## Alias for status
