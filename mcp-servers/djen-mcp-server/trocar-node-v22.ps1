# Script para instalar e usar Node v22.x (compatível com Claude Desktop)
# Execute como Administrador

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Instalador Node v22.x (Claude MCP)  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar versão atual
Write-Host "Versão atual do Node:" -ForegroundColor Yellow
node --version
Write-Host ""

# Opções
Write-Host "Escolha uma opção:" -ForegroundColor Green
Write-Host "1. Instalar Node v22.x com NVM (recomendado)"
Write-Host "2. Instalar Node v22.x manualmente (MSI)"
Write-Host "3. Reinstalar dependências do projeto com Node atual"
Write-Host "0. Cancelar"
Write-Host ""

$choice = Read-Host "Digite o número da opção"

switch ($choice) {
    "1" {
        Write-Host "`nInstalando NVM para Windows..." -ForegroundColor Cyan

        # Verificar se NVM já está instalado
        if (Get-Command nvm -ErrorAction SilentlyContinue) {
            Write-Host "NVM já está instalado!" -ForegroundColor Green
        } else {
            Write-Host "Baixando NVM..." -ForegroundColor Yellow
            Write-Host "Visite: https://github.com/coreybutler/nvm-windows/releases" -ForegroundColor Yellow
            Write-Host "Baixe: nvm-setup.exe (versão mais recente)" -ForegroundColor Yellow
            Write-Host ""

            $download = Read-Host "Deseja abrir o navegador para baixar? (s/n)"
            if ($download -eq "s") {
                Start-Process "https://github.com/coreybutler/nvm-windows/releases"
            }

            Write-Host "`nApós instalar o NVM, execute novamente este script e escolha a opção 1" -ForegroundColor Yellow
            pause
            exit
        }

        Write-Host "`nInstalando Node v22.19.0..." -ForegroundColor Cyan
        nvm install 22.19.0

        Write-Host "`nDefinindo Node v22.19.0 como padrão..." -ForegroundColor Cyan
        nvm use 22.19.0

        Write-Host "`nVersão atual:" -ForegroundColor Green
        node --version

        Write-Host "`nReinstalar dependências do projeto? (s/n)" -ForegroundColor Yellow
        $reinstall = Read-Host
        if ($reinstall -eq "s") {
            Set-Location "E:\projetos\djen-mcp-server"
            Write-Host "`nLimpando node_modules..." -ForegroundColor Cyan
            Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
            Remove-Item package-lock.json -ErrorAction SilentlyContinue

            Write-Host "`nInstalando dependências..." -ForegroundColor Cyan
            npm install

            Write-Host "`nRecompilando projeto..." -ForegroundColor Cyan
            npm run build
        }
    }

    "2" {
        Write-Host "`nBaixando Node v22.19.0..." -ForegroundColor Cyan

        $url = "https://nodejs.org/dist/v22.19.0/node-v22.19.0-x64.msi"
        $output = "$env:TEMP\node-v22.19.0-x64.msi"

        Write-Host "Baixando de: $url" -ForegroundColor Yellow
        Invoke-WebRequest -Uri $url -OutFile $output

        Write-Host "`nIniciando instalador..." -ForegroundColor Cyan
        Start-Process msiexec.exe -ArgumentList "/i `"$output`"" -Wait

        Write-Host "`nInstalação concluída!" -ForegroundColor Green
        Write-Host "Feche e reabra o PowerShell para usar a nova versão." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Depois execute novamente este script e escolha a opção 3" -ForegroundColor Yellow
    }

    "3" {
        Write-Host "`nReinstalando dependências do projeto..." -ForegroundColor Cyan

        Set-Location "E:\projetos\djen-mcp-server"

        Write-Host "`nVersão do Node:" -ForegroundColor Yellow
        node --version

        Write-Host "`nLimpando node_modules..." -ForegroundColor Cyan
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        Remove-Item package-lock.json -ErrorAction SilentlyContinue

        Write-Host "`nInstalando dependências..." -ForegroundColor Cyan
        npm install

        Write-Host "`nRecompilando módulos nativos (sharp, better-sqlite3)..." -ForegroundColor Cyan
        npm rebuild sharp --build-from-source
        npm rebuild better-sqlite3

        Write-Host "`nRecompilando projeto TypeScript..." -ForegroundColor Cyan
        npm run build

        Write-Host "`n✅ Projeto reinstalado com sucesso!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Teste o servidor MCP:" -ForegroundColor Yellow
        Write-Host "  node dist/index.js" -ForegroundColor White
        Write-Host ""
        Write-Host "Se funcionar, reinicie o Claude Desktop para usar o servidor!" -ForegroundColor Green
    }

    "0" {
        Write-Host "`nCancelado." -ForegroundColor Yellow
        exit
    }

    default {
        Write-Host "`nOpção inválida!" -ForegroundColor Red
        exit
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Instalação Concluída!  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Mostrar versões instaladas
if (Get-Command nvm -ErrorAction SilentlyContinue) {
    Write-Host "Versões do Node instaladas (NVM):" -ForegroundColor Yellow
    nvm list
    Write-Host ""
}

Write-Host "Versão ativa do Node:" -ForegroundColor Green
node --version
npm --version

Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Reinicie o PowerShell/Terminal" -ForegroundColor White
Write-Host "2. Execute: cd E:\projetos\djen-mcp-server" -ForegroundColor White
Write-Host "3. Teste: node dist/index.js" -ForegroundColor White
Write-Host "4. Se funcionar, reinicie o Claude Desktop!" -ForegroundColor White
Write-Host ""

pause
