import { UI_NUMERIC_CONSTANTS } from '@repo/constants';
import type { ApiUser as User, Transaction } from '@repo/exchange-core';

import { initTRPC } from '@trpc/server';
import { z } from 'zod';

// Initialize tRPC
const t = initTRPC.create();

// Base router and procedure helpers
export const router = t.router;
export const publicProcedure = t.procedure;

// Re-export types for client usage
export type { ApiUser as User, Transaction } from '@repo/exchange-core';

// Mock data for development
const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-14'),
  },
];

const mockTransactions: Transaction[] = [
  {
    id: '1',
    userId: '1',
    amount: 1000,
    currency: 'USD',
    type: 'deposit',
    status: 'completed',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    userId: '2',
    amount: 500,
    currency: 'EUR',
    type: 'exchange',
    status: 'pending',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-12'),
  },
];

// Error messages constants
const ERROR_MESSAGES = {
  USER_NOT_FOUND: 'User not found',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
} as const;

// API Router
export const appRouter = router({
  // Users endpoints
  users: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(UI_NUMERIC_CONSTANTS.DEFAULT_PAGE_SIZE),
          search: z.string().optional(),
        })
      )
      .query(({ input }) => {
        let filteredUsers = mockUsers;

        if (input.search) {
          const searchTerm = input.search.toLowerCase();
          filteredUsers = mockUsers.filter(
            user =>
              user.name.toLowerCase().includes(searchTerm) ||
              user.email.toLowerCase().includes(searchTerm)
          );
        }

        const startIndex = (input.page - 1) * input.limit;
        const endIndex = startIndex + input.limit;

        return {
          users: filteredUsers.slice(startIndex, endIndex),
          total: filteredUsers.length,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(filteredUsers.length / input.limit),
        };
      }),

    getById: publicProcedure.input(z.string()).query(({ input }) => {
      const user = mockUsers.find(u => u.id === input);
      if (!user) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }
      return user;
    }),

    create: publicProcedure
      .input(
        z.object({
          name: z.string().min(1),
          email: z.string().email(),
          role: z.enum(['admin', 'user', 'operator']).default('user'),
        })
      )
      .mutation(({ input }) => {
        const newUser: User = {
          id: Math.random()
            .toString(UI_NUMERIC_CONSTANTS.GRID_LAYOUT_COLS)
            .substr(2, UI_NUMERIC_CONSTANTS.GRID_LAYOUT_ROWS),
          name: input.name,
          email: input.email,
          role: input.role,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockUsers.push(newUser);
        return newUser;
      }),

    update: publicProcedure
      .input(
        z.object({
          id: z.string(),
          name: z.string().min(1).optional(),
          email: z.string().email().optional(),
          role: z.enum(['admin', 'user', 'operator']).optional(),
        })
      )
      .mutation(({ input }) => {
        const userIndex = mockUsers.findIndex(u => u.id === input.id);
        if (userIndex === -1) {
          throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        }
        const existingUser = mockUsers.at(userIndex);
        if (!existingUser) {
          throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
        }

        if (input.name !== undefined) existingUser.name = input.name;
        if (input.email !== undefined) existingUser.email = input.email;
        if (input.role !== undefined) existingUser.role = input.role;
        existingUser.updatedAt = new Date();

        return existingUser;
      }),

    delete: publicProcedure.input(z.string()).mutation(({ input }) => {
      const userIndex = mockUsers.findIndex(u => u.id === input);
      if (userIndex === -1) {
        throw new Error(ERROR_MESSAGES.USER_NOT_FOUND);
      }

      mockUsers.splice(userIndex, 1);
      return { success: true };
    }),
  }),

  // Transactions endpoints
  transactions: router({
    list: publicProcedure
      .input(
        z.object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(UI_NUMERIC_CONSTANTS.DEFAULT_PAGE_SIZE),
          userId: z.string().optional(),
          status: z.enum(['pending', 'completed', 'failed']).optional(),
        })
      )
      .query(({ input }) => {
        let filteredTransactions = mockTransactions;

        if (input.userId) {
          filteredTransactions = filteredTransactions.filter(t => t.userId === input.userId);
        }

        if (input.status) {
          filteredTransactions = filteredTransactions.filter(t => t.status === input.status);
        }

        const startIndex = (input.page - 1) * input.limit;
        const endIndex = startIndex + input.limit;

        return {
          transactions: filteredTransactions.slice(startIndex, endIndex),
          total: filteredTransactions.length,
          page: input.page,
          limit: input.limit,
          totalPages: Math.ceil(filteredTransactions.length / input.limit),
        };
      }),

    getById: publicProcedure.input(z.string()).query(({ input }) => {
      const transaction = mockTransactions.find(t => t.id === input);
      if (!transaction) {
        throw new Error(ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
      }
      return transaction;
    }),

    create: publicProcedure
      .input(
        z.object({
          userId: z.string(),
          amount: z.number().positive(),
          currency: z
            .string()
            .min(UI_NUMERIC_CONSTANTS.CURRENCY_CODE_LENGTH)
            .max(UI_NUMERIC_CONSTANTS.CURRENCY_CODE_LENGTH),
          type: z.enum(['deposit', 'withdrawal', 'exchange']),
        })
      )
      .mutation(({ input }) => {
        const newTransaction: Transaction = {
          id: Math.random()
            .toString(UI_NUMERIC_CONSTANTS.GRID_LAYOUT_COLS)
            .substr(2, UI_NUMERIC_CONSTANTS.GRID_LAYOUT_ROWS),
          userId: input.userId,
          amount: input.amount,
          currency: input.currency,
          type: input.type,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        mockTransactions.push(newTransaction);
        return newTransaction;
      }),
  }),

  // Health check
  health: publicProcedure.query(() => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }),
});

export type AppRouter = typeof appRouter;
