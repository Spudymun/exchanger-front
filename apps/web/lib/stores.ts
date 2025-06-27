import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// Trading state types
interface Trade {
    id: string
    pair: { base: string; quote: string }
    amount: number
    price: number
    side: 'buy' | 'sell'
    timestamp: Date
    status: 'pending' | 'completed' | 'failed'
}

interface Portfolio {
    totalValue: number
    assets: Array<{
        symbol: string
        amount: number
        value: number
        change: number
    }>
}

interface TradingState {
    // Portfolio state
    portfolio: Portfolio | null
    isPortfolioLoading: boolean

    // Active trades
    activeTrades: Trade[]
    selectedTrade: Trade | null

    // Trading form state
    tradingPair: { base: string; quote: string }
    tradeAmount: number
    tradeSide: 'buy' | 'sell'

    // UI state
    sidebarCollapsed: boolean
    activeTab: 'overview' | 'trading' | 'portfolio' | 'transactions'

    // Actions
    setPortfolio: (portfolio: Portfolio) => void
    setPortfolioLoading: (loading: boolean) => void
    setActiveTrades: (trades: Trade[]) => void
    setSelectedTrade: (trade: Trade | null) => void
    setTradingPair: (pair: { base: string; quote: string }) => void
    setTradeAmount: (amount: number) => void
    setTradeSide: (side: 'buy' | 'sell') => void
    toggleSidebar: () => void
    setActiveTab: (tab: 'overview' | 'trading' | 'portfolio' | 'transactions') => void

    // Computed values
    getAssetBalance: (symbol: string) => number
    getTotalPortfolioValue: () => number
}

export const useTradingStore = create<TradingState>()(
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
            const { portfolio } = get()
            if (!portfolio) return 0
            const asset = portfolio.assets.find(a => a.symbol === symbol)
            return asset ? asset.amount : 0
        },

        getTotalPortfolioValue: () => {
            const { portfolio } = get()
            return portfolio ? portfolio.totalValue : 0
        },
    }))
)

// UI-specific state
interface UIState {
    theme: 'light' | 'dark' | 'system'
    sidebarOpen: boolean
    modals: {
        settings: boolean
        trade: boolean
        deposit: boolean
        withdraw: boolean
    }
    notifications: Array<{
        id: string
        type: 'success' | 'error' | 'warning' | 'info'
        title: string
        message: string
        timestamp: Date
    }>

    setTheme: (theme: 'light' | 'dark' | 'system') => void
    toggleSidebar: () => void
    openModal: (modal: keyof UIState['modals']) => void
    closeModal: (modal: keyof UIState['modals']) => void
    addNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) => void
    removeNotification: (id: string) => void
    clearNotifications: () => void
}

export const useUIStore = create<UIState>((set) => ({
    theme: 'system',
    sidebarOpen: true,
    modals: {
        settings: false,
        trade: false,
        deposit: false,
        withdraw: false,
    },
    notifications: [],

    setTheme: (theme) => set({ theme }),
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    openModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: true }
    })),
    closeModal: (modal) => set((state) => ({
        modals: { ...state.modals, [modal]: false }
    })),
    addNotification: (notification) => set((state) => ({
        notifications: [...state.notifications, {
            ...notification,
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date(),
        }]
    })),
    removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id)
    })),
    clearNotifications: () => set({ notifications: [] }),
}))

// Persist certain state to localStorage
if (typeof window !== 'undefined') {
    useTradingStore.subscribe(
        (state) => {
            localStorage.setItem('trading-pair', JSON.stringify(state.tradingPair))
        }
    )

    useUIStore.subscribe(
        (state) => {
            localStorage.setItem('theme', state.theme)
        }
    )
}
