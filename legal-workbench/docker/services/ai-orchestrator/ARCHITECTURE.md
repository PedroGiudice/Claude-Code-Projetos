# AI Debate Arena - North Star Architecture

## Status: DESIGN APPROVED (2025-12-16)

Este documento define a arquitetura alvo para o sistema de debate AI no Legal Workbench.

---

## Decisoes Bloqueadas (Product Director)

| Decisao | Valor | Implicacao |
|---------|-------|------------|
| **Autenticacao** | Local first | Sem Keycloak, Docker-only |
| **Rodadas de Debate** | 3: Inicial, Replica, Razoes Finais | Nomenclatura PT-BR |
| **Dominio Legal** | Generico | Sem especializacao por area |
| **Interface** | **FastHTML v1** | Requisito rigido, sem Streamlit fallback |
| **Anthropic API** | **NAO DISPONIVEL** | Claude Code CLI e a unica opcao |

---

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      LEGAL WORKBENCH UI (Port 8501)                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────────────┐   │
│  │ Text       │ │ Doc        │ │ STJ        │ │ AI Debate Arena    │   │
│  │ Extractor  │ │ Assembler  │ │ Search     │ │ (Link to 8005)     │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                         │
                    ┌────────────────────▼────────────────────┐
                    │     AI DEBATE ARENA (FastHTML)          │
                    │           Port 8005                      │
                    │                                          │
                    │  ┌────────────────────────────────────┐ │
                    │  │          FastHTML App               │ │
                    │  │   • SSE Streaming                   │ │
                    │  │   • Split-screen layout             │ │
                    │  │   • DaisyUI chat bubbles            │ │
                    │  └─────────────┬──────────────────────┘ │
                    │                │                         │
                    │  ┌─────────────▼──────────────────────┐ │
                    │  │         Debate Engine (Py)         │ │
                    │  │   • 3 rounds: Inicial/Replica/Razoes│ │
                    │  │   • Context isolation              │ │
                    │  │   • Synthesis generation           │ │
                    │  └─────┬──────────────────┬───────────┘ │
                    │        │                  │             │
                    │  ┌─────▼──────┐    ┌─────▼──────────┐  │
                    │  │ Claude     │    │ Gemini         │  │
                    │  │ Adapter    │    │ ADK Adapter    │  │
                    │  │ (subprocess)│   │ (native SDK)   │  │
                    │  └─────┬──────┘    └─────┬──────────┘  │
                    └────────┼─────────────────┼──────────────┘
                             │                 │
                    ┌────────▼──────┐  ┌──────▼───────────┐
                    │ Claude Code   │  │ Gemini API       │
                    │ CLI (local)   │  │ gemini-2.5-flash │
                    └───────────────┘  └──────────────────┘
```

---

## Componentes Principais

### 1. FastHTML App (Interface)

**Stack:**
- FastHTML (standalone, sem FastAPI)
- SSE para streaming de respostas
- Pico CSS + DaisyUI para layout
- SQLite para persistencia de debates

**Layout Split-Screen:**
```
┌───────────────────────────────────────────────────────────┐
│                    Topico do Debate                       │
│  [Input de tese juridica]                    [Iniciar]    │
├────────────────────────┬──────────────────────────────────┤
│     Claude Code        │         Gemini Flash            │
│   ┌─────────────────┐  │   ┌─────────────────────────┐   │
│   │ Streaming...    │  │   │ Streaming...            │   │
│   │                 │  │   │                         │   │
│   └─────────────────┘  │   └─────────────────────────┘   │
├────────────────────────┴──────────────────────────────────┤
│                      Sintese                              │
│  [Analise combinada apos ambas respostas]                 │
├───────────────────────────────────────────────────────────┤
│  Rodada: [1/3 Inicial]  [2/3 Replica]  [3/3 Razoes Finais]│
│                                          [Continuar]      │
└───────────────────────────────────────────────────────────┘
```

### 2. Claude Code Adapter (Subprocess)

**Restricao Critica:** Sem Anthropic API key disponivel.

Claude Code CLI e a UNICA forma de integrar Claude neste sistema.

**Padrao de Implementacao:**
```python
# adapters/claude_adapter.py
import subprocess
import threading
import queue
import asyncio
from pathlib import Path
from typing import AsyncIterator

class ClaudeCodeAdapter:
    """
    Adapter para Claude Code CLI via subprocess.

    Baseado em: legal-workbench/ferramentas/_archived/claude-ui-streamlit/
    """

    PROMPT_TEMPLATE = """Voce e um advogado brasileiro experiente.

FASE: {phase}
TOPICO: {topic}

{phase_instruction}

Responda de forma estruturada, citando legislacao quando relevante.
"""

    PHASE_INSTRUCTIONS = {
        "inicial": "Apresente sua tese inicial sobre o topico. Fundamente com doutrina e jurisprudencia.",
        "replica": "Considerando a sintese anterior, refine seus argumentos e enderece possiveis contrapontos.",
        "razoes_finais": "Apresente suas conclusoes finais, consolidando os melhores argumentos."
    }

    def __init__(self, project_path: Path):
        self.project_path = project_path
        self._process = None
        self._output_queue = queue.Queue()
        self._stop_event = threading.Event()

    async def stream_response(
        self,
        topic: str,
        phase: str,
        prior_synthesis: str = None
    ) -> AsyncIterator[str]:
        """
        Envia prompt para Claude Code e faz streaming da resposta.

        Yields:
            Chunks de texto conforme Claude responde
        """
        # Build prompt with context isolation
        prompt = self.PROMPT_TEMPLATE.format(
            phase=phase.upper(),
            topic=topic,
            phase_instruction=self.PHASE_INSTRUCTIONS[phase]
        )

        if prior_synthesis:
            prompt += f"\n\nSINTESE ANTERIOR (para contexto):\n{prior_synthesis}"

        # Start subprocess
        self._process = subprocess.Popen(
            ["claude", "--dangerously-skip-permissions"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=str(self.project_path),
            text=True,
            bufsize=1
        )

        # Send prompt
        self._process.stdin.write(prompt + "\n")
        self._process.stdin.flush()

        # Stream output
        reader_thread = threading.Thread(
            target=self._read_output,
            daemon=True
        )
        reader_thread.start()

        # Yield chunks as they arrive
        while True:
            try:
                chunk = await asyncio.get_event_loop().run_in_executor(
                    None,
                    lambda: self._output_queue.get(timeout=0.1)
                )
                if chunk is None:  # Sentinel for end
                    break
                yield chunk
            except queue.Empty:
                if self._process.poll() is not None:
                    break

    def _read_output(self):
        """Thread que le stdout e enfileira chunks."""
        try:
            for line in self._process.stdout:
                if self._stop_event.is_set():
                    break
                self._output_queue.put(line)
        finally:
            self._output_queue.put(None)  # Sentinel

    def stop(self):
        """Para o processo Claude Code."""
        self._stop_event.set()
        if self._process:
            self._process.terminate()
```

### 3. Gemini ADK Adapter

**Modelo:** gemini-2.5-flash (free tier, 10 RPM)

```python
# adapters/gemini_adapter.py
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from typing import AsyncIterator
import asyncio

class GeminiDebateAdapter:
    """
    Adapter para Gemini via ADK nativo.

    Usa gemini-2.5-flash por custo/velocidade.
    """

    LEGAL_INSTRUCTION = """Voce e um advogado brasileiro experiente.

Seu papel e analisar teses juridicas de forma rigorosa.
Sempre cite legislacao brasileira relevante (CF, CC, CPC, etc).
Seja objetivo e estruturado em suas respostas.
"""

    def __init__(self):
        self.session_service = InMemorySessionService()

        self.agent = Agent(
            name="legal_analyst",
            model="gemini-2.5-flash",
            instruction=self.LEGAL_INSTRUCTION
        )

        self.runner = Runner(
            agent=self.agent,
            session_service=self.session_service
        )

    async def stream_response(
        self,
        topic: str,
        phase: str,
        prior_synthesis: str = None
    ) -> AsyncIterator[str]:
        """
        Consulta Gemini e faz streaming da resposta.
        """
        # Create isolated session
        session = await self.session_service.create_session(
            app_name="legal_debate",
            user_id="debate_system"
        )

        # Build prompt
        prompt = f"""FASE: {phase.upper()}
TOPICO: {topic}

Apresente sua analise juridica sobre este topico."""

        if prior_synthesis:
            prompt += f"\n\nCONTEXTO ANTERIOR:\n{prior_synthesis}"

        # Run and stream
        # Note: ADK streaming varies by version
        response = await self.runner.run_async(
            user_message=prompt,
            session_id=session.id
        )

        # Yield response (simulated streaming for now)
        words = response.split()
        for i in range(0, len(words), 3):
            chunk = " ".join(words[i:i+3]) + " "
            yield chunk
            await asyncio.sleep(0.05)
```

### 4. Debate Engine (Orquestrador)

```python
# engine/debate.py
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional, AsyncIterator
import asyncio

class DebatePhase(Enum):
    INICIAL = "inicial"
    REPLICA = "replica"
    RAZOES_FINAIS = "razoes_finais"

@dataclass
class DebateRound:
    phase: DebatePhase
    topic: str
    claude_response: str
    gemini_response: str
    synthesis: str

class DebateEngine:
    """
    Orquestra debates entre Claude Code e Gemini.

    INVARIANTE: Isolamento de contexto estrito.
    Cada AI ve apenas:
    - Topico original
    - Suas proprias respostas anteriores
    - Sinteses (nunca respostas brutas do oponente)
    """

    PHASES = [
        DebatePhase.INICIAL,
        DebatePhase.REPLICA,
        DebatePhase.RAZOES_FINAIS
    ]

    def __init__(self, claude_adapter, gemini_adapter):
        self.claude = claude_adapter
        self.gemini = gemini_adapter
        self.debates = {}  # debate_id -> List[DebateRound]

    async def start_debate(self, debate_id: str, topic: str) -> str:
        """Inicia novo debate com rodada inicial."""
        self.debates[debate_id] = []
        return await self.run_round(debate_id, topic, DebatePhase.INICIAL)

    async def continue_debate(self, debate_id: str) -> Optional[str]:
        """Avanca para proxima rodada."""
        rounds = self.debates.get(debate_id, [])
        if not rounds:
            raise ValueError("Debate nao iniciado")

        current_idx = len(rounds)
        if current_idx >= len(self.PHASES):
            return None  # Debate concluido

        next_phase = self.PHASES[current_idx]
        topic = rounds[0].topic

        return await self.run_round(debate_id, topic, next_phase)

    async def run_round(
        self,
        debate_id: str,
        topic: str,
        phase: DebatePhase
    ) -> str:
        """
        Executa uma rodada com isolamento de contexto.
        """
        # Build isolated context (only syntheses, never raw responses)
        prior_synthesis = self._get_prior_synthesis(debate_id)

        # Stream both AIs in parallel
        claude_chunks = []
        gemini_chunks = []

        async def collect_claude():
            async for chunk in self.claude.stream_response(
                topic=topic,
                phase=phase.value,
                prior_synthesis=prior_synthesis
            ):
                claude_chunks.append(chunk)

        async def collect_gemini():
            async for chunk in self.gemini.stream_response(
                topic=topic,
                phase=phase.value,
                prior_synthesis=prior_synthesis
            ):
                gemini_chunks.append(chunk)

        await asyncio.gather(collect_claude(), collect_gemini())

        claude_response = "".join(claude_chunks)
        gemini_response = "".join(gemini_chunks)

        # Generate synthesis
        synthesis = await self._synthesize(claude_response, gemini_response, phase)

        # Store round
        round_data = DebateRound(
            phase=phase,
            topic=topic,
            claude_response=claude_response,
            gemini_response=gemini_response,
            synthesis=synthesis
        )
        self.debates[debate_id].append(round_data)

        return synthesis

    def _get_prior_synthesis(self, debate_id: str) -> Optional[str]:
        """
        Retorna sinteses anteriores (NUNCA respostas brutas).
        """
        rounds = self.debates.get(debate_id, [])
        if not rounds:
            return None

        return "\n\n".join([
            f"[{r.phase.value.upper()}]: {r.synthesis}"
            for r in rounds
        ])

    async def _synthesize(
        self,
        claude_resp: str,
        gemini_resp: str,
        phase: DebatePhase
    ) -> str:
        """
        Gera sintese imparcial das duas respostas.

        Usa Gemini como sintetizador (mais barato).
        """
        synthesis_prompt = f"""Voce e um juiz imparcial analisando duas perspectivas juridicas.

FASE: {phase.value.upper()}

PERSPECTIVA A:
{claude_resp[:2000]}  # Truncate for context limits

PERSPECTIVA B:
{gemini_resp[:2000]}

Gere uma sintese de 3-5 pontos destacando:
1. Pontos de convergencia
2. Pontos de divergencia
3. Argumentos mais fortes de cada lado
4. Lacunas ou questoes nao abordadas

Seja objetivo e imparcial."""

        synthesis_chunks = []
        async for chunk in self.gemini.stream_response(
            topic=synthesis_prompt,
            phase="synthesis",
            prior_synthesis=None
        ):
            synthesis_chunks.append(chunk)

        return "".join(synthesis_chunks)
```

---

## FastHTML UI Implementation

### main.py

```python
from fasthtml.common import *
from engine.debate import DebateEngine, DebatePhase
from adapters.claude_adapter import ClaudeCodeAdapter
from adapters.gemini_adapter import GeminiDebateAdapter
from pathlib import Path
import asyncio
import uuid

# Headers for styling
hdrs = [
    Script(src="https://cdn.tailwindcss.com"),
    Link(rel="stylesheet",
         href="https://cdn.jsdelivr.net/npm/daisyui@4.11.1/dist/full.min.css"),
    Style("""
        .debate-container { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .debate-side { min-height: 300px; padding: 1rem; border: 1px solid #ddd; border-radius: 8px; }
        .synthesis-box { margin-top: 1rem; padding: 1rem; background: #f5f5f5; border-radius: 8px; }
        .phase-indicator { display: flex; gap: 0.5rem; margin: 1rem 0; }
        .phase-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; }
        .phase-active { background: #3b82f6; color: white; }
        .phase-done { background: #22c55e; color: white; }
        .phase-pending { background: #e5e7eb; color: #6b7280; }
    """)
]

app = FastHTML(hdrs=hdrs)

# Initialize adapters
claude = ClaudeCodeAdapter(project_path=Path("/app/workspace"))
gemini = GeminiDebateAdapter()
engine = DebateEngine(claude, gemini)

def phase_badges(current_phase_idx: int):
    phases = ["Inicial", "Replica", "Razoes Finais"]
    badges = []
    for i, phase in enumerate(phases):
        if i < current_phase_idx:
            cls = "phase-badge phase-done"
        elif i == current_phase_idx:
            cls = "phase-badge phase-active"
        else:
            cls = "phase-badge phase-pending"
        badges.append(Span(phase, cls=cls))
    return Div(*badges, cls="phase-indicator")

def chat_bubble(content: str, side: str):
    bubble_cls = "chat-bubble chat-bubble-primary" if side == "claude" else "chat-bubble chat-bubble-secondary"
    return Div(
        Div(content, cls=bubble_cls),
        cls=f"chat chat-start"
    )

@rt("/")
def get(session):
    debate_id = session.get('debate_id')

    return Div(
        H1("AI Debate Arena", cls="text-3xl font-bold mb-4"),
        P("Debate estruturado entre Claude Code e Gemini sobre teses juridicas",
          cls="text-gray-600 mb-6"),

        Form(
            Textarea(
                name="topic",
                placeholder="Ex: A responsabilidade civil objetiva do Estado por danos causados por agentes publicos em exercicio irregular da funcao",
                rows=3,
                cls="textarea textarea-bordered w-full mb-4",
                required=True
            ),
            Button(
                "Iniciar Debate",
                cls="btn btn-primary",
                type="submit"
            ),
            hx_post="/start",
            hx_target="#debate-area"
        ),

        Div(id="debate-area", cls="mt-6"),
        cls="container mx-auto p-6 max-w-6xl"
    )

@rt("/start")
async def post(topic: str, session):
    debate_id = str(uuid.uuid4())
    session['debate_id'] = debate_id
    session['phase_idx'] = 0

    return Div(
        H2("Debate em Andamento", cls="text-xl font-semibold mb-4"),
        phase_badges(0),

        Div(
            Div(
                H3("Claude Code", cls="font-bold text-blue-600"),
                Div(id="claude-response", cls="debate-side"),
                cls="flex flex-col"
            ),
            Div(
                H3("Gemini Flash", cls="font-bold text-purple-600"),
                Div(id="gemini-response", cls="debate-side"),
                cls="flex flex-col"
            ),
            cls="debate-container"
        ),

        Div(
            H3("Sintese", cls="font-bold"),
            Div(id="synthesis", cls="synthesis-box"),
            cls="mt-4"
        ),

        # SSE connection for streaming
        Div(
            hx_ext="sse",
            sse_connect=f"/stream/{debate_id}?topic={topic}",
            sse_swap="update"
        ),

        Div(
            Button(
                "Proxima Rodada",
                cls="btn btn-secondary mt-4",
                id="continue-btn",
                hx_post=f"/continue/{debate_id}",
                hx_target="#debate-area",
                disabled=True
            ),
            id="controls"
        )
    )

@rt("/stream/{debate_id}")
async def get(debate_id: str, topic: str):
    async def stream():
        # Stream Claude response
        async for chunk in claude.stream_response(topic, "inicial"):
            yield f"event: update\ndata: "
            yield Div(
                chunk,
                hx_swap_oob="beforeend:#claude-response"
            ).to_string()
            yield "\n\n"

        # Stream Gemini response
        async for chunk in gemini.stream_response(topic, "inicial"):
            yield f"event: update\ndata: "
            yield Div(
                chunk,
                hx_swap_oob="beforeend:#gemini-response"
            ).to_string()
            yield "\n\n"

        # Generate and stream synthesis
        # (simplified - in production, use engine.run_round)
        yield f"event: update\ndata: "
        yield Div(
            "Analise sintetizada em andamento...",
            hx_swap_oob="innerHTML:#synthesis"
        ).to_string()
        yield "\n\n"

        # Enable continue button
        yield f"event: update\ndata: "
        yield Button(
            "Proxima Rodada",
            cls="btn btn-secondary mt-4",
            hx_post=f"/continue/{debate_id}",
            hx_target="#debate-area",
            hx_swap_oob="outerHTML:#continue-btn"
        ).to_string()
        yield "\n\n"

        # Close stream
        yield f"event: close\ndata: \n\n"

    return EventStream(stream())

@rt("/continue/{debate_id}")
async def post(debate_id: str, session):
    phase_idx = session.get('phase_idx', 0) + 1
    session['phase_idx'] = phase_idx

    if phase_idx >= 3:
        return Div(
            H2("Debate Concluido!", cls="text-2xl font-bold text-green-600"),
            P("As 3 rodadas foram completadas."),
            A("Iniciar Novo Debate", href="/", cls="btn btn-primary mt-4")
        )

    phases = ["inicial", "replica", "razoes_finais"]
    current_phase = phases[phase_idx]

    # Similar streaming structure for next round
    return Div(
        phase_badges(phase_idx),
        # ... rest of UI
    )

if __name__ == "__main__":
    serve(port=8005)
```

---

## Docker Configuration

### Dockerfile

```dockerfile
FROM python:3.11-slim

# Install Claude Code CLI dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js for Claude Code CLI
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y nodejs

# Install Claude Code CLI globally
RUN npm install -g @anthropic-ai/claude-code

# Create app user
RUN useradd -m -u 1000 appuser

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY --chown=appuser:appuser . .

# Create workspace for Claude Code
RUN mkdir -p /app/workspace && chown appuser:appuser /app/workspace

USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8005/health || exit 1

EXPOSE 8005

CMD ["python", "main.py"]
```

### requirements.txt

```
fasthtml>=0.4.0
google-adk>=1.19.0
uvicorn>=0.30.0
python-dotenv>=1.0.0
```

### docker-compose.yml (adicao)

```yaml
# Adicionar ao docker-compose.yml existente

ai-orchestrator:
  build:
    context: ./services/ai-orchestrator
  container_name: lw-ai-orchestrator
  ports:
    - "8005:8005"
  environment:
    - GEMINI_API_KEY=${GEMINI_API_KEY}
  volumes:
    - ai-debates-data:/app/data
    - ai-workspace:/app/workspace
  networks:
    - legal-workbench-net
  restart: unless-stopped
  deploy:
    resources:
      limits:
        memory: 2G
        cpus: '2'
      reservations:
        memory: 1G
        cpus: '1'

volumes:
  ai-debates-data:
  ai-workspace:
```

---

## Rate Limits e Custos

| Modelo | Free Tier | Estrategia |
|--------|-----------|------------|
| **Gemini 2.5 Flash** | 10 RPM, 250 RPD | Modelo principal |
| **Claude Code** | Sem limite API | Subprocess local |

**Mitigacao de Rate Limit:**
```python
from functools import wraps
import asyncio

def rate_limited(calls_per_minute: int):
    min_interval = 60.0 / calls_per_minute
    last_call = [0.0]

    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            loop = asyncio.get_event_loop()
            elapsed = loop.time() - last_call[0]
            if elapsed < min_interval:
                await asyncio.sleep(min_interval - elapsed)
            last_call[0] = loop.time()
            return await func(*args, **kwargs)
        return wrapper
    return decorator
```

---

## Proximos Passos

1. [ ] Criar estrutura de diretorios `ai-orchestrator/`
2. [ ] Implementar `ClaudeCodeAdapter` baseado no wrapper existente
3. [ ] Implementar `GeminiDebateAdapter` com ADK
4. [ ] Criar FastHTML app com layout split-screen
5. [ ] Configurar Docker e docker-compose
6. [ ] Testar SSE streaming
7. [ ] Integrar com Legal Workbench sidebar

---

**Ultima atualizacao:** 2025-12-16
**Status:** Design aprovado, aguardando implementacao
