### Путь: packages/hooks/src/business/authMessages.ts

**Краткое назначение (1 предложение)**

Типизированные интерфейсы и дефолтные сообщения для аутентификации, выделенные в отдельный файл согласно CODE_STYLE_GUIDE.md.

**Подробное описание (3–6 предложений)**

Модуль предоставляет централизованную типизацию для всех сообщений, связанных с процессами аутентификации в приложении, включая регистрацию, сброс пароля, верификацию email и смену пароля. Интерфейс AuthMessages обеспечивает type safety и consistency для всех auth-related уведомлений по всему приложению. Включает дефолтные английские сообщения как fallback для случаев, когда локализация недоступна или не настроена. Модуль следует принципам CODE_STYLE_GUIDE.md по выделению типов в отдельные файлы для лучшей организации и переиспользования. Архитектура поддерживает легкую интернационализацию через предоставление типизированного контракта для переводов. Система разделяет заголовки и описания уведомлений для гибкости в UI представлении.

**Экспортируемые сущности / API**

- `export interface AuthMessages` — Типизированный интерфейс для auth сообщений
- `export const DEFAULT_AUTH_MESSAGES: AuthMessages` — Дефолтные английские сообщения

**Входы (expected inputs) / Параметры**

- Модуль не принимает параметры — содержит только типы и константы
- AuthMessages интерфейс ожидает объект с определенными строковыми полями

**Выходы / Побочные эффекты**

- Экспортирует типизированный интерфейс для использования в других модулях
- Предоставляет дефолтные английские сообщения как fallback
- Побочные эффекты отсутствуют — содержит только типы и константы
- Обеспечивает type safety для auth-related уведомлений
- Поддерживает consistency сообщений по всему приложению

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `packages/hooks/src/client-hooks.ts` — реэкспорт AuthMessages типа
- Потенциально используется в auth-related hooks и компонентах

Файлы, которые импортируются здесь:

- Нет внешних зависимостей — содержит только типы и константы

**Домен данных / типы**

```typescript
// Основной интерфейс auth сообщений
interface AuthMessages {
  registerSuccess: string; // Заголовок успешной регистрации
  registerSuccessDescription: string; // Описание для регистрации
  passwordResetSent: string; // Заголовок отправки сброса пароля
  passwordResetSentDescription: string; // Описание для сброса пароля
  passwordChanged: string; // Заголовок смены пароля
  passwordChangedDescription: string; // Описание смены пароля
  emailVerified: string; // Заголовок верификации email
  emailVerifiedDescription: string; // Описание верификации email
}

// Дефолтные значения
const DEFAULT_AUTH_MESSAGES: AuthMessages = {
  registerSuccess: 'Registration successful',
  registerSuccessDescription: 'Check your email to confirm your account',
  passwordResetSent: 'Instructions sent',
  passwordResetSentDescription: 'Check your email',
  passwordChanged: 'Password changed',
  passwordChangedDescription: 'You can sign in with your new password',
  emailVerified: 'Email verified',
  emailVerifiedDescription: 'Your account is now active',
};

// Структура сообщений
type AuthMessageStructure = {
  title: string;
  description: string;
};
```

**Риски и безопасность**

- **Localization gaps**: дефолтные английские сообщения могут не подходить для всех пользователей
- **Message consistency**: изменения в интерфейсе должны синхронизироваться со всеми использующими модулями
- **Type safety boundaries**: неправильная реализация интерфейса может привести к runtime ошибкам
- **Content security**: сообщения не должны содержать sensitive информацию
- **Accessibility concerns**: сообщения должны быть понятными для screen readers
- **Brand consistency**: тон и стиль сообщений должны соответствовать brand guidelines
- **Information disclosure**: error сообщения не должны раскрывать внутреннюю логику

**Тесты / рекомендации по покрытию**

- Type validation тесты: проверка что DEFAULT_AUTH_MESSAGES соответствует AuthMessages интерфейсу
- Contract тесты: проверка что все обязательные поля присутствуют в интерфейсе
- Localization тесты: проверка совместимости с i18n системами
- Content тесты: проверка что сообщения понятны и грамматически корректны
- Consistency тесты: единообразие стиля и тона всех сообщений
- Length тесты: проверка что сообщения помещаются в UI компоненты
- Accessibility тесты: совместимость с screen readers

**Оценка сложности (low/medium/high)**

**low** — простые типы и константы без логики, но важные для type safety системы.

**TODO / Рефакторинг**

- Добавить поддержку дополнительных auth операций (2FA, социальная авторизация)
- Рассмотреть добавление категоризации сообщений по типам (success, error, info)
- Добавить validation для длины сообщений для UI constraints
- Реализовать integration с i18n системой для автоматических переводов
- Добавить metadata для сообщений (context, target audience, urgency)
- Рассмотреть создание builder pattern для динамического создания сообщений
- Добавить JSDoc документацию с контекстом использования каждого сообщения
