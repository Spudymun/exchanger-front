import type { OrderStatus } from '@repo/constants';

import type { Order, CreateOrderRequest } from '../types/order';

/**
 * Repository interface для операций с заявками
 * Следует Adapter Pattern из session-management
 * Готовит контракты для Prisma реализации в задаче 1.3
 *
 * ИСПРАВЛЕНИЕ: Устранена избыточность findByEmail согласно Rule 20
 * ОБОСНОВАНИЕ: После AC2.1A каждая заявка привязана к userId,
 * findByEmail становится избыточным - это findByUserId с промежуточным шагом
 */
export interface OrderRepositoryInterface {
  // Основные CRUD операции
  create(orderData: CreateOrderRequest & { userId: string }): Promise<Order>;
  findById(id: string): Promise<Order | null>;
  findByUserId(userId: string): Promise<Order[]>; // ЕДИНСТВЕННЫЙ источник поиска по пользователю
  // УДАЛЕНО: findByEmail - избыточность после обязательной привязки к userId

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
}
