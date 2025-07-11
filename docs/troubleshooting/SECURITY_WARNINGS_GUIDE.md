# Security Warnings Guide

## Обзор

Данный документ описывает подход к работе с security warnings в проекте ExchangeGO, особенно с правилом `security/detect-object-injection` из `eslint-plugin-security`.

## Правило `security/detect-object-injection`

### Описание

Правило `security/detect-object-injection` флагит **любые** выражения вида `object[expression]` для предотвращения потенциальных атак через подмену ключей объектов.

### Официальная позиция

Согласно официальной документации eslint-plugin-security: **"finds a lot of false positives which need triage by a human"**.

### Типы warnings

- `Variable Assigned to Object Injection Sink` - присвоение значения через bracket notation
- `Function Call Object Injection Sink` - вызов функции через bracket notation
- `Generic Object Injection Sink` - общий случай использования bracket notation

## False Positives vs Real Issues

### ✅ Legitimate Cases (False Positives)

#### 1. Типизированный enum-based доступ

```typescript
// ✅ БЕЗОПАСНО - CryptoCurrency это union type
const addresses = MOCK_CRYPTO_ADDRESSES[currency]; // currency: CryptoCurrency
const rate = COMMISSION_RATES[currency]; // currency: 'BTC' | 'ETH' | 'USDT' | 'LTC'
```

#### 2. Типизированный индексный доступ

```typescript
// ✅ БЕЗОПАСНО - индекс получен через типизированные методы
const user = users[index]!; // index from findIndex()
const order = orders[index]!; // index from array methods
```

#### 3. Build scripts и конфигурация

```javascript
// ✅ БЕЗОПАСНО - работа с package.json
const version = packageJson[field]; // field из известного набора
```

#### 4. Demo функции в UI

```typescript
// ✅ БЕЗОПАСНО - demo логика в UI компонентах
console.log(`Hello from your ${appName} app!`);
```

### ⚠️ Потенциально опасные cases

#### 1. Динамический доступ к объектам

```javascript
// ⚠️ ПОТЕНЦИАЛЬНО ОПАСНО
const value = userInput[dynamicKey]; // dynamicKey из пользовательского ввода
```

#### 2. Неконтролируемые ключи

```javascript
// ⚠️ ПОТЕНЦИАЛЬНО ОПАСНО
const result = config[request.params.key]; // key из HTTP запроса
```

## Настройка в проекте

### Overrides для false positives

В `eslint.config.mjs` настроены специальные overrides:

```javascript
// Crypto и calculations утилиты
{
  name: 'crypto-enum-access',
  files: [
    'packages/exchange-core/src/utils/crypto.ts',
    'packages/exchange-core/src/utils/calculations.ts',
    'packages/exchange-core/src/data/manager.ts'
  ],
  rules: {
    'security/detect-object-injection': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
  }
}

// Build scripts
{
  name: 'build-scripts-access',
  files: ['scripts/**/*.js'],
  rules: {
    'security/detect-object-injection': 'off',
  }
}

// UI demo компоненты
{
  name: 'ui-demo-components',
  files: ['packages/ui/**/*.{tsx,jsx}'],
  rules: {
    'no-console': 'off',
  }
}
```

## Workflow при появлении новых warnings

### 1. Анализ

1. Определить тип warning: `Variable Assigned` / `Function Call` / `Generic`
2. Изучить контекст: откуда берется ключ/индекс
3. Проверить типизацию: enum, union type, или динамическое значение

### 2. Категоризация

- **False Positive**: типизированный доступ, известные ключи, build scripts
- **Legitimate Warning**: динамические ключи, пользовательский ввод, HTTP параметры

### 3. Действия

#### Для False Positives:

1. Добавить файл в соответствующий override в `eslint.config.mjs`
2. Документировать причину в комментарии
3. Обновить данный документ при необходимости

#### Для Legitimate Warnings:

1. Рефакторить код для устранения уязвимости
2. Использовать whitelist известных ключей
3. Добавить валидацию входных данных
4. При необходимости - использовать `eslint-disable-next-line` с подробным комментарием

## Примеры решений

### Рефакторинг опасного кода

```javascript
// ❌ ПЛОХО
const value = config[userKey];

// ✅ ХОРОШО
const allowedKeys = ['theme', 'language', 'timezone'];
const value = allowedKeys.includes(userKey) ? config[userKey] : config.default;
```

### Безопасный доступ с валидацией

```javascript
// ❌ ПЛОХО
const handler = handlers[request.action];

// ✅ ХОРОШО
const ALLOWED_ACTIONS = {
  'create': createHandler,
  'update': updateHandler,
  'delete': deleteHandler
} as const;

const handler = ALLOWED_ACTIONS[request.action] || defaultHandler;
```

## Статистика по проекту

### Текущее состояние (после ЭТАПА 1)

- **До настройки**: 13 warnings `security/detect-object-injection`
- **После настройки**: ~0-3 warnings (только legitimate cases)
- **False positives устранены**: ~10-13 warnings

### Файлы с overrides

- `packages/exchange-core/src/utils/crypto.ts` - enum-based доступ
- `packages/exchange-core/src/utils/calculations.ts` - enum-based доступ
- `packages/exchange-core/src/data/manager.ts` - типизированный индексный доступ
- `scripts/**/*.js` - build scripts с package.json доступом
- `packages/ui/**/*.{tsx,jsx}` - demo функции

## Поддержка и обновления

### При добавлении новых файлов:

1. Проверить, подпадает ли под существующие patterns в overrides
2. При необходимости - расширить patterns или добавить новый override
3. Обновить документацию

### При изменении архитектуры:

1. Пересмотреть актуальность overrides
2. Обновить patterns файлов
3. Провести повторный анализ warnings

---

**Последнее обновление**: Июль 2025  
**Версия ESLint Plugin Security**: v3.0.1  
**Автор**: AI Agent (следуя ai-agent-rules.yml)
