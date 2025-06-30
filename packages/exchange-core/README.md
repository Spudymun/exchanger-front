# @repo/exchange-core

Core business logic package for ExchangeGO cryptocurrency exchange.

## Overview

This package contains the fundamental types, utilities, and business logic for ExchangeGO - a Ukrainian cryptocurrency exchange service that enables one-way exchanges from crypto to UAH.

## Types

### Currency Types

- `CryptoCurrency`: Supported cryptocurrencies (BTC, ETH, USDT, LTC)
- `CurrencyInfo`: Extended information about each currency
- `ExchangeRate`: Exchange rate data with commission

### Order Types

- `Order`: Complete order data structure
- `CreateOrderRequest`: Request payload for creating orders
- `OrderStatus`: Order lifecycle statuses

### User Types

- `User`: User account data
- `CreateUserRequest`: User creation payload
- `LoginRequest`: Authentication payload

## Installation

This package is part of the monorepo workspace:

```bash
# In monorepo root
npm install
```

## Usage

```typescript
import { CryptoCurrency, Order, User } from '@repo/exchange-core';

// Use types in your components
const supportedCurrency: CryptoCurrency = 'BTC';
```

## Development

```bash
# Type checking
npm run check-types

# Build package
npm run build
```

## Status

✅ **TASK 1.1 COMPLETED**: Basic architecture with core types

### What's included:

- [x] Package structure and configuration
- [x] TypeScript setup with proper compilation
- [x] Core cryptocurrency types
- [x] Order management types
- [x] User authentication types
- [x] Type exports and module structure

### Next steps:

- TASK 1.3: Add utilities and validation functions
- TASK 1.4: Add mock data and JSON managers

## Notes

All types properly import constants from `@repo/constants` following monorepo architecture. No temporary solutions or hardcoded values are used.
