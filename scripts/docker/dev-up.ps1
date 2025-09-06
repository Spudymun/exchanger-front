# ✅ Development Docker Environment Setup Script (PowerShell)
# This script initializes the complete development environment

param(
    [switch]$SkipDatabase = $false
)

# Colors for output
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

# Check if Docker is running
function Test-Docker {
    Write-Status "Checking Docker..."
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running. Please start Docker and try again."
        exit 1
    }
}

# Check if .env file exists
function Test-Environment {
    Write-Status "Checking environment configuration..."
    if (-not (Test-Path ".env")) {
        Write-Warning ".env file not found. Creating from .env.example..."
        Copy-Item ".env.example" ".env"
        Write-Success "Created .env file from template"
        Write-Warning "Please review and update .env file with your settings"
    }
    else {
        Write-Success ".env file exists"
    }
}

# Stop any existing containers
function Stop-ExistingContainers {
    Write-Status "Cleaning up existing containers..."
    try {
        docker-compose down --remove-orphans
    }
    catch {
        # Ignore errors during cleanup
    }
    Write-Success "Cleanup completed"
}

# Start the development environment
function Start-DevelopmentEnvironment {
    Write-Status "Starting development environment..."
    
    # Start core services (postgres, redis)
    Write-Status "Starting core services (PostgreSQL, Redis)..."
    docker-compose up -d postgres redis
    
    # Wait for services to be healthy
    Write-Status "Waiting for services to be ready..."
    
    # Wait for PostgreSQL
    Write-Status "Waiting for PostgreSQL..."
    $maxAttempts = 30
    $attempt = 0
    
    do {
        $attempt++
        try {
            docker-compose exec postgres pg_isready -U exchanger_user -d exchanger_db | Out-Null
            break
        }
        catch {
            if ($attempt -ge $maxAttempts) {
                throw "PostgreSQL failed to start after $maxAttempts attempts"
            }
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 2
        }
    } while ($attempt -lt $maxAttempts)
    
    Write-Host ""
    Write-Success "PostgreSQL is ready"
    
    # Wait for Redis
    Write-Status "Waiting for Redis..."
    $attempt = 0
    
    do {
        $attempt++
        try {
            docker-compose exec redis redis-cli ping | Out-Null
            break
        }
        catch {
            if ($attempt -ge $maxAttempts) {
                throw "Redis failed to start after $maxAttempts attempts"
            }
            Write-Host "." -NoNewline
            Start-Sleep -Seconds 1
        }
    } while ($attempt -lt $maxAttempts)
    
    Write-Host ""
    Write-Success "Redis is ready"
    
    # Start development tools (pgAdmin, Redis Commander, etc.)
    Write-Status "Starting development tools..."
    try {
        docker-compose --profile development up -d
    }
    catch {
        Write-Warning "Some development tools failed to start, but core services are running"
    }
    
    Write-Success "Development environment is ready!"
}

# Run database migrations
function Initialize-Database {
    if ($SkipDatabase) {
        Write-Warning "Skipping database setup (SkipDatabase flag set)"
        return
    }

    Write-Status "Setting up database..."
    
    # Check if we need to run Prisma migrations
    if (Test-Path "packages/session-management/prisma") {
        Write-Status "Running Prisma database setup..."
        
        Push-Location "packages/session-management"
        
        try {
            # Generate Prisma client
            Write-Status "Generating Prisma client..."
            npx prisma generate
            
            # Push database schema
            Write-Status "Pushing database schema..."
            npx prisma db push
            
            Write-Success "Database setup completed"
        }
        catch {
            Write-Warning "Database setup failed: $($_.Exception.Message)"
            Write-Warning "You may need to run 'npx prisma db push' manually later"
        }
        finally {
            Pop-Location
        }
    }
    else {
        Write-Warning "Prisma directory not found, skipping database setup"
    }
}

# Show service status
function Show-ServiceStatus {
    Write-Status "Service Status:"
    Write-Host ""
    docker-compose ps
    Write-Host ""
    
    Write-Status "Available Services:"
    Write-Host "🗄️  PostgreSQL: localhost:5432" -ForegroundColor White
    Write-Host "🔴 Redis: localhost:6379" -ForegroundColor White
    Write-Host "🔧 PgAdmin: http://localhost:8080 (admin@exchanger.local / admin123)" -ForegroundColor White
    Write-Host "🔧 Redis Commander: http://localhost:8081 (admin / admin123)" -ForegroundColor White
    Write-Host ""
    
    Write-Status "Database Connection:"
    Write-Host "Host: localhost" -ForegroundColor White
    Write-Host "Port: 5432" -ForegroundColor White
    Write-Host "Database: exchanger_db" -ForegroundColor White
    Write-Host "Username: exchanger_user" -ForegroundColor White
    Write-Host "Password: exchanger_password" -ForegroundColor White
    Write-Host ""
    
    Write-Status "Next Steps:"
    Write-Host "1. Update your .env file if needed" -ForegroundColor White
    Write-Host "2. Run 'npm run dev' to start the development server" -ForegroundColor White
    Write-Host "3. Access PgAdmin at http://localhost:8080 to manage the database" -ForegroundColor White
    Write-Host "4. Access Redis Commander at http://localhost:8081 to monitor Redis" -ForegroundColor White
}

# Main execution
function Main {
    Write-Status "🐳 Exchanger Development Environment Setup"
    Write-Host "==========================================" -ForegroundColor White
    
    try {
        Test-Docker
        Test-Environment
        Stop-ExistingContainers
        Start-DevelopmentEnvironment
        Initialize-Database
        Show-ServiceStatus
        
        Write-Success "🎉 Development environment setup completed!"
        Write-Status "Run '.\scripts\docker\dev-down.ps1' to stop the environment"
    }
    catch {
        Write-Error "Setup failed: $($_.Exception.Message)"
        Write-Error "Run 'docker-compose logs' to see detailed error logs"
        exit 1
    }
}

# Handle Ctrl+C
trap {
    Write-Error "Setup interrupted"
    exit 1
}

# Run main function
Main
