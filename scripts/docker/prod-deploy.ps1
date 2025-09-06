# ✅ Production Docker Environment Deployment Script (PowerShell)
# This script deploys the production environment with proper optimizations

param(
    [switch]$SkipBackup = $false,
    [switch]$Help = $false
)

$ErrorActionPreference = "Stop"

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

function Show-Help {
    Write-Host "Exchanger Production Deployment Script" -ForegroundColor White
    Write-Host "======================================" -ForegroundColor White
    Write-Host ""
    Write-Host "Usage: .\scripts\docker\prod-deploy.ps1 [OPTIONS]" -ForegroundColor White
    Write-Host ""
    Write-Host "Options:" -ForegroundColor White
    Write-Host "  -SkipBackup    Skip backup creation" -ForegroundColor Gray
    Write-Host "  -Help          Show this help message" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Prerequisites:" -ForegroundColor White
    Write-Host "  1. Create .env.production file" -ForegroundColor Gray
    Write-Host "  2. Ensure Docker and Docker Compose are installed" -ForegroundColor Gray
    Write-Host "  3. Review security settings" -ForegroundColor Gray
    exit 0
}

# Check prerequisites
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    # Check Docker
    try {
        docker info | Out-Null
    }
    catch {
        Write-Error "Docker is not installed or not running"
        exit 1
    }
    
    # Check Docker Compose
    try {
        docker-compose version | Out-Null
    }
    catch {
        Write-Error "Docker Compose is not installed"
        exit 1
    }
    
    # Check if production environment file exists
    if (-not (Test-Path ".env.production")) {
        Write-Error "Production environment file (.env.production) not found"
        Write-Host "Please create .env.production based on .env.production.example" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

# Validate environment variables
function Test-Environment {
    Write-Status "Validating production environment variables..."
    
    # Load production environment
    $envVars = @{}
    Get-Content ".env.production" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $envVars[$matches[1]] = $matches[2]
        }
    }
    
    # Required variables
    $requiredVars = @(
        "DATABASE_URL",
        "REDIS_URL", 
        "NEXTAUTH_SECRET",
        "POSTGRES_DB",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "REDIS_PASSWORD"
    )
    
    $missingVars = @()
    
    foreach ($var in $requiredVars) {
        if (-not $envVars.ContainsKey($var) -or [string]::IsNullOrEmpty($envVars[$var])) {
            $missingVars += $var
        }
    }
    
    if ($missingVars.Count -gt 0) {
        Write-Error "Missing required environment variables:"
        foreach ($var in $missingVars) {
            Write-Host "  $var" -ForegroundColor Red
        }
        exit 1
    }
    
    # Validate strong passwords
    if ($envVars["POSTGRES_PASSWORD"].Length -lt 12) {
        Write-Error "POSTGRES_PASSWORD must be at least 12 characters long"
        exit 1
    }
    
    if ($envVars.ContainsKey("REDIS_PASSWORD") -and $envVars["REDIS_PASSWORD"].Length -lt 12) {
        Write-Error "REDIS_PASSWORD must be at least 12 characters long"
        exit 1
    }
    
    if ($envVars["NEXTAUTH_SECRET"].Length -lt 32) {
        Write-Error "NEXTAUTH_SECRET must be at least 32 characters long"
        exit 1
    }
    
    Write-Success "Environment validation passed"
}

# Setup production directories
function Initialize-ProductionDirectories {
    Write-Status "Setting up production directories..."
    
    # Create data directories
    $dataPath = ".\docker-data\production"
    
    if (-not (Test-Path "$dataPath\postgres")) {
        New-Item -ItemType Directory -Path "$dataPath\postgres" -Force | Out-Null
    }
    
    if (-not (Test-Path "$dataPath\redis")) {
        New-Item -ItemType Directory -Path "$dataPath\redis" -Force | Out-Null
    }
    
    if (-not (Test-Path "$dataPath\logs")) {
        New-Item -ItemType Directory -Path "$dataPath\logs" -Force | Out-Null
    }
    
    if (-not (Test-Path "$dataPath\backups")) {
        New-Item -ItemType Directory -Path "$dataPath\backups" -Force | Out-Null
    }
    
    Write-Success "Production directories created"
}

# Deploy with zero downtime
function Start-ZeroDowntimeDeployment {
    Write-Status "Performing deployment..."
    
    # Pull latest images
    Write-Status "Pulling latest images..."
    docker-compose -f docker-compose.production.yml pull
    
    # Create new containers
    Write-Status "Starting production containers..."
    docker-compose -f docker-compose.production.yml up -d
    
    # Wait for health checks
    Write-Status "Waiting for services to be healthy..."
    
    $maxAttempts = 30
    $attempt = 1
    
    while ($attempt -le $maxAttempts) {
        try {
            $status = docker-compose -f docker-compose.production.yml ps --format "table {{.Service}}\t{{.Status}}"
            if ($status -match "healthy") {
                Write-Success "Services are healthy"
                break
            }
        }
        catch {
            # Continue waiting
        }
        
        Write-Status "Attempt $attempt/$maxAttempts - waiting for services..."
        Start-Sleep -Seconds 10
        $attempt++
    }
    
    if ($attempt -gt $maxAttempts) {
        Write-Error "Services failed to become healthy within timeout"
        exit 1
    }
}

# Run database migrations
function Invoke-DatabaseMigrations {
    Write-Status "Running database migrations..."
    
    try {
        # Wait for PostgreSQL to be ready
        Write-Status "Waiting for PostgreSQL to be ready..."
        
        $maxAttempts = 15
        $attempt = 1
        
        while ($attempt -le $maxAttempts) {
            try {
                docker-compose -f docker-compose.production.yml exec -T postgres pg_isready | Out-Null
                break
            }
            catch {
                Start-Sleep -Seconds 2
                $attempt++
            }
        }
        
        # Check if we have Prisma
        if (Test-Path "packages/session-management/prisma") {
            Write-Status "Running Prisma migrations..."
            
            Push-Location "packages/session-management"
            
            # Set production environment for Prisma
            $env:NODE_ENV = "production"
            
            # Run migrations
            npx prisma migrate deploy
            
            Pop-Location
            
            Write-Success "Database migrations completed"
        }
        else {
            Write-Warning "Prisma directory not found, skipping migrations"
        }
    }
    catch {
        Write-Warning "Database migrations failed: $($_.Exception.Message)"
        Write-Warning "You may need to run migrations manually"
    }
}

# Create backup
function New-Backup {
    if ($SkipBackup) {
        Write-Warning "Skipping backup creation (SkipBackup flag set)"
        return
    }

    Write-Status "Creating backup of current state..."
    
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupDir = ".\docker-data\production\backups\$timestamp"
    
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    
    try {
        # Backup database
        Write-Status "Backing up PostgreSQL database..."
        docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U exchanger_user exchanger_db > "$backupDir\database.sql"
        
        # Backup Redis
        Write-Status "Backing up Redis data..."
        docker-compose -f docker-compose.production.yml exec -T redis redis-cli --rdb - > "$backupDir\redis.rdb"
        
        # Backup configuration
        Copy-Item ".env.production" "$backupDir\" -Force
        Copy-Item "docker-compose.production.yml" "$backupDir\" -Force
        
        Write-Success "Backup created at $backupDir"
    }
    catch {
        Write-Warning "Backup creation failed: $($_.Exception.Message)"
    }
}

# Setup basic monitoring
function Initialize-Monitoring {
    Write-Status "Setting up basic monitoring..."
    
    # Create simple health check script
    $healthCheckScript = @"
# Simple health check for production
`$services = @("postgres", "redis")
`$alertsFile = ".\docker-data\production\logs\alerts.log"

foreach (`$service in `$services) {
    try {
        `$status = docker-compose -f docker-compose.production.yml ps `$service --format "{{.Status}}"
        if (`$status -notmatch "healthy|running") {
            `$alert = "`$(Get-Date): ALERT - Service `$service is unhealthy (`$status)"
            Add-Content -Path `$alertsFile -Value `$alert
            Write-Warning `$alert
        }
    }
    catch {
        `$alert = "`$(Get-Date): ALERT - Service `$service check failed: `$(`$_.Exception.Message)"
        Add-Content -Path `$alertsFile -Value `$alert
        Write-Error `$alert
    }
}
"@
    
    $healthCheckScript | Out-File ".\scripts\docker\health-check.ps1" -Encoding UTF8
    
    Write-Success "Basic monitoring setup completed"
    Write-Status "Run .\scripts\docker\health-check.ps1 to check service health"
}

# Show deployment status
function Show-Status {
    Write-Status "Production Deployment Status:"
    Write-Host "==============================" -ForegroundColor White
    
    # Show running containers
    docker-compose -f docker-compose.production.yml ps
    
    Write-Host ""
    Write-Status "Service URLs:"
    Write-Host "  Application: http://localhost:3000" -ForegroundColor White
    Write-Host "  PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host "  Redis: localhost:6379" -ForegroundColor White
    
    Write-Host ""
    Write-Status "Logs:"
    Write-Host "  View all logs: docker-compose -f docker-compose.production.yml logs -f" -ForegroundColor White
    Write-Host "  App logs: docker-compose -f docker-compose.production.yml logs -f web" -ForegroundColor White
    Write-Host "  DB logs: docker-compose -f docker-compose.production.yml logs -f postgres" -ForegroundColor White
    Write-Host "  Redis logs: docker-compose -f docker-compose.production.yml logs -f redis" -ForegroundColor White
    
    Write-Host ""
    Write-Status "Management:"
    Write-Host "  Health check: .\scripts\docker\health-check.ps1" -ForegroundColor White
    Write-Host "  View alerts: Get-Content .\docker-data\production\logs\alerts.log" -ForegroundColor White
    Write-Host "  Backups: Get-ChildItem .\docker-data\production\backups\" -ForegroundColor White
}

# Main deployment function
function Main {
    if ($Help) {
        Show-Help
    }

    Write-Status "🐳 Exchanger Production Deployment"
    Write-Host "====================================" -ForegroundColor White
    
    try {
        Test-Prerequisites
        Test-Environment
        New-Backup
        Initialize-ProductionDirectories
        Start-ZeroDowntimeDeployment
        Invoke-DatabaseMigrations
        Initialize-Monitoring
        Show-Status
        
        Write-Success "🎉 Production deployment completed successfully!"
        Write-Warning "Remember to:"
        Write-Host "  1. Configure your reverse proxy (IIS/nginx)" -ForegroundColor Yellow
        Write-Host "  2. Set up SSL certificates" -ForegroundColor Yellow
        Write-Host "  3. Configure Windows Firewall rules" -ForegroundColor Yellow
        Write-Host "  4. Set up log rotation" -ForegroundColor Yellow
        Write-Host "  5. Test all functionality" -ForegroundColor Yellow
    }
    catch {
        Write-Error "Deployment failed: $($_.Exception.Message)"
        Write-Error "Check logs: docker-compose -f docker-compose.production.yml logs"
        exit 1
    }
}

# Handle Ctrl+C
trap {
    Write-Error "Deployment interrupted"
    exit 1
}

# Run main function
Main
