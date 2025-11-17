# Roteiro de Migração WSL - PC Trabalho

**Objetivo:** Configurar WSL2 no PC do trabalho seguindo setup validado no PC de casa

**Tempo estimado:** 2-3 horas (Sprint 1-2 combinado)

**Status PC Casa:** ✅ Completo (Ubuntu 24.04 LTS, Node.js v24, Claude Code 2.0.42, 5 venvs, 340 npm packages)

---

## Pré-Requisitos

- Windows 10 build 19041+ ou Windows 11
- PowerShell 7+ com privilégios de Administrador
- 8GB RAM mínimo (recomendado: 16GB)
- 20GB espaço livre em disco
- Acesso à internet

---

## Método 1: Instalação Automatizada (Recomendado)

### Passo 1: Executar Script PowerShell

```powershell
# PowerShell como Administrador
cd C:\claude-work\repos\Claude-Code-Projetos

# Executar script de setup (já existe no repo)
.\setup-claude-code-wsl.ps1
```

**O que o script faz:**
1. Instala Ubuntu 24.04 LTS via WSL2
2. Configura Node.js v24 via nvm
3. Instala Claude Code CLI
4. Configura Python 3.12+ com venv
5. Cria estrutura `~/claude-work/repos/Claude-Code-Projetos` no WSL
6. Configura .wslconfig (4GB RAM, 2 CPUs)
7. Adiciona exclusão Windows Defender

**Duração:** ~30-40 minutos

### Passo 2: Clonar Repositório no WSL

```bash
# Dentro do WSL (wsl)
cd ~/claude-work/repos

# Clonar via HTTPS
git clone https://github.com/PedroGiudice/Claude-Code-Projetos.git

# OU via SSH (se configurado)
git clone git@github.com:PedroGiudice/Claude-Code-Projetos.git

cd Claude-Code-Projetos
```

### Passo 3: Configurar Virtual Environments Python

```bash
cd ~/claude-work/repos/Claude-Code-Projetos

# Criar venvs para todos os agentes
for agente in agentes/djen-tracker agentes/legal-articles-finder agentes/legal-lens agentes/legal-rag agentes/oab-watcher; do
    echo "Configurando $agente..."
    cd "$agente"

    # Criar venv
    python3 -m venv .venv

    # Ativar e instalar deps
    source .venv/bin/activate
    pip install --upgrade pip
    [ -f requirements.txt ] && pip install -r requirements.txt
    deactivate

    cd ../..
done
```

**Duração:** ~10-15 minutos

### Passo 4: Instalar npm Dependencies (MCP Server)

```bash
cd ~/claude-work/repos/Claude-Code-Projetos/mcp-servers/djen-mcp-server

npm install

# Verificar
ls node_modules/ | wc -l  # Deve mostrar ~340 packages
```

**Duração:** ~5-10 minutos

### Passo 5: Validar Hooks JavaScript

```bash
cd ~/claude-work/repos/Claude-Code-Projetos

# Testar hooks principais
node .claude/hooks/invoke-legal-braniac-hybrid.js
node .claude/hooks/session-context-hybrid.js

# Output esperado: JSON com {"continue":true,...}
```

### Passo 6: Configurar Git

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu@email.com"

# Configurar credential helper (evita pedir senha sempre)
git config --global credential.helper store

# OU configurar SSH keys (recomendado)
ssh-keygen -t ed25519 -C "seu@email.com"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub  # Adicionar no GitHub
```

### Passo 7: Validação Final

```bash
# Checklist completo
cd ~/claude-work/repos/Claude-Code-Projetos

echo "1. Estrutura:"
pwd  # Deve mostrar ~/claude-work/repos/Claude-Code-Projetos

echo "2. Git:"
git status  # Deve estar limpo

echo "3. Node.js:"
node --version  # v24.x.x
npm --version   # 11.x.x

echo "4. Claude Code:"
claude --version  # 2.0.42 ou superior

echo "5. Python:"
python3 --version  # 3.12.x

echo "6. Venvs:"
ls agentes/*/.venv  # Deve listar 5 venvs

echo "7. npm packages:"
ls mcp-servers/djen-mcp-server/node_modules/ | wc -l  # ~340

echo "8. Hooks:"
node .claude/hooks/invoke-legal-braniac-hybrid.js | jq .continue  # true
```

**✅ Se todos os checks passarem: Setup completo!**

---

## Método 2: Instalação Manual (Passo a Passo)

### Sprint 1: WSL2 + Ferramentas Base

#### 1.1 Instalar WSL2

```powershell
# PowerShell como Administrador
wsl --install -d Ubuntu-24.04

# Reiniciar Windows
Restart-Computer
```

#### 1.2 Configurar Ubuntu

Após reinício, o Ubuntu vai abrir automaticamente:
- Criar username
- Criar senha (forte!)

```bash
# Dentro do WSL
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential curl wget git vim htop tree python3 python3-pip python3-venv python3-dev
```

#### 1.3 Instalar Node.js via nvm

```bash
# Instalar nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Recarregar shell
source ~/.bashrc

# Instalar Node.js LTS
nvm install 24
nvm alias default 24
nvm use 24

# Verificar
node --version  # v24.x.x
npm --version   # 11.x.x
```

#### 1.4 Instalar Claude Code

```bash
# Instalar globalmente
npm install -g @anthropic-ai/claude-code

# Verificar
claude --version

# Autenticar (primeira execução)
claude
# Seguir instruções para API key
```

#### 1.5 Configurar .wslconfig

```powershell
# PowerShell (Windows)
notepad $env:USERPROFILE\.wslconfig
```

Adicionar:
```ini
[wsl2]
memory=4GB
processors=2
swap=1GB
localhostForwarding=true
nestedVirtualization=false
```

Salvar e reiniciar WSL:
```powershell
wsl --shutdown
# Aguardar 10 segundos
wsl
```

#### 1.6 Adicionar Exclusão Windows Defender

```powershell
# PowerShell como Administrador
Add-MpPreference -ExclusionPath "$env:USERPROFILE\AppData\Local\Packages\CanonicalGroupLimited.Ubuntu24.04LTS_79rhkp1fndgsc"

# Verificar
Get-MpPreference | Select-Object -ExpandProperty ExclusionPath
```

### Sprint 2: Projeto e Dependencies

Continue com os Passos 2-7 do Método 1 acima.

---

## Git Workflow Cross-Machine

### PC Trabalho (WSL) → PC Casa (WSL)

**Fim do dia (trabalho):**
```bash
cd ~/claude-work/repos/Claude-Code-Projetos

# Fazer alterações...
git add .
git commit -m "feat: implementa feature X"
git push
```

**Manhã seguinte (casa):**
```bash
cd ~/claude-work/repos/Claude-Code-Projetos

git pull

# Continuar trabalho...
```

### Importante

- ✅ **Sincroniza:** Código (.py), configs (.json), docs (.md), requirements.txt
- ❌ **NÃO sincroniza:** .venv/, node_modules/, logs, outputs

**Regra:** Sempre recriar venvs/node_modules em cada máquina após pull se requirements.txt/package.json mudaram.

---

## Troubleshooting

### Problema: WSL não inicia

```powershell
# PowerShell como Admin
wsl --shutdown
wsl --unregister Ubuntu-24.04
wsl --install -d Ubuntu-24.04
```

### Problema: Hooks não executam

```bash
# Verificar Node.js
node --version

# Verificar permissões
ls -la .claude/hooks/*.js

# Testar manualmente
node .claude/hooks/invoke-legal-braniac-hybrid.js
```

### Problema: venv não ativa

```bash
# Remover venv corrompido
cd agentes/oab-watcher
rm -rf .venv

# Recriar
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

### Problema: Git pede senha sempre

```bash
# Opção 1: Credential helper
git config --global credential.helper store

# Opção 2: SSH keys (melhor)
ssh-keygen -t ed25519 -C "seu@email.com"
cat ~/.ssh/id_ed25519.pub
# Adicionar chave no GitHub: Settings > SSH and GPG keys
```

### Problema: WSL lento

```powershell
# PowerShell
wsl --shutdown
# Aguardar 10 segundos
wsl
```

Verificar .wslconfig tem configurações adequadas (ver 1.5 acima).

---

## Referências

- **WSL_SETUP.md** - Guia completo de setup (validado no PC casa)
- **docs/plano-migracao-wsl2.md** - Plano detalhado 6 sprints
- **CLAUDE.md** - Regras arquiteturais do projeto
- **CHANGELOG.md** - Histórico de mudanças (Sprint 1-2)

---

## Checklist Final

Após completar a migração, validar:

- [ ] Estrutura em `~/claude-work/repos/Claude-Code-Projetos`
- [ ] `git status` limpo
- [ ] Node.js v24+ instalado (`node --version`)
- [ ] Claude Code instalado (`claude --version`)
- [ ] Hooks funcionando (`node .claude/hooks/invoke-legal-braniac-hybrid.js`)
- [ ] 5 venvs Python criados (`ls agentes/*/.venv`)
- [ ] npm packages instalados (340 em djen-mcp-server)
- [ ] Git push/pull funcionando sem erro
- [ ] Mesmo código Windows e WSL (via git)

---

**Última atualização:** 2025-11-17
**Baseado em:** Setup validado PC casa (Sprint 1-2 completo)
**Tempo total:** 2-3 horas (automatizado) | 4-5 horas (manual)
