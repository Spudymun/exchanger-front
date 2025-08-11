# Анализ файла: packages/exchange-core/src/data/mock-factory.ts

## 📋 Назначение

Централизованная фабрика для создания mock данных различных типов в экосистеме ExchangeGO. Устраняет дублирование между UI тестами и core системой согласно ai-agent-rules.yml (правило 20), обеспечивая единую систему генерации тестовых данных.

## 📝 Описание

Comprehensive mock data generation система, включающая:

- **Centralized mock generation** - единая фабрика для всех типов mock данных
- **UI-specific mock types** - специализированные типы для UI компонентов и тестов
- **Core system integration** - интеграция с основными типами exchange-core
- **DataTable compatibility** - совместимость с UI DataTable компонентами
- **Customizable generation** - настраиваемая генерация mock данных
- **DRY principle implementation** - устранение дублирования между различными уровнями

Служит единым источником mock данных для UI, core и тестовых систем.

## 🔌 API и интерфейсы

### UI Testing Interfaces:

```typescript
export interface UITestUser extends Record<string, unknown> {
  id: number; // Числовой ID для UI
  name: string; // Отображаемое имя
  email: string; // Email адрес
  role: string; // Роль пользователя ('Admin', 'User')
  status: 'active' | 'inactive'; // Статус активности
  lastLogin: string; // Дата последнего входа (string для UI)
}

export interface TestData extends Record<string, unknown> {
  id: number; // Базовый ID
  name: string; // Базовое имя
  email: string; // Базовый email
}
```

### Factory Functions:

#### UI Test Users:

```typescript
export function createUITestUsers(): UITestUser[];
// Возвращает:
// [
//   { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'active', lastLogin: '2024-01-15' },
//   { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'active', lastLogin: '2024-01-14' },
//   { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'User', status: 'inactive', lastLogin: '2024-01-10' }
// ]
```

#### Basic Test Data:

```typescript
export function createTestData(): TestData[];
// Возвращает упрощенные объекты для базового тестирования DataTable
```

#### Core System Users:

```typescript
export function createCoreUsers(): User[];
// Возвращает полные User объекты с:
// - String ID ('user_1', 'user_2')
// - Централизованные email из MOCK_USER_EMAILS
// - Hashed passwords из MOCK_AUTH_DATA
// - Date объекты из MOCK_TIMESTAMPS
// - Boolean flags (isVerified)
```

#### Custom Generation:

```typescript
export function createCustomTestUsers(count: number): UITestUser[];
// Генерирует заданное количество пользователей с:
// - Последовательными ID
// - Паттернами имен и email
// - Чередующимися ролями и статусами
// - Последовательными датами
```

### Data Generation Patterns:

```typescript
interface GenerationPatterns {
  uiUsers: {
    idType: 'number'; // Числовые ID для UI
    dateFormat: 'string'; // Строковые даты для отображения
    compatibility: 'DataTable'; // Совместимость с UI компонентами
  };

  coreUsers: {
    idType: 'string'; // Строковые ID для core
    dateFormat: 'Date'; // Date объекты для business logic
    integration: 'exchange-core'; // Интеграция с core типами
  };

  customGeneration: {
    flexibility: 'high'; // Высокая гибкость параметров
    patterns: 'algorithmic'; // Алгоритмическая генерация
    scalability: 'unlimited'; // Неограниченное количество
  };
}
```

## 📥 Входящие зависимости

```typescript
import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
import type { User } from '../types';
import { MOCK_USER_EMAILS, MOCK_AUTH_DATA, MOCK_TIMESTAMPS } from './mock-data';
```

### Внешние зависимости:

- **@repo/constants** - UI константы для mock данных
- **../types** - основные типы User из exchange-core
- **./mock-data** - централизованные mock константы

## 📤 Исходящие зависимости

- **UI Components** - компоненты используют UITestUser для демонстрации
- **DataTable tests** - тесты используют TestData интерфейс
- **Storybook stories** - stories используют factory functions
- **Core system tests** - тесты используют createCoreUsers()
- **Integration tests** - используют custom generation функции

## 🔗 Взаимосвязи с другими компонентами

### Архитектурные связи:

- **mock-data.ts** - использует централизованные константы
- **manager.ts** - может использовать factory functions для инициализации
- **UI packages** - потребляют UITestUser interface
- **Test suites** - используют все factory functions

### DRY implementation цепочка:

```
mock-data.ts (constants) → mock-factory.ts (generation) → consumers (UI/core/tests)
```

### Multi-layer data flow:

```
┌─────────────────────────────────────┐
│            UI Layer                 │
│    (Stories, Components, Tests)     │ ← UITestUser, TestData
├─────────────────────────────────────┤
│          Factory Layer              │ ← Этот файл
│      (Data Generation Logic)        │
├─────────────────────────────────────┤
│         Constants Layer             │
│        (mock-data.ts)               │ ← Базовые константы
├─────────────────────────────────────┤
│          Core Layer                 │
│      (Types, Services)              │ ← User types, core logic
└─────────────────────────────────────┘
```

## 📊 Типы данных

### Type hierarchy:

```typescript
interface TypeHierarchy {
  base: {
    TestData: 'minimal_interface'; // Базовый интерфейс
    Record: 'extends_Record_string_unknown'; // DataTable совместимость
  };

  ui: {
    UITestUser: 'extends_TestData'; // UI-специфичные поля
    displayFormat: 'user_friendly'; // Формат для отображения
  };

  core: {
    User: 'full_business_object'; // Полный business object
    typeSystem: 'exchange_core_types'; // Интеграция с core типами
  };
}

interface DataFormatDifferences {
  id: {
    ui: 'number'; // 1, 2, 3
    core: 'string'; // 'user_1', 'user_2'
  };

  dates: {
    ui: 'string'; // '2024-01-15'
    core: 'Date'; // new Date(timestamp)
  };

  structure: {
    ui: 'simplified'; // Упрощенная для UI
    core: 'complete'; // Полная business структура
  };
}
```

### Generation algorithms:

```typescript
interface GenerationAlgorithms {
  sequential: {
    ids: 'index + 1'; // Последовательные ID
    names: 'User ${index}'; // Паттерн имен
    emails: 'user${index}@test.com'; // Паттерн email
  };

  alternating: {
    roles: 'index === 0 ? Admin : User'; // Чередование ролей
    status: 'index % 2 === 0 ? active : inactive'; // Чередование статусов
  };

  date_sequences: {
    lastLogin: 'BASE_DAY - index'; // Убывающие даты
    formatting: 'padStart(2, "0")'; // Форматирование с ведущими нулями
  };
}
```

## ⚠️ Потенциальные проблемы и риски

### Проблемы типизации:

- **Type system complexity**: Сложность поддержки multiple type systems
- **Interface compatibility**: Потенциальные конфликты между UI и core типами
- **Record<string, unknown> overhead**: Накладные расходы generic Record типа

### Проблемы данных:

- **Data inconsistency**: Различия между UI и core представлениями
- **Mock data drift**: Расхождение mock данных с реальными требованиями
- **Limited diversity**: Ограниченное разнообразие генерируемых данных

### Проблемы производительности:

- **Generation overhead**: Накладные расходы на динамическую генерацию
- **Memory consumption**: Потребление памяти для больших массивов
- **Algorithmic complexity**: O(n) сложность для custom generation

### Проблемы поддержки:

- **Multi-format maintenance**: Сложность поддержки множественных форматов
- **Breaking changes propagation**: Изменения могут затронуть multiple consumers
- **Documentation complexity**: Сложность документирования различных use cases

## ✅ Тестирование

- **Unit-тесты**: Отсутствуют
- **Type safety tests**: Отсутствуют
- **Generation consistency tests**: Отсутствуют

### Рекомендации по тестированию:

- Unit тесты для каждой factory function
- Тесты типизации и совместимости
- Тесты генерации различных объемов данных
- Performance тесты для больших datasets
- Тесты консистентности между UI и core типами

## 🔧 Техническая сложность

**Уровень: Средний**

### Метрики сложности:

- **Размер**: 127 строк с multiple interfaces и functions
- **Type complexity**: Средняя (multiple type systems)
- **Generation algorithms**: Простые но эффективные
- **Integration points**: 3+ различных систем (UI/core/tests)

### Анализ архитектуры:

- Хорошее разделение между UI и core типами
- Эффективное использование централизованных констант
- Простые алгоритмы генерации данных
- Четкая архитектурная роль в system

## 📝 TODO и области для улучшения

### Критические улучшения:

1. **Type system unification**: Унификация типов между UI и core
2. **Generation strategy enhancement**: Улучшение стратегий генерации данных
3. **Performance optimization**: Оптимизация для больших объемов данных
4. **Error handling**: Обработка ошибок генерации

### Рекомендуемые улучшения:

1. **Data variety expansion**: Расширение разнообразия генерируемых данных
2. **Localization support**: Поддержка локализации mock данных
3. **Schema validation**: Валидация генерируемых данных против схем
4. **Custom patterns**: Поддержка custom паттернов генерации
5. **Streaming generation**: Потоковая генерация для больших datasets

### Долгосрочные задачи:

1. **AI-powered data generation**: ИИ генерация реалистичных тестовых данных
2. **Schema-driven generation**: Генерация на основе JSON Schema
3. **Real-time data synchronization**: Синхронизация с live данными
4. **Advanced algorithms**: Продвинутые алгоритмы для complex scenarios
5. **Cross-platform compatibility**: Совместимость между различными платформами
6. **Performance profiling**: Профилирование производительности генерации
7. **Data relationship modeling**: Моделирование связей между entities
8. **Automated testing integration**: Автоматическая интеграция с testing frameworks
