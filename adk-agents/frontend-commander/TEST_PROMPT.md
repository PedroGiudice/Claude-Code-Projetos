# Frontend Commander Test Prompt

Use this prompt to test the Frontend Commander agent in a new Claude Code session.

---

## Test Prompt (English)

```
I want to test the Frontend Commander ADK agent.

Here's the scenario:
1. I have a new backend service running in Docker called "legal-search-api"
2. It exposes these endpoints:
   - POST /api/search - Search legal documents
   - GET /api/document/{id} - Get document by ID
   - GET /api/health - Health check

Please:
1. Run the Frontend Commander agent to analyze this service
2. When it asks for preferences, I want:
   - Framework: React (TypeScript)
   - UI Style: Dashboard with search form and results table
3. Generate the frontend component

The agent should ask me ONE question about UI preferences and then generate complete code.

Path to agent: adk-agents/frontend-commander/agent.py
```

---

## Alternative Test (Simpler)

```
Test the frontend-commander agent located at adk-agents/frontend-commander/.

Simulate detecting a new Docker container "document-processor" with endpoints:
- POST /api/process
- GET /api/status

Ask me for framework preference then generate the UI.
```

---

## Running the Agent

```bash
cd /home/user/Claude-Code-Projetos/adk-agents

# Activate venv (if exists)
source .venv/bin/activate

# Set API key
export GOOGLE_API_KEY=your_key_here

# Run with ADK CLI
adk run frontend-commander
```

---

## Expected Behavior

1. Agent detects/receives service info
2. Asks ONE question with 3 parts:
   - Framework choice (FastHTML/React/Streamlit/Other)
   - UI style (Dashboard/Form/Visualization/Custom)
   - Any specific requirements
3. Generates complete code for chosen framework
4. Provides integration instructions
