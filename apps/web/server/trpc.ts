import { initTRPC } from '@trpc/server'
import { z } from 'zod'

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure

// Trading related schemas
const CurrencyPairSchema = z.object({
    base: z.string(),
    quote: z.string(),
})

const TradeSchema = z.object({
    id: z.string(),
    pair: CurrencyPairSchema,
    amount: z.number(),
    price: z.number(),
    side: z.enum(['buy', 'sell']),
    timestamp: z.date(),
    status: z.enum(['pending', 'completed', 'failed']),
})

// Mock data for development
const mockTrades: Array<{
    id: string
    pair: { base: string; quote: string }
    amount: number
    price: number
    side: 'buy' | 'sell'
    timestamp: Date
    status: 'pending' | 'completed' | 'failed'
}> = [
        {
            id: '1',
            pair: { base: 'BTC', quote: 'USD' },
            amount: 0.001,
            price: 45000,
            side: 'buy' as const,
            timestamp: new Date(),
            status: 'completed' as const,
        },
        {
            id: '2',
            pair: { base: 'ETH', quote: 'USD' },
            amount: 0.5,
            price: 3000,
            side: 'sell' as const,
            timestamp: new Date(),
            status: 'pending' as const,
        },
    ]

const mockPortfolio = {
    totalValue: 12345.67,
    assets: [
        { symbol: 'BTC', amount: 0.25, value: 11250, change: 5.2 },
        { symbol: 'ETH', amount: 2.5, value: 7500, change: -2.1 },
        { symbol: 'USD', amount: 1000, value: 1000, change: 0 },
    ],
}

export const appRouter = router({
    // Trading procedures
    trades: router({
        getAll: publicProcedure.query(() => mockTrades),

        getById: publicProcedure
            .input(z.string())
            .query(({ input }) => mockTrades.find(trade => trade.id === input)),

        create: publicProcedure
            .input(z.object({
                pair: CurrencyPairSchema,
                amount: z.number().positive(),
                side: z.enum(['buy', 'sell']),
            }))
            .mutation(async ({ input }) => {
                const newTrade = {
                    id: Math.random().toString(36).substr(2, 9),
                    ...input,
                    price: input.pair.base === 'BTC' ? 45000 : 3000, // Mock price
                    timestamp: new Date(),
                    status: 'pending' as const,
                }
                mockTrades.push(newTrade)
                return newTrade
            }),
    }),

    // Portfolio procedures  
    portfolio: router({
        get: publicProcedure.query(() => mockPortfolio),

        getBalance: publicProcedure
            .input(z.string())
            .query(({ input }) => {
                const asset = mockPortfolio.assets.find(a => a.symbol === input)
                return asset ? asset.amount : 0
            }),
    }),

    // Market data procedures
    market: router({
        getPrices: publicProcedure.query(() => ({
            BTC: { price: 45000, change: 5.2 },
            ETH: { price: 3000, change: -2.1 },
            LTC: { price: 150, change: 1.8 },
        })),

        getPair: publicProcedure
            .input(CurrencyPairSchema)
            .query(({ input }) => ({
                pair: input,
                price: input.base === 'BTC' ? 45000 : 3000,
                volume24h: Math.random() * 1000000,
                change24h: (Math.random() - 0.5) * 10,
            })),
    }),

    // User procedures
    user: router({
        getProfile: publicProcedure.query(() => ({
            id: 'user-1',
            email: 'user@example.com',
            name: 'John Doe',
            verificationLevel: 'verified',
            createdAt: new Date('2024-01-01'),
        })),
    }),
})

export type AppRouter = typeof appRouter
