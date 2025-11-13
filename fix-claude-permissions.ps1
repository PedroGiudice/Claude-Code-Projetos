#Requires -Version 5.1
<#
.SYNOPSIS
    Fix Claude Code CLI permission issues on Windows

.DESCRIPTION
    Diagnoses and fixes EPERM errors that cause Claude Code CLI to freeze
    during startup. Addresses Windows permission issues with .claude.json
    lock file creation.

.NOTES
    Author: Claude Code Hooks System
    Date: 2025-11-13
    Related Issue: Windows CLI infinite retry loop (EPERM)

.PARAMETER AddDefenderExclusion
    If specified, adds Windows Defender exclusion (requires Admin)

.PARAMETER Verbose
    Show detailed diagnostic information

.EXAMPLE
    .\fix-claude-permissions.ps1

.EXAMPLE
    .\fix-claude-permissions.ps1 -AddDefenderExclusion -Verbose
#>

param(
    [switch]$AddDefenderExclusion,
    [switch]$VerboseOutput
)

# ============================================================================
# CONFIGURATION
# ============================================================================

$ClaudeConfigPath = Join-Path $env:USERPROFILE ".claude.json"
$ClaudeConfigDir = Split-Path $ClaudeConfigPath -Parent
$LockPattern = "$ClaudeConfigPath.*"

# ============================================================================
# FUNCTIONS
# ============================================================================

function Write-Status {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Success', 'Warning', 'Error')]
        [string]$Level = 'Info'
    )

    $colors = @{
        'Info'    = 'Cyan'
        'Success' = 'Green'
        'Warning' = 'Yellow'
        'Error'   = 'Red'
    }

    $symbols = @{
        'Info'    = '[i]'
        'Success' = '[✓]'
        'Warning' = '[!]'
        'Error'   = '[✗]'
    }

    Write-Host "$($symbols[$Level]) " -ForegroundColor $colors[$Level] -NoNewline
    Write-Host $Message
}

function Test-AdminPrivileges {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    return $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Get-StaleLocks {
    if (Test-Path $ClaudeConfigPath) {
        return Get-ChildItem -Path $ClaudeConfigDir -Filter ".claude.json.*" -ErrorAction SilentlyContinue
    }
    return @()
}

function Test-PermissionsIssue {
    param([string]$Path)

    try {
        # Test if we can create a lock directory
        $testLock = "$Path.test-lock"

        if (Test-Path $testLock) {
            Remove-Item $testLock -Force -ErrorAction Stop
        }

        New-Item -ItemType Directory -Path $testLock -ErrorAction Stop | Out-Null
        Remove-Item $testLock -Force -ErrorAction Stop

        return $false  # No issue
    }
    catch {
        if ($_.Exception.Message -match "EPERM|denied|access") {
            return $true  # Permission issue detected
        }
        return $false
    }
}

function Repair-FilePermissions {
    param([string]$Path)

    try {
        if (-not (Test-Path $Path)) {
            Write-Status "Creating $Path" -Level Info
            New-Item -ItemType File -Path $Path -Force | Out-Null
        }

        # Get current ACL
        $acl = Get-Acl $Path

        # Create new rule granting full control to current user
        $rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
            $env:USERNAME,
            "FullControl",
            "Allow"
        )

        # Apply rule
        $acl.SetAccessRule($rule)
        Set-Acl -Path $Path -AclObject $acl

        Write-Status "Permissions fixed for: $Path" -Level Success
        return $true
    }
    catch {
        Write-Status "Failed to fix permissions: $_" -Level Error
        return $false
    }
}

function Clear-StaleLocks {
    $locks = Get-StaleLocks

    if ($locks.Count -eq 0) {
        Write-Status "No stale locks found" -Level Info
        return $true
    }

    Write-Status "Found $($locks.Count) stale lock file(s)" -Level Warning

    foreach ($lock in $locks) {
        try {
            Remove-Item $lock.FullName -Force -Recurse -ErrorAction Stop
            Write-Status "Removed: $($lock.Name)" -Level Success
        }
        catch {
            Write-Status "Failed to remove $($lock.Name): $_" -Level Error
            return $false
        }
    }

    return $true
}

function Add-DefenderExclusion {
    param([string]$Path)

    if (-not (Test-AdminPrivileges)) {
        Write-Status "Admin privileges required for Defender exclusions" -Level Warning
        Write-Status "Run as Administrator to add exclusion" -Level Info
        return $false
    }

    try {
        # Check if exclusion already exists
        $exclusions = Get-MpPreference | Select-Object -ExpandProperty ExclusionPath

        if ($exclusions -contains $Path) {
            Write-Status "Defender exclusion already exists for: $Path" -Level Info
            return $true
        }

        # Add exclusion
        Add-MpPreference -ExclusionPath $Path -ErrorAction Stop
        Write-Status "Added Defender exclusion for: $Path" -Level Success
        return $true
    }
    catch {
        Write-Status "Failed to add Defender exclusion: $_" -Level Error
        return $false
    }
}

function Test-LockCreation {
    param([string]$Path)

    $testLock = "$Path.final-test"

    try {
        # Try creating directory (like Claude Code does)
        New-Item -ItemType Directory -Path $testLock -ErrorAction Stop | Out-Null

        # Clean up
        Remove-Item $testLock -Force -ErrorAction Stop

        Write-Status "Lock creation test: PASSED" -Level Success
        return $true
    }
    catch {
        Write-Status "Lock creation test: FAILED" -Level Error

        if ($VerboseOutput) {
            Write-Host "Error details: $_" -ForegroundColor Red
        }

        return $false
    }
}

# ============================================================================
# MAIN SCRIPT
# ============================================================================

Write-Host "`n============================================" -ForegroundColor Cyan
Write-Host "Claude Code Permission Repair Utility" -ForegroundColor Cyan
Write-Host "============================================`n" -ForegroundColor Cyan

# Step 1: Detect environment
Write-Status "Detecting environment..." -Level Info
Write-Status "User: $env:USERNAME" -Level Info
Write-Status "Config: $ClaudeConfigPath" -Level Info

if (Test-AdminPrivileges) {
    Write-Status "Running with Administrator privileges" -Level Info
} else {
    Write-Status "Running with standard user privileges" -Level Warning
}

Write-Host ""

# Step 2: Check for existing permission issues
Write-Status "Checking for permission issues..." -Level Info

$hasPermissionIssue = Test-PermissionsIssue -Path $ClaudeConfigPath

if ($hasPermissionIssue) {
    Write-Status "Permission issue detected (EPERM)" -Level Warning
} else {
    Write-Status "No obvious permission issues detected" -Level Success
}

Write-Host ""

# Step 3: Clear stale locks
Write-Status "Checking for stale lock files..." -Level Info

$locksCleaned = Clear-StaleLocks

if (-not $locksCleaned) {
    Write-Status "Warning: Some locks could not be cleared" -Level Warning
}

Write-Host ""

# Step 4: Fix permissions
Write-Status "Repairing file permissions..." -Level Info

$permissionsFixed = Repair-FilePermissions -Path $ClaudeConfigPath

if (-not $permissionsFixed) {
    Write-Status "ERROR: Could not fix permissions" -Level Error
    exit 1
}

Write-Host ""

# Step 5: Add Defender exclusion (optional)
if ($AddDefenderExclusion) {
    Write-Status "Adding Windows Defender exclusion..." -Level Info

    $exclusionAdded = Add-DefenderExclusion -Path $ClaudeConfigPath

    if (-not $exclusionAdded) {
        Write-Status "Defender exclusion not added (non-critical)" -Level Warning
    }

    Write-Host ""
}

# Step 6: Verify fix
Write-Status "Verifying fix..." -Level Info

$testPassed = Test-LockCreation -Path $ClaudeConfigPath

Write-Host ""

# Step 7: Summary
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

if ($testPassed) {
    Write-Status "All checks passed! Claude Code should work now." -Level Success
    Write-Host "`nYou can now run: claude" -ForegroundColor Green
    exit 0
} else {
    Write-Status "Some issues remain. See details above." -Level Warning
    Write-Host "`nTry running as Administrator:" -ForegroundColor Yellow
    Write-Host "  Right-click PowerShell → Run as Administrator" -ForegroundColor Yellow
    Write-Host "  Then run: .\fix-claude-permissions.ps1 -AddDefenderExclusion" -ForegroundColor Yellow
    exit 1
}
