# Arquitetura de Statusline para Orquestração Multi-Agent

## Contexto e Requisitos

Você precisa de uma statusline que exiba **em tempo real**:

1. **Agentes Ativos**: Quantos/quais agentes (subagents) estão em execução
2. **Hooks**: Quais hooks estão ativados ou sendo executados
3. **Skills**: Quais skills/capabilities estão sendo utilizadas
4. **Orquestrador**: Monitoramento específico de um agente orquestrador principal

### Problema
Nenhuma statusline existente oferece isso out-of-the-box. Precisamos de uma **solução customizada** que integre:
- Sistema de tracking de agentes
- Monitoramento de hooks via eventos
- Detecção de skills em uso
- Dashboard em tempo real

---

## Arquitetura Proposta

### Opção 1: Solução Híbrida (Recomendada)
**Base:** ccstatusline ou claude-code-statusline (rz1989s) + Sistema de Tracking Customizado

#### Stack Técnica
```
┌─────────────────────────────────────────────────────────────┐
│                    STATUSLINE (Display Layer)                │
│  ┌──────────────┬──────────────┬──────────────┬───────────┐ │
│  │  Agentes     │   Hooks      │   Skills     │ Orquestr. │ │
│  │  Active: 3   │   5 ativos   │   TUI, Git   │   Status  │ │
│  └──────────────┴──────────────┴──────────────┴───────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↑
                          │ Consulta
                          │
┌─────────────────────────────────────────────────────────────┐
│              TRACKING SYSTEM (Data Layer)                    │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  State Manager (SQLite ou Redis)                     │   │
│  │  - agents_state.db                                   │   │
│  │  - hooks_events.db                                   │   │
│  │  - skills_usage.db                                   │   │
│  │  - orchestrator_metrics.db                           │   │
│  └─────────────────────────────────────────────────────┘   │
│                          ↑                                    │
│                          │ Atualiza                          │
│                          │                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Collectors (Hook-based)                             │   │
│  │  - AgentCollector (detecta spawn/stop)               │   │
│  │  - HookCollector (monitora hook events)              │   │
│  │  - SkillCollector (rastreia skill calls)             │   │
│  │  - OrchestratorCollector (metrics específicos)       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                          ↑
                          │ Hook Events
                          │
┌─────────────────────────────────────────────────────────────┐
│              CLAUDE CODE (Event Source)                      │
│  - Hook: PrePrompt                                           │
│  - Hook: PostResponse                                        │
│  - Hook: PreCompact                                          │
│  - Hook: Stop                                                │
│  - Hook: Custom (AgentSpawn, AgentStop)                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementação Detalhada

### 1. Sistema de Tracking de Agentes

#### 1.1. Agent State Manager (Python/Rust/Node)

```python
# ~/.claude/monitoring/agent_tracker.py

import sqlite3
import json
from datetime import datetime
from pathlib import Path

class AgentTracker:
    def __init__(self, db_path="~/.claude/monitoring/agents.db"):
        self.db_path = Path(db_path).expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()
    
    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS agents (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    role TEXT,
                    status TEXT CHECK(status IN ('spawning', 'active', 'idle', 'stopped')),
                    parent_session TEXT,
                    started_at TIMESTAMP,
                    last_activity TIMESTAMP,
                    total_tokens INTEGER DEFAULT 0,
                    total_cost_usd REAL DEFAULT 0,
                    task_description TEXT,
                    context_size INTEGER,
                    metadata JSON
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS agent_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    agent_id TEXT NOT NULL,
                    event_type TEXT NOT NULL,
                    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    data JSON,
                    FOREIGN KEY (agent_id) REFERENCES agents(id)
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_agent_status 
                ON agents(status, last_activity)
            """)
    
    def register_agent(self, agent_id, name, role, parent_session, task=None):
        """Registra novo agente (chamado via hook)"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO agents 
                (id, name, role, status, parent_session, started_at, last_activity, task_description)
                VALUES (?, ?, ?, 'spawning', ?, ?, ?, ?)
            """, (agent_id, name, role, parent_session, 
                  datetime.now(), datetime.now(), task))
            
            self._log_event(agent_id, 'spawn', {'task': task})
    
    def update_agent_status(self, agent_id, status, metadata=None):
        """Atualiza status do agente"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE agents 
                SET status = ?, last_activity = ?, metadata = ?
                WHERE id = ?
            """, (status, datetime.now(), 
                  json.dumps(metadata) if metadata else None, agent_id))
            
            self._log_event(agent_id, 'status_change', {'new_status': status})
    
    def update_agent_metrics(self, agent_id, tokens=0, cost=0):
        """Atualiza métricas do agente"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE agents 
                SET total_tokens = total_tokens + ?,
                    total_cost_usd = total_cost_usd + ?,
                    last_activity = ?
                WHERE id = ?
            """, (tokens, cost, datetime.now(), agent_id))
    
    def get_active_agents(self):
        """Retorna agentes ativos"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM agents 
                WHERE status IN ('spawning', 'active', 'idle')
                AND last_activity > datetime('now', '-5 minutes')
                ORDER BY started_at DESC
            """)
            return [dict(row) for row in cursor.fetchall()]
    
    def get_orchestrator_metrics(self, session_id):
        """Métricas do orquestrador principal"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            # Total de agentes gerenciados
            total = conn.execute("""
                SELECT COUNT(*) as count FROM agents 
                WHERE parent_session = ?
            """, (session_id,)).fetchone()['count']
            
            # Agentes ativos
            active = conn.execute("""
                SELECT COUNT(*) as count FROM agents 
                WHERE parent_session = ? AND status = 'active'
            """, (session_id,)).fetchone()['count']
            
            # Custo total
            cost = conn.execute("""
                SELECT SUM(total_cost_usd) as total FROM agents 
                WHERE parent_session = ?
            """, (session_id,)).fetchone()['total'] or 0
            
            # Taxa de sucesso (agentes que completaram vs falharam)
            success_rate = conn.execute("""
                SELECT 
                    COUNT(CASE WHEN status = 'stopped' THEN 1 END) * 100.0 / COUNT(*) as rate
                FROM agents 
                WHERE parent_session = ?
            """, (session_id,)).fetchone()['rate'] or 0
            
            return {
                'total_agents': total,
                'active_agents': active,
                'total_cost': cost,
                'success_rate': success_rate
            }
    
    def _log_event(self, agent_id, event_type, data=None):
        """Log interno de eventos"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO agent_events (agent_id, event_type, data)
                VALUES (?, ?, ?)
            """, (agent_id, event_type, json.dumps(data) if data else None))
    
    def cleanup_stale_agents(self, minutes=10):
        """Remove agentes sem atividade"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                UPDATE agents 
                SET status = 'stopped'
                WHERE last_activity < datetime('now', '-' || ? || ' minutes')
                AND status != 'stopped'
            """, (minutes,))


# CLI para debugging
if __name__ == "__main__":
    import sys
    tracker = AgentTracker()
    
    if len(sys.argv) > 1 and sys.argv[1] == "list":
        agents = tracker.get_active_agents()
        for agent in agents:
            print(f"{agent['name']:<20} {agent['role']:<15} {agent['status']:<10} {agent['total_cost_usd']:.4f} USD")
```

#### 1.2. Hook Collector

```bash
# ~/.claude/hooks/agent_spawn_hook.sh
# Hook: PrePrompt (detecta quando novo agente vai spawnar)

#!/bin/bash

# Recebe JSON do Claude Code via stdin
INPUT=$(cat)

# Extrai session_id
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path')

# Detecta se há spawn de subagent analisando transcript
if [ -f "$TRANSCRIPT" ]; then
    # Verifica últimas linhas do transcript para patterns de spawn
    LAST_MESSAGES=$(tail -n 5 "$TRANSCRIPT" | jq -r '.[] | select(.role=="assistant") | .content' 2>/dev/null)
    
    # Pattern: "Vou criar um subagent..." ou similar
    if echo "$LAST_MESSAGES" | grep -qiE "(creating subagent|spawning agent|delegating to|@[a-z-]+)" ; then
        # Extrai nome do agente
        AGENT_NAME=$(echo "$LAST_MESSAGES" | grep -oP '@[a-z-]+' | head -1 | tr -d '@')
        
        if [ -n "$AGENT_NAME" ]; then
            # Gera ID único
            AGENT_ID="${SESSION_ID}_${AGENT_NAME}_$(date +%s)"
            
            # Registra no tracker
            python3 ~/.claude/monitoring/agent_tracker.py register \
                --id "$AGENT_ID" \
                --name "$AGENT_NAME" \
                --parent "$SESSION_ID" \
                --role "subagent"
        fi
    fi
fi

# Retorna input inalterado (hook não deve modificar)
echo "$INPUT"
```

```bash
# ~/.claude/hooks/agent_activity_hook.sh
# Hook: PostResponse (atualiza atividade de agentes)

#!/bin/bash

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')

# Atualiza last_activity do agente principal (orquestrador)
python3 ~/.claude/monitoring/agent_tracker.py update \
    --id "$SESSION_ID" \
    --status "active"

# Extrai métricas de uso
COST=$(echo "$INPUT" | jq -r '.cost.total_cost_usd // 0')
TOKENS=$(echo "$INPUT" | jq -r '.tokens // 0')

python3 ~/.claude/monitoring/agent_tracker.py metrics \
    --id "$SESSION_ID" \
    --tokens "$TOKENS" \
    --cost "$COST"

echo "$INPUT"
```

### 2. Sistema de Tracking de Hooks

```python
# ~/.claude/monitoring/hook_tracker.py

import sqlite3
from datetime import datetime
from pathlib import Path
import json

class HookTracker:
    HOOK_TYPES = [
        'PrePrompt', 'PostPrompt', 
        'PreResponse', 'PostResponse',
        'PreCompact', 'PostCompact',
        'Stop', 'Error',
        'PreToolUse', 'PostToolUse'
    ]
    
    def __init__(self, db_path="~/.claude/monitoring/hooks.db"):
        self.db_path = Path(db_path).expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()
    
    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS hook_registry (
                    hook_name TEXT PRIMARY KEY,
                    hook_type TEXT NOT NULL,
                    enabled BOOLEAN DEFAULT 1,
                    command TEXT,
                    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS hook_executions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    hook_name TEXT NOT NULL,
                    session_id TEXT,
                    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    duration_ms INTEGER,
                    success BOOLEAN,
                    error TEXT,
                    FOREIGN KEY (hook_name) REFERENCES hook_registry(hook_name)
                )
            """)
    
    def register_hook(self, name, hook_type, command):
        """Registra hook no sistema"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT OR REPLACE INTO hook_registry (hook_name, hook_type, command)
                VALUES (?, ?, ?)
            """, (name, hook_type, command))
    
    def log_execution(self, hook_name, session_id, duration_ms, success=True, error=None):
        """Log de execução de hook"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO hook_executions 
                (hook_name, session_id, duration_ms, success, error)
                VALUES (?, ?, ?, ?, ?)
            """, (hook_name, session_id, duration_ms, success, error))
    
    def get_active_hooks(self):
        """Retorna hooks ativos"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT h.*, COUNT(e.id) as recent_executions
                FROM hook_registry h
                LEFT JOIN hook_executions e 
                    ON h.hook_name = e.hook_name 
                    AND e.executed_at > datetime('now', '-1 minute')
                WHERE h.enabled = 1
                GROUP BY h.hook_name
            """)
            return [dict(row) for row in cursor.fetchall()]
    
    def get_hook_stats(self, minutes=5):
        """Estatísticas de hooks"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT 
                    hook_name,
                    COUNT(*) as executions,
                    AVG(duration_ms) as avg_duration,
                    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failures
                FROM hook_executions
                WHERE executed_at > datetime('now', '-' || ? || ' minutes')
                GROUP BY hook_name
            """, (minutes,))
            return [dict(row) for row in cursor.fetchall()]
```

### 3. Sistema de Tracking de Skills

```python
# ~/.claude/monitoring/skill_tracker.py

import sqlite3
from datetime import datetime
from pathlib import Path
import re

class SkillTracker:
    def __init__(self, db_path="~/.claude/monitoring/skills.db"):
        self.db_path = Path(db_path).expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()
    
    def init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS skill_registry (
                    skill_name TEXT PRIMARY KEY,
                    skill_path TEXT,
                    description TEXT,
                    category TEXT,
                    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS skill_usage (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    skill_name TEXT NOT NULL,
                    session_id TEXT,
                    agent_id TEXT,
                    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    context TEXT,
                    FOREIGN KEY (skill_name) REFERENCES skill_registry(skill_name)
                )
            """)
    
    def detect_skill_usage(self, transcript_path, session_id):
        """Detecta skills em uso analisando transcript"""
        try:
            with open(transcript_path) as f:
                transcript = f.read()
            
            # Patterns comuns de skills
            skill_patterns = {
                'docx': r'(creating|editing|reading).*\.docx',
                'pdf': r'(creating|editing|reading).*\.pdf',
                'pptx': r'(creating|editing|reading).*\.pptx',
                'xlsx': r'(creating|editing|reading).*\.xlsx',
                'web_search': r'(searching|web_search|brave search)',
                'git': r'(git\s+\w+|commit|push|pull|branch)',
                'bash': r'(bash_tool|running command|executing)',
                'analysis': r'(analyzing|analysis|reviewing)',
            }
            
            detected = []
            for skill, pattern in skill_patterns.items():
                if re.search(pattern, transcript, re.IGNORECASE):
                    detected.append(skill)
            
            # Registra detecções
            for skill in detected:
                self.log_usage(skill, session_id)
            
            return detected
            
        except Exception as e:
            return []
    
    def log_usage(self, skill_name, session_id, agent_id=None, context=None):
        """Log de uso de skill"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO skill_usage (skill_name, session_id, agent_id, context)
                VALUES (?, ?, ?, ?)
            """, (skill_name, session_id, agent_id, context))
    
    def get_active_skills(self, minutes=5):
        """Skills em uso recente"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT DISTINCT skill_name, MAX(used_at) as last_used
                FROM skill_usage
                WHERE used_at > datetime('now', '-' || ? || ' minutes')
                GROUP BY skill_name
                ORDER BY last_used DESC
            """, (minutes,))
            return [dict(row) for row in cursor.fetchall()]
    
    def get_skill_stats(self):
        """Estatísticas de skills"""
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT 
                    skill_name,
                    COUNT(*) as usage_count,
                    COUNT(DISTINCT session_id) as sessions,
                    MAX(used_at) as last_used
                FROM skill_usage
                GROUP BY skill_name
                ORDER BY usage_count DESC
            """)
            return [dict(row) for row in cursor.fetchall()]
```

### 4. Statusline Customizada

#### Opção A: Baseada em ccstatusline (Custom Command Widget)

```python
# ~/.claude/monitoring/statusline_display.py

#!/usr/bin/env python3

import sys
import json
from agent_tracker import AgentTracker
from hook_tracker import HookTracker
from skill_tracker import SkillTracker

def get_orchestrator_display(session_id):
    """Display do orquestrador"""
    tracker = AgentTracker()
    metrics = tracker.get_orchestrator_metrics(session_id)
    
    # Ícones
    icon = "🎭"
    status = "🟢" if metrics['active_agents'] > 0 else "🟡"
    
    return f"{icon} Orch {status} {metrics['active_agents']}/{metrics['total_agents']} ${metrics['total_cost']:.2f}"

def get_agents_display():
    """Display de agentes"""
    tracker = AgentTracker()
    agents = tracker.get_active_agents()
    
    if not agents:
        return "🤖 Agents: 0"
    
    # Agrupa por role
    by_role = {}
    for agent in agents:
        role = agent.get('role', 'unknown')
        by_role[role] = by_role.get(role, 0) + 1
    
    # Formato compacto: 🤖 3 (2 impl, 1 review)
    summary = ", ".join([f"{count} {role}" for role, count in by_role.items()])
    return f"🤖 {len(agents)} ({summary})"

def get_hooks_display():
    """Display de hooks"""
    tracker = HookTracker()
    hooks = tracker.get_active_hooks()
    stats = tracker.get_hook_stats(minutes=1)
    
    active_count = len([h for h in hooks if h['recent_executions'] > 0])
    total_count = len(hooks)
    
    # Mostra hooks com execuções recentes
    recent = [s['hook_name'] for s in stats if s['executions'] > 0]
    recent_str = ", ".join(recent[:3])  # Máximo 3
    if len(recent) > 3:
        recent_str += "..."
    
    return f"⚡ Hooks: {active_count}/{total_count} ({recent_str})"

def get_skills_display():
    """Display de skills"""
    tracker = SkillTracker()
    skills = tracker.get_active_skills(minutes=2)
    
    if not skills:
        return "🛠️ Skills: -"
    
    skill_names = [s['skill_name'] for s in skills[:4]]
    skill_str = ", ".join(skill_names)
    if len(skills) > 4:
        skill_str += f" +{len(skills)-4}"
    
    return f"🛠️ {skill_str}"

def main():
    # Recebe JSON do Claude Code via stdin
    try:
        data = json.load(sys.stdin)
        session_id = data.get('session_id', 'unknown')
        
        # Componentes
        orch = get_orchestrator_display(session_id)
        agents = get_agents_display()
        hooks = get_hooks_display()
        skills = get_skills_display()
        
        # Output colorido
        # Formato: Orch | Agents | Hooks | Skills
        output = f"{orch} │ {agents} │ {hooks} │ {skills}"
        
        print(output)
        
    except Exception as e:
        # Fallback silencioso
        print(f"⚠️ Monitoring unavailable")
        sys.exit(0)

if __name__ == "__main__":
    main()
```

#### Integração com ccstatusline

```json
// ~/.claude/settings.json

{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline",
    "padding": 0
  },
  "hooks": {
    "PrePrompt": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/agent_spawn_hook.sh"
      }]
    }],
    "PostResponse": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/agent_activity_hook.sh"
      }]
    }],
    "PostToolUse": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/skill_detection_hook.sh"
      }]
    }],
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/cleanup_hook.sh"
      }]
    }]
  }
}
```

Configure Custom Command Widget no ccstatusline TUI:
```bash
npx ccstatusline

# No TUI:
# 1. Adicionar widget "Custom Command"
# 2. Command: python3 ~/.claude/monitoring/statusline_display.py
# 3. Timeout: 1000ms
# 4. Preserve colors: Yes
```

#### Opção B: Statusline Standalone em Rust

```rust
// ~/.claude/monitoring/orchestrator_statusline/src/main.rs

use serde::{Deserialize, Serialize};
use rusqlite::{Connection, Result};
use std::io::{self, Read};
use colored::*;

#[derive(Deserialize)]
struct ClaudeInput {
    session_id: String,
    model: Option<ModelInfo>,
    workspace: Option<WorkspaceInfo>,
}

#[derive(Deserialize)]
struct ModelInfo {
    display_name: String,
}

#[derive(Deserialize)]
struct WorkspaceInfo {
    current_dir: String,
}

struct OrchestratorStats {
    active_agents: i32,
    total_agents: i32,
    active_hooks: i32,
    active_skills: Vec<String>,
    total_cost: f64,
}

fn get_stats(session_id: &str) -> Result<OrchestratorStats> {
    let conn = Connection::open(
        shellexpand::tilde("~/.claude/monitoring/agents.db").to_string()
    )?;
    
    let mut stmt = conn.prepare(
        "SELECT COUNT(*) as total, 
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
                SUM(total_cost_usd) as cost
         FROM agents 
         WHERE parent_session = ?"
    )?;
    
    let (total, active, cost) = stmt.query_row([session_id], |row| {
        Ok((row.get(0)?, row.get(1)?, row.get(2)?))
    })?;
    
    // Skills ativos
    let skills_conn = Connection::open(
        shellexpand::tilde("~/.claude/monitoring/skills.db").to_string()
    )?;
    
    let mut skills_stmt = skills_conn.prepare(
        "SELECT DISTINCT skill_name FROM skill_usage 
         WHERE used_at > datetime('now', '-2 minutes')
         LIMIT 5"
    )?;
    
    let skills: Vec<String> = skills_stmt
        .query_map([], |row| row.get(0))?
        .filter_map(|s| s.ok())
        .collect();
    
    // Hooks ativos
    let hooks_conn = Connection::open(
        shellexpand::tilde("~/.claude/monitoring/hooks.db").to_string()
    )?;
    
    let active_hooks: i32 = hooks_conn.query_row(
        "SELECT COUNT(*) FROM hook_registry WHERE enabled = 1",
        [],
        |row| row.get(0)
    )?;
    
    Ok(OrchestratorStats {
        active_agents: active,
        total_agents: total,
        active_hooks,
        active_skills: skills,
        total_cost: cost,
    })
}

fn format_statusline(stats: OrchestratorStats, model: &str) -> String {
    let orch_status = if stats.active_agents > 0 { "🟢" } else { "🟡" };
    
    format!(
        "{} {} {} │ 🤖 {}/{} agents │ ⚡ {} hooks │ 🛠️ {} │ ${:.2}",
        "🎭".bright_purple(),
        model.bright_cyan(),
        orch_status,
        stats.active_agents.to_string().bright_green(),
        stats.total_agents,
        stats.active_hooks.to_string().bright_yellow(),
        stats.active_skills.join(", ").bright_blue(),
        stats.total_cost
    )
}

fn main() {
    let mut buffer = String::new();
    io::stdin().read_to_string(&mut buffer).unwrap_or_default();
    
    match serde_json::from_str::<ClaudeInput>(&buffer) {
        Ok(input) => {
            let model = input.model
                .map(|m| m.display_name)
                .unwrap_or_else(|| "Claude".to_string());
            
            match get_stats(&input.session_id) {
                Ok(stats) => {
                    println!("{}", format_statusline(stats, &model));
                }
                Err(_) => {
                    println!("⚠️ Monitoring data unavailable");
                }
            }
        }
        Err(_) => {
            println!("⚠️ Invalid input");
        }
    }
}
```

Build:
```bash
cd ~/.claude/monitoring/orchestrator_statusline
cargo build --release
cp target/release/orchestrator_statusline ~/.claude/statusline
chmod +x ~/.claude/statusline
```

Settings:
```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/statusline",
    "padding": 0
  }
}
```

---

## 5. Dashboard Web (Opcional - Monitoramento Avançado)

Para visualização mais rica:

```python
# ~/.claude/monitoring/web_dashboard.py

from flask import Flask, render_template, jsonify
from agent_tracker import AgentTracker
from hook_tracker import HookTracker
from skill_tracker import SkillTracker

app = Flask(__name__)

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/agents')
def get_agents():
    tracker = AgentTracker()
    return jsonify(tracker.get_active_agents())

@app.route('/api/orchestrator/<session_id>')
def get_orchestrator(session_id):
    tracker = AgentTracker()
    return jsonify(tracker.get_orchestrator_metrics(session_id))

@app.route('/api/hooks')
def get_hooks():
    tracker = HookTracker()
    return jsonify({
        'active': tracker.get_active_hooks(),
        'stats': tracker.get_hook_stats()
    })

@app.route('/api/skills')
def get_skills():
    tracker = SkillTracker()
    return jsonify({
        'active': tracker.get_active_skills(),
        'stats': tracker.get_skill_stats()
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=8765)
```

```html
<!-- ~/.claude/monitoring/templates/dashboard.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Claude Orchestrator Monitor</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: 'Courier New', monospace; 
            background: #1e1e1e; 
            color: #d4d4d4;
            padding: 20px;
        }
        .container { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .panel { 
            background: #252526; 
            border: 1px solid #3e3e42; 
            border-radius: 8px; 
            padding: 20px;
        }
        .metric { font-size: 2em; color: #4ec9b0; }
        .agent-card {
            background: #2d2d30;
            padding: 10px;
            margin: 10px 0;
            border-left: 3px solid #569cd6;
        }
        .status-active { color: #4ec9b0; }
        .status-idle { color: #dcdcaa; }
        .status-stopped { color: #d16969; }
    </style>
</head>
<body>
    <h1>🎭 Claude Orchestrator Monitor</h1>
    
    <div class="container">
        <div class="panel">
            <h2>Orchestrator Status</h2>
            <div id="orch-metrics"></div>
        </div>
        
        <div class="panel">
            <h2>Active Agents (<span id="agent-count">0</span>)</h2>
            <div id="agents-list"></div>
        </div>
        
        <div class="panel">
            <h2>Hooks (<span id="hook-count">0</span>)</h2>
            <div id="hooks-list"></div>
        </div>
        
        <div class="panel">
            <h2>Skills in Use</h2>
            <div id="skills-list"></div>
        </div>
    </div>
    
    <script>
        async function updateDashboard() {
            // Agents
            const agents = await fetch('/api/agents').then(r => r.json());
            document.getElementById('agent-count').textContent = agents.length;
            document.getElementById('agents-list').innerHTML = agents.map(a => `
                <div class="agent-card">
                    <strong>${a.name}</strong> 
                    <span class="status-${a.status}">${a.status}</span><br>
                    Role: ${a.role} | Cost: $${a.total_cost_usd.toFixed(4)}
                </div>
            `).join('');
            
            // Hooks
            const hooks = await fetch('/api/hooks').then(r => r.json());
            document.getElementById('hook-count').textContent = hooks.active.length;
            document.getElementById('hooks-list').innerHTML = hooks.active.map(h => `
                <div>⚡ ${h.hook_name} (${h.recent_executions} recent)</div>
            `).join('');
            
            // Skills
            const skills = await fetch('/api/skills').then(r => r.json());
            document.getElementById('skills-list').innerHTML = skills.active.map(s => `
                <div>🛠️ ${s.skill_name} <small>(${s.last_used})</small></div>
            `).join('');
        }
        
        // Atualiza a cada 2 segundos
        setInterval(updateDashboard, 2000);
        updateDashboard();
    </script>
</body>
</html>
```

Executar:
```bash
python3 ~/.claude/monitoring/web_dashboard.py &
# Acesse: http://localhost:8765
```

---

## 6. Configuração Completa

### Estrutura de Diretórios

```
~/.claude/
├── monitoring/
│   ├── agent_tracker.py          # Core tracking de agentes
│   ├── hook_tracker.py           # Core tracking de hooks
│   ├── skill_tracker.py          # Core tracking de skills
│   ├── statusline_display.py     # Display para statusline
│   ├── web_dashboard.py          # Dashboard web (opcional)
│   ├── templates/
│   │   └── dashboard.html
│   ├── agents.db                 # SQLite database
│   ├── hooks.db
│   └── skills.db
├── hooks/
│   ├── agent_spawn_hook.sh
│   ├── agent_activity_hook.sh
│   ├── skill_detection_hook.sh
│   ├── hook_logging_hook.sh
│   └── cleanup_hook.sh
└── settings.json
```

### Script de Instalação

```bash
#!/bin/bash
# ~/.claude/install_orchestrator_monitor.sh

set -e

echo "🎭 Installing Orchestrator Monitor..."

# Criar estrutura
mkdir -p ~/.claude/monitoring/{templates,static}
mkdir -p ~/.claude/hooks

# Baixar ou copiar arquivos
echo "📦 Setting up tracking system..."
# (copiar os arquivos Python acima)

# Instalar dependências Python
echo "🐍 Installing Python dependencies..."
pip3 install --user colorama sqlite3

# Configurar permissões
chmod +x ~/.claude/monitoring/*.py
chmod +x ~/.claude/hooks/*.sh

# Inicializar databases
echo "🗄️ Initializing databases..."
python3 << 'PYTHON'
import sys
sys.path.append('~/.claude/monitoring')
from agent_tracker import AgentTracker
from hook_tracker import HookTracker
from skill_tracker import SkillTracker

AgentTracker().init_db()
HookTracker().init_db()
SkillTracker().init_db()
print("✅ Databases initialized")
PYTHON

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Configure ~/.claude/settings.json with hooks"
echo "2. Add custom command widget to ccstatusline"
echo "3. Restart Claude Code"
echo ""
echo "Optional: python3 ~/.claude/monitoring/web_dashboard.py"
```

### Configuração Final do settings.json

```json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline",
    "padding": 0
  },
  "hooks": {
    "PrePrompt": [{
      "hooks": [
        {
          "type": "command",
          "command": "~/.claude/hooks/agent_spawn_hook.sh",
          "description": "Detect agent spawning"
        },
        {
          "type": "command",
          "command": "~/.claude/hooks/hook_logging_hook.sh PrePrompt",
          "description": "Log hook execution"
        }
      ]
    }],
    "PostResponse": [{
      "hooks": [
        {
          "type": "command",
          "command": "~/.claude/hooks/agent_activity_hook.sh",
          "description": "Update agent activity"
        },
        {
          "type": "command",
          "command": "~/.claude/hooks/hook_logging_hook.sh PostResponse",
          "description": "Log hook execution"
        }
      ]
    }],
    "PostToolUse": [{
      "hooks": [{
        "type": "command",
        "command": "~/.claude/hooks/skill_detection_hook.sh",
        "description": "Detect skill usage"
      }]
    }],
    "PreCompact": [{
      "hooks": [{
        "type": "command",
        "command": "echo 'Compacting...' >> ~/.claude/monitoring/events.log"
      }]
    }],
    "Stop": [{
      "hooks": [
        {
          "type": "command",
          "command": "~/.claude/hooks/cleanup_hook.sh",
          "description": "Cleanup stale agents"
        }
      ]
    }]
  }
}
```

---

## 7. Exemplos de Uso

### Cenário 1: Orquestrador com 5 Subagentes

```
Statusline exibe:
🎭 Sonnet 4 🟢 │ 🤖 5/7 (3 impl, 2 review) │ ⚡ 8/12 hooks │ 🛠️ docx, git, analysis, bash │ $3.42
```

Significado:
- **🎭 Sonnet 4 🟢**: Orquestrador ativo usando Sonnet 4
- **5/7 agents**: 5 agentes ativos de 7 totais criados
- **(3 impl, 2 review)**: 3 implementadores, 2 reviewers
- **8/12 hooks**: 8 hooks ativos de 12 registrados
- **Skills**: docx, git, analysis, bash em uso nos últimos 2min
- **$3.42**: Custo total acumulado

### Cenário 2: Debug de Agente Stuck

Dashboard web mostra:
```
Agent: backend-implementer
Status: idle (5 minutes)
Last activity: 14:23:45
Task: "Implement payment API"
Tokens: 45K
Cost: $0.12

⚠️ Alert: Agent idle >5min, possible stuck
```

### Cenário 3: Hooks Failing

```
Statusline:
⚡ Hooks: 7/12 (⚠️ 3 failures)

Dashboard:
- PrePrompt: 45 exec, 0 failures
- PostResponse: 38 exec, 3 failures (timeout)
  └─ agent_activity_hook.sh taking >5s
```

---

## 8. Performance e Otimização

### Caching Strategy

```python
# ~/.claude/monitoring/cache.py

from functools import lru_cache
from datetime import datetime, timedelta

class MetricsCache:
    def __init__(self, ttl_seconds=5):
        self.ttl = timedelta(seconds=ttl_seconds)
        self._cache = {}
    
    def get(self, key):
        if key in self._cache:
            value, timestamp = self._cache[key]
            if datetime.now() - timestamp < self.ttl:
                return value
        return None
    
    def set(self, key, value):
        self._cache[key] = (value, datetime.now())
    
    def invalidate(self, key):
        self._cache.pop(key, None)

# Uso no statusline_display.py
cache = MetricsCache(ttl_seconds=2)

def get_agents_display():
    cached = cache.get('agents')
    if cached:
        return cached
    
    # Query database...
    result = "..."
    cache.set('agents', result)
    return result
```

### Database Índices

```sql
-- Otimizações para queries frequentes

-- Agents
CREATE INDEX idx_agents_parent_status 
ON agents(parent_session, status, last_activity);

CREATE INDEX idx_agents_active 
ON agents(status, last_activity) 
WHERE status IN ('active', 'spawning');

-- Hooks
CREATE INDEX idx_hook_exec_recent 
ON hook_executions(hook_name, executed_at DESC);

-- Skills
CREATE INDEX idx_skill_usage_recent 
ON skill_usage(skill_name, used_at DESC);
```

### Cleanup Automático

```bash
# ~/.claude/hooks/cleanup_hook.sh

#!/bin/bash

# Cleanup agents inativos
python3 ~/.claude/monitoring/agent_tracker.py cleanup --minutes 10

# Limpa logs antigos de hooks (>7 dias)
sqlite3 ~/.claude/monitoring/hooks.db << 'SQL'
DELETE FROM hook_executions 
WHERE executed_at < datetime('now', '-7 days');
SQL

# Limpa skill usage antigo (>7 dias)
sqlite3 ~/.claude/monitoring/skills.db << 'SQL'
DELETE FROM skill_usage 
WHERE used_at < datetime('now', '-7 days');
SQL

# Vacuum databases
sqlite3 ~/.claude/monitoring/agents.db "VACUUM;"
sqlite3 ~/.claude/monitoring/hooks.db "VACUUM;"
sqlite3 ~/.claude/monitoring/skills.db "VACUUM;"
```

---

## 9. Troubleshooting

### Debug Mode

```bash
# Ativar logs detalhados
export CLAUDE_MONITOR_DEBUG=1

# Testar statusline manualmente
echo '{"session_id":"test","model":{"display_name":"Test"}}' | \
  python3 ~/.claude/monitoring/statusline_display.py

# Ver logs de hooks
tail -f ~/.claude/monitoring/hooks.log
```

### Verificar Estado dos Databases

```bash
# Ver agentes ativos
sqlite3 ~/.claude/monitoring/agents.db \
  "SELECT name, status, last_activity FROM agents WHERE status != 'stopped'"

# Ver hooks recentes
sqlite3 ~/.claude/monitoring/hooks.db \
  "SELECT * FROM hook_executions ORDER BY executed_at DESC LIMIT 10"

# Ver skills em uso
sqlite3 ~/.claude/monitoring/skills.db \
  "SELECT * FROM skill_usage ORDER BY used_at DESC LIMIT 10"
```

---

## 10. Próximos Passos e Melhorias

### Fase 1 (Essencial)
- [x] Agent tracking básico
- [x] Hook monitoring
- [x] Skill detection
- [x] Statusline display
- [ ] Testes e validação

### Fase 2 (Avançado)
- [ ] Dashboard web real-time (WebSocket)
- [ ] Alertas por Telegram/Slack
- [ ] Grafana integration
- [ ] Performance profiling de agentes
- [ ] Cost optimization suggestions

### Fase 3 (Produção)
- [ ] Distributed tracing (OpenTelemetry)
- [ ] Multi-orchestrator support
- [ ] Agent failure auto-recovery
- [ ] ML-based anomaly detection
- [ ] Export para Prometheus/InfluxDB

---

## Referências e Recursos

### Documentação Oficial
- Claude Code Hooks: https://docs.claude.com/en/docs/claude-code/hooks
- Statusline API: https://docs.claude.com/en/docs/claude-code/statusline

### Repositories Base
- ccstatusline: https://github.com/sirmalloc/ccstatusline
- claude-code-statusline: https://github.com/rz1989s/claude-code-statusline
- awesome-claude-code-subagents: https://github.com/VoltAgent/awesome-claude-code-subagents

### Artigos
- Multi-Agent Orchestration: https://dev.to/bredmond1019/multi-agent-orchestration-running-10-claude-instances-in-parallel-part-3-29da
- Anthropic Multi-Agent Research: https://www.anthropic.com/engineering/multi-agent-research-system

---

## Conclusão

Esta arquitetura fornece:

✅ **Real-time monitoring** de agentes, hooks e skills  
✅ **Métricas do orquestrador** (custo, taxa de sucesso, agents ativos)  
✅ **Statusline elegante** com informações condensadas  
✅ **Dashboard web** para análise detalhada (opcional)  
✅ **Performance otimizada** com caching e índices  
✅ **Extensível** - fácil adicionar novas métricas  

**Próximo Passo Recomendado:**  
1. Implementar o tracking básico (agent_tracker.py, hook_tracker.py)
2. Configurar hooks no settings.json
3. Integrar com ccstatusline via Custom Command widget
4. Testar e iterar

Se precisar de código adicional ou ajustes específicos para seu workflow, me avise!
