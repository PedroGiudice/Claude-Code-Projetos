#Requires -Version 5.1
<#
.SYNOPSIS
    Diagnóstico completo de ambiente corporativo Windows

.DESCRIPTION
    Detecta restrições, políticas (GPOs), permissões e limitações que podem
    afetar Claude Code CLI em ambientes corporativos Windows.

    Identifica especificamente problemas que causam EPERM loop infinito
    quando SessionStart hooks estão configurados.

.NOTES
    Author: Claude Code Hooks System
    Date: 2025-11-13
    Related: DISASTER_HISTORY.md DIA 4 - LIÇÃO 8

.PARAMETER Verbose
    Mostra informações detalhadas de diagnóstico

.PARAMETER ExportReport
    Exporta relatório para arquivo JSON

.EXAMPLE
    .\diagnose-corporate-env.ps1

.EXAMPLE
    .\diagnose-corporate-env.ps1 -Verbose -ExportReport
#>

param(
    [switch]$VerboseOutput,
    [switch]$ExportReport
)

# =============================================================================
# CONFIGURAÇÃO
# =============================================================================

$ErrorActionPreference = 'SilentlyContinue'
$Script:DiagnosticResults = @{}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

function Write-Status {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error', 'Section')]
        [string]$Level = 'Info'
    )

    $colors = @{
        'Info'    = 'Cyan'
        'Success' = 'Green'
        'Warning' = 'Yellow'
        'Error'   = 'Red'
        'Section' = 'Magenta'
    }

    $symbols = @{
        'Info'    = '[i]'
        'Success' = '[✓]'
        'Warning' = '[!]'
        'Error'   = '[✗]'
        'Section' = '═══'
    }

    if ($Level -eq 'Section') {
        Write-Host "`n$($symbols[$Level]) " -ForegroundColor $colors[$Level] -NoNewline
        Write-Host $Message -ForegroundColor $colors[$Level]
        Write-Host ("═" * ($Message.Length + 5)) -ForegroundColor $colors[$Level]
    } else {
        Write-Host "$($symbols[$Level]) " -ForegroundColor $colors[$Level] -NoNewline
        Write-Host $Message
    }
}

function Get-BooleanIcon {
    param([bool]$Value)
    return if ($Value) { "✓" } else { "✗" }
}

# =============================================================================
# DIAGNOSTIC CHECKS
# =============================================================================

function Test-AdminPrivileges {
    Write-Status "Verificando privilégios de administrador..." -Level Info

    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    $isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    # Test elevated
    $isElevated = $false
    try {
        $null = net session 2>&1
        $isElevated = $LASTEXITCODE -eq 0
    } catch {}

    $result = @{
        IsAdmin = $isAdmin
        IsElevated = $isElevated
        Status = if ($isAdmin -and $isElevated) { "Admin elevado" }
                 elseif ($isAdmin) { "Admin não elevado" }
                 else { "Usuário padrão" }
    }

    $Script:DiagnosticResults['AdminPrivileges'] = $result

    if ($isAdmin -and $isElevated) {
        Write-Status "Status: Admin elevado" -Level Success
    } elseif ($isAdmin) {
        Write-Status "Status: Admin não elevado" -Level Warning
    } else {
        Write-Status "Status: Usuário padrão" -Level Info
    }

    return $result
}

function Test-DomainMembership {
    Write-Status "Verificando membership em domínio..." -Level Info

    try {
        $computerSystem = Get-WmiObject -Class Win32_ComputerSystem
        $isInDomain = $computerSystem.PartOfDomain
        $domain = $computerSystem.Domain

        $result = @{
            IsInDomain = $isInDomain
            Domain = $domain
            Workgroup = $computerSystem.Workgroup
        }

        $Script:DiagnosticResults['DomainMembership'] = $result

        if ($isInDomain) {
            Write-Status "Domínio detectado: $domain" -Level Warning
            Write-Status "  → Indica ambiente corporativo gerenciado" -Level Info
        } else {
            Write-Status "Não está em domínio (WORKGROUP)" -Level Success
        }

        return $result
    } catch {
        Write-Status "Erro ao verificar domínio: $_" -Level Error
        return $null
    }
}

function Test-GroupPolicies {
    Write-Status "Analisando Group Policy Objects (GPOs)..." -Level Info

    try {
        $gpresult = gpresult /r /scope:computer 2>&1 | Out-String

        $hasComputerGPOs = $gpresult -match "Applied Group Policy Objects|Objetos de Diretiva de Grupo Aplicados"
        $restrictivePolicies = @()

        # Procurar por políticas restritivas conhecidas
        if ($gpresult -match "Software Restriction Policies") {
            $restrictivePolicies += "Software Restriction Policies"
        }
        if ($gpresult -match "AppLocker") {
            $restrictivePolicies += "AppLocker"
        }
        if ($gpresult -match "Device Guard") {
            $restrictivePolicies += "Device Guard"
        }

        $result = @{
            HasGPOs = $hasComputerGPOs
            RestrictivePolicies = $restrictivePolicies
            TotalPolicies = ([regex]::Matches($gpresult, "GPO:|Política:")).Count
        }

        $Script:DiagnosticResults['GroupPolicies'] = $result

        if ($hasComputerGPOs) {
            Write-Status "GPOs detectadas: $($result.TotalPolicies)" -Level Warning
            if ($restrictivePolicies.Count -gt 0) {
                Write-Status "  → Políticas restritivas: $($restrictivePolicies -join ', ')" -Level Error
            }
        } else {
            Write-Status "Nenhuma GPO aplicada" -Level Success
        }

        return $result
    } catch {
        Write-Status "Erro ao analisar GPOs: $_" -Level Error
        return $null
    }
}

function Test-ClaudeConfigAccess {
    Write-Status "Testando acesso ao arquivo .claude.json..." -Level Info

    $claudeConfigPath = Join-Path $env:USERPROFILE ".claude.json"
    $testLockPath = "$claudeConfigPath.test-lock"

    $result = @{
        ConfigExists = Test-Path $claudeConfigPath
        CanRead = $false
        CanWrite = $false
        CanCreateLock = $false
        Permissions = $null
    }

    # Test read
    if ($result.ConfigExists) {
        try {
            $null = Get-Content $claudeConfigPath -ErrorAction Stop
            $result.CanRead = $true
        } catch {}
    }

    # Test write
    try {
        $testContent = "test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        $testFile = "$env:USERPROFILE\.claude-test-write.tmp"
        Set-Content -Path $testFile -Value $testContent -ErrorAction Stop
        Remove-Item $testFile -Force -ErrorAction Stop
        $result.CanWrite = $true
    } catch {}

    # Test lock creation (CRITICAL - this is what causes EPERM loop)
    try {
        New-Item -ItemType Directory -Path $testLockPath -ErrorAction Stop | Out-Null
        Remove-Item $testLockPath -Force -ErrorAction Stop
        $result.CanCreateLock = $true
    } catch {
        $result.LockError = $_.Exception.Message
    }

    # Get permissions
    if ($result.ConfigExists) {
        try {
            $acl = Get-Acl $claudeConfigPath
            $result.Permissions = $acl.Access | ForEach-Object {
                @{
                    Identity = $_.IdentityReference.ToString()
                    Rights = $_.FileSystemRights.ToString()
                    Type = $_.AccessControlType.ToString()
                }
            }
        } catch {}
    }

    $Script:DiagnosticResults['ClaudeConfigAccess'] = $result

    Write-Status "Config exists: $(Get-BooleanIcon $result.ConfigExists)" -Level $(if ($result.ConfigExists) { "Success" } else { "Info" })
    Write-Status "Can read: $(Get-BooleanIcon $result.CanRead)" -Level $(if ($result.CanRead) { "Success" } else { "Warning" })
    Write-Status "Can write: $(Get-BooleanIcon $result.CanWrite)" -Level $(if ($result.CanWrite) { "Success" } else { "Warning" })
    Write-Status "Can create lock: $(Get-BooleanIcon $result.CanCreateLock)" -Level $(if ($result.CanCreateLock) { "Success" } else { "Error" })

    if (-not $result.CanCreateLock) {
        Write-Status "  → EPERM DETECTADO! Causa do freeze do CLI" -Level Error
        Write-Status "  → Solução: Execute .\fix-claude-permissions.ps1" -Level Warning
    }

    return $result
}

function Test-AntivirusStatus {
    Write-Status "Verificando status do antivírus..." -Level Info

    try {
        $defender = Get-MpComputerStatus

        $result = @{
            DefenderEnabled = $defender.AntivirusEnabled
            RealTimeProtectionEnabled = $defender.RealTimeProtectionEnabled
            BehaviorMonitorEnabled = $defender.BehaviorMonitorEnabled
            Exclusions = @()
        }

        # Get exclusions
        try {
            $prefs = Get-MpPreference
            $result.Exclusions = $prefs.ExclusionPath
        } catch {}

        $Script:DiagnosticResults['AntivirusStatus'] = $result

        Write-Status "Windows Defender ativo: $(Get-BooleanIcon $result.DefenderEnabled)" -Level Info
        Write-Status "Real-time protection: $(Get-BooleanIcon $result.RealTimeProtectionEnabled)" -Level Info

        $claudeExcluded = $result.Exclusions -contains "$env:USERPROFILE\.claude.json"
        Write-Status "Claude config em exclusions: $(Get-BooleanIcon $claudeExcluded)" -Level $(if ($claudeExcluded) { "Success" } else { "Warning" })

        if (-not $claudeExcluded -and $result.RealTimeProtectionEnabled) {
            Write-Status "  → Defender pode estar bloqueando lock files" -Level Warning
        }

        return $result
    } catch {
        Write-Status "Erro ao verificar antivírus: $_" -Level Error
        return $null
    }
}

function Test-UsernamePattern {
    Write-Status "Analisando padrão de username..." -Level Info

    $username = $env:USERNAME

    $isCorporatePattern = $false
    $pattern = "Pessoal"

    # Heurística 1: Siglas (2-4 chars, maiúsculas)
    if ($username -cmatch '^[A-Z]{2,4}$') {
        $isCorporatePattern = $true
        $pattern = "Sigla corporativa"
    }

    # Heurística 2: Empresa.Usuario
    if ($username -match '^[a-z]+\.[a-z]+$') {
        $isCorporatePattern = $true
        $pattern = "Domínio.Usuario"
    }

    # Heurística 3: FirstnameLastname (PascalCase)
    if ($username -cmatch '^[A-Z][a-z]+[A-Z][a-z]+$') {
        $isCorporatePattern = $true
        $pattern = "NomeSobrenome"
    }

    $result = @{
        Username = $username
        IsCorporatePattern = $isCorporatePattern
        Pattern = $pattern
    }

    $Script:DiagnosticResults['UsernamePattern'] = $result

    Write-Status "Username: $username" -Level Info
    Write-Status "Padrão: $pattern" -Level $(if ($isCorporatePattern) { "Warning" } else { "Success" })

    return $result
}

function Test-ClaudeCodeHooks {
    Write-Status "Verificando hooks do Claude Code..." -Level Info

    $projectDir = (Get-Location).Path
    $settingsPath = Join-Path $projectDir ".claude\settings.json"

    $result = @{
        SettingsExists = Test-Path $settingsPath
        HasSessionStartHooks = $false
        HookCount = 0
        Hooks = @()
    }

    if ($result.SettingsExists) {
        try {
            $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json

            if ($settings.hooks.SessionStart) {
                $result.HasSessionStartHooks = $true
                $hooks = $settings.hooks.SessionStart[0].hooks
                $result.HookCount = $hooks.Count
                $result.Hooks = $hooks | ForEach-Object { $_.command }
            }
        } catch {}
    }

    $Script:DiagnosticResults['ClaudeCodeHooks'] = $result

    Write-Status "Settings.json existe: $(Get-BooleanIcon $result.SettingsExists)" -Level $(if ($result.SettingsExists) { "Success" } else { "Info" })

    if ($result.HasSessionStartHooks) {
        Write-Status "SessionStart hooks detectados: $($result.HookCount)" -Level Warning
        Write-Status "  → Hooks podem trigger EPERM loop no CLI Windows" -Level Warning
    } else {
        Write-Status "Nenhum SessionStart hook configurado" -Level Success
    }

    return $result
}

# =============================================================================
# CORPORATE SCORE CALCULATION
# =============================================================================

function Calculate-CorporateScore {
    $score = 0
    $indicators = @()

    # Username pattern (+3)
    if ($Script:DiagnosticResults['UsernamePattern'].IsCorporatePattern) {
        $score += 3
        $indicators += "Username corporativo"
    }

    # Domain membership (+4)
    if ($Script:DiagnosticResults['DomainMembership'].IsInDomain) {
        $score += 4
        $indicators += "Active Directory"
    }

    # GPOs (+3)
    if ($Script:DiagnosticResults['GroupPolicies'].HasGPOs) {
        $score += 3
        $indicators += "GPOs aplicadas"
    }

    # Can't create locks (+2 - CRITICAL)
    if (-not $Script:DiagnosticResults['ClaudeConfigAccess'].CanCreateLock) {
        $score += 2
        $indicators += "EPERM em lock files"
    }

    # Admin with restrictions (+1)
    if ($Script:DiagnosticResults['AdminPrivileges'].IsAdmin -and $score -gt 0) {
        $score += 1
        $indicators += "Admin com restrições"
    }

    # Classification
    $classification = switch ($score) {
        { $_ -ge 6 } { "CORPORATIVO (alta confiança)" }
        { $_ -ge 3 } { "Provável corporativo" }
        { $_ -ge 1 } { "Possível corporativo" }
        default { "Ambiente pessoal" }
    }

    return @{
        Score = $score
        Classification = $classification
        Indicators = $indicators
    }
}

# =============================================================================
# RECOMMENDATION ENGINE
# =============================================================================

function Get-Recommendations {
    $recommendations = @()

    # Recomendação 1: EPERM detectado
    if (-not $Script:DiagnosticResults['ClaudeConfigAccess'].CanCreateLock) {
        $recommendations += @{
            Priority = "CRÍTICO"
            Issue = "Não consegue criar lock files (.claude.json.lock)"
            Impact = "Claude Code CLI congela ao usar SessionStart hooks"
            Solution = "Execute: .\fix-claude-permissions.ps1"
            Reference = "DISASTER_HISTORY.md DIA 4"
        }
    }

    # Recomendação 2: Hooks + EPERM
    if ($Script:DiagnosticResults['ClaudeCodeHooks'].HasSessionStartHooks -and
        -not $Script:DiagnosticResults['ClaudeConfigAccess'].CanCreateLock) {
        $recommendations += @{
            Priority = "CRÍTICO"
            Issue = "SessionStart hooks configurados + EPERM detectado"
            Impact = "CLI entrará em loop infinito (freeze garantido)"
            Solution = "1) Execute fix-claude-permissions.ps1, OU 2) Use Claude Code Web"
            Reference = "DISASTER_HISTORY.md LIÇÃO 8"
        }
    }

    # Recomendação 3: Defender sem exclusão
    if ($Script:DiagnosticResults['AntivirusStatus'].RealTimeProtectionEnabled -and
        -not ($Script:DiagnosticResults['AntivirusStatus'].Exclusions -contains "$env:USERPROFILE\.claude.json")) {
        $recommendations += @{
            Priority = "IMPORTANTE"
            Issue = "Windows Defender sem exclusão para .claude.json"
            Impact = "Pode causar delays ou bloqueios intermitentes"
            Solution = "Execute fix-claude-permissions.ps1 -AddDefenderExclusion (requer Admin)"
            Reference = "docs/WINDOWS_PERMISSION_FIX.md"
        }
    }

    # Recomendação 4: GPOs restritivas
    if ($Script:DiagnosticResults['GroupPolicies'].RestrictivePolicies.Count -gt 0) {
        $recommendations += @{
            Priority = "AVISO"
            Issue = "Políticas restritivas detectadas: $($Script:DiagnosticResults['GroupPolicies'].RestrictivePolicies -join ', ')"
            Impact = "Pode limitar operações do Claude Code"
            Solution = "Contate TI corporativa para exclusões"
            Reference = "N/A"
        }
    }

    return $recommendations
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================

function Main {
    Write-Host "`n" -NoNewline
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "║     DIAGNÓSTICO DE AMBIENTE CORPORATIVO WINDOWS            ║" -ForegroundColor Cyan
    Write-Host "║     Claude Code CLI - Corporate Environment Detector      ║" -ForegroundColor Cyan
    Write-Host "║                                                            ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""

    # Executar checks
    Write-Status "VERIFICAÇÕES DE SISTEMA" -Level Section
    Test-AdminPrivileges
    Test-UsernamePattern
    Test-DomainMembership

    Write-Status "POLÍTICAS E RESTRIÇÕES" -Level Section
    Test-GroupPolicies
    Test-AntivirusStatus

    Write-Status "CLAUDE CODE ESPECÍFICO" -Level Section
    Test-ClaudeConfigAccess
    Test-ClaudeCodeHooks

    # Calcular score
    Write-Status "ANÁLISE FINAL" -Level Section
    $corporateAnalysis = Calculate-CorporateScore

    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║                    RESULTADO FINAL                         ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""
    Write-Status "Classificação: $($corporateAnalysis.Classification)" -Level $(if ($corporateAnalysis.Score -ge 6) { "Error" } elseif ($corporateAnalysis.Score -ge 3) { "Warning" } else { "Success" })
    Write-Status "Score corporativo: $($corporateAnalysis.Score)/10" -Level Info

    if ($corporateAnalysis.Indicators.Count -gt 0) {
        Write-Host "`nIndicadores detectados:" -ForegroundColor Yellow
        foreach ($indicator in $corporateAnalysis.Indicators) {
            Write-Host "  • $indicator" -ForegroundColor Yellow
        }
    }

    # Recomendações
    $recommendations = Get-Recommendations

    if ($recommendations.Count -gt 0) {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Red
        Write-Host "║                      RECOMENDAÇÕES                         ║" -ForegroundColor Red
        Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Red
        Write-Host ""

        foreach ($rec in $recommendations) {
            $priorityColor = switch ($rec.Priority) {
                "CRÍTICO" { "Red" }
                "IMPORTANTE" { "Yellow" }
                default { "Cyan" }
            }

            Write-Host "[$($rec.Priority)]" -ForegroundColor $priorityColor -NoNewline
            Write-Host " $($rec.Issue)"
            Write-Host "  → Impacto: $($rec.Impact)" -ForegroundColor Gray
            Write-Host "  → Solução: $($rec.Solution)" -ForegroundColor Green
            Write-Host "  → Referência: $($rec.Reference)" -ForegroundColor Gray
            Write-Host ""
        }
    } else {
        Write-Host ""
        Write-Status "✓ Nenhum problema crítico detectado" -Level Success
        Write-Host ""
    }

    # Export report
    if ($ExportReport) {
        $reportPath = ".\corporate-env-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
        $report = @{
            Timestamp = Get-Date -Format 'o'
            DiagnosticResults = $Script:DiagnosticResults
            CorporateAnalysis = $corporateAnalysis
            Recommendations = $recommendations
        }

        $report | ConvertTo-Json -Depth 10 | Out-File $reportPath
        Write-Status "Relatório exportado: $reportPath" -Level Success
    }

    Write-Host ""
    Write-Host "Diagnóstico concluído." -ForegroundColor Cyan
    Write-Host ""
}

# Run
Main
