#!/usr/bin/env pwsh
# ===========================================
# Docker Compose Development Launch Script
# Поэтапный запуск сервисов с проверками
# ===========================================

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Docker Compose Development Environment..." -ForegroundColor Cyan
Write-Host ""

# ===========================================
# Step 1: Cleanup
# ===========================================
Write-Host "📋 Step 1: Cleanup old containers..." -ForegroundColor Yellow
docker-compose down --remove-orphans
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to cleanup" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Cleanup complete" -ForegroundColor Green
Write-Host ""

# ===========================================
# Step 2: Build images
# ===========================================
Write-Host "📋 Step 2: Building Docker images..." -ForegroundColor Yellow
Write-Host "   Building: web, telegram-bot, bull-board-dashboard" -ForegroundColor Gray

# Install Bull Board dependencies first
Write-Host "   Installing Bull Board dependencies..." -ForegroundColor Gray
Push-Location apps/bull-board-dashboard
npm install
Pop-Location

docker-compose build web telegram-bot bull-board-dashboard
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build images" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Images built successfully" -ForegroundColor Green
Write-Host ""

# ===========================================
# Step 3: Start Infrastructure
# ===========================================
Write-Host "📋 Step 3: Starting infrastructure (PostgreSQL, Redis)..." -ForegroundColor Yellow
docker-compose up -d postgres redis
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start infrastructure" -ForegroundColor Red
    exit 1
}

Write-Host "   Waiting for services to be healthy..." -ForegroundColor Gray
$retries = 30
$healthy = $false
for ($i = 1; $i -le $retries; $i++) {
    $postgresHealth = docker inspect --format='{{.State.Health.Status}}' exchanger-postgres 2>$null
    $redisHealth = docker inspect --format='{{.State.Health.Status}}' exchanger-redis 2>$null
    
    if ($postgresHealth -eq "healthy" -and $redisHealth -eq "healthy") {
        $healthy = $true
        break
    }
    
    Write-Host "   Attempt $i/$retries - PostgreSQL: $postgresHealth, Redis: $redisHealth" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Write-Host "❌ Infrastructure health check timeout" -ForegroundColor Red
    docker-compose logs postgres redis
    exit 1
}
Write-Host "✅ Infrastructure is healthy" -ForegroundColor Green
Write-Host ""

# ===========================================
# Step 4: Start Bull Board
# ===========================================
Write-Host "📋 Step 4: Starting Bull Board Dashboard..." -ForegroundColor Yellow
docker-compose up -d bull-board-dashboard
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Bull Board" -ForegroundColor Red
    exit 1
}

Write-Host "   Waiting for Bull Board to be healthy..." -ForegroundColor Gray
$retries = 20
$healthy = $false
for ($i = 1; $i -le $retries; $i++) {
    $bullHealth = docker inspect --format='{{.State.Health.Status}}' exchanger-bull-board 2>$null
    
    if ($bullHealth -eq "healthy") {
        $healthy = $true
        break
    }
    
    Write-Host "   Attempt $i/$retries - Bull Board: $bullHealth" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Write-Host "⚠️  Bull Board health check timeout (non-critical)" -ForegroundColor Yellow
}
else {
    Write-Host "✅ Bull Board is healthy" -ForegroundColor Green
}
Write-Host ""

# ===========================================
# Step 5: Start Web Application
# ===========================================
Write-Host "📋 Step 5: Starting Web Application..." -ForegroundColor Yellow
docker-compose up -d web
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Web" -ForegroundColor Red
    exit 1
}

Write-Host "   Waiting for Web to be healthy..." -ForegroundColor Gray
$retries = 60
$healthy = $false
for ($i = 1; $i -le $retries; $i++) {
    $webHealth = docker inspect --format='{{.State.Health.Status}}' exchanger-web 2>$null
    
    if ($webHealth -eq "healthy") {
        $healthy = $true
        break
    }
    
    Write-Host "   Attempt $i/$retries - Web: $webHealth" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Write-Host "❌ Web health check timeout" -ForegroundColor Red
    docker-compose logs web
    exit 1
}
Write-Host "✅ Web is healthy" -ForegroundColor Green
Write-Host ""

# ===========================================
# Step 6: Start Telegram Bot
# ===========================================
Write-Host "📋 Step 6: Starting Telegram Bot..." -ForegroundColor Yellow
docker-compose up -d telegram-bot
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to start Telegram Bot" -ForegroundColor Red
    exit 1
}

Write-Host "   Waiting for Telegram Bot to be healthy..." -ForegroundColor Gray
$retries = 60
$healthy = $false
for ($i = 1; $i -le $retries; $i++) {
    $botHealth = docker inspect --format='{{.State.Health.Status}}' exchanger-telegram-bot 2>$null
    
    if ($botHealth -eq "healthy") {
        $healthy = $true
        break
    }
    
    Write-Host "   Attempt $i/$retries - Telegram Bot: $botHealth" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $healthy) {
    Write-Host "❌ Telegram Bot health check timeout" -ForegroundColor Red
    docker-compose logs telegram-bot
    exit 1
}
Write-Host "✅ Telegram Bot is healthy" -ForegroundColor Green
Write-Host ""

# ===========================================
# Step 7: Health Checks
# ===========================================
Write-Host "📋 Step 7: Verifying all health endpoints..." -ForegroundColor Yellow

# Check Web health
Write-Host "   Checking Web health endpoint..." -ForegroundColor Gray
try {
    $webHealth = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method GET -TimeoutSec 5
    if ($webHealth.status -eq "healthy") {
        Write-Host "   ✅ Web: $($webHealth.status)" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Web: $($webHealth.status)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ❌ Web health check failed: $_" -ForegroundColor Red
}

# Check Telegram Bot health
Write-Host "   Checking Telegram Bot health endpoint..." -ForegroundColor Gray
try {
    # Internal only - use docker exec
    $botHealthJson = docker exec exchanger-telegram-bot curl -s http://localhost:3003/api/health
    $botHealth = $botHealthJson | ConvertFrom-Json
    Write-Host "   ✅ Telegram Bot: uptime $($botHealth.uptime)s" -ForegroundColor Green
}
catch {
    Write-Host "   ❌ Telegram Bot health check failed: $_" -ForegroundColor Red
}

# Check Bull Board health
Write-Host "   Checking Bull Board health endpoint..." -ForegroundColor Gray
try {
    $bullHealth = Invoke-RestMethod -Uri "http://localhost:3010/health" -Method GET -TimeoutSec 5
    if ($bullHealth.status -eq "ok") {
        Write-Host "   ✅ Bull Board: $($bullHealth.status)" -ForegroundColor Green
    }
    else {
        Write-Host "   ⚠️  Bull Board: $($bullHealth.status)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   ❌ Bull Board health check failed: $_" -ForegroundColor Red
}

Write-Host ""

# ===========================================
# Step 8: Summary
# ===========================================
Write-Host "🎉 All services started successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "   Web Application:       http://localhost:3000" -ForegroundColor White
Write-Host "   Web Health Check:      http://localhost:3000/api/health" -ForegroundColor White
Write-Host "   Bull Board Dashboard:  http://localhost:3010" -ForegroundColor White
Write-Host "   Bull Board Health:     http://localhost:3010/health" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Useful Commands:" -ForegroundColor Cyan
Write-Host "   View logs:             docker-compose logs -f [service]" -ForegroundColor White
Write-Host "   Stop all:              docker-compose down" -ForegroundColor White
Write-Host "   Restart service:       docker-compose restart [service]" -ForegroundColor White
Write-Host "   View status:           docker-compose ps" -ForegroundColor White
Write-Host ""
Write-Host "💡 Dev Tools (optional):" -ForegroundColor Cyan
Write-Host "   PgAdmin:               docker-compose --profile development up -d pgadmin" -ForegroundColor White
Write-Host "   Redis Commander:       docker-compose --profile development up -d redis-commander" -ForegroundColor White
Write-Host ""
