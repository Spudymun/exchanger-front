# ✅ Production Docker Environment Management Script (PowerShell)
# This script manages the production environment (stop, restart, maintenance)

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidateSet("status", "stop", "restart", "logs", "backup", "restore", "update", "maintenance", "scale", "help")]
    [string]$Command,
    
    [string]$Service = "",
    [switch]$Follow = $false,
    [string]$BackupDir = "",
    [int]$Replicas = 1
)

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

function Show-Usage {
    Write-Host "Exchanger Production Management Script" -ForegroundColor White
    Write-Host "=====================================" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage: .\scripts\docker\prod-manage.ps1 <command> [options]" -ForegroundColor White
    Write-Host ""
    Write-Host "Commands:" -ForegroundColor White
    Write-Host "  status       Show current status of all services" -ForegroundColor Gray
    Write-Host "  stop         Stop all production services" -ForegroundColor Gray
    Write-Host "  restart      Restart all production services" -ForegroundColor Gray
    Write-Host "  logs         Show logs from all services" -ForegroundColor Gray
    Write-Host "  backup       Create a backup of database and Redis" -ForegroundColor Gray
    Write-Host "  restore      Restore from a backup" -ForegroundColor Gray
    Write-Host "  update       Update services to latest versions" -ForegroundColor Gray
    Write-Host "  maintenance  Enter maintenance mode" -ForegroundColor Gray
    Write-Host "  scale        Scale services" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -Service <name>      Target specific service (postgres, redis, web)" -ForegroundColor Gray
    Write-Host "  -Follow              Follow logs (for logs command)" -ForegroundColor Gray
    Write-Host "  -BackupDir <path>    Specify backup directory" -ForegroundColor Gray
    Write-Host "  -Replicas <num>      Number of replicas (for scale command)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor White
    Write-Host "  .\scripts\docker\prod-manage.ps1 status" -ForegroundColor Gray
    Write-Host "  .\scripts\docker\prod-manage.ps1 logs -Service web -Follow" -ForegroundColor Gray
    Write-Host "  .\scripts\docker\prod-manage.ps1 backup -BackupDir C:\backups" -ForegroundColor Gray
    Write-Host "  .\scripts\docker\prod-manage.ps1 scale -Service web -Replicas 3" -ForegroundColor Gray
}

# Check if production environment exists
function Test-ProductionEnvironment {
    if (-not (Test-Path "docker-compose.production.yml")) {
        Write-Error "Production compose file not found"
        exit 1
    }
    
    if (-not (Test-Path ".env.production")) {
        Write-Error "Production environment file not found"
        exit 1
    }
}

# Show service status
function Show-ServiceStatus {
    Write-Status "Production Services Status:"
    Write-Host "============================" -ForegroundColor White
    
    docker-compose -f docker-compose.production.yml ps
    
    Write-Host ""
    Write-Status "Resource Usage:"
    try {
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    }
    catch {
        Write-Warning "Could not get resource usage"
    }
    
    Write-Host ""
    Write-Status "Health Status:"
    
    # Check PostgreSQL
    try {
        docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U exchanger_user | Out-Null
        Write-Success "PostgreSQL: Healthy"
    }
    catch {
        Write-Error "PostgreSQL: Unhealthy"
    }
    
    # Check Redis
    try {
        docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | Out-Null
        Write-Success "Redis: Healthy"
    }
    catch {
        Write-Error "Redis: Unhealthy"
    }
    
    # Check Web Application
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method HEAD -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Success "Web Application: Healthy"
        }
        else {
            Write-Warning "Web Application: Responding but status code $($response.StatusCode)"
        }
    }
    catch {
        Write-Error "Web Application: Unhealthy or not responding"
    }
}

# Stop services
function Stop-Services {
    Write-Status "Stopping production services..."
    
    if ($Service) {
        Write-Status "Stopping service: $Service"
        docker-compose -f docker-compose.production.yml stop $Service
    }
    else {
        Write-Status "Stopping all services..."
        docker-compose -f docker-compose.production.yml down
    }
    
    Write-Success "Services stopped"
}

# Restart services
function Restart-Services {
    Write-Status "Restarting production services..."
    
    if ($Service) {
        Write-Status "Restarting service: $Service"
        docker-compose -f docker-compose.production.yml restart $Service
    }
    else {
        Write-Status "Restarting all services..."
        docker-compose -f docker-compose.production.yml restart
    }
    
    Write-Success "Services restarted"
}

# Show logs
function Show-Logs {
    Write-Status "Showing logs..."
    
    $logCommand = "docker-compose -f docker-compose.production.yml logs"
    
    if ($Service) {
        $logCommand += " $Service"
    }
    
    if ($Follow) {
        $logCommand += " -f"
    }
    
    Invoke-Expression $logCommand
}

# Create backup
function New-ProductionBackup {
    Write-Status "Creating production backup..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    
    if ($BackupDir) {
        $backupPath = "$BackupDir\$timestamp"
    }
    else {
        $backupPath = ".\docker-data\production\backups\$timestamp"
    }
    
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
    
    try {
        # Backup PostgreSQL
        Write-Status "Backing up PostgreSQL database..."
        docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U exchanger_user exchanger_db > "$backupPath\database.sql"
        
        # Backup Redis
        Write-Status "Backing up Redis data..."
        docker-compose -f docker-compose.production.yml exec -T redis redis-cli --rdb - > "$backupPath\redis.rdb"
        
        # Backup configuration
        Copy-Item ".env.production" "$backupPath\" -Force
        Copy-Item "docker-compose.production.yml" "$backupPath\" -Force
        
        # Create backup info
        $backupInfo = @"
Backup Information
==================
Date: $(Get-Date)
Database: PostgreSQL
Cache: Redis
Configuration: .env.production, docker-compose.production.yml

Restore Instructions:
1. Stop production services
2. Restore database: docker-compose -f docker-compose.production.yml exec -T postgres psql -U exchanger_user -d exchanger_db < database.sql
3. Restore Redis: docker-compose -f docker-compose.production.yml exec -T redis redis-cli --rdb redis.rdb
4. Start services
"@
        
        $backupInfo | Out-File "$backupPath\README.txt" -Encoding UTF8
        
        Write-Success "Backup created at: $backupPath"
    }
    catch {
        Write-Error "Backup failed: $($_.Exception.Message)"
    }
}

# Restore from backup
function Restore-FromBackup {
    Write-Status "Restoring from backup..."
    
    if (-not $BackupDir -or -not (Test-Path $BackupDir)) {
        Write-Error "Please specify a valid backup directory with -BackupDir"
        return
    }
    
    $confirmation = Read-Host "This will overwrite current data. Type 'RESTORE' to confirm"
    if ($confirmation -ne "RESTORE") {
        Write-Warning "Restore cancelled"
        return
    }
    
    try {
        # Stop services
        Write-Status "Stopping services for restore..."
        docker-compose -f docker-compose.production.yml stop
        
        # Restore database
        if (Test-Path "$BackupDir\database.sql") {
            Write-Status "Restoring PostgreSQL database..."
            Get-Content "$BackupDir\database.sql" | docker-compose -f docker-compose.production.yml exec -T postgres psql -U exchanger_user -d exchanger_db
        }
        
        # Restore Redis
        if (Test-Path "$BackupDir\redis.rdb") {
            Write-Status "Restoring Redis data..."
            # Note: Redis restore is more complex, may need manual intervention
            Write-Warning "Redis restore requires manual intervention. Copy redis.rdb to container volume."
        }
        
        # Start services
        Write-Status "Starting services after restore..."
        docker-compose -f docker-compose.production.yml up -d
        
        Write-Success "Restore completed"
    }
    catch {
        Write-Error "Restore failed: $($_.Exception.Message)"
    }
}

# Update services
function Update-Services {
    Write-Status "Updating production services..."
    
    try {
        # Pull latest images
        Write-Status "Pulling latest images..."
        docker-compose -f docker-compose.production.yml pull
        
        # Recreate containers with new images
        Write-Status "Recreating containers..."
        docker-compose -f docker-compose.production.yml up -d --force-recreate
        
        # Clean up old images
        Write-Status "Cleaning up old images..."
        docker image prune -f
        
        Write-Success "Services updated successfully"
    }
    catch {
        Write-Error "Update failed: $($_.Exception.Message)"
    }
}

# Enter maintenance mode
function Enter-MaintenanceMode {
    Write-Status "Entering maintenance mode..."
    
    try {
        # Scale web service to 0
        Write-Status "Scaling web service to 0..."
        docker-compose -f docker-compose.production.yml up -d --scale web=0
        
        # Create maintenance page (simple approach)
        Write-Status "Services are in maintenance mode"
        Write-Warning "Remember to scale web service back up when maintenance is complete:"
        Write-Host "  .\scripts\docker\prod-manage.ps1 scale -Service web -Replicas 1" -ForegroundColor Yellow
        
        Write-Success "Maintenance mode activated"
    }
    catch {
        Write-Error "Failed to enter maintenance mode: $($_.Exception.Message)"
    }
}

# Scale services
function Set-ServiceScale {
    if (-not $Service) {
        Write-Error "Please specify a service name with -Service"
        return
    }
    
    Write-Status "Scaling service '$Service' to $Replicas replicas..."
    
    try {
        docker-compose -f docker-compose.production.yml up -d --scale "$Service=$Replicas"
        Write-Success "Service '$Service' scaled to $Replicas replicas"
    }
    catch {
        Write-Error "Scaling failed: $($_.Exception.Message)"
    }
}

# Main function
function Main {
    switch ($Command) {
        "help" {
            Show-Usage
        }
        "status" {
            Test-ProductionEnvironment
            Show-ServiceStatus
        }
        "stop" {
            Test-ProductionEnvironment
            Stop-Services
        }
        "restart" {
            Test-ProductionEnvironment
            Restart-Services
        }
        "logs" {
            Test-ProductionEnvironment
            Show-Logs
        }
        "backup" {
            Test-ProductionEnvironment
            New-ProductionBackup
        }
        "restore" {
            Test-ProductionEnvironment
            Restore-FromBackup
        }
        "update" {
            Test-ProductionEnvironment
            Update-Services
        }
        "maintenance" {
            Test-ProductionEnvironment
            Enter-MaintenanceMode
        }
        "scale" {
            Test-ProductionEnvironment
            Set-ServiceScale
        }
        default {
            Write-Error "Unknown command: $Command"
            Show-Usage
        }
    }
}

# Run main function
Main
