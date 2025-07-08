import { TRANSACTION_TYPES } from '@repo/constants';
import { createStore } from '@repo/utils';

/**
 * Trading State Types
 */
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

interface TradingState {
  // Portfolio state
  portfolio: Portfolio | null;
  isPortfolioLoading: boolean;

  // Active trades
  activeTrades: Trade[];
  selectedTrade: Trade | null;

  // Trading form state
  tradingPair: { base: string; quote: string };
  tradeAmount: number;
  tradeSide: typeof TRANSACTION_TYPES.BUY | typeof TRANSACTION_TYPES.SELL;

  // UI state
  sidebarCollapsed: boolean;
  activeTab: 'overview' | 'trading' | 'portfolio' | 'transactions';

  // Actions
  setPortfolio: (portfolio: Portfolio) => void;
  setPortfolioLoading: (loading: boolean) => void;
  setActiveTrades: (trades: Trade[]) => void;
  setSelectedTrade: (trade: Trade | null) => void;
  setTradingPair: (pair: { base: string; quote: string }) => void;
  setTradeAmount: (amount: number) => void;
  setTradeSide: (side: typeof TRANSACTION_TYPES.BUY | typeof TRANSACTION_TYPES.SELL) => void;
  toggleSidebar: () => void;
  setActiveTab: (tab: 'overview' | 'trading' | 'portfolio' | 'transactions') => void;

  // Computed values
  getAssetBalance: (symbol: string) => number;
  getTotalPortfolioValue: () => number;
}

/**
 * Trading Store
 *
 * Manages trading-specific state including:
 * - Portfolio data and loading states
 * - Active trades and selected trade
 * - Trading form state (pair, amount, side)
 * - Trading UI state (sidebar, tabs)
 *
 * @example
 * ```tsx
 * import { useTradingStore } from '@repo/hooks/state'
 *
 * function TradingComponent() {
 *   const { portfolio, setTradingPair } = useTradingStore()
 *   return <div>Portfolio: {portfolio?.totalValue}</div>
 * }
 * ```
 */
export const useTradingStore = createStore<TradingState>('trading-store', (set, get) => ({
  // Initial state
  portfolio: null,
  isPortfolioLoading: false,
  activeTrades: [],
  selectedTrade: null,
  tradingPair: { base: 'BTC', quote: 'USD' },
  tradeAmount: 0,
  tradeSide: TRANSACTION_TYPES.BUY,
  sidebarCollapsed: false,
  activeTab: 'overview',

  // Actions
  setPortfolio: (portfolio: Portfolio) => set({ portfolio }),
  setPortfolioLoading: (loading: boolean) => set({ isPortfolioLoading: loading }),
  setActiveTrades: (trades: Trade[]) => set({ activeTrades: trades }),
  setSelectedTrade: (trade: Trade | null) => set({ selectedTrade: trade }),
  setTradingPair: (pair: { base: string; quote: string }) => set({ tradingPair: pair }),
  setTradeAmount: (amount: number) => set({ tradeAmount: amount }),
  setTradeSide: (side: typeof TRANSACTION_TYPES.BUY | typeof TRANSACTION_TYPES.SELL) =>
    set({ tradeSide: side }),
  toggleSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setActiveTab: (tab: 'overview' | 'trading' | 'portfolio' | 'transactions') =>
    set({ activeTab: tab }),

  // Computed values
  getAssetBalance: (symbol: string) => {
    const { portfolio } = get();
    if (!portfolio) return 0;
    const asset = portfolio.assets.find(a => a.symbol === symbol);
    return asset ? asset.amount : 0;
  },

  getTotalPortfolioValue: () => {
    const { portfolio } = get();
    return portfolio ? portfolio.totalValue : 0;
  },
}));

// Persist trading pair to localStorage
if (typeof window !== 'undefined') {
  useTradingStore.subscribe(
    state => state.tradingPair,
    tradingPair => {
      localStorage.setItem('trading-pair', JSON.stringify(tradingPair));
    }
  );
}
