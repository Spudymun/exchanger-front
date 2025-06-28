# 🔒 Pre-commit хуки - Настройка и использование

## 📋 Обзор

Pre-commit хуки автоматически выполняют проверки качества кода перед каждым коммитом, обеспечивая соблюдение стандартов проекта.

## 🚀 Быстрая настройка

```bash
# 1. Установить зависимости (если еще не установлены)
npm install

# 2. Убедиться что хуки активны
npx husky install

# 3. Проверить работу
git add .
git commit -m "test: verify pre-commit hooks"
```

## 🔍 Что проверяется

### 📝 Для каждого измененного файла (lint-staged):

| Тип файла | Проверки |
|-----------|----------|
| `*.{js,jsx,ts,tsx}` | ESLint + Prettier |
| `*.{css,scss}` | Stylelint + Prettier |
| `*.{json,md}` | Prettier |
| `packages/constants/**/*.ts` | Пересборка пакета |

### 🔧 Для всего проекта:

1. **Type Checking**: Проверка TypeScript типов
2. **Unit Tests**: Запуск всех unit тестов
3. **Commit Message**: Валидация по Conventional Commits

## ⚡ Процесс выполнения

```bash
git commit -m "feat: add new component"
```

```
🔍 Running pre-commit checks...

📝 Checking staged files...
✅ eslint --fix --max-warnings 0
✅ prettier --write
✅ stylelint --fix

🔧 Checking TypeScript...
✅ npm run check-types

🧪 Running tests...
✅ npm run test

✅ Pre-commit checks passed!

📋 Validating commit message...
✅ feat: add new component

[main abc1234] feat: add new component
```

## 🚨 Возможные ошибки и решения

### ESLint ошибки

```bash
# ❌ Ошибка
error: 'useState' is defined but never used (unused-imports/no-unused-imports)

# ✅ Решение
# Удалить неиспользуемые импорты или добавить комментарий
// eslint-disable-next-line unused-imports/no-unused-imports
import { useState } from 'react'
```

### TypeScript ошибки

```bash
# ❌ Ошибка  
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'

# ✅ Решение
# Исправить типизацию
const value: number = parseInt(stringValue, 10)
```

### Stylelint ошибки

```bash
# ❌ Ошибка
error: Expected "color" to come before "background" (order/properties-order)

# ✅ Решение
# Переставить CSS свойства в правильном порядке
.button {
  color: white;        // сначала color
  background: blue;    // потом background
}
```

### Test ошибки

```bash
# ❌ Ошибка
FAIL src/components/Button.test.tsx
● Button › should render correctly

# ✅ Решение
# Исправить или обновить тесты
npm run test -- --updateSnapshot  # если нужно обновить снапшоты
```

### Commit message ошибки

```bash
# ❌ Неправильно
git commit -m "fixed bug"

# ✅ Правильно
git commit -m "fix(ui): resolve button hover state issue"
```

## 🎯 Рекомендуемый workflow

### 1. Перед началом работы

```bash
# Убедиться что все актуально
git pull origin main
npm install
npm run check-types
npm run test
```

### 2. Во время разработки

```bash
# Регулярно проверять код
npm run lint        # исправить ESLint ошибки
npm run check-types # проверить типы
npm run test        # запустить тесты

# Коммитить небольшими порциями
git add src/components/Button.tsx
git commit -m "feat(ui): add Button component"
```

### 3. Перед push

```bash
# Финальная проверка
npm run build       # убедиться что все собирается
npm run test:e2e    # запустить E2E тесты (если есть)

git push origin feature-branch
```

## 🔧 Настройка IDE

### VS Code

Добавьте в `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true,
    "source.organizeImports": true
  },
  "eslint.validate": [
    "javascript",
    "javascriptreact", 
    "typescript",
    "typescriptreact"
  ]
}
```

### WebStorm/IntelliJ

1. Settings → Tools → Actions on Save
2. ✅ Reformat code
3. ✅ Optimize imports  
4. ✅ Run ESLint --fix
5. ✅ Run Prettier

## 🚑 Экстренные случаи

### Обход pre-commit хуков

```bash
# ТОЛЬКО в крайних случаях!
git commit --no-verify -m "hotfix: critical production issue"
```

### Исправление после коммита

```bash
# Если нашли ошибку после коммита
git add .
git commit --amend --no-edit  # добавить к последнему коммиту

# Или создать новый коммит
git commit -m "fix: resolve linting issues from previous commit"
```

## 📊 Мониторинг производительности

### Время выполнения хуков:

- **Lint-staged**: 2-10 секунд (зависит от количества файлов)
- **Type checking**: 5-30 секунд (зависит от размера проекта)  
- **Unit tests**: 3-15 секунд (зависит от количества тестов)

### Оптимизация:

```bash
# Кэширование TypeScript
echo 'tsconfig.tsbuildinfo' >> .gitignore

# Параллельное выполнение тестов
npm test -- --parallel

# Инкрементальная проверка типов
npx tsc --build --incremental
```

## 🔍 Отладка хуков

### Посмотреть что выполняется

```bash
# Запустить хуки вручную
npx lint-staged --debug

# Проверить конфигурацию
cat .lintstagedrc.json
cat .husky/pre-commit
```

### Логи выполнения

```bash
# Включить подробные логи
DEBUG=lint-staged* git commit -m "test"

# Проверить статус хуков
ls -la .husky/
```

## 📚 Полезные команды

```bash
# Проверить все файлы (не только staged)
npx eslint . --fix
npx prettier . --write
npx stylelint "**/*.{css,scss}" --fix

# Запустить только быстрые проверки
npx lint-staged

# Запустить все проверки как в pre-commit
npm run check-types && npm run test

# Переустановить хуки
rm -rf .husky && npx husky install
```

---

**💡 Помните**: Pre-commit хуки помогают поддерживать качество кода и предотвращают попадание ошибок в репозиторий. Лучше потратить несколько секунд на проверки сейчас, чем часы на исправление проблем потом!
