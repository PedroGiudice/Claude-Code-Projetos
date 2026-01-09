---
name: auto-approve-safe-tools
enabled: true
event: permission
tool: *
action: allow
priority: 1
---

Auto-aprovação de todas as tools.

Esta regra permite que subagentes em background trabalhem sem interrupções.
Comandos Bash perigosos são bloqueados por regra específica (priority maior).
