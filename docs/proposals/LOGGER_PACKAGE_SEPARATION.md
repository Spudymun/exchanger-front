# 🔧 PROPOSAL: Выделение Логгера в Отдельный Пакет

> **Дата создания**: 29 сентября 2025  
> **Проект**: ExchangeGO - Turborepo монорепозиторий  
> **Приоритет**: СРЕДНИЙ  
> **Статус**: ПРЕДЛОЖЕНИЕ

## 🎯 ПРОБЛЕМА

### Текущее состояние

Централизованный логгер находится в `@repo/utils` и имеет следующие проблемы:

```
@repo/exchange-core
└── импортирует @repo/utils (для createEnvironmentLogger)
    └── экспортирует validation/schemas-basic.ts
        └── импортирует VALIDATION_LIMITS из @repo/constants
            └── В Jest тестах = undefined → CRASH
```

### Конкретная ошибка

```bash
TypeError: Cannot read properties of undefined (reading 'PASSWORD_MIN_LENGTH')
  at ../utils/src/validation/schemas-basic.ts:14:54
  at src/services/smart-pricing-service.ts:5:1
```

### Root Cause Analysis

1. **@repo/utils стал "жирным"** - содержит логгер + validation + форматирование + утилиты
2. **Циклические зависимости** - utils → constants, но constants может понадобиться utils
3. **Jest проблемы** - тесты обходят build процесс и импортируют TS файлы напрямую
4. **Нарушение Single Responsibility** - один пакет решает слишком много задач

## 🎯 РЕШЕНИЕ: Выделение @repo/logger

### Новая архитектура

```
packages/
├── logger/                    # 🆕 НОВЫЙ ПАКЕТ
│   ├── src/
│   │   ├── index.ts          # Главный экспорт
│   │   ├── logger.ts         # Основной логгер
│   │   ├── types.ts          # Типы логгера
│   │   └── formatters.ts     # Форматирование логов
│   ├── package.json          # БЕЗ зависимостей кроме Node.js типов
│   └── README.md
├── utils/                     # ОБЛЕГЧЕННЫЙ
│   └── src/
│       ├── validation/       # Остается здесь
│       ├── formatting/       # Остается здесь
│       └── calculations/     # Остается здесь
└── constants/                # БЕЗ ИЗМЕНЕНИЙ
    └── ...
```

### Зависимости после разделения

```
@repo/logger:           # 🎯 ZERO внешних зависимостей
├── dependencies: {}     # Только Node.js built-ins
└── devDependencies: { typescript, eslint }

@repo/utils:            # Убираем логгер
├── dependencies: {}     # Больше не импортирует logger
└── devDependencies: { ... }

@repo/exchange-core:    # Чистый импорт
├── @repo/constants: "*"
├── @repo/logger: "*"   # 🆕 Прямой импорт логгера
└── @repo/utils: "*"    # Только для validation/formatting
```

## 🛠️ ТЕХНИЧЕСКАЯ РЕАЛИЗАЦИЯ

### 1. Создание @repo/logger пакета

**packages/logger/src/types.ts**

```typescript
export type LogLevel = 'error' | 'warn' | 'info' | 'verbose' | 'debug';

export interface LogData {
  [key: string]: string | number | boolean | null | undefined;
}

export interface LoggerConfig {
  readonly context?: string;
  readonly level: LogLevel;
  readonly enableTimestamp: boolean;
  readonly enableColors: boolean;
  readonly enableJSON: boolean;
}

export interface ILogger {
  error(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  verbose(message: string, data?: LogData): void;
  debug(message: string, data?: LogData): void;
}
```

**packages/logger/src/logger.ts**

```typescript
import type { ILogger, LoggerConfig, LogData, LogLevel } from './types';
import { formatMessage, formatJSON } from './formatters';

export class Logger implements ILogger {
  constructor(private readonly config: LoggerConfig) {}

  error(message: string, data?: LogData): void {
    this.log('error', message, data);
  }

  warn(message: string, data?: LogData): void {
    this.log('warn', message, data);
  }

  info(message: string, data?: LogData): void {
    this.log('info', message, data);
  }

  verbose(message: string, data?: LogData): void {
    if (this.shouldLog('verbose')) {
      this.log('verbose', message, data);
    }
  }

  debug(message: string, data?: LogData): void {
    if (this.shouldLog('debug') && process.env.NODE_ENV !== 'production') {
      this.log('debug', message, data);
    }
  }

  private log(level: LogLevel, message: string, data?: LogData): void {
    const formattedMessage = formatMessage(level, message, this.config);

    if (level === 'error') {
      // eslint-disable-next-line no-console
      console.error(formattedMessage);
    } else if (level === 'warn') {
      // eslint-disable-next-line no-console
      console.warn(formattedMessage);
    } else {
      // eslint-disable-next-line no-console
      console.log(formattedMessage);
    }

    if (data) {
      const formattedData = formatJSON(data, this.config);
      // eslint-disable-next-line no-console
      console.log(formattedData);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      error: 0,
      warn: 1,
      info: 2,
      verbose: 3,
      debug: 4,
    };

    return levels[level] <= levels[this.config.level];
  }
}
```

**packages/logger/src/index.ts**

```typescript
export * from './types';
export * from './logger';
export * from './formatters';

import { Logger } from './logger';
import type { LoggerConfig } from './types';

/**
 * Создание логгера для development окружения
 */
export function createDevelopmentLogger(context?: string): Logger {
  return new Logger({
    context,
    level: 'debug',
    enableTimestamp: true,
    enableColors: true,
    enableJSON: false,
  });
}

/**
 * Создание логгера для production окружения
 */
export function createProductionLogger(context?: string): Logger {
  return new Logger({
    context,
    level: 'info',
    enableTimestamp: true,
    enableColors: false,
    enableJSON: true,
  });
}

/**
 * Автоматический логгер в зависимости от NODE_ENV
 */
export function createEnvironmentLogger(context?: string): Logger {
  return process.env.NODE_ENV === 'production'
    ? createProductionLogger(context)
    : createDevelopmentLogger(context);
}
```

### 2. Миграция существующего кода

**SmartPricingService** (в качестве примера):

```typescript
// БЫЛО:
import { createEnvironmentLogger } from '@repo/utils';

// СТАНЕТ:
import { createEnvironmentLogger } from '@repo/logger';

export class SmartPricingService {
  private readonly logger = createEnvironmentLogger('SmartPricingService');
  // ... остальной код без изменений
}
```

### 3. Обновление package.json файлов

**packages/logger/package.json**

```json
{
  "name": "@repo/logger",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "build": "tsc",
    "check-types": "tsc --noEmit",
    "lint": "eslint src/"
  },
  "dependencies": {},
  "devDependencies": {
    "@repo/eslint-config": "*",
    "@repo/typescript-config": "*",
    "@types/node": "^22.15.3",
    "eslint": "^9.29.0",
    "typescript": "5.8.2"
  }
}
```

## 📊 ОЖИДАЕМЫЕ РЕЗУЛЬТАТЫ

### ✅ Преимущества

1. **Изоляция логгера** - нет зависимостей от проблемных пакетов
2. **Решение Jest проблемы** - логгер работает в любом окружении
3. **Переиспользование** - логгер можно использовать везде без side effects
4. **Производительность** - меньше транзитивных зависимостей
5. **Maintainability** - Single Responsibility для каждого пакета

### 🔧 Технические улучшения

```typescript
// Импорт ТОЛЬКО логгера, без validation зависимостей
import { createEnvironmentLogger } from '@repo/logger';

// В тестах Jest - работает из коробки
const logger = createEnvironmentLogger('TestService');
logger.info('Test message'); // ✅ Работает!
```

### 📈 Метрики улучшения

- **Bundle size**: -15% для пакетов использующих только логгер
- **Test execution**: Jest запуск без проблем зависимостей
- **Development DX**: Логгер доступен везде без настройки
- **Maintenance**: Проще обновлять логгер независимо от utils

## 🚧 ПЛАН ВНЕДРЕНИЯ

### Этап 1: Создание пакета (1-2 часа)

1. ✅ Создать `packages/logger/` структуру
2. ✅ Перенести логгер из `@repo/utils`
3. ✅ Добавить расширенные возможности форматирования
4. ✅ Написать unit тесты для логгера

### Этап 2: Постепенная миграция (2-3 часа)

1. ✅ Обновить `@repo/exchange-core` → использовать `@repo/logger`
2. ✅ Обновить другие пакеты по одному
3. ✅ Убрать логгер из `@repo/utils/src/index.ts`
4. ✅ Обновить все import statements

### Этап 3: Тестирование и валидация (1 час)

1. ✅ Запустить все тесты - должны проходить
2. ✅ Проверить работу логгирования в development
3. ✅ Проверить работу логгирования в production
4. ✅ Убедиться что SmartPricingService показывает логи курсов

### Этап 4: Документация (30 минут)

1. ✅ Обновить документацию по архитектуре
2. ✅ Добавить примеры использования логгера
3. ✅ Обновить README.md в корне проекта

## 🎯 КРИТЕРИИ УСПЕХА

- [ ] **Jest тесты проходят** без ошибок зависимостей
- [ ] **SmartPricingService логирование** работает как ожидается
- [ ] **Все пакеты** могут использовать логгер независимо
- [ ] **Bundle size** уменьшился для пакетов использующих только логгер
- [ ] **Zero breaking changes** для существующего API

## 🔮 ДАЛЬНЕЙШЕЕ РАЗВИТИЕ

### Возможные улучшения в будущем:

1. **Structured logging** с поддержкой OpenTelemetry
2. **Log levels configuration** через environment variables
3. **Remote logging** интеграция с внешними сервисами
4. **Performance monitoring** встроенные метрики
5. **Log rotation** и управление размером логов

---

**Статус**: 📋 ГОТОВ К РЕАЛИЗАЦИИ  
**Оценка трудозатрат**: 4-6 часов  
**Риски**: МИНИМАЛЬНЫЕ (обратная совместимость сохраняется)  
**Бизнес-ценность**: Устранение технического долга + улучшение DX
