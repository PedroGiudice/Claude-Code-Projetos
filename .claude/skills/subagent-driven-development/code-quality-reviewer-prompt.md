# Code Quality Reviewer Prompt Template

Use this template when dispatching a code quality reviewer subagent.

**Purpose:** Verify implementation is well-built (clean, tested, maintainable)

**Only dispatch after spec compliance review passes.**

## CRITICAL: Use Specialized Subagents

**NEVER use `general-purpose`.** Select based on what was implemented:

| Code Type | Subagent |
|-----------|----------|
| Python/FastAPI | `backend-auditor` |
| React/TypeScript | `frontend-auditor` |
| Infrastructure/DevOps | `cicd-operator` |

**Alternative (PR-focused):** `pr-review-toolkit:code-reviewer`

## Template

```
Task tool (backend-auditor OR frontend-auditor):
  description: "Code quality review for Task N"
  prompt: |
    You are reviewing code quality for Task N: [task name]

    ## What Was Implemented

    [From implementer's report]

    ## Commits to Review

    - BASE_SHA: [commit before task]
    - HEAD_SHA: [current commit]

    Run: `git diff BASE_SHA..HEAD_SHA`

    ## Your Job

    Review for:

    1. **Code Quality:**
       - Clean, readable code?
       - Good comments?
       - Follows project conventions?

    2. **Potential Issues:**
       - Any bugs or edge cases?
       - Any security concerns?
       - Any performance issues?

    3. **Testing:**
       - Was this tested?
       - Would you want tests for this?

    Report format:
    - **Strengths:** What was done well
    - **Issues:** Critical/Important/Minor
    - **Assessment:** Approve or Request Changes
```

**Code reviewer returns:** Strengths, Issues (Critical/Important/Minor), Assessment
