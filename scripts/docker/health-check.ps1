# Simple health check for production services
# Run this script to check the health of production services

$ErrorActionPreference = "Continue"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

$services = @("postgres", "redis")
$alertsFile = ".\docker-data\production\logs\alerts.log"

# Ensure alerts directory exists
$alertsDir = Split-Path $alertsFile -Parent
if (-not (Test-Path $alertsDir)) {
    New-Item -ItemType Directory -Path $alertsDir -Force | Out-Null
}

Write-Status "Checking production services health..."

foreach ($service in $services) {
    try {
        $status = docker-compose -f docker-compose.production.yml ps $service --format "{{.Status}}"
        if ($status -notmatch "healthy|running") {
            $alert = "$(Get-Date): ALERT - Service $service is unhealthy ($status)"
            Add-Content -Path $alertsFile -Value $alert
            Write-Warning $alert
        }
        else {
            Write-Success "Service $service is healthy"
        }
    }
    catch {
        $alert = "$(Get-Date): ALERT - Service $service check failed: $($_.Exception.Message)"
        Add-Content -Path $alertsFile -Value $alert
        Write-Error $alert
    }
}

# Check web application
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method HEAD -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Success "Web application is responding"
    }
    else {
        $alert = "$(Get-Date): ALERT - Web application returned status code $($response.StatusCode)"
        Add-Content -Path $alertsFile -Value $alert
        Write-Warning $alert
    }
}
catch {
    $alert = "$(Get-Date): ALERT - Web application is not responding: $($_.Exception.Message)"
    Add-Content -Path $alertsFile -Value $alert
    Write-Error $alert
}

Write-Status "Health check completed. Alerts logged to: $alertsFile"
