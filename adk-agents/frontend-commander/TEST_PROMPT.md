# Frontend Commander Test Prompt

Real-world test scenario for the Frontend Commander agent.

---

## Primary Test: Legal Workbench Architecture

This prompt intentionally provides partial information to test how the agent:
1. Uses tools to gather missing context
2. Analyzes module complexity to recommend framework
3. Makes autonomous decisions with minimal user interaction

```
CONTEXT: Legal Workbench frontend architecture implementation.

ARCHITECTURE: docs/plans/legal-workbench/2025-12-14-framework-agnostic-module-architecture.md

STACK:
- Traefik v3.0 (API Gateway)
- FastHTML Hub (SSR frontend)
- FastAPI backends (STJ, Text Extractor, Doc Assembler, Trello)
- Docker Compose orchestration
- Shared volume /data for file passing

EXECUTION PLAN: docs/plans/legal-workbench/2025-12-14-themed-plugin-architecture-EXECUTION-PLAN.md (copy-paste ready code)

TASK: Implement the Traefik + FastHTML Hub architecture. Start with docker-compose.yml and the FastHTML Hub scaffold.

CONSTRAINTS:
- No hardcoded URLs (use /api/* paths)
- FastHTML Hub is non-negotiable
- Module themes: Purple (STJ), Copper (Text), Blue (Doc), Green (Trello)
```

---

## Expected Agent Behavior

### Phase 1: Context Gathering
The agent should:
- Read the architecture doc to understand the full system
- Read the execution plan for implementation details
- Analyze existing modules in legal-workbench/

### Phase 2: Framework Analysis
Before generating code, agent should evaluate:

| Criteria | FastHTML OK? | Need React/Vue? |
|----------|--------------|-----------------|
| Simple forms + tables | ✅ | ❌ |
| Real-time updates | ⚠️ SSE works | ✅ WebSocket |
| Complex state mgmt | ❌ | ✅ |
| Drag-and-drop | ❌ | ✅ |
| Heavy client interactivity | ❌ | ✅ |

### Phase 3: Single Question
Agent asks ONE consolidated question:
> "Based on the architecture, FastHTML with HTMX covers the MVP needs.
> Should I proceed with FastHTML, or do you anticipate needing [specific interactive feature]?"

### Phase 4: Code Generation
Generate:
1. `docker-compose.yml` with Traefik + services
2. FastHTML Hub scaffold with themed modules
3. Module routing with `/api/*` proxy paths

---

## Success Criteria

✅ Agent reads referenced docs WITHOUT being told to
✅ Agent makes framework recommendation with reasoning
✅ Agent asks ≤1 clarifying question
✅ Generated code follows constraints (no hardcoded URLs, themed modules)
✅ Agent provides integration instructions

---

## Alternative Test: Text Extractor Module

Simpler test focusing on single module generation:

```
Generate a frontend module for the Text Extractor backend.

Backend: legal-workbench/backend/text-extractor/
Endpoints: Unknown (agent should discover)
Theme: Copper (#B87333)

Analyze the backend code and generate appropriate UI.
Framework decision is yours based on complexity analysis.
```

---

## Running the Agent

```bash
cd /home/user/Claude-Code-Projetos/adk-agents
source .venv/bin/activate  # if exists
export GOOGLE_API_KEY=your_key
adk run frontend-commander
```
