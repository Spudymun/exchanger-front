### Путь: packages/hooks/src/useExchangeStore.ts

**Краткое назначение (1 предложение)**

Enhanced wrapper над базовым exchange store с интегрированной валидацией форм, бизнес-логикой и helper методами для UI компонентов.

**Подробное описание (3–6 предложений)**

Модуль предоставляет высокоуровневый интерфейс к базовому exchange store с дополнительной бизнес-логикой, валидацией и удобными helper методами для компонентов формы обмена. Интегрирует систему уведомлений для отображения ошибок валидации и использует централизованные Zod схемы для проверки email адресов. Включает валидацию всех критических полей формы: валюта, сумма, данные получателя, email и согласие с условиями. Предоставляет методы для проверки возможности перехода к следующему шагу в multi-step форме и расчета прогресса заполнения формы. Система устраняет избыточную абстракцию и предоставляет прямой доступ к store методам с дополнительными convenience функциями. Архитектурно разделяет concerns: базовый store для state management, wrapper для бизнес-логики и UI helpers.

**Экспортируемые сущности / API**

- `export const useExchangeStore = () => { ... }` — Enhanced exchange store hook
- `export type UseExchangeStoreReturn = ReturnType<typeof useExchangeStore>` — Тип возвращаемого значения

**Входы (expected inputs) / Параметры**

- Функция не принимает параметры — использует базовый store и notifications hook
- Внутренние helper функции работают с store state и formData

**Выходы / Побочные эффекты**

- Возвращает объект с полным API базового store плюс дополнительные методы:
  - `validateForm: () => boolean` — валидация всей формы с уведомлениями об ошибках
  - `canProceedToNextStep: () => boolean` — проверка возможности перехода к следующему шагу
  - `getFormProgress: () => number` — процент заполнения формы (0-100)
  - `notifications` — прямой доступ к системе уведомлений
- Побочные эффекты: показ уведомлений при ошибках валидации, subscription к store изменениям
- Интеграция с useNotifications для отображения ошибок пользователю

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `packages/hooks/src/business/useExchange.ts` — использует для бизнес-логики обмена
- `packages/hooks/src/client-hooks.ts` — реэкспорт через barrel file
- Компоненты обменной формы (через client-hooks)

Файлы, которые импортируются здесь:

- `@repo/utils` — emailSchema для валидации email
- `./state/exchange-store` — useExchangeStoreBase, ExchangeStore типы
- `./useNotifications` — система уведомлений

**Домен данных / типы**

```typescript
// Store data types
interface ExchangeStore {
  formData: {
    fromCurrency: string;
    fromAmount: string;
    userEmail: string;
    recipientData: {
      cardNumber: string;
    };
    agreementAccepted: boolean;
  };
  calculation: {
    isValid: boolean;
    // другие поля расчета
  };
  currentStep: number;
  currentOrder: Order | null;
}

// Validation errors structure
type ValidationErrors = Record<string, string[]>;

// Helper methods return types
interface HelperMethods {
  canProceedToNextStep: () => boolean;
  getFormProgress: () => number;
}

// Enhanced store return type
type UseExchangeStoreReturn = ExchangeStore & {
  validateForm: () => boolean;
  notifications: NotificationsAPI;
} & HelperMethods;
```

**Риски и безопасность**

- **Validation completeness**: пропуск проверок может привести к отправке невалидных форм
- **Business logic consistency**: логика validateForm должна соответствовать серверной валидации
- **State synchronization**: wrapper может рассинхронизироваться с базовым store
- **Form progress accuracy**: неправильный расчет прогресса влияет на UX
- **Email validation reliability**: зависимость от корректности Zod схем
- **Step transition logic**: ошибки в canProceedToNextStep могут блокировать форму
- **Notification spam**: избыточные уведомления об ошибках ухудшают UX

**Тесты / рекомендации по покрытию**

- Unit тесты для validateBasicFields: все возможные комбинации ошибок полей
- Unit тесты для validateEmailField: валидные/невалидные email адреса
- Unit тесты для canProceedToNextStep: все шаги формы, граничные случаи
- Unit тесты для getFormProgress: различные состояния заполнения формы
- Integration тесты: совместная работа с базовым store и notifications
- Mock тесты: проверка корректных вызовов handleFormValidation
- Error handling тесты: обработка некорректных состояний store

**Оценка сложности (low/medium/high)**

**medium** — умеренная сложность из-за интеграции множественных систем и бизнес-логики валидации.

**TODO / Рефакторинг**

- Добавить мемоизацию для helper методов для предотвращения лишних вычислений
- Рассмотреть вынос валидационной логики в отдельный модуль для переиспользования
- Добавить более детальную валидацию recipientData в зависимости от типа получения
- Реализовать асинхронную валидацию для проверки доступности email
- Добавить debouncing для validation вызовов при быстром вводе
- Рассмотреть использование React Query для server-side валидации
- Улучшить типизацию ошибок валидации для лучшего type safety
