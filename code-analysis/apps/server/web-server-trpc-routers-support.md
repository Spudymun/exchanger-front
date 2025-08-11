### Путь: apps/web/src/server/trpc/routers/support.ts

**Краткое назначение (1 предложение)**

tRPC роутер для функций службы поддержки включая работу с тикетами, базой знаний и консультацией клиентов.

**Подробное описание (3–6 предложений)**

Роутер реализует полнофункциональную систему технической поддержки с доступом только для пользователей с ролью SUPPORT через middleware `supportOnly`. Включает поиск по базе знаний с фильтрацией по категориям и тегам, полный жизненный цикл управления тикетами от создания до закрытия с системой приоритетов и статусов. Система предоставляет детальную информацию о пользователях для качественной консультации включая историю заявок, статистику активности и объемы операций. Все тикеты включают систему сообщений для ведения переписки и трекинга изменений статусов. Реализована статистика работы саппорта для мониторинга производительности и качества обслуживания клиентов.

**Экспортируемые сущности / API**

- `export const supportRouter` — композитный роутер с процедурами:
  - `searchKnowledge` — поиск в базе знаний по запросу, категории с лимитом результатов
  - `createTicket` — создание тикета для пользователя с приоритетом и категорией
  - `getTickets` — получение тикетов с фильтрацией по статусу и приоритету
  - `updateTicketStatus` — обновление статуса тикета с комментарием
  - `getUserInfo` — детальная информация о пользователе для консультации
  - `getMyStats` — статистика работы текущего support агента

**Входы (expected inputs) / Параметры**

- `searchKnowledge`: `{ query: string, category?: string, limit?: number }` — поиск в базе знаний
- `createTicket`: `{ userId: string, subject: string, description: string, priority: Priority, category: string }`
- `getTickets`: `{ status?: TicketStatus, priority?: Priority, limit?: number }` — фильтры тикетов
- `updateTicketStatus`: `{ ticketId: string, status: TicketStatus, comment?: string }`
- `getUserInfo`: `{ userId: string }` — ID пользователя для консультации
- `getMyStats`: без параметров

**Выходы / Побочные эффекты**

- Создание и обновление тикетов в in-memory store
- Добавление сообщений в историю тикетов при изменении статусов
- Console логирование всех операций с тикетами для аудита
- Возврат агрегированной информации о пользователях с безопасными данными
- Статистические расчеты по объемам работы support агентов
- Фильтрация и сортировка результатов поиска

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые импортируют этот файл:

- `./index.ts` — композиция в главный appRouter
- Support панели через `trpc.support.*` вызовы
- Help desk и CRM интерфейсы

Файлы, которые импортируются здесь:

- `@repo/constants` — статусы тикетов, временные константы, UI константы
- `@repo/exchange-core` — менеджеры пользователей и заявок
- `@repo/utils` — валидационные схемы, фабрики ошибок
- `../init` — createTRPCRouter для композиции
- `../middleware/auth` — supportOnly middleware для защиты доступа

**Домен данных / типы**

```typescript
// Статья базы знаний
interface KnowledgeBaseArticle {
  id: string;
  category: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: Date;
}

// Тикет поддержки
interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: string;
  status: TicketStatus;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  messages: TicketMessage[];
}

// Информация о пользователе для консультации
interface UserConsultationInfo {
  user: SafeUserData;
  stats: {
    totalOrders: number;
    completedOrders: number;
    totalVolume: number;
    registrationDays: number;
  };
  recentOrders: Order[];
}
```

**Риски и безопасность**

- **Data exposure**: Доступ к персональным данным и финансовой истории клиентов
- **In-memory storage**: Потеря тикетов при перезапуске сервера (не production ready)
- **Authorization critical**: Middleware должен корректно ограничивать доступ
- **PII handling**: Работа с персональными данными требует соблюдения GDPR/CCPA
- **Message history**: Чувствительная информация в переписке может быть раскрыта
- **Performance**: Поиск по базе знаний без индексов может быть медленным

**Тесты / рекомендации по покрытию**

- Unit тесты каждой процедуры с различными ролями доступа
- Integration тесты полного lifecycle тикетов
- Search тесты базы знаний с различными запросами и фильтрами
- Edge case тесты: несуществующие пользователи, некорректные тикеты
- Security тесты попыток доступа без support роли
- Performance тесты с большими объемами тикетов и пользователей

**Оценка сложности (low/medium/high)**

**medium** — комплексная система управления поддержкой с множественными интеграциями

**TODO / Рефакторинг**

- **PRIORITY 1**: Заменить in-memory storage на persistent базу данных
- **PRIORITY 2**: Интеграция с real-time уведомлениями (WebSocket, email)
- Добавить поиск с полнотекстовыми индексами (Elasticsearch)
- Реализовать SLA трекинг и автоматические эскалации
- Добавить категоризацию и автоматическое присвоение тикетов
- Внедрить систему рейтингов и feedback от клиентов
- Добавить интеграцию с внешними CRM системами
