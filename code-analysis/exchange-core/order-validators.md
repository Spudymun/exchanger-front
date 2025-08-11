### Путь: packages/exchange-core/src/utils/order-validators.ts

**Краткое назначение (1 предложение)**

Композитные валидаторы для заявок на обмен и создания пользователей, объединяющие множественные правила валидации в единые функции верхнего уровня.

**Подробное описание (3–6 предложений)**

Модуль предоставляет высокоуровневые функции валидации, которые объединяют проверки из различных специализированных валидаторов для создания полного процесса валидации сложных объектов. Функция validateCreateOrder координирует проверку email через Zod схемы, валидацию валюты и суммы через бизнес-валидаторы, а также проверку данных получателя через композитные валидаторы. Система использует условную валидацию, где проверка суммы выполняется только после успешной валидации валюты для предотвращения каскадных ошибок. Модуль интегрирует результаты всех проверок через утилиту mergeValidationResults для получения единого объекта с полным списком ошибок. Валидация пользователей включает обязательную проверку email и опциональную валидацию пароля в зависимости от способа регистрации. Архитектурно отделен от индивидуальных валидаторов для лучшей организации и переиспользования компонентов.

**Экспортируемые сущности / API**

- `export function validateCreateOrder(request: CreateOrderRequest): ValidationResult` — Полная валидация заявки на обмен
- `export function validateCreateUser(request: CreateUserRequest): ValidationResult` — Валидация данных для создания пользователя

**Входы (expected inputs) / Параметры**

- `validateCreateOrder`: `request: CreateOrderRequest` — объект с email, cryptoAmount, currency, uahAmount, recipientData?
- `validateCreateUser`: `request: CreateUserRequest` — объект с email, password?, sessionId?

**Выходы / Побочные эффекты**

- `validateCreateOrder`: возвращает `ValidationResult` — объединенный результат всех проверок (email, валюта, сумма, данные получателя)
- `validateCreateUser`: возвращает `ValidationResult` — результат проверки email и опционально пароля
- Побочные эффекты отсутствуют — чистые функции без мутаций состояния
- Использует условную логику для предотвращения проверки суммы при невалидной валюте
- Объединяет все ошибки в единый массив для удобства обработки на клиенте

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `apps/web/src/server/trpc/routers/exchange.ts` — validateCreateOrder для проверки заявок
- `packages/exchange-core/src/index.ts` — реэкспорт функций (предположительно)

Файлы, которые импортируются здесь:

- `@repo/utils` — createValidationResult, mergeValidationResults, ValidationResult, emailSchema, passwordSchema
- `../types` — CreateOrderRequest, CreateUserRequest интерфейсы
- `./business-validators` — validateCurrency, validateCryptoAmount
- `./composite-validators` — validateRecipientData

**Домен данных / типы**

```typescript
// Входные типы
interface CreateOrderRequest {
  email: string;
  cryptoAmount: number;
  currency: CryptoCurrency;
  uahAmount: number;
  recipientData?: RecipientData;
}

interface CreateUserRequest {
  email: string;
  password?: string;
  sessionId?: string;
}

// Результат валидации
interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Используемые вспомогательные типы
type CryptoCurrency = 'BTC' | 'ETH' | 'USDT' | 'LTC';
interface RecipientData {
  cardNumber?: string;
  bankDetails?: string;
  recipientName?: string;
  phone?: string;
}
```

**Риски и безопасность**

- **Validation completeness**: пропуск проверок может привести к созданию невалидных заявок
- **Schema dependency**: зависимость от корректности Zod схем для email и password валидации
- **Business logic consistency**: валидация должна соответствовать реальным бизнес-требованиям
- **Error message exposure**: детальные сообщения об ошибках не должны раскрывать внутреннюю логику
- **Conditional validation logic**: неправильная условная логика может пропустить важные проверки
- **Order of validation**: порядок проверок влияет на производительность и UX
- **Data sanitization**: валидация должна происходить после санитизации данных

**Тесты / рекомендации по покрытию**

- Unit тесты для validateCreateOrder: валидные заявки, каждый тип ошибки отдельно, комбинации ошибок
- Unit тесты для validateCreateUser: с паролем и без, различные email форматы
- Integration тесты: совместная работа всех валидаторов, проверка последовательности вызовов
- Edge case тесты: пустые объекты, undefined поля, граничные значения сумм
- Conditional logic тесты: проверка что валидация суммы не выполняется при невалидной валюте
- Error aggregation тесты: корректное объединение ошибок от разных валидаторов
- Performance тесты: валидация больших объемов заявок

**Оценка сложности (low/medium/high)**

**medium** — умеренная сложность из-за координации множественных валидаторов и условной логики.

**TODO / Рефакторинг**

- Добавить валидацию uahAmount в validateCreateOrder (сейчас не проверяется)
- Рассмотреть добавление асинхронной валидации для проверки уникальности email
- Добавить более детальную валидацию recipientData в зависимости от типа получения средств
- Реализовать кеширование результатов валидации для повышения производительности
- Добавить метрики и логирование для мониторинга частоты различных типов ошибок
- Рассмотреть создание builder pattern для более гибкой настройки валидации
- Добавить поддержку локализованных сообщений об ошибках
