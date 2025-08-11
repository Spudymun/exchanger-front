### Путь: apps/admin-panel/app/page.tsx

**Краткое назначение (1 предложение)**

Главная страница административной панели с dashboard функциональностью, статистикой и управлением пользователями.

**Подробное описание (3–6 предложений)**

Файл реализует комплексную админ панель с использованием compound component pattern через AdminPanel из UI библиотеки. Страница включает header с навигацией и темизацией, статистические карточки для мониторинга ключевых метрик, древовидную навигацию по разделам и полнофункциональную таблицу пользователей с возможностями поиска, сортировки и фильтрации. Использует mock данные из exchange-core для демонстрации функциональности и TypeScript типизацию для всех компонентов и интерфейсов. Архитектура основана на композиции мелких, специализированных компонентов с четким разделением ответственности. Включает placeholder функциональность для будущих возможностей как экспорт данных, детали пользователей и навигация по разделам.

**Экспортируемые сущности / API**

- `export default function AdminDashboard` — главный компонент административной панели
- Внутренние компоненты (не экспортируются):
  - `AdminHeader` — шапка панели с навигацией
  - `StatsCard` — карточка статистики
  - `NavigationTree` — древовидная навигация
  - `UsersTableNew` — таблица пользователей
  - `ActionButtons` — кнопки действий

**Входы (expected inputs) / Параметры**

- Компонент не принимает props — использует статические данные
- Mock данные:
  - `ADMIN_USERS_DATA: UITestUser[]` — тестовые пользователи
  - `ADMIN_COLUMNS: Column<UITestUser>[]` — конфигурация колонок таблицы
  - `ADMIN_TREE_DATA: TreeNode[]` — структура навигационного дерева

**Выходы / Побочные эффекты**

- Отображение полнофункциональной админ панели
- Console логирование user interactions (temporary implementation)
- Placeholder alerts для будущей функциональности
- Event handlers для navigation, user selection, export, user creation
- Интерактивные элементы: sorting, filtering, pagination в таблице

**Взаимосвязи (кто вызывает / что вызывает)**

Файлы, которые используют этот компонент:

- Next.js App Router автоматически рендерит page.tsx для `/admin` route
- Layout.tsx wraps этот компонент в admin панели

Файлы, которые импортируются здесь:

- `@repo/ui` — все UI компоненты (Card, Button, DataTable, TreeView, AdminPanel)
- `@repo/exchange-core` — createUITestUsers и типы для mock данных
- `@repo/constants` — UI константы
- `lucide-react` — иконки для статистики и UI элементов

**Домен данных / типы**

```typescript
// Props интерфейсы компонентов
interface AdminHeaderProps {
  userName?: string;
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Данные пользователей
interface UITestUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin: string;
}

// Навигационное дерево
interface TreeNode {
  id: string;
  label: string;
  children?: TreeNode[];
}

// Конфигурация таблицы
interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (item: T) => React.ReactNode;
}
```

**Риски и безопасность**

- **Mock data exposure**: Использование тестовых данных в production
- **Authentication missing**: Отсутствие проверки прав доступа к admin панели
- **Data security**: Потенциальное отображение sensitive пользовательских данных
- **Client-side rendering**: "use client" создает зависимости от browser APIs
- **Performance**: Большие таблицы данных могут замедлить рендеринг
- **State management**: Отсутствие persistent state для пользовательских настроек

**Тесты / рекомендации по покрытию**

- Unit тесты каждого sub-компонента (AdminHeader, StatsCard, etc.)
- Integration тесты взаимодействия между компонентами
- E2E тесты полного flow admin панели (navigation, filtering, sorting)
- Performance тесты с большими dataset'ами
- Accessibility тесты для screen readers и keyboard navigation
- Visual regression тесты для различных screen sizes

**Оценка сложности (low/medium/high)**

**medium** — комплексный dashboard с множественными интерактивными компонентами

**TODO / Рефакторинг**

- **PRIORITY 1**: Добавить аутентификацию и авторизацию для admin доступа
- **PRIORITY 2**: Заменить mock данные на реальные API интеграции
- Реализовать real navigation system для admin разделов
- Добавить real-time обновления статистики через WebSocket
- Внедрить state management (Zustand, Redux) для user preferences
- Реализовать export функциональность (CSV, Excel, PDF)
- Добавить advanced filtering и bulk operations для таблицы пользователей
- Внедрить notification system для admin actions
