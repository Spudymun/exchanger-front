/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines */

import { PrismaClient, OrderStatus as PrismaOrderStatus } from '@prisma/client';

import type { OrderStatus } from '@repo/constants';
import type { OrderRepositoryInterface, Order, CreateOrderRequest } from '@repo/exchange-core';
import { generatePublicOrderId } from '@repo/exchange-core';
import { createEnvironmentLogger } from '@repo/utils';

import { BasePostgresAdapter } from './base-postgres-adapter';

/**
 * Clean Prisma order object matching database schema after migration v3
 */
interface PrismaOrder {
  id: string;
  publicId: string;
  userId: string;
  cryptoAmount: { toNumber(): number };
  currency: string;
  uahAmount: { toNumber(): number };
  tokenStandard: string | null;
  status: PrismaOrderStatus;
  walletId?: string | null; // ✅ ВРЕМЕННО: сделано опциональным до обновления кэша TS
  txHash: string | null;
  recipientData: unknown;
  assignedOperatorId: string | null;
  assignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  processedAt: Date | null;
  wallet?: {
    address: string;
  } | null;
}

// Mapping between frontend status types and database enum values
const mapToPrismaStatus = (status: OrderStatus): PrismaOrderStatus => {
  return status.toUpperCase() as PrismaOrderStatus;
};

/**
 * PostgreSQL adapter for Order repository operations
 */
export class PostgresOrderAdapter extends BasePostgresAdapter implements OrderRepositoryInterface {
  private logger = createEnvironmentLogger('PostgresOrderAdapter');

  constructor(protected prisma: PrismaClient) {
    super(prisma);
  }

  async create(orderData: CreateOrderRequest & { userId: string; walletId?: string }): Promise<Order> {
    try {
      this.logger.info('Creating order', {
        userId: orderData.userId,
        currency: orderData.currency,
        walletId: orderData.walletId,
      });

      const publicId = generatePublicOrderId();

      const prismaOrder = await this.prisma.order.create({
        data: {
          publicId,
          userId: orderData.userId,
          cryptoAmount: orderData.cryptoAmount,
          currency: orderData.currency,
          uahAmount: orderData.uahAmount,
          walletId: orderData.walletId || null, // ✅ ИСПРАВЛЕНО: поддержка привязки кошелька
          recipientData: orderData.recipientData
            ? JSON.parse(JSON.stringify(orderData.recipientData))
            : undefined,
          status: 'PENDING', // Default status
        },
        include: { wallet: true }, // ✅ ИСПРАВЛЕНО: для получения depositAddress
      });

      this.logger.info('Order created successfully', { orderId: prismaOrder.id });
      return this.mapPrismaToOrder(prismaOrder);
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.create failed', {
        error: error instanceof Error ? error.message : String(error),
        userId: orderData.userId,
      });
      throw new Error(
        `Failed to create order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async findById(id: string): Promise<Order | null> {
    try {
      const prismaOrder = await this.prisma.order.findUnique({
        where: { id },
        include: { wallet: true }, // ✅ ИСПРАВЛЕНО: загружаем wallet relation для depositAddress
      });

      return prismaOrder ? this.mapPrismaToOrder(prismaOrder as any) : null;
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findById failed', {
        error: error instanceof Error ? error.message : String(error),
        id,
      });
      return null;
    }
  }

  async findByPublicId(publicId: string): Promise<Order | null> {
    try {
      const prismaOrder = await this.prisma.order.findUnique({
        where: { publicId },
        include: { wallet: true }, // ✅ ИСПРАВЛЕНО: загружаем wallet relation для depositAddress
      });

      return prismaOrder ? this.mapPrismaToOrder(prismaOrder as any) : null;
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByPublicId failed', {
        error: error instanceof Error ? error.message : String(error),
        publicId,
      });
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        where: { userId },
        include: { wallet: true }, // ✅ ИСПРАВЛЕНО: загружаем wallet relation для depositAddress
        orderBy: { createdAt: 'desc' },
      });

      return prismaOrders.map(order => this.mapPrismaToOrder(order as any));
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByUserId failed', {
        error: error instanceof Error ? error.message : String(error),
        userId,
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
        include: { wallet: true }, // ✅ ИСПРАВЛЕНО: загружаем wallet relation для depositAddress
      });

      // Create audit log for status change
      if (operatorId) {
        await this.createAuditLog({
          orderId: id,
          action: 'STATUS_CHANGED',
          oldValue: null,
          newValue: status,
          performedBy: operatorId,
        });
      }

      this.logger.info('Order status updated successfully', { orderId: id, status });
      return this.mapPrismaToOrder(prismaOrder as any);
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.updateStatus failed', {
        error: error instanceof Error ? error.message : String(error),
        id,
        status,
      });
      return null;
    }
  }

  private async updateOrderAssignment(orderId: string, operatorId: string) {
    return await this.prisma.order.update({
      where: {
        id: orderId,
        status: 'PENDING',
        assignedOperatorId: null,
      },
      data: {
        assignedOperatorId: operatorId,
        status: 'PROCESSING',
        assignedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        wallet: true,
      },
    });
  }

  private handleAssignmentError(error: unknown, orderId: string, operatorId: string): Order | null {
    // Enhanced error handling for concurrent conflicts
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      // P2025 = Record not found or condition not met
      this.logger.warn('Concurrent assignment attempt detected', {
        orderId,
        operatorId,
        reason: 'Order already assigned or not in PENDING status',
      });
      return null;
    }

    this.logger.error('PostgresOrderAdapter.assignToOperator failed', {
      error: error instanceof Error ? error.message : String(error),
      orderId,
      operatorId,
    });
    return null;
  }

  async assignToOperator(orderId: string, operatorId: string): Promise<Order | null> {
    try {
      this.logger.info('Assigning order to operator with concurrent protection', {
        orderId,
        operatorId,
      });

      const prismaOrder = await this.updateOrderAssignment(orderId, operatorId);

      // Create audit log for assignment
      await this.createAuditLog({
        orderId,
        action: 'ASSIGNED_TO_OPERATOR',
        oldValue: null,
        newValue: operatorId,
        performedBy: operatorId,
      });

      this.logger.info('Order assigned successfully with concurrent protection', {
        orderId,
        operatorId,
      });
      return this.mapPrismaToOrder(prismaOrder as any);
    } catch (error) {
      return this.handleAssignmentError(error, orderId, operatorId);
    }
  }

  async findByOperator(operatorId: string): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        where: { assignedOperatorId: operatorId },
        orderBy: { assignedAt: 'desc' },
        include: {
          wallet: true,
        },
      });

      return prismaOrders.map(order => this.mapPrismaToOrder(order as any));
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByOperator failed', {
        error: error instanceof Error ? error.message : String(error),
        operatorId,
      });
      return [];
    }
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        where: { status: mapToPrismaStatus(status) },
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
        },
      });

      return prismaOrders.map(order => this.mapPrismaToOrder(order as any));
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByStatus failed', {
        error: error instanceof Error ? error.message : String(error),
        status,
      });
      return [];
    }
  }

  async findByCurrency(currency: string): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        where: { currency },
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
        },
      });

      return prismaOrders.map(order => this.mapPrismaToOrder(order as any));
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByCurrency failed', {
        error: error instanceof Error ? error.message : String(error),
        currency,
      });
      return [];
    }
  }

  async findByDepositAddress(address: string): Promise<Order | null> {
    try {
      const wallet = await this.prisma.wallet.findUnique({
        where: { address: address },
      });

      if (!wallet) {
        return null;
      }

      const prismaOrder = await this.prisma.order.findFirst({
        where: { walletId: wallet.id },
        include: {
          wallet: true,
        },
      });

      return prismaOrder ? this.mapPrismaToOrder(prismaOrder as any) : null;
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findByDepositAddress failed', {
        error: error instanceof Error ? error.message : String(error),
        address,
      });
      return null;
    }
  }

  private buildWhereClause(status?: OrderStatus, userId?: string) {
    const whereClause: {
      status?: PrismaOrderStatus;
      userId?: string;
    } = {};
    if (status) whereClause.status = mapToPrismaStatus(status);
    if (userId) whereClause.userId = userId;
    return whereClause;
  }

  private async fetchOrdersAndCount(whereClause: any, skip: number, limit: number) {
    return await Promise.all([
      this.prisma.order.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          wallet: true,
        },
      }),
      this.prisma.order.count({ where: whereClause }),
    ]);
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
      const whereClause = this.buildWhereClause(status, userId);
      const [prismaOrders, total] = await this.fetchOrdersAndCount(whereClause, skip, limit);

      return {
        data: prismaOrders.map(order => this.mapPrismaToOrder(order as any)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('PostgresOrderAdapter.findWithPagination failed', {
        error: error instanceof Error ? error.message : String(error),
        page: options.page,
        limit: options.limit,
      });
      return {
        data: [],
        total: 0,
        page: options.page,
        limit: options.limit,
      };
    }
  }

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
        action: params.action,
      });
    }
  }

  async getAll(): Promise<Order[]> {
    try {
      const prismaOrders = await this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          wallet: true,
        },
      });
      return prismaOrders.map(order => this.mapPrismaToOrder(order as any));
    } catch (error) {
      this.logger.error('Failed to fetch all orders', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to fetch all orders: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async count(): Promise<number> {
    try {
      return await this.prisma.order.count();
    } catch (error) {
      this.logger.error('Failed to count orders', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to count orders: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async update(
    id: string,
    updates: Partial<Omit<Order, 'id' | 'createdAt'>>
  ): Promise<Order | null> {
    try {
      const updated = await this.prisma.order.update({
        where: { id },
        data: updates as any,
        include: {
          wallet: true,
        },
      });
      return this.mapPrismaToOrder(updated as any);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'P2025') {
        return null;
      }
      this.logger.error('Failed to update order', {
        id,
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error(
        `Failed to update order: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private mapPrismaToOrder(prismaOrder: PrismaOrder): Order {
    return {
      id: prismaOrder.id,
      publicId: prismaOrder.publicId, // ✅ ДОБАВЛЕНО: внешний ID для URL и API
      userId: prismaOrder.userId, // ✅ ПРАВИЛЬНАЯ АРХИТЕКТУРА: используем userId
      // Safe Decimal conversion using .toNumber() method as per existing patterns
      cryptoAmount: prismaOrder.cryptoAmount.toNumber(),
      currency: prismaOrder.currency as 'BTC' | 'ETH' | 'USDT' | 'LTC',
      uahAmount: prismaOrder.uahAmount.toNumber(),
      tokenStandard: prismaOrder.tokenStandard || undefined,
      status: prismaOrder.status.toLowerCase() as OrderStatus, // Convert Prisma enum to frontend type
      depositAddress: prismaOrder.wallet?.address || '', // ✅ ИСПРАВЛЕНО: получаем адрес из wallet relation или пустая строка для null
      recipientData: (prismaOrder.recipientData as Record<string, unknown>) || undefined,
      createdAt: prismaOrder.createdAt,
      updatedAt: prismaOrder.updatedAt,
      processedAt: prismaOrder.processedAt || undefined,
      txHash: prismaOrder.txHash || undefined,
    };
  }
}
