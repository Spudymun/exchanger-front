/**
 * Базовые контактные данные пользователя
 * Централизованный тип для всех форм и состояний
 */
export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegramUsername?: string;
  communicationMethod: 'email' | 'phone' | 'telegram';
}

/**
 * Данные для создания пользователя (подмножество ContactInfo)
 */
export interface CreateUserContactData {
  email: string;
  phone?: string;
}

/**
 * Данные получателя для заявок обмена
 * Унифицированная структура для всех способов получения
 */
export interface RecipientData {
  /** Номер банковской карты (для карточных переводов) */
  cardNumber?: string;
  /** Банковские реквизиты (для переводов) */
  bankDetails?: string;
  /** Имя получателя */
  recipientName?: string;
  /** Телефон получателя */
  phone?: string;
}

/**
 * Данные получателя для форм обмена (с инициализацией по умолчанию)
 * Расширяет базовый RecipientData для удобства работы с формами
 */
export interface ExchangeRecipientData {
  /** Номер банковской карты */
  cardNumber: string;
  /** Имя получателя */
  recipientName?: string;
  /** Телефон получателя */
  phone?: string;
}

/**
 * Способы оплаты/получения средств
 */
export type PaymentMethodType = 'bank_card' | 'bank_transfer' | 'cash' | 'mobile_payment';

/**
 * Детальная информация о способе оплаты
 */
export interface PaymentMethod {
  method: PaymentMethodType;
  /** Данные банковской карты */
  cardNumber?: string;
  cardHolder?: string;
  /** Данные банковского перевода */
  iban?: string;
  bankName?: string;
  /** Мобильные платежи */
  phoneNumber?: string;
  /** Наличные */
  cashLocation?: string;
}
