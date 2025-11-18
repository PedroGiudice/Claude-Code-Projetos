# Quick Start: Sistema de Monitoramento Multi-Agent
## Implementação em 30 Minutos

Este guia oferece código pronto para implementar monitoramento básico de agentes, hooks e skills no Claude Code.

---

## Setup Rápido (Copiar e Colar)

### 1. Estrutura Básica

```bash
# Criar diretórios
mkdir -p ~/.claude/monitoring/{hooks,templates}
cd ~/.claude/monitoring

# Copiar este guia e seguir os passos
```

---

## 2. Agent Tracker Simplificado

Crie: `~/.claude/monitoring/simple_tracker.py`

```python
#!/usr/bin/env python3
"""
Sistema simplificado de tracking para Claude Code
Monitora: agentes, hooks, skills
"""

import json
import sqlite3
import sys
from datetime import datetime
from pathlib import Path
import re

DB_PATH = Path.home() / ".claude" / "monitoring" / "tracking.db"

class SimpleTracker:
    def __init__(self):
        DB_PATH.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(DB_PATH))
        self.init_db()
    
    def init_db(self):
        # Tabela unificada
        self.conn.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                type TEXT CHECK(type IN ('agent', 'hook', 'skill')),
                name TEXT NOT NULL,
                status TEXT,
                session_id TEXT,
                metadata JSON
            )
        """)
        
        self.conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_recent 
            ON events(type, timestamp DESC)
        """)
        
        self.conn.commit()
    
    def track_agent(self, name, status, session_id, metadata=None):
        self.conn.execute("""
            INSERT INTO events (type, name, status, session_id, metadata)
            VALUES ('agent', ?, ?, ?, ?)
        """, (name, status, session_id, json.dumps(metadata)))
        self.conn.commit()
    
    def track_hook(self, name, session_id):
        self.conn.execute("""
            INSERT INTO events (type, name, session_id)
            VALUES ('hook', ?, ?)
        """, (name, session_id))
        self.conn.commit()
    
    def track_skill(self, name, session_id):
        self.conn.execute("""
            INSERT INTO events (type, name, session_id)
            VALUES ('skill', ?, ?)
        """, (name, session_id))
        self.conn.commit()
    
    def get_recent(self, event_type, minutes=5):
        cursor = self.conn.execute("""
            SELECT name, status, COUNT(*) as count, MAX(timestamp) as last_seen
            FROM events
            WHERE type = ?
            AND timestamp > datetime('now', '-' || ? || ' minutes')
            GROUP BY name, status
            ORDER BY last_seen DESC
        """, (event_type, minutes))
        
        return [dict(zip(['name', 'status', 'count', 'last_seen'], row)) 
                for row in cursor.fetchall()]
    
    def cleanup_old(self, days=7):
        self.conn.execute("""
            DELETE FROM events 
            WHERE timestamp < datetime('now', '-' || ? || ' days')
        """, (days,))
        self.conn.commit()
    
    def close(self):
        self.conn.close()


# === CLI Commands ===

def cmd_agent(args):
    tracker = SimpleTracker()
    name, status, session = args[0], args[1], args[2]
    tracker.track_agent(name, status, session)
    tracker.close()
    print(f"✓ Agent tracked: {name} ({status})")

def cmd_hook(args):
    tracker = SimpleTracker()
    name, session = args[0], args[1]
    tracker.track_hook(name, session)
    tracker.close()
    print(f"✓ Hook tracked: {name}")

def cmd_skill(args):
    tracker = SimpleTracker()
    name, session = args[0], args[1]
    tracker.track_skill(name, session)
    tracker.close()
    print(f"✓ Skill tracked: {name}")

def cmd_status(args):
    tracker = SimpleTracker()
    
    print("📊 Status (last 5 minutes)\n")
    
    # Agentes
    agents = tracker.get_recent('agent', 5)
    print(f"🤖 Agents ({len(agents)})")
    for a in agents:
        print(f"  • {a['name']:<20} {a['status']:<10} ({a['count']}x)")
    
    # Hooks
    hooks = tracker.get_recent('hook', 5)
    print(f"\n⚡ Hooks ({len(hooks)})")
    for h in hooks:
        print(f"  • {h['name']:<20} ({h['count']}x)")
    
    # Skills
    skills = tracker.get_recent('skill', 5)
    print(f"\n🛠️  Skills ({len(skills)})")
    for s in skills:
        print(f"  • {s['name']:<20} ({s['count']}x)")
    
    tracker.close()

def cmd_statusline(args):
    """Gera output para statusline"""
    tracker = SimpleTracker()
    
    agents = tracker.get_recent('agent', 2)
    active_agents = [a for a in agents if a['status'] == 'active']
    
    hooks = tracker.get_recent('hook', 1)
    skills = tracker.get_recent('skill', 2)
    
    # Formato compacto
    agent_str = f"{len(active_agents)}/{len(agents)}" if agents else "0"
    hook_str = f"{len(hooks)}" if hooks else "0"
    skill_names = [s['name'] for s in skills[:3]]
    skill_str = ", ".join(skill_names) if skill_names else "-"
    
    print(f"🤖 {agent_str} │ ⚡ {hook_str} │ 🛠️ {skill_str}")
    
    tracker.close()

def cmd_cleanup(args):
    tracker = SimpleTracker()
    days = int(args[0]) if args else 7
    tracker.cleanup_old(days)
    tracker.close()
    print(f"✓ Cleaned up events older than {days} days")


# === Main ===

COMMANDS = {
    'agent': cmd_agent,
    'hook': cmd_hook,
    'skill': cmd_skill,
    'status': cmd_status,
    'statusline': cmd_statusline,
    'cleanup': cmd_cleanup,
}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("""
Simple Tracker - Monitor Claude Code multi-agent systems

Usage:
  simple_tracker.py agent <name> <status> <session_id>
  simple_tracker.py hook <name> <session_id>
  simple_tracker.py skill <name> <session_id>
  simple_tracker.py status
  simple_tracker.py statusline
  simple_tracker.py cleanup [days]

Examples:
  simple_tracker.py agent backend-dev active abc123
  simple_tracker.py hook PostResponse abc123
  simple_tracker.py skill docx abc123
  simple_tracker.py status
""")
        sys.exit(1)
    
    cmd = sys.argv[1]
    if cmd not in COMMANDS:
        print(f"Unknown command: {cmd}")
        sys.exit(1)
    
    try:
        COMMANDS[cmd](sys.argv[2:])
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
```

Tornar executável:
```bash
chmod +x ~/.claude/monitoring/simple_tracker.py
```

Testar:
```bash
# Testar tracking
~/.claude/monitoring/simple_tracker.py agent test-agent active session123
~/.claude/monitoring/simple_tracker.py hook PrePrompt session123
~/.claude/monitoring/simple_tracker.py skill git session123

# Ver status
~/.claude/monitoring/simple_tracker.py status

# Testar statusline
~/.claude/monitoring/simple_tracker.py statusline
```

---

## 3. Hooks para Detecção Automática

### Hook 1: Detectar Agentes

Crie: `~/.claude/monitoring/hooks/detect_agents.sh`

```bash
#!/bin/bash

# Recebe JSON do Claude Code
INPUT=$(cat)

SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')

# Se não há transcript, skip
[ -z "$TRANSCRIPT" ] || [ "$TRANSCRIPT" = "null" ] && echo "$INPUT" && exit 0

# Verifica se transcript existe
[ ! -f "$TRANSCRIPT" ] && echo "$INPUT" && exit 0

# Extrai últimas mensagens do assistant
RECENT=$(tail -n 10 "$TRANSCRIPT" 2>/dev/null | jq -r 'select(.role=="assistant") | .content' 2>/dev/null || echo "")

# Detecta patterns de spawn de agentes
# Pattern 1: @agent-name
AGENTS=$(echo "$RECENT" | grep -oP '@[a-z][a-z0-9-]*' | tr -d '@' | sort -u)

# Pattern 2: "creating subagent"
if echo "$RECENT" | grep -qiE '(creating|spawning|delegating to).*(subagent|agent)'; then
    # Registra evento genérico
    ~/.claude/monitoring/simple_tracker.py agent "orchestrator-spawn" spawning "$SESSION_ID" 2>/dev/null || true
fi

# Registra cada agente detectado
for AGENT in $AGENTS; do
    [ -n "$AGENT" ] && \
        ~/.claude/monitoring/simple_tracker.py agent "$AGENT" active "$SESSION_ID" 2>/dev/null || true
done

# Retorna input inalterado
echo "$INPUT"
```

### Hook 2: Log de Hooks

Crie: `~/.claude/monitoring/hooks/log_hook.sh`

```bash
#!/bin/bash

# Primeiro argumento é o nome do hook
HOOK_NAME=${1:-"unknown"}

# Recebe JSON
INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')

# Registra execução
~/.claude/monitoring/simple_tracker.py hook "$HOOK_NAME" "$SESSION_ID" 2>/dev/null || true

# Retorna input
echo "$INPUT"
```

### Hook 3: Detectar Skills

Crie: `~/.claude/monitoring/hooks/detect_skills.sh`

```bash
#!/bin/bash

INPUT=$(cat)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "unknown"')
TRANSCRIPT=$(echo "$INPUT" | jq -r '.transcript_path // ""')

[ -z "$TRANSCRIPT" ] || [ "$TRANSCRIPT" = "null" ] && echo "$INPUT" && exit 0
[ ! -f "$TRANSCRIPT" ] && echo "$INPUT" && exit 0

# Última mensagem
RECENT=$(tail -n 3 "$TRANSCRIPT" 2>/dev/null | jq -r 'select(.role=="assistant") | .content' 2>/dev/null || echo "")

# Detecta skills por palavras-chave
declare -A SKILLS=(
    ["docx"]="(\.docx|word document|creating.*document)"
    ["pdf"]="(\.pdf|pdf document)"
    ["pptx"]="(\.pptx|powerpoint|presentation)"
    ["xlsx"]="(\.xlsx|spreadsheet|excel)"
    ["git"]="(git (add|commit|push|pull|branch)|repository)"
    ["bash"]="(bash_tool|executing command|running.*command)"
    ["web_search"]="(searching|web_search|brave)"
    ["analysis"]="(analyz|review|assess)"
)

for SKILL in "${!SKILLS[@]}"; do
    PATTERN="${SKILLS[$SKILL]}"
    if echo "$RECENT" | grep -qiE "$PATTERN"; then
        ~/.claude/monitoring/simple_tracker.py skill "$SKILL" "$SESSION_ID" 2>/dev/null || true
    fi
done

echo "$INPUT"
```

Tornar executáveis:
```bash
chmod +x ~/.claude/monitoring/hooks/*.sh
```

---

## 4. Statusline Display

### Opção A: Script Standalone

Crie: `~/.claude/monitoring/statusline.sh`

```bash
#!/bin/bash

# Recebe JSON do Claude Code
INPUT=$(cat)

# Chama tracker para gerar display
OUTPUT=$(~/.claude/monitoring/simple_tracker.py statusline 2>/dev/null || echo "⚠️ Monitor off")

# Extrai informações do Claude
MODEL=$(echo "$INPUT" | jq -r '.model.display_name // "Claude"')
DIR=$(echo "$INPUT" | jq -r '.workspace.current_dir // ""' | sed 's|.*/||')

# Monta statusline
echo "🎭 $MODEL │ 📁 $DIR │ $OUTPUT"
```

Tornar executável:
```bash
chmod +x ~/.claude/monitoring/statusline.sh
```

### Opção B: Python (mais rico)

Crie: `~/.claude/monitoring/statusline.py`

```python
#!/usr/bin/env python3

import sys
import json
from pathlib import Path

# Importa tracker
sys.path.insert(0, str(Path(__file__).parent))
from simple_tracker import SimpleTracker

def colorize(text, color):
    colors = {
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'magenta': '\033[95m',
        'cyan': '\033[96m',
        'reset': '\033[0m'
    }
    return f"{colors.get(color, '')}{text}{colors['reset']}"

def main():
    try:
        data = json.load(sys.stdin)
    except:
        print("⚠️ Invalid input")
        return
    
    tracker = SimpleTracker()
    
    # Dados do Claude
    model = data.get('model', {}).get('display_name', 'Claude')
    directory = Path(data.get('workspace', {}).get('current_dir', '~')).name
    
    # Métricas
    agents = tracker.get_recent('agent', 2)
    active_agents = [a for a in agents if a['status'] == 'active']
    hooks = tracker.get_recent('hook', 1)
    skills = tracker.get_recent('skill', 2)
    
    # Componentes
    orch_icon = "🎭"
    orch_status = "🟢" if active_agents else "🟡"
    
    agent_str = f"{len(active_agents)}/{len(agents)}" if agents else "0"
    hook_str = str(len(hooks))
    skill_list = [s['name'] for s in skills[:3]]
    skill_str = ", ".join(skill_list) if skill_list else "-"
    
    # Output
    parts = [
        f"{orch_icon} {colorize(model, 'cyan')} {orch_status}",
        f"📁 {colorize(directory, 'blue')}",
        f"🤖 {colorize(agent_str, 'green')}",
        f"⚡ {colorize(hook_str, 'yellow')}",
        f"🛠️ {colorize(skill_str, 'magenta')}"
    ]
    
    print(" │ ".join(parts))
    
    tracker.close()

if __name__ == "__main__":
    main()
```

Tornar executável:
```bash
chmod +x ~/.claude/monitoring/statusline.py
```

---

## 5. Configuração do Claude Code

### settings.json Completo

Crie/edite: `~/.claude/settings.json`

```json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/monitoring/statusline.sh",
    "padding": 0
  },
  "hooks": {
    "PrePrompt": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/monitoring/hooks/detect_agents.sh",
            "description": "Detect agent spawning"
          },
          {
            "type": "command",
            "command": "~/.claude/monitoring/hooks/log_hook.sh PrePrompt",
            "description": "Log PrePrompt execution"
          }
        ]
      }
    ],
    "PostResponse": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/monitoring/hooks/log_hook.sh PostResponse",
            "description": "Log PostResponse execution"
          },
          {
            "type": "command",
            "command": "~/.claude/monitoring/hooks/detect_skills.sh",
            "description": "Detect skill usage"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/monitoring/simple_tracker.py cleanup 7",
            "description": "Cleanup old tracking data"
          }
        ]
      }
    ]
  }
}
```

---

## 6. Script de Instalação Automática

Crie: `~/.claude/install_monitor.sh`

```bash
#!/bin/bash

set -e

echo "🎭 Installing Claude Code Multi-Agent Monitor"
echo "=============================================="
echo ""

# Criar estrutura
echo "📁 Creating directory structure..."
mkdir -p ~/.claude/monitoring/{hooks,templates}

# Verificar Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not found"
    exit 1
fi
echo "✓ Python 3 found"

# Criar simple_tracker.py
echo "📦 Creating tracker..."
cat > ~/.claude/monitoring/simple_tracker.py << 'TRACKER_EOF'
[COPIE O CÓDIGO DO simple_tracker.py AQUI]
TRACKER_EOF

# Criar hooks
echo "🪝 Creating hooks..."

cat > ~/.claude/monitoring/hooks/detect_agents.sh << 'AGENT_EOF'
[COPIE O CÓDIGO DO detect_agents.sh AQUI]
AGENT_EOF

cat > ~/.claude/monitoring/hooks/log_hook.sh << 'LOG_EOF'
[COPIE O CÓDIGO DO log_hook.sh AQUI]
LOG_EOF

cat > ~/.claude/monitoring/hooks/detect_skills.sh << 'SKILL_EOF'
[COPIE O CÓDIGO DO detect_skills.sh AQUI]
SKILL_EOF

# Criar statusline
echo "📊 Creating statusline..."
cat > ~/.claude/monitoring/statusline.sh << 'STATUS_EOF'
[COPIE O CÓDIGO DO statusline.sh AQUI]
STATUS_EOF

# Permissões
echo "🔐 Setting permissions..."
chmod +x ~/.claude/monitoring/simple_tracker.py
chmod +x ~/.claude/monitoring/hooks/*.sh
chmod +x ~/.claude/monitoring/statusline.sh

# Inicializar database
echo "🗄️ Initializing database..."
~/.claude/monitoring/simple_tracker.py status > /dev/null 2>&1 || true

# Verificar jq
if ! command -v jq &> /dev/null; then
    echo ""
    echo "⚠️  WARNING: jq not found (required for hooks)"
    echo "Install with:"
    echo "  • macOS: brew install jq"
    echo "  • Ubuntu/Debian: sudo apt-get install jq"
    echo "  • RHEL/CentOS: sudo yum install jq"
    echo ""
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Ensure jq is installed (see above if warning shown)"
echo "2. Update ~/.claude/settings.json with hooks and statusline config"
echo "3. Restart Claude Code"
echo ""
echo "Test with:"
echo "  ~/.claude/monitoring/simple_tracker.py status"
echo ""
echo "View real-time status:"
echo "  watch -n 2 ~/.claude/monitoring/simple_tracker.py status"
```

Executar:
```bash
chmod +x ~/.claude/install_monitor.sh
~/.claude/install_monitor.sh
```

---

## 7. Uso Prático

### Comandos Úteis

```bash
# Ver status em tempo real
watch -n 2 ~/.claude/monitoring/simple_tracker.py status

# Testar statusline
echo '{"session_id":"test","model":{"display_name":"Test"},"workspace":{"current_dir":"/test"}}' | \
  ~/.claude/monitoring/statusline.sh

# Ver database diretamente
sqlite3 ~/.claude/monitoring/tracking.db "SELECT * FROM events ORDER BY timestamp DESC LIMIT 20"

# Limpar dados antigos
~/.claude/monitoring/simple_tracker.py cleanup 3

# Debug de hook
bash -x ~/.claude/monitoring/hooks/detect_agents.sh < /tmp/test_input.json
```

### Registrar Agente Manualmente

```bash
# Durante desenvolvimento de orquestrador
~/.claude/monitoring/simple_tracker.py agent my-orchestrator active $(uuidgen)
~/.claude/monitoring/simple_tracker.py agent backend-impl active parent-session-id
~/.claude/monitoring/simple_tracker.py agent frontend-impl active parent-session-id
~/.claude/monitoring/simple_tracker.py agent code-reviewer active parent-session-id
```

### Monitor em Tempo Real

```bash
# Terminal 1: Claude Code rodando
claude

# Terminal 2: Monitor
watch -c -n 1 '~/.claude/monitoring/simple_tracker.py status'
```

---

## 8. Integração com ccstatusline (Opcional)

Se preferir usar ccstatusline como base:

```bash
# Instalar ccstatusline
npm install -g ccstatusline

# Configurar
npx ccstatusline

# No TUI:
# 1. Adicionar widget "Custom Command"
# 2. Command: ~/.claude/monitoring/simple_tracker.py statusline
# 3. Timeout: 500ms
# 4. Preserve colors: Yes
# 5. Posição: No final da linha
```

Ou configure diretamente no `~/.claude/ccstatusline-config.json`:

```json
{
  "lines": [
    {
      "items": [
        {
          "type": "model",
          "options": {}
        },
        {
          "type": "git_branch",
          "options": {}
        },
        {
          "type": "custom_command",
          "options": {
            "command": "~/.claude/monitoring/simple_tracker.py statusline",
            "timeout": 500,
            "preserveColors": true
          }
        }
      ]
    }
  ]
}
```

---

## 9. Troubleshooting Rápido

### Problema: Statusline não aparece

```bash
# 1. Testar manualmente
echo '{"session_id":"test","model":{"display_name":"Test"}}' | ~/.claude/monitoring/statusline.sh

# 2. Verificar permissões
ls -la ~/.claude/monitoring/statusline.sh

# 3. Ver logs do Claude Code
# (geralmente em ~/.claude/logs/)
```

### Problema: Hooks não executam

```bash
# 1. Verificar settings.json
cat ~/.claude/settings.json | jq '.hooks'

# 2. Testar hook manualmente
echo '{"session_id":"test"}' | ~/.claude/monitoring/hooks/log_hook.sh TestHook

# 3. Verificar se jq está instalado
which jq
```

### Problema: Database não cria

```bash
# 1. Verificar diretório
ls -la ~/.claude/monitoring/

# 2. Tentar criar manualmente
python3 ~/.claude/monitoring/simple_tracker.py status

# 3. Verificar SQLite
python3 -c "import sqlite3; print('SQLite OK')"
```

---

## 10. Exemplo de Output Esperado

### Statusline
```
🎭 Sonnet 4 🟢 │ 📁 my-project │ 🤖 3/5 │ ⚡ 8 │ 🛠️ git, docx, bash
```

### Status Command
```bash
$ ~/.claude/monitoring/simple_tracker.py status

📊 Status (last 5 minutes)

🤖 Agents (4)
  • orchestrator          active     (15x)
  • backend-impl          active     (8x)
  • frontend-impl         idle       (3x)
  • code-reviewer         active     (5x)

⚡ Hooks (6)
  • PrePrompt            (12x)
  • PostResponse         (11x)
  • PostToolUse          (7x)

🛠️  Skills (5)
  • git                  (9x)
  • bash                 (6x)
  • docx                 (3x)
  • analysis             (4x)
```

---

## 11. Próximos Passos

Depois de funcionando básico, considere:

1. **Dashboard Web**: Adicionar Flask/FastAPI para visualização web
2. **Alertas**: Notificações quando agente trava (>5min sem atividade)
3. **Métricas**: Adicionar custo, tokens, tempo de resposta
4. **Grafana**: Exportar métricas para visualização profissional
5. **Distributed Tracing**: OpenTelemetry para rastreamento completo

---

## Checklist de Validação

- [ ] `simple_tracker.py` executa sem erros
- [ ] Database criado em `~/.claude/monitoring/tracking.db`
- [ ] Hooks têm permissão de execução (`chmod +x`)
- [ ] `jq` instalado e funcionando
- [ ] `statusline.sh` retorna output válido
- [ ] `settings.json` configurado corretamente
- [ ] Claude Code reiniciado
- [ ] Statusline aparece ao iniciar Claude
- [ ] `simple_tracker.py status` mostra dados
- [ ] Hooks registram eventos no database

---

## Contatos e Suporte

**Issues comuns:**
- Permissões: sempre `chmod +x` nos scripts
- jq não instalado: hooks não funcionarão
- Python não encontrado: verifique `which python3`
- Database locked: feche outras conexões SQLite

**Para debug avançado:**
```bash
# Ativar debug
export DEBUG=1

# Ver tudo que acontece
set -x
~/.claude/monitoring/statusline.sh < /tmp/test.json
```

Boa sorte com seu sistema de orquestração multi-agent! 🎭
