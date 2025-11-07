# OAB Watcher - Script de Execução
# Ativa ambiente virtual e executa o agente

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  OAB WATCHER - Monitor DJEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se está no diretório correto
if (-not (Test-Path "main.py")) {
    Write-Host "ERRO: Execute este script do diretório oab-watcher!" -ForegroundColor Red
    Write-Host "Comando: cd agentes\oab-watcher && .\run_agent.ps1" -ForegroundColor Yellow
    exit 1
}

# Verificar se venv existe
if (-not (Test-Path ".venv")) {
    Write-Host "AVISO: Ambiente virtual não encontrado!" -ForegroundColor Yellow
    Write-Host "Criando ambiente virtual..." -ForegroundColor Yellow
    python -m venv .venv

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao criar ambiente virtual!" -ForegroundColor Red
        exit 1
    }

    Write-Host "Ambiente virtual criado com sucesso!" -ForegroundColor Green
}

# Ativar ambiente virtual
Write-Host "Ativando ambiente virtual..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Verificar ativação
$pythonPath = (Get-Command python).Source
if ($pythonPath -notlike "*\.venv\*") {
    Write-Host "ERRO: Falha ao ativar ambiente virtual!" -ForegroundColor Red
    Write-Host "Python em uso: $pythonPath" -ForegroundColor Red
    exit 1
}

Write-Host "Ambiente virtual ativado: $pythonPath" -ForegroundColor Green

# Verificar se dependências estão instaladas
Write-Host "Verificando dependências..." -ForegroundColor Yellow
$installedPackages = pip list --format=freeze

if ($installedPackages -notmatch "requests") {
    Write-Host "AVISO: Dependências não instaladas!" -ForegroundColor Yellow
    Write-Host "Instalando dependências de requirements.txt..." -ForegroundColor Yellow
    pip install --upgrade pip
    pip install -r requirements.txt

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: Falha ao instalar dependências!" -ForegroundColor Red
        exit 1
    }

    Write-Host "Dependências instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Dependências OK!" -ForegroundColor Green
}

# Verificar se E:\claude-code-data existe
$dataPath = "E:\claude-code-data\agentes\oab-watcher"
if (-not (Test-Path $dataPath)) {
    Write-Host "AVISO: Diretório de dados não encontrado: $dataPath" -ForegroundColor Yellow
    Write-Host "Criando estrutura de dados..." -ForegroundColor Yellow

    New-Item -ItemType Directory -Force -Path "$dataPath\downloads\cadernos" | Out-Null
    New-Item -ItemType Directory -Force -Path "$dataPath\downloads\busca_oab" | Out-Null
    New-Item -ItemType Directory -Force -Path "$dataPath\logs" | Out-Null
    New-Item -ItemType Directory -Force -Path "$dataPath\outputs\relatorios" | Out-Null

    Write-Host "Estrutura de dados criada!" -ForegroundColor Green
}

# Executar agente
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Iniciando OAB Watcher..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

python main.py

# Capturar código de saída
$exitCode = $LASTEXITCODE

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
if ($exitCode -eq 0) {
    Write-Host "  OAB Watcher encerrado com sucesso" -ForegroundColor Green
} else {
    Write-Host "  OAB Watcher encerrado com erros (código: $exitCode)" -ForegroundColor Red
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

exit $exitCode
