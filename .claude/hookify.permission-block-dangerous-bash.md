---
name: block-dangerous-bash
enabled: true
event: permission
tool: Bash
action: deny
priority: 100
pattern: \brm\s+(-[rRfF]+\s+)*[\/~]|\brm\s+-[rRfF]*\s+\*|>\s*\/dev\/sd|:()\{\s*:\|:&\s*\};:|shutdown|reboot|halt|init\s+[06]|chmod\s+(-[rR]+\s+)*777\s+\/|curl.*\|\s*(ba)?sh|wget.*\|\s*(ba)?sh|git\s+push\s+.*--force\s+.*ma(in|ster)|git\s+push\s+-f\s+.*ma(in|ster)|DROP\s+(DATABASE|TABLE)|TRUNCATE\s+TABLE|mkfs|dd\s+.*of=\/dev
---

🛑 **COMANDO PERIGOSO BLOQUEADO**

O comando detectado contém padrões potencialmente destrutivos:

**Padrões bloqueados:**
- `rm -rf /` ou `rm -rf ~` - Deleção recursiva de diretórios raiz
- `rm -rf *` - Deleção de todos os arquivos
- `curl | bash` ou `wget | sh` - Execução de scripts remotos
- `git push --force main/master` - Force push em branches protegidas
- `DROP DATABASE/TABLE` - Comandos SQL destrutivos
- `chmod 777 /` - Permissões perigosas
- `shutdown`, `reboot`, `halt` - Comandos de sistema
- `mkfs`, `dd of=/dev` - Operações em disco

**Para executar este comando:**
Aprove manualmente na interface do Claude Code.

> Regra: .claude/hookify.permission-block-dangerous-bash.md
