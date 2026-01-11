"""
Tests for CCui WebSocket Backend.

These tests verify the WebSocket server functionality.
Note: Tests with actual Claude CLI require the CLI to be installed and authenticated.
"""
import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from main import app, manager, CLAUDE_CLI


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.mark.anyio
async def test_health_endpoint():
    """Test health endpoint returns correct status."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "ccui-ws"
        assert data["version"] == "2.0.0"
        assert "claude_cli" in data
        assert "timestamp" in data


@pytest.mark.anyio
async def test_chat_endpoint_no_websocket():
    """Test chat endpoint returns error when no WebSocket connection."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/chat",
            json={"message": "Hello", "token": "test-token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "No WebSocket connection" in data["message"]


@pytest.mark.anyio
async def test_chat_endpoint_empty_message():
    """Test chat endpoint rejects empty messages."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post(
            "/api/chat",
            json={"message": "", "token": "test-token"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "Empty message" in data["message"]


def test_claude_cli_detection():
    """Test that Claude CLI detection works."""
    # CLAUDE_CLI should be either a path (if found) or None
    if CLAUDE_CLI:
        assert CLAUDE_CLI.endswith("claude") or "claude" in CLAUDE_CLI
    # If None, mock mode will be used - this is also valid


def test_connection_manager_init():
    """Test ConnectionManager initializes correctly."""
    assert hasattr(manager, "active_connections")
    assert hasattr(manager, "session_data")
    assert hasattr(manager, "active_processes")
    assert isinstance(manager.active_connections, dict)
    assert isinstance(manager.session_data, dict)
    assert isinstance(manager.active_processes, dict)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
