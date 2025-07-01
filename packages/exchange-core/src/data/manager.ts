import type { User, Order, CryptoCurrency, OrderStatus } from '../types';
import { generateOrderId } from '../utils/validation';

// Мок данные пользователей
const mockUsers = [
  {
    id: 'user_1',
    email: 'test@example.com',
    hashedPassword: '$2b$10$example_hash',
    isVerified: true,
    createdAt: '2025-06-29T10:00:00.000Z',
    lastLoginAt: '2025-06-29T10:00:00.000Z',
  },
  {
    id: 'user_2',
    email: 'admin@exchangego.com',
    hashedPassword: '$2b$10$example_hash_admin',
    isVerified: true,
    createdAt: '2025-06-29T10:00:00.000Z',
    lastLoginAt: '2025-06-29T10:00:00.000Z',
  },
];

// Мок данные заявок
const mockOrders = [
  {
    id: 'order_1703847600000_abc123',
    email: 'test@example.com',
    cryptoAmount: 0.001,
    currency: 'BTC' as CryptoCurrency,
    uahAmount: 1755.0,
    status: 'COMPLETED' as OrderStatus,
    depositAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    recipientData: {
      cardNumber: '1234567890123456',
    },
    createdAt: '2025-06-29T10:00:00.000Z',
    updatedAt: '2025-06-29T12:00:00.000Z',
    processedAt: '2025-06-29T12:00:00.000Z',
    txHash: 'example_tx_hash_123',
  },
  {
    id: 'order_1703847660000_def456',
    email: 'test@example.com',
    cryptoAmount: 1.0,
    currency: 'ETH' as CryptoCurrency,
    uahAmount: 117600.0,
    status: 'PROCESSING' as OrderStatus,
    depositAddress: '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe',
    createdAt: '2025-06-29T11:00:00.000Z',
    updatedAt: '2025-06-29T11:30:00.000Z',
  },
];

// In-memory хранилище (в реальном приложении будет база данных)
const users: User[] = mockUsers.map(u => ({
  ...u,
  createdAt: new Date(u.createdAt),
  lastLoginAt: u.lastLoginAt ? new Date(u.lastLoginAt) : undefined,
}));

const orders: Order[] = mockOrders.map(o => ({
  ...o,
  createdAt: new Date(o.createdAt),
  updatedAt: new Date(o.updatedAt),
  processedAt: o.processedAt ? new Date(o.processedAt) : undefined,
}));

// Пользователи
export const userManager = {
  findByEmail: (email: string): User | undefined => {
    return users.find(u => u.email === email);
  },

  findById: (id: string): User | undefined => {
    return users.find(u => u.id === id);
  },

  create: (userData: Omit<User, 'id' | 'createdAt'>): User => {
    const user: User = {
      id: `user_${Date.now()}`,
      createdAt: new Date(),
      ...userData,
    };
    users.push(user);
    return user;
  },

  update: (
    id: string,
    updates: Partial<
      Pick<User, 'email' | 'hashedPassword' | 'sessionId' | 'isVerified' | 'lastLoginAt'>
    >
  ): User | undefined => {
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return undefined;

    const originalUser = users[index]!;

    if (updates.email !== undefined) originalUser.email = updates.email;
    if (updates.hashedPassword !== undefined) originalUser.hashedPassword = updates.hashedPassword;
    if (updates.sessionId !== undefined) originalUser.sessionId = updates.sessionId;
    if (updates.isVerified !== undefined) originalUser.isVerified = updates.isVerified;
    if (updates.lastLoginAt !== undefined) originalUser.lastLoginAt = updates.lastLoginAt;

    return originalUser;
  },

  getAll: (): User[] => users,

  count: (): number => users.length,
};

// Заявки
export const orderManager = {
  findById: (id: string): Order | undefined => {
    return orders.find(o => o.id === id);
  },

  findByEmail: (email: string): Order[] => {
    return orders.filter(o => o.email === email);
  },

  create: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order => {
    const order: Order = {
      id: generateOrderId(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...orderData,
    };
    orders.push(order);
    return order;
  },

  update: (
    id: string,
    updates: Partial<Pick<Order, 'status' | 'recipientData' | 'processedAt' | 'txHash'>>
  ): Order | undefined => {
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return undefined;

    const originalOrder = orders[index]!;

    if (updates.status !== undefined) originalOrder.status = updates.status;
    if (updates.recipientData !== undefined) originalOrder.recipientData = updates.recipientData;
    if (updates.processedAt !== undefined) originalOrder.processedAt = updates.processedAt;
    if (updates.txHash !== undefined) originalOrder.txHash = updates.txHash;

    originalOrder.updatedAt = new Date();

    return originalOrder;
  },

  getAll: (): Order[] => orders,

  getByStatus: (status: Order['status']): Order[] => {
    return orders.filter(o => o.status === status);
  },

  count: (): number => orders.length,

  getRecent: (limit: number = 10): Order[] => {
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  },
};

// Статистика
export const statsManager = {
  getTotalOrders: (): number => orders.length,

  getTotalUsers: (): number => users.length,

  getOrdersByStatus: () => {
    const stats: Record<string, number> = {};
    orders.forEach(order => {
      stats[order.status] = (stats[order.status] || 0) + 1;
    });
    return stats;
  },

  getTotalVolume: (): number => {
    return orders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, order) => sum + order.uahAmount, 0);
  },
};
