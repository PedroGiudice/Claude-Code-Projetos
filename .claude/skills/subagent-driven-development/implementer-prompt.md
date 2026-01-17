# Implementer Subagent Prompt Template

Use this template when dispatching an implementer subagent.

## CRITICAL: Use Specialized Subagents

**NEVER use `general-purpose`.** Always select the appropriate specialized subagent:

### Implementation Subagents

| Task Type | Subagent | Notes |
|-----------|----------|-------|
| Python/FastAPI backend | `backend-developer` | Primary choice for backend |
| React/TypeScript frontend | `frontend-developer` | Primary choice for frontend |
| Infrastructure/Deploy OCI | `cicd-operator` | Oracle Cloud, Docker, SSH |
| Infrastructure/Deploy GCP | `cloud-run-deployer` | Google Cloud Run |
| DevOps Planning | `devops-automator` | CI/CD pipelines design |
| Testing (write/fix) | `test-writer-fixer` | Write and fix tests |
| Testing (TDD coach) | `tdd-coach` | Guide TDD process |
| Documentation | `documentation-architect` | README, docs |
| AI/LLM features | `ai-engineer` | RAG, prompts, LLM apps |
| FastHTML/HTMX | `fasthtml-bff-developer` | Backend-for-Frontend |
| Refactoring | `code-refactor-master` | Reorganize, clean up |
| Hooks debugging | `hook-tester-fixer` | Claude Code hooks |

### Review Subagents

| Review Type | Subagent | Notes |
|-------------|----------|-------|
| Python code quality | `backend-auditor` | ruff, mypy, bandit |
| React code quality | `frontend-auditor` | eslint, tsc, prettier |
| Plan compliance | `plan-reviewer` | Spec vs implementation |

### Research Subagents

| Task Type | Subagent | Notes |
|-----------|----------|-------|
| Codebase exploration | `Explore` | Built-in, fast search |
| Web research | `web-research-specialist` | GitHub, forums, docs |
| Architecture design | `backend-architect` | Consultative design |

### Other Subagents

| Task Type | Subagent | Notes |
|-----------|----------|-------|
| Auth debugging | `auth-route-debugger` | Keycloak, cookies |
| Large files/E2E | `gemini-assistant` | Gemini CLI for >600 lines |

## Template

```
Task tool (<specialized-subagent>):
  description: "Implement Task N: [task name]"
  prompt: |
    Voce esta implementando Task N: [task name]

    ## Task Description

    [FULL TEXT of task from plan - paste it here, don't make subagent read file]

    ## Context

    [Scene-setting: where this fits, dependencies, architectural context]

    ## Before You Begin

    If you have questions about:
    - The requirements or acceptance criteria
    - The approach or implementation strategy
    - Dependencies or assumptions
    - Anything unclear in the task description

    **Ask them now.** Raise any concerns before starting work.

    ## Your Job

    Once you're clear on requirements:
    1. Implement exactly what the task specifies
    2. Write tests (following TDD if task says to)
    3. Verify implementation works
    4. Commit your work
    5. Self-review (see below)
    6. Report back

    Work from: [directory]

    **While you work:** If you encounter something unexpected or unclear, **ask questions**.
    It's always OK to pause and clarify. Don't guess or make assumptions.

    ## Before Reporting Back: Self-Review

    Review your work with fresh eyes. Ask yourself:

    **Completeness:**
    - Did I fully implement everything in the spec?
    - Did I miss any requirements?
    - Are there edge cases I didn't handle?

    **Quality:**
    - Is this my best work?
    - Are names clear and accurate (match what things do, not how they work)?
    - Is the code clean and maintainable?

    **Discipline:**
    - Did I avoid overbuilding (YAGNI)?
    - Did I only build what was requested?
    - Did I follow existing patterns in the codebase?

    **Testing:**
    - Do tests actually verify behavior (not just mock behavior)?
    - Did I follow TDD if required?
    - Are tests comprehensive?

    If you find issues during self-review, fix them now before reporting.

    ## Report Format

    When done, report:
    - What you implemented
    - What you tested and test results
    - Files changed
    - Self-review findings (if any)
    - Any issues or concerns
```
