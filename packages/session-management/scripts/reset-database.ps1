# ============================================================================
# Multi-App Database Reset Manager
# ============================================================================
# Manages database resets for multi-app architecture
# Provides safe, granular control over what data gets reset
# ============================================================================

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet("shared", "web", "admin", "web-only", "admin-only")]
    [string]$ResetType,
    
    [string]$DatabaseUrl = $env:DATABASE_URL,
    
    [switch]$Force,
    
    [switch]$DryRun
)

# Configuration
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$ResetScriptsPath = Join-Path $ScriptRoot "reset"

# Validate database URL
if ([string]::IsNullOrEmpty($DatabaseUrl)) {
    Write-Error "DATABASE_URL environment variable not set or -DatabaseUrl parameter not provided"
    exit 1
}

# Safety check for production
if ($DatabaseUrl -match "prod|production" -and -not $Force) {
    Write-Error "Detected production database URL. Use -Force if you really want to proceed."
    Write-Host "Database URL: $($DatabaseUrl.Substring(0, [Math]::Min(50, $DatabaseUrl.Length)))..."
    exit 1
}

function Invoke-ResetScript {
    param(
        [string]$ScriptName,
        [string]$Description
    )
    
    $ScriptPath = Join-Path $ResetScriptsPath "$ScriptName.sql"
    
    if (-not (Test-Path $ScriptPath)) {
        Write-Error "Reset script not found: $ScriptPath"
        return $false
    }
    
    Write-Host "`n🔄 $Description" -ForegroundColor Yellow
    Write-Host "Script: $ScriptName.sql" -ForegroundColor Gray
    
    if ($DryRun) {
        Write-Host "DRY RUN: Would execute script $ScriptPath" -ForegroundColor Cyan
        return $true
    }
    
    try {
        # Use psql to execute the script
        $env:PGPASSWORD = $null  # Let psql handle authentication from URL
        psql $DatabaseUrl -f $ScriptPath
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $Description completed successfully" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "❌ $Description failed with exit code $LASTEXITCODE" -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "❌ Error executing $Description`: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Main execution logic
Write-Host "🗃️  Multi-App Database Reset Manager" -ForegroundColor Cyan
Write-Host "Reset Type: $ResetType" -ForegroundColor Yellow
Write-Host "Database: $($DatabaseUrl.Split('@')[-1])" -ForegroundColor Gray

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No actual changes will be made" -ForegroundColor Magenta
}

Write-Host "`n⚠️  WARNING: This will delete data from your database!" -ForegroundColor Red

if (-not $Force -and -not $DryRun) {
    $confirmation = Read-Host "Are you sure you want to proceed? (yes/no)"
    if ($confirmation -ne "yes") {
        Write-Host "Operation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

$success = $true

switch ($ResetType) {
    "shared" {
        Write-Host "`n🚨 SHARED RESET: This will affect ALL applications!" -ForegroundColor Red
        $success = Invoke-ResetScript "shared-reset" "Resetting ALL application data"
    }
    
    "web" {
        Write-Host "`n🌐 WEB RESET: This will reset web application data only" -ForegroundColor Blue
        $success = Invoke-ResetScript "web-reset" "Resetting WEB application data"
    }
    
    "admin" {
        Write-Host "`n🔧 ADMIN RESET: This will reset admin application data only" -ForegroundColor Blue
        $success = Invoke-ResetScript "admin-reset" "Resetting ADMIN application data"
    }
    
    "web-only" {
        Write-Host "`n🌐 WEB-ONLY RESET: Preserving admin data" -ForegroundColor Blue
        $success = Invoke-ResetScript "web-reset" "Resetting WEB application data only"
    }
    
    "admin-only" {
        Write-Host "`n🔧 ADMIN-ONLY RESET: Preserving web data" -ForegroundColor Blue
        $success = Invoke-ResetScript "admin-reset" "Resetting ADMIN application data only"
    }
}

if ($success) {
    Write-Host "`n🎉 Database reset completed successfully!" -ForegroundColor Green
    
    # Suggest next steps
    Write-Host "`n💡 Next steps:" -ForegroundColor Cyan
    switch ($ResetType) {
        "shared" {
            Write-Host "  • All users need to re-register across all applications"
            Write-Host "  • All sessions have been invalidated"
            Write-Host "  • Consider running data seed scripts if available"
        }
        { $_ -in @("web", "web-only") } {
            Write-Host "  • Web application users need to re-authenticate"
            Write-Host "  • Admin application remains unaffected"
            Write-Host "  • Web-specific roles need to be reassigned"
        }
        { $_ -in @("admin", "admin-only") } {
            Write-Host "  • Admin application users need to re-authenticate"
            Write-Host "  • Web application remains unaffected"
            Write-Host "  • Admin-specific roles need to be reassigned"
        }
    }
}
else {
    Write-Host "`n💥 Database reset failed!" -ForegroundColor Red
    exit 1
}