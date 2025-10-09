# Telegram Bot Testing Module
# Helper functions for simulating Telegram Bot API interactions

<#
.SYNOPSIS
    PowerShell модуль с функциями для тестирования Telegram Bot API
.DESCRIPTION
    Предоставляет функции для создания Telegram Update объектов,
    симуляции различных типов сообщений и отправки webhook запросов
#>

# ============================================================================
# ТИПЫ TELEGRAM UPDATES
# ============================================================================

<#
.SYNOPSIS
    Создает Telegram message объект
.PARAMETER UserId
    Telegram User ID
.PARAMETER Username
    Telegram @username (без @)
.PARAMETER Text
    Текст сообщения
.PARAMETER FirstName
    Имя пользователя
#>
function New-TelegramMessage {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [int]$UserId,
        
        [Parameter(Mandatory)]
        [string]$Username,
        
        [Parameter(Mandatory)]
        [string]$Text,
        
        [Parameter()]
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

<#
.SYNOPSIS
    Создает Telegram update с текстовым сообщением
.PARAMETER UserId
    Telegram User ID
.PARAMETER Username
    Telegram @username (без @)
.PARAMETER Text
    Текст сообщения
.PARAMETER FirstName
    Имя пользователя
#>
function New-TelegramTextUpdate {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [int]$UserId,
        
        [Parameter(Mandatory)]
        [string]$Username,
        
        [Parameter(Mandatory)]
        [string]$Text,
        
        [Parameter()]
        [string]$FirstName = "Test User"
    )

    $message = New-TelegramMessage -UserId $UserId -Username $Username -Text $Text -FirstName $FirstName

    return @{
        update_id = [int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
        message   = $message
    }
}

<#
.SYNOPSIS
    Создает Telegram callback_query update (inline кнопки)
.PARAMETER UserId
    Telegram User ID оператора
.PARAMETER Username
    Telegram @username оператора
.PARAMETER CallbackData
    Callback data (например: take_order_123)
.PARAMETER FirstName
    Имя оператора
#>
function New-TelegramCallbackUpdate {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [int]$UserId,
        
        [Parameter(Mandatory)]
        [string]$Username,
        
        [Parameter(Mandatory)]
        [string]$CallbackData,
        
        [Parameter()]
        [string]$FirstName = "Test Operator"
    )

    return @{
        update_id      = [int]([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())
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
                text       = "Previous notification message"
                chat       = @{
                    id   = $UserId
                    type = "private"
                }
            }
        }
    }
}

# ============================================================================
# ГОТОВЫЕ СЦЕНАРИИ
# ============================================================================

<#
.SYNOPSIS
    Создает update для команды клиента /start
#>
function New-ClientStartUpdate {
    [CmdletBinding()]
    param(
        [Parameter()]
        [int]$UserId = (Get-Random -Minimum 100000000 -Maximum 999999999),
        
        [Parameter()]
        [string]$Username = "test_client"
    )

    return New-TelegramTextUpdate -UserId $UserId -Username $Username -Text "/start" -FirstName "Test Client"
}

<#
.SYNOPSIS
    Создает update для команды клиента /help
#>
function New-ClientHelpUpdate {
    [CmdletBinding()]
    param(
        [Parameter()]
        [int]$UserId = (Get-Random -Minimum 100000000 -Maximum 999999999),
        
        [Parameter()]
        [string]$Username = "test_client"
    )

    return New-TelegramTextUpdate -UserId $UserId -Username $Username -Text "/help" -FirstName "Test Client"
}

<#
.SYNOPSIS
    Создает update для текстового сообщения клиента
#>
function New-ClientMessageUpdate {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$Message,
        
        [Parameter()]
        [int]$UserId = (Get-Random -Minimum 100000000 -Maximum 999999999),
        
        [Parameter()]
        [string]$Username = "test_client"
    )

    return New-TelegramTextUpdate -UserId $UserId -Username $Username -Text $Message -FirstName "Test Client"
}

<#
.SYNOPSIS
    Создает update для команды оператора /start
.PARAMETER OperatorId
    ID авторизованного оператора (из AUTHORIZED_TELEGRAM_OPERATORS)
#>
function New-OperatorStartUpdate {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [int]$OperatorId,
        
        [Parameter()]
        [string]$Username = "test_operator"
    )

    return New-TelegramTextUpdate -UserId $OperatorId -Username $Username -Text "/start" -FirstName "Test Operator"
}

<#
.SYNOPSIS
    Создает update для команды оператора /login
#>
function New-OperatorLoginUpdate {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [int]$OperatorId,
        
        [Parameter()]
        [string]$Username = "test_operator"
    )

    return New-TelegramTextUpdate -UserId $OperatorId -Username $Username -Text "/login" -FirstName "Test Operator"
}

<#
.SYNOPSIS
    Создает update для команды оператора /takeorder
#>
function New-OperatorTakeOrderUpdate {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [int]$OperatorId,
        
        [Parameter(Mandatory)]
        [string]$OrderId,
        
        [Parameter()]
        [string]$Username = "test_operator"
    )

    $command = "/takeorder $OrderId"
    return New-TelegramTextUpdate -UserId $OperatorId -Username $Username -Text $command -FirstName "Test Operator"
}

<#
.SYNOPSIS
    Создает update для callback query (inline кнопка "Взять заявку")
#>
function New-OperatorTakeOrderCallbackUpdate {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [int]$OperatorId,
        
        [Parameter(Mandatory)]
        [string]$OrderId,
        
        [Parameter()]
        [string]$Username = "test_operator"
    )

    $callbackData = "take_order_$OrderId"
    return New-TelegramCallbackUpdate -UserId $OperatorId -Username $Username -CallbackData $callbackData -FirstName "Test Operator"
}

# ============================================================================
# ОТПРАВКА WEBHOOK
# ============================================================================

<#
.SYNOPSIS
    Отправляет Telegram update на webhook endpoint бота
.PARAMETER Update
    Telegram update объект (hashtable)
.PARAMETER BotUrl
    URL бота (по умолчанию: http://localhost:3003)
.PARAMETER TimeoutSeconds
    Таймаут запроса в секундах
.PARAMETER ShowRequest
    Показать детали HTTP запроса
.PARAMETER ShowResponse
    Показать детали HTTP ответа
#>
function Send-TelegramWebhook {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory, ValueFromPipeline)]
        [hashtable]$Update,
        
        [Parameter()]
        [string]$BotUrl = "http://localhost:3003",
        
        [Parameter()]
        [int]$TimeoutSeconds = 30,
        
        [Parameter()]
        [switch]$ShowRequest,
        
        [Parameter()]
        [switch]$ShowResponse
    )

    process {
        $webhookUrl = "$BotUrl/api/webhook"
        $jsonBody = $Update | ConvertTo-Json -Depth 10 -Compress:$false

        if ($ShowRequest) {
            Write-Host "🔹 HTTP Request:" -ForegroundColor Cyan
            Write-Host "  URL: $webhookUrl" -ForegroundColor White
            Write-Host "  Method: POST" -ForegroundColor White
            Write-Host "  Content-Type: application/json" -ForegroundColor White
            Write-Host "  Body:" -ForegroundColor White
            Write-Host $jsonBody -ForegroundColor Gray
            Write-Host ""
        }

        try {
            $response = Invoke-WebRequest `
                -Uri $webhookUrl `
                -Method POST `
                -Body $jsonBody `
                -ContentType "application/json" `
                -TimeoutSec $TimeoutSeconds `
                -ErrorAction Stop

            if ($ShowResponse) {
                Write-Host "✅ HTTP Response:" -ForegroundColor Green
                Write-Host "  Status: $($response.StatusCode) $($response.StatusDescription)" -ForegroundColor White
                Write-Host "  Body:" -ForegroundColor White
                
                try {
                    $responseJson = $response.Content | ConvertFrom-Json
                    $responseJson | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Gray
                }
                catch {
                    Write-Host $response.Content -ForegroundColor Gray
                }
                Write-Host ""
            }

            return @{
                Success           = $true
                StatusCode        = $response.StatusCode
                StatusDescription = $response.StatusDescription
                Body              = $response.Content
                RawResponse       = $response
            }
        }
        catch {
            $errorMessage = $_.Exception.Message
            $statusCode = $null
            
            if ($_.Exception.Response) {
                $statusCode = $_.Exception.Response.StatusCode.value__
            }

            if ($ShowResponse) {
                Write-Host "❌ HTTP Error:" -ForegroundColor Red
                Write-Host "  Message: $errorMessage" -ForegroundColor White
                if ($statusCode) {
                    Write-Host "  Status Code: $statusCode" -ForegroundColor White
                }
                Write-Host ""
            }

            return @{
                Success    = $false
                Error      = $errorMessage
                StatusCode = $statusCode
            }
        }
    }
}

<#
.SYNOPSIS
    Проверяет доступность Telegram бота
.PARAMETER BotUrl
    URL бота (по умолчанию: http://localhost:3003)
#>
function Test-TelegramBotAvailability {
    [CmdletBinding()]
    param(
        [Parameter()]
        [string]$BotUrl = "http://localhost:3003"
    )

    try {
        $healthUrl = "$BotUrl/api/health"
        $response = Invoke-WebRequest -Uri $healthUrl -Method GET -TimeoutSec 5 -ErrorAction Stop
        
        return @{
            Available  = $true
            StatusCode = $response.StatusCode
            Url        = $BotUrl
        }
    }
    catch {
        return @{
            Available = $false
            Error     = $_.Exception.Message
            Url       = $BotUrl
        }
    }
}

# ============================================================================
# BATCH TESTING
# ============================================================================

<#
.SYNOPSIS
    Отправляет несколько updates с задержкой между ними
.PARAMETER Updates
    Массив Telegram update объектов
.PARAMETER BotUrl
    URL бота
.PARAMETER DelayMilliseconds
    Задержка между запросами в миллисекундах
#>
function Send-TelegramWebhookBatch {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [hashtable[]]$Updates,
        
        [Parameter()]
        [string]$BotUrl = "http://localhost:3003",
        
        [Parameter()]
        [int]$DelayMilliseconds = 500
    )

    $results = @()
    $successCount = 0
    $failCount = 0

    for ($i = 0; $i -lt $Updates.Count; $i++) {
        $update = $Updates[$i]
        
        Write-Progress `
            -Activity "Отправка Telegram updates" `
            -Status "Update $($i + 1) из $($Updates.Count)" `
            -PercentComplete (($i / $Updates.Count) * 100)

        $result = $update | Send-TelegramWebhook -BotUrl $BotUrl
        $results += $result

        if ($result.Success) {
            $successCount++
        }
        else {
            $failCount++
        }

        if ($i -lt ($Updates.Count - 1)) {
            Start-Sleep -Milliseconds $DelayMilliseconds
        }
    }

    Write-Progress -Activity "Отправка Telegram updates" -Completed

    return @{
        Total   = $Updates.Count
        Success = $successCount
        Failed  = $failCount
        Results = $results
    }
}

# ============================================================================
# ЭКСПОРТ ФУНКЦИЙ
# ============================================================================

Export-ModuleMember -Function @(
    'New-TelegramMessage',
    'New-TelegramTextUpdate',
    'New-TelegramCallbackUpdate',
    'New-ClientStartUpdate',
    'New-ClientHelpUpdate',
    'New-ClientMessageUpdate',
    'New-OperatorStartUpdate',
    'New-OperatorLoginUpdate',
    'New-OperatorTakeOrderUpdate',
    'New-OperatorTakeOrderCallbackUpdate',
    'Send-TelegramWebhook',
    'Test-TelegramBotAvailability',
    'Send-TelegramWebhookBatch'
)
