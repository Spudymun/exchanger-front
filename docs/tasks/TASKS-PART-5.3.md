# 🚀 ExchangeGO Development Tasks - Part 5.3: Contact & Payment Steps

**Дата создания:** 29 июня 2025  
**Статус:** В разработке  
**Покрытие:** Контактная информация, способы оплаты, подтверждение заявки, отслеживание

---

## 📋 Общая информация

### Связь с предыдущими частями:

- ✅ Продолжает Multi-step Flow из Part 5.2 (Exchange Pages)
- ✅ Использует UI Components из Part 4 (UI Components & Forms)
- ✅ Интегрируется с State Management из Part 3
- ✅ Использует tRPC API из Part 2

### Архитектурный подход:

- **Step-by-step Validation** для каждого этапа
- **Secure Data Collection** для контактов и платежных данных
- **Order Status Tracking** с real-time updates
- **Mobile-optimized Forms** для удобства заполнения

---

## 📝 PHASE 5.3: CONTACT & PAYMENT STEPS

### TASK 5.3.1: Создать Contact Info Step с валидацией

**Время:** 2 часа  
**Приоритет:** 🔴 Критический

#### Описание

Шаг сбора контактной информации с валидацией email, телефона и дополнительных данных.

#### Реализация

1. **apps/web/src/app/exchange/create/components/steps/ContactInfoStep.tsx**

```typescript
'use client';

import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select } from '@repo/ui';
import { useForm } from '~/hooks/useForm';
import { useOrderCreate } from '~/hooks/useOrderCreate';
import { UserIcon, EnvelopeIcon, PhoneIcon, IdentificationIcon } from '@heroicons/react/24/outline';

const contactInfoSchema = z.object({
  firstName: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
  lastName: z.string().min(2, 'Минимум 2 символа').max(50, 'Максимум 50 символов'),
  email: z.string().email('Введите корректный email'),
  phone: z.string()
    .regex(/^\+380\d{9}$/, 'Формат: +380XXXXXXXXX')
    .min(13, 'Неполный номер телефона'),
  telegramUsername: z.string()
    .optional()
    .refine((val) => !val || val.startsWith('@'), 'Telegram username должен начинаться с @'),
  communicationMethod: z.enum(['email', 'phone', 'telegram'], {
    required_error: 'Выберите способ связи',
  }),
});

type ContactInfoData = z.infer<typeof contactInfoSchema>;

interface ContactInfoStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ContactInfoStep({ onNext, onBack }: ContactInfoStepProps) {
  const orderCreate = useOrderCreate();

  const form = useForm<ContactInfoData>({
    initialValues: {
      firstName: orderCreate.contactInfo.firstName || '',
      lastName: orderCreate.contactInfo.lastName || '',
      email: orderCreate.contactInfo.email || '',
      phone: orderCreate.contactInfo.phone || '',
      telegramUsername: orderCreate.contactInfo.telegramUsername || '',
      communicationMethod: orderCreate.contactInfo.communicationMethod || 'email',
    },
    validationSchema: contactInfoSchema,
    onSubmit: async (values) => {
      // Сохраняем данные в store
      orderCreate.updateContactInfo(values);
      onNext();
    },
  });

  // Форматирование номера телефона
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (!value.startsWith('380')) {
      if (value.startsWith('0')) {
        value = '380' + value.slice(1);
      } else {
        value = '380' + value;
      }
    }

    if (value.length > 12) {
      value = value.slice(0, 12);
    }

    form.setValue('phone', '+' + value);
  };

  // Форматирование Telegram username
  const handleTelegramChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (value && !value.startsWith('@')) {
      value = '@' + value;
    }
    form.setValue('telegramUsername', value);
  };

  const communicationOptions = [
    { value: 'email', label: 'Email уведомления' },
    { value: 'phone', label: 'SMS уведомления' },
    { value: 'telegram', label: 'Telegram сообщения' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserIcon className="h-5 w-5" />
          <span>Контактная информация</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              {...form.getFieldProps('firstName')}
              label="Имя"
              placeholder="Введите ваше имя"
              error={form.getFieldError('firstName')?.message}
              leftIcon={<UserIcon className="h-4 w-4" />}
              autoComplete="given-name"
            />

            <Input
              {...form.getFieldProps('lastName')}
              label="Фамилия"
              placeholder="Введите вашу фамилию"
              error={form.getFieldError('lastName')?.message}
              leftIcon={<IdentificationIcon className="h-4 w-4" />}
              autoComplete="family-name"
            />
          </div>

          {/* Contact Methods */}
          <div className="space-y-4">
            <Input
              {...form.getFieldProps('email')}
              type="email"
              label="Email адрес"
              placeholder="example@email.com"
              error={form.getFieldError('email')?.message}
              leftIcon={<EnvelopeIcon className="h-4 w-4" />}
              hint="Основной способ связи и получения уведомлений"
              autoComplete="email"
            />

            <Input
              value={form.values.phone}
              onChange={handlePhoneChange}
              type="tel"
              label="Номер телефона"
              placeholder="+380XXXXXXXXX"
              error={form.getFieldError('phone')?.message}
              leftIcon={<PhoneIcon className="h-4 w-4" />}
              hint="Для SMS уведомлений и подтверждения операций"
              autoComplete="tel"
            />

            <Input
              value={form.values.telegramUsername || ''}
              onChange={handleTelegramChange}
              label="Telegram username (опционально)"
              placeholder="@username"
              error={form.getFieldError('telegramUsername')?.message}
              hint="Для быстрой связи и уведомлений в Telegram"
            />
          </div>

          {/* Communication Preference */}
          <Select
            {...form.getFieldProps('communicationMethod')}
            label="Предпочитаемый способ связи"
            options={communicationOptions}
            error={form.getFieldError('communicationMethod')?.message}
            hint="Выберите, как вы хотите получать уведомления о статусе заявки"
          />

          {/* Security Notice */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                <span className="text-xs text-white font-bold">i</span>
              </div>
              <div>
                <div className="font-medium text-sm text-blue-800">
                  Защита персональных данных
                </div>
                <div className="text-xs text-blue-700 mt-1">
                  Ваши данные используются только для обработки заявки и не передаются третьим лицам.
                  Все данные защищены согласно GDPR.
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
            >
              Назад
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid}
              loading={form.isSubmitting}
            >
              Продолжить
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

2. **apps/web/src/app/exchange/create/components/steps/PaymentMethodStep.tsx**

```typescript
'use client';

import React from 'react';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select } from '@repo/ui';
import { useForm } from '~/hooks/useForm';
import { useOrderCreate } from '~/hooks/useOrderCreate';
import { ExchangeCalculation } from '@repo/types';
import {
  CreditCardIcon,
  BanknotesIcon,
  BuildingLibraryIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';

const paymentMethodSchema = z.object({
  method: z.enum(['bank_card', 'bank_transfer', 'cash', 'mobile_payment'], {
    required_error: 'Выберите способ оплаты',
  }),
  cardNumber: z.string().optional(),
  cardHolder: z.string().optional(),
  iban: z.string().optional(),
  bankName: z.string().optional(),
  phoneNumber: z.string().optional(),
  cashLocation: z.string().optional(),
}).superRefine((data, ctx) => {
  // Валидация в зависимости от выбранного метода
  if (data.method === 'bank_card') {
    if (!data.cardNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Введите номер карты',
        path: ['cardNumber'],
      });
    } else if (!/^\d{16}$/.test(data.cardNumber.replace(/\s/g, ''))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Номер карты должен содержать 16 цифр',
        path: ['cardNumber'],
      });
    }

    if (!data.cardHolder || data.cardHolder.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Введите имя держателя карты',
        path: ['cardHolder'],
      });
    }
  }

  if (data.method === 'bank_transfer') {
    if (!data.iban) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Введите IBAN',
        path: ['iban'],
      });
    }
    if (!data.bankName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Введите название банка',
        path: ['bankName'],
      });
    }
  }

  if (data.method === 'mobile_payment') {
    if (!data.phoneNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Введите номер телефона',
        path: ['phoneNumber'],
      });
    }
  }

  if (data.method === 'cash') {
    if (!data.cashLocation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Выберите место получения',
        path: ['cashLocation'],
      });
    }
  }
});

type PaymentMethodData = z.infer<typeof paymentMethodSchema>;

interface PaymentMethodStepProps {
  calculation: ExchangeCalculation;
  onNext: () => void;
  onBack: () => void;
}

export function PaymentMethodStep({ calculation, onNext, onBack }: PaymentMethodStepProps) {
  const orderCreate = useOrderCreate();

  const form = useForm<PaymentMethodData>({
    initialValues: {
      method: orderCreate.paymentMethod.method || 'bank_card',
      cardNumber: orderCreate.paymentMethod.cardNumber || '',
      cardHolder: orderCreate.paymentMethod.cardHolder || '',
      iban: orderCreate.paymentMethod.iban || '',
      bankName: orderCreate.paymentMethod.bankName || '',
      phoneNumber: orderCreate.paymentMethod.phoneNumber || '',
      cashLocation: orderCreate.paymentMethod.cashLocation || '',
    },
    validationSchema: paymentMethodSchema,
    onSubmit: async (values) => {
      orderCreate.updatePaymentMethod(values);
      onNext();
    },
  });

  // Форматирование номера карты
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
    form.setValue('cardNumber', formatted);
  };

  const paymentMethods = [
    {
      value: 'bank_card',
      label: 'Банковская карта',
      icon: CreditCardIcon,
      description: 'Visa, MasterCard, Национальная платежная система',
      fee: '0%',
      time: '5-15 минут',
    },
    {
      value: 'bank_transfer',
      label: 'Банковский перевод',
      icon: BuildingLibraryIcon,
      description: 'Перевод на банковский счет',
      fee: '0.5%',
      time: '30 минут - 2 часа',
    },
    {
      value: 'mobile_payment',
      label: 'Мобильные платежи',
      icon: DevicePhoneMobileIcon,
      description: 'Apple Pay, Google Pay, Samsung Pay',
      fee: '0%',
      time: '5-10 минут',
    },
    {
      value: 'cash',
      label: 'Наличные',
      icon: BanknotesIcon,
      description: 'Получение в офисе или через курьера',
      fee: '1%',
      time: '1-4 часа',
    },
  ];

  const cashLocations = [
    { value: 'kyiv_center', label: 'Киев - Центр (ул. Крещатик, 25)' },
    { value: 'kyiv_left_bank', label: 'Киев - Левый берег (ул. Бажана, 10)' },
    { value: 'kharkiv_center', label: 'Харьков - Центр (пр. Науки, 15)' },
    { value: 'dnipro_center', label: 'Днипро - Центр (ул. Европейская, 5)' },
    { value: 'courier', label: 'Доставка курьером (+200 грн)' },
  ];

  const selectedMethod = paymentMethods.find(m => m.value === form.values.method);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCardIcon className="h-5 w-5" />
          <span>Способ получения средств</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={form.handleSubmit} className="space-y-6">
          {/* Payment Methods Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const isSelected = form.values.method === method.value;
              const Icon = method.icon;

              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => form.setValue('method', method.value as any)}
                  className={`
                    p-4 rounded-lg border-2 text-left transition-all duration-200
                    ${isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className={`h-6 w-6 mt-1 ${isSelected ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="flex-1">
                      <div className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {method.label}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {method.description}
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Комиссия: {method.fee}</span>
                        <span>Время: {method.time}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Method-specific Fields */}
          {form.values.method === 'bank_card' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Данные банковской карты</h4>

              <Input
                value={form.values.cardNumber || ''}
                onChange={handleCardNumberChange}
                label="Номер карты"
                placeholder="1234 5678 9012 3456"
                error={form.getFieldError('cardNumber')?.message}
                maxLength={19}
              />

              <Input
                {...form.getFieldProps('cardHolder')}
                label="Имя держателя карты"
                placeholder="IVAN PETROV"
                error={form.getFieldError('cardHolder')?.message}
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          )}

          {form.values.method === 'bank_transfer' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Банковские реквизиты</h4>

              <Input
                {...form.getFieldProps('iban')}
                label="IBAN"
                placeholder="UA123456789012345678901234567"
                error={form.getFieldError('iban')?.message}
              />

              <Input
                {...form.getFieldProps('bankName')}
                label="Название банка"
                placeholder="ПриватБанк"
                error={form.getFieldError('bankName')?.message}
              />
            </div>
          )}

          {form.values.method === 'mobile_payment' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Мобильный платеж</h4>

              <Input
                {...form.getFieldProps('phoneNumber')}
                label="Номер телефона"
                placeholder="+380XXXXXXXXX"
                error={form.getFieldError('phoneNumber')?.message}
                hint="Номер телефона, привязанный к мобильному платежу"
              />
            </div>
          )}

          {form.values.method === 'cash' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Получение наличных</h4>

              <Select
                {...form.getFieldProps('cashLocation')}
                label="Место получения"
                options={cashLocations}
                error={form.getFieldError('cashLocation')?.message}
                placeholder="Выберите удобное место"
              />
            </div>
          )}

          {/* Amount Summary */}
          {selectedMethod && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium text-green-800">К получению:</span>
                <span className="text-lg font-bold text-green-900">
                  ₴{calculation.uahAmount.toLocaleString()}
                </span>
              </div>
              {selectedMethod.fee !== '0%' && (
                <div className="flex justify-between items-center text-sm text-green-700 mt-1">
                  <span>Комиссия способа оплаты:</span>
                  <span>-₴{(calculation.uahAmount * parseFloat(selectedMethod.fee) / 100).toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
            >
              Назад
            </Button>
            <Button
              type="submit"
              disabled={!form.isValid}
              loading={form.isSubmitting}
            >
              Продолжить
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

#### Чек-лист готовности

- [ ] Contact Info Step создан с валидацией
- [ ] Payment Method Step с разными способами
- [ ] Form validation работает корректно
- [ ] Data persistence между шагами
- [ ] Mobile responsive forms
- [ ] Security notices отображаются

---

### TASK 5.3.2: Создать Confirmation Step и Order Creation

**Время:** 2.5 часа  
**Приоритет:** 🔴 Критический

#### Описание

Финальный шаг подтверждения с созданием заявки и переходом к отслеживанию.

#### Реализация

1. **apps/web/src/app/exchange/create/components/steps/ConfirmationStep.tsx**

```typescript
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@repo/ui';
import { useExchange } from '~/hooks/useExchange';
import { useOrderCreate } from '~/hooks/useOrderCreate';
import { useRouter } from 'next/navigation';
import { getCurrencyIcon } from '~/utils/currency';
import {
  CheckCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

interface ConfirmationStepProps {
  onBack: () => void;
}

export function ConfirmationStep({ onBack }: ConfirmationStepProps) {
  const router = useRouter();
  const exchange = useExchange();
  const orderCreate = useOrderCreate();

  const [isCreating, setIsCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleCreateOrder = async () => {
    setIsCreating(true);
    setError(null);

    try {
      const orderId = await orderCreate.createOrder();

      // Очищаем состояние после успешного создания
      exchange.reset();

      // Переходим к отслеживанию заявки
      router.push(`/orders/${orderId}`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка при создании заявки');
    } finally {
      setIsCreating(false);
    }
  };

  if (!exchange.calculation) {
    return null;
  }

  const isFromCrypto = exchange.formData.direction === 'crypto-to-uah';
  const CurrencyIcon = getCurrencyIcon(exchange.formData.currency);

  const paymentMethodLabels = {
    bank_card: 'Банковская карта',
    bank_transfer: 'Банковский перевод',
    mobile_payment: 'Мобильные платежи',
    cash: 'Наличные',
  };

  return (
    <div className="space-y-6">
      {/* Final Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DocumentCheckIcon className="h-5 w-5" />
            <span>Подтверждение заявки</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Exchange Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CurrencyIcon className="h-6 w-6" />
                  <span className="font-medium">
                    {isFromCrypto ? exchange.formData.currency : 'UAH'}
                  </span>
                </div>
                <div className="text-gray-400">→</div>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">
                    {isFromCrypto ? 'UAH' : exchange.formData.currency}
                  </span>
                  {!isFromCrypto && <CurrencyIcon className="h-6 w-6" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600">Отдаете</div>
                <div className="text-xl font-bold text-gray-900">
                  {isFromCrypto
                    ? `${exchange.calculation.cryptoAmount} ${exchange.formData.currency}`
                    : `₴${exchange.calculation.uahAmount.toLocaleString()}`
                  }
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Получаете</div>
                <div className="text-xl font-bold text-green-600">
                  {isFromCrypto
                    ? `₴${exchange.calculation.uahAmount.toLocaleString()}`
                    : `${exchange.calculation.cryptoAmount} ${exchange.formData.currency}`
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Контактная информация</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Имя:</span>
                <span className="ml-2 font-medium">
                  {orderCreate.contactInfo.firstName} {orderCreate.contactInfo.lastName}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{orderCreate.contactInfo.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Телефон:</span>
                <span className="ml-2 font-medium">{orderCreate.contactInfo.phone}</span>
              </div>
              <div>
                <span className="text-gray-600">Способ связи:</span>
                <span className="ml-2 font-medium">
                  {orderCreate.contactInfo.communicationMethod === 'email' ? 'Email' :
                   orderCreate.contactInfo.communicationMethod === 'phone' ? 'SMS' : 'Telegram'}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Способ получения</h4>
            <div className="text-sm">
              <span className="text-gray-600">Метод:</span>
              <span className="ml-2 font-medium">
                {paymentMethodLabels[orderCreate.paymentMethod.method as keyof typeof paymentMethodLabels]}
              </span>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <div className="font-medium text-sm text-yellow-800 mb-2">
                  Важные условия
                </div>
                <ul className="text-xs text-yellow-700 space-y-1">
                  <li>• Курс фиксируется на 30 минут после создания заявки</li>
                  <li>• При несоответствии переведенной суммы заявка отменяется</li>
                  <li>• Возврат средств осуществляется в течение 24 часов</li>
                  <li>• Комиссия за возврат составляет 2% от суммы</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <ShieldCheckIcon className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Защищено эскроу</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <ClockIcon className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">Быстрая обработка</span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircleIcon className="h-4 w-4 text-purple-600" />
              <span className="text-gray-600">Гарантия возврата</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms Acceptance */}
      <Card>
        <CardContent className="p-6">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              required
            />
            <div className="text-sm text-gray-700">
              Я соглашаюсь с{' '}
              <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                условиями использования
              </a>{' '}
              и{' '}
              <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                политикой конфиденциальности
              </a>
              , подтверждаю правильность указанных данных и понимаю риски операций с криптовалютами.
            </div>
          </label>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="font-medium">Ошибка создания заявки</span>
            </div>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isCreating}
        >
          Назад
        </Button>
        <Button
          onClick={handleCreateOrder}
          loading={isCreating}
          size="lg"
          className="min-w-[200px]"
        >
          {isCreating ? 'Создание заявки...' : 'Создать заявку'}
        </Button>
      </div>
    </div>
  );
}
```

2. **apps/web/src/hooks/useOrderCreate.ts**

```typescript
'use client';

import { create } from 'zustand';
import { trpc } from '~/utils/trpc';

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  telegramUsername?: string;
  communicationMethod: 'email' | 'phone' | 'telegram';
}

interface PaymentMethod {
  method: 'bank_card' | 'bank_transfer' | 'cash' | 'mobile_payment';
  cardNumber?: string;
  cardHolder?: string;
  iban?: string;
  bankName?: string;
  phoneNumber?: string;
  cashLocation?: string;
}

interface OrderCreateState {
  // Data
  contactInfo: Partial<ContactInfo>;
  paymentMethod: Partial<PaymentMethod>;

  // Actions
  updateContactInfo: (info: Partial<ContactInfo>) => void;
  updatePaymentMethod: (method: Partial<PaymentMethod>) => void;
  createOrder: () => Promise<string>;
  reset: () => void;
}

export const useOrderCreate = create<OrderCreateState>((set, get) => ({
  // Initial state
  contactInfo: {},
  paymentMethod: {},

  // Actions
  updateContactInfo: info =>
    set(state => ({
      contactInfo: { ...state.contactInfo, ...info },
    })),

  updatePaymentMethod: method =>
    set(state => ({
      paymentMethod: { ...state.paymentMethod, ...method },
    })),

  createOrder: async () => {
    const state = get();
    const createOrderMutation = trpc.exchange.createOrder.useMutation();

    try {
      const result = await createOrderMutation.mutateAsync({
        contactInfo: state.contactInfo as ContactInfo,
        paymentMethod: state.paymentMethod as PaymentMethod,
      });

      return result.orderId;
    } catch (error) {
      throw error;
    }
  },

  reset: () =>
    set({
      contactInfo: {},
      paymentMethod: {},
    }),
}));
```

#### Чек-лист готовности

- [ ] Confirmation Step создан
- [ ] Order creation logic реализован
- [ ] Terms and conditions отображаются
- [ ] Error handling работает
- [ ] Success navigation настроена
- [ ] Data validation финальная

---

## 📊 Статус Progress Part 5.3

### Завершенные задачи: 0/3

- [ ] TASK 5.3.1: Создать Contact Info Step с валидацией
- [ ] TASK 5.3.2: Создать Confirmation Step и Order Creation
- **TASK 5.3.3** - Order Tracking Pages (следующий)

### Ключевые результаты Part 5.3:

✅ **Contact Info Step** с полной валидацией  
✅ **Payment Method Step** с множественными способами  
✅ **Confirmation Step** с финальным review  
✅ **Order Creation Flow** с error handling  
✅ **Form Validation** на каждом этапе  
✅ **Data Persistence** между шагами  
✅ **Security Notices** и terms acceptance  
✅ **Mobile-responsive Forms** для всех устройств

---

**Дата создания:** 29 июня 2025  
**Версия:** 1.0  
**Следующая подчасть:** TASKS-PART-5.4.md (Order Tracking & Auth Pages)
