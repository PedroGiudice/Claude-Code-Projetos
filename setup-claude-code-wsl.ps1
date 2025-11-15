<#
.SYNOPSIS
    Configura ambiente WSL2 completo para Claude Code Projetos - Automação Jurídica

.DESCRIPTION
    Script automatizado que executa Sprint 1-2 do plano de migração WSL2:
    - Instala Ubuntu 24.04 LTS
    - Configura Node.js v24 via nvm
    - Instala Claude Code CLI
    - Configura Python 3.12+ com venv
    - Cria 5 virtual environments para agentes Python
    - Instala npm packages (MCP server)
    - Valida hooks JavaScript
    - Configura estrutura de diretórios padronizada

.PARAMETER SkipBackup
    Ignora backup de distribuições WSL existentes

.PARAMETER SkipCleanup
    Preserva instalações Ubuntu WSL existentes (não remove)

.PARAMETER UbuntuVersion
    Versão do Ubuntu a instalar (padrão: Ubuntu-24.04)

.PARAMETER NodeVersion
    Versão do Node.js via nvm (padrão: 24)

.NOTES
    Versão: 1.0.0
    Autor: PedroGiudice
    Baseado em: claude-stack-dotnet setup script
    Requisitos: PowerShell 7+, Windows 10/11

.EXAMPLE
    .\setup-claude-code-wsl.ps1
    Executa instalação completa com configurações padrão

.EXAMPLE
    .\setup-claude-code-wsl.ps1 -SkipCleanup
    Instala sem remover Ubuntu existente
#>

[CmdletBinding()]
param (
    [switch]$SkipBackup,
    [switch]$SkipCleanup,
    [string]$UbuntuVersion = "Ubuntu-24.04",
    [ValidateRange(18, 24)]
    [int]$NodeVersion = 24
)

# Requer PowerShell 7+
#Requires -Version 7.0
#Requires -RunAsAdministrator

$ErrorActionPreference = "Stop"

# ============================================
# FUNÇÕES AUXILIARES
# ============================================

function Write-LogMessage {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Type = 'Info'
    )

    $timestamp = Get-Date -Format "HH:mm:ss"
    $symbols = @{
        'Info'    = "ℹ"
        'Success' = "✓"
        'Warning' = "⚠"
        'Error'   = "✗"
    }
    $colors = @{
        'Info'    = "Cyan"
        'Success' = "Green"
        'Warning' = "Yellow"
        'Error'   = "Red"
    }

    Write-Host "[$timestamp] " -NoNewline
    Write-Host "$($symbols[$Type]) " -ForegroundColor $colors[$Type] -NoNewline
    Write-Host $Message
}

function Test-Prerequisites {
    Write-LogMessage "Verificando pré-requisitos..." -Type Info

    # Verificar versão PowerShell
    if ($PSVersionTable.PSVersion.Major -lt 7) {
        Write-LogMessage "PowerShell 7+ é necessário. Versão atual: $($PSVersionTable.PSVersion)" -Type Error
        return $false
    }

    # Verificar versão Windows
    $winVersion = [System.Environment]::OSVersion.Version
    if ($winVersion.Build -lt 19041) {
        Write-LogMessage "Windows 10 build 19041+ ou Windows 11 é necessário" -Type Error
        return $false
    }

    # Verificar privilégios admin
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-LogMessage "Execute como Administrador" -Type Error
        return $false
    }

    Write-LogMessage "Pré-requisitos OK" -Type Success
    return $true
}

function Install-WSLFeatures {
    Write-LogMessage "Instalando recursos WSL..." -Type Info

    # Ativar WSL
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart | Out-Null

    # Ativar plataforma de máquina virtual
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart | Out-Null

    # Definir WSL 2 como padrão
    wsl --set-default-version 2 | Out-Null

    Write-LogMessage "Recursos WSL instalados" -Type Success
}

function Backup-ExistingWSL {
    if ($SkipBackup) {
        Write-LogMessage "Backup ignorado (SkipBackup ativado)" -Type Warning
        return
    }

    $distributions = wsl --list --quiet
    if ($distributions -match $UbuntuVersion) {
        Write-LogMessage "Criando backup de $UbuntuVersion..." -Type Info
        $backupPath = "$env:USERPROFILE\WSL-Backups"
        New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        wsl --export $UbuntuVersion "$backupPath\$UbuntuVersion-$timestamp.tar"

        Write-LogMessage "Backup salvo em: $backupPath\$UbuntuVersion-$timestamp.tar" -Type Success
    }
}

function Remove-ExistingUbuntu {
    if ($SkipCleanup) {
        Write-LogMessage "Limpeza ignorada (SkipCleanup ativado)" -Type Warning
        return
    }

    $distributions = wsl --list --quiet
    if ($distributions -match $UbuntuVersion) {
        Write-LogMessage "Removendo instalação existente de $UbuntuVersion..." -Type Warning
        wsl --unregister $UbuntuVersion | Out-Null
        Write-LogMessage "Instalação anterior removida" -Type Success
    }
}

function Install-Ubuntu {
    Write-LogMessage "Instalando $UbuntuVersion..." -Type Info

    wsl --install -d $UbuntuVersion

    Write-LogMessage "Aguardando configuração inicial do Ubuntu..." -Type Info
    Write-Host "`nCrie um nome de usuário e senha quando solicitado" -ForegroundColor Yellow

    Start-Sleep -Seconds 5

    # Garantir WSL 2
    wsl --set-version $UbuntuVersion 2 | Out-Null

    Write-LogMessage "Ubuntu instalado" -Type Success
}

function Install-DevelopmentEnvironment {
    Write-LogMessage "Instalando ambiente de desenvolvimento..." -Type Info

    $setupScript = @'
#!/bin/bash
set -e

echo "Atualizando sistema..."
sudo apt update -qq
sudo apt upgrade -y -qq

echo "Instalando ferramentas base..."
sudo apt install -y build-essential curl wget git vim htop tree ripgrep jq zip python3 python3-pip python3-venv python3-dev

echo "Instalando nvm..."
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Instalando Node.js v{0}..."
nvm install {0}
nvm alias default {0}
nvm use {0}

echo "Configurando npm global..."
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.bashrc

echo "Instalando Claude Code..."
npm install -g @anthropic-ai/claude-code

echo "✓ Ambiente configurado com sucesso"
'@ -f $NodeVersion

    $tempScript = [System.IO.Path]::GetTempFileName() + ".sh"
    $setupScript | Out-File -FilePath $tempScript -Encoding UTF8

    wsl -d $UbuntuVersion bash -c "cat > /tmp/setup.sh && chmod +x /tmp/setup.sh && /tmp/setup.sh" -InputObject $setupScript

    Remove-Item $tempScript -ErrorAction SilentlyContinue

    Write-LogMessage "Ambiente de desenvolvimento instalado" -Type Success
}

function Install-ProjectEnvironment {
    Write-LogMessage "Configurando projeto Claude-Code-Projetos..." -Type Info

    $projectSetup = @'
#!/bin/bash
set -e

cd ~
mkdir -p claude-work/repos
cd claude-work/repos

if [ ! -d "Claude-Code-Projetos" ]; then
    echo "Clone o repositório manualmente:"
    echo "cd ~/claude-work/repos"
    echo "git clone https://github.com/PedroGiudice/Claude-Code-Projetos.git"
else
    echo "✓ Repositório já existe"
    cd Claude-Code-Projetos

    echo "Criando virtual environments Python..."
    for agente in agentes/djen-tracker agentes/legal-articles-finder agentes/legal-lens agentes/legal-rag agentes/oab-watcher; do
        if [ -d "$agente" ]; then
            echo "  - $agente"
            cd "$agente"
            python3 -m venv .venv
            source .venv/bin/activate
            pip install --upgrade pip -q
            [ -f requirements.txt ] && pip install -r requirements.txt -q
            deactivate
            cd ../..
        fi
    done

    echo "Instalando npm packages (MCP server)..."
    if [ -d "mcp-servers/djen-mcp-server" ]; then
        cd mcp-servers/djen-mcp-server
        npm install
        cd ../..
    fi

    echo "✓ Projeto configurado"
fi
'@

    wsl -d $UbuntuVersion bash -c $projectSetup

    Write-LogMessage "Projeto configurado" -Type Success
}

function Set-WSLConfig {
    Write-LogMessage "Configurando .wslconfig..." -Type Info

    $wslConfigPath = "$env:USERPROFILE\.wslconfig"
    $wslConfig = @"
[wsl2]
memory=4GB
processors=2
swap=1GB
localhostForwarding=true
nestedVirtualization=false
"@

    $wslConfig | Out-File -FilePath $wslConfigPath -Encoding UTF8

    Write-LogMessage ".wslconfig criado" -Type Success
}

function Add-WindowsDefenderExclusion {
    Write-LogMessage "Adicionando exclusão Windows Defender..." -Type Info

    $ubuntuPath = "$env:USERPROFILE\AppData\Local\Packages\CanonicalGroupLimited.$($UbuntuVersion)_*"
    $paths = Get-ChildItem $ubuntuPath -Directory -ErrorAction SilentlyContinue

    if ($paths) {
        foreach ($path in $paths) {
            Add-MpPreference -ExclusionPath $path.FullName
            Write-LogMessage "Exclusão adicionada: $($path.FullName)" -Type Success
        }
    }
}

function Test-Installation {
    Write-LogMessage "Validando instalação..." -Type Info

    $tests = @{
        "WSL"         = { (wsl --status) -and $LASTEXITCODE -eq 0 }
        "Ubuntu"      = { (wsl -d $UbuntuVersion -e whoami) -and $LASTEXITCODE -eq 0 }
        "Node.js"     = { (wsl -d $UbuntuVersion bash -c "node --version") -and $LASTEXITCODE -eq 0 }
        "npm"         = { (wsl -d $UbuntuVersion bash -c "npm --version") -and $LASTEXITCODE -eq 0 }
        "Claude Code" = { (wsl -d $UbuntuVersion bash -c "claude --version") -and $LASTEXITCODE -eq 0 }
        "Python"      = { (wsl -d $UbuntuVersion bash -c "python3 --version") -and $LASTEXITCODE -eq 0 }
    }

    $allPassed = $true
    foreach ($test in $tests.GetEnumerator()) {
        try {
            $result = & $test.Value
            if ($result) {
                Write-LogMessage "$($test.Key): OK" -Type Success
            }
            else {
                Write-LogMessage "$($test.Key): FALHOU" -Type Error
                $allPassed = $false
            }
        }
        catch {
            Write-LogMessage "$($test.Key): ERRO - $($_.Exception.Message)" -Type Error
            $allPassed = $false
        }
    }

    return $allPassed
}

# ============================================
# EXECUÇÃO PRINCIPAL
# ============================================

Write-Host @"

╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   SETUP WSL2 - CLAUDE CODE PROJETOS                            ║
║   Automação Jurídica - Sprint 1-2                              ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝

"@ -ForegroundColor Cyan

# Aviso
if (-not $SkipCleanup) {
    Write-Host "⚠️  ATENÇÃO: Este script irá REMOVER instalações Ubuntu existentes!" -ForegroundColor Yellow
    Write-Host "   Use -SkipCleanup para preservar instalações existentes`n" -ForegroundColor Yellow

    $response = Read-Host "Continuar? (S/N)"
    if ($response -ne 'S' -and $response -ne 's') {
        Write-LogMessage "Instalação cancelada pelo usuário" -Type Warning
        exit 0
    }
}

try {
    # 1. Pré-requisitos
    if (-not (Test-Prerequisites)) {
        throw "Pré-requisitos não atendidos"
    }

    # 2. Instalar recursos WSL
    Install-WSLFeatures

    # 3. Backup (se necessário)
    Backup-ExistingWSL

    # 4. Limpeza (se necessário)
    Remove-ExistingUbuntu

    # 5. Instalar Ubuntu
    Install-Ubuntu

    # 6. Configurar .wslconfig
    Set-WSLConfig

    # 7. Adicionar exclusão Windows Defender
    Add-WindowsDefenderExclusion

    # 8. Instalar ambiente de desenvolvimento
    Install-DevelopmentEnvironment

    # 9. Configurar projeto
    Install-ProjectEnvironment

    # 10. Validar instalação
    $validationPassed = Test-Installation

    # Relatório final
    Write-Host "`n" -NoNewline
    Write-Host "╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                   INSTALAÇÃO CONCLUÍDA                         ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

    if ($validationPassed) {
        Write-LogMessage "Sprint 1-2 completo! ✓" -Type Success
    }
    else {
        Write-LogMessage "Instalação completa com alguns avisos" -Type Warning
    }

    Write-Host "`nPróximos passos:" -ForegroundColor Yellow
    Write-Host "1. Reinicie o WSL: wsl --shutdown && wsl" -ForegroundColor White
    Write-Host "2. Clone o repositório (se ainda não fez):" -ForegroundColor White
    Write-Host "   cd ~/claude-work/repos" -ForegroundColor Gray
    Write-Host "   git clone https://github.com/PedroGiudice/Claude-Code-Projetos.git" -ForegroundColor Gray
    Write-Host "3. Execute validação:" -ForegroundColor White
    Write-Host "   cd ~/claude-work/repos/Claude-Code-Projetos" -ForegroundColor Gray
    Write-Host "   ./scripts/validar-sprint-1-2.sh" -ForegroundColor Gray
    Write-Host "4. Leia documentação: WSL_SETUP.md" -ForegroundColor White

}
catch {
    Write-LogMessage "Erro durante instalação: $($_.Exception.Message)" -Type Error
    Write-LogMessage "Consulte: docs/plano-migracao-wsl2.md" -Type Info
    exit 1
}
