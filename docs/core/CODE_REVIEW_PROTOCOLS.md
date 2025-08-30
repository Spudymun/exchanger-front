# 📋 Протоколы проверок кода по архитектурным уровням

**Дата создания:** 4 июля 2025  
**Версия:** 1.0  
**Назначение:** Структурированные протоколы для senior-уровня анализа кода по архитектурным слоям

**Основа:** ai-agent-rules.yml + CODE_STYLE_GUIDE.md + архитектурные принципы проекта

---

## 🎯 Общие принципы анализа

### Критерии качества (применимы ко всем уровням):

- **Отсутствие технического долга** (правило 13)
- **Централизация** (правило 19)
- **Строгая типизация** без any/@ts-ignore
- **Отсутствие дублирования кода**
- **Правильные импорты** из централизованных систем
- **Архитектурная целостность**

**Примечание:** Размеры функций и компонентов контролируются централизованно через ESLint (`eslint.config.mjs` + `packages/constants/src/linter-limits.ts`)

### Методология анализа:

1. **Структурная проверка** - соответствие архитектурным принципам
2. **Качественная проверка** - сложность, читаемость
3. **Безопасность** - отсутствие уязвимостей и небезопасных практик
4. **Интеграционная проверка** - корректность зависимостей между слоями

---

## 📊 Уровень 1: Константы и типы

**Файлы:** `packages/constants/`, `packages/exchange-core/types/`

### 🔍 Критерии качества

#### Архитектурные требования:

- [ ] **Единственный источник истины** - каждая константа определена в одном месте
- [ ] **Правильная категоризация** - константы разложены по логическим файлам
- [ ] **Строгая типизация** - использование `as const` для конфигурационных объектов
- [ ] **Экспорт типов** - все типы экспортируются из `packages/exchange-core/types/`

#### Структурные требования:

- [ ] **Запрет на вычисления** - константы содержат только статические значения
- [ ] **Отсутствие циклических зависимостей** между файлами констант
- [ ] **Правильная вложенность** - не более 2 уровней объектов
- [ ] **Единообразие именования** - SCREAMING_SNAKE_CASE для констант

### 📋 Детальный чек-лист

#### Constants файлы:

```typescript
// ✅ Правильно
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
} as const;

export type OrderStatus = keyof typeof ORDER_STATUS;

// ❌ Неправильно
export const calculateCommission = (amount: number) => amount * 0.05; // Функция в константах!
```

**Проверки:**

- [ ] Все константы используют `as const`
- [ ] Отсутствуют функции и вычисления
- [ ] Экспортируются соответствующие типы
- [ ] Нет дублирования констант между файлами
- [ ] Магические числа вынесены в именованные константы

#### Types файлы:

```typescript
// ✅ Правильно
export interface User {
  id: string;
  email: string;
  role: UserRole; // Импорт из констант
  createdAt: Date;
}

// ❌ Неправильно
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user'; // Hardcoded вместо импорта!
}
```

**Проверки:**

- [ ] Используются типы из констант вместо literal types
- [ ] Правильная структура интерфейсов (не более 15 полей)
- [ ] Отсутствуют циклические зависимости типов
- [ ] Строгая типизация - нет `any`, `unknown` без обоснования
- [ ] Все опциональные поля помечены `?`

### 🚨 Типичные нарушения

1. **Дублирование констант:**

   ```typescript
   // ❌ В разных файлах
   // constants/api.ts
   export const ORDER_STATUS = 'pending';
   // constants/ui.ts
   export const PENDING_STATUS = 'pending'; // Дублирование!
   ```

2. **Hardcoded значения в типах:**

   ```typescript
   // ❌ Неправильно
   type Status = 'pending' | 'confirmed';

   // ✅ Правильно
   type Status = keyof typeof ORDER_STATUS;
   ```

3. **Функции в константах:**
   ```typescript
   // ❌ Нарушение архитектуры
   export const formatCurrency = (amount: number) => `$${amount}`;
   ```

### 🔧 Методы анализа

1. **Поиск дублирования:** `grep -r "export const.*=" packages/constants/`
2. **Проверка as const:** поиск объектов без `as const`
3. **Проверка импортов:** все типы импортируются из `@repo/exchange-core`, константы из `@repo/constants`
4. **Семантическая схожесть:** поиск констант с разными именами, но одинаковыми значениями
5. **DRY принцип:** отсутствие дублирования значений между константами

#### Дополнительные проверки:

- [ ] **Семантическая дедупликация** - константы с одинаковыми значениями объединены
- [ ] **Согласованность наименований** - похожие по смыслу константы имеют единый стиль
- [ ] **Логическая группировка** - связанные константы находятся в одном файле

---

## ⚙️ Уровень 2: Утилиты и core логика

**Файлы:** `packages/exchange-core/utils/`, `packages/exchange-core/data/`

### 🔍 Критерии качества

#### Архитектурные требования:

- [ ] **Чистые функции** - отсутствие побочных эффектов
- [ ] **Единственная ответственность** - каждая функция решает одну задачу
- [ ] **Функциональный стиль** - предпочтение immutable операций
- [ ] **Правильные зависимости** - импорт только из constants и types

#### Качественные требования:

- [ ] **Сложность** ≤10 по цикломатической сложности
- [ ] **Параметры** ≤4 параметров на функцию
- [ ] **Вложенность** ≤2 уровней

**Примечание:** Размер функций контролируется ESLint с централизованными лимитами

### 📋 Детальный чек-лист

#### Utils функции:

```typescript
// ✅ Правильно - чистая функция
export function calculateExchangeAmount(amount: number, rate: number, commission: number): number {
  if (amount <= 0 || rate <= 0) return 0;

  const baseAmount = amount * rate;
  const commissionAmount = baseAmount * commission;
  return baseAmount - commissionAmount;
}

// ❌ Неправильно - побочные эффекты
export function calculateAndSaveAmount(amount: number): number {
  const result = amount * 1.05;
  localStorage.setItem('lastAmount', result.toString()); // Побочный эффект!
  return result;
}
```

**Проверки:**

- [ ] Все функции чистые (без побочных эффектов)
- [ ] Валидация входных параметров
- [ ] Обработка edge cases (0, null, undefined)
- [ ] Использование констант из `@repo/constants`
- [ ] Строгая типизация входных и выходных параметров

#### Validation функции:

```typescript
// ✅ Правильно
export function validateCryptocurrency(currency: string): currency is CryptoCurrency {
  return SUPPORTED_CURRENCIES.includes(currency as CryptoCurrency);
}

// ❌ Неправильно - hardcoded список
export function validateCryptocurrency(currency: string): boolean {
  return ['BTC', 'ETH', 'USDT'].includes(currency); // Hardcode!
}
```

**Проверки:**

- [ ] Использование констант для валидации
- [ ] Type guards с правильной типизацией
- [ ] Комплексные валидаторы разбиты на простые функции
- [ ] Централизованные схемы валидации

#### Data managers:

```typescript
// ✅ Правильно - разделение ответственности
export const userManager = {
  findByEmail: (email: string) => users.find(u => u.email === email),
  findById: (id: string) => users.find(u => u.id === id),
  create: (userData: CreateUserData) => {
    /* create logic */
  },
};

// ❌ Неправильно - слишком много ответственности
export const dataManager = {
  findUser: () => {},
  createUser: () => {},
  findOrder: () => {},
  createOrder: () => {},
  sendEmail: () => {}, // Не относится к data management!
  uploadFile: () => {}, // Не относится к data management!
};
```

**Проверки:**

- [ ] Четкое разделение по типам данных (user, order, stats)
- [ ] CRUD операции стандартизированы
- [ ] Отсутствует бизнес-логика в data layer
- [ ] Использование типов из `@repo/exchange-core/types`

### 🚨 Типичные нарушения

1. **Побочные эффекты в utils:**

   ```typescript
   // ❌
   export function formatCurrency(amount: number): string {
     console.log('Formatting:', amount); // Side effect!
     return `$${amount.toFixed(2)}`;
   }
   ```

2. **Hardcoded значения:**

   ```typescript
   // ❌
   export function calculateCommission(amount: number): number {
     return amount * 0.05; // Magic number!
   }
   ```

3. **Смешение ответственности:**
   ```typescript
   // ❌
   export function processPayment(data: PaymentData): void {
     validatePayment(data); // OK
     saveToDatabase(data); // OK
     sendNotificationEmail(data.email); // Не относится к core logic!
   }
   ```

### 🔧 Методы анализа

1. **Поиск побочных эффектов:** console.log, localStorage, API вызовы в utils
2. **Проверка чистоты функций:** функции не изменяют входные параметры
3. **Проверка зависимостей:** импорты только из constants/types
4. **DRY принцип:** отсутствие дублирования логики между утилитами
5. **Строгое использование констант:** все магические числа/строки заменены на константы из уровня 1

**Примечание:** Размер функций автоматически контролируется ESLint rule `max-lines-per-function`

#### Межуровневые зависимости:

- [ ] **Импорты из уровня 1** - все константы и типы берутся из централизованных пакетов
- [ ] **Отсутствие дублирования** - нет повторяющихся алгоритмов между утилитами
- [ ] **Правильная архитектура** - утилиты НЕ содержат бизнес-логику или API вызовы

---

## 🌐 Уровень 3: API слой (tRPC)

**Файлы:** `apps/web/src/server/trpc/`

### 🔍 Критерии качества

#### Архитектурные требования:

- [ ] **Разделение по ролям** - отдельные роутеры для разных ролей пользователей
- [ ] **Модульная структура** - роутеры разбиты по функциональным областям
- [ ] **Middleware цепочки** - правильное применение auth, rateLimit, logging
- [ ] **Централизованная обработка ошибок** - единообразная структура ошибок

#### Безопасность:

- [ ] **Аутентификация** - все protected процедуры проверяют пользователя
- [ ] **Авторизация** - проверка ролей и прав доступа
- [ ] **Rate limiting** - ограничения на критические операции
- [ ] **Валидация входных данных** - строгая валидация всех входов

### 📋 Детальный чек-лист

#### Структура роутеров:

```typescript
// ✅ Правильно - четкое разделение
export const exchangeRouter = createTRPCRouter({
  getRates: publicProcedure.query(async () => { /* ... */ }),
  calculateExchange: publicProcedure.input(z.object({...})).query(async ({ input }) => { /* ... */ }),
  createOrder: rateLimitedProcedure.input(createOrderSchema).mutation(async ({ input, ctx }) => { /* ... */ })
})

// ❌ Неправильно - смешение функций
export const apiRouter = createTRPCRouter({
  getRates: publicProcedure.query(() => {}),
  createUser: publicProcedure.mutation(() => {}), // Разные домены!
  sendEmail: publicProcedure.mutation(() => {}), // Не API функция!
})
```

**Проверки:**

- [ ] Роутеры разделены по функциональным доменам
- [ ] Единообразная структура процедур
- [ ] Правильное использование query/mutation

#### Middleware применение:

```typescript
// ✅ Правильно
export const createOrder = rateLimitedProcedure
  .input(createOrderSchema) // Валидация
  .mutation(async ({ input, ctx }) => {
    const { user, ip } = ctx; // Контекст с аутентификацией

    // Бизнес-логика
    const order = await orderManager.create({
      ...input,
      userId: user.id,
      status: ORDER_STATUS.PENDING,
    });

    return order;
  });

// ❌ Неправильно - отсутствие валидации и защиты
export const createOrder = publicProcedure.mutation(async ({ input }) => {
  // Нет валидации схемы!
  // Нет проверки пользователя!
  // Нет rate limiting!
});
```

**Проверки:**

- [ ] Все мутации защищены соответствующими middleware
- [ ] Критические операции имеют rate limiting
- [ ] Входные данные валидируются Zod схемами
- [ ] Контекст правильно используется (user, ip, session)

#### Обработка ошибок:

```typescript
// ✅ Правильно
export const getOrder = protectedProcedure
  .input(z.object({ orderId: z.string() }))
  .query(async ({ input, ctx }) => {
    const order = await orderManager.findById(input.orderId);

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: ORDER_MESSAGES.NOT_FOUND,
      });
    }

    if (order.userId !== ctx.user.id) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: ORDER_MESSAGES.ACCESS_DENIED,
      });
    }

    return order;
  });
```

**Проверки:**

- [ ] Использование централизованных сообщений ошибок
- [ ] Правильные HTTP коды ошибок
- [ ] Проверка прав доступа к данным
- [ ] Отсутствие чувствительной информации в ошибках

#### Ролевая модель:

```typescript
// ✅ Правильно - отдельные роутеры по ролям
export const operatorRouter = createTRPCRouter({
  getPendingOrders: operatorOnlyProcedure.query(() => {}),
  updateOrderStatus: operatorOnlyProcedure.input(updateStatusSchema).mutation(() => {}),
});

export const supportRouter = createTRPCRouter({
  searchKnowledge: supportOnlyProcedure.input(searchSchema).query(() => {}),
  createTicket: supportOnlyProcedure.input(ticketSchema).mutation(() => {}),
});

// ❌ Неправильно - смешение ролей
export const adminRouter = createTRPCRouter({
  // Operator функции
  getPendingOrders: adminProcedure.query(() => {}),
  // Support функции
  searchKnowledge: adminProcedure.query(() => {}),
  // Admin функции
  deleteUser: adminProcedure.mutation(() => {}),
});
```

**Проверки:**

- [ ] Четкое разделение по ролям (operator, support, user)
- [ ] Middleware проверяет соответствующие роли
- [ ] Отсутствие функций admin в apps/web (только в apps/admin-panel)

### 🚨 Типичные нарушения

1. **Отсутствие валидации:**

   ```typescript
   // ❌
   export const createUser = publicProcedure.mutation(async ({ input }) => {
     // Нет схемы валидации!
     return userManager.create(input); // Небезопасно!
   });
   ```

2. **Смешение ответственности:**

   ```typescript
   // ❌
   export const userRouter = createTRPCRouter({
     getProfile: protectedProcedure.query(() => {}),
     createOrder: protectedProcedure.mutation(() => {}), // Не user функция!
     uploadAvatar: protectedProcedure.mutation(() => {}), // Не API функция!
   });
   ```

3. **Отсутствие проверки доступа:**
   ```typescript
   // ❌
   export const getOrder = protectedProcedure.query(async ({ input }) => {
     return orderManager.findById(input.orderId); // Нет проверки userId!
   });
   ```

### 🔧 Методы анализа

1. **Поиск незащищенных процедур:** все мутации должны иметь middleware
2. **Анализ валидации:** все процедуры с input должны иметь схему
3. **Проверка ролевой модели:** соответствие архитектуре из ROLES_ARCHITECTURE.md
4. **DRY принцип:** отсутствие дублирования логики между роутерами
5. **Межуровневые зависимости:** правильное использование констант из уровня 1 и утилит из уровня 2

#### Архитектурная целостность:

- [ ] **Константы из уровня 1** - все статусы, коды ошибок, лимиты берутся из `@repo/constants`
- [ ] **Утилиты из уровня 2** - валидация, форматирование, вычисления вынесены в utils
- [ ] **Отсутствие дублирования** - общие схемы валидации и обработчики ошибок централизованы

---

## 🎣 Уровень 4: Состояние и хуки

**Файлы:** `packages/hooks/src/`

### 🔍 Критерии качества

#### Архитектурные требования:

- [ ] **Разделение слоев** - state/stores отдельно от business/hooks
- [ ] **Инкапсуляция** - бизнес-логика скрыта в хуках
- [ ] **Immutable updates** - правильное обновление состояния в Zustand
- [ ] **Селекторы** - оптимизация ре-рендеров через селекторы

#### Структурные требования:

- [ ] **Модульность** - отдельные stores для разных доменов
- [ ] **Enhanced hooks** - обертки над stores с дополнительной логикой
- [ ] **Типизация** - строгие типы для всех состояний и actions
- [ ] **DevTools** - подключение Zustand devtools

### 📋 Детальный чек-лист

#### Zustand Stores:

```typescript
// ✅ Правильно - четкая структура store
interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  devtools(
    (set, get) => ({
      notifications: [],

      addNotification: notification =>
        set(
          state => ({
            notifications: [...state.notifications, { ...notification, id: nanoid() }],
          }),
          false,
          'addNotification'
        ),

      removeNotification: id =>
        set(
          state => ({
            notifications: state.notifications.filter(n => n.id !== id),
          }),
          false,
          'removeNotification'
        ),

      clearAll: () => set({ notifications: [] }, false, 'clearAll'),
    }),
    { name: 'notification-store' }
  )
);

// ❌ Неправильно - мутации и плохая структура
export const useNotificationStore = create((set, get) => ({
  notifications: [],

  addNotification: notification => {
    const state = get();
    state.notifications.push(notification); // Мутация!
    set(state); // Неправильное обновление
  },
}));
```

**Проверки:**

- [ ] Immutable обновления состояния
- [ ] DevTools подключены с именами действий
- [ ] Типизация интерфейса состояния
- [ ] Actions возвращают новые объекты, не мутируют существующие
- [ ] **Memory leak prevention** - все таймеры/подписки имеют cleanup
- [ ] **Stale closures prevention** - использование функциональных обновлений

#### Enhanced Hooks:

```typescript
// ✅ Правильно - обертка с дополнительной логикой
export function useNotifications() {
  const { notifications, addNotification, removeNotification } = useNotificationStore();

  const success = useCallback(
    (message: string) => {
      addNotification({
        type: 'success',
        message,
        duration: SUCCESS_DURATION,
      });
    },
    [addNotification]
  );

  const error = useCallback(
    (message: string) => {
      addNotification({
        type: 'error',
        message,
        duration: ERROR_DURATION,
      });
    },
    [addNotification]
  );

  return { notifications, success, error, remove: removeNotification };
}

// ❌ Неправильно - прямое использование без обертки
export function SomeComponent() {
  const { addNotification } = useNotificationStore(); // Прямое использование!

  const handleSuccess = () => {
    addNotification({
      // Дублирование логики в компонентах!
      type: 'success',
      message: 'Success!',
      duration: 5000,
    });
  };
}
```

**Проверки:**

- [ ] Enhanced hooks предоставляют упрощенный API
- [ ] Бизнес-логика инкапсулирована в хуках
- [ ] Использование useCallback для стабильности ссылок
- [ ] Импорт констант из `@repo/constants`

#### Business Logic Hooks:

```typescript
// ✅ Правильно - интеграция multiple stores
export function useExchange() {
  const { formData, setFormData, calculation, setCalculation } = useExchangeStore();
  const { success, error } = useNotifications();
  const t = useTranslations('exchange');

  const calculateExchange = useCallback(
    async (data: ExchangeFormData) => {
      try {
        const result = await trpc.exchange.calculateExchange.query(data);
        setCalculation(result);
        return result;
      } catch (err) {
        error('Ошибка расчета. Попробуйте позже.');
        throw err;
      }
    },
    [setCalculation, error]
  );

  const submitOrder = useCallback(async () => {
    if (!user) {
      error('Необходимо войти в систему');
      return;
    }

    try {
      const order = await trpc.exchange.createOrder.mutate(formData);
      success('Заявка создана успешно!');
      return order;
    } catch (err) {
      error('Ошибка создания заявки');
      throw err;
    }
  }, [formData, user, success, error]);

  return {
    formData,
    setFormData,
    calculation,
    calculateExchange,
    submitOrder,
  };
}
```

**Проверки:**

- [ ] Интеграция нескольких stores
- [ ] Обработка ошибок с уведомлениями
- [ ] Инкапсуляция tRPC взаимодействий
- [ ] Правильная типизация возвращаемых значений

#### Селекторы и оптимизация:

```typescript
// ✅ Правильно - селекторы для оптимизации
export const exchangeSelectors = {
  formData: (state: ExchangeState) => state.formData,
  calculation: (state: ExchangeState) => state.calculation,
  isValid: (state: ExchangeState) =>
    state.formData.fromAmount > 0 && state.formData.fromCurrency && state.formData.toCurrency,
};

// Использование
export function ExchangeForm() {
  const isValid = useExchangeStore(exchangeSelectors.isValid); // Оптимизированный селектор
  const formData = useExchangeStore(exchangeSelectors.formData);
}

// ❌ Неправильно - подписка на весь store
export function ExchangeForm() {
  const exchangeState = useExchangeStore(); // Подписка на весь store!
  const isValid = exchangeState.formData.fromAmount > 0; // Пересчет в компоненте!
}
```

**Проверки:**

- [ ] Селекторы вынесены в отдельные объекты
- [ ] Компоненты подписываются на минимальные части состояния
- [ ] Вычисления инкапсулированы в селекторах
- [ ] Отсутствие избыточных ре-рендеров

### 🚨 Типичные нарушения

1. **Мутации состояния:**

   ```typescript
   // ❌
   addItem: item => {
     const state = get();
     state.items.push(item); // Мутация!
     set(state);
   };
   ```

2. **Смешение UI и бизнес-логики:**

   ```typescript
   // ❌
   const useExchangeStore = create(set => ({
     showModal: false, // UI state в business store!
     modalTitle: '', // UI state в business store!
     formData: {},
     setShowModal: (show: boolean) => set({ showModal: show }),
   }));
   ```

3. **Отсутствие типизации:**

   ```typescript
   // ❌
   export const useStore = create((set, get) => ({
     // Нет типов!
     data: null,
     setData: data => set({ data }), // any типы!
   }));
   ```

4. **Прямое использование stores в компонентах:**

   ```typescript
   // ❌
   export function Component() {
     const { addNotification } = useNotificationStore(); // Прямое использование!
     // Вместо enhanced hook useNotifications()
   }
   ```

5. **Memory leaks:**

   ```typescript
   // ❌
   export function useTimer() {
     useEffect(() => {
       const interval = setInterval(() => {}, 1000);
       // Забыли cleanup!
     }, []);
   }
   ```

6. **Stale closures:**
   ```typescript
   // ❌
   const [count, setCount] = useState(0);
   useEffect(() => {
     const interval = setInterval(() => {
       setCount(count + 1); // Stale closure!
     }, 1000);
   }, []); // Пустой deps
   ```

### 🔧 Методы анализа

1. **Поиск мутаций:** `.push()`, `.pop()`, прямое изменение объектов
2. **Проверка типизации:** все stores должны иметь интерфейс
3. **Проверка селекторов:** оптимизация подписок в компонентах
4. **DRY принцип:** отсутствие дублирования состояния между stores
5. **Межуровневые зависимости:** правильное использование констант, утилит и API
6. **Memory leaks check:** `setInterval|setTimeout|addEventListener` без cleanup
7. **Stale closures check:** поиск устаревших замыканий в useEffect

#### Архитектурная целостность:

- [ ] **Константы из уровня 1** - все статусы, типы берутся из `@repo/constants`
- [ ] **Утилиты из уровня 2** - форматирование, валидация используют централизованные функции
- [ ] **API из уровня 3** - tRPC вызовы инкапсулированы в business hooks
- [ ] **Отсутствие дублирования** - нет повторяющихся селекторов и actions между stores

---

## 🎨 Уровень 5: Компоненты и UI

**Файлы:** `apps/web/src/components/`, `packages/ui/`

### 🔍 Критерии качества

#### Архитектурные требования:

- [ ] **Разделение переиспользуемых и специфичных** компонентов
- [ ] **Отсутствие бизнес-логики** в UI компонентах
- [ ] **Композиция** вместо сложных prop drilling
- [ ] **Полиморфизм** для UI вариаций (Alert, Button, Badge)

#### Качественные требования:

- [ ] **Единственная ответственность** - один компонент = одна задача
- [ ] **Пропсы** ≤8 пропсов на компонент
- [ ] **Читаемость** - self-documenting код
- [ ] **Performance awareness** - оптимизация импортов и lazy loading
- [ ] **Accessibility basics** - базовые требования доступности

### 📋 Детальный чек-лист

#### Переиспользуемые UI компоненты (packages/ui):

```typescript
// ✅ Правильно - полиморфный Alert
const AlertVariants = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200'
} as const

interface AlertProps {
  variant?: keyof typeof AlertVariants
  children: React.ReactNode
  className?: string
  onDismiss?: () => void
}

export function Alert({ variant = 'info', children, className, onDismiss }: AlertProps) {
  return (
    <div className={cn(
      'flex items-center gap-3 p-4 rounded-lg border',
      AlertVariants[variant],
      className
    )}>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button onClick={onDismiss} className="text-current hover:opacity-70">
          <XIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

// ❌ Неправильно - жесткая привязка и бизнес-логика
export function Alert({ type, message, orderId }: Props) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Бизнес-логика в UI компоненте!
    if (type === 'order-success') {
      trackOrderCreation(orderId)
      sendAnalytics('order_success', { orderId })
    }
  }, [type, orderId])

  if (dismissed) return null

  return (
    <div className={type === 'error' ? 'bg-red-100' : 'bg-green-100'}>
      {message}
      <button onClick={() => setDismissed(true)}>×</button>
    </div>
  )
}
```

**Проверки:**

- [ ] Конфигурация через lookup tables
- [ ] Отсутствие бизнес-логики (API вызовы, analytics)
- [ ] Композиция через children/slots
- [ ] Строгая типизация пропсов
- [ ] **Bundle size awareness** - селективные импорты библиотек
- [ ] **Accessibility compliance** - кнопки, alt атрибуты, labels
- [ ] **Error boundaries** - критичные компоненты обернуты
- [ ] **SEO optimization** - правильные meta теги, структурированные данные
- [ ] **i18n readiness** - тексты вынесены в конфигурацию (при необходимости)

#### Специфичные компоненты (apps/web/src/components):

```typescript
// ✅ Правильно - композиция с business hooks
export function ExchangeForm() {
  const { formData, setFormData, calculateExchange, submitOrder } = useExchange()
  const { isValid } = useExchangeValidation(formData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return

    try {
      await submitOrder()
    } catch (error) {
      // Обработка ошибок через hook
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <CurrencySelect
        value={formData.fromCurrency}
        onChange={(currency) => setFormData({ ...formData, fromCurrency: currency })}
      />
      <AmountInput
        value={formData.fromAmount}
        onChange={(amount) => setFormData({ ...formData, fromAmount: amount })}
      />
      <Button type="submit" disabled={!isValid}>
        Создать заявку
      </Button>
    </form>
  )
}

// ❌ Неправильно - смешение всего в одном компоненте
export function ExchangeForm() {
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Прямые API вызовы в компоненте!
      const response = await fetch('/api/exchange/create', {
        method: 'POST',
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to create order')
      }

      // Analytics в компоненте!
      gtag('event', 'order_created', { value: formData.amount })

      // Toast в компоненте!
      toast.success('Заявка создана!')

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Огромная форма на 100+ строк */}
    </form>
  )
}
```

**Проверки:**

- [ ] Использование business hooks вместо прямого API
- [ ] Отсутствие состояния, дублирующего stores
- [ ] Декомпозиция на меньшие компоненты
- [ ] Обработка ошибок через hooks, не локально

#### Условная логика в UI:

```typescript
// ✅ Правильно - guard clauses и lookup tables
export function OrderStatus({ order }: Props) {
  if (!order) return <OrderNotFound />
  if (order.status === 'cancelled') return <CancelledOrder order={order} />

  const config = ORDER_STATUS_CONFIG[order.status]

  return (
    <div className="flex items-center gap-2">
      <Badge variant={config.color}>
        {config.label}
      </Badge>
      {config.canCancel && <CancelButton orderId={order.id} />}
    </div>
  )
}

// ❌ Неправильно - глубокая вложенность
export function OrderStatus({ order }: Props) {
  return (
    <div>
      {order ? (
        <div>
          {order.status === 'pending' ? (
            <div className="text-yellow-600">
              {order.canCancel ? (
                <div>
                  Ожидает подтверждения
                  <button>Отменить</button>
                </div>
              ) : (
                <div>Ожидает подтверждения</div>
              )}
            </div>
          ) : order.status === 'confirmed' ? (
            <div className="text-blue-600">Подтвержден</div>
          ) : (
            <div>Неизвестный статус</div>
          )}
        </div>
      ) : (
        <div>Заказ не найден</div>
      )}
    </div>
  )
}
```

**Проверки:**

- [ ] Guard clauses для ранних возвратов
- [ ] Конфигурация вместо hardcoded условий
- [ ] Максимум 2 уровня вложенности
- [ ] Отсутствие тернарных операторов в JSX (вынос в переменные)

### 🚨 Типичные нарушения

1. **Бизнес-логика в UI:**

   ```typescript
   // ❌
   export function ProductCard({ product }: Props) {
     useEffect(() => {
       // API вызов в компоненте!
       trackProductView(product.id);
       updateUserPreferences(product.category);
     }, [product.id]);
   }
   ```

2. **Слишком много пропсов:**

   ```typescript
   // ❌
   interface UserCardProps {
     user: User;
     showAvatar: boolean;
     showEmail: boolean;
     showPhone: boolean;
     showAddress: boolean;
     showOrders: boolean;
     showStats: boolean;
     onEdit: () => void;
     onDelete: () => void;
     onViewOrders: () => void;
     className?: string;
     // 10+ пропсов!
   }
   ```

3. **Дублирование state:**

   ```typescript
   // ❌
   export function UserProfile() {
     const [user, setUser] = useState(null); // Дублирование store!
     const { user: storeUser } = useUIStore(); // Используем централизованный store

     useEffect(() => {
       setUser(storeUser); // Синхронизация вручную!
   }
   ```

4. **Bundle size problems:**

   ```typescript
   // ❌
   import _ from 'lodash'; // Весь lodash!
   import * as Icons from 'lucide-react'; // 500+ иконок!

   // ✅
   import { debounce } from 'lodash-es';
   import { Search, User } from 'lucide-react';
   ```

5. **Accessibility issues:**

   ```typescript
   // ❌
   <div onClick={handleClick}>Click me</div>
   <img src="photo.jpg" />

   // ✅
   <button onClick={handleClick}>Click me</button>
   <img src="photo.jpg" alt="User profile" />
   ```

### 🔧 Методы анализа

1. **Поиск API вызовов:** fetch, axios, tRPC в компонентах
2. **Анализ пропсов:** количество параметров в интерфейсах
3. **Проверка вложенности:** уровни условных операторов
4. **DRY принцип:** отсутствие дублирования компонентов и логики
5. **Межуровневые зависимости:** правильное использование архитектурных слоев
6. **Bundle analysis:** поиск `import *` и массовых импортов
7. **A11y check:** проверка кнопок, изображений, форм на доступность

#### Архитектурная целостность:

- [ ] **Константы из уровня 1** - все статусы, лейблы берутся из `@repo/constants`
- [ ] **Утилиты из уровня 2** - форматирование, валидация используют централизованные функции
- [ ] **Хуки из уровня 4** - бизнес-логика инкапсулирована в business hooks
- [ ] **НЕТ прямого API** - компоненты НЕ должны напрямую использовать tRPC (только через хуки)
- [ ] **Отсутствие дублирования** - переиспользуемые компоненты в `@repo/ui`, специфичные логически разделены

#### SEO и производительность:

- [ ] **SEO compliance** - правильные meta tags, structured data, semantic HTML
- [ ] **Performance optimization** - lazy loading, code splitting, image optimization
- [ ] **Core Web Vitals** - LCP, FID, CLS метрики отслеживаются
- [ ] **i18n readiness** - подготовка к интернационализации (если планируется)

### 📈 Дополнительные проверки производительности

#### SEO проверки (если критично для проекта):

```typescript
// ✅ Правильно - SEO-дружественная структура
export function ProductPage({ product }: Props) {
  return (
    <>
      <Head>
        <title>{product.name} - Обмен криптовалют</title>
        <meta name="description" content={product.description} />
        <meta property="og:title" content={product.name} />
        <meta property="og:description" content={product.description} />
        <meta property="og:image" content={product.image} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description
          })}
        </script>
      </Head>

      <main>
        <h1>{product.name}</h1>
        <section>
          <h2>Описание</h2>
          <p>{product.description}</p>
        </section>
      </main>
    </>
  )
}

// ❌ Неправильно - плохая SEO структура
export function ProductPage({ product }: Props) {
  return (
    <div>
      <div className="title">{product.name}</div> {/* Не h1! */}
      <div>{product.description}</div> {/* Нет семантики! */}
      {/* Нет meta tags! */}
      {/* Нет structured data! */}
    </div>
  )
}
```

**SEO проверки:**

- [ ] Правильная структура заголовков (h1, h2, h3)
- [ ] Meta tags (title, description, og:tags)
- [ ] Structured data (JSON-LD)
- [ ] Семантические HTML элементы
- [ ] Alt атрибуты для изображений
- [ ] Canonical URLs

#### i18n readiness (если планируется интернационализация):

```typescript
// ✅ Правильно - подготовка к i18n
export function OrderStatus({ order }: Props) {
  // Все тексты вынесены в константы для будущего перевода
  const statusTexts = {
    [ORDER_STATUS.PENDING]: 'Ожидает подтверждения',
    [ORDER_STATUS.CONFIRMED]: 'Подтвержден',
    [ORDER_STATUS.SHIPPED]: 'Отправлен'
  }

  return (
    <div>
      <span>{statusTexts[order.status]}</span>
      <time dateTime={order.createdAt.toISOString()}>
        {order.createdAt.toLocaleDateString()}
      </time>
    </div>
  )
}

// ❌ Неправильно - hardcoded тексты
export function OrderStatus({ order }: Props) {
  return (
    <div>
      {order.status === 'pending' && <span>Ожидает подтверждения</span>}
      {order.status === 'confirmed' && <span>Подтвержден</span>}
      <span>{order.createdAt.toLocaleDateString('ru-RU')}</span> {/* Hardcoded locale! */}
    </div>
  )
}
```

**i18n проверки:**

- [ ] Все тексты вынесены в константы/конфигурацию
- [ ] Отсутствие hardcoded строк в JSX
- [ ] Правильное форматирование дат/чисел
- [ ] Подготовка к namespace'ам переводов
- [ ] Учет направления текста (LTR/RTL)

#### Продвинутые performance метрики:

```typescript
// ✅ Правильно - мониторинг производительности
import { getCLS, getFID, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(metric: any) {
  // Отправка метрик в аналитику
  if (metric.label === 'web-vital') {
    console.log(metric.name, metric.value);

    // Отправка в аналитику (если настроена)
    if (typeof gtag !== 'undefined') {
      gtag('event', metric.name, {
        value: Math.round(metric.value),
        event_label: metric.id,
        non_interaction: true,
      });
    }
  }
}

// В _app.tsx
export function reportWebVitals(metric: NextWebVitalsMetric) {
  // Мониторинг критических метрик
  const criticalMetrics = ['CLS', 'FID', 'LCP', 'TTFB'];

  if (criticalMetrics.includes(metric.name)) {
    console.log(`${metric.name}: ${metric.value}`);
  }
}
```

**Core Web Vitals проверки:**

- [ ] **LCP (Largest Contentful Paint)** - ≤2.5s
- [ ] **FID (First Input Delay)** - ≤100ms
- [ ] **CLS (Cumulative Layout Shift)** - ≤0.1
- [ ] **TTFB (Time to First Byte)** - ≤800ms
- [ ] Мониторинг настроен в production
- [ ] Alerts на критические значения метрик

---

## ⚙️ Уровень 6: Конфигурация и корневые файлы

**Файлы:** `package.json`, `eslint.config.mjs`, `tsconfig.json`, `turbo.json`, etc.

### 🔍 Критерии качества

#### Архитектурные требования:

- [ ] **Консистентность** версий зависимостей между пакетами
- [ ] **Безопасность** конфигурации - отсутствие чувствительных данных
- [ ] **Оптимизация** сборки и разработки
- [ ] **Масштабируемость** конфигурации под monorepo

#### Качественные требования:

- [ ] **Документированность** всех нестандартных настроек
- [ ] **Минимализм** - только необходимые зависимости
- [ ] **Обратная совместимость** с существующим кодом
- [ ] **Производительность** dev/build процессов
- [ ] **Bundle size monitoring** - отслеживание размера сборки

### 📋 Детальный чек-лист

#### package.json (root):

```json
// ✅ Правильно
{
  "name": "exchanger-front",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint && npm run lint:styles",
    "lint:styles": "stylelint \"**/*.{css,scss}\" --fix",
    "check-types": "turbo run check-types",
    "test": "turbo run test"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "devDependencies": {
    "turbo": "^1.13.0",
    "eslint": "^8.57.0"
  }
}

// ❌ Неправильно
{
  "scripts": {
    "dev": "next dev", // Не учитывает monorepo!
    "lint": "eslint .", // Не использует turbo!
    "custom-script": "some-command" // Недокументированный скрипт!
  },
  "dependencies": {
    "lodash": "^4.17.21", // Лишняя зависимость в root!
    "react": "^18.2.0" // Должно быть в workspace!
  }
}
```

**Проверки:**

- [ ] Все скрипты используют turbo для оркестрации
- [ ] Root содержит только dev-зависимости общего назначения
- [ ] Отсутствуют production зависимости в root
- [ ] Workspaces корректно настроены
- [ ] Scripts документированы или самоописывающиеся

#### ESLint конфигурация:

**Архитектура**: Централизованная с модульной структурой

```javascript
// ✅ Правильно - eslint.config.mjs (единственный конфиг)
import {
  FUNCTION_SIZE_LIMITS,
  COMPLEXITY_LIMITS
} from './packages/constants/dist/index.js';

import { lazyLoadConfig } from './packages/eslint-config/lazy-loading.js';

export default [
  {
    name: 'global-rules',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('global-rules', () => ({
      "max-lines-per-function": ["error", { max: FUNCTION_SIZE_LIMITS.BASE }],
      "complexity": ["error", COMPLEXITY_LIMITS.BASE],
      "max-depth": ["error", 2],
      "max-params": ["error", 4],
      "no-console": "error", // Строго запрещен
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/no-explicit-any": "error"
    }))
  },

  // Модульные конфигурации с lazy loading
  ...reactConfig,
  ...apiConfig,
  ...testingConfig,
  ...utilsConfig,

  // Архитектурные overrides
  {
    name: 'ui-components',
    files: ['packages/ui/**/*.{js,jsx,ts,tsx}'],
    rules: lazyLoadConfig('ui-rules', () => ({
      "max-lines-per-function": ["error", { max: FUNCTION_SIZE_LIMITS.UI_COMPONENTS }],
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "jsx-a11y/alt-text": "error"
    }))
  },

  {
    name: 'api-infrastructure',
    files: ['apps/web/src/server/trpc/**/*.ts'],
    rules: lazyLoadConfig('api-rules', () => ({
      "max-lines-per-function": ["error", { max: FUNCTION_SIZE_LIMITS.API_ENDPOINTS }],
      "complexity": ["error", COMPLEXITY_LIMITS.API_LAYER],
      "no-console": "off", // Разрешен для логирования
    }))
  }
];

// ❌ Неправильно - устаревшая архитектура
export default {
  rules: {
    // Слишком мягкие ограничения
    "max-lines-per-function": ["warn", 100], // Хардкод лимита!
    "@typescript-eslint/no-explicit-any": "off", // Отключен any!

    // Противоречивые правила
    "no-console": "off", // Разрешен console в production!
  }
}
```

**Проверки:**

- [ ] Единственный конфиг файл: `eslint.config.mjs` (root)
- [ ] Использование централизованных лимитов из `@repo/constants`
- [ ] Модульная структура в `packages/eslint-config/`
- [ ] Lazy loading для производительности
- [ ] Правила severity: `"error"` для критичных правил
- [ ] Архитектурные overrides для разных типов файлов
- [ ] Security правила включены (XSS, injection защита)
- [ ] React hooks и a11y правила настроены

#### TypeScript конфигурация:

```json
// ✅ Правильно - tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@repo/*": ["packages/*/src"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", ".next"]
}

// ❌ Неправильно
{
  "compilerOptions": {
    "strict": false, // Не строгий режим!
    "noImplicitAny": false, // any разрешен!
    "skipLibCheck": true // Пропуск проверки библиотек!
  }
}
```

**Проверки:**

- [ ] Строгий режим TypeScript включен
- [ ] Правильные paths для monorepo
- [ ] Исключены build директории
- [ ] Дополнительные строгие проверки включены

#### Turbo конфигурация:

```json
// ✅ Правильно - turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "check-types": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    }
  }
}

// ❌ Неправильно
{
  "pipeline": {
    "build": {}, // Нет зависимостей!
    "dev": { "cache": true }, // Кешируется dev!
    "test": { "dependsOn": [] } // Неправильные зависимости!
  }
}
```

**Проверки:**

- [ ] Правильные зависимости между задачами
- [ ] Кеширование настроено оптимально
- [ ] Outputs корректно указаны
- [ ] Persistent режим для dev задач

#### Husky + lint-staged:

```json
// ✅ Правильно - .lintstagedrc.json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix --max-warnings 0",
    "prettier --write"
  ],
  "*.{css,scss}": [
    "stylelint --fix",
    "prettier --write"
  ],
  "packages/constants/**/*.{ts,tsx}": [
    "npm run build --workspace=@repo/constants"
  ]
}

// ❌ Неправильно
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix" // Нет --max-warnings 0!
  ],
  "*.ts": [
    "tsc --noEmit" // Слишком медленно для pre-commit!
  ]
}
```

**Проверки:**

- [ ] Только staged файлы обрабатываются
- [ ] Быстрые проверки в lint-staged
- [ ] Медленные проверки в pre-commit hook
- [ ] Автофикс настроен корректно

#### Bundle size monitoring:

- [ ] **Webpack Bundle Analyzer** - регулярный анализ размера бандла
- [ ] **Performance budgets** - лимиты на размер чанков
- [ ] **Tree shaking** - неиспользуемый код исключается
- [ ] **Code splitting** - оптимальное разделение кода
- [ ] **Dependencies audit** - проверка размера зависимостей

#### Performance мониторинг:

```typescript
// ✅ Правильно - мониторинг производительности в конфигах
module.exports = {
  // Bundle analyzer
  webpack: (config, { isServer }) => {
    if (process.env.ANALYZE) {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }

    // Performance budgets
    config.performance = {
      maxAssetSize: 500000, // 500KB
      maxEntrypointSize: 500000,
      assetFilter: assetFilename => {
        return !assetFilename.endsWith('.map');
      },
    };

    return config;
  },

  // Performance settings
  experimental: {
    optimizePackageImports: ['lodash', 'date-fns'],
    bundlePagesRouterDependencies: true,
  },
};

// ❌ Неправильно - отсутствие мониторинга
module.exports = {
  // Нет bundle analyzer
  // Нет performance budgets
  // Нет оптимизации импортов
};
```

**Performance конфигурация:**

- [ ] Bundle analyzer настроен
- [ ] Performance budgets установлены
- [ ] Tree shaking работает корректно
- [ ] Оптимизация импортов библиотек
- [ ] Мониторинг размера dependency
- [ ] Lighthouse CI интеграция (если используется)

#### Дополнительные проверки:

```typescript
// ✅ Правильно - комплексный мониторинг
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build",
    "lighthouse": "lhci autorun",
    "bundle-size": "npx bundlesize",
    "perf:measure": "node scripts/performance-test.js"
  },

  // Bundle size limits
  "bundlesize": [
    {
      "path": "./dist/static/js/*.js",
      "maxSize": "500KB"
    },
    {
      "path": "./dist/static/css/*.css",
      "maxSize": "100KB"
    }
  ]
}
```

**Комплексный мониторинг:**

- [ ] **Bundle size CI** - проверка на PR
- [ ] **Lighthouse CI** - автоматические проверки производительности
- [ ] **Performance regression alerts** - уведомления о деградации
- [ ] **Real User Monitoring** - мониторинг реальных пользователей
- [ ] **Core Web Vitals dashboard** - дашборд с метриками

---

## 📊 Итоговая система оценки

### Критичность нарушений:

#### 🔴 **Критические (блокирующие):**

- Технический долг (TODO, FIXME, any, @ts-ignore)
- Безопасность (hardcoded секреты, отсутствие валидации)
- Архитектурные нарушения (неправильные зависимости между слоями)
- Дублирование констант/типов

#### 🟡 **Важные (требуют исправления):**

- Отсутствие централизации (локальные дубликаты)
- Смешение ответственности
- Производительность

#### 🔵 **Рекомендательные (code style):**

- Именование переменных
- Комментарии и документация
- Оптимизация imports
- Форматирование

### Методика оценки качества:

**Оценка файла = (Критические × 0) + (Важные × 0.7) + (Рекомендательные × 0.9)**

- **90-100%** - Отличное качество ✅
- **70-89%** - Хорошее качество ⚠️
- **50-69%** - Требует доработки 🔄
- **<50%** - Критическое состояние ❌

### Отчетность:

Каждый уровень анализируется отдельно с указанием:

- Количество проверенных файлов
- Обнаруженные нарушения по критичности
- Рекомендации по исправлению
- Общая оценка качества уровня

---

## 🎯 Итоговая интеграция: архитектурный анализ + принятие решений

### Объединенный алгоритм работы

**Шаг 1: Архитектурный анализ (из rule_2)**

1. Определить затрагиваемые архитектурные уровни
2. Сгруппировать код по логическим доменам (UNIVERSAL_AUDIT_SYSTEM.md)
3. Проанализировать каждую группу по критериям качества
4. Оценить межуровневые зависимости

**Шаг 2: Применение алгоритма принятия решений**

1. Для каждого компонента применить матрицу принятия решений
2. Использовать специфичные критерии для каждого уровня
3. Провести автоматизированные и ручные проверки
4. Зафиксировать решения с обоснованием

**Шаг 3: Контроль качества**

1. Проверить соблюдение архитектурных принципов
2. Убедиться в минимизации дублирования
3. Валидировать архитектурную целостность
4. Оценить метрики успешности

### Практическое применение

**Для любой задачи разработки:**

```typescript
interface TaskAnalysisWorkflow {
  // 1. Понимание задачи (rule_2)
  understanding: TaskUnderstanding;

  // 2. Архитектурный анализ (rule_2 + UNIVERSAL_AUDIT_SYSTEM)
  architecturalAnalysis: {
    affectedLevels: ArchitecturalLevel[];
    logicalGroups: LogicalGroup[];
    existingComponents: ComponentAnalysis[];
    qualityAssessment: QualityAssessment;
  };

  // 3. Принятие решений (CODE_REVIEW_PROTOCOLS)
  decisions: {
    reuseDecisions: ReuseDecision[];
    newComponentJustifications: Justification[];
    refactoringOpportunities: RefactoringOpportunity[];
    architecturalImpact: ArchitecturalImpact;
  };

  // 4. План реализации
  implementationPlan: {
    steps: ImplementationStep[];
    qualityGates: QualityGate[];
    integrationChecks: IntegrationCheck[];
    completionCriteria: CompletionCriteria;
  };
}

async function analyzeAndPlanTask(taskDescription: string): Promise<TaskAnalysisWorkflow> {
  // Реализация объединенного алгоритма
  const understanding = await analyzeTaskUnderstanding(taskDescription);
  const architecturalAnalysis = await performArchitecturalAnalysis(understanding);
  const decisions = await makeReuseDecisions(architecturalAnalysis);
  const plan = await createImplementationPlan(decisions);

  return {
    understanding,
    architecturalAnalysis,
    decisions,
    implementationPlan: plan,
  };
}
```

### Гарантии качества

**Архитектурная целостность:**

- ✅ Все решения основаны на анализе существующей архитектуры
- ✅ Новые компоненты не нарушают архитектурные принципы
- ✅ Межуровневые зависимости корректны
- ✅ Централизация соблюдена (правило 19)

**Качество кода:**

- ✅ Минимизировано дублирование (DRY принцип)
- ✅ Соблюдены SOLID принципы
- ✅ Код соответствует стандартам качества
- ✅ Техническй долг исключен (правило 13)

**Процессное качество:**

- ✅ Все решения документированы и обоснованы
- ✅ Применены критерии для каждого архитектурного уровня
- ✅ Проведены автоматизированные и ручные проверки
- ✅ Метрики успешности достигнуты

---

**Заключение:** Интеграция архитектурного анализа с алгоритмом принятия решений обеспечивает качественное и архитектурно обоснованное решение любых задач разработки с максимальным переиспользованием кода и минимизацией технического долга.
