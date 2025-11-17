# Quick Reference - Claude Code Projetos

**Comandos mais usados no dia a dia (WSL2 e Windows)**

---

## 🚀 Setup Inicial (Uma Vez)

### Clone do Projeto
```bash
# WSL
git clone https://github.com/PedroGiudice/Claude-Code-Projetos.git ~/claude-work/repos/Claude-Code-Projetos
cd ~/claude-work/repos/Claude-Code-Projetos

# Windows (PowerShell)
git clone https://github.com/PedroGiudice/Claude-Code-Projetos.git C:\claude-work\repos\Claude-Code-Projetos
cd C:\claude-work\repos\Claude-Code-Projetos
```

### Criar Virtual Environments
```bash
# WSL - venv global
cd ~/claude-work/repos/Claude-Code-Projetos
python3 -m venv .venv
source .venv/bin/activate
pip install requests pytest ruff mypy black

# Windows (PowerShell) - venv global
cd C:\claude-work\repos\Claude-Code-Projetos
python -m venv .venv
.venv\Scripts\activate
pip install requests pytest ruff mypy black

# WSL - venv de um agente
cd ~/claude-work/repos/Claude-Code-Projetos/agentes/oab-watcher
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Windows - venv de um agente
cd C:\claude-work\repos\Claude-Code-Projetos\agentes\oab-watcher
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

---

## 🐍 Virtual Environments

### Ativar venv Global
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos
source .venv/bin/activate

# Windows (PowerShell)
cd C:\claude-work\repos\Claude-Code-Projetos
.venv\Scripts\activate
```

### Ativar venv de Agente
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos/agentes/<agent-name>
source .venv/bin/activate

# Windows (PowerShell)
cd C:\claude-work\repos\Claude-Code-Projetos\agentes\<agent-name>
.venv\Scripts\activate
```

### Verificar Ativação
```bash
# WSL
which python  # Deve mostrar caminho com .venv/bin/python

# Windows
where python  # Deve mostrar caminho com .venv\Scripts\python.exe
```

### Desativar venv
```bash
# WSL e Windows
deactivate
```

---

## 🔧 Executar Agentes

### oab-watcher
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos/agentes/oab-watcher
source .venv/bin/activate
python main.py

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos\agentes\oab-watcher
.venv\Scripts\activate
python main.py
```

### djen-tracker
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos/agentes/djen-tracker
source .venv/bin/activate
python main.py

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos\agentes\djen-tracker
.venv\Scripts\activate
python main.py
```

### legal-lens
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos/agentes/legal-lens
source .venv/bin/activate
python main.py

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos\agentes\legal-lens
.venv\Scripts\activate
python main.py
```

---

## 🧪 Testes e Qualidade

### Rodar Testes (com venv global)
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos
source .venv/bin/activate
pytest agentes/djen-tracker/tests/ -v --cov=agentes/djen-tracker

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos
.venv\Scripts\activate
pytest agentes\djen-tracker\tests\ -v --cov=agentes\djen-tracker
```

### Linting (ruff)
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos
source .venv/bin/activate
ruff check .

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos
.venv\Scripts\activate
ruff check .
```

### Type Checking (mypy)
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos
source .venv/bin/activate
mypy agentes/oab-watcher/

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos
.venv\Scripts\activate
mypy agentes\oab-watcher\
```

### Formatting (black)
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos
source .venv/bin/activate
black agentes/ --check  # Apenas verificar
black agentes/          # Aplicar formatação

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos
.venv\Scripts\activate
black agentes\ --check
black agentes\
```

---

## 🌿 Git Workflow

### Status e Diff
```bash
git status
git diff
git log --oneline -10
```

### Commit e Push
```bash
git add .
git commit -m "feat: implementa feature X"
git push
```

### Pull e Merge
```bash
git pull
git fetch
git merge origin/main
```

### Branches
```bash
# Criar branch
git checkout -b feature/nova-feature

# Trocar branch
git checkout main

# Listar branches
git branch -a

# Deletar branch local
git branch -d feature/velha-feature
```

---

## 🪝 Hooks (WSL e Windows)

### Testar Hooks Manualmente
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos
node .claude/hooks/invoke-legal-braniac-hybrid.js
node .claude/hooks/session-context-hybrid.js
node .claude/hooks/venv-check.js

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos
node .claude\hooks\invoke-legal-braniac-hybrid.js
node .claude\hooks\session-context-hybrid.js
node .claude\hooks\venv-check.js
```

---

## 📦 npm (MCP Server)

### Instalar Dependências
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos/mcp-servers/djen-mcp-server
npm install

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos\mcp-servers\djen-mcp-server
npm install
```

### Executar MCP Server
```bash
# WSL
cd ~/claude-work/repos/Claude-Code-Projetos/mcp-servers/djen-mcp-server
npm start

# Windows
cd C:\claude-work\repos\Claude-Code-Projetos\mcp-servers\djen-mcp-server
npm start
```

---

## 🐛 Troubleshooting Rápido

### venv não ativa
```bash
# WSL - Recriar venv
cd ~/claude-work/repos/Claude-Code-Projetos/agentes/oab-watcher
rm -rf .venv
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Windows - Recriar venv
cd C:\claude-work\repos\Claude-Code-Projetos\agentes\oab-watcher
Remove-Item -Recurse -Force .venv
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Git push pede senha sempre
```bash
# Configurar credential helper
git config --global credential.helper store
# Próximo push pedirá senha, depois salva
```

### Python não encontrado (WSL)
```bash
sudo apt install python3 python3-pip python3-venv python3-dev
```

### Node.js não encontrado (WSL)
```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Instalar Node.js
nvm install 24
nvm use 24
node --version
```

---

## 📁 Estrutura de Diretórios

```
~/claude-work/repos/Claude-Code-Projetos/  (WSL)
C:\claude-work\repos\Claude-Code-Projetos\  (Windows)
│
├── .venv/                  # Virtual environment GLOBAL (compartilhado)
├── agentes/                # Agentes autônomos
│   ├── oab-watcher/        # Monitor OAB
│   │   └── .venv/          # venv específico
│   ├── djen-tracker/       # Tracker DJEN
│   │   └── .venv/
│   ├── legal-lens/         # Análise legal
│   │   └── .venv/
│   ├── legal-rag/          # RAG legal
│   │   └── .venv/
│   └── legal-articles-finder/
│       └── .venv/
│
├── mcp-servers/            # MCP servers (npm)
│   └── djen-mcp-server/
│       └── node_modules/
│
├── .claude/                # Configurações Claude Code
│   ├── agents/             # Definições de agentes
│   ├── hooks/              # Hooks JavaScript
│   └── skills/             # Skills gerenciadas
│
├── skills/                 # Skills customizadas (34 funcionais)
│
├── CLAUDE.md               # Regras arquiteturais (LEIA PRIMEIRO)
├── WSL_SETUP.md            # Setup completo WSL2
├── QUICK-REFERENCE.md      # Este arquivo
└── README.md               # Visão geral do projeto
```

---

## 🔗 Links Úteis

- **CLAUDE.md** - Regras arquiteturais e lições aprendidas
- **WSL_SETUP.md** - Setup WSL2 detalhado
- **DISASTER_HISTORY.md** - Erros que NUNCA devem se repetir
- **README.md** - Visão geral do projeto

---

**Última atualização:** 2025-11-17
**Mantido por:** PedroGiudice
