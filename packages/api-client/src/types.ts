// Shared types between client and server
export interface User {
    id: string
    name: string
    email: string
    role: 'admin' | 'user'
    createdAt: Date
    updatedAt: Date
}

export interface Transaction {
    id: string
    userId: string
    amount: number
    currency: string
    type: 'deposit' | 'withdrawal' | 'exchange'
    status: 'pending' | 'completed' | 'failed'
    createdAt: Date
    updatedAt: Date
}

// Re-export AppRouter type only (no runtime code)
export type { AppRouter } from './server'
