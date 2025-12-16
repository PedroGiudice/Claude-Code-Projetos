#!/usr/bin/env python3
"""
Test runner for Frontend Commander agent.
Executes the agent with a real-world prompt and shows the response.
"""
import sys
import os
from pathlib import Path

# Add paths
sys.path.insert(0, str(Path(__file__).parent))
os.chdir(Path(__file__).parent)

# Load environment
from dotenv import load_dotenv
load_dotenv()

# Verify API key
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("ERROR: GOOGLE_API_KEY not set in .env")
    sys.exit(1)
print(f"✓ API Key loaded: {api_key[:10]}...")

# Import the agent
print("Loading Frontend Commander agent...")

# Add frontend-commander to path so relative imports work
fc_path = Path(__file__).parent / "frontend-commander"
sys.path.insert(0, str(fc_path))

# Now import tools first, then agent components
import tools as fc_tools
from shared.config import Config
from shared.model_selector import get_model_for_context
from google.adk.agents import Agent
from google.adk.tools import google_search

# Build the agent directly here to avoid import issues
INSTRUCTION = """# Frontend Commander - Framework-Agnostic UI Generator

You are an **autonomous frontend generation agent** that creates UI modules for ANY framework.

## Your Mission

When a new backend service (Docker container) is created, you:
1. **Detect** the new service and analyze its API
2. **Ask** the user for framework choice and UI preferences (ONE interaction)
3. **Generate** a complete frontend module in the chosen framework
4. **Integrate** it into the project structure

## Supported Frameworks

| Framework | Best For | Output |
|-----------|----------|--------|
| **FastHTML** | HTMX apps, SSR, minimal JS | Python + HTMX |
| **React** | Complex SPAs, TypeScript | TSX components |
| **Streamlit** | Data apps, dashboards | Python module |

## Workflow

### Step 1: Context Gathering
- Read referenced architecture documents
- Analyze existing code structure
- Map API endpoints

### Step 2: User Interaction (SINGLE PROMPT)
Ask ONLY ONCE for framework + UI style preferences.

### Step 3: Code Generation
Generate complete, working code for the chosen framework.

## Constraints
- NEVER modify backend code
- ALWAYS use /api/* paths (no hardcoded URLs)
- ASK user before writing files
"""

root_agent = Agent(
    name="frontend_commander",
    model=Config.MODELS.GEMINI_3_PRO,
    instruction=INSTRUCTION,
    description="Autonomous frontend generation agent for any framework",
    tools=[
        google_search,
        fc_tools.list_docker_containers,
        fc_tools.inspect_container,
        fc_tools.read_backend_code,
        fc_tools.read_openapi_spec,
        fc_tools.list_existing_modules,
        fc_tools.write_frontend_module,
        fc_tools.get_service_endpoints,
    ],
)

# Test prompt
TEST_PROMPT = """
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
"""

print("\n" + "="*60)
print("TEST PROMPT:")
print("="*60)
print(TEST_PROMPT)
print("="*60 + "\n")

# Run the agent
print("Running agent...")

import asyncio

async def run_agent():
    try:
        from google.adk.runners import Runner
        from google.adk.sessions import InMemorySessionService

        session_service = InMemorySessionService()
        runner = Runner(
            agent=root_agent,
            app_name="frontend_commander_test",
            session_service=session_service,
        )

        # Create session (async)
        session = await session_service.create_session(
            app_name="frontend_commander_test",
            user_id="test_user",
        )

        print(f"Session created: {session.id}")
        print("\nAgent response:\n" + "-"*40)

        # Create proper message content
        from google.genai import types
        user_message = types.Content(
            role="user",
            parts=[types.Part.from_text(text=TEST_PROMPT)]
        )

        # Stream the response (async generator)
        async for event in runner.run_async(
            user_id="test_user",
            session_id=session.id,
            new_message=user_message,
        ):
            if hasattr(event, 'content') and event.content:
                if hasattr(event.content, 'parts'):
                    for part in event.content.parts:
                        if hasattr(part, 'text') and part.text:
                            print(part.text, end='', flush=True)
                else:
                    print(str(event.content), end='', flush=True)

        print("\n" + "-"*40)
        print("Test complete!")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()

# Run async
asyncio.run(run_agent())
