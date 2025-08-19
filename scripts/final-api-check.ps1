# МАКСИМАЛЬНО ТОЧНЫЙ скрипт проверки API
# Учитывает все типы определений endpoints

param([switch]$Detailed = $false)

Write-Host "🔍 МАКСИМАЛЬНО ТОЧНАЯ ПРОВЕРКА API" -ForegroundColor Cyan -BackgroundColor Black

$docsPath = "docs\API_DOCS.md"
$routersPath = "apps\web\src\server\trpc\routers"

# Получаем endpoints из документации
$docsContent = Get-Content $docsPath -Raw
$documentedEndpoints = @()

$headerMatches = [regex]::Matches($docsContent, '###\s+`([^`]+)`')
foreach ($regexMatch in $headerMatches) {
    $endpoint = $regexMatch.Groups[1].Value
    if ($endpoint -match '^[\w\.]+$' -and $endpoint.Contains('.')) {
        $documentedEndpoints += $endpoint
    }
}
$documentedEndpoints = $documentedEndpoints | Sort-Object -Unique

Write-Host "📖 В документации: $($documentedEndpoints.Count) endpoints" -ForegroundColor Green

# Получаем реальные endpoints из кода (УЛУЧШЕННЫЙ ПОИСК)
$codeEndpoints = @()

# Корневые роутеры
$rootRouters = Get-ChildItem -Path $routersPath -Filter "*.ts" | Where-Object { $_.Name -ne "index.ts" }

foreach ($router in $rootRouters) {
    $routerName = [System.IO.Path]::GetFileNameWithoutExtension($router.Name)
    $content = Get-Content $router.FullName -Raw
    
    # Ищем ВСЕ возможные паттерны endpoints
    $patterns = @(
        '(\w+):\s+(publicProcedure|protectedProcedure|operatorOnly|supportOnly|operatorAndSupport)',  # прямые процедуры
        '(\w+):\s+rateLimitMiddleware\.(\w+)',  # через rate limit middleware
        '(\w+):\s+(\w+Procedure)\.',  # другие процедуры
        '(\w+):\s+createTRPCRouter\('  # вложенные роутеры
    )
    
    foreach ($pattern in $patterns) {
        $results = [regex]::Matches($content, $pattern)
        foreach ($regexMatch in $results) {
            $endpointName = $regexMatch.Groups[1].Value
            # Пропускаем служебные слова
            if ($endpointName -notmatch '^(export|import|const|let|var|function|if|for|while)$') {
                $fullEndpoint = "$routerName.$endpointName"
                $codeEndpoints += $fullEndpoint
            }
        }
    }
}

# User роутеры
$userPath = Join-Path $routersPath "user"
if (Test-Path $userPath) {
    $userRouters = Get-ChildItem -Path $userPath -Filter "*.ts"
    
    foreach ($router in $userRouters) {
        $namespace = [System.IO.Path]::GetFileNameWithoutExtension($router.Name)
        $content = Get-Content $router.FullName -Raw
        
        $patterns = @(
            '(\w+):\s+(publicProcedure|protectedProcedure|operatorOnly|supportOnly|operatorAndSupport)',
            '(\w+):\s+rateLimitMiddleware\.(\w+)',
            '(\w+):\s+(\w+Procedure)\.'
        )
        
        foreach ($pattern in $patterns) {
            $results = [regex]::Matches($content, $pattern)
            foreach ($regexMatch in $results) {
                $endpointName = $regexMatch.Groups[1].Value
                if ($endpointName -notmatch '^(export|import|const|let|var|function|if|for|while)$') {
                    $fullEndpoint = "user.$namespace.$endpointName"
                    $codeEndpoints += $fullEndpoint
                }
            }
        }
    }
}

$codeEndpoints = $codeEndpoints | Sort-Object -Unique

Write-Host "💻 В коде: $($codeEndpoints.Count) endpoints" -ForegroundColor Green

# Сравниваем
$onlyInDocs = $documentedEndpoints | Where-Object { $codeEndpoints -notcontains $_ }
$onlyInCode = $codeEndpoints | Where-Object { $documentedEndpoints -notcontains $_ }

if ($Detailed) {
    Write-Host "`n📋 Документированные:" -ForegroundColor Cyan
    $documentedEndpoints | ForEach-Object { Write-Host "  📝 $_" -ForegroundColor Gray }
    
    Write-Host "`n📋 В коде:" -ForegroundColor Cyan  
    $codeEndpoints | ForEach-Object { Write-Host "  💻 $_" -ForegroundColor Gray }
}

Write-Host "`n" + "=" * 60 -ForegroundColor White
Write-Host "📊 ОКОНЧАТЕЛЬНЫЕ РЕЗУЛЬТАТЫ" -ForegroundColor White -BackgroundColor DarkBlue
Write-Host "=" * 60 -ForegroundColor White

if ($onlyInDocs.Count -eq 0 -and $onlyInCode.Count -eq 0) {
    Write-Host "`n✅ АБСОЛЮТНОЕ СООТВЕТСТВИЕ! 🎉" -ForegroundColor Green -BackgroundColor Black
    Write-Host "   Документация на 100% соответствует коду!" -ForegroundColor Green
}
else {
    Write-Host "`n❌ ОБНАРУЖЕНЫ РАЗЛИЧИЯ!" -ForegroundColor Red -BackgroundColor Black
    
    if ($onlyInDocs.Count -gt 0) {
        Write-Host "`n🚨 Только в документации ($($onlyInDocs.Count)):" -ForegroundColor Red
        $onlyInDocs | Sort-Object | ForEach-Object { Write-Host "  ❌ $_" -ForegroundColor Red }
    }
    
    if ($onlyInCode.Count -gt 0) {
        Write-Host "`n📝 Только в коде ($($onlyInCode.Count)):" -ForegroundColor Yellow
        $onlyInCode | Sort-Object | ForEach-Object { Write-Host "  📝 $_" -ForegroundColor Yellow }
    }
}

$totalDocs = $documentedEndpoints.Count
$totalCode = $codeEndpoints.Count
$discrepancies = $onlyInDocs.Count + $onlyInCode.Count
$maxTotal = [Math]::Max($totalDocs, $totalCode)
$accuracy = if ($maxTotal -eq 0) { 0 } else { [Math]::Round((($maxTotal - $discrepancies) * 100) / $maxTotal, 1) }

Write-Host "`n📈 ФИНАЛЬНАЯ СТАТИСТИКА:" -ForegroundColor Cyan
Write-Host "  • Документация: $totalDocs endpoints" -ForegroundColor White
Write-Host "  • Код: $totalCode endpoints" -ForegroundColor White
Write-Host "  • Точность: $accuracy%" -ForegroundColor $(if ($accuracy -eq 100) { "Green" } else { "Yellow" })

exit $(if ($discrepancies -eq 0) { 0 } else { 1 })
