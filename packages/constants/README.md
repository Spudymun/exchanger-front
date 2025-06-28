# @repo/constants

Централизованный пакет для всех констант проекта. Единый источник истины для бизнес-правил, UI конфигурации, API endpoints и правил валидации.

## 📦 Установка

```bash
npm install @repo/constants
```

## 🚀 Использование

### API Constants

```typescript
import { API_ENDPOINTS, HTTP_STATUS } from '@repo/constants'

// API endpoints
const response = await fetch(API_ENDPOINTS.USERS)

// HTTP status codes
if (response.status === HTTP_STATUS.OK) {
  // Success handling
}
```

### Business Constants

```typescript
import { ORDER_STATUSES, USER_ROLES, TRANSACTION_TYPES } from '@repo/constants'

// Order status checks
if (order.status === ORDER_STATUSES.PENDING) {
  // Handle pending order
}

// Role-based access
if (user.role === USER_ROLES.ADMIN) {
  // Admin functionality
}
```

### UI Configuration

```typescript
import { ORDER_STATUS_CONFIG, ALERT_VARIANTS, BUTTON_VARIANTS } from '@repo/constants'

// Status configuration with metadata
const config = ORDER_STATUS_CONFIG[order.status]
// { label: 'Ожидает', color: 'yellow', icon: 'clock', canCancel: true }

// Component variants
<Button variant={BUTTON_VARIANTS.PRIMARY}>
  Submit
</Button>

<Alert variant={ALERT_VARIANTS.SUCCESS}>
  Success message
</Alert>
```

### Validation

```typescript
import { 
  VALIDATION_LIMITS, 
  VALIDATION_PATTERNS, 
  VALIDATION_MESSAGES,
  VALIDATION_HELPERS 
} from '@repo/constants'

// Validation limits
const emailSchema = z.string()
  .max(VALIDATION_LIMITS.EMAIL_MAX_LENGTH)
  .regex(VALIDATION_PATTERNS.EMAIL, VALIDATION_MESSAGES.EMAIL_INVALID)

// Helper functions
if (VALIDATION_HELPERS.isEmail(email)) {
  // Valid email
}
```

## 📚 Доступные константы

### API (`/api`)
- `API_ENDPOINTS` - Все API endpoints
- `HTTP_STATUS` - HTTP статус коды
- `API_METHODS` - HTTP методы
- `CONTENT_TYPES` - Content-Type заголовки

### Business (`/business`)
- `USER_ROLES` - Роли пользователей
- `ORDER_STATUSES` - Статусы заказов
- `TRANSACTION_TYPES` - Типы транзакций
- `SUPPORTED_CURRENCIES` - Поддерживаемые валюты
- `NOTIFICATION_TYPES` - Типы уведомлений

### UI (`/ui`)
- `ALERT_VARIANTS` - Варианты алертов
- `BUTTON_VARIANTS` - Варианты кнопок
- `ORDER_STATUS_CONFIG` - Конфигурация статусов с метаданными
- `THEME_MODES` - Режимы темы
- `BREAKPOINTS` - Точки перелома для адаптивности

### Validation (`/validation`)
- `VALIDATION_LIMITS` - Лимиты для валидации
- `VALIDATION_PATTERNS` - Regex паттерны
- `VALIDATION_MESSAGES` - Сообщения об ошибках
- `VALIDATION_HELPERS` - Функции-помощники

## 🎯 Принципы использования

### ✅ Хорошо
```typescript
// Использование констант вместо магических строк
if (user.role === USER_ROLES.ADMIN) { }

// Конфигурация через lookup tables
const config = ORDER_STATUS_CONFIG[status]
```

### ❌ Плохо
```typescript
// Магические строки
if (user.role === 'admin') { }

// Хардкод в компонентах
if (status === 'pending') {
  return <span className="text-yellow-500">Ожидает</span>
}
```

## 🔧 Разработка

```bash
# Сборка
npm run build

# Разработка с watch режимом
npm run dev

# Проверка типов
npm run type-check

# Линтинг
npm run lint
```

## 📝 Добавление новых констант

1. Добавьте константы в соответствующий файл (`api.ts`, `business.ts`, `ui.ts`, `validation.ts`)
2. Экспортируйте типы с помощью `typeof` и `keyof`
3. Обновите экспорт в `index.ts`
4. Пересоберите пакет

```typescript
// Пример добавления новой константы
export const NEW_FEATURE_STATUS = {
  ENABLED: 'enabled',
  DISABLED: 'disabled',
} as const

export type NewFeatureStatus = typeof NEW_FEATURE_STATUS[keyof typeof NEW_FEATURE_STATUS]
```
