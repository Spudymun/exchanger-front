import { PrismaClient, OrderStatus as PrismaOrderStatus } from '@prisma/client';

import type { OrderStatus } from '@repo/constants';
import type { OrderRepositoryInterface, Order, CreateOrderRequest } from '@repo/exchange-core';
import { createEnvironmentLogger } from '@repo/utils';

/**
 * ✅ Clean Prisma order object matching database schema
 */
interface PrismaOrder {
  id: string;
  userId: string;
  cryptoAmount: { toNumber(): number }; // Prisma Decimal type
  currency: string;
  uahAmount: { toNumber(): number }; // Prisma Decimal type
  tokenStandard: string | null;
  status: PrismaOrderStatus; // Use Prisma enum type
  depositAddress: string;
  txHash: string | null;
  recipientData: unknown; // JsonValue type
  assignedOperatorId: string | null;
  assignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
}

// Mapping between frontend status types and database enum values  
const mapToPrismaStatus = (status: OrderStatus): PrismaOrderStatus => {
  return status.toUpperCase() as PrismaOrderStatus;
};

/**
 * ✅ PostgreSQL adapter for Order repository operations
 * Follows existing PostgreSQLUserAdapter pattern from session-management
 */
export class PostgresOrderAdapter implements OrderRepositoryInterface {
  private logger = createEnvironmentLogger('PostgresOrderAdapter');

  constructor(private prisma: PrismaClient) {}

  async create(orderData: CreateOrderRequest & { userId: string }): Promise<Order> {
    try {
      this.logger.info('Creating order', { userId: orderData.userId, currency: orderData.currency });

      const prismaOrder = await this.prisma.order.create({
        data: {
          userId: orderData.userId,
          cryptoAmount: orderData.cryptoAmount,
          currency: orderData.currency,
          uahAmount: orderData.uahAmount,
          depositAddress: '', // Will be generated separately
          recipientData: orderData.recipientData ? JSON.parse(JSON.stringify(orderData.recipientData)) : undefined,
          status: 'PENDING', // Default status
        },
      });

      this.logger.info('Order created successfully', { orderId: prismaOrder.id });
      return this.mapPrismaToOrder(prismaOrder);
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.create failed', { 
        error: error instanceof Error ? error.message : String(error),
        userId: orderData.userId 
      });
      throw new Error(`Failed to create order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const prismaOrder = await this.prisma.order.findUnique({
        where: { id },
      });

      return prismaOrder ? this.mapPrismaToOrder(prismaOrder) : null;
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findById failed', { 
        error: error instanceof Error ? error.message : String(error), 
        id 
      });
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return prismaOrders.map((order: PrismaOrder) => this.mapPrismaToOrder(order));
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByUserId failed', { 
        error: error instanceof Error ? error.message : String(error), 
        userId 
      });
      return [];
    }
  }

  async updateStatus(id: string, status: OrderStatus, operatorId?: string): Promise<Order | null> {
    try {
      this.logger.info('Updating order status', { orderId: id, status, operatorId });

      const prismaStatus = mapToPrismaStatus(status);
      const isFinalStatus = ['COMPLETED', 'CANCELLED', 'FAILED'].includes(prismaStatus);
      const updateData = {
        status: prismaStatus,
        updatedAt: new Date(),
        processedAt: isFinalStatus ? new Date() : undefined,
      };

      const prismaOrder = await this.prisma.order.update({
        where: { id },
        data: updateData,
      });

      // Create audit log for status change
      if (operatorId) {
        await this.createAuditLog({
          orderId: id,
          action: 'STATUS_CHANGED',
          oldValue: null,
          newValue: status,
          performedBy: operatorId
        });
      }

      this.logger.info('Order status updated successfully', { orderId: id, status });
      return this.mapPrismaToOrder(prismaOrder);
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.updateStatus failed', { 
        error: error instanceof Error ? error.message : String(error), 
        id, 
        status 
      });
      return null;
    }
  }

  async assignToOperator(orderId: string, operatorId: string): Promise<Order | null> {
    try {
      this.logger.info('Assigning order to operator', { orderId, operatorId });

      const prismaOrder = await this.prisma.order.update({
        where: { id: orderId },
        data: {
          assignedOperatorId: operatorId,
          assignedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Create audit log for assignment
      await this.createAuditLog({
        orderId,
        action: 'ASSIGNED_TO_OPERATOR',
        oldValue: null,
        newValue: operatorId,
        performedBy: operatorId
      });

      this.logger.info('Order assigned successfully', { orderId, operatorId });
      return this.mapPrismaToOrder(prismaOrder);
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.assignToOperator failed', { 
        error: error instanceof Error ? error.message : String(error), 
        orderId, 
        operatorId 
      });
      return null;
    }
  }

  async findByOperator(operatorId: string): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        where: { assignedOperatorId: operatorId },
        orderBy: { assignedAt: 'desc' },
      });

      return prismaOrders.map((order: PrismaOrder) => this.mapPrismaToOrder(order));
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByOperator failed', { 
        error: error instanceof Error ? error.message : String(error), 
        operatorId 
      });
      return [];
    }
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        where: { status: mapToPrismaStatus(status) },
        orderBy: { createdAt: 'desc' },
      });

      return prismaOrders.map((order: PrismaOrder) => this.mapPrismaToOrder(order));
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByStatus failed', { 
        error: error instanceof Error ? error.message : String(error), 
        status 
      });
      return [];
    }
  }

  async findByCurrency(currency: string): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        where: { currency },
        orderBy: { createdAt: 'desc' },
      });

      return prismaOrders.map((order: PrismaOrder) => this.mapPrismaToOrder(order));
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByCurrency failed', { 
        error: error instanceof Error ? error.message : String(error), 
        currency 
      });
      return [];
    }
  }

  async findByDepositAddress(address: string): Promise<Order | null> {
    try {
      const prismaOrder = await this.prisma.order.findFirst({
        where: { depositAddress: address },
      });

      return prismaOrder ? this.mapPrismaToOrder(prismaOrder) : null;
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByDepositAddress failed', { 
        error: error instanceof Error ? error.message : String(error), 
        address 
      });
      return null;
    }
  }

  async findWithPagination(options: {
    page: number;
    limit: number;
    status?: OrderStatus;
    userId?: string;
  }): Promise<{
    data: Order[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const { page, limit, status, userId } = options;
      const skip = (page - 1) * limit;

      const whereClause: {
        status?: PrismaOrderStatus;
        userId?: string;
      } = {};
      if (status) whereClause.status = mapToPrismaStatus(status);
      if (userId) whereClause.userId = userId;

      const [prismaOrders, total] = await Promise.all([
        this.prisma.order.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.order.count({ where: whereClause }),
      ]);

      return {
        data: prismaOrders.map((order: PrismaOrder) => this.mapPrismaToOrder(order)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findWithPagination failed', { 
        error: error instanceof Error ? error.message : String(error),
        page: options.page,
        limit: options.limit
      });
      return {
        data: [],
        total: 0,
        page: options.page,
        limit: options.limit,
      };
    }
  }

  /**
   * ✅ Create audit log entry following existing patterns with object parameter
   */
  private async createAuditLog(params: {
    orderId: string;
    action: string;
    oldValue: string | null;
    newValue: string;
    performedBy: string;
  }): Promise<void> {
    try {
      await this.prisma.orderAuditLog.create({
        data: {
          orderId: params.orderId,
          action: params.action,
          oldValue: params.oldValue,
          newValue: params.newValue,
          performedBy: params.performedBy,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', { 
        error: error instanceof Error ? error.message : String(error),
        orderId: params.orderId, 
        action: params.action 
      });
      // Don't throw - audit log failure shouldn't break main operation
    }
  }

  /**
   * ✅ Safe mapping from Prisma to business domain object
   * Handles Decimal conversion properly as per existing patterns
   */
  // ✅ ДОБАВЛЕНО: Методы для совместимости с manager.ts
  async getAll(): Promise<Order[]> {
    try {
      this.logger.info('Fetching all orders');

      const prismaOrders = await this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return prismaOrders.map((order: PrismaOrder) => this.mapPrismaToOrder(order));
    } catch (error) {
      this.logger.error('Failed to fetch all orders', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to fetch all orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async count(): Promise<number> {
    try {
      this.logger.info('Counting all orders');

      return await this.prisma.order.count();
    } catch (error) {
      this.logger.error('Failed to count orders', { error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to count orders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async update(id: string, updates: Partial<Omit<Order, 'id' | 'createdAt'>>): Promise<Order | null> {
    try {
      this.logger.info('Updating order', { id });

      const updated = await this.prisma.order.update({
        where: { id },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: updates as any, // TECH DEBT: Simplify type casting for now
      });

      this.logger.info('Order updated successfully', { id });
      return this.mapPrismaToOrder(updated);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        this.logger.warn('Order not found for update', { id });
        return null;
      }
      this.logger.error('Failed to update order', { id, error: error instanceof Error ? error.message : String(error) });
      throw new Error(`Failed to update order: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private mapPrismaToOrder(prismaOrder: PrismaOrder): Order {
    return {
      id: prismaOrder.id,
      userId: prismaOrder.userId, // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: используем userId
      // Safe Decimal conversion using .toNumber() method as per existing patterns
      cryptoAmount: prismaOrder.cryptoAmount.toNumber(),
      currency: prismaOrder.currency as 'BTC' | 'ETH' | 'USDT' | 'LTC',
      uahAmount: prismaOrder.uahAmount.toNumber(),
      tokenStandard: prismaOrder.tokenStandard || undefined,
      status: prismaOrder.status.toLowerCase() as OrderStatus, // Convert Prisma enum to frontend type
      depositAddress: prismaOrder.depositAddress,
      recipientData: (prismaOrder.recipientData as Record<string, unknown>) || undefined,
      createdAt: prismaOrder.createdAt,
      updatedAt: prismaOrder.updatedAt,
      processedAt: prismaOrder.processedAt || undefined,
      txHash: prismaOrder.txHash || undefined,
    };
  }
}
