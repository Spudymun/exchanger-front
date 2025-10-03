# 🔍 System Monitoring Script для Load Testing
# Мониторинг состояния системы во время нагрузочного тестирования

param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$RedisUrl = $env:REDIS_URL,
    [int]$IntervalSeconds = 2,
    [int]$DurationMinutes = 5,
    [switch]$Continuous
)

if (-not $DatabaseUrl) {
    Write-Host "❌ DATABASE_URL not found. Please set environment variable or pass -DatabaseUrl parameter" -ForegroundColor Red
    exit 1
}

Write-Host "🔍 Starting System Monitoring for Load Testing" -ForegroundColor Green
Write-Host "📊 Database: $DatabaseUrl" -ForegroundColor Cyan  
Write-Host "⏱️  Interval: $IntervalSeconds seconds" -ForegroundColor Yellow
if (-not $Continuous) {
    Write-Host "🕐 Duration: $DurationMinutes minutes" -ForegroundColor Yellow
}
Write-Host ""

$script:MonitoringData = @()
$startTime = Get-Date
$endTime = $startTime.AddMinutes($DurationMinutes)

function Get-DatabaseMetrics {
    try {
        # Проверяем наличие psql
        $psqlCheck = Get-Command psql -ErrorAction SilentlyContinue
        if (-not $psqlCheck) {
            return @{ Error = "psql not found - install PostgreSQL client tools" }
        }

        # SQL запросы для мониторинга
        $queries = @{
            ActiveConnections = "SELECT count(*) as active_connections FROM pg_stat_activity WHERE state = 'active';"
            TotalConnections  = "SELECT count(*) as total_connections FROM pg_stat_activity WHERE datname = current_database();"
            
            WalletStatus      = "SELECT status, count(*) as count FROM wallets GROUP BY status ORDER BY status;"
            OrderStatus       = "SELECT status, count(*) as count FROM orders WHERE created_at > NOW() - INTERVAL '10 minutes' GROUP BY status ORDER BY status;"
            
            LockedQueries     = @"
SELECT count(*) as locked_queries 
FROM pg_catalog.pg_locks blocked_locks 
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid 
WHERE NOT blocked_locks.granted;
"@
            
            RecentOrders      = "SELECT count(*) as recent_orders FROM orders WHERE created_at > NOW() - INTERVAL '1 minute';"
            RecentUsers       = "SELECT count(*) as recent_users FROM users WHERE created_at > NOW() - INTERVAL '1 minute';"
        }

        $metrics = @{}
        foreach ($queryName in $queries.Keys) {
            try {
                $result = psql $DatabaseUrl -t -c $queries[$queryName] 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $metrics[$queryName] = $result.Trim()
                }
                else {
                    $metrics[$queryName] = "Error"
                }
            }
            catch {
                $metrics[$queryName] = "Error: $($_.Exception.Message)"
            }
        }

        return $metrics
    }
    catch {
        return @{ Error = $_.Exception.Message }
    }
}

function Get-RedisMetrics {
    if (-not $RedisUrl) {
        return @{ Status = "Redis URL not configured" }
    }

    try {
        # Извлекаем хост и порт из Redis URL
        $redisUri = [System.Uri]$RedisUrl
        $redisHost = $redisUri.Host
        $redisPort = $redisUri.Port
        
        if ($redisPort -eq -1) { $redisPort = 6379 }

        # Проверяем наличие redis-cli
        $redisCliCheck = Get-Command redis-cli -ErrorAction SilentlyContinue
        if (-not $redisCliCheck) {
            return @{ Error = "redis-cli not found - install Redis tools" }
        }

        # Redis команды для мониторинга
        $commands = @{
            ConnectedClients = "redis-cli -h $redisHost -p $redisPort info clients | grep connected_clients | cut -d: -f2"
            UsedMemory       = "redis-cli -h $redisHost -p $redisPort info memory | grep used_memory_human | cut -d: -f2"
            TotalCommands    = "redis-cli -h $redisHost -p $redisPort info stats | grep total_commands_processed | cut -d: -f2"
            KeyspaceHits     = "redis-cli -h $redisHost -p $redisPort info stats | grep keyspace_hits | cut -d: -f2"
        }

        $metrics = @{}
        foreach ($commandName in $commands.Keys) {
            try {
                $result = Invoke-Expression $commands[$commandName] 2>$null
                if ($LASTEXITCODE -eq 0) {
                    $metrics[$commandName] = $result.Trim()
                }
                else {
                    $metrics[$commandName] = "Error"
                }
            }
            catch {
                $metrics[$commandName] = "Error"
            }
        }

        return $metrics
    }
    catch {
        return @{ Error = $_.Exception.Message }
    }
}

function Show-SystemStatus {
    param(
        [hashtable]$DbMetrics,
        [hashtable]$RedisMetrics,
        [datetime]$Timestamp
    )

    Clear-Host
    
    Write-Host "🔍 SYSTEM MONITORING - LOAD TESTING" -ForegroundColor Green
    Write-Host "=" * 80 -ForegroundColor Green
    Write-Host "🕐 Time: $($Timestamp.ToString('HH:mm:ss'))" -ForegroundColor White
    Write-Host ""

    # Database Section
    Write-Host "💾 DATABASE METRICS:" -ForegroundColor Yellow
    if ($DbMetrics.Error) {
        Write-Host "   ❌ $($DbMetrics.Error)" -ForegroundColor Red
    }
    else {
        Write-Host "   🔗 Active Connections: $($DbMetrics.ActiveConnections)" -ForegroundColor White
        Write-Host "   📊 Total Connections: $($DbMetrics.TotalConnections)" -ForegroundColor Gray
        Write-Host "   🔒 Locked Queries: $($DbMetrics.LockedQueries)" -ForegroundColor $(if ([int]$DbMetrics.LockedQueries -gt 0) { 'Red' } else { 'Green' })
        Write-Host ""
        Write-Host "   👥 Recent Users (1min): $($DbMetrics.RecentUsers)" -ForegroundColor Cyan
        Write-Host "   📋 Recent Orders (1min): $($DbMetrics.RecentOrders)" -ForegroundColor Cyan
        Write-Host "   ⏳ Queue Length: $($DbMetrics.QueueLength)" -ForegroundColor $(if ([int]$DbMetrics.QueueLength -gt 0) { 'Yellow' } else { 'Green' })
    }

    Write-Host ""
    
    # Redis Section  
    Write-Host "🗄️  REDIS METRICS:" -ForegroundColor Yellow
    if ($RedisMetrics.Error) {
        Write-Host "   ❌ $($RedisMetrics.Error)" -ForegroundColor Red
    }
    elseif ($RedisMetrics.Status) {
        Write-Host "   ℹ️  $($RedisMetrics.Status)" -ForegroundColor Gray
    }
    else {
        Write-Host "   👥 Connected Clients: $($RedisMetrics.ConnectedClients)" -ForegroundColor White
        Write-Host "   💾 Used Memory: $($RedisMetrics.UsedMemory)" -ForegroundColor White
        Write-Host "   📈 Commands Processed: $($RedisMetrics.TotalCommands)" -ForegroundColor Gray
        Write-Host "   🎯 Keyspace Hits: $($RedisMetrics.KeyspaceHits)" -ForegroundColor Gray
    }

    Write-Host ""
    
    # Wallet Status (если доступно)
    if ($DbMetrics.WalletStatus -and -not $DbMetrics.Error) {
        Write-Host "💰 WALLET STATUS:" -ForegroundColor Yellow
        try {
            # Парсим результат wallet status  
            $walletLines = $DbMetrics.WalletStatus -split "`n" | Where-Object { $_.Trim() -ne "" }
            foreach ($line in $walletLines) {
                if ($line -match "(\w+)\s*\|\s*(\d+)") {
                    $status = $matches[1].Trim()
                    $count = $matches[2].Trim()
                    $color = switch ($status) {
                        "available" { "Green" }
                        "allocated" { "Yellow" }  
                        "disabled" { "Red" }
                        default { "White" }
                    }
                    Write-Host "   $status`: $count" -ForegroundColor $color
                }
            }
        }
        catch {
            Write-Host "   Error parsing wallet status" -ForegroundColor Red
        }
    }

    Write-Host ""
    
    # Order Status (если доступно)
    if ($DbMetrics.OrderStatus -and -not $DbMetrics.Error) {
        Write-Host "📋 ORDER STATUS (last 10min):" -ForegroundColor Yellow
        try {
            $orderLines = $DbMetrics.OrderStatus -split "`n" | Where-Object { $_.Trim() -ne "" }
            foreach ($line in $orderLines) {
                if ($line -match "(\w+)\s*\|\s*(\d+)") {
                    $status = $matches[1].Trim()
                    $count = $matches[2].Trim()
                    $color = switch ($status) {
                        "pending" { "Yellow" }
                        "processing" { "Cyan" }
                        "completed" { "Green" }
                        "failed" { "Red" }
                        "cancelled" { "Gray" }
                        default { "White" }
                    }
                    Write-Host "   $status`: $count" -ForegroundColor $color
                }
            }
        }
        catch {
            Write-Host "   Error parsing order status" -ForegroundColor Red
        }
    }

    Write-Host ""
    Write-Host "Press Ctrl+C to stop monitoring..." -ForegroundColor Gray
}

function Save-MonitoringData {
    param(
        [hashtable]$DbMetrics,
        [hashtable]$RedisMetrics,
        [datetime]$Timestamp
    )

    $dataPoint = @{
        Timestamp = $Timestamp
        Database  = $DbMetrics
        Redis     = $RedisMetrics
    }
    
    $script:MonitoringData += $dataPoint
}

# Основной цикл мониторинга
try {
    do {
        $currentTime = Get-Date
        
        # Собираем метрики
        Write-Host "Collecting metrics..." -ForegroundColor Gray
        $dbMetrics = Get-DatabaseMetrics
        $redisMetrics = Get-RedisMetrics
        
        # Отображаем текущее состояние
        Show-SystemStatus -DbMetrics $dbMetrics -RedisMetrics $redisMetrics -Timestamp $currentTime
        
        # Сохраняем данные
        Save-MonitoringData -DbMetrics $dbMetrics -RedisMetrics $redisMetrics -Timestamp $currentTime
        
        # Ждем до следующего цикла
        Start-Sleep -Seconds $IntervalSeconds
        
    } while ($Continuous -or $currentTime -lt $endTime)
    
}
catch {
    Write-Host ""
    Write-Host "🛑 Monitoring stopped: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    Write-Host ""
    Write-Host "📊 Monitoring completed. Collected $($script:MonitoringData.Count) data points." -ForegroundColor Green
    
    # Сохраняем данные в файл
    $outputFile = "monitoring-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $script:MonitoringData | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputFile -Encoding UTF8
    Write-Host "💾 Data saved to: $outputFile" -ForegroundColor Cyan
    
    Write-Host ""
    Write-Host "🏁 Monitoring session finished!" -ForegroundColor Green
}