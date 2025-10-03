# 🧪 Нагрузочное тестирование Order System (PowerShell) - ИСПРАВЛЕННАЯ ВЕРСИЯ
# 
# ЦЕЛЬ: Тестирование создания 10 одновременных заявок
# АРХИТЕКТУРА: Основано на реальной схеме securityEnhancedCreateExchangeOrderSchema и tRPC API

param(
    [string]$ApiBaseUrl = "http://localhost:3000",
    [int]$ConcurrentOrders = 10,
    [int]$TimeoutSeconds = 30,
    [string]$DatabaseUrl = "postgresql://postgres:password@localhost:5432/exchanger_dev",
    [switch]$DetailedLogging,
    [switch]$SkipCleanup
)

# 🎯 ТЕСТОВЫЕ ДАННЫЕ - ТОЧНО по securityEnhancedCreateExchangeOrderSchema
$TestOrders = @(
    @{
        email             = "loadtest1@example.com"
        cryptoAmount      = 100
        uahAmount         = 4100  # ОБЯЗАТЕЛЬНОЕ поле из схемы
        currency          = "USDT"
        tokenStandard     = "TRC-20"  # OPTIONAL из VALID_TOKEN_STANDARDS
        fixedExchangeRate = 41.0  # OPTIONAL из схемы
        paymentDetails    = @{
            cardNumber  = "4149497803237281"  # 16 цифр без пробелов
            bankDetails = "ПриватБанк"            # XSS protected string
        }
    },
    @{
        email             = "loadtest2@example.com"
        cryptoAmount      = 50
        uahAmount         = 2050
        currency          = "BTC"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "5168745411112222"
            bankDetails = "Монобанк"
        }
    },
    @{
        email             = "loadtest3@example.com"
        cryptoAmount      = 200
        uahAmount         = 8200
        currency          = "ETH"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "4149497833334444"
            bankDetails = "ПриватБанк"
        }
    },
    @{
        email             = "loadtest4@example.com"
        cryptoAmount      = 75
        uahAmount         = 3075
        currency          = "USDT"
        tokenStandard     = "TRC-20"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "5168745455556666"
            bankDetails = "Монобанк"
        }
    },
    @{
        email             = "loadtest5@example.com"
        cryptoAmount      = 120
        uahAmount         = 4920
        currency          = "BTC"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "4149497877778888"
            bankDetails = "ПриватБанк"
        }
    },
    @{
        email             = "loadtest6@example.com"
        cryptoAmount      = 90
        uahAmount         = 3690
        currency          = "ETH"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "5168745499990000"
            bankDetails = "Монобанк"
        }
    },
    @{
        email             = "loadtest7@example.com"
        cryptoAmount      = 150
        uahAmount         = 6150
        currency          = "USDT"
        tokenStandard     = "TRC-20"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "4149497811113333"
            bankDetails = "ПриватБанк"
        }
    },
    @{
        email             = "loadtest8@example.com"
        cryptoAmount      = 60
        uahAmount         = 2460
        currency          = "BTC"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "5168745444447777"
            bankDetails = "Монобанк"
        }
    },
    @{
        email             = "loadtest9@example.com"
        cryptoAmount      = 80
        uahAmount         = 3280
        currency          = "BTC"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "4149497855556666"
            bankDetails = "Монобанк"
        }
    },
    @{
        email             = "loadtest10@example.com"
        cryptoAmount      = 175
        uahAmount         = 7175
        currency          = "USDT"
        tokenStandard     = "TRC-20"
        fixedExchangeRate = 41.0
        paymentDetails    = @{
            cardNumber  = "5168745477778888"
            bankDetails = "ПриватБанк"
        }
    }
)

# 🎯 ФУНКЦИИ

function Write-LoadTestHeader {
    Write-Host "🧪 LOAD TEST: Order Creation System" -ForegroundColor Magenta
    Write-Host "=" * 50 -ForegroundColor Gray
    Write-Host "🚀 Starting load test: $ConcurrentOrders concurrent orders" -ForegroundColor Green
    Write-Host "📊 Target API: $ApiBaseUrl/api/trpc/exchange.createOrder" -ForegroundColor Cyan
    Write-Host "⏱️  Timeout: $TimeoutSeconds seconds" -ForegroundColor Yellow
    Write-Host ""
}

function Clear-TestOrders {
    param([string]$DatabaseUrl)
    
    if ($SkipCleanup) {
        Write-Host "⚠️  Skipping database cleanup (SkipCleanup flag set)" -ForegroundColor Yellow
        return
    }
    
    try {
        Write-Host "🔄 Resetting database..." -ForegroundColor Yellow
        
        # Reset database
        $resetResult = npm run db:reset:web 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database reset successful" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Database reset failed: $resetResult" -ForegroundColor Red
            throw "Database reset failed"
        }
        
        Write-Host "🌱 Seeding database..." -ForegroundColor Yellow
        
        # Seed database
        $seedResult = npm run db:seeds 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Database seeding successful" -ForegroundColor Green
        }
        else {
            Write-Host "❌ Database seeding failed: $seedResult" -ForegroundColor Red
            throw "Database seeding failed"
        }
        
    }
    catch {
        Write-Host "❌ Database preparation failed: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Cannot continue with test" -ForegroundColor Gray
        exit 1
    }
}

function New-UniqueTestOrders {
    param([int]$Count)
    
    $timestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
    $randomSeed = Get-Random -Minimum 1000 -Maximum 9999
    $orders = @()
    
    for ($i = 1; $i -le $Count; $i++) {
        $uniqueId = "$timestamp$randomSeed$i"
        $orders += @{
            email             = "loadtest$i-$uniqueId@example.com"  # COMPLETELY UNIQUE email
            cryptoAmount      = 50 + ($i * 15) + (Get-Random -Minimum 1 -Maximum 20)  # Random amounts
            uahAmount         = (50 + ($i * 15) + (Get-Random -Minimum 1 -Maximum 20)) * 41
            currency          = @("USDT", "BTC", "ETH")[$i % 3]
            tokenStandard     = if (@("USDT", "BTC", "ETH")[$i % 3] -eq "USDT") { "TRC-20" } else { $null }
            fixedExchangeRate = 41.0
            paymentDetails    = @{
                # Generate valid 16-digit card numbers (exactly 16 digits)
                cardNumber  = "$(4149)$(4978)$(1000 + ($i % 100))$(2000 + ($i % 100))"
                bankDetails = @("ПриватБанк", "Монобанк", "ПУМБ", "Райффайзен")[$i % 4]
            }
        }
    }
    
    return $orders
}

function Invoke-CreateOrder {
    param(
        [hashtable]$OrderData,
        [int]$OrderIndex
    )
    
    $startTime = Get-Date
    
    try {
        if ($DetailedLogging) {
            Write-Host "📤 Order $($OrderIndex + 1): Sending request..." -ForegroundColor Blue
        }

        # 🎯 ПРАВИЛЬНЫЙ tRPC запрос (проверено curl'ом)
        $uri = "$ApiBaseUrl/api/trpc/exchange.createOrder"
        
        # Правильный формат tRPC запроса
        $tRPCRequest = @{
            json = @{
                email             = $OrderData.email
                cryptoAmount      = $OrderData.cryptoAmount
                uahAmount         = $OrderData.uahAmount
                currency          = $OrderData.currency
                tokenStandard     = $OrderData.tokenStandard
                fixedExchangeRate = $OrderData.fixedExchangeRate
                paymentDetails    = $OrderData.paymentDetails
            }
        }
        
        $body = $tRPCRequest | ConvertTo-Json -Depth 5

        $headers = @{
            'Content-Type' = 'application/json'
            'User-Agent'   = 'load-test-powershell/1.0'
        }

        $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -Headers $headers -TimeoutSec $TimeoutSeconds
        
        $responseTime = (Get-Date) - $startTime
        $responseTimeMs = [math]::Round($responseTime.TotalMilliseconds)
        
        if ($DetailedLogging) {
            Write-Host "✅ Order $($OrderIndex + 1): Success ($responseTimeMs ms)" -ForegroundColor Green
        }
        
        return @{
            Success        = $true
            OrderIndex     = $OrderIndex + 1
            ResponseTime   = $responseTimeMs
            OrderId        = $response.result.orderId
            Status         = $response.result.status
            DepositAddress = $response.result.depositAddress
        }
        
    }
    catch {
        $responseTime = (Get-Date) - $startTime
        $responseTimeMs = [math]::Round($responseTime.TotalMilliseconds)
        
        Write-Host "❌ Order $($OrderIndex + 1): Error - $($_.Exception.Message)" -ForegroundColor Red
        
        return @{
            Success      = $false
            OrderIndex   = $OrderIndex + 1
            ResponseTime = $responseTimeMs
            Error        = $_.Exception.Message
            StatusCode   = $_.Exception.Response.StatusCode
            ResponseBody = if ($_.ErrorDetails.Message) { $_.ErrorDetails.Message } else { "No response details" }
        }
    }
}

function Start-ConcurrentTest {
    Write-Host "🔥 Running $ConcurrentOrders concurrent requests..." -ForegroundColor Yellow
    
    # Generate unique test orders with timestamp
    $TestOrders = New-UniqueTestOrders -Count $ConcurrentOrders
    
    $jobs = @()
    $startTime = Get-Date
    
    # Создаем задачи для параллельного выполнения
    for ($i = 0; $i -lt $ConcurrentOrders; $i++) {
        $orderData = $TestOrders[$i % $TestOrders.Count]
        
        $scriptBlock = {
            param($OrderData, $OrderIndex, $ApiBaseUrl, $TimeoutSeconds, $DetailedLogging)
            
            # Функция создания заявки внутри Job
            function Invoke-CreateOrderInJob {
                param($OrderData, $OrderIndex, $ApiBaseUrl, $TimeoutSeconds, $DetailedLogging)
                
                $startTime = Get-Date
                
                try {
                    $uri = "$ApiBaseUrl/api/trpc/exchange.createOrder"
                    
                    # Правильный формат tRPC запроса
                    $tRPCRequest = @{
                        json = @{
                            email             = $OrderData.email
                            cryptoAmount      = $OrderData.cryptoAmount
                            uahAmount         = $OrderData.uahAmount
                            currency          = $OrderData.currency
                            tokenStandard     = $OrderData.tokenStandard
                            fixedExchangeRate = $OrderData.fixedExchangeRate
                            paymentDetails    = $OrderData.paymentDetails
                        }
                    }
                    
                    $body = $tRPCRequest | ConvertTo-Json -Depth 5
                    
                    $headers = @{
                        'Content-Type' = 'application/json'
                        'User-Agent'   = 'load-test-powershell-job/1.0'
                    }
                    
                    $response = Invoke-RestMethod -Uri $uri -Method POST -Body $body -Headers $headers -TimeoutSec $TimeoutSeconds
                    
                    $responseTime = (Get-Date) - $startTime
                    $responseTimeMs = [math]::Round($responseTime.TotalMilliseconds)
                    
                    return @{
                        Success        = $true
                        OrderIndex     = $OrderIndex + 1
                        ResponseTime   = $responseTimeMs
                        OrderId        = $response.result.orderId
                        Status         = $response.result.status
                        DepositAddress = $response.result.depositAddress
                    }
                    
                }
                catch {
                    $responseTime = (Get-Date) - $startTime
                    $responseTimeMs = [math]::Round($responseTime.TotalMilliseconds)
                    
                    return @{
                        Success      = $false
                        OrderIndex   = $OrderIndex + 1
                        ResponseTime = $responseTimeMs
                        Error        = $_.Exception.Message
                        StatusCode   = $_.Exception.Response.StatusCode
                        ResponseBody = if ($_.Exception.Response) { 
                            try { 
                                $_.Exception.Response.Content.ReadAsStringAsync().Result 
                            }
                            catch { 
                                "Could not read response body" 
                            } 
                        }
                        else { 
                            "No response content" 
                        }
                    }
                }
            }
            
            return Invoke-CreateOrderInJob -OrderData $OrderData -OrderIndex $OrderIndex -ApiBaseUrl $ApiBaseUrl -TimeoutSeconds $TimeoutSeconds -DetailedLogging $DetailedLogging
        }
        
        $job = Start-Job -ScriptBlock $scriptBlock -ArgumentList $orderData, $i, $ApiBaseUrl, $TimeoutSeconds, $DetailedLogging
        $jobs += $job
        
        if ($DetailedLogging) {
            Write-Host "📋 Job $($i + 1): Started (ID: $($job.Id))" -ForegroundColor Gray
        }
    }
    
    # Ожидаем завершения всех задач
    Write-Host "⏳ Waiting for all jobs to complete..." -ForegroundColor Yellow
    $results = $jobs | Wait-Job | Receive-Job
    $jobs | Remove-Job
    
    $totalTime = (Get-Date) - $startTime
    $totalTimeMs = [math]::Round($totalTime.TotalMilliseconds)
    
    return @{
        Results   = $results
        TotalTime = $totalTimeMs
        StartTime = $startTime
        EndTime   = Get-Date
    }
}

function Write-TestResults {
    param($TestResults)
    
    $results = $TestResults.Results
    $successful = $results | Where-Object { $_.Success -eq $true }
    $failed = $results | Where-Object { $_.Success -eq $false }
    
    Write-Host ""
    Write-Host "📊 LOAD TEST RESULTS" -ForegroundColor Magenta
    Write-Host "=" * 40 -ForegroundColor Gray
    Write-Host "📈 Total Requests: $($results.Count)" -ForegroundColor White
    Write-Host "✅ Successful: $($successful.Count)" -ForegroundColor Green
    Write-Host "❌ Failed: $($failed.Count)" -ForegroundColor Red
    Write-Host "⏱️  Total Time: $($TestResults.TotalTime) ms" -ForegroundColor Yellow
    
    if ($successful.Count -gt 0) {
        $avgResponseTime = ($successful | Measure-Object -Property ResponseTime -Average).Average
        $minResponseTime = ($successful | Measure-Object -Property ResponseTime -Minimum).Minimum
        $maxResponseTime = ($successful | Measure-Object -Property ResponseTime -Maximum).Maximum
        
        Write-Host "📊 Response Time Stats (successful requests):" -ForegroundColor Cyan
        Write-Host "   Average: $([math]::Round($avgResponseTime)) ms" -ForegroundColor White
        Write-Host "   Min: $minResponseTime ms" -ForegroundColor White
        Write-Host "   Max: $maxResponseTime ms" -ForegroundColor White
    }
    
    if ($failed.Count -gt 0) {
        Write-Host ""
        Write-Host "❌ Failed Requests:" -ForegroundColor Red
        foreach ($failure in $failed) {
            Write-Host "   Order $($failure.OrderIndex): $($failure.Error)" -ForegroundColor Red
            if ($failure.ResponseBody -and $failure.ResponseBody -ne "No response details") {
                Write-Host "      Response: $($failure.ResponseBody)" -ForegroundColor Yellow
            }
        }
    }
    
    if ($successful.Count -gt 0 -and $DetailedLogging) {
        Write-Host ""
        Write-Host "✅ Successful Orders:" -ForegroundColor Green
        foreach ($success in $successful) {
            Write-Host "   Order $($success.OrderIndex): ID=$($success.OrderId), Status=$($success.Status), Time=$($success.ResponseTime)ms" -ForegroundColor Green
        }
    }
    
    Write-Host ""
    if ($failed.Count -eq 0) {
        Write-Host "🎉 All requests completed successfully!" -ForegroundColor Green
    }
    elseif ($successful.Count -gt ($failed.Count * 2)) {
        Write-Host "⚠️  Test completed with some failures" -ForegroundColor Yellow
    }
    else {
        Write-Host "🚨 Test completed with significant failures" -ForegroundColor Red
    }
}

# 🚀 ГЛАВНАЯ ФУНКЦИЯ
function Start-LoadTest {
    Write-LoadTestHeader
    
    # Clear existing test orders before starting
    Clear-TestOrders -DatabaseUrl $DatabaseUrl
    
    # Проверка доступности API
    try {
        Write-Host "🔍 Checking API availability..." -ForegroundColor Yellow
        $healthCheck = Invoke-RestMethod -Uri "$ApiBaseUrl/api/health" -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ API is accessible" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ API is not accessible: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "⚠️  Continuing with load test anyway..." -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # Запуск нагрузочного тестирования
    $testResults = Start-ConcurrentTest
    
    # Отображение результатов
    Write-TestResults -TestResults $testResults
}

# 🎯 ЗАПУСК ТЕСТИРОВАНИЯ
Start-LoadTest

Write-Host "🏁 Load test completed!" -ForegroundColor Green