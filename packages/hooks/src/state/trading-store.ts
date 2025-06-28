import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

/**
 * Trading State Types
 */
export interface Trade {
    id: string;
    pair: { base: string; quote: string };
    amount: number;
    price: number;
    side: 'buy' | 'sell';
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
    tradeSide: 'buy' | 'sell';

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
    setTradeSide: (side: 'buy' | 'sell') => void;
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
export const useTradingStore = create<TradingState>()(
    devtools(
        subscribeWithSelector((set, get) => ({
            // Initial state
            portfolio: null,
            isPortfolioLoading: false,
            activeTrades: [],
            selectedTrade: null,
            tradingPair: { base: 'BTC', quote: 'USD' },
            tradeAmount: 0,
            tradeSide: 'buy',
            sidebarCollapsed: false,
            activeTab: 'overview',

            // Actions
            setPortfolio: (portfolio) => set({ portfolio }),
            setPortfolioLoading: (loading) => set({ isPortfolioLoading: loading }),
            setActiveTrades: (trades) => set({ activeTrades: trades }),
            setSelectedTrade: (trade) => set({ selectedTrade: trade }),
            setTradingPair: (pair) => set({ tradingPair: pair }),
            setTradeAmount: (amount) => set({ tradeAmount: amount }),
            setTradeSide: (side) => set({ tradeSide: side }),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setActiveTab: (tab) => set({ activeTab: tab }),

            // Computed values
            getAssetBalance: (symbol) => {
                const { portfolio } = get();
                if (!portfolio) return 0;
                const asset = portfolio.assets.find(a => a.symbol === symbol);
                return asset ? asset.amount : 0;
            },

            getTotalPortfolioValue: () => {
                const { portfolio } = get();
                return portfolio ? portfolio.totalValue : 0;
            },
        })),
        {
            name: 'trading-store',
        }
    )
);

// Persist trading pair to localStorage
if (typeof window !== 'undefined') {
    useTradingStore.subscribe(
        (state) => state.tradingPair,
        (tradingPair) => {
            localStorage.setItem('trading-pair', JSON.stringify(tradingPair));
        }
    );
}
