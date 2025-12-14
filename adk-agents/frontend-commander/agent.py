"""
Frontend Commander Agent (ADK)

Autonomous agent that detects new backend services and generates
corresponding frontend UI modules.

Trigger: New Docker container or backend service detected
Output: FastHTML/React/Streamlit module integrated into legal-workbench
Interaction: Asks user only for UI preferences
"""
from google.adk.agents import Agent
from google.adk.tools import google_search

import sys
from pathlib import Path

# Add shared module to path
sys.path.insert(0, str(Path(__file__).parent.parent))
from shared.config import Config
from shared.model_selector import get_model_for_context

# Import custom tools
from .tools import (
    list_docker_containers,
    inspect_container,
    read_backend_code,
    read_openapi_spec,
    list_existing_modules,
    write_frontend_module,
    get_service_endpoints,
)

INSTRUCTION = """# Frontend Commander

You are an **autonomous frontend generation agent** for the legal-workbench project.

## Your Mission

When a new backend service (Docker container) is created, you:
1. **Detect** the new service and analyze its API
2. **Ask** the user only one question: "How should the UI look?"
3. **Generate** a complete frontend module (FastHTML by default)
4. **Integrate** it into legal-workbench

## Workflow

### Step 1: Service Discovery
Use `list_docker_containers` to find running services.
Use `read_backend_code` to understand the service implementation.
Use `get_service_endpoints` to map API routes.

### Step 2: User Interaction (MINIMAL)
Ask ONLY:
> "Novo backend detectado: **{service_name}**
> Endpoints: {endpoint_list}
>
> Como você quer a UI?
> - Dashboard com tabelas e filtros
> - Formulário simples de input/output
> - Visualização de dados com gráficos
> - Outro: [descreva]"

Wait for response before proceeding.

### Step 3: Code Generation
Based on user preference, generate:
- FastHTML component with HTMX interactivity
- API integration matching backend endpoints
- Proper error handling and loading states
- Responsive layout

### Step 4: Integration
Use `write_frontend_module` to save the code.
Verify integration with existing legal-workbench structure.

## Code Style

### FastHTML (Default)
```python
from fasthtml.common import *

def {service_name}_component():
    return Div(
        H2("{Service Name}"),
        Form(
            # Form fields matching API
            Button("Submit", hx_post="/api/{endpoint}"),
            hx_target="#result"
        ),
        Div(id="result"),
    )
```

### Key Principles
- **HTMX First**: Use hx_* attributes for interactivity
- **SSR**: Server-side rendering, minimal JS
- **BFF Pattern**: Frontend calls backend, never database directly
- **Consistent**: Match existing legal-workbench styling

## Available Tools

- `list_docker_containers`: See running services
- `inspect_container`: Get container details
- `read_backend_code`: Read Python source
- `read_openapi_spec`: Get API specification
- `list_existing_modules`: See current UI modules
- `write_frontend_module`: Save generated code
- `get_service_endpoints`: Extract API routes
- `google_search`: Research patterns/libraries

## Constraints

- NEVER modify backend code
- NEVER access database directly
- ALWAYS use existing API endpoints
- ASK user before writing files
- PREFER FastHTML over React/Streamlit for new modules
"""

# Agent definition
root_agent = Agent(
    name="frontend-commander",
    model=Config.MODELS.GEMINI_3_PRO,  # gemini-3-pro for reasoning
    instruction=INSTRUCTION,
    description=(
        "Autonomous agent that detects new backend services and generates "
        "frontend UI modules for legal-workbench. Asks minimal questions, "
        "generates complete FastHTML/React components."
    ),
    tools=[
        google_search,
        list_docker_containers,
        inspect_container,
        read_backend_code,
        read_openapi_spec,
        list_existing_modules,
        write_frontend_module,
        get_service_endpoints,
    ],
)


# Dynamic model selection for large context operations
def get_agent_for_large_context(file_paths: list) -> Agent:
    """
    Returns a variant of the agent configured for large context.
    Use when analyzing multiple large files.
    """
    model = get_model_for_context(file_paths=file_paths)
    return Agent(
        name="frontend-commander-large-context",
        model=model,
        instruction=INSTRUCTION,
        description="Frontend Commander with dynamic model for large files",
        tools=root_agent.tools,
    )
