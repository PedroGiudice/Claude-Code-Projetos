#!/bin/bash
# Run ccui-ws locally (not in Docker) to access Claude CLI
# This is the recommended way to run ccui-ws for Claude CLI integration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Check if Claude CLI is available
if ! command -v claude &> /dev/null; then
    echo "ERROR: Claude CLI not found in PATH"
    echo "Install with: npm install -g @anthropic-ai/claude-code"
    echo "Then authenticate: claude login"
    exit 1
fi

# Create venv if needed
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate venv
source .venv/bin/activate

# Install dependencies
pip install -q fastapi uvicorn[standard] websockets

# Run the server
echo "Starting ccui-ws on http://localhost:8005"
echo "Claude CLI: $(which claude)"
python main.py
