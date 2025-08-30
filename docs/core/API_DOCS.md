# 📡 API Documentation

**Дата создания:** 19 августа 2025  
**Версия:** 2.0  
**Архитектура:** tRPC v11 + Next.js 15 + TypeScript + Security-Enhanced Schemas

## 🏗️ Архитектура API

### Namespace структура tRPC роутеров

```typescript
trpc.{router}.{subrouter?}.{procedure}
```

#### Основные роутеры:

- **`exchange`** - Операции обмена криптовалют
- **`fiat`** - Фиатные валюты и банки
- **`auth`** - Аутентификация и авторизация
- **`user`** - Пользовательские операции (namespace композиция)
- **`operator`** - Операторские функции (роль OPERATOR)
- **`support`** - Техподдержка (роль SUPPORT)
- **`shared`** - Общие функции (OPERATOR + SUPPORT)

### Middleware и безопасность

#### Authentication Middleware:

- **`publicProcedure`** - Публичные endpoints
- **`protectedProcedure`** - Требует аутентификации
- **`operatorOnly`** - Только для роли OPERATOR
- **`supportOnly`** - Только для роли SUPPORT
- **`operatorAndSupport`** - Для OPERATOR и SUPPORT

#### Rate Limiting:

```typescript
rateLimitMiddleware.{action} // createOrder, register, login, resetPassword
```

---

## 🔐 Authentication Router (`auth`)

### `auth.register`

**Тип:** `mutation` | **Middleware:** `rateLimitMiddleware.register`

```tsx
const register = trpc.auth.register.useMutation();

register.mutate({
  email: 'user@example.com',
  password: 'SecurePass123!',
  confirmPassword: 'SecurePass123!',
  captcha: 'captcha_token',
});
```

**Input Schema:** `securityEnhancedRegisterSchema`
**Rate Limit:** 5 попыток / 24 часа
**Response:**

```typescript
{
  user: { id: string, email: string, isVerified: boolean },
  sessionId: string
}
```

### `auth.login`

**Тип:** `mutation` | **Middleware:** `rateLimitMiddleware.login`

```tsx
const login = trpc.auth.login.useMutation();

login.mutate({
  email: 'user@example.com',
  password: 'SecurePass123!',
  captcha: 'captcha_token',
});
```

**Rate Limit:** 10 попыток / 15 минут
**Sets Cookie:** `sessionId` (HttpOnly, SameSite=Lax)

### `auth.logout`

**Тип:** `mutation` | **Middleware:** `publicProcedure`

```tsx
const logout = trpc.auth.logout.useMutation();
logout.mutate();
```

**Clears Cookie:** `sessionId`

### `auth.getSession`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: session } = trpc.auth.getSession.useQuery();
// session.user: User | null
```

### `auth.requestPasswordReset`

**Тип:** `mutation` | **Middleware:** `rateLimitMiddleware.resetPassword`

```tsx
const resetRequest = trpc.auth.requestPasswordReset.useMutation();

resetRequest.mutate({
  email: 'user@example.com',
});
```

**Rate Limit:** 3 попытки / час

### `auth.resetPassword`

**Тип:** `mutation` | **Middleware:** `publicProcedure`

```tsx
const resetPassword = trpc.auth.resetPassword.useMutation();

resetPassword.mutate({
  email: 'user@example.com',
  resetCode: 'ABC123',
  newPassword: 'NewSecurePass123!',
});
```

### `auth.verifyEmail`

**Тип:** `mutation` | **Middleware:** `publicProcedure`

```tsx
const verifyEmail = trpc.auth.verifyEmail.useMutation();

verifyEmail.mutate({
  email: 'user@example.com',
  verificationCode: 'XYZ789',
});
```

---

## 💰 Exchange Router (`exchange`)

### `exchange.getRates`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: rates } = trpc.exchange.getRates.useQuery();
```

**Response:**

```typescript
{
  rates: Array<{
    currency: CryptoCurrency,
    uahRate: number,
    commission: number,
    timestamp: Date
  }>,
  timestamp: Date
}
```

### `exchange.getLimits`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: limits } = trpc.exchange.getLimits.useQuery({
  currency: 'BTC',
});
```

**Input Schema:** `securityEnhancedGetCurrencyRateSchema`

### `exchange.calculateExchange`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: calculation } = trpc.exchange.calculateExchange.useQuery({
  amount: 0.1,
  currency: 'BTC',
  direction: 'crypto-to-uah', // or "uah-to-crypto"
});
```

**Response:**

```typescript
{
  cryptoAmount: number,
  uahAmount: number,
  rate: number,
  commission: number,
  commissionAmount: number
}
```

### `exchange.createOrder`

**Тип:** `mutation` | **Middleware:** `rateLimitMiddleware.createOrder`

```tsx
const createOrder = trpc.exchange.createOrder.useMutation();

createOrder.mutate({
  email: 'user@example.com',
  cryptoAmount: 0.1,
  currency: 'BTC',
  recipientData: {
    cardNumber: '4111111111111111',
    bankDetails: 'ПриватБанк',
  },
});
```

**Rate Limit:** 3 попытки / час
**Input Schema:** `securityEnhancedCreateExchangeOrderSchema`

### `exchange.getOrderStatus`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: order } = trpc.exchange.getOrderStatus.useQuery({
  orderId: 'order_123',
});
```

### `exchange.getOrderHistory`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: history } = trpc.exchange.getOrderHistory.useQuery({
  email: 'user@example.com',
  limit: 10,
});
```

### `exchange.getSupportedCurrencies`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: currencies } = trpc.exchange.getSupportedCurrencies.useQuery();
```

**Response:**

```typescript
Array<{
  symbol: CryptoCurrency;
  name: string;
  rate: number;
  commission: number;
  limits: { min: number; max: number };
  isActive: boolean;
}>;
```

---

## 💵 Fiat Router (`fiat`)

### `fiat.getSupportedFiatCurrencies`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: fiatCurrencies } = trpc.fiat.getSupportedFiatCurrencies.useQuery();
```

### `fiat.getBanksForFiatCurrency`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: banks } = trpc.fiat.getBanksForFiatCurrency.useQuery({
  currency: 'UAH',
});
```

### `fiat.getBankInfo`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: bankInfo } = trpc.fiat.getBankInfo.useQuery({
  bankId: 'privatbank',
  currency: 'UAH',
});
```

### `fiat.calculateFiatExchange`

**Тип:** `query` | **Middleware:** `publicProcedure`

```tsx
const { data: calc } = trpc.fiat.calculateFiatExchange.useQuery({
  cryptoAmount: 0.1,
  fromCurrency: 'BTC',
  toCurrency: 'USD',
  bankId: 'privatbank',
});
```

---

## 👤 User Router (`user`) - Namespace Композиция

### Profile Sub-router (`user.profile`)

#### `user.profile.getProfile`

**Тип:** `query` | **Middleware:** `protectedProcedure`

```tsx
const { data: profile } = trpc.user.profile.getProfile.useQuery();
```

**Response:**

```typescript
{
  id: string,
  email: string,
  isVerified: boolean,
  createdAt: Date,
  lastLoginAt: Date,
  stats: {
    totalOrders: number,
    completedOrders: number
  }
}
```

#### `user.profile.updateProfile`

**Тип:** `mutation` | **Middleware:** `protectedProcedure`

```tsx
const updateProfile = trpc.user.profile.updateProfile.useMutation();

updateProfile.mutate({
  notifications: { email: true, sms: false },
});
```

### Security Sub-router (`user.security`)

#### `user.security.changePassword`

**Тип:** `mutation` | **Middleware:** `protectedProcedure`

```tsx
const changePassword = trpc.user.security.changePassword.useMutation();

changePassword.mutate({
  currentPassword: 'OldPass123!',
  newPassword: 'NewPass123!',
  confirmPassword: 'NewPass123!',
});
```

**Input Schema:** `securityEnhancedChangePasswordSchema`

#### `user.security.resendVerificationEmail`

**Тип:** `mutation` | **Middleware:** `protectedProcedure`

```tsx
const resendEmail = trpc.user.security.resendVerificationEmail.useMutation();
resendEmail.mutate();
```

#### `user.security.deleteAccount`

**Тип:** `mutation` | **Middleware:** `protectedProcedure`

```tsx
const deleteAccount = trpc.user.security.deleteAccount.useMutation();

deleteAccount.mutate({
  password: 'MyPassword123!',
  confirmation: 'DELETE_MY_ACCOUNT',
});
```

### Orders Sub-router (`user.orders`)

#### `user.orders.getOrderHistory`

**Тип:** `query` | **Middleware:** `protectedProcedure`

```tsx
const { data: orders } = trpc.user.orders.getOrderHistory.useQuery({
  limit: 20,
  offset: 0,
  status: 'completed', // optional filter
});
```

#### `user.orders.getOrderDetails`

**Тип:** `query` | **Middleware:** `protectedProcedure`

```tsx
const { data: orderDetails } = trpc.user.orders.getOrderDetails.useQuery({
  orderId: 'order_123',
});
```

#### `user.orders.cancelOrder`

**Тип:** `mutation` | **Middleware:** `protectedProcedure`

```tsx
const cancelOrder = trpc.user.orders.cancelOrder.useMutation();

cancelOrder.mutate({
  orderId: 'order_123',
});
```

---

## 🔧 Operator Router (`operator`) - Роль OPERATOR

### `operator.getPendingOrders`

**Тип:** `query` | **Middleware:** `operatorOnly`

```tsx
const { data: orders } = trpc.operator.getPendingOrders.useQuery({
  limit: 50,
  cursor: 'cursor_abc',
  status: 'pending',
});
```

**Cursor Pagination Response:**

```typescript
{
  items: Order[],
  nextCursor?: string,
  hasMore: boolean
}
```

### `operator.takeOrder`

**Тип:** `mutation` | **Middleware:** `operatorOnly`

```tsx
const takeOrder = trpc.operator.takeOrder.useMutation();

takeOrder.mutate({
  orderId: 'order_123',
});
```

**Business Logic:** PENDING → PROCESSING

### `operator.updateOrderStatus`

**Тип:** `mutation` | **Middleware:** `operatorOnly`

```tsx
const updateStatus = trpc.operator.updateOrderStatus.useMutation();

updateStatus.mutate({
  orderId: 'order_123',
  status: 'completed',
  comment: 'Транзакция подтверждена',
});
```

**Input Schema:** `securityEnhancedUpdateOrderStatusSchema`
**Status Transitions:** Валидируется через `canTransitionStatus()`

### `operator.getMyStats`

**Тип:** `query` | **Middleware:** `operatorOnly`

```tsx
const { data: stats } = trpc.operator.getMyStats.useQuery();
```

---

## 🎫 Support Router (`support`) - Роль SUPPORT

### `support.searchKnowledge`

**Тип:** `query` | **Middleware:** `supportOnly`

```tsx
const { data: articles } = trpc.support.searchKnowledge.useQuery({
  query: 'email подтверждение',
  category: 'Техподдержка',
  limit: 10,
});
```

### `support.createTicket`

**Тип:** `mutation` | **Middleware:** `supportOnly`

```tsx
const createTicket = trpc.support.createTicket.useMutation();

createTicket.mutate({
  userId: 'user_123',
  subject: 'Проблема с заявкой',
  description: 'Подробное описание проблемы',
  priority: 'HIGH',
  category: 'Техподдержка',
});
```

### `support.getTickets`

**Тип:** `query` | **Middleware:** `supportOnly`

```tsx
const { data: tickets } = trpc.support.getTickets.useQuery({
  status: 'open',
  priority: 'HIGH',
  limit: 25,
});
```

### `support.updateTicketStatus`

**Тип:** `mutation` | **Middleware:** `supportOnly`

```tsx
const updateTicket = trpc.support.updateTicketStatus.useMutation();

updateTicket.mutate({
  ticketId: 'ticket_123',
  status: 'resolved',
  comment: 'Проблема решена',
});
```

### `support.getUserInfo`

**Тип:** `query` | **Middleware:** `supportOnly`

```tsx
const { data: userInfo } = trpc.support.getUserInfo.useQuery({
  userId: 'user_123',
});
```

### `support.getMyStats`

**Тип:** `query` | **Middleware:** `supportOnly`

```tsx
const { data: stats } = trpc.support.getMyStats.useQuery();
```

---

## 🤝 Shared Router (`shared`) - OPERATOR + SUPPORT

### `shared.searchOrders`

**Тип:** `query` | **Middleware:** `operatorAndSupport`

```tsx
const { data: orders } = trpc.shared.searchOrders.useQuery({
  query: 'user@example.com',
  dateFrom: '2025-01-01',
  dateTo: '2025-12-31',
  status: 'completed',
  limit: 100,
  offset: 0,
});
```

**Input Schema:** `securityEnhancedSearchOrdersSchema`

### `shared.searchUsers`

**Тип:** `query` | **Middleware:** `operatorAndSupport`

```tsx
const { data: users } = trpc.shared.searchUsers.useQuery({
  query: 'example.com',
  verified: true,
  limit: 50,
  offset: 0,
});
```

### `shared.getGeneralStats`

**Тип:** `query` | **Middleware:** `operatorAndSupport`

```tsx
const { data: stats } = trpc.shared.getGeneralStats.useQuery();
```

**Response:**

```typescript
{
  orders: { total: number, today: number, pending: number, processing: number, completed: number },
  users: { total: number, verified: number, newToday: number },
  currencies: Array<{ currency: string, orders: number, volume: number }>
}
```

### `shared.quickActions`

**Тип:** `mutation` | **Middleware:** `operatorAndSupport`

```tsx
const quickAction = trpc.shared.quickActions.useMutation();

quickAction.mutate({
  action: 'REFRESH_RATES', // "CLEAR_CACHE" | "SEND_NOTIFICATION"
  params: { message: 'Курсы обновлены' },
});
```

---

## 🔧 Type Safety и Error Handling

### Импорт типов

```tsx
import type { AppRouter } from '@/server/trpc';
import type { RouterInputs, RouterOutputs } from '@repo/utils';

// Типы для inputs
type CreateOrderInput = RouterInputs['exchange']['createOrder'];

// Типы для outputs
type GetRatesOutput = RouterOutputs['exchange']['getRates'];
```

### Error Handling

```tsx
const { data, error, isLoading } = trpc.exchange.getRates.useQuery();

if (error) {
  // Типизированные ошибки
  console.error('API Error:', error.message);

  // Rate limiting errors
  if (error.code === 'TOO_MANY_REQUESTS') {
    // Handle rate limit
  }

  // Validation errors
  if (error.code === 'BAD_REQUEST') {
    // Handle validation
  }

  // Auth errors
  if (error.code === 'UNAUTHORIZED') {
    // Redirect to login
  }
}
```

### Централизованные константы

```tsx
import { CRYPTOCURRENCIES, ORDER_STATUSES, USER_ROLES, RATE_LIMITS } from '@repo/constants';

// Вместо магических строк используйте константы
const order = trpc.exchange.createOrder.useMutation();
order.mutate({
  currency: CRYPTOCURRENCIES[0], // "BTC"
  // ...
});
```

### Security-Enhanced Schemas

Все input schemas используют security-enhanced валидацию из `@repo/utils`:

- XSS защита
- SQL injection защита
- CSRF токены
- Rate limiting
- Input sanitization

```tsx
// Схемы автоматически применяют security правила
import {
  securityEnhancedRegisterSchema,
  securityEnhancedCreateExchangeOrderSchema,
} from '@repo/utils';
```

---

## 📊 Rate Limiting

| Действие        | Лимит | Период   | Middleware                          |
| --------------- | ----- | -------- | ----------------------------------- |
| `createOrder`   | 3     | 1 час    | `rateLimitMiddleware.createOrder`   |
| `register`      | 5     | 24 часа  | `rateLimitMiddleware.register`      |
| `login`         | 10    | 15 минут | `rateLimitMiddleware.login`         |
| `resetPassword` | 3     | 1 час    | `rateLimitMiddleware.resetPassword` |

---

## 🛡️ Roles & Permissions

| Роль              | Доступные роутеры                        |
| ----------------- | ---------------------------------------- |
| **Public**        | `exchange`, `fiat`, `auth`               |
| **Authenticated** | `user.*` + Public                        |
| **OPERATOR**      | `operator.*`, `shared.*` + Authenticated |
| **SUPPORT**       | `support.*`, `shared.*` + Authenticated  |

---

## 🔗 Links

- **Validation Schemas:** `packages/utils/src/validation/`
- **Constants:** `packages/constants/src/`
- **Error Handling:** `packages/utils/src/errors/`
- **tRPC Setup:** `apps/web/src/server/trpc/`
