import { User, Transaction } from './types'

// Simple HTTP client instead of tRPC for now
class ApiClient {
    private baseUrl: string

    constructor(baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api') {
        this.baseUrl = baseUrl
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        })

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`)
        }

        return response.json()
    }

    // User methods
    async getUsers(): Promise<User[]> {
        return this.request<User[]>('/users')
    }

    async getUser(id: string): Promise<User> {
        return this.request<User>(`/users/${id}`)
    }

    async createUser(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
        return this.request<User>('/users', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    async updateUser(id: string, data: Partial<User>): Promise<User> {
        return this.request<User>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    async deleteUser(id: string): Promise<void> {
        return this.request<void>(`/users/${id}`, {
            method: 'DELETE',
        })
    }

    // Transaction methods
    async getTransactions(): Promise<Transaction[]> {
        return this.request<Transaction[]>('/transactions')
    }

    async getTransaction(id: string): Promise<Transaction> {
        return this.request<Transaction>(`/transactions/${id}`)
    }

    async createTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
        return this.request<Transaction>('/transactions', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }
}

// Create singleton instance
export const apiClient = new ApiClient()

// Export for convenience
export { ApiClient }
export type { User, Transaction } from './types'
