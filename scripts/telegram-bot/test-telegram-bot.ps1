<#
.SYNOPSIS
    Telegram Bot API Testing Tool - симуляция клиентских и операторских сообщений
.DESCRIPTION
    Профессиональный инструмент для тестирования Telegram бота через webhook API.
    Поддерживает симуляцию различных типов пользователей, команд и сценариев.
.PARAMETER BotUrl
    URL webhook endpoint бота (по умолчанию: http://localhost:3003)
.PARAMETER Scenario
    Тестовый сценарий: client-start, client-message, operator-start, rate-limit, custom
.PARAMETER UserId
    Telegram User ID для симуляции (по умолчанию: случайный)
.PARAMETER Username
    Telegram @username для симуляции (по умолчанию: test_user)
.PARAMETER Message
    Текст сообщения для отправки (для scenario=custom)
.PARAMETER Command
    Команда для отправки: /start, /help, /login и т.д. (для scenario=custom)
.PARAMETER Interactive
    Интерактивный режим с меню выбора сценариев
.PARAMETER Verbose
    Детальный вывод всех HTTP запросов и ответов
.EXAMPLE
    .\scripts\test-telegram-bot.ps1 -Scenario client-start
    Симулирует клиента, отправляющего команду /start
.EXAMPLE
    .\scripts\test-telegram-bot.ps1 -Scenario client-message -Message "Помогите с заявкой"
    Симулирует клиента, отправляющего текстовое сообщение
.EXAMPLE
    .\scripts\test-telegram-bot.ps1 -Scenario operator-start -UserId 621882329
    Симулирует авторизованного оператора (ваш ID)
.EXAMPLE
    .\scripts\test-telegram-bot.ps1 -Interactive
    Запускает интерактивный режим с меню
.NOTES
    Автор: ExchangeGO Development Team
    Дата: October 9, 2025
    Версия: 1.0.0
    Требования: PowerShell 7+, Telegram bot должен быть запущен
#>

param(
    [string]$BotUrl = "http://localhost:3003",
    [ValidateSet("client-start", "client-message", "operator-start", "rate-limit", "custom", "")]
    [string]$Scenario = "",
    [int]$UserId = 0,
    [string]$Username = "test_user",
    [string]$Message = "",
    [string]$Command = "",
    [switch]$Interactive,
    [switch]$Verbose
)

# ============================================================================
# КОНСТАНТЫ И КОНФИГУРАЦИЯ
# ============================================================================

$script:Config = @{
    BotUrl            = $BotUrl
    WebhookEndpoint   = "/api/webhook"
    TimeoutSeconds    = 30
    MaxRetries        = 3
    DefaultOperatorId = 621882329  # Из .env AUTHORIZED_TELEGRAM_OPERATORS
}

$script:Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
    Header  = "Magenta"
    Data    = "White"
}

# ============================================================================
# УТИЛИТАРНЫЕ ФУНКЦИИ
# ============================================================================

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host ("=" * 80) -ForegroundColor $script:Colors.Header
    Write-Host " $Text" -ForegroundColor $script:Colors.Header
    Write-Host ("=" * 80) -ForegroundColor $script:Colors.Header
    Write-Host ""
}

function Write-Success {
    param([string]$Text)
    Write-Host "✅ $Text" -ForegroundColor $script:Colors.Success
}

function Write-ErrorMsg {
    param([string]$Text)
    Write-Host "❌ $Text" -ForegroundColor $script:Colors.Error
}

function Write-InfoMsg {
    param([string]$Text)
    Write-Host "ℹ️  $Text" -ForegroundColor $script:Colors.Info
}

function Write-WarningMsg {
    param([string]$Text)
    Write-Host "⚠️  $Text" -ForegroundColor $script:Colors.Warning
}

function Get-RandomUserId {
    # Генерация реалистичного Telegram User ID (9 цифр)
    return Get-Random -Minimum 100000000 -Maximum 999999999
}

function Get-UpdateId {
    # Генерация уникального update_id
    return [int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
}

# ============================================================================
# СОЗДАНИЕ TELEGRAM UPDATE ОБЪЕКТОВ
# ============================================================================

function New-TelegramMessage {
    param(
        [int]$UserId,
        [string]$Username,
        [string]$Text,
        [string]$FirstName = "Test User"
    )

    return @{
        message_id = Get-Random -Minimum 1 -Maximum 99999
        from       = @{
            id         = $UserId
            username   = $Username
            first_name = $FirstName
            is_bot     = $false
        }
        text       = $Text
        chat       = @{
            id   = $UserId
            type = "private"
        }
        date       = [int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
    }
}

function New-TelegramUpdate {
    param(
        [int]$UserId,
        [string]$Username,
        [string]$Text,
        [string]$FirstName = "Test User"
    )

    $message = New-TelegramMessage -UserId $UserId -Username $Username -Text $Text -FirstName $FirstName

    return @{
        update_id = Get-UpdateId
        message   = $message
    }
}

function New-CallbackQueryUpdate {
    param(
        [int]$UserId,
        [string]$Username,
        [string]$CallbackData,
        [string]$FirstName = "Test Operator"
    )

    return @{
        update_id      = Get-UpdateId
        callback_query = @{
            id      = (Get-Random -Minimum 100000000000000000 -Maximum 999999999999999999).ToString()
            from    = @{
                id         = $UserId
                username   = $Username
                first_name = $FirstName
                is_bot     = $false
            }
            data    = $CallbackData
            message = @{
                message_id = Get-Random -Minimum 1 -Maximum 99999
                text       = "Previous message text"
                chat       = @{
                    id   = $UserId
                    type = "private"
                }
            }
        }
    }
}

# ============================================================================
# ОТПРАВКА WEBHOOK ЗАПРОСОВ
# ============================================================================

function Send-WebhookRequest {
    param(
        [hashtable]$Update,
        [switch]$ShowResponse
    )

    $webhookUrl = "$($script:Config.BotUrl)$($script:Config.WebhookEndpoint)"
    $jsonBody = $Update | ConvertTo-Json -Depth 10

    if ($Verbose -or $ShowResponse) {
        Write-InfoMsg "Отправка webhook на: $webhookUrl"
        Write-Host "Payload:" -ForegroundColor $script:Colors.Data
        Write-Host $jsonBody -ForegroundColor $script:Colors.Data
        Write-Host ""
    }

    try {
        $response = Invoke-WebRequest `
            -Uri $webhookUrl `
            -Method POST `
            -Body $jsonBody `
            -ContentType "application/json" `
            -TimeoutSec $script:Config.TimeoutSeconds `
            -ErrorAction Stop

        if ($Verbose -or $ShowResponse) {
            Write-Success "HTTP Status: $($response.StatusCode) $($response.StatusDescription)"
            Write-Host "Response Body:" -ForegroundColor $script:Colors.Data
            Write-Host $response.Content -ForegroundColor $script:Colors.Data
            Write-Host ""
        }

        return @{
            Success    = $true
            StatusCode = $response.StatusCode
            Body       = $response.Content
        }
    }
    catch {
        Write-ErrorMsg "Ошибка при отправке webhook: $($_.Exception.Message)"
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-ErrorMsg "HTTP Status: $statusCode"
        }

        return @{
            Success = $false
            Error   = $_.Exception.Message
        }
    }
}

# ============================================================================
# ТЕСТОВЫЕ СЦЕНАРИИ
# ============================================================================

function Test-ClientStart {
    param(
        [int]$UserId,
        [string]$Username
    )

    Write-Header "📱 Тестовый сценарий: CLIENT START"
    
    Write-InfoMsg "Симуляция клиента (НЕ оператора)"
    Write-InfoMsg "User ID: $UserId"
    Write-InfoMsg "Username: @$Username"
    Write-InfoMsg "Команда: /start"
    Write-Host ""

    $update = New-TelegramUpdate -UserId $UserId -Username $Username -Text "/start" -FirstName "Test Client"
    $result = Send-WebhookRequest -Update $update -ShowResponse

    if ($result.Success) {
        Write-Success "Клиент должен получить приветственное сообщение"
        Write-InfoMsg "Ожидаемый ответ: 'Добро пожаловать в службу поддержки ExchangeGO!'"
    }

    return $result
}

function Test-ClientMessage {
    param(
        [int]$UserId,
        [string]$Username,
        [string]$Message
    )

    Write-Header "💬 Тестовый сценарий: CLIENT MESSAGE"
    
    Write-InfoMsg "Симуляция клиента, отправляющего обращение в поддержку"
    Write-InfoMsg "User ID: $UserId"
    Write-InfoMsg "Username: @$Username"
    Write-InfoMsg "Сообщение: '$Message'"
    Write-Host ""

    $update = New-TelegramUpdate -UserId $UserId -Username $Username -Text $Message -FirstName "Test Client"
    $result = Send-WebhookRequest -Update $update -ShowResponse

    if ($result.Success) {
        Write-Success "Сообщение отправлено"
        Write-InfoMsg "Клиент должен получить: 'Ваше сообщение получено!'"
        Write-WarningMsg "ВАЖНО: Проверьте Telegram операторов (ID: $($script:Config.DefaultOperatorId))"
        Write-InfoMsg "Операторы должны получить уведомление с текстом сообщения"
    }

    return $result
}

function Test-OperatorStart {
    param(
        [int]$UserId,
        [string]$Username
    )

    Write-Header "👨‍💼 Тестовый сценарий: OPERATOR START"
    
    Write-InfoMsg "Симуляция АВТОРИЗОВАННОГО оператора"
    Write-InfoMsg "User ID: $UserId (должен быть в AUTHORIZED_TELEGRAM_OPERATORS)"
    Write-InfoMsg "Username: @$Username"
    Write-InfoMsg "Команда: /start"
    Write-Host ""

    $update = New-TelegramUpdate -UserId $UserId -Username $Username -Text "/start" -FirstName "Test Operator"
    $result = Send-WebhookRequest -Update $update -ShowResponse

    if ($result.Success) {
        Write-Success "Оператор должен получить операторское приветствие"
        Write-InfoMsg "Ожидаемый ответ: 'Добро пожаловать в ExchangeGO Bot!'"
        Write-InfoMsg "С доступными командами: /login, /takeorder, /orders"
    }

    return $result
}

function Test-RateLimit {
    param(
        [int]$UserId,
        [string]$Username
    )

    Write-Header "🛡️ Тестовый сценарий: RATE LIMITING"
    
    Write-InfoMsg "Симуляция отправки 6 сообщений подряд (лимит: 5 msg/min)"
    Write-InfoMsg "User ID: $UserId"
    Write-InfoMsg "Username: @$Username"
    Write-Host ""

    $successCount = 0
    $rateLimitHit = $false

    for ($i = 1; $i -le 6; $i++) {
        Write-InfoMsg "Сообщение $i из 6..."
        
        $update = New-TelegramUpdate `
            -UserId $UserId `
            -Username $Username `
            -Text "Тестовое сообщение #$i" `
            -FirstName "Test Client"
        
        $result = Send-WebhookRequest -Update $update

        if ($result.Success) {
            $successCount++
            Write-Success "  Сообщение $i принято"
        }
        else {
            Write-ErrorMsg "  Сообщение $i отклонено (возможно rate limit)"
            $rateLimitHit = $true
        }

        Start-Sleep -Milliseconds 500
    }

    Write-Host ""
    Write-InfoMsg "Результат: $successCount из 6 сообщений приняты"
    
    if ($rateLimitHit) {
        Write-Success "Rate limiting работает корректно (отклонено после 5 сообщений)"
    }
    else {
        Write-WarningMsg "Rate limiting НЕ сработал (все 6 сообщений приняты)"
        Write-InfoMsg "Проверьте настройки rate limiting в коде бота"
    }
}

function Test-CustomScenario {
    param(
        [int]$UserId,
        [string]$Username,
        [string]$Text
    )

    Write-Header "🔧 Пользовательский сценарий"
    
    Write-InfoMsg "User ID: $UserId"
    Write-InfoMsg "Username: @$Username"
    Write-InfoMsg "Текст: '$Text'"
    Write-Host ""

    $update = New-TelegramUpdate -UserId $UserId -Username $Username -Text $Text
    $result = Send-WebhookRequest -Update $update -ShowResponse

    return $result
}

# ============================================================================
# ИНТЕРАКТИВНЫЙ РЕЖИМ
# ============================================================================

function Show-InteractiveMenu {
    Write-Header "🤖 Telegram Bot Testing Tool - Интерактивный режим"

    Write-Host "Выберите тестовый сценарий:" -ForegroundColor $script:Colors.Info
    Write-Host ""
    Write-Host "  1. Client /start (клиент открывает бота)" -ForegroundColor White
    Write-Host "  2. Client message (клиент пишет в поддержку)" -ForegroundColor White
    Write-Host "  3. Operator /start (оператор открывает бота)" -ForegroundColor White
    Write-Host "  4. Rate limit test (проверка лимитов)" -ForegroundColor White
    Write-Host "  5. Custom command (произвольная команда)" -ForegroundColor White
    Write-Host "  6. Custom message (произвольное сообщение)" -ForegroundColor White
    Write-Host ""
    Write-Host "  0. Выход" -ForegroundColor Yellow
    Write-Host ""

    $choice = Read-Host "Введите номер сценария"

    switch ($choice) {
        "1" {
            $userId = Get-RandomUserId
            $username = Read-Host "Введите username (по умолчанию: test_client)"
            if (-not $username) { $username = "test_client" }
            
            Test-ClientStart -UserId $userId -Username $username
        }
        "2" {
            $userId = Get-RandomUserId
            $username = Read-Host "Введите username (по умолчанию: test_client)"
            if (-not $username) { $username = "test_client" }
            
            $message = Read-Host "Введите текст сообщения"
            if (-not $message) { $message = "Помогите, не пришла криптовалюта" }
            
            Test-ClientMessage -UserId $userId -Username $username -Message $message
        }
        "3" {
            Write-InfoMsg "Используется operator ID из .env: $($script:Config.DefaultOperatorId)"
            $username = Read-Host "Введите username оператора (по умолчанию: test_operator)"
            if (-not $username) { $username = "test_operator" }
            
            Test-OperatorStart -UserId $script:Config.DefaultOperatorId -Username $username
        }
        "4" {
            $userId = Get-RandomUserId
            $username = Read-Host "Введите username (по умолчанию: test_client)"
            if (-not $username) { $username = "test_client" }
            
            Test-RateLimit -UserId $userId -Username $username
        }
        "5" {
            $userId = Read-Host "Введите User ID (Enter для случайного)"
            if (-not $userId) { $userId = Get-RandomUserId }
            
            $username = Read-Host "Введите username"
            if (-not $username) { $username = "test_user" }
            
            $command = Read-Host "Введите команду (например: /help)"
            if (-not $command) { $command = "/help" }
            
            Test-CustomScenario -UserId $userId -Username $username -Text $command
        }
        "6" {
            $userId = Read-Host "Введите User ID (Enter для случайного)"
            if (-not $userId) { $userId = Get-RandomUserId }
            
            $username = Read-Host "Введите username"
            if (-not $username) { $username = "test_user" }
            
            $text = Read-Host "Введите текст сообщения"
            if (-not $text) { $text = "Тестовое сообщение" }
            
            Test-CustomScenario -UserId $userId -Username $username -Text $text
        }
        "0" {
            Write-InfoMsg "Завершение работы"
            return $false
        }
        default {
            Write-ErrorMsg "Неверный выбор"
            return $true
        }
    }

    Write-Host ""
    $continue = Read-Host "Запустить другой сценарий? (y/n)"
    return ($continue -eq "y" -or $continue -eq "Y" -or $continue -eq "")
}

# ============================================================================
# ПРОВЕРКА ГОТОВНОСТИ СИСТЕМЫ
# ============================================================================

function Test-BotAvailability {
    Write-InfoMsg "Проверка доступности бота..."
    
    try {
        $healthUrl = "$($script:Config.BotUrl)/api/health"
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        
        Write-Success "Бот доступен на $($script:Config.BotUrl)"
        return $true
    }
    catch {
        Write-ErrorMsg "Бот недоступен на $($script:Config.BotUrl)"
        Write-ErrorMsg "Убедитесь что telegram-bot запущен: cd apps/telegram-bot && pnpm dev"
        return $false
    }
}

# ============================================================================
# ГЛАВНАЯ ФУНКЦИЯ
# ============================================================================

function Main {
    Write-Header "🤖 Telegram Bot API Testing Tool"

    # Проверка доступности бота
    if (-not (Test-BotAvailability)) {
        Write-Host ""
        Write-ErrorMsg "Запустите бота перед тестированием:"
        Write-Host "  cd e:\project\kiro\exchanger-front\apps\telegram-bot" -ForegroundColor White
        Write-Host "  pnpm dev" -ForegroundColor White
        exit 1
    }

    Write-Host ""

    # Интерактивный режим
    if ($Interactive -or (-not $Scenario)) {
        do {
            $continue = Show-InteractiveMenu
        } while ($continue)
        
        exit 0
    }

    # Параметры для неинтерактивного режима
    if ($UserId -eq 0) {
        $UserId = Get-RandomUserId
    }

    # Выполнение выбранного сценария
    switch ($Scenario) {
        "client-start" {
            Test-ClientStart -UserId $UserId -Username $Username
        }
        "client-message" {
            if (-not $Message) {
                $Message = "Помогите, не пришла криптовалюта"
            }
            Test-ClientMessage -UserId $UserId -Username $Username -Message $Message
        }
        "operator-start" {
            if ($UserId -eq 0) {
                $UserId = $script:Config.DefaultOperatorId
            }
            Test-OperatorStart -UserId $UserId -Username $Username
        }
        "rate-limit" {
            Test-RateLimit -UserId $UserId -Username $Username
        }
        "custom" {
            $text = if ($Command) { $Command } elseif ($Message) { $Message } else { "/help" }
            Test-CustomScenario -UserId $UserId -Username $Username -Text $text
        }
        default {
            Write-ErrorMsg "Неизвестный сценарий: $Scenario"
            Write-InfoMsg "Используйте -Interactive для интерактивного режима"
            exit 1
        }
    }

    Write-Host ""
    Write-Success "Тестирование завершено!"
}

# Запуск
Main
