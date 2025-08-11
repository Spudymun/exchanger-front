### Путь: apps/web/src/server/utils/i18n-errors.ts

**Краткое назначение (1 предложение)**

Серверная интернационализация ошибок для tRPC через next-intl с поддержкой fallback стратегий.

**Подробное описание (3–6 предложений)**

Файл обеспечивает централизованную систему локализации сообщений об ошибках на сервере с использованием native next-intl API. Реализует robust fallback стратегию: сначала попытка получить перевод на запрошенном языке, затем fallback на английский, и в крайнем случае возврат ключа перевода. Поддерживает интерполяцию значений в переводы через параметр values, что позволяет создавать динамические сообщения с переменными данными. Функция `createErrorMessageFunction` создает bound функцию для конкретной локали, упрощая использование в tRPC контексте. Система обеспечивает graceful degradation при отсутствии переводов и предотвращает runtime ошибки в production.

**Экспортируемые сущности / API**

- `export async function getServerErrorMessage` — получение локализованного сообщения об ошибке
  - Параметры: `keyPath: string, locale: SupportedLocale, values?: Record<string, string | number>`
  - Возврат: `Promise<string>` — локализованное сообщение или fallback
- `export function createErrorMessageFunction` — создание bound функции для конкретной локали
  - Параметр: `locale: SupportedLocale`
  - Возврат: функция `(keyPath: string, values?: Record) => Promise<string>`

**Входы (expected inputs) / Параметры**

- `keyPath: string` — путь к ключу перевода (например, 'business.userExists')
- `locale: SupportedLocale` — целевая локаль из типизированных констант
- `values?: Record<string, string | number>` — значения для интерполяции в переводы

**Выходы / Побочные эффекты**

- Локализованные сообщения об ошибках на выбранном языке
- Graceful fallback на английский язык при отсутствии перевода
- Ultimate fallback на keyPath для предотвращения undefined ошибок
- Try-catch обработка для предотвращения runtime ошибок
- Bound функции для упрощения использования в контексте

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `../trpc/context.ts` — создание getErrorMessage функции для контекста
- Роутеры tRPC для локализации ошибок в процедурах
- Middleware где нужна локализация сообщений

Файлы, которые импортируются здесь:

- `@repo/constants` — типы поддерживаемых локалей (SupportedLocale)
- `next-intl/server` — getTranslations API для серверной локализации

**Домен данных / типы**

```typescript
// Поддерживаемые локали (из констант)
type SupportedLocale = 'en' | 'uk' | 'ru';

// Функция получения локализованных ошибок
type GetServerErrorMessage = (
  keyPath: string,
  locale: SupportedLocale,
  values?: Record<string, string | number>
) => Promise<string>;

// Bound функция для конкретной локали
type BoundErrorMessageFunction = (
  keyPath: string,
  values?: Record<string, string | number>
) => Promise<string>;

// Структура namespace переводов
interface ErrorTranslationNamespace {
  'server.errors': {
    business: Record<string, string>;
    validation: Record<string, string>;
    auth: Record<string, string>;
  };
}
```

**Риски и безопасность**

- **Translation missing**: Отсутствие переводов может привести к показу ключей пользователям
- **Performance impact**: Async операции для каждого сообщения об ошибке
- **Error propagation**: Ошибки в next-intl могут нарушить работу API
- **Locale validation**: Некорректные локали могут вызвать runtime ошибки
- **Memory usage**: Загрузка переводов может увеличить memory footprint

**Тесты / рекомендации по покрытию**

- Unit тесты для всех поддерживаемых локалей
- Fallback тесты при отсутствии переводов
- Integration тесты с реальными ключами переводов
- Edge case тесты: некорректные локали, пустые ключи, null values
- Performance тесты при множественных запросах локализации
- Error handling тесты при недоступности next-intl

**Оценка сложности (low/medium/high)**

**low** — простая утилитная функция с fallback логикой

**TODO / Рефакторинг**

- Добавить кеширование переводов для улучшения производительности
- Реализовать валидацию локалей на входе
- Добавить логирование missing переводов для мониторинга
- Рассмотреть preloading часто используемых переводов
- Добавить типизацию для ключей переводов (type safety)
- Реализовать batch loading переводов для множественных ошибок
