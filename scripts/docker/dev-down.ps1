# ✅ Development Docker Environment Teardown Script (PowerShell)
# This script stops and cleans up the development environment

param(
    [switch]$Volumes = $false,
    [switch]$Images = $false,
    [switch]$Full = $false
)

# Set cleanup flags
if ($Full) {
    $Volumes = $true
    $Images = $true
}

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

# Check if Docker is running
function Test-Docker {
    Write-Status "Checking Docker..."
    try {
        docker info | Out-Null
        Write-Success "Docker is running"
        return $true
    }
    catch {
        Write-Error "Docker is not running."
        return $false
    }
}

# Stop development containers
function Stop-DevelopmentContainers {
    Write-Status "Stopping development containers..."
    
    try {
        # Stop all containers defined in docker-compose.yml
        docker-compose down --remove-orphans
        Write-Success "Development containers stopped"
    }
    catch {
        Write-Warning "Some containers may have already been stopped"
    }
    
    # Stop any remaining containers that might be running
    Write-Status "Stopping any remaining exchanger containers..."
    try {
        $containers = docker ps -a --filter "name=exchanger" --format "{{.Names}}"
        if ($containers) {
            docker stop $containers
            docker rm $containers
            Write-Success "Remaining containers stopped and removed"
        }
        else {
            Write-Status "No additional containers found"
        }
    }
    catch {
        Write-Warning "Could not stop some containers: $($_.Exception.Message)"
    }
}

# Clean up volumes
function Remove-Volumes {
    if (-not $Volumes) {
        Write-Status "Skipping volume cleanup (use -Volumes to remove volumes)"
        return
    }
    
    Write-Status "Removing development volumes..."
    
    try {
        # Remove volumes with exchanger prefix
        $volumes = docker volume ls --filter "name=exchanger" --format "{{.Name}}"
        if ($volumes) {
            docker volume rm $volumes
            Write-Success "Development volumes removed"
        }
        else {
            Write-Status "No volumes found to remove"
        }
    }
    catch {
        Write-Warning "Could not remove some volumes: $($_.Exception.Message)"
    }
}

# Clean up images
function Remove-Images {
    if (-not $Images) {
        Write-Status "Skipping image cleanup (use -Images to remove images)"
        return
    }
    
    Write-Status "Removing development images..."
    
    try {
        # Remove images related to this project
        $images = docker images --filter "reference=*exchanger*" --format "{{.Repository}}:{{.Tag}}"
        if ($images) {
            docker rmi $images
            Write-Success "Development images removed"
        }
        else {
            Write-Status "No project images found to remove"
        }
        
        # Clean up dangling images
        Write-Status "Cleaning up dangling images..."
        docker image prune -f | Out-Null
        Write-Success "Dangling images cleaned up"
    }
    catch {
        Write-Warning "Could not remove some images: $($_.Exception.Message)"
    }
}

# Clean up networks
function Remove-Networks {
    Write-Status "Cleaning up networks..."
    
    try {
        # Remove unused networks
        docker network prune -f | Out-Null
        Write-Success "Unused networks removed"
    }
    catch {
        Write-Warning "Could not clean up networks: $($_.Exception.Message)"
    }
}

# Show cleanup summary
function Show-CleanupSummary {
    Write-Status "Cleanup Summary:"
    Write-Host ""
    
    Write-Status "Remaining Docker Resources:"
    
    # Show running containers
    Write-Host "Running Containers:" -ForegroundColor White
    try {
        $runningContainers = docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        if ($runningContainers) {
            Write-Host $runningContainers -ForegroundColor Gray
        }
        else {
            Write-Host "  No containers running" -ForegroundColor Gray
        }
    }
    catch {
        Write-Host "  Could not check containers" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    # Show volumes if not cleaned
    if (-not $Volumes) {
        Write-Host "Volumes (use -Volumes to remove):" -ForegroundColor White
        try {
            $volumes = docker volume ls --filter "name=exchanger" --format "{{.Name}}"
            if ($volumes) {
                foreach ($volume in $volumes) {
                    Write-Host "  $volume" -ForegroundColor Gray
                }
            }
            else {
                Write-Host "  No project volumes found" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  Could not check volumes" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    # Show images if not cleaned
    if (-not $Images) {
        Write-Host "Images (use -Images to remove):" -ForegroundColor White
        try {
            $images = docker images --filter "reference=*exchanger*" --format "{{.Repository}}:{{.Tag}}"
            if ($images) {
                foreach ($image in $images) {
                    Write-Host "  $image" -ForegroundColor Gray
                }
            }
            else {
                Write-Host "  No project images found" -ForegroundColor Gray
            }
        }
        catch {
            Write-Host "  Could not check images" -ForegroundColor Gray
        }
        Write-Host ""
    }
    
    Write-Status "Available Options:"
    Write-Host "• .\scripts\docker\dev-down.ps1 -Volumes    # Remove volumes too" -ForegroundColor White
    Write-Host "• .\scripts\docker\dev-down.ps1 -Images     # Remove images too" -ForegroundColor White
    Write-Host "• .\scripts\docker\dev-down.ps1 -Full       # Full cleanup" -ForegroundColor White
    Write-Host "• .\scripts\docker\dev-up.ps1               # Restart environment" -ForegroundColor White
}

# Main execution
function Main {
    Write-Status "🛑 Exchanger Development Environment Teardown"
    Write-Host "===============================================" -ForegroundColor White
    
    if (-not (Test-Docker)) {
        Write-Warning "Docker is not running, but continuing with cleanup..."
    }
    
    try {
        Stop-DevelopmentContainers
        Remove-Volumes
        Remove-Images
        Remove-Networks
        Show-CleanupSummary
        
        Write-Success "🎉 Development environment cleanup completed!"
        Write-Status "Run '.\scripts\docker\dev-up.ps1' to restart the environment"
    }
    catch {
        Write-Error "Cleanup failed: $($_.Exception.Message)"
        exit 1
    }
}

# Handle Ctrl+C
trap {
    Write-Error "Cleanup interrupted"
    exit 1
}

# Run main function
Main
