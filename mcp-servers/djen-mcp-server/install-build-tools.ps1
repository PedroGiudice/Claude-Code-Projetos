# Script de instalação das Build Tools para Windows
# Execute como Administrador

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Instalador de Build Tools para DJEN MCP Server" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se está rodando como Admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host "Clique com botão direito e selecione 'Executar como Administrador'" -ForegroundColor Yellow
    pause
    exit 1
}

# Verifica se Chocolatey está instalado
Write-Host "Verificando Chocolatey..." -ForegroundColor Yellow
$chocoInstalled = Get-Command choco -ErrorAction SilentlyContinue

if (-not $chocoInstalled) {
    Write-Host "Chocolatey não encontrado. Instalando..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

    # Atualiza PATH
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

Write-Host "Chocolatey instalado!" -ForegroundColor Green
Write-Host ""

# Opções de instalação
Write-Host "Escolha o método de instalação:" -ForegroundColor Cyan
Write-Host "1. Instalação Completa (VS Build Tools 2022 + Windows SDK) - ~6GB"
Write-Host "2. Instalação Mínima (Apenas componentes necessários) - ~2GB"
Write-Host "3. Apenas Windows SDK (se já tem VS instalado)"
Write-Host "4. Cancelar"
Write-Host ""
$choice = Read-Host "Opção (1-4)"

switch ($choice) {
    "1" {
        Write-Host "Instalando Visual Studio Build Tools 2022 (Completo)..." -ForegroundColor Yellow
        choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Workload.VCTools --includeRecommended --passive" -y

        Write-Host "Instalando Windows SDK..." -ForegroundColor Yellow
        choco install windows-sdk-10-version-2004-all -y
    }
    "2" {
        Write-Host "Instalando componentes mínimos..." -ForegroundColor Yellow
        choco install visualstudio2022buildtools --package-parameters "--add Microsoft.VisualStudio.Component.VC.Tools.x86.x64 --add Microsoft.VisualStudio.Component.Windows11SDK.22000 --passive" -y
    }
    "3" {
        Write-Host "Instalando apenas Windows SDK..." -ForegroundColor Yellow
        choco install windows-sdk-10-version-2004-all -y
    }
    "4" {
        Write-Host "Instalação cancelada." -ForegroundColor Yellow
        exit 0
    }
    default {
        Write-Host "Opção inválida!" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "==================================================" -ForegroundColor Green
Write-Host "Instalação concluída!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Feche e reabra o terminal/PowerShell"
Write-Host "2. Navegue até a pasta do projeto:"
Write-Host "   cd djen-mcp-server"
Write-Host "3. Instale as dependências:"
Write-Host "   npm install"
Write-Host "4. Faça o build:"
Write-Host "   npm run build"
Write-Host ""
Write-Host "Em caso de problemas, reinicie o computador." -ForegroundColor Yellow
Write-Host ""
pause
