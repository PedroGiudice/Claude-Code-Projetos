"""
Custom tools for Frontend Commander agent.

These tools enable the agent to:
- Detect and inspect Docker containers
- Read backend source code
- Generate and write frontend code
- Integrate with project structure
"""
import subprocess
import json
import re
from pathlib import Path
from typing import Optional
from google.adk.tools import tool


# Project paths - configurable base
PROJECT_ROOT = Path("/home/user/Claude-Code-Projetos")


@tool
def list_docker_containers() -> str:
    """
    List all running Docker containers with their details.

    Returns:
        JSON string with container info: name, image, ports, status
    """
    try:
        result = subprocess.run(
            ["docker", "ps", "--format", "json"],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            return json.dumps({"error": result.stderr})

        containers = []
        for line in result.stdout.strip().split("\n"):
            if line:
                containers.append(json.loads(line))

        return json.dumps(containers, indent=2)

    except subprocess.TimeoutExpired:
        return json.dumps({"error": "Docker command timed out"})
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def inspect_container(container_name: str) -> str:
    """
    Get detailed information about a specific container.

    Args:
        container_name: Name or ID of the Docker container

    Returns:
        JSON with container configuration, environment, ports, volumes
    """
    try:
        result = subprocess.run(
            ["docker", "inspect", container_name],
            capture_output=True,
            text=True,
            timeout=30,
        )

        if result.returncode != 0:
            return json.dumps({"error": result.stderr})

        return result.stdout

    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def read_file(file_path: str) -> str:
    """
    Read any file from the project. Use for docs, plans, configs, or code.

    Args:
        file_path: Relative path from project root or absolute path.
                   Examples: "docs/plans/architecture.md", "docker-compose.yml"

    Returns:
        File contents as string
    """
    # Try as relative to project root first
    path = PROJECT_ROOT / file_path
    if not path.exists():
        # Try as absolute
        path = Path(file_path)

    if not path.exists():
        return json.dumps({"error": f"File not found: {file_path}"})

    try:
        return path.read_text()
    except Exception as e:
        return json.dumps({"error": f"Failed to read {file_path}: {e}"})


@tool
def write_file(file_path: str, content: str) -> str:
    """
    Write content to any file in the project.
    Creates parent directories if needed.

    Args:
        file_path: Relative path from project root.
                   Examples: "src/components/MyComponent.tsx", "docker-compose.yml"
        content: File contents to write

    Returns:
        Success message or error
    """
    path = PROJECT_ROOT / file_path

    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content)
        return json.dumps({
            "success": True,
            "path": str(path.relative_to(PROJECT_ROOT)),
            "message": f"File written: {file_path}"
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def read_backend_code(directory: str) -> str:
    """
    Read all Python source code from a directory.

    Args:
        directory: Path to the directory containing backend code

    Returns:
        Concatenated source code with file markers
    """
    base_path = PROJECT_ROOT / directory
    if not base_path.exists():
        base_path = Path(directory)

    if not base_path.exists():
        return json.dumps({"error": f"Directory not found: {directory}"})

    code_content = []

    # Read Python files
    for py_file in base_path.rglob("*.py"):
        # Skip __pycache__ and venv
        if "__pycache__" in str(py_file) or ".venv" in str(py_file):
            continue

        try:
            content = py_file.read_text()
            relative_path = py_file.relative_to(base_path)
            code_content.append(f"### FILE: {relative_path}\n```python\n{content}\n```\n")
        except Exception as e:
            code_content.append(f"### FILE: {py_file} (ERROR: {e})\n")

    # Read requirements.txt if exists
    req_file = base_path / "requirements.txt"
    if req_file.exists():
        try:
            content = req_file.read_text()
            code_content.append(f"### FILE: requirements.txt\n```\n{content}\n```\n")
        except:
            pass

    # Read Dockerfile if exists
    dockerfile = base_path / "Dockerfile"
    if dockerfile.exists():
        try:
            content = dockerfile.read_text()
            code_content.append(f"### FILE: Dockerfile\n```dockerfile\n{content}\n```\n")
        except:
            pass

    if not code_content:
        return json.dumps({"error": f"No code found in: {directory}"})

    return "\n".join(code_content)


@tool
def read_openapi_spec(directory: str) -> str:
    """
    Read OpenAPI/Swagger specification from a directory.

    Args:
        directory: Path to the directory containing the spec

    Returns:
        OpenAPI spec as JSON/YAML string, or error if not found
    """
    base_path = PROJECT_ROOT / directory
    if not base_path.exists():
        base_path = Path(directory)

    if not base_path.exists():
        return json.dumps({"error": f"Directory not found: {directory}"})

    spec_filenames = ["openapi.json", "openapi.yaml", "swagger.json", "swagger.yaml", "api.json"]

    for filename in spec_filenames:
        spec_file = base_path / filename
        if spec_file.exists():
            try:
                return spec_file.read_text()
            except Exception as e:
                return json.dumps({"error": f"Failed to read {spec_file}: {e}"})

    return json.dumps({"error": f"No OpenAPI spec found in: {directory}"})


@tool
def list_existing_modules(directory: str = "src/components") -> str:
    """
    List existing UI modules/components in a directory.

    Args:
        directory: Path to the directory containing modules (default: src/components)

    Returns:
        JSON with module names and their descriptions
    """
    modules_dir = PROJECT_ROOT / directory
    if not modules_dir.exists():
        return json.dumps({"error": f"Directory not found: {directory}", "modules": []})

    modules = []

    for file in modules_dir.glob("*.*"):
        if file.name.startswith("_") or file.name.startswith("."):
            continue

        module_info = {
            "name": file.stem,
            "file": str(file.relative_to(PROJECT_ROOT)),
            "type": file.suffix,
        }

        # Try to extract description from first docstring/comment
        try:
            content = file.read_text()
            if '"""' in content:
                start = content.index('"""') + 3
                end = content.index('"""', start)
                module_info["description"] = content[start:end].strip()[:200]
            elif "/*" in content:
                start = content.index("/*") + 2
                end = content.index("*/", start)
                module_info["description"] = content[start:end].strip()[:200]
        except:
            pass

        modules.append(module_info)

    return json.dumps(modules, indent=2)


@tool
def write_frontend_module(
    file_path: str,
    code: str,
) -> str:
    """
    Write a new frontend module/component to the project.

    Args:
        file_path: Full path where to save the file (e.g., 'src/components/Dashboard.tsx')
        code: Complete module code

    Returns:
        Success message with file path, or error
    """
    target_file = PROJECT_ROOT / file_path

    try:
        target_file.parent.mkdir(parents=True, exist_ok=True)
        target_file.write_text(code)
        return json.dumps({
            "success": True,
            "path": str(target_file.relative_to(PROJECT_ROOT)),
            "message": f"Module created: {file_path}",
        })
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def get_service_endpoints(directory: str) -> str:
    """
    Extract API endpoints from a backend service by analyzing its code.

    Looks for Flask/FastAPI route decorators.

    Args:
        directory: Path to the directory containing backend code

    Returns:
        JSON with detected endpoints: method, path, framework
    """
    code = read_backend_code(directory)
    if "error" in code:
        return code

    endpoints = []

    # FastAPI patterns
    fastapi_pattern = r'@(?:app|router)\.(get|post|put|delete|patch)\(["\']([^"\']+)["\']'
    for match in re.finditer(fastapi_pattern, code, re.IGNORECASE):
        endpoints.append({
            "method": match.group(1).upper(),
            "path": match.group(2),
            "framework": "fastapi",
        })

    # Flask patterns
    flask_pattern = r'@(?:app|bp|blueprint)\.(route|get|post|put|delete)\(["\']([^"\']+)["\']'
    for match in re.finditer(flask_pattern, code, re.IGNORECASE):
        endpoints.append({
            "method": match.group(1).upper() if match.group(1) != "route" else "GET",
            "path": match.group(2),
            "framework": "flask",
        })

    return json.dumps(endpoints, indent=2)
