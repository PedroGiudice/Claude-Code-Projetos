"""
Frontend Commander Agent (ADK)

Autonomous agent that detects new backend services and generates
corresponding frontend UI modules for ANY FRAMEWORK.

Operating Modes:
- AUTONOMOUS: Triggered by Docker watcher when new container detected
- ON-DEMAND: Triggered by direct user task (e.g., "implement the architecture")

Supported frameworks:
- FastHTML (HTMX, SSR)
- React (TypeScript, Vite)
- Streamlit (Python, data apps)
- Vue, Svelte, or any other upon request

Output: Frontend module integrated into legal-workbench
Interaction: Minimal - asks only for essential preferences
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
    read_file,
    write_file,
    read_backend_code,
    read_openapi_spec,
    list_existing_modules,
    write_frontend_module,
    get_service_endpoints,
)

# Framework templates for reference
FRAMEWORK_TEMPLATES = {
    "fasthtml": '''
from fasthtml.common import *

def {component_name}_page():
    """Main page for {service_name} service."""
    return Div(
        H2("{title}"),
        Form(
            Input(type="text", name="query", placeholder="Enter query..."),
            Button("Submit", hx_post="/api/{endpoint}", hx_target="#result"),
            cls="space-y-4"
        ),
        Div(id="result", cls="mt-4"),
        cls="container mx-auto p-4"
    )
''',
    "react": '''
import {{ useState }} from 'react';

interface {ComponentName}Props {{
  endpoint: string;
}}

export function {ComponentName}({{ endpoint }}: {ComponentName}Props) {{
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {{
    e.preventDefault();
    setLoading(true);
    try {{
      const response = await fetch(`/api/${{endpoint}}`);
      setData(await response.json());
    }} finally {{
      setLoading(false);
    }}
  }};

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <form onSubmit={{handleSubmit}} className="space-y-4">
        <input type="text" name="query" placeholder="Enter query..." />
        <button type="submit" disabled={{loading}}>
          {{loading ? 'Loading...' : 'Submit'}}
        </button>
      </form>
      {{data && <pre>{{JSON.stringify(data, null, 2)}}</pre>}}
    </div>
  );
}}
''',
    "streamlit": '''
import streamlit as st
import requests

def render_{component_name}():
    """Streamlit UI for {service_name} service."""
    st.header("{title}")

    with st.form("{component_name}_form"):
        query = st.text_input("Enter query")
        submitted = st.form_submit_button("Submit")

        if submitted:
            with st.spinner("Processing..."):
                response = requests.post(
                    "/api/{endpoint}",
                    json={{"query": query}}
                )
                if response.ok:
                    st.success("Success!")
                    st.json(response.json())
                else:
                    st.error(f"Error: {{response.status_code}}")
''',
}

INSTRUCTION = """# Frontend Commander - Framework-Agnostic UI Generator

You are a **frontend generation agent** for the legal-workbench project.
You work in TWO modes: **Autonomous** (Docker watcher) or **On-Demand** (direct task).

## Operating Modes

### Mode 1: AUTONOMOUS (Docker Watcher)
Triggered when a new Docker container is detected.
1. Analyze the new service's API
2. Ask user for framework + UI preferences (ONE question)
3. Generate frontend module

### Mode 2: ON-DEMAND (Direct Task)
Triggered when user provides a direct request like:
- "Implement the Traefik + FastHTML architecture from the plan"
- "Generate frontend for the STJ service"
- "Create a module for text extraction"

In this mode:
1. Use `read_file` to read architecture docs and execution plans
2. Follow the specifications provided
3. Generate code according to the plan
4. **PROCEED WITHOUT ASKING** if specs are clear

## Supported Frameworks

| Framework | Best For | Output |
|-----------|----------|--------|
| **FastHTML** | HTMX apps, SSR, minimal JS | Python + HTMX |
| **React** | Complex SPAs, TypeScript | TSX components |
| **Streamlit** | Data apps, dashboards | Python module |
| **Vue/Svelte** | Progressive apps | SFC components |

## Workflow

### Step 1: Context Gathering
- **Autonomous**: Use `list_docker_containers` to find services
- **On-Demand**: Use `read_file` to read referenced docs/plans
- Both: Use `get_service_endpoints` to understand APIs

### Step 2: User Interaction (MINIMAL)
For **Autonomous** mode, ask:
> "New backend detected: **{service_name}**
> 1. Framework? [FastHTML / React / Streamlit]
> 2. UI Style? [Dashboard / Form / Visualization]"

For **On-Demand** with clear specs: **PROCEED WITHOUT ASKING**
For **On-Demand** without specs: ask for clarification once.

### Step 3: Code Generation
Generate complete, working code for the chosen framework following BFF pattern.

### Step 4: Integration
Use `write_file` or `write_frontend_module` to save the code.
Provide integration instructions.

## Available Tools

- `read_file`: Read ANY file (docs, plans, configs, code) - **essential for on-demand tasks**
- `write_file`: Write ANY file (docker-compose, configs, etc.) - **for on-demand tasks**
- `list_docker_containers`: See running services
- `inspect_container`: Get container details
- `read_backend_code`: Read Python source from a service
- `read_openapi_spec`: Get API specification
- `list_existing_modules`: See current UI modules
- `write_frontend_module`: Save generated frontend code
- `get_service_endpoints`: Extract API routes
- `google_search`: Research patterns/libraries

## Constraints

- **NEVER** modify backend code
- **NEVER** access database directly
- **ALWAYS** use /api/* paths (no hardcoded URLs)
- **ASK** user before writing files (unless on-demand with clear specs)
- **RESPECT** framework conventions and idioms
- **MATCH** existing project styling when possible

## Output Structure

After generating, provide:

```
## Generated: {service_name} UI

**Framework:** {chosen_framework}
**Files created:**
- `path/to/component.{ext}`

**Integration steps:**
1. Step one...
2. Step two...

**To test:**
```bash
command to run
```
```
"""

# Agent definition
root_agent = Agent(
    name="frontend_commander",  # underscore required by ADK
    model=Config.MODELS.GEMINI_3_PRO,  # gemini-3-pro-preview for reasoning
    instruction=INSTRUCTION,
    description=(
        "Autonomous agent that detects new backend services and generates "
        "frontend UI modules in ANY framework (FastHTML, React, Streamlit, etc). "
        "100% framework-agnostic. Asks minimal questions, generates complete components."
    ),
    tools=[
        google_search,
        read_file,
        write_file,
        list_docker_containers,
        inspect_container,
        read_backend_code,
        read_openapi_spec,
        list_existing_modules,
        write_frontend_module,
        get_service_endpoints,
    ],
)


def get_agent_for_large_context(file_paths: list) -> Agent:
    """
    Returns a variant of the agent configured for large context.
    Use when analyzing multiple large files.
    """
    model = get_model_for_context(file_paths=file_paths)
    return Agent(
        name="frontend_commander_large_context",
        model=model,
        instruction=INSTRUCTION,
        description="Frontend Commander with dynamic model for large files",
        tools=root_agent.tools,
    )


# Convenience exports
__all__ = ["root_agent", "get_agent_for_large_context", "FRAMEWORK_TEMPLATES"]
