# trading-store.ts - Анализ файла

## Краткое назначение

Zustand store для управления торговым интерфейсом и портфелем пользователя с локальным сохранением настроек.

## Подробное описание

### Основная функциональность

Файл предоставляет trading store для:

- Portfolio management и loading states
- Active trades tracking
- Trading form state (pair, amount, side)
- UI state management (sidebar, tabs)
- Computed values для portfolio calculations
- LocalStorage persistence для trading pair

### Ключевые особенности

- **Portfolio tracking**: Asset balances и total value calculations
- **Trade management**: Active trades и selected trade state
- **Form state**: Trading pair, amount, side configuration
- **UI state**: Sidebar collapse, active tab management
- **Persistence**: Trading pair сохраняется в localStorage
- **Computed methods**: Helper methods для calculations

### Архитектурные решения

- Simple state management без complex actions
- LocalStorage integration для persistence
- Computed values через getter methods
- Type safety через TRANSACTION_TYPES constants
- Direct state updates через set operations

## Экспортируемые сущности / API

### Core types

```typescript
export interface Trade {
  id: string;
  pair: { base: string; quote: string };
  amount: number;
  price: number;
  side: typeof TRANSACTION_TYPES.BUY | typeof TRANSACTION_TYPES.SELL;
  timestamp: Date;
  status: 'pending' | 'completed' | 'failed';
}

export interface Portfolio {
  totalValue: number;
  assets: Array<{
    symbol: string;
    amount: number;
    value: number;
    change: number;
  }>;
}
```

### Store interface

```typescript
interface TradingState {
  // State
  portfolio: Portfolio | null;
  isPortfolioLoading: boolean;
  activeTrades: Trade[];
  selectedTrade: Trade | null;
  tradingPair: { base: string; quote: string };
  tradeAmount: number;
  tradeSide: typeof TRANSACTION_TYPES.BUY | typeof TRANSACTION_TYPES.SELL;
  sidebarCollapsed: boolean;
  activeTab: 'overview' | 'trading' | 'portfolio' | 'transactions';

  // Actions (setter methods)
  // Computed methods
  getAssetBalance: (symbol: string) => number;
  getTotalPortfolioValue: () => number;
}
```

## Зависимости

### Внутренние зависимости

- `@repo/constants` - TRANSACTION_TYPES
- `@repo/utils` - createStore

### Внешние зависимости

- Browser localStorage API

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/state/index.ts` - barrel export с types
- `packages/hooks/src/client-hooks.ts` - client-side export
- Trading components и pages

### Используется совместно с

- Transaction constants для type safety
- LocalStorage для persistence

## Возможные улучшения и риски

### Текущие риски

- **LocalStorage dependency**: Не работает в SSR без проверок
- **Simple state management**: Может быть недостаточно для complex trading scenarios
- **No error handling**: LocalStorage operations могут fail

### Рекомендации по улучшению

1. **Enhanced persistence**: Better persistence strategy с error handling
2. **Complex trading logic**: Add sophisticated trading operations
3. **Real-time updates**: Integration с WebSocket для live data
4. **Error boundaries**: Better error handling throughout

## TODO и планы развития

### Краткосрочные задачи

- [ ] Add error handling для localStorage operations
- [ ] Enhance portfolio calculations
- [ ] Add trade validation logic

### Долгосрочные задачи

- [ ] Real-time trading integration
- [ ] Advanced portfolio analytics
- [ ] Trade execution system
- [ ] Performance optimization

## Дополнительные заметки

### Store design philosophy

Simple, focused trading store:

- Direct state updates без complex actions
- Computed values through getter methods
- Minimal business logic
- Clear separation of concerns

### State categories

- **Portfolio data**: Core financial information
- **Trading form**: User input state
- **UI state**: Interface configuration
- **Trade tracking**: Active operations

### Persistence strategy

Uses localStorage subscription:

```typescript
useTradingStore.subscribe(
  state => state.tradingPair,
  tradingPair => {
    localStorage.setItem('trading-pair', JSON.stringify(tradingPair));
  }
);
```

### Type safety approach

- Uses TRANSACTION_TYPES constants для type constraints
- Exported types для external usage
- Interface definitions для all data structures
- Union types для limited options (tabs, trade status)

### Computed methods design

- `getAssetBalance`: Find specific asset amount
- `getTotalPortfolioValue`: Portfolio total value calculation
- Both handle null portfolio gracefully

### Trading pair structure

Consistent pair format:

```typescript
{
  base: string;
  quote: string;
}
// Example: { base: 'BTC', quote: 'USD' }
```

### Tab management

Fixed set of tabs:

- 'overview': Portfolio overview
- 'trading': Active trading interface
- 'portfolio': Detailed portfolio view
- 'transactions': Transaction history

### Portfolio structure

Comprehensive portfolio information:

- Total portfolio value
- Individual asset details (symbol, amount, value, change)
- Change tracking для performance metrics

### Trade lifecycle

Trade statuses:

- 'pending': Submitted но not executed
- 'completed': Successfully executed
- 'failed': Execution failed

### Performance considerations

- Simple state updates minimize re-renders
- Computed methods called only when needed
- LocalStorage writes только when trading pair changes
- No expensive calculations в store

### Integration patterns

Store designed для:

- Direct component usage
- Portfolio display components
- Trading form components
- UI layout components

### Error handling gaps

Current implementation не handles:

- LocalStorage quota exceeded
- Portfolio data corruption
- Network failures for trade data
- Invalid trade parameters

### Future extensibility

Architecture supports:

- Real-time data integration
- More sophisticated trading algorithms
- Enhanced portfolio analytics
- Advanced order types

### SSR considerations

LocalStorage code wrapped в browser check:

```typescript
if (typeof window !== 'undefined') {
  // localStorage code
}
```

### State initialization

Reasonable defaults:

- Default trading pair: BTC/USD
- Empty arrays для trades
- Sidebar expanded by default
- Overview tab active by default
