# Анализ файла: packages/exchange-core/src/types/contact.ts

## 📋 Назначение

Централизованные TypeScript типы для управления контактной информацией пользователей и данными получателей в системе обмена криптовалют ExchangeGO.

## 📝 Описание

Comprehensive contact management types система, включающая:

- **Unified contact structures** - унифицированные структуры для пользовательских данных
- **Payment integration** - интеграция с payment methods и recipient data
- **Multi-communication support** - поддержка различных способов связи (email, phone, telegram)
- **Exchange-specific types** - специализированные типы для exchange operations
- **Validation-ready design** - готовность к интеграции с validation systems
- **Hierarchical organization** - иерархическая организация от базовых к специфичным типам

Используется в order creation, user management, и exchange workflow для обеспечения type safety.

## 🔌 API и интерфейсы

### Core Contact Types:

```typescript
// Базовая контактная информация пользователя
export interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegramUsername?: string;
  communicationMethod: 'email' | 'phone' | 'telegram';
}

// Минимальные данные для создания пользователя
export interface CreateUserContactData {
  email: string; // Required for notifications
  phone?: string; // Optional for additional contact
}
```

### Exchange-Specific Types:

```typescript
// Данные получателя для exchange operations (flexible)
export interface RecipientData {
  cardNumber?: string; // Bank card transfers
  bankDetails?: string; // Bank transfers
  recipientName?: string; // Recipient identification
  phone?: string; // Contact verification
}

// Данные получателя для форм (required cardNumber)
export interface ExchangeRecipientData {
  cardNumber: string; // Required for forms
  recipientName?: string; // Optional recipient name
  phone?: string; // Optional contact
}
```

### Payment Methods Support:

```typescript
// Payment method types enumeration
export type PaymentMethodType = 'bank_card' | 'bank_transfer' | 'cash' | 'mobile_payment';

// Comprehensive payment method structure
export interface PaymentMethod {
  method: PaymentMethodType;

  // Bank card data
  cardNumber?: string;
  cardHolder?: string;

  // Bank transfer data
  iban?: string;
  bankName?: string;

  // Mobile payments
  phoneNumber?: string;

  // Cash operations
  cashLocation?: string;
}
```

### Type Relationships:

```typescript
interface TypeHierarchy {
  base: {
    ContactInfo: 'full user contact data';
    CreateUserContactData: 'minimal user creation data';
  };

  exchange: {
    RecipientData: 'flexible recipient data';
    ExchangeRecipientData: 'form-specific recipient data';
  };

  payments: {
    PaymentMethodType: 'payment method enumeration';
    PaymentMethod: 'comprehensive payment data';
  };
}
```

## 📥 Входящие зависимости

### External Dependencies: НЕТ

- Файл полностью self-contained
- Использует только TypeScript primitive types
- Не имеет external imports

### Design Patterns:

- **Interface composition** - композиция интерфейсов от simple к complex
- **Optional fields pattern** - extensive use optional fields для flexibility
- **Union types** - communicationMethod и PaymentMethodType
- **Hierarchical typing** - from ContactInfo к специализированным types

## 📤 Исходящие зависимости

### Direct Usage:

- **packages/exchange-core/src/types/order.ts** - импортирует RecipientData для Order interface
- **packages/exchange-core/src/utils/composite-validators.ts** - validateRecipientData function
- **packages/exchange-core/src/utils/order-validators.ts** - используется в validateCreateOrder
- **packages/hooks/src/useExchangeStore.ts** - recipientData в exchange form state

### Cross-Package Integration:

- **apps/web/src/components/** - используется в exchange forms для recipient input
- **packages/ui/src/components/forms/** - используется в form field components
- **Mock data systems** - используется в test factories для contact generation
- **Validation systems** - интеграция с @repo/utils validation functions

## 🔗 Взаимосвязи с другими компонентами

### Exchange Workflow Integration:

```typescript
interface ExchangeWorkflowUsage {
  order_creation: {
    types: 'RecipientData used in CreateOrderRequest';
    validation: 'validateRecipientData in composite-validators.ts';
    state: 'recipientData in useExchangeStore formData';
  };

  user_management: {
    types: 'ContactInfo for full user profiles';
    creation: 'CreateUserContactData for user registration';
    communication: 'communicationMethod for user preferences';
  };

  payment_processing: {
    types: 'PaymentMethod for payment processing';
    methods: 'PaymentMethodType enumeration';
    integration: 'card/bank/mobile/cash support';
  };
}
```

### Form Integration Chain:

```
Contact Input Forms
    ↓ (uses ContactInfo types)
Exchange State Management (useExchangeStore)
    ↓ (uses RecipientData)
Order Validation (validateCreateOrder)
    ↓ (validates RecipientData)
Order Creation (CreateOrderRequest)
    ↓ (persists recipient data)
Payment Processing (PaymentMethod)
```

### Validation Architecture:

```typescript
interface ValidationIntegration {
  source: 'contact.ts type definitions';
  validators: 'composite-validators.ts (validateRecipientData)';
  order_validation: 'order-validators.ts (validateCreateOrder)';
  form_validation: 'useExchangeStore validation functions';
  ui_validation: 'form field validation в UI components';
}
```

## 📊 Типы данных

### Data Structure Analysis:

```typescript
interface ContactDataStructure {
  ContactInfo: {
    required: ['firstName', 'lastName', 'email', 'phone', 'communicationMethod'];
    optional: ['telegramUsername'];
    communication: 'union of email | phone | telegram';
    purpose: 'full user profile data';
  };

  CreateUserContactData: {
    required: ['email'];
    optional: ['phone'];
    purpose: 'minimal user registration data';
    use_case: 'quick user creation';
  };

  RecipientData: {
    required: 'none (all optional)';
    optional: ['cardNumber', 'bankDetails', 'recipientName', 'phone'];
    purpose: 'flexible recipient data for orders';
    validation: 'conditional validation based on fields';
  };

  ExchangeRecipientData: {
    required: ['cardNumber'];
    optional: ['recipientName', 'phone'];
    purpose: 'form-specific recipient data';
    constraint: 'cardNumber required for exchange forms';
  };
}
```

### Payment Method Architecture:

```typescript
interface PaymentMethodArchitecture {
  PaymentMethodType: {
    values: ['bank_card', 'bank_transfer', 'cash', 'mobile_payment'];
    extensibility: 'union type allows easy extension';
    usage: 'method field in PaymentMethod interface';
  };

  PaymentMethod: {
    method: 'PaymentMethodType (required)';
    bank_card: 'cardNumber?, cardHolder?';
    bank_transfer: 'iban?, bankName?';
    mobile_payment: 'phoneNumber?';
    cash: 'cashLocation?';
    flexibility: 'conditional fields based на method type';
  };
}
```

### Type Safety Features:

```typescript
interface TypeSafetyFeatures {
  strict_unions: 'communicationMethod с explicit values';
  optional_safety: 'extensive optional fields для flexibility';
  hierarchical_typing: 'inheritance от base к specific types';
  validation_ready: 'structure supports validation patterns';
  composition_friendly: 'interfaces compose well together';
}
```

## ⚠️ Потенциальные проблемы и риски

### Проблемы типизации:

- **Optional field complexity**: Extensive optional fields могут усложнить validation logic
- **Union type limitations**: communicationMethod union может потребовать runtime validation
- **Type inference issues**: PaymentMethod conditional fields сложны для type inference
- **Hierarchical type drift**: Изменения в base types влияют на all derived types

### Проблемы валидации:

- **Conditional validation complexity**: RecipientData требует complex conditional validation
- **Payment method validation**: PaymentMethod требует method-specific validation rules
- **Field interdependencies**: Некоторые поля зависят от others для validity
- **Missing validation constraints**: Types не содержат validation rules

### Проблемы расширяемости:

- **New payment methods**: Добавление new PaymentMethodType требует updates в multiple places
- **Communication methods**: Новые способы связи требуют union type updates
- **Regional requirements**: Отсутствие support для regional-specific data fields
- **Compliance requirements**: Отсутствие fields для regulatory compliance

### Проблемы безопасности:

- **Sensitive data exposure**: Payment data не имеет special security markers
- **PII handling**: Personal information не помечена как sensitive
- **Data retention**: Отсутствие markers для data retention policies
- **Encryption requirements**: Нет indicators для fields requiring encryption

## ✅ Тестирование

- **Type tests**: Отсутствуют
- **Validation tests**: Отсутствуют
- **Integration tests**: Отсутствуют

### Рекомендации по тестированию:

- Type compatibility tests между related interfaces
- Validation tests для RecipientData conditional logic
- Integration tests с order creation workflow
- Form integration tests с UI components
- Payment method tests для all supported types

## 🔧 Техническая сложность

**Уровень: Низко-средний**

### Метрики сложности:

- **Размер**: 65 строк с comprehensive coverage
- **Type complexity**: Средняя (optional fields + unions)
- **Integration points**: Высокие (used across multiple packages)
- **Maintenance overhead**: Средний (stable contact patterns)

### Анализ архитектуры:

- Хорошая hierarchical organization от base к specific
- Эффективное use optional fields для flexibility
- Clean separation между user contact и recipient data
- Готовность к extension с new payment methods

## 📝 TODO и области для улучшения

### Критические улучшения:

1. **Runtime validation integration**: Integration с validation libraries (zod, yup)
2. **Security markers**: Пометка sensitive fields для special handling
3. **Conditional validation types**: Type-level support для conditional validation
4. **Regional compliance**: Support для regional data requirements

### Рекомендуемые улучшения:

1. **Field validation constraints**: Embedded validation rules в type definitions
2. **Payment method extensions**: Более flexible payment method system
3. **Contact verification**: Types для contact verification workflows
4. **Data retention policies**: Types для data lifecycle management
5. **Internationalization support**: I18n-ready field structures

### Долгосрочные задачи:

1. **Advanced payment methods**: Cryptocurrency payments, digital wallets
2. **Biometric verification**: Types для biometric contact verification
3. **Multi-factor contact verification**: Enhanced security contact types
4. **Enterprise contact management**: B2B contact structures
5. **Cross-border compliance**: International compliance type support
6. **Contact analytics**: Types для contact behavior analytics
7. **Smart contact management**: AI-powered contact optimization types
8. **Blockchain identity**: Decentralized identity integration types
