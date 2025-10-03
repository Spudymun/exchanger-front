# 🔍 Pre-Test System Health Check
# Проверка готовности системы к нагрузочному тестированию

param(
    [string]$ApiBaseUrl = "http://localhost:3000",
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$RedisUrl = $env:REDIS_URL
)

Write-Host "🔍 SYSTEM HEALTH CHECK FOR LOAD TESTING" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""

$script:HealthScore = 0
$script:MaxScore = 0
$script:Issues = @()

function Test-Component {
    param(
        [string]$Name,
        [scriptblock]$TestScript,
        [int]$Points = 1,
        [string]$FailureMessage = ""
    )
    
    $script:MaxScore += $Points
    
    try {
        Write-Host "🔍 Testing $Name..." -ForegroundColor Yellow -NoNewline
        
        $result = & $TestScript
        
        if ($result) {
            Write-Host " ✅ PASSED" -ForegroundColor Green
            $script:HealthScore += $Points
            return $true
        }
        else {
            Write-Host " ❌ FAILED" -ForegroundColor Red
            if ($FailureMessage) {
                $script:Issues += "❌ $Name`: $FailureMessage"
            }
            return $false
        }
    }
    catch {
        Write-Host " ❌ ERROR" -ForegroundColor Red
        $script:Issues += "❌ $Name`: $($_.Exception.Message)"
        return $false
    }
}

# 🎯 TEST 1: API Availability
Test-Component -Name "API Health Endpoint" -Points 2 -TestScript {
    try {
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/api/health" -TimeoutSec 5 -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
} -FailureMessage "API not responding at $ApiBaseUrl/api/health"

# 🎯 TEST 2: tRPC Endpoint
Test-Component -Name "tRPC Endpoint" -Points 2 -TestScript {
    try {
        # Тестируем с невалидными данными - должен вернуть ошибку валидации, но не 404
        $body = @{ invalid = "data" } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$ApiBaseUrl/api/trpc" -Method POST -Body $body -ContentType "application/json" -TimeoutSec 5 -ErrorAction SilentlyContinue
        return $true
    }
    catch {
        # Ошибка 400 (валидация) = хорошо, 404 = плохо
        if ($_.Exception.Response.StatusCode -eq 400) {
            return $true
        }
        return $false
    }
} -FailureMessage "tRPC endpoint not available"

# 🎯 TEST 3: Database Connection
Test-Component -Name "Database Connection" -Points 3 -TestScript {
    if (-not $DatabaseUrl) {
        return $false
    }
    
    try {
        $psqlCheck = Get-Command psql -ErrorAction SilentlyContinue
        if (-not $psqlCheck) {
            return $false
        }
        
        $result = psql $DatabaseUrl -c "SELECT 1;" 2>$null
        return $LASTEXITCODE -eq 0
    }
    catch {
        return $false
    }
} -FailureMessage "Cannot connect to database. Check DATABASE_URL and psql installation"

# 🎯 TEST 4: Required Tables
Test-Component -Name "Database Schema" -Points 2 -TestScript {
    if (-not $DatabaseUrl) {
        return $false
    }
    
    try {
        $tables = @('users', 'orders', 'wallets', 'sessions')
        foreach ($table in $tables) {
            $result = psql $DatabaseUrl -c "SELECT count(*) FROM $table LIMIT 1;" 2>$null
            if ($LASTEXITCODE -ne 0) {
                return $false
            }
        }
        return $true
    }
    catch {
        return $false
    }
} -FailureMessage "Required tables missing. Run Prisma migrations"

# 🎯 TEST 5: Available Wallets
Test-Component -Name "Available Wallets" -Points 2 -TestScript {
    if (-not $DatabaseUrl) {
        return $false
    }
    
    try {
        $result = psql $DatabaseUrl -t -c "SELECT count(*) FROM wallets WHERE status = 'available';" 2>$null
        if ($LASTEXITCODE -eq 0) {
            $count = [int]$result.Trim()
            return $count -gt 0
        }
        return $false
    }
    catch {
        return $false
    }
} -FailureMessage "No available wallets found. Add wallets to database"

# 🎯 TEST 6: Redis Connection (Optional)
if ($RedisUrl) {
    Test-Component -Name "Redis Connection" -Points 1 -TestScript {
        try {
            $redisUri = [System.Uri]$RedisUrl
            $redisHost = $redisUri.Host
            $redisPort = if ($redisUri.Port -eq -1) { 6379 } else { $redisUri.Port }
            
            $redisCliCheck = Get-Command redis-cli -ErrorAction SilentlyContinue
            if (-not $redisCliCheck) {
                return $false
            }
            
            $result = redis-cli -h $redisHost -p $redisPort ping 2>$null
            return $result -eq "PONG"
        }
        catch {
            return $false
        }
    } -FailureMessage "Cannot connect to Redis. Check REDIS_URL and redis-cli installation"
}
else {
    Write-Host "🔍 Testing Redis Connection... ⚠️  SKIPPED (REDIS_URL not set)" -ForegroundColor Yellow
    $script:Issues += "⚠️  Redis not configured - queue functionality may not work"
}

# 🎯 TEST 7: Environment Variables
Test-Component -Name "Environment Variables" -Points 1 -TestScript {
    $required = @('DATABASE_URL')
    $missing = @()
    
    foreach ($var in $required) {
        if (-not (Get-Variable -Name $var -ValueOnly -ErrorAction SilentlyContinue) -and -not [Environment]::GetEnvironmentVariable($var)) {
            $missing += $var
        }
    }
    
    return $missing.Count -eq 0
} -FailureMessage "Missing required environment variables"

# 🎯 TEST 8: System Resources
Test-Component -Name "System Resources" -Points 1 -TestScript {
    try {
        # Проверяем доступную память
        $memory = Get-CimInstance Win32_ComputerSystem
        $totalMemoryGB = [math]::Round($memory.TotalPhysicalMemory / 1GB, 2)
        
        # Проверяем загрузку CPU
        $cpu = Get-CimInstance Win32_Processor | Measure-Object -Property LoadPercentage -Average
        $avgCpuLoad = $cpu.Average
        
        # Критерии: больше 2GB RAM и загрузка CPU меньше 80%
        return $totalMemoryGB -gt 2 -and $avgCpuLoad -lt 80
    }
    catch {
        return $true # Если не можем проверить, считаем что все ок
    }
} -FailureMessage "System resources may be insufficient for load testing"

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green

# Подсчет результатов
$healthPercentage = [math]::Round(($script:HealthScore / $script:MaxScore) * 100, 1)

Write-Host "📊 HEALTH CHECK RESULTS:" -ForegroundColor Yellow
Write-Host "   Score: $script:HealthScore/$script:MaxScore ($healthPercentage%)" -ForegroundColor White

if ($healthPercentage -ge 90) {
    Write-Host "   Status: ✅ EXCELLENT - Ready for load testing!" -ForegroundColor Green
}
elseif ($healthPercentage -ge 70) {
    Write-Host "   Status: ⚠️  GOOD - Minor issues, but can proceed" -ForegroundColor Yellow
}
elseif ($healthPercentage -ge 50) {
    Write-Host "   Status: ⚠️  FAIR - Several issues need attention" -ForegroundColor Yellow
}
else {
    Write-Host "   Status: ❌ POOR - Major issues must be fixed first" -ForegroundColor Red
}

Write-Host ""

# Показать проблемы
if ($script:Issues.Count -gt 0) {
    Write-Host "🔍 IDENTIFIED ISSUES:" -ForegroundColor Red
    foreach ($issue in $script:Issues) {
        Write-Host "   $issue" -ForegroundColor Red
    }
    Write-Host ""
}

# Рекомендации
Write-Host "💡 RECOMMENDATIONS:" -ForegroundColor Cyan

if ($healthPercentage -ge 90) {
    Write-Host "   🎯 System is ready for load testing" -ForegroundColor Green
    Write-Host "   🚀 You can proceed with: .\scripts\load-test-orders.ps1" -ForegroundColor Green
}
else {
    Write-Host "   🔧 Fix the issues above before load testing" -ForegroundColor Yellow
    
    if ($script:HealthScore -lt ($script:MaxScore * 0.7)) {
        Write-Host "   ⚠️  Critical issues detected - load test may fail" -ForegroundColor Red
    }
}

Write-Host ""

# Полезные команды
Write-Host "🛠️  QUICK FIXES:" -ForegroundColor Cyan
Write-Host "   🗄️  Start database: docker-compose up postgres -d" -ForegroundColor Gray
Write-Host "   🔄 Run migrations: cd packages/session-management && npx prisma migrate dev" -ForegroundColor Gray
Write-Host "   🚀 Start app: npm run dev" -ForegroundColor Gray
Write-Host "   💾 Start Redis: docker-compose up redis -d" -ForegroundColor Gray

Write-Host ""
Write-Host "=" * 60 -ForegroundColor Green

# Возвращаем код завершения для автоматизации
if ($healthPercentage -ge 70) {
    exit 0
}
else {
    exit 1
}