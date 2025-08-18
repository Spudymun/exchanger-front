# 🚀 Руководство по миграции на Compound Components Pattern

**Дата создания:** 14 июля 2025  
**Версия:** 2.1 (**Performance Optimized**)  
**Статус:** ✅ Производственное руководство + Performance оптимизация завершена  
**Основано на:** Успешной миграции + Performance optimization всех compound components

---

## ✅ **PERFORMANCE OPTIMIZATION UPDATE - АВГУСТ 2025**

**СТАТУС:** ✅ **ВСЕ COMPOUND COMPONENTS ОПТИМИЗИРОВАНЫ**

Все compound components теперь используют `React.useMemo` для context values:

- ✅ **footer-compound.tsx** - Context value мемоизирован
- ✅ **data-table-compound.tsx** - Context с функциями стабилен
- ✅ **admin-panel-compound.tsx** - Context оптимизирован
- ✅ **exchange-form.tsx** - Критичный компонент оптимизирован
- ✅ **adaptive-container.tsx** - Стили кэшируются
- ✅ **ui/form.tsx** - Базовая инфраструктура оптимизирована

**ЭТАЛОННЫЙ ПАТТЕРН** (применен ко всем):

```tsx
const contextValue: ComponentContextValue = React.useMemo(
  () => ({
    // все свойства
  }),
  [
    /* все dependencies */
  ]
);
```

---

## 📋 **КРИТЕРИИ ДЛЯ МИГРАЦИИ**

### **🎯 ОБЯЗАТЕЛЬНАЯ МИГРАЦИЯ** - Компонент ДОЛЖЕН быть мигрирован если:

#### **1. Множественные связанные экспорты (Score: 10/10)**

```tsx
// ❌ ПРОБЛЕМА: Ручная композиция с множественными экспортами
export { Header, HeaderLogo, HeaderNavigation, HeaderActions, HeaderMobileMenu };

// ✅ РЕШЕНИЕ: Compound component
export const HeaderCompound = Object.assign(Header, {
  Logo,
  Navigation,
  Actions,
  MobileMenu,
});
```

#### **2. Prop drilling более 2 уровней (Score: 9/10)**

```tsx
// ❌ ПРОБЛЕМА: Передача props через несколько уровней
<Header>
  <HeaderActions>
    <HeaderLanguageSwitcher currentLocale={locale} onLocaleChange={onChange} />
    <HeaderUserMenu isAuthenticated={auth} onSignIn={signIn} onSignOut={signOut} />
  </HeaderActions>
</Header>

// ✅ РЕШЕНИЕ: Context API с auto-enhancement
<Header currentLocale={locale} isAuthenticated={auth} onLocaleChange={onChange}>
  <Header.Actions>
    <Header.LanguageSwitcher /> {/* Auto-enhanced из context */}
    <Header.UserMenu />         {/* Auto-enhanced из context */}
  </Header.Actions>
</Header>
```

#### **3. Дублирование состояния между компонентами (Score: 9/10)**

```tsx
// ❌ ПРОБЛЕМА: Дублирование state в родительском компоненте
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [currentLocale, setCurrentLocale] = useState('en');
const [isAuthenticated, setIsAuthenticated] = useState(false);

return (
  <Header>
    <HeaderMobileMenu isOpen={isMenuOpen} onToggle={setIsMenuOpen} />
    <HeaderLanguageSwitcher locale={currentLocale} onChange={setCurrentLocale} />
    <HeaderUserMenu authenticated={isAuthenticated} />
  </Header>
);

// ✅ РЕШЕНИЕ: Централизованное состояние в context
<Header
  isMenuOpen={isMenuOpen}
  currentLocale={currentLocale}
  isAuthenticated={isAuthenticated}
  onToggleMenu={() => setIsMenuOpen(!isMenuOpen)}
>
  <Header.MobileMenu /> {/* Auto-enhanced */}
  <Header.LanguageSwitcher /> {/* Auto-enhanced */}
  <Header.UserMenu /> {/* Auto-enhanced */}
</Header>;
```

#### **4. Сложная условная логика в композиции (Score: 8/10)**

```tsx
// ❌ ПРОБЛЕМА: Сложная условная композиция
{
  showLogo && <HeaderLogo />;
}
{
  navigation.length > 0 && <HeaderNavigation items={navigation} />;
}
{
  user ? (
    <HeaderUserMenu user={user} onSignOut={onSignOut} />
  ) : (
    <HeaderSignInButton onSignIn={onSignIn} />
  );
}

// ✅ РЕШЕНИЕ: Логика внутри compound components
<Header isAuthenticated={!!user} onSignIn={onSignIn} onSignOut={onSignOut}>
  {showLogo && <Header.Logo />}
  {navigation.length > 0 && <Header.Navigation />}
  <Header.UserMenu /> {/* Внутренняя логика аутентификации */}
</Header>;
```

### **🔄 РЕКОМЕНДУЕМАЯ МИГРАЦИЯ** - Компонент СТОИТ мигрировать если:

#### **1. Более 5 дочерних компонентов (Score: 7/10)**

```tsx
// ❌ ХОРОШО, но можно лучше
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableFooter,
  TablePagination,
  TableFilters,
  TableActions,
};

// ✅ ЛУЧШЕ: Compound pattern
export const TableCompound = Object.assign(Table, {
  Header,
  Body,
  Row,
  Cell,
  Footer,
  Pagination,
  Filters,
  Actions,
});
```

#### **2. Общие props между компонентами (Score: 6/10)**

```tsx
// ❌ ДУБЛИРОВАНИЕ: Одинаковые props в разных компонентах
<DataTable data={data} loading={loading}>
  <TableFilters data={data} loading={loading} />
  <TablePagination data={data} loading={loading} />
</DataTable>

// ✅ РЕШЕНИЕ: Общий context
<DataTable data={data} loading={loading}>
  <DataTable.Filters />    {/* Auto-enhanced */}
  <DataTable.Pagination /> {/* Auto-enhanced */}
</DataTable>
```

### **⚪ НЕОБЯЗАТЕЛЬНАЯ МИГРАЦИЯ** - Компонент МОЖНО НЕ мигрировать если:

#### **1. Простые независимые компоненты (Score: 3/10)**

```tsx
// ✅ НОРМАЛЬНО: Простые компоненты без связей
export const Button = ({ children, ...props }) => <button {...props}>{children}</button>;

export const Input = ({ ...props }) => <input {...props} />;
```

#### **2. Единичные экспорты без композиции (Score: 2/10)**

```tsx
// ✅ НОРМАЛЬНО: Одиночный компонент
export const LoadingSpinner = () => <div className="spinner">Loading...</div>;
```

---

## 🔧 **ПОШАГОВОЕ РУКОВОДСТВО ПО МИГРАЦИИ**

### **Шаг 1: Анализ существующего компонента**

#### **Аудит компонента:**

```typescript
// Пример анализа Header компонента
interface ComponentAudit {
  name: string;
  exports: string[]; // ['Header', 'HeaderLogo', 'HeaderNavigation', ...]
  propDrilling: number; // Уровни prop drilling (0-5)
  sharedProps: string[]; // ['currentLocale', 'isAuthenticated', ...]
  conditionalLogic: boolean; // Есть ли сложная условная логика
  migrationScore: number; // 1-10 (10 = обязательная миграция)
}

const headerAudit: ComponentAudit = {
  name: 'Header',
  exports: ['Header', 'HeaderLogo', 'HeaderNavigation', 'HeaderActions', 'HeaderMobileMenu'],
  propDrilling: 3, // props передаются через 3 уровня
  sharedProps: ['currentLocale', 'isAuthenticated', 'onLocaleChange', 'onSignIn'],
  conditionalLogic: true, // Сложная логика аутентификации
  migrationScore: 9, // ОБЯЗАТЕЛЬНАЯ миграция
};
```

### **Шаг 2: Создание Context API**

```tsx
// 1. Определяем типы для Context
export interface HeaderContextValue {
  // Состояние
  isMenuOpen?: boolean;
  currentLocale?: string;
  isAuthenticated?: boolean;
  userName?: string;

  // Колбеки
  onToggleMenu?: () => void;
  onLocaleChange?: (locale: string) => void;
  onSignIn?: () => void;
  onSignOut?: () => void;
}

// 2. Создаем Context
const HeaderContext = React.createContext<HeaderContextValue | undefined>(undefined);

// 3. Создаем хук для использования Context
export const useHeaderContext = () => {
  return React.useContext(HeaderContext);
};
```

### **Шаг 3: Переработка Root компонента**

```tsx
// Root компонент с Context Provider
export interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  // Все props из Context
  isMenuOpen?: boolean;
  currentLocale?: string;
  isAuthenticated?: boolean;
  userName?: string;
  onToggleMenu?: () => void;
  onLocaleChange?: (locale: string) => void;
  onSignIn?: () => void;
  onSignOut?: () => void;

  // Стандартные props
  children: React.ReactNode;
}

const Header = React.forwardRef<HTMLElement, HeaderProps>(
  (
    {
      className,
      children,
      // Context props
      isMenuOpen,
      currentLocale,
      isAuthenticated,
      userName,
      onToggleMenu,
      onLocaleChange,
      onSignIn,
      onSignOut,
      ...props
    },
    ref
  ) => {
    // Создаем context value
    const contextValue: HeaderContextValue = {
      isMenuOpen,
      currentLocale,
      isAuthenticated,
      userName,
      onToggleMenu,
      onLocaleChange,
      onSignIn,
      onSignOut,
    };

    return (
      <HeaderContext.Provider value={contextValue}>
        <header ref={ref} className={cn('header-styles', className)} {...props}>
          {children}
        </header>
      </HeaderContext.Provider>
    );
  }
);
```

### **Шаг 4: Создание дочерних компонентов**

```tsx
// Простой дочерний компонент
const Logo = React.forwardRef<HTMLDivElement, LogoProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('logo-styles', className)} {...props}>
      {children}
    </div>
  )
);

// Дочерний компонент с использованием Context
const LanguageSwitcher = React.forwardRef<HTMLDivElement, LanguageSwitcherProps>(
  ({ className, children, ...props }, ref) => {
    const context = useHeaderContext();
    const currentLocale = context?.currentLocale ?? 'en';

    return (
      <div ref={ref} className={cn('language-switcher-styles', className)} {...props}>
        {children || (
          <>
            <Button
              variant={currentLocale === 'en' ? 'default' : 'ghost'}
              onClick={() => context?.onLocaleChange?.('en')}
            >
              EN
            </Button>
            <Button
              variant={currentLocale === 'ru' ? 'default' : 'ghost'}
              onClick={() => context?.onLocaleChange?.('ru')}
            >
              RU
            </Button>
          </>
        )}
      </div>
    );
  }
);
```

### **Шаг 5: Создание автоматического enhancement**

```tsx
// Функции для автоматического добавления props
function addLocaleProps(
  props: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (context?.currentLocale && !childProps.currentLocale) {
    props.currentLocale = context.currentLocale;
  }
  if (context?.onLocaleChange && !childProps.onLocaleChange) {
    props.onLocaleChange = context.onLocaleChange;
  }
}

function addAuthProps(
  props: Record<string, unknown>,
  context: HeaderContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (context?.isAuthenticated !== undefined && !childProps.isAuthenticated) {
    props.isAuthenticated = context.isAuthenticated;
  }
  if (context?.onSignIn && !childProps.onSignIn) {
    props.onSignIn = context.onSignIn;
  }
  if (context?.onSignOut && !childProps.onSignOut) {
    props.onSignOut = context.onSignOut;
  }
}

// Основная функция enhancement
function enhanceChildWithContext(child: React.ReactNode, context: HeaderContextValue | undefined) {
  if (!React.isValidElement(child)) {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps: Record<string, unknown> = {};

  // Добавляем props по категориям
  addLocaleProps(enhancedProps, context, childProps);
  addAuthProps(enhancedProps, context, childProps);

  // Клонируем child с новыми props
  return React.cloneElement(child, enhancedProps);
}

// Компонент-контейнер с enhancement
const Actions = React.forwardRef<HTMLDivElement, ActionsProps>(
  ({ className, children, ...props }, ref) => {
    const context = useHeaderContext();

    // Автоматически добавляем props дочерним компонентам
    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildWithContext(child, context)
    );

    return (
      <div ref={ref} className={cn('actions-styles', className)} {...props}>
        {enhancedChildren}
      </div>
    );
  }
);
```

### **Шаг 6: Создание Compound экспорта**

```tsx
// Compound component с Object.assign
export const HeaderCompound = Object.assign(Header, {
  Container,
  Logo,
  Navigation,
  Actions,
  MobileMenu,
  LanguageSwitcher,
  UserMenu,
  WithTheme,
});

// Индивидуальные экспорты
export {
  Header as HeaderRoot,
  Container as HeaderContainer,
  Logo as HeaderLogo,
  Navigation as HeaderNavigation,
  Actions as HeaderActions,
  MobileMenu as HeaderMobileMenu,
  LanguageSwitcher as HeaderLanguageSwitcher,
  UserMenu as HeaderUserMenu,
  WithTheme as HeaderWithTheme,
};

// Default export
export default HeaderCompound;
```

### **Шаг 7: Обновление index.ts**

```tsx
// packages/ui/src/components/index.ts

// Compound components как основные экспорты
export { HeaderCompound as Header } from './header-compound';
export { FooterCompound as Footer } from './footer-compound';
export { ExchangeFormCompound as ExchangeForm } from './exchange-form';

// Legacy экспорты для backward compatibility
export {
  Header as HeaderLegacy,
  HeaderLogo as HeaderLogoLegacy,
  HeaderNavigation as HeaderNavigationLegacy,
  // ... остальные legacy экспорты
} from './header-legacy';

// Типы
export type {
  HeaderContextValue,
  HeaderProps,
  LogoProps,
  NavigationProps,
} from './header-compound';
```

---

## 📊 **ПРИМЕРЫ МИГРАЦИИ ПО СЛОЖНОСТИ**

### **🟢 Простая миграция (Footer)**

**До:**

```tsx
// 5 связанных экспортов, простая композиция
export { Footer, FooterSection, FooterLink, FooterSocial, FooterLegal };

// Использование
<Footer>
  <FooterSection title="Company">
    <FooterLink href="/about">About</FooterLink>
  </FooterSection>
  <FooterLegal />
</Footer>;
```

**После:**

```tsx
// Compound component
export const FooterCompound = Object.assign(Footer, {
  Section,
  Link,
  Social,
  Legal,
  CompanyInfo,
});

// Использование с context
<Footer companyName="ExchangeGO">
  <Footer.Section title="Company">
    <Footer.Link href="/about">About</Footer.Link>
  </Footer.Section>
  <Footer.Legal /> {/* Auto-enhanced с companyName */}
</Footer>;
```

### **🟡 Средняя миграция (DataTable)**

**До:**

```tsx
// Множественные props, состояние, фильтрация
export { DataTable, TableHeader, TableBody, TableRow, TableCell, TablePagination };

// Сложное использование с prop drilling
<DataTable data={data} loading={loading} sortBy={sortBy} onSort={onSort}>
  <TableHeader sortBy={sortBy} onSort={onSort} />
  <TableBody data={data} loading={loading} />
  <TablePagination data={data} loading={loading} page={page} onPageChange={onPageChange} />
</DataTable>;
```

**После:**

```tsx
// Compound с Context для всех props
export const DataTableCompound = Object.assign(DataTable, {
  Header,
  Body,
  Row,
  Cell,
  Pagination,
  Filters,
});

// Простое использование
<DataTable data={data} loading={loading} sortBy={sortBy} onSort={onSort} page={page}>
  <DataTable.Header /> {/* Auto-enhanced */}
  <DataTable.Body /> {/* Auto-enhanced */}
  <DataTable.Pagination /> {/* Auto-enhanced */}
</DataTable>;
```

### **🔴 Сложная миграция (AdminPanel)**

**До:**

```tsx
// Множественные состояния, сложная логика, условная композиция
export {
  AdminPanel,
  AdminSidebar,
  AdminHeader,
  AdminContent,
  AdminNavigation,
  AdminUserMenu,
  AdminThemeToggle,
};

// Очень сложное использование
const [sidebarOpen, setSidebarOpen] = useState(false);
const [currentUser, setCurrentUser] = useState(null);
const [theme, setTheme] = useState('light');

<AdminPanel>
  <AdminSidebar
    isOpen={sidebarOpen}
    onToggle={() => setSidebarOpen(!sidebarOpen)}
    user={currentUser}
  >
    <AdminNavigation user={currentUser} />
  </AdminSidebar>
  <AdminHeader user={currentUser} theme={theme}>
    <AdminUserMenu user={currentUser} onSignOut={() => setCurrentUser(null)} />
    <AdminThemeToggle theme={theme} onThemeChange={setTheme} />
  </AdminHeader>
  <AdminContent />
</AdminPanel>;
```

**После:**

```tsx
// Compound с мощным Context
export const AdminPanelCompound = Object.assign(AdminPanel, {
  Sidebar,
  Header,
  Content,
  Navigation,
  UserMenu,
  ThemeToggle,
});

// Значительно упрощенное использование
<AdminPanel
  sidebarOpen={sidebarOpen}
  onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
  currentUser={currentUser}
  theme={theme}
  onThemeChange={setTheme}
  onSignOut={() => setCurrentUser(null)}
>
  <AdminPanel.Sidebar>
    <AdminPanel.Navigation /> {/* Auto-enhanced */}
  </AdminPanel.Sidebar>
  <AdminPanel.Header>
    <AdminPanel.UserMenu /> {/* Auto-enhanced */}
    <AdminPanel.ThemeToggle /> {/* Auto-enhanced */}
  </AdminPanel.Header>
  <AdminPanel.Content />
</AdminPanel>;
```

---

## ✅ **ЧЕКЛИСТ КАЧЕСТВА МИГРАЦИИ**

### **Обязательные требования:**

- [ ] **Context API**: Создан context с полным типизированием
- [ ] **useContext Hook**: Создан хук для удобного доступа к context
- [ ] **React.cloneElement**: Реализован автоматический enhancement дочерних компонентов
- [ ] **Object.assign**: Compound component создан через Object.assign
- [ ] **Backward Compatibility**: Legacy экспорты сохранены с суффиксом "Legacy"
- [ ] **TypeScript**: Полное типизирование всех интерфейсов
- [ ] **forwardRef**: Все компоненты поддерживают ref forwarding
- [ ] **displayName**: Установлены правильные displayName для всех компонентов

### **Качественные требования:**

- [ ] **ESLint Compliance**: Все файлы проходят ESLint без ошибок
- [ ] **Function Complexity**: Все функции менее 50 строк (ESLint rule)
- [ ] **Props Enhancement**: Автоматическое добавление props через context
- [ ] **Conditional Logic**: Внутренняя логика вынесена в компоненты
- [ ] **Default Values**: Правильные default значения для всех optional props
- [ ] **Accessibility**: ARIA атрибуты и semantic HTML
- [ ] **Performance**: Минимальные ре-рендеры, стабильные context values

### **Архитектурные требования:**

- [ ] **Pattern Consistency**: Следует тому же паттерну что ExchangeForm
- [ ] **Export Strategy**: Compound как primary, legacy как fallback
- [ ] **Documentation**: Полная документация с примерами
- [ ] **Migration Path**: Четкий путь миграции для пользователей
- [ ] **No Breaking Changes**: Существующий код продолжает работать

---

## 🎯 **МЕТРИКИ УСПЕШНОЙ МИГРАЦИИ**

### **Количественные метрики:**

| Метрика                      | До миграции | После миграции | Цель      |
| ---------------------------- | ----------- | -------------- | --------- |
| **Строки кода в композиции** | 50-100+     | 20-30          | -60%      |
| **Количество props**         | 10-20+      | 3-5            | -70%      |
| **Уровни prop drilling**     | 3-5         | 0-1            | -90%      |
| **Дублирование состояния**   | Высокое     | Минимальное    | -80%      |
| **Bundle size**              | Baseline    | +5-10%         | Допустимо |

### **Качественные метрики:**

| Критерий                 | Оценка | Описание                          |
| ------------------------ | ------ | --------------------------------- |
| **Developer Experience** | 9.5/10 | Значительно упрощенная композиция |
| **Type Safety**          | 10/10  | Полное типизирование TypeScript   |
| **Maintainability**      | 9/10   | Централизованная логика           |
| **Reusability**          | 9/10   | Гибкая композиция                 |
| **Performance**          | 8.5/10 | Минимальный оверхед Context API   |

---

## 🚨 **ЧАСТЫЕ ОШИБКИ И ИХ ИЗБЕЖАНИЕ**

### **❌ Ошибка 1: Неправильное использование React.cloneElement**

```tsx
// ❌ НЕПРАВИЛЬНО: Клонирование всех детей
const enhancedChildren = React.Children.map(
  children,
  child => React.cloneElement(child, contextValue) // Перезаписывает все props!
);

// ✅ ПРАВИЛЬНО: Селективное добавление props
const enhancedChildren = React.Children.map(children, child => {
  if (!React.isValidElement(child)) return child;

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps: Record<string, unknown> = {};

  // Добавляем только отсутствующие props
  if (context?.currentLocale && !childProps.currentLocale) {
    enhancedProps.currentLocale = context.currentLocale;
  }

  return React.cloneElement(child, enhancedProps);
});
```

### **❌ Ошибка 2: Нестабильные context values**

```tsx
// ❌ НЕПРАВИЛЬНО: Новый объект каждый рендер
const Header = ({ isAuthenticated, onSignIn }) => {
  return (
    <HeaderContext.Provider value={{ isAuthenticated, onSignIn }}>
      {children}
    </HeaderContext.Provider>
  );
};

// ✅ ПРАВИЛЬНО: Стабильный context value
const Header = ({ isAuthenticated, onSignIn }) => {
  const contextValue = useMemo(
    () => ({
      isAuthenticated,
      onSignIn,
    }),
    [isAuthenticated, onSignIn]
  );

  return <HeaderContext.Provider value={contextValue}>{children}</HeaderContext.Provider>;
};
```

### **❌ Ошибка 3: Нарушение backward compatibility**

```tsx
// ❌ НЕПРАВИЛЬНО: Удаление старых экспортов
export { HeaderCompound as Header }; // Breaking change!

// ✅ ПРАВИЛЬНО: Dual export strategy
export { HeaderCompound as Header }; // Новый primary
export { Header as HeaderLegacy }; // Старый fallback
export { HeaderLogo as HeaderLogoLegacy }; // Legacy компоненты
```

---

## 🎉 **ЗАКЛЮЧЕНИЕ**

Compound Components Pattern v2.0 предоставляет:

1. **🎯 Четкие критерии** для определения необходимости миграции
2. **📋 Пошаговое руководство** для выполнения миграции
3. **💡 Практические примеры** разной сложности
4. **✅ Чеклист качества** для проверки результата
5. **🚨 Предотвращение ошибок** через best practices

**Результат:** Унифицированная архитектура UI компонентов с улучшенным developer experience, maintainability и type safety при сохранении backward compatibility.

**Следующие шаги:** Использовать это руководство для миграции оставшихся компонентов и поддержания архитектурной консистентности в проекте.
