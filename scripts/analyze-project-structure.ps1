# Project Structure Analyzer
# Создает структурированный вивод всех файлов проекта для анализа
# Исключает технические директории и временные файлы

param(
    [string]$OutputFile = "project-structure.txt",
    [string]$ProjectRoot = (Get-Location).Path
)

# Директории для исключения
$ExcludedDirs = @(
    'node_modules',
    '.git',
    '.next',
    'dist',
    'build',
    'out',
    '.vscode',
    '.idea',
    'coverage',
    'playwright-report',
    'test-results',
    '.turbo',
    '.vercel',
    'logs'
)

# Файлы для исключения (по расширению или имени)
$ExcludedFiles = @(
    '*.log',
    '*.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml',
    '.DS_Store',
    'Thumbs.db',
    '*.tsbuildinfo',
    '.env.local',
    '.env.*.local'
)

function Get-TreeStructure {
    param(
        [string]$Path,
        [string]$Prefix = "",
        [bool]$IsLast = $true
    )
    
    $items = Get-ChildItem -Path $Path -Force | Where-Object {
        # Исключаем директории
        if ($_.PSIsContainer) {
            return $ExcludedDirs -notcontains $_.Name
        }
        # Исключаем файлы
        else {
            foreach ($pattern in $ExcludedFiles) {
                if ($_.Name -like $pattern) {
                    return $false
                }
            }
            return $true
        }
    } | Sort-Object @{Expression = "PSIsContainer"; Descending = $true }, Name
    
    for ($i = 0; $i -lt $items.Count; $i++) {
        $item = $items[$i]
        $isLastItem = ($i -eq ($items.Count - 1))
        
        $connector = if ($isLastItem) { "└── " } else { "├── " }
        $itemName = if ($item.PSIsContainer) { "$($item.Name)/" } else { $item.Name }
        
        Write-Output "$Prefix$connector$itemName"
        
        if ($item.PSIsContainer) {
            $newPrefix = if ($isLastItem) { "$Prefix    " } else { "$Prefix│   " }
            Get-TreeStructure -Path $item.FullName -Prefix $newPrefix -IsLast $isLastItem
        }
    }
}

function Get-FilesByType {
    param([string]$Path)
    
    $files = Get-ChildItem -Path $Path -Recurse -File | Where-Object {
        $currentPath = $_.DirectoryName
        
        # Проверяем, не находится ли файл в исключенной директории
        foreach ($excludedDir in $ExcludedDirs) {
            if ($currentPath -like "*\$excludedDir" -or $currentPath -like "*\$excludedDir\*") {
                return $false
            }
        }
        
        # Проверяем исключенные файлы
        foreach ($pattern in $ExcludedFiles) {
            if ($_.Name -like $pattern) {
                return $false
            }
        }
        
        return $true
    }
    
    $filesByType = $files | Group-Object Extension | Sort-Object Name
    
    return $filesByType
}

# Основная логика
Write-Host "Анализируем структуру проекта: $ProjectRoot" -ForegroundColor Green
Write-Host "Результат будет сохранен в: $OutputFile" -ForegroundColor Yellow

$output = @()
$output += "# СТРУКТУРА ПРОЕКТА EXCHANGER"
$output += "# Создано: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$output += "# Корневая директория: $ProjectRoot"
$output += ""
$output += "## ДРЕВОВИДНАЯ СТРУКТУРА"
$output += ""

# Получаем древовидную структуру
$treeOutput = Get-TreeStructure -Path $ProjectRoot
$output += $treeOutput

$output += ""
$output += "## ФАЙЛЫ ПО ТИПАМ"
$output += ""

# Получаем статистику по типам файлов
$filesByType = Get-FilesByType -Path $ProjectRoot

foreach ($group in $filesByType) {
    $extension = if ($group.Name) { $group.Name } else { "[без расширения]" }
    $output += "### $extension ($($group.Count) файлов)"
    
    foreach ($file in ($group.Group | Sort-Object DirectoryName, Name)) {
        $relativePath = $file.FullName.Replace("$ProjectRoot\", "")
        $output += "  - $relativePath"
    }
    $output += ""
}

# Общая статистика
$totalFiles = ($filesByType | ForEach-Object { $_.Count } | Measure-Object -Sum).Sum
$output += "## ОБЩАЯ СТАТИСТИКА"
$output += ""
$output += "- Всего файлов: $totalFiles"
$output += "- Типов файлов: $($filesByType.Count)"
$output += ""

# Ключевые директории проекта
$output += "## КЛЮЧЕВЫЕ ДИРЕКТОРИИ"
$output += ""
$keyDirs = @(
    @{ Path = "apps\web"; Description = "Основное Next.js приложение" },
    @{ Path = "apps\admin-panel"; Description = "Админ панель" },
    @{ Path = "apps\docs"; Description = "Документация" },
    @{ Path = "packages\ui"; Description = "UI компоненты" },
    @{ Path = "packages\api-client"; Description = "API клиент" },
    @{ Path = "packages\hooks"; Description = "React хуки и состояние" },
    @{ Path = "packages\constants"; Description = "Константы проекта" },
    @{ Path = "packages\utils"; Description = "Утилитарные функции" },
    @{ Path = "docs"; Description = "Проектная документация" },
    @{ Path = "tests"; Description = "E2E тесты" }
)

foreach ($dir in $keyDirs) {
    if (Test-Path (Join-Path $ProjectRoot $dir.Path)) {
        $output += "- **$($dir.Path)**: $($dir.Description)"
    }
}

# Сохраняем результат
$output | Out-File -FilePath $OutputFile -Encoding UTF8
Write-Host "Анализ завершен! Результат сохранен в: $OutputFile" -ForegroundColor Green

# Показываем краткую статистику в консоли
Write-Host "`nКраткая статистика:" -ForegroundColor Cyan
Write-Host "- Всего файлов: $totalFiles" -ForegroundColor White
Write-Host "- Типов файлов: $($filesByType.Count)" -ForegroundColor White
Write-Host "- Основные типы:" -ForegroundColor White

$topTypes = $filesByType | Sort-Object Count -Descending | Select-Object -First 5
foreach ($type in $topTypes) {
    $ext = if ($type.Name) { $type.Name } else { "[без расширения]" }
    Write-Host "  $ext : $($type.Count) файлов" -ForegroundColor Gray
}
