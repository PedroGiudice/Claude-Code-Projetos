#───────────────────────────────────────────────────────────────────────────
# PowerShell Profile - Claude Code + WSL Integration
#
# INSTALAÇÃO:
# 1. Copie este arquivo para: $PROFILE (execute "code $PROFILE" no PowerShell)
# 2. Ou execute: Copy-Item .\powershell-profile.ps1 $PROFILE -Force
# 3. Recarregue: . $PROFILE
#
# COMPORTAMENTO:
# - Ao abrir PowerShell, WSL inicia automaticamente
# - Navegação automática para ~/claude-work/repos/Claude-Code-Projetos
# - Comandos rápidos disponíveis (claude, scc, gcp, etc.)
#
# Última atualização: 2025-11-15
# Projeto: Claude-Code-Projetos
#───────────────────────────────────────────────────────────────────────────

#───────────────────────────────────────────────────────────────────────────
# CONFIGURAÇÃO DO AMBIENTE WSL
#───────────────────────────────────────────────────────────────────────────

# Configure Claude Code para executar em WSL (CLI e extensões)
$env:CLAUDE_SHELL = "wsl"

# Variáveis de ambiente passadas do Windows para WSL
# Adicione suas variáveis aqui (API keys, tokens, etc.)
# IMPORTANTE: Não commitar credenciais reais! Use autenticação via navegador.
$env:WSLENV = "CLAUDE_SHELL"

# Exemplo de variáveis (descomente e configure se necessário):
# $env:ANTHROPIC_API_KEY = ""  # Autenticação via navegador (conta Pro Max)
# $env:GITHUB_PAT = ""         # Token GitHub (se necessário)
#
# Se adicionar variáveis, atualize WSLENV:
# $env:WSLENV = "ANTHROPIC_API_KEY:GITHUB_PAT:CLAUDE_SHELL"

#───────────────────────────────────────────────────────────────────────────
# CONFIGURAÇÃO DO USUÁRIO WSL
#───────────────────────────────────────────────────────────────────────────

# AJUSTE ESTE VALOR para seu usuário WSL
# Descubra com: wsl -- whoami
$WSL_USERNAME = "cmr-auto"

# Caminho do Claude Code no WSL
# Descubra com: wsl -- which claude
$CLAUDE_PATH = "/home/$WSL_USERNAME/.npm-global/bin/claude"

# Diretório do projeto no WSL
$PROJECT_DIR = "~/claude-work/repos/Claude-Code-Projetos"

#───────────────────────────────────────────────────────────────────────────
# FUNÇÃO: Interceptar comando 'claude'
#───────────────────────────────────────────────────────────────────────────

function claude {
    <#
    .SYNOPSIS
        Executa Claude Code no WSL com argumentos passados.

    .DESCRIPTION
        Intercepta chamadas ao comando 'claude' e redireciona para WSL.
        Todos os argumentos são preservados e passados corretamente.

    .EXAMPLE
        claude
        Inicia Claude Code interativo no WSL

    .EXAMPLE
        claude --version
        Mostra versão do Claude Code
    #>

    $argString = $args -join ' '
    wsl -- $CLAUDE_PATH $argString
}

#───────────────────────────────────────────────────────────────────────────
# ALIASES E COMANDOS RÁPIDOS
#───────────────────────────────────────────────────────────────────────────

function Start-Claude {
    <#
    .SYNOPSIS
        Inicia Claude Code no diretório do projeto.

    .DESCRIPTION
        Navega automaticamente para o diretório do projeto e inicia Claude Code.
    #>

    Write-Host "🚀 Iniciando Claude Code no projeto..." -ForegroundColor Cyan
    wsl -- bash -c "cd $PROJECT_DIR && $CLAUDE_PATH"
}
Set-Alias -Name scc -Value Start-Claude

function Go-ClaudeProject {
    <#
    .SYNOPSIS
        Abre bash WSL no diretório do projeto.

    .DESCRIPTION
        Inicia sessão bash interativa já posicionada no diretório do projeto.
    #>

    Write-Host "📂 Abrindo projeto em WSL..." -ForegroundColor Cyan
    wsl -- bash -c "cd $PROJECT_DIR && exec bash"
}
Set-Alias -Name gcp -Value Go-ClaudeProject

function Open-WSL {
    <#
    .SYNOPSIS
        Abre WSL no diretório do projeto (login shell).

    .DESCRIPTION
        Inicia bash login shell (-l) no diretório do projeto.
        Carrega perfil completo do bash (.bashrc, .bash_profile).
    #>

    wsl -- bash -c "cd $PROJECT_DIR && exec bash -l"
}
Set-Alias -Name owsl -Value Open-WSL

function Sync-Repo {
    <#
    .SYNOPSIS
        Sincroniza repositório Git (pull).

    .DESCRIPTION
        Executa git pull e mostra status do repositório.
    #>

    Write-Host "🔄 Sincronizando repositório..." -ForegroundColor Cyan
    wsl -- bash -c "cd $PROJECT_DIR && git pull && echo '' && git status"
}
Set-Alias -Name gsync -Value Sync-Repo

function Get-ClaudeStatus {
    <#
    .SYNOPSIS
        Verifica instalação do Claude Code no WSL.

    .DESCRIPTION
        Mostra localização do executável e versão instalada.
    #>

    Write-Host "🔍 Verificando Claude Code no WSL..." -ForegroundColor Cyan
    wsl -- bash -c "which claude && claude --version"
}
Set-Alias -Name cstatus -Value Get-ClaudeStatus

function Get-ClaudeEnv {
    <#
    .SYNOPSIS
        Mostra informações do ambiente Claude Code.

    .DESCRIPTION
        Exibe variáveis de ambiente, versão Node.js, npm, e configurações WSL.
    #>

    Write-Host ""
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Yellow
    Write-Host "║  📊 Claude Code Environment Info           ║" -ForegroundColor Yellow
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "🪟 Windows Environment:" -ForegroundColor Cyan
    Write-Host "  CLAUDE_SHELL: " -NoNewline -ForegroundColor White
    Write-Host "$env:CLAUDE_SHELL" -ForegroundColor Green
    Write-Host "  WSLENV: " -NoNewline -ForegroundColor White
    Write-Host "$env:WSLENV" -ForegroundColor Green
    Write-Host ""
    Write-Host "🐧 WSL Environment:" -ForegroundColor Cyan
    wsl -- bash -c "echo '  Distribution: ' && cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '\"'"
    wsl -- bash -c "echo '  Node.js: ' && node --version"
    wsl -- bash -c "echo '  npm: ' && npm --version"
    wsl -- bash -c "echo '  Claude Code: ' && claude --version 2>/dev/null || echo 'Not installed'"
    Write-Host ""
    Write-Host "📂 Project Directory:" -ForegroundColor Cyan
    Write-Host "  $PROJECT_DIR" -ForegroundColor Green
    Write-Host ""
}
Set-Alias -Name cenv -Value Get-ClaudeEnv

function Get-ProjectStatus {
    <#
    .SYNOPSIS
        Mostra status completo do projeto.

    .DESCRIPTION
        Exibe Git status, contagem de agentes/hooks/skills, e venv status.
    #>

    Write-Host ""
    Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  📊 Project Status - Claude-Code-Projetos  ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""

    wsl -- bash -c "cd $PROJECT_DIR && git status --short --branch"
    Write-Host ""

    Write-Host "📁 Estrutura:" -ForegroundColor Yellow
    wsl -- bash -c "cd $PROJECT_DIR && echo '  Agentes: ' && ls -1 .claude/agents/*.md 2>/dev/null | wc -l"
    wsl -- bash -c "cd $PROJECT_DIR && echo '  Skills: ' && ls -1d skills/*/ 2>/dev/null | wc -l"
    wsl -- bash -c "cd $PROJECT_DIR && echo '  Hooks: ' && ls -1 .claude/hooks/*.js 2>/dev/null | wc -l"
    Write-Host ""
}
Set-Alias -Name pstatus -Value Get-ProjectStatus

#───────────────────────────────────────────────────────────────────────────
# UTILITÁRIOS DE GIT (WORKFLOW RÁPIDO)
#───────────────────────────────────────────────────────────────────────────

function Quick-Commit {
    <#
    .SYNOPSIS
        Commit rápido com mensagem.

    .PARAMETER Message
        Mensagem do commit.

    .EXAMPLE
        qcommit "feat: adiciona nova funcionalidade"
    #>

    param(
        [Parameter(Mandatory=$true)]
        [string]$Message
    )

    Write-Host "📝 Criando commit..." -ForegroundColor Cyan
    wsl -- bash -c "cd $PROJECT_DIR && git add . && git commit -m '$Message' && git status"
}
Set-Alias -Name qcommit -Value Quick-Commit

function Quick-Push {
    <#
    .SYNOPSIS
        Push rápido para origin.

    .DESCRIPTION
        Faz git push para branch atual.
    #>

    Write-Host "🚀 Pushing to remote..." -ForegroundColor Cyan
    wsl -- bash -c "cd $PROJECT_DIR && git push"
}
Set-Alias -Name qpush -Value Quick-Push

function Quick-Sync {
    <#
    .SYNOPSIS
        Sincronização completa: pull + commit + push.

    .PARAMETER Message
        Mensagem do commit (opcional).

    .EXAMPLE
        qsync "update docs"
    #>

    param(
        [string]$Message = "quick update"
    )

    Write-Host "🔄 Sync completo: pull → commit → push" -ForegroundColor Yellow
    wsl -- bash -c "cd $PROJECT_DIR && git pull && git add . && git commit -m '$Message' && git push && git status"
}
Set-Alias -Name qsync -Value Quick-Sync

#───────────────────────────────────────────────────────────────────────────
# MENSAGEM DE BOAS-VINDAS
#───────────────────────────────────────────────────────────────────────────

function Show-ClaudeWelcome {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  🧠 Claude Code + WSL Environment Ready                    ║" -ForegroundColor Cyan
    Write-Host "║  📂 Project: Claude-Code-Projetos                          ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚡ Comandos Rápidos:" -ForegroundColor Yellow
    Write-Host "  claude      " -NoNewline -ForegroundColor Green
    Write-Host "- Executar Claude Code no WSL" -ForegroundColor White
    Write-Host "  scc         " -NoNewline -ForegroundColor Green
    Write-Host "- Iniciar Claude no diretório do projeto" -ForegroundColor White
    Write-Host "  gcp         " -NoNewline -ForegroundColor Green
    Write-Host "- Abrir bash WSL no projeto" -ForegroundColor White
    Write-Host "  owsl        " -NoNewline -ForegroundColor Green
    Write-Host "- Abrir WSL (login shell) no projeto" -ForegroundColor White
    Write-Host ""
    Write-Host "📦 Git:" -ForegroundColor Yellow
    Write-Host "  gsync       " -NoNewline -ForegroundColor Green
    Write-Host "- Git pull + status" -ForegroundColor White
    Write-Host "  qcommit     " -NoNewline -ForegroundColor Green
    Write-Host "- Commit rápido com mensagem" -ForegroundColor White
    Write-Host "  qpush       " -NoNewline -ForegroundColor Green
    Write-Host "- Push para remote" -ForegroundColor White
    Write-Host "  qsync       " -NoNewline -ForegroundColor Green
    Write-Host "- Pull + commit + push (sync completo)" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 Diagnóstico:" -ForegroundColor Yellow
    Write-Host "  cstatus     " -NoNewline -ForegroundColor Green
    Write-Host "- Verificar instalação Claude Code" -ForegroundColor White
    Write-Host "  cenv        " -NoNewline -ForegroundColor Green
    Write-Host "- Mostrar informações do ambiente" -ForegroundColor White
    Write-Host "  pstatus     " -NoNewline -ForegroundColor Green
    Write-Host "- Status completo do projeto" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Dica: " -NoNewline -ForegroundColor Yellow
    Write-Host "Digite 'owsl' para iniciar WSL automaticamente no projeto" -ForegroundColor Gray
    Write-Host ""
}

# Exibir mensagem de boas-vindas
Show-ClaudeWelcome

#───────────────────────────────────────────────────────────────────────────
# AUTO-START: Iniciar WSL automaticamente
#───────────────────────────────────────────────────────────────────────────

# COMPORTAMENTO PADRÃO: Auto-iniciar WSL ao abrir PowerShell
#
# Se você NÃO quiser auto-start, comente a linha abaixo:
Open-WSL

# ALTERNATIVAS:
# - Para iniciar Claude Code automaticamente: scc (Start-Claude)
# - Para apenas navegar ao projeto: Go-ClaudeProject
# - Para desabilitar auto-start: comente a linha Open-WSL

#───────────────────────────────────────────────────────────────────────────
# TROUBLESHOOTING
#───────────────────────────────────────────────────────────────────────────

# PROBLEMA: "claude: comando não encontrado"
# SOLUÇÃO: Verifique se Claude Code está instalado no WSL
#   wsl -- which claude
#   Se não encontrar, instale: wsl -- npm install -g @anthropic-ai/claude-code
#
# PROBLEMA: "wsl: comando não encontrado"
# SOLUÇÃO: WSL não está instalado ou não está no PATH
#   Instale WSL: wsl --install
#   Ou adicione ao PATH: C:\Windows\System32\wsl.exe
#
# PROBLEMA: "Permissão negada"
# SOLUÇÃO: Verifique permissões de execução do profile
#   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
#
# PROBLEMA: Variáveis de ambiente não passam para WSL
# SOLUÇÃO: Certifique-se que WSLENV está configurado corretamente
#   $env:WSLENV = "VARIAVEL1:VARIAVEL2:CLAUDE_SHELL"
#
# PROBLEMA: Auto-start demora muito
# SOLUÇÃO: Desabilite auto-start comentando a linha Open-WSL
#   Use comandos manuais (scc, gcp, owsl) quando necessário

#───────────────────────────────────────────────────────────────────────────
# FIM DO PROFILE
#───────────────────────────────────────────────────────────────────────────
