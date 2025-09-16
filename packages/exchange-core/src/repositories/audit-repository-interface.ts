export interface OrderAuditEntry {
  id: string;
  orderId: string;
  action: string;
  oldValue?: string;
  newValue?: string;
  metadata?: Record<string, unknown>;
  comment?: string;
  performedBy?: string; // userId
  createdAt: Date;
}

/**
 * Repository interface для аудита операций с заявками
 * Поддерживает AC требования по логированию всех изменений
 */
export interface AuditRepositoryInterface {
  create(entry: Omit<OrderAuditEntry, 'id' | 'createdAt'>): Promise<OrderAuditEntry>;
  findByOrderId(orderId: string): Promise<OrderAuditEntry[]>;
  findByOperator(operatorId: string): Promise<OrderAuditEntry[]>;
  findByAction(action: string): Promise<OrderAuditEntry[]>;
}
