#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Реальный тест Telegram бота с вашим ID
    
.DESCRIPTION
    Скрипт для тестирования реального получения сообщений в Telegram
    Ваш ID: 621882329 (оператор)
    
.EXAMPLE
    .\scripts\test-telegram-real.ps1
#>

param(
    [string]$BotUrl = "http://localhost:3003"
)

# Импорт модуля
$modulePath = Join-Path $PSScriptRoot "telegram-bot\TelegramBotTester.psm1"
Import-Module $modulePath -Force

# Цвета для вывода
$script:Colors = @{
    Success = "Green"
    Error   = "Red"
    Warning = "Yellow"
    Info    = "Cyan"
    Header  = "Magenta"
}

function Write-ColorText {
    param(
        [string]$Text,
        [string]$Color = "White"
    )
    Write-Host $Text -ForegroundColor $Color
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-ColorText "=" * 80 -Color $script:Colors.Header
    Write-ColorText " $Title" -Color $script:Colors.Header
    Write-ColorText "=" * 80 -Color $script:Colors.Header
    Write-Host ""
}

function Show-Menu {
    Write-Section "🎯 РЕАЛЬНЫЙ ТЕСТ TELEGRAM БОТА"
    
    Write-ColorText "📱 Ваш Telegram ID: 621882329 (оператор)" -Color $script:Colors.Info
    Write-ColorText "🤖 Бот: @exchangego_operators_bot" -Color $script:Colors.Info
    Write-Host ""
    
    Write-ColorText "Выберите тест:" -Color $script:Colors.Header
    Write-Host ""
    Write-Host "  1. 💬 Клиент пишет в поддержку (ВЫ получите уведомление в Telegram)"
    Write-Host "  2. 🔄 Несколько клиентов пишут (проверка массовых уведомлений)"
    Write-Host "  3. ⚡ Тест оператора (проверка команд /start, /login)"
    Write-Host "  4. 🎲 Rate limit тест (6 сообщений подряд)"
    Write-Host ""
    Write-Host "  0. Выход"
    Write-Host ""
}

function Test-ClientToOperatorNotification {
    Write-Section "💬 ТЕСТ: Клиент → Оператор (уведомление)"
    
    Write-ColorText "ℹ️  Создаём виртуального клиента..." -Color $script:Colors.Info
    
    # Генерируем случайный ID для виртуального клиента
    $clientId = Get-Random -Minimum 100000000 -Maximum 999999999
    $clientUsername = "test_client_$(Get-Random -Minimum 100 -Maximum 999)"
    
    Write-Host ""
    Write-ColorText "👤 Виртуальный клиент:" -Color $script:Colors.Info
    Write-ColorText "   User ID: $clientId" -Color $script:Colors.Info
    Write-ColorText "   Username: @$clientUsername" -Color $script:Colors.Info
    Write-Host ""
    
    $message = Read-Host "Введите сообщение от клиента (или Enter для 'Помогите с заявкой!')"
    if ([string]::IsNullOrWhiteSpace($message)) {
        $message = "Помогите с заявкой! Не могу найти свой обмен."
    }
    
    Write-Host ""
    Write-ColorText "📤 Клиент отправляет: '$message'" -Color $script:Colors.Info
    Write-Host ""
    
    # Создаём update
    $update = New-ClientMessageUpdate -Message $message -UserId $clientId -Username $clientUsername
    
    Write-ColorText "Отправка webhook..." -Color $script:Colors.Info
    
    try {
        $result = $update | Send-TelegramWebhook -BotUrl $BotUrl -ShowRequest
        
        Write-Host ""
        Write-ColorText "✅ HTTP Status: $($result.StatusCode) $($result.StatusDescription)" -Color $script:Colors.Success
        Write-Host ""
        
        Write-ColorText "📱 ПРОВЕРЬТЕ TELEGRAM!" -Color $script:Colors.Success
        Write-ColorText "   Вы (ID: 621882329) должны получить уведомление:" -Color $script:Colors.Success
        Write-Host ""
        Write-ColorText "   💬 Новое обращение клиента в поддержку" -Color $script:Colors.Info
        Write-ColorText "   👤 Пользователь: @$clientUsername" -Color $script:Colors.Info
        Write-ColorText "   📱 Telegram ID: $clientId" -Color $script:Colors.Info
        Write-ColorText "   💬 Сообщение: $message" -Color $script:Colors.Info
        Write-Host ""
        
    }
    catch {
        Write-ColorText "❌ Ошибка: $_" -Color $script:Colors.Error
    }
}

function Test-MultipleClients {
    Write-Section "🔄 ТЕСТ: Несколько клиентов пишут"
    
    $count = Read-Host "Сколько клиентов создать? (по умолчанию: 3)"
    if ([string]::IsNullOrWhiteSpace($count)) {
        $count = 3
    }
    
    Write-Host ""
    Write-ColorText "ℹ️  Создаём $count виртуальных клиентов..." -Color $script:Colors.Info
    Write-Host ""
    
    $updates = @()
    
    for ($i = 1; $i -le $count; $i++) {
        $clientId = Get-Random -Minimum 100000000 -Maximum 999999999
        $clientUsername = "client_$i"
        $message = "Сообщение от клиента #$i - нужна помощь!"
        
        Write-ColorText "👤 Клиент #$i - ID: $clientId (@$clientUsername)" -Color $script:Colors.Info
        
        $update = New-ClientMessageUpdate -Message $message -UserId $clientId -Username $clientUsername
        $updates += $update
    }
    
    Write-Host ""
    Write-ColorText "📤 Отправка всех сообщений с задержкой 500ms..." -Color $script:Colors.Info
    Write-Host ""
    
    try {
        $result = Send-TelegramWebhookBatch -Updates $updates -DelayMilliseconds 500 -BotUrl $BotUrl
        
        Write-Host ""
        Write-ColorText "✅ Результат: $($result.Success) успешных из $($result.Total)" -Color $script:Colors.Success
        Write-Host ""
        
        Write-ColorText "📱 ПРОВЕРЬТЕ TELEGRAM!" -Color $script:Colors.Success
        Write-ColorText "   Вы должны получить $count уведомлений подряд!" -Color $script:Colors.Success
        Write-Host ""
        
    }
    catch {
        Write-ColorText "❌ Ошибка: $_" -Color $script:Colors.Error
    }
}

function Test-OperatorCommands {
    Write-Section "⚡ ТЕСТ: Команды оператора"
    
    Write-ColorText "ℹ️  Используем ВАШ реальный ID: 621882329" -Color $script:Colors.Info
    Write-Host ""
    
    Write-Host "Выберите команду:"
    Write-Host "  1. /start"
    Write-Host "  2. /login"
    Write-Host "  3. /orders"
    Write-Host ""
    
    $choice = Read-Host "Введите номер"
    
    $command = switch ($choice) {
        "1" { "/start" }
        "2" { "/login" }
        "3" { "/orders" }
        default { "/start" }
    }
    
    Write-Host ""
    Write-ColorText "📤 Оператор (ВЫ) отправляет: $command" -Color $script:Colors.Info
    Write-Host ""
    
    # Создаём update от вашего имени
    $update = @{
        update_id = [int](Get-Date -UFormat %s)
        message   = @{
            message_id = Get-Random -Minimum 10000 -Maximum 99999
            date       = [int](Get-Date -UFormat %s)
            chat       = @{
                id   = 621882329
                type = "private"
            }
            from       = @{
                id         = 621882329
                first_name = "Operator"
                is_bot     = $false
                username   = "your_username"
            }
            text       = $command
        }
    }
    
    try {
        $result = $update | Send-TelegramWebhook -BotUrl $BotUrl -ShowRequest
        
        Write-Host ""
        Write-ColorText "✅ HTTP Status: $($result.StatusCode)" -Color $script:Colors.Success
        Write-Host ""
        
        Write-ColorText "📱 ПРОВЕРЬТЕ TELEGRAM!" -Color $script:Colors.Success
        Write-ColorText "   Вы должны получить ответ от бота на команду $command" -Color $script:Colors.Success
        Write-Host ""
        
    }
    catch {
        Write-ColorText "❌ Ошибка: $_" -Color $script:Colors.Error
    }
}

function Test-RateLimit {
    Write-Section "⚡ ТЕСТ: Rate Limiting"
    
    Write-ColorText "ℹ️  Создаём виртуального клиента..." -Color $script:Colors.Info
    
    $clientId = Get-Random -Minimum 100000000 -Maximum 999999999
    $clientUsername = "ratelimit_test"
    
    Write-Host ""
    Write-ColorText "👤 Виртуальный клиент: ID $clientId" -Color $script:Colors.Info
    Write-ColorText "📤 Отправляем 6 сообщений подряд (лимит: 5/мин)..." -Color $script:Colors.Info
    Write-Host ""
    
    for ($i = 1; $i -le 6; $i++) {
        $message = "Сообщение #$i (тест rate limit)"
        $update = New-ClientMessageUpdate -Message $message -UserId $clientId -Username $clientUsername
        
        try {
            $result = $update | Send-TelegramWebhook -BotUrl $BotUrl
            Write-ColorText "  $i. HTTP $($result.StatusCode) - '$message'" -Color $script:Colors.Info
        }
        catch {
            Write-ColorText "  $i. ❌ Ошибка: $_" -Color $script:Colors.Error
        }
        
        Start-Sleep -Milliseconds 300
    }
    
    Write-Host ""
    Write-ColorText "📱 ПРОВЕРЬТЕ TELEGRAM!" -Color $script:Colors.Success
    Write-ColorText "   Вы должны получить 5 уведомлений" -Color $script:Colors.Success
    Write-ColorText "   6-е сообщение должно быть заблокировано (rate limit)" -Color $script:Colors.Warning
    Write-Host ""
}

# ============================================================================
# MAIN
# ============================================================================

Clear-Host

# Проверка доступности бота
Write-ColorText "ℹ️  Проверка доступности бота..." -Color $script:Colors.Info
$availability = Test-TelegramBotAvailability -BotUrl $BotUrl

if (-not $availability.Available) {
    Write-ColorText "❌ Бот недоступен!" -Color $script:Colors.Error
    Write-ColorText "   Убедитесь что бот запущен: cd apps/telegram-bot && pnpm dev" -Color $script:Colors.Warning
    exit 1
}

Write-ColorText "✅ Бот доступен на $BotUrl" -Color $script:Colors.Success

# Главный цикл
do {
    Show-Menu
    $choice = Read-Host "Введите номер сценария"
    
    switch ($choice) {
        "1" { Test-ClientToOperatorNotification }
        "2" { Test-MultipleClients }
        "3" { Test-OperatorCommands }
        "4" { Test-RateLimit }
        "0" { 
            Write-ColorText "`n👋 До встречи!" -Color $script:Colors.Info
            break 
        }
        default { 
            Write-ColorText "`n⚠️  Неверный выбор. Попробуйте снова." -Color $script:Colors.Warning
        }
    }
    
    if ($choice -ne "0") {
        Write-Host ""
        $continue = Read-Host "Запустить другой тест? (y/n)"
        if ($continue -ne "y") {
            Write-ColorText "`n👋 До встречи!" -Color $script:Colors.Info
            break
        }
    }
    
} while ($choice -ne "0")
