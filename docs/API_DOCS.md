# 📡 API Documentation

## tRPC Endpoints

### 🔐 Authentication
*Currently using mock data - no auth required*

### 💰 Trading

#### `trades.getAll`
```tsx
const trades = trpc.trades.getAll.useQuery()
```
Returns all trades for current user.

#### `trades.create`
```tsx
const createTrade = trpc.trades.create.useMutation()

createTrade.mutate({
  pair: { base: 'BTC', quote: 'USD' },
  amount: 0.1,
  side: 'buy'
})
```
Creates a new trade order.

### 💼 Portfolio

#### `portfolio.get`
```tsx
const portfolio = trpc.portfolio.get.useQuery()
```
Returns user's portfolio with balances and total value.

### 📊 Market Data

#### `market.getPrices`
```tsx
const prices = trpc.market.getPrices.useQuery()
```
Returns current market prices for all supported currencies.

### 👤 User Management

#### `user.getProfile`
```tsx
const profile = trpc.user.getProfile.useQuery()
```
Returns current user profile information.

## Type Safety

All endpoints are fully typed. Import types:
```tsx
import type { AppRouter } from '@/server/trpc'
```

## Error Handling

```tsx
const { data, error, isLoading } = trpc.trades.getAll.useQuery()

if (error) {
  console.error('API Error:', error.message)
}
```
