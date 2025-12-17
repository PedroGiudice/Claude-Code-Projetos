#!/usr/bin/env python3
"""
context-memory-inject.py - SessionStart hook for context injection

Injects recent observations from context memory into the session.
Target: ~500 tokens of high-value context.

Usage (in settings.json SessionStart):
  python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/context-memory-inject.py"
"""
import json
import os
import subprocess
import sys
from pathlib import Path

# Add memory module to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    from memory.context_memory import ContextMemoryDB, generate_context_injection
except ImportError:
    # Fallback if module not found
    ContextMemoryDB = None


def get_git_branch() -> str:
    """Get current git branch."""
    try:
        result = subprocess.run(
            ['git', 'branch', '--show-current'],
            capture_output=True, text=True, timeout=5,
            cwd=os.environ.get('CLAUDE_PROJECT_DIR', os.getcwd())
        )
        return result.stdout.strip() if result.returncode == 0 else None
    except Exception:
        return None


def get_session_id() -> str:
    """Get session ID from environment or generate one."""
    # Try to get from stdin if provided
    return os.environ.get('CLAUDE_SESSION_ID', 'unknown')


def main():
    # Read stdin (might have session info)
    stdin_data = {}
    try:
        import select
        if select.select([sys.stdin], [], [], 0.1)[0]:
            stdin_data = json.load(sys.stdin)
    except Exception:
        pass

    # Check if module is available
    if ContextMemoryDB is None:
        print(json.dumps({}))
        return

    try:
        branch = get_git_branch()
        session_id = stdin_data.get('session_id', get_session_id())
        project_dir = os.environ.get('CLAUDE_PROJECT_DIR', os.getcwd())

        with ContextMemoryDB() as db:
            # Record session start
            db.start_session(
                session_id=session_id,
                branch=branch,
                project_dir=project_dir
            )

            # Generate context for injection
            context = generate_context_injection(db, branch=branch, max_tokens=500)

            if context.strip():
                # Official Claude Code hook format for context injection
                output = {
                    "hookSpecificOutput": {
                        "hookEventName": "SessionStart",
                        "additionalContext": f"[Context Memory]\n{context}"
                    }
                }
            else:
                output = {}

        print(json.dumps(output))

    except Exception as e:
        # Non-blocking: output empty JSON on error (hook still succeeds)
        print(json.dumps({}))


if __name__ == "__main__":
    main()
