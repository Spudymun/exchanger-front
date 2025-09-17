import type { OrderStatus } from '@repo/constants';

import type { Order, CreateOrderRequest } from '../types/order';

/**
 * Repository interface для операций с заявками
 * Следует Adapter Pattern из session-management
 * Готовит контракты для Prisma реализации в задаче 1.3
 *
 * АРХИТЕКТУРНОЕ РЕШЕНИЕ: Поиск заказов по userId (Rule 20 - избежание дублирования)
 * ОБОСНОВАНИЕ: После AC2.1A каждая заявка привязана к userId,
 * email-поиск реализуется через business logic: email → User.id → findByUserId()
 */
export interface OrderRepositoryInterface {
  // Основные CRUD операции
  create(orderData: CreateOrderRequest & { userId: string }): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>; // Поиск по пользователю через userId
  // EMAIL ПОИСК: реализуется на уровне business logic через UserManager + findByUserId
  
  // ✅ ДОБАВЛЕНО: Универсальный update метод
  update(id: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<Order | null>;

  // Операторские операции
  updateStatus(id: string, status: OrderStatus, operatorId?: string): Promise<Order | null>;
  assignToOperator(orderId: string, operatorId: string): Promise<Order | null>;
  findByOperator(operatorId: string): Promise<Order[]>;

  // Поиск и фильтрация
  findByStatus(status: OrderStatus): Promise<Order[]>;
  findByCurrency(currency: string): Promise<Order[]>;
  findByDepositAddress(address: string): Promise<Order | null>;

  // Пагинация (соответствует существующим utils)
  findWithPagination(options: {
    page: number;
    limit: number;
    status?: OrderStatus;
    userId?: string;
  }): Promise<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }>;

  // ✅ ДОБАВЛЕНО: Методы для совместимости с manager.ts
  getAll(): Promise<Order[]>;
  count(): Promise<number>;
}
