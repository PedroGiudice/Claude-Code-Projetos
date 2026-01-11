"""
CCui WebSocket Backend
WebSocket server that spawns Claude CLI and streams responses.
"""
import os
import sys
import asyncio
import json
import shutil

# Add shared module path for logging and Sentry
sys.path.insert(0, '/app')

# Initialize Sentry BEFORE importing FastAPI for proper instrumentation
try:
    from shared.sentry_config import init_sentry
    init_sentry("ccui-ws")
except ImportError:
    pass  # Sentry not available, continue without it

# Configure structured JSON logging
import logging
try:
    from shared.logging_config import setup_logging
    from shared.middleware import RequestIDMiddleware
    log_level = getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO)
    logger = setup_logging("ccui-ws", level=log_level)
    HAS_SHARED = True
except ImportError:
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("ccui-ws")
    HAS_SHARED = False

from datetime import datetime, timezone
from typing import Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="CCui WebSocket Backend", version="2.0.0")

# Request ID middleware for request tracing (if available)
if HAS_SHARED:
    app.add_middleware(RequestIDMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check if Claude CLI is available
CLAUDE_CLI = shutil.which("claude")
if not CLAUDE_CLI:
    logger.warning("Claude CLI not found in PATH. Mock mode will be used.")


@app.on_event("startup")
async def startup_event():
    logger.info(f"Service starting (Claude CLI: {'found' if CLAUDE_CLI else 'NOT FOUND'})")


class ConnectionManager:
    """Manages WebSocket connections and Claude CLI processes."""

    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_data: Dict[str, dict] = {}
        self.active_processes: Dict[str, asyncio.subprocess.Process] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.session_data[client_id] = {
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "messages": [],
            "context_used": 0,
            "is_processing": False
        }
        logger.info(f"Client connected: {client_id}")

    def disconnect(self, client_id: str):
        # Kill any running process
        if client_id in self.active_processes:
            proc = self.active_processes[client_id]
            if proc.returncode is None:
                proc.kill()
            del self.active_processes[client_id]

        if client_id in self.active_connections:
            del self.active_connections[client_id]
        if client_id in self.session_data:
            del self.session_data[client_id]
        logger.info(f"Client disconnected: {client_id}")

    async def send_json(self, client_id: str, data: dict):
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_json(data)
            except Exception as e:
                logger.error(f"Failed to send to {client_id}: {e}")

    async def cancel_process(self, client_id: str):
        """Cancel running Claude process for a client."""
        if client_id in self.active_processes:
            proc = self.active_processes[client_id]
            if proc.returncode is None:
                proc.terminate()
                try:
                    await asyncio.wait_for(proc.wait(), timeout=2.0)
                except asyncio.TimeoutError:
                    proc.kill()
            del self.active_processes[client_id]
            logger.info(f"Process cancelled for {client_id}")


manager = ConnectionManager()


class ChatRequest(BaseModel):
    message: str
    token: str = "dev-token"


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "ccui-ws",
        "version": "2.0.0",
        "claude_cli": "available" if CLAUDE_CLI else "not_found",
        "connections": len(manager.active_connections),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest):
    """HTTP endpoint for sending chat messages."""
    content = request.message.strip()
    token = request.token

    if not content:
        return {"status": "error", "message": "Empty message"}

    logger.info(f"Chat request: {content[:50]}...")

    # Find connected client with this token
    target_clients = [cid for cid in manager.active_connections.keys() if cid.startswith(token)]

    if not target_clients:
        # No WebSocket connection - return error
        return {
            "status": "error",
            "message": "No WebSocket connection. Connect via /ws first.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    # Process for first matching client
    client_id = target_clients[0]
    asyncio.create_task(process_claude_request(client_id, content))

    return {"status": "ok", "message": "Processing started"}


@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(default="anonymous")
):
    client_id = f"{token}_{id(websocket)}"
    await manager.connect(websocket, client_id)

    await manager.send_json(client_id, {
        "type": "connected",
        "message": "Connected to CCui backend",
        "claude_cli": "available" if CLAUDE_CLI else "mock_mode",
        "client_id": client_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    try:
        while True:
            data = await websocket.receive_json()
            await handle_message(client_id, data)
    except WebSocketDisconnect:
        manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        manager.disconnect(client_id)


async def handle_message(client_id: str, data: dict):
    """Process incoming WebSocket messages."""
    msg_type = data.get("type", "unknown")

    if msg_type == "chat":
        content = data.get("content", "").strip()
        if content:
            await process_claude_request(client_id, content)
    elif msg_type == "cancel":
        await manager.cancel_process(client_id)
        await manager.send_json(client_id, {"type": "cancelled"})
    elif msg_type == "ping":
        await manager.send_json(client_id, {
            "type": "pong",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
    elif msg_type == "status":
        session = manager.session_data.get(client_id, {})
        await manager.send_json(client_id, {
            "type": "status",
            "is_processing": session.get("is_processing", False),
            "message_count": len(session.get("messages", [])),
            "connected_at": session.get("connected_at")
        })
    else:
        await manager.send_json(client_id, {
            "type": "error",
            "message": f"Unknown message type: {msg_type}"
        })


async def process_claude_request(client_id: str, content: str):
    """Spawn Claude CLI and stream response to client."""

    # Check if already processing
    if client_id in manager.session_data:
        if manager.session_data[client_id].get("is_processing"):
            await manager.send_json(client_id, {
                "type": "error",
                "message": "Already processing a request. Send 'cancel' to abort."
            })
            return
        manager.session_data[client_id]["is_processing"] = True

    # Send acknowledgment
    await manager.send_json(client_id, {
        "type": "message_received",
        "content": content,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    # Start thinking indicator
    await manager.send_json(client_id, {
        "type": "thinking_start",
        "label": "Claude is thinking..."
    })

    if not CLAUDE_CLI:
        # Mock mode - Claude CLI not available
        await mock_response(client_id, content)
        return

    try:
        await spawn_claude_cli(client_id, content)
    except Exception as e:
        logger.error(f"Claude CLI error: {e}")
        await manager.send_json(client_id, {
            "type": "error",
            "message": f"Claude CLI error: {str(e)}"
        })
    finally:
        if client_id in manager.session_data:
            manager.session_data[client_id]["is_processing"] = False


async def spawn_claude_cli(client_id: str, content: str):
    """Spawn Claude CLI process and stream output."""

    # Build command
    cmd = [
        CLAUDE_CLI,
        "-p",  # Print mode (non-interactive)
        "--output-format", "stream-json",
        "--verbose",  # Required for stream-json
        "--permission-mode", "bypassPermissions",
        content
    ]

    logger.info(f"Spawning Claude CLI for {client_id}")

    # Create subprocess
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=os.getcwd()
    )

    manager.active_processes[client_id] = proc

    thinking_sent = False
    full_response = []

    try:
        # Read stdout line by line (stream-json outputs one JSON per line)
        async for line in proc.stdout:
            line = line.decode('utf-8').strip()
            if not line:
                continue

            try:
                event = json.loads(line)
                event_type = event.get("type", "")

                # Handle different event types from Claude CLI
                if event_type == "assistant":
                    # Assistant message chunk
                    message = event.get("message", {})
                    content_blocks = message.get("content", [])

                    for block in content_blocks:
                        if block.get("type") == "text":
                            text = block.get("text", "")
                            if text:
                                if not thinking_sent:
                                    await manager.send_json(client_id, {
                                        "type": "thinking_complete"
                                    })
                                    thinking_sent = True

                                full_response.append(text)
                                # Send as streaming token
                                await manager.send_json(client_id, {
                                    "type": "token",
                                    "content": text
                                })

                elif event_type == "content_block_delta":
                    # Streaming text delta
                    delta = event.get("delta", {})
                    if delta.get("type") == "text_delta":
                        text = delta.get("text", "")
                        if text:
                            if not thinking_sent:
                                await manager.send_json(client_id, {
                                    "type": "thinking_complete"
                                })
                                thinking_sent = True

                            full_response.append(text)
                            await manager.send_json(client_id, {
                                "type": "token",
                                "content": text
                            })

                elif event_type == "result":
                    # Final result
                    result = event.get("result", "")
                    if result and not full_response:
                        full_response.append(result)
                        await manager.send_json(client_id, {
                            "type": "token",
                            "content": result
                        })

                elif event_type == "error":
                    error_msg = event.get("error", {}).get("message", "Unknown error")
                    await manager.send_json(client_id, {
                        "type": "error",
                        "message": error_msg
                    })

            except json.JSONDecodeError:
                # Not JSON - might be plain text output
                if line and not line.startswith("{"):
                    full_response.append(line)
                    await manager.send_json(client_id, {
                        "type": "token",
                        "content": line + "\n"
                    })

        # Read stderr for any errors
        stderr_data = await proc.stderr.read()
        if stderr_data:
            stderr_text = stderr_data.decode('utf-8').strip()
            if stderr_text:
                logger.warning(f"Claude CLI stderr: {stderr_text}")

        await proc.wait()

        # Send completion
        await manager.send_json(client_id, {"type": "done"})

        # Store in session
        if client_id in manager.session_data:
            manager.session_data[client_id]["messages"].append({
                "role": "assistant",
                "content": "".join(full_response),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

    finally:
        # Clean up process reference
        if client_id in manager.active_processes:
            del manager.active_processes[client_id]


async def mock_response(client_id: str, content: str):
    """Generate mock response when Claude CLI is not available."""

    await asyncio.sleep(0.5)  # Simulate thinking

    await manager.send_json(client_id, {
        "type": "thinking_complete"
    })

    response = f"""**Mock Mode** - Claude CLI not found in PATH.

To enable real Claude integration:
1. Install Claude CLI: `npm install -g @anthropic-ai/claude-code`
2. Authenticate: `claude login`
3. Restart this service

Your message was:
> {content}

*Timestamp: {datetime.now(timezone.utc).strftime('%H:%M:%S')} UTC*"""

    # Stream word by word for effect
    words = response.split()
    for word in words:
        await manager.send_json(client_id, {
            "type": "token",
            "content": word + " "
        })
        await asyncio.sleep(0.02)

    await manager.send_json(client_id, {"type": "done"})

    if client_id in manager.session_data:
        manager.session_data[client_id]["is_processing"] = False


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8005)
