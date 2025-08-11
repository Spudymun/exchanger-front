### Путь: apps/web/src/server/trpc/routers/auth.ts

**Краткое назначение (1 предложение)**

tRPC роутер для полного цикла аутентификации пользователей включая регистрацию, вход, выход и восстановление пароля.

**Подробное описание (3–6 предложений)**

Роутер реализует комплексную систему аутентификации с использованием bcrypt для хеширования паролей, HTTP-only cookies для управления сессиями и CAPTCHA защитой от автоматизированных атак. Каждая критическая операция защищена rate limiting middleware и включает имитацию временных задержек для защиты от timing attacks. Система использует email-based поток с подтверждением адреса электронной почты и безопасным восстановлением пароля через временные коды. Валидация входных данных осуществляется через Zod схемы с поддержкой локализованных сообщений об ошибках. Реализация включает debug логирование и mock функциональность для разработки, но содержит TODO для production интеграции с email сервисами.

**Экспортируемые сущности / API**

- `export const authRouter` — композитный роутер с процедурами:
  - `register` — регистрация нового пользователя с CAPTCHA
  - `login` — вход в систему с проверкой credentials
  - `logout` — выход с очисткой сессии
  - `getSession` — получение текущей сессии пользователя
  - `requestPasswordReset` — запрос кода восстановления пароля
  - `resetPassword` — сброс пароля с новым паролем
  - `verifyEmail` — подтверждение email адреса

**Входы (expected inputs) / Параметры**

- `register`: `RegisterInput` — email, password, confirmPassword, captcha
- `login`: `LoginInput` — email, password, captcha
- `logout`: без параметров
- `getSession`: без параметров
- `requestPasswordReset`: `ResetPasswordInput` — email
- `resetPassword`: `ConfirmResetPasswordInput` — email, code, newPassword
- `verifyEmail`: `ConfirmEmailInput` — email, confirmationCode

**Выходы / Побочные эффекты**

- Установка/очистка HTTP-only cookies с sessionId
- Создание/обновление пользователей в userManager
- Console логирование всех auth операций
- Mock отправка email уведомлений (console.log)
- Возврат sanitized пользовательских данных без sensitive информации
- Обновление lastLoginAt timestamp при входе

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `./index.ts` — композиция в главный appRouter
- Клиентский tRPC код через `trpc.auth.*` вызовы
- Компоненты формы аутентификации в web приложении

Файлы, которые импортируются здесь:

- `@repo/constants` — AUTH_CONSTANTS, VALIDATION_LIMITS
- `@repo/exchange-core` — userManager, generateSessionId, sanitizeEmail, isAuthenticatedUser
- `@repo/utils` — все Zod схемы валидации и фабрики ошибок
- `bcryptjs` — хеширование паролей
- `../../utils/delay` — имитация задержек для security
- `../init` — createTRPCRouter, publicProcedure
- `../middleware/rateLimit` — защита от злоупотреблений

**Домен данных / типы**

```typescript
// Input типы (из @repo/utils schemas)
interface RegisterInput {
  email: string;
  password: string;
  confirmPassword: string;
  captcha: string;
}

interface LoginInput {
  email: string;
  password: string;
  captcha: string;
}

// Output типы
interface AuthResponse {
  user: {
    id: string;
    email: string;
    isVerified: boolean;
  };
  sessionId: string;
}

interface SessionResponse {
  user: User | null;
}
```

**Риски и безопасность**

- **CRITICAL**: Mock email отправка не подходит для production
- **Password security**: Использование bcrypt с правильными rounds
- **Timing attacks**: Добавлены задержки для защиты
- **Information disclosure**: Осторожная обработка несуществующих пользователей
- **Session management**: HTTP-only cookies для защиты от XSS
- **Rate limiting**: Защита от brute force атак
- **CAPTCHA bypass**: Простая проверка на заполненность недостаточна

**Тесты / рекомендации по покрытию**

- Unit тесты каждой процедуры с валидными и невалидными данными
- Integration тесты полного flow: регистрация → подтверждение → вход
- Security тесты: brute force, CAPTCHA bypass, timing attacks
- Edge cases: дублирование email, неверные пароли, expired sessions
- Performance тесты rate limiting и bcrypt операций
- E2E тесты с real браузером для cookie handling

**Оценка сложности (low/medium/high)**

**high** — критическая система безопасности с множественными проверками и edge cases

**TODO / Рефакторинг**

- **PRIORITY 1**: Интеграция с реальным email сервисом (SendGrid, AWS SES)
- **PRIORITY 2**: Реализация proper CAPTCHA решения (hCaptcha, reCAPTCHA)
- Добавить двухфакторную аутентификацию (2FA)
- Реализовать refresh tokens для долгосрочных сессий
- Добавить аудит логирование в безопасную систему (не console.log)
- Реализовать blacklist для скомпрометированных сессий
- Добавить геолокацию и device fingerprinting для подозрительных входов
