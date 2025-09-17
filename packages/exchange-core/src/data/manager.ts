import { VALIDATION_BOUNDS, ORDER_STATUSES } from '@repo/constants';

import type { OrderRepositoryInterface } from '../repositories/order-repository-interface';
import type { User, Order, CreateOrderRequest } from '../types';

// ✅ User repository interface for compatibility
interface UserRepositoryInterface {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User>;
  update(id: string, updates: Partial<Pick<User, 'email' | 'hashedPassword' | 'isVerified' | 'lastLoginAt'>>): Promise<User | undefined>;
  getAll(): Promise<User[]>;
  count(): Promise<number>;
}

// ✅ CONSTANTS - for magic number lint compliance
const DEFAULT_LIMIT = 10;
const SLICE_START_INDEX = 0;
const REPO_ERROR_MESSAGE = 'Repository not available';

// ✅ Factory-based repositories (replaces in-memory arrays)
// These are created through UserManagerFactory.createOrderManager() and UserManagerFactory.create()
let userRepository: UserRepositoryInterface | null = null;
let orderRepository: OrderRepositoryInterface | null = null;

// ✅ BACKWARD COMPATIBILITY: Initialize repositories lazily
async function getUserRepository(): Promise<UserRepositoryInterface> {
  if (!userRepository) {
    const { UserManagerFactory } = await import('@repo/session-management');
    const sessionManager = await UserManagerFactory.create();
    
    // Adapter to bridge UserManagerInterface -> UserRepositoryInterface
    userRepository = {
      findByEmail: async (email: string) => {
        const user = await sessionManager.findByEmail(email);
        return user || undefined;
      },
      findById: async (id: string) => {
        const user = await sessionManager.findById(id);
        return user || undefined;
      },
      create: async (userData: Omit<User, 'id' | 'createdAt'>) => {
        return await sessionManager.create({
          email: userData.email,
          hashedPassword: userData.hashedPassword,
          isVerified: userData.isVerified ?? false,
        });
      },
      update: async (id: string, updates: Partial<Pick<User, 'email' | 'hashedPassword' | 'isVerified' | 'lastLoginAt'>>) => {
        const user = await sessionManager.update(id, updates);
        return user || undefined;
      },
      getAll: async () => {
        return await sessionManager.getAll();
      },
      count: async () => {
        return await sessionManager.count();
      },
    };
  }
  return userRepository;
}

async function getOrderRepository() {
  if (!orderRepository) {
    const { UserManagerFactory } = await import('@repo/session-management');
    orderRepository = await UserManagerFactory.createOrderManager();
  }
  return orderRepository;
}

// ✅ REPLACED: Factory-based userManager (replaces in-memory arrays)
export const userManager = {
  findByEmail: async (email: string): Promise<User | undefined> => {
    const repo = await getUserRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.findByEmail(email);
  },

  findById: async (id: string): Promise<User | undefined> => {
    const repo = await getUserRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.findById(id);
  },

  create: async (userData: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const repo = await getUserRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.create({
      ...userData,
      hashedPassword: userData.hashedPassword || undefined,
      isVerified: userData.isVerified ?? false,
    });
  },

  update: async (
    id: string,
    updates: Partial<Pick<User, 'email' | 'hashedPassword' | 'isVerified' | 'lastLoginAt'>>
  ): Promise<User | undefined> => {
    const repo = await getUserRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.update(id, updates);
  },

  getAll: async (): Promise<User[]> => {
    const repo = await getUserRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.getAll();
  },

  count: async (): Promise<number> => {
    const repo = await getUserRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.count();
  },
};

// ✅ REPLACED: Factory-based orderManager (replaces in-memory arrays)
export const orderManager = {
  findById: async (id: string): Promise<Order | undefined> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    const order = await repo.findById(id);
    return order || undefined;
  },

  findByUserId: async (userId: string): Promise<Order[]> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.findByUserId(userId);
  },

  create: async (orderData: CreateOrderRequest & { userId: string }): Promise<Order> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.create(orderData);
  },

  // ✅ ДОБАВЛЕНО: Универсальный update метод
  update: async (id: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<Order | undefined> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    const order = await repo.update(id, updates);
    return order || undefined;
  },

  updateStatus: async (id: string, status: Order['status']): Promise<Order | undefined> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    const order = await repo.updateStatus(id, status);
    return order || undefined;
  },

  getAll: async (): Promise<Order[]> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.getAll();
  },

  findByStatus: async (status: Order['status']): Promise<Order[]> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.findByStatus(status);
  },

  count: async (): Promise<number> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.count();
  },

  assignToOperator: async (orderId: string, operatorId: string): Promise<Order | undefined> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    const order = await repo.assignToOperator(orderId, operatorId);
    return order || undefined;
  },

  getLatest: async (limit: number = DEFAULT_LIMIT): Promise<Order[]> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    const orders = await repo.getAll();
    return orders
      .sort((a: Order, b: Order) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(SLICE_START_INDEX, limit);
  },
};

// ✅ REPLACED: Factory-based statsManager (replaces in-memory arrays)
export const statsManager = {
  getTotalOrders: async (): Promise<number> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.count();
  },

  getTotalUsers: async (): Promise<number> => {
    const repo = await getUserRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    return await repo.count();
  },

  getOrdersByStatus: async (): Promise<Record<string, number>> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    const allOrders = await repo.getAll();
    const stats: Record<string, number> = {};
    for (const order of allOrders) {
      stats[order.status] =
        (stats[order.status] || VALIDATION_BOUNDS.MIN_VALUE) + VALIDATION_BOUNDS.SINGLE_ELEMENT;
    }
    return stats;
  },

  getTotalVolume: async (): Promise<number> => {
    const repo = await getOrderRepository();
    if (!repo) throw new Error(REPO_ERROR_MESSAGE);
    const completedOrders = await repo.findByStatus(ORDER_STATUSES.COMPLETED);
    return completedOrders.reduce(
      (sum: number, order: Order) => sum + order.uahAmount, 
      VALIDATION_BOUNDS.MIN_VALUE
    );
  },
};
