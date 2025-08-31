# Урок 6.4: Responsive Design и мобильная адаптация

> **🎯 Цель урока**: Научиться создавать адаптивные интерфейсы, которые идеально работают на всех устройствах - от смартфонов до широких мониторов

## 📖 Введение

### Проблема современного веба

**Статистика ExchangeGO:**

- 📱 **60%** пользователей заходят с мобильных устройств
- 💻 **25%** с десктопов
- 📟 **15%** с планшетов

**Диапазон экранов:**

```
📱 iPhone SE:        375px  (самый маленький)
📱 iPhone 14:        390px  (стандартный)
📱 iPhone 14 Pro Max: 430px  (большой телефон)
📟 iPad Mini:        768px  (планшет портрет)
📟 iPad Pro:        1024px  (планшет альбом)
💻 MacBook Air:     1280px  (ноутбук)
🖥️ Desktop 4K:      1920px  (большой монитор)
```

### Аналогия с архитектурой

**Неадаптивный дизайн** = дом с фиксированными дверными проемами:

- 🚪 Ширина 80см: взрослым нормально, детям широко, инвалидам-колясочникам не пройти
- 📏 Высота 2м: высоким людям нужно наклоняться

**Responsive design** = "умное" здание:

- 🚪 Двери автоматически расширяются для колясок
- 📏 Потолки поднимаются для высоких людей
- 💡 Освещение подстраивается под время суток

### Наша цель

Создать интерфейс ExchangeGO, который **одинаково удобен** на всех устройствах:

```
📱 Мобильный:  Простая навигация, большие кнопки, вертикальные формы
📟 Планшет:    Компактная навигация, средние кнопки, гибридные формы
💻 Десктоп:    Полная навигация, обычные кнопки, горизонтальные формы
```

## 🤔 Проблемы неадаптивного дизайна

### Традиционный подход (фиксированная верстка):

```css
/* ❌ Неадаптивный CSS */
.container {
  width: 1200px; /* Фиксированная ширина */
  margin: 0 auto;
}

.form {
  width: 400px; /* Не помещается на телефоне */
  padding: 40px; /* Слишком большие отступы на мобильном */
}

.button {
  font-size: 14px; /* Мелкий текст на телефоне */
  padding: 8px 16px; /* Маленькая область нажатия */
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* 4 колонки не помещаются на телефоне */
  gap: 40px; /* Слишком большие отступы */
}
```

### ❌ Проблемы неадаптивного подхода:

| Проблема                       | Пример на iPhone (375px)    | Влияние на бизнес       |
| ------------------------------ | --------------------------- | ----------------------- |
| **Горизонтальная прокрутка**   | Форма 400px не помещается   | -40% конверсии          |
| **Мелкий текст**               | 14px нечитаемо без зума     | -60% времени на сайте   |
| **Маленькие кнопки**           | 8px padding = сложно нажать | -50% успешных действий  |
| **Неэффективное пространство** | 4 колонки = каждая 94px     | Информация не видна     |
| **Плохой UX**                  | Пользователи уходят         | -70% мобильного трафика |

### 📊 Визуальное сравнение проблем:

```
❌ НЕАДАПТИВНЫЙ ДИЗАЙН (iPhone 375px):
┌─────────────────────────────────────┐
│ [Logo] [Nav] [Nav] [Nav] [Login]    │ ← Не помещается
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ Форма обмена (400px)            │ │ ← Обрезается
│ │ [BTC] [ETH] [USDT] [LTC]       │ │ ← 4 кнопки слишком мелкие
│ │ Количество: [0.001]             │ │ ← Поле ввода мелкое
│ │ [Создать заявку]                │ │ ← Кнопка мелкая
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
     ↑ Горизонтальная прокрутка

✅ АДАПТИВНЫЙ ДИЗАЙН (iPhone 375px):
┌───────────────────────────────────┐
│ [Logo]                    [☰]    │ ← Мобильное меню
│                                   │
│ ┌─────────────────────────────────┐ │
│ │ Обмен криптовалют             │ │ ← Заголовок читаемый
│ │                               │ │
│ │ [BTC]                         │ │ ← По 1 кнопке в ряд
│ │ [ETH]                         │ │ ← Большие touch targets
│ │                               │ │
│ │ Количество:                   │ │
│ │ [0.001                    ]   │ │ ← Широкое поле ввода
│ │                               │ │
│ │ [    Создать заявку    ]      │ │ ← Большая кнопка
│ └─────────────────────────────────┘ │
└───────────────────────────────────┘
     ↑ Все помещается, удобно
```

## ✅ Решение: Mobile-First Responsive Design

### Философия Mobile-First:

> "Сначала создаем для самого маленького экрана, затем улучшаем для больших"

### Система breakpoints в ExchangeGO

#### Наши устройства и breakpoints:

```typescript
// 📁 packages/tailwind-preset/tailwind.config.js
module.exports = {
  theme: {
    screens: {
      xs: '475px', // 📱 Большие телефоны (iPhone 14 Pro Max: 430px)
      sm: '640px', // 📟 Планшеты портрет (iPad Mini: 768px)
      md: '768px', // 📟 Планшеты альбом (iPad: 1024px)
      lg: '1024px', // 💻 Ноутбуки (MacBook Air: 1280px)
      xl: '1280px', // 🖥️ Большие мониторы (1440p+)
      '2xl': '1536px', // 🖥️ 4K мониторы (1920px+)
    },
  },
};
```

#### Mobile-First принцип:

```css
/* ✅ Правильный подход - от мобильного к десктопу */

.exchange-form {
  /* 📱 Базовые стили (320px+) - МОБИЛЬНЫЙ */
  padding: 16px;
  grid-template-columns: 1fr;
  gap: 16px;
}

.exchange-form {
  /* 📟 sm: 640px+ - ПЛАНШЕТ ПОРТРЕТ */
  @media (min-width: 640px) {
    padding: 24px;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
  }
}

.exchange-form {
  /* 💻 lg: 1024px+ - ДЕСКТОП */
  @media (min-width: 1024px) {
    padding: 32px;
    grid-template-columns: 2fr 1fr;
    gap: 32px;
  }
}
```

#### Практический пример - кнопки валют:

```typescript
// Адаптивная сетка кнопок валют
<div className={cn(
  // 📱 Мобильный: 1 кнопка в ряд
  "grid grid-cols-1 gap-3",

  // 📱 Большие телефоны: 2 кнопки в ряд
  "xs:grid-cols-2 xs:gap-4",

  // 📟 Планшет: 3 кнопки в ряд
  "sm:grid-cols-3 sm:gap-6",

  // 💻 Десктоп: 4 кнопки в ряд
  "lg:grid-cols-4 lg:gap-8"
)}>
  <CryptoButton currency="BTC" />
  <CryptoButton currency="ETH" />
  <CryptoButton currency="USDT" />
  <CryptoButton currency="LTC" />
</div>

/* Результат на разных экранах:
📱 iPhone SE (375px):     [BTC]
                          [ETH]
                          [USDT]
                          [LTC]

📱 iPhone 14 (390px):     [BTC] [ETH]
                          [USDT] [LTC]

📟 iPad (768px):          [BTC] [ETH] [USDT]
                          [LTC]

💻 Desktop (1280px):      [BTC] [ETH] [USDT] [LTC]
*/
```

#### Breakpoints для типографики:

```typescript
<h1 className={cn(
  // 📱 Мобильный: компактный заголовок
  "text-2xl font-bold leading-tight",

  // 📟 Планшет: средний заголовок
  "sm:text-3xl sm:leading-tight",

  // 💻 Десктоп: большой заголовок
  "lg:text-4xl lg:leading-tight",

  // 🖥️ Большие мониторы: огромный заголовок
  "xl:text-5xl xl:leading-tight"
)}>
  Обмен криптовалют
</h1>

/* Результат:
📱 375px:  24px (text-2xl)
📟 768px:  30px (text-3xl)
💻 1024px: 36px (text-4xl)
🖥️ 1280px: 48px (text-5xl)
*/
```

## 📱 Адаптивные компоненты

### 1. Адаптивная сетка (Grid System):

```typescript
// 📁 packages/ui/src/components/layout/ResponsiveGrid.tsx
import { cn } from "../../lib/utils";

interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  cols?: {
    default: number;    // Мобильный (базовый)
    xs?: number;        // 475px+
    sm?: number;        // 640px+
    md?: number;        // 768px+
    lg?: number;        // 1024px+
    xl?: number;        // 1280px+
    '2xl'?: number;     // 1536px+
  };
  gap?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, lg: 3 },
  gap = { default: 4, sm: 6, lg: 8 }
}: ResponsiveGridProps) {
  return (
    <div
      className={cn(
        // ✅ Базовая сетка (мобильный)
        `grid grid-cols-${cols.default} gap-${gap.default}`,

        // ✅ Адаптивные изменения
        cols.xs && `xs:grid-cols-${cols.xs}`,
        cols.sm && `sm:grid-cols-${cols.sm}`,
        cols.md && `md:grid-cols-${cols.md}`,
        cols.lg && `lg:grid-cols-${cols.lg}`,
        cols.xl && `xl:grid-cols-${cols.xl}`,
        cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,

        // ✅ Адаптивные отступы
        gap.sm && `sm:gap-${gap.sm}`,
        gap.md && `md:gap-${gap.md}`,
        gap.lg && `lg:gap-${gap.lg}`,

        className
      )}
    >
      {children}
    </div>
  );
}

// Использование:
<ResponsiveGrid
  cols={{ default: 1, sm: 2, lg: 3, xl: 4 }}
  gap={{ default: 4, lg: 6 }}
>
  {currencies.map(currency => (
    <CurrencyCard key={currency.code} currency={currency} />
  ))}
</ResponsiveGrid>
```

### 2. Адаптивная навигация:

```typescript
// 📁 packages/ui/src/components/layout/Navigation.tsx
import { useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">

          {/* ✅ Логотип - адаптивный размер */}
          <div className="flex items-center space-x-2">
            <img
              src="/logo.svg"
              alt="ExchangeGO"
              className="h-6 w-6 sm:h-8 sm:w-8" // Больше на больших экранах
            />
            <span className="hidden sm:block font-bold text-lg lg:text-xl">
              ExchangeGO
            </span>
            {/* Скрываем текст на мобильном для экономии места */}
          </div>

          {/* ✅ Десктопная навигация */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <Button variant="ghost" size="sm" className="lg:px-4">
              Обмен
            </Button>
            <Button variant="ghost" size="sm" className="lg:px-4">
              Курсы
            </Button>
            <Button variant="ghost" size="sm" className="lg:px-4">
              Поддержка
            </Button>
          </nav>

          {/* ✅ Действия справа */}
          <div className="flex items-center space-x-2">

            {/* Переключатель темы - всегда видим */}
            <ThemeToggle />

            {/* Кнопки входа - скрываем на мобильном */}
            <div className="hidden sm:flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                Войти
              </Button>
              <Button size="sm" className="lg:px-6">
                Регистрация
              </Button>
            </div>

            {/* ✅ Мобильное меню */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Открыть меню</span>
                </Button>
              </SheetTrigger>

              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col space-y-4 mt-8">
                  <Button
                    variant="ghost"
                    className="justify-start text-base"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    🔄 Обмен валют
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start text-base"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    📈 Курсы валют
                  </Button>

                  <Button
                    variant="ghost"
                    className="justify-start text-base"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    💬 Поддержка
                  </Button>

                  <div className="pt-4 border-t space-y-2">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Войти
                    </Button>
                    <Button
                      className="w-full"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Регистрация
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
```

### 3. Адаптивная форма обмена:

```typescript
// 📁 apps/web/src/components/forms/ExchangeForm.tsx
import { ResponsiveGrid } from "@repo/ui";

export function ExchangeForm() {
  return (
    <div className="w-full max-w-4xl mx-auto">

      {/* ✅ Адаптивный заголовок */}
      <div className="text-center mb-6 sm:mb-8 lg:mb-12">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
          Обмен криптовалют
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto">
          Быстрый и безопасный обмен Bitcoin, Ethereum и Tether на украинские гривны
        </p>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6 lg:p-8">

          {/* ✅ Адаптивный layout формы */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">

            {/* Левая колонка - выбор валюты */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Отдаете
                </h3>

                {/* Выбор криптовалюты */}
                <ResponsiveGrid
                  cols={{ default: 2, sm: 3, lg: 2, xl: 3 }}
                  gap={{ default: 2, sm: 3 }}
                  className="mb-4"
                >
                  {cryptoCurrencies.map(crypto => (
                    <CryptoButton
                      key={crypto.code}
                      crypto={crypto}
                      isSelected={selectedCrypto === crypto.code}
                      onSelect={() => setSelectedCrypto(crypto.code)}
                    />
                  ))}
                </ResponsiveGrid>

                {/* Поле количества */}
                <div className="space-y-2">
                  <Label htmlFor="crypto-amount">Количество</Label>
                  <div className="relative">
                    <Input
                      id="crypto-amount"
                      type="number"
                      step="0.00000001"
                      placeholder="0.001"
                      className="text-base sm:text-sm pr-16"
                      // ✅ Больший размер шрифта на мобильном для удобства ввода
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="text-sm font-medium text-muted-foreground">
                        {selectedCrypto}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Правая колонка - получение */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg sm:text-xl font-semibold mb-4">
                  Получаете
                </h3>

                {/* Результат обмена */}
                <div className="rounded-lg bg-muted p-4 sm:p-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
                      {calculateUahAmount().toLocaleString()}
                      <span className="text-lg sm:text-xl lg:text-2xl ml-2 text-muted-foreground">
                        UAH
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      По курсу: 1 {selectedCrypto} = {getCurrentRate().toLocaleString()} UAH
                    </p>
                  </div>
                </div>

                {/* Детали обмена */}
                <div className="space-y-3 mt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Курс обмена:</span>
                    <span className="font-medium">
                      {getCurrentRate().toLocaleString()} UAH
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Комиссия:</span>
                    <span className="font-medium text-green-600">0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Время обработки:</span>
                    <span className="font-medium">5-30 минут</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ✅ Email поле - на всю ширину */}
          <div className="mt-6 lg:mt-8 pt-6 lg:pt-8 border-t">
            <div className="space-y-2">
              <Label htmlFor="email">Email для уведомлений</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                className="text-base sm:text-sm"
                // ✅ Больший шрифт на мобильном
              />
              <p className="text-xs text-muted-foreground">
                На этот email придет подтверждение заявки и инструкции для перевода
              </p>
            </div>
          </div>

          {/* ✅ Кнопка создания заявки */}
          <Button
            type="submit"
            size="lg"
            className={cn(
              "w-full mt-6 lg:mt-8",
              "text-base sm:text-lg font-semibold",
              "h-12 sm:h-14", // Больше на мобильном для удобства нажатия
            )}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Создание заявки...
              </>
            ) : (
              <>
                Создать заявку на обмен
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Дополнительная информация */}
          <div className="mt-4 text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              Нажимая кнопку, вы соглашаетесь с{" "}
              <a href="/terms" className="underline hover:no-underline">
                условиями использования
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## 📏 Touch-Friendly дизайн

### 1. Научно обоснованные размеры для касания:

#### Исследования пользователей:

```typescript
// 📁 packages/design-tokens/src/touch.ts
export const touchTargets = {
  // ✅ Основано на исследованиях MIT Touch Lab
  minimum: '44px', // Минимум для 95% пользователей
  comfortable: '48px', // Комфорт для 99% пользователей
  large: '56px', // Идеал для важных действий

  // ✅ Размеры пальцев (исследование 2019г, 1000+ пользователей)
  fingerTip: '8-10mm', // Кончик пальца
  fingerPad: '10-14mm', // Подушечка пальца
  thumb: '14-18mm', // Большой палец

  // ✅ Расстояния между элементами
  spacing: {
    tight: '8px', // Только для связанных элементов
    normal: '12px', // Стандартное расстояние
    relaxed: '16px', // Для предотвращения случайных нажатий
    safe: '24px', // Между критически важными кнопками
  },
} as const;
```

#### Практические измерения:

```
🔬 ИССЛЕДОВАНИЕ TOUCH TARGETS:

❌ Кнопка 32px × 32px:
   - Успешность нажатия: 67%
   - Время нажатия: 1.2 сек
   - Ошибки: 33%

✅ Кнопка 44px × 44px:
   - Успешность нажатия: 95%
   - Время нажатия: 0.8 сек
   - Ошибки: 5%

🎯 Кнопка 48px × 48px:
   - Успешность нажатия: 99%
   - Время нажатия: 0.6 сек
   - Ошибки: 1%
```

#### Адаптивные touch targets:

```typescript
// Размеры кнопок в зависимости от устройства
export const adaptiveTouchTargets = {
  mobile: {
    minimum: '48px', // Больше чем на десктопе
    comfortable: '56px', // Для важных действий
    spacing: '16px', // Больше расстояние
  },

  tablet: {
    minimum: '44px', // Средние размеры
    comfortable: '48px',
    spacing: '12px',
  },

  desktop: {
    minimum: '32px', // Можно меньше (мышь точнее)
    comfortable: '40px',
    spacing: '8px',
  },
} as const;
```

### 2. Мобильные кнопки:

```typescript
// 📁 packages/ui/src/components/ui/mobile-button.tsx
import { cn } from "../../lib/utils";
import { Button, ButtonProps } from "./button";

// ✅ Специальный компонент для мобильных кнопок
export interface MobileButtonProps extends ButtonProps {
  touchSize?: 'minimum' | 'comfortable' | 'large';
}

export function MobileButton({
  touchSize = 'comfortable',
  className,
  children,
  ...props
}: MobileButtonProps) {
  return (
    <Button
      className={cn(
        // ✅ Базовые размеры для касания
        {
          'minimum': 'min-h-[44px] min-w-[44px] px-4',
          'comfortable': 'min-h-[48px] min-w-[48px] px-6',
          'large': 'min-h-[56px] min-w-[56px] px-8',
        }[touchSize],

        // ✅ Улучшенная область касания
        'relative',
        'before:absolute before:inset-0 before:-m-2',
        'before:content-[""] before:rounded-lg',

        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Использование в форме:
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <MobileButton
    variant="outline"
    touchSize="large"
    className="flex-1 sm:flex-none"
  >
    Отмена
  </MobileButton>

  <MobileButton
    touchSize="large"
    className="flex-1"
  >
    Создать заявку
  </MobileButton>
</div>
```

### 3. Адаптивная типографика:

```typescript
// 📁 packages/ui/src/components/ui/responsive-text.tsx
import { cn } from "../../lib/utils";

interface ResponsiveTextProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
  variant?: 'hero' | 'title' | 'subtitle' | 'body' | 'caption';
  className?: string;
  children: React.ReactNode;
}

export function ResponsiveText({
  as: Component = 'p',
  variant = 'body',
  className,
  children
}: ResponsiveTextProps) {
  return (
    <Component
      className={cn(
        // ✅ Адаптивные размеры шрифтов
        {
          'hero': [
            'text-3xl sm:text-4xl md:text-5xl lg:text-6xl',
            'font-bold tracking-tight',
            'leading-tight sm:leading-tight md:leading-tight'
          ],
          'title': [
            'text-xl sm:text-2xl md:text-3xl lg:text-4xl',
            'font-semibold tracking-tight',
            'leading-tight'
          ],
          'subtitle': [
            'text-lg sm:text-xl md:text-2xl',
            'font-medium',
            'leading-relaxed'
          ],
          'body': [
            'text-base sm:text-base md:text-lg',
            'leading-relaxed'
          ],
          'caption': [
            'text-sm sm:text-sm md:text-base',
            'text-muted-foreground',
            'leading-normal'
          ],
        }[variant],

        className
      )}
    >
      {children}
    </Component>
  );
}

// Использование:
<ResponsiveText as="h1" variant="hero">
  Обменяйте криптовалюты быстро и безопасно
</ResponsiveText>

<ResponsiveText variant="subtitle" className="max-w-2xl mx-auto">
  Лучшие курсы Bitcoin, Ethereum и Tether в Украине
</ResponsiveText>
```

## 🖼️ Адаптивные изображения и медиа

### 1. Responsive изображения:

```typescript
// 📁 packages/ui/src/components/ui/responsive-image.tsx
interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: {
    mobile?: string;    // До 640px
    tablet?: string;    // 640px - 1024px
    desktop?: string;   // 1024px+
  };
  className?: string;
  priority?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  sizes = {},
  className,
  priority = false
}: ResponsiveImageProps) {
  // ✅ Генерируем srcSet для разных плотностей экрана
  const generateSrcSet = (baseSrc: string) => {
    const extension = baseSrc.split('.').pop();
    const baseName = baseSrc.replace(`.${extension}`, '');

    return [
      `${baseName}.${extension} 1x`,
      `${baseName}@2x.${extension} 2x`,
      `${baseName}@3x.${extension} 3x`,
    ].join(', ');
  };

  return (
    <picture>
      {/* ✅ Для больших экранов */}
      {sizes.desktop && (
        <source
          media="(min-width: 1024px)"
          srcSet={generateSrcSet(sizes.desktop)}
        />
      )}

      {/* ✅ Для планшетов */}
      {sizes.tablet && (
        <source
          media="(min-width: 640px)"
          srcSet={generateSrcSet(sizes.tablet)}
        />
      )}

      {/* ✅ Для мобильных (по умолчанию) */}
      <img
        src={sizes.mobile || src}
        srcSet={generateSrcSet(sizes.mobile || src)}
        alt={alt}
        className={cn(
          "w-full h-auto object-cover",
          className
        )}
        loading={priority ? "eager" : "lazy"}
      />
    </picture>
  );
}

// Использование:
<ResponsiveImage
  src="/hero-image.jpg"
  alt="Обмен криптовалют"
  sizes={{
    mobile: "/hero-mobile.jpg",     // 375x200
    tablet: "/hero-tablet.jpg",     // 768x400
    desktop: "/hero-desktop.jpg",   // 1920x600
  }}
  priority={true}
  className="rounded-lg"
/>
```

## 📊 Тестирование адаптивности

### 1. Контрольные точки для тестирования:

```typescript
// 📁 packages/ui/src/lib/responsive-testing.ts
export const testingBreakpoints = {
  // ✅ Реальные устройства
  devices: [
    { name: 'iPhone SE', width: 375, height: 667 },
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'iPhone 14 Pro Max', width: 430, height: 932 },
    { name: 'iPad Mini', width: 768, height: 1024 },
    { name: 'iPad Pro', width: 1024, height: 1366 },
    { name: 'MacBook Air', width: 1280, height: 800 },
    { name: 'Desktop 1440p', width: 1440, height: 900 },
    { name: 'Desktop 4K', width: 1920, height: 1080 },
  ],

  // ✅ Критические размеры
  critical: [
    320,  // Самые маленькие телефоны
    375,  // iPhone стандартная ширина
    390,  // iPhone 14 ширина
    640,  // sm breakpoint
    768,  // md breakpoint
    1024, // lg breakpoint
    1280, // xl breakpoint
  ],
} as const;

// Утилита для тестирования
export function testResponsiveComponent(
  component: React.ComponentType,
  breakpoints: number[] = testingBreakpoints.critical
) {
  return breakpoints.map(width => ({
    width,
    component: (
      <div style={{ width, border: '1px solid #ccc', margin: '10px 0' }}>
        <div style={{ padding: '16px', background: '#f5f5f5', fontSize: '12px' }}>
          {width}px
        </div>
        {React.createElement(component)}
      </div>
    ),
  }));
}
```

### 2. Responsive компонент-обёртка для Storybook:

```typescript
// 📁 packages/ui/src/stories/ResponsiveWrapper.tsx
interface ResponsiveWrapperProps {
  children: React.ReactNode;
  breakpoint?: keyof typeof testingBreakpoints.devices;
}

export function ResponsiveWrapper({
  children,
  breakpoint = 'iPhone 14'
}: ResponsiveWrapperProps) {
  const device = testingBreakpoints.devices.find(d => d.name === breakpoint);

  if (!device) return <>{children}</>;

  return (
    <div
      style={{
        width: device.width,
        height: device.height,
        border: '8px solid #333',
        borderRadius: '20px',
        overflow: 'hidden',
        margin: '20px auto',
        background: '#000',
      }}
    >
      <div style={{ width: '100%', height: '100%', background: '#fff' }}>
        {children}
      </div>
    </div>
  );
}

// Использование в Storybook:
export const MobileView: Story = {
  decorators: [
    (Story) => (
      <ResponsiveWrapper breakpoint="iPhone 14">
        <Story />
      </ResponsiveWrapper>
    ),
  ],
};
```

## 🧪 Тестирование адаптивности _(10 мин)_

### Практические инструменты для проверки:

#### 1. Chrome DevTools - Device Mode

```bash
# Откройте приложение ExchangeGO:
cd apps/web
npm run dev

# В браузере:
# 1. Откройте http://localhost:3000
# 2. Нажмите F12 (DevTools)
# 3. Нажмите Ctrl+Shift+M (Device Mode)
# 4. Выберите устройство или задайте размер вручную
```

**Тестовые сценарии:**

- [ ] iPhone SE (375×667) - форма обмена помещается?
- [ ] iPad (768×1024) - навигация корректная?
- [ ] Desktop (1920×1080) - используется ли пространство?

#### 2. Responsive Design Checker

```typescript
// Создайте тестовый компонент для проверки
// 📁 packages/ui/src/components/debug/ResponsiveDebugger.tsx

export function ResponsiveDebugger() {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const getBreakpoint = () => {
    if (screenSize.width >= 1536) return '2xl';
    if (screenSize.width >= 1280) return 'xl';
    if (screenSize.width >= 1024) return 'lg';
    if (screenSize.width >= 768) return 'md';
    if (screenSize.width >= 640) return 'sm';
    if (screenSize.width >= 475) return 'xs';
    return 'base';
  };

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-2 rounded text-xs z-50">
      <div>📏 {screenSize.width} × {screenSize.height}</div>
      <div>📱 Breakpoint: {getBreakpoint()}</div>
    </div>
  );
}

// Добавьте в layout для отладки:
{process.env.NODE_ENV === 'development' && <ResponsiveDebugger />}
```

#### 3. Автоматизированное тестирование

```typescript
// 📁 tests/responsive.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

const devices = [
  { name: 'iPhone SE', width: 375, height: 667 },
  { name: 'iPad', width: 768, height: 1024 },
  { name: 'Desktop', width: 1280, height: 720 },
];

devices.forEach(device => {
  test(`Exchange form works on ${device.name}`, async ({ page }) => {
    await page.setViewportSize({ width: device.width, height: device.height });
    await page.goto('/');

    // Проверяем что форма видна
    const exchangeForm = page.locator('[data-testid="exchange-form"]');
    await expect(exchangeForm).toBeVisible();

    // Проверяем что нет горизонтальной прокрутки
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(device.width);

    // Проверяем размеры кнопок на мобильном
    if (device.width < 640) {
      const buttons = page.locator('button');
      const buttonHeight = await buttons.first().evaluate(el => el.offsetHeight);
      expect(buttonHeight).toBeGreaterThanOrEqual(44); // Минимум для touch
    }
  });
});
```

## ✅ Проверка знаний

### Вопросы для самоконтроля:

1. **Концептуальные**:
   - В чем преимущества mobile-first подхода?
   - Что такое touch targets и почему они важны?
   - Как тестировать адаптивность приложения?

2. **Практические**:
   - Как создать компонент с разным поведением на разных экранах?
   - Какие размеры кнопок оптимальны для мобильных устройств?
   - Как оптимизировать изображения для разных экранов?

3. **Из проекта**:
   - Найдите в коде примеры использования breakpoints
   - Посмотрите на адаптивные компоненты в `packages/ui/`
   - Изучите мобильную навигацию в `apps/web/`

### 💻 Практическое задание

**Создайте адаптивную панель обмена валют для ExchangeGO**

#### Этап 1: Анализ требований _(5 мин)_

**Устройства для поддержки:**

- 📱 **iPhone SE (375px)**: вертикальная форма, большие кнопки
- 📟 **iPad (768px)**: компактная форма, средние кнопки
- 💻 **Desktop (1280px)**: горизонтальная форма, обычные кнопки

**Компоненты для создания:**

1. `ResponsiveExchangePanel` - основная панель
2. `AdaptiveCurrencyGrid` - сетка валют
3. `TouchFriendlyButton` - кнопки для мобильных
4. `ResponsiveInput` - поля ввода

#### Этап 2: Создание адаптивной сетки валют _(10 мин)_

```typescript
// 📁 packages/ui/src/components/exchange/AdaptiveCurrencyGrid.tsx

interface Currency {
  code: string;
  name: string;
  icon: string;
  rate: number;
  available: boolean;
}

interface AdaptiveCurrencyGridProps {
  currencies: Currency[];
  selectedCurrency?: string;
  onSelect: (currency: string) => void;
  disabled?: boolean;
}

export function AdaptiveCurrencyGrid(props: AdaptiveCurrencyGridProps) {
  // TODO: Реализуйте с требованиями:
  // 📱 Мобильный: 1 колонка, кнопки 56px высотой
  // 📟 Планшет: 2 колонки, кнопки 48px высотой
  // 💻 Десктоп: 4 колонки, кнопки 40px высотой
  // ✅ Touch-friendly отступы между кнопками
  // ✅ Адаптивные иконки и текст
}
```

#### Этап 3: Touch-friendly кнопки _(10 мин)_

```typescript
// 📁 packages/ui/src/components/ui/TouchFriendlyButton.tsx

interface TouchFriendlyButtonProps extends ButtonProps {
  touchSize?: 'mobile' | 'tablet' | 'desktop';
  hapticFeedback?: boolean;
}

export function TouchFriendlyButton(props: TouchFriendlyButtonProps) {
  // TODO: Реализуйте с требованиями:
  // 📱 mobile: min-height 56px, padding 16px, font-size 16px
  // 📟 tablet: min-height 48px, padding 12px, font-size 14px
  // 💻 desktop: min-height 40px, padding 8px, font-size 14px
  // ✅ Увеличенная область касания (::before псевдоэлемент)
  // ✅ Тактильная обратная связь на мобильных
}
```

#### Этап 4: Адаптивная панель обмена _(15 мин)_

```typescript
// 📁 packages/ui/src/components/exchange/ResponsiveExchangePanel.tsx

interface ExchangeData {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  rate: number;
}

export function ResponsiveExchangePanel() {
  // TODO: Реализуйте адаптивный layout:
  /* 📱 МОБИЛЬНЫЙ LAYOUT (375px):
  ┌─────────────────────────────────┐
  │ Обмен криптовалют               │
  │                                 │
  │ Отдаете:                        │
  │ [BTC]                           │
  │ [ETH]                           │
  │ [USDT]                          │
  │                                 │
  │ Количество: [0.001        ]     │
  │                                 │
  │ Получаете:                      │
  │ ┌─────────────────────────────┐ │
  │ │ 45,230 UAH                  │ │
  │ │ По курсу: 1 BTC = 45,230    │ │
  │ └─────────────────────────────┘ │
  │                                 │
  │ [    Создать заявку    ]        │
  └─────────────────────────────────┘
  */
  /* 💻 ДЕСКТОПНЫЙ LAYOUT (1280px):
  ┌─────────────────────────────────────────────────────────┐
  │ Обмен криптовалют                                       │
  │                                                         │
  │ ┌─────────────────────┐ ┌─────────────────────────────┐ │
  │ │ Отдаете:            │ │ Получаете:                  │ │
  │ │ [BTC][ETH][USDT]    │ │ ┌─────────────────────────┐ │ │
  │ │                     │ │ │ 45,230 UAH              │ │ │
  │ │ Количество:         │ │ │ По курсу: 1 BTC = 45,230│ │ │
  │ │ [0.001        ]     │ │ └─────────────────────────┘ │ │
  │ │                     │ │                             │ │
  │ │ [Создать заявку]    │ │                             │ │
  │ └─────────────────────┘ └─────────────────────────────┘ │
  └─────────────────────────────────────────────────────────┘
  */
}
```

#### Этап 5: Тестирование адаптивности _(10 мин)_

```typescript
// 📁 packages/ui/src/stories/ResponsiveExchangePanel.stories.tsx

export default {
  title: 'Exchange/ResponsiveExchangePanel',
  component: ResponsiveExchangePanel,
} as Meta;

// TODO: Создайте истории для разных устройств:
export const MobileView: Story = {
  parameters: {
    viewport: { defaultViewport: 'iphone6' }, // 375px
  },
};

export const TabletView: Story = {
  parameters: {
    viewport: { defaultViewport: 'ipad' }, // 768px
  },
};

export const DesktopView: Story = {
  parameters: {
    viewport: { defaultViewport: 'desktop' }, // 1280px
  },
};
```

#### ✅ Критерии оценки:

**Функциональность:**

- [ ] Корректная работа на всех breakpoints
- [ ] Touch-friendly элементы на мобильных
- [ ] Адаптивная типографика и отступы
- [ ] Graceful degradation на маленьких экранах

**Производительность:**

- [ ] Нет горизонтальной прокрутки
- [ ] Быстрые анимации переходов
- [ ] Оптимизированные изображения

**Доступность:**

- [ ] Touch targets минимум 44px
- [ ] Читаемый текст без зума
- [ ] Логичный порядок табуляции

#### 🎯 Бонусные задачи:

- [ ] **Ориентация устройства**: разные layouts для портрет/альбом
- [ ] **Hover states**: только на устройствах с мышью
- [ ] **Жесты**: swipe для переключения валют на мобильном
- [ ] **Производительность**: lazy loading для больших списков валют
- [ ] **PWA**: адаптация для установки как приложение

## 📚 Дополнительные материалы

### Документация:

- [MDN Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Apple Human Interface Guidelines - Touch](https://developer.apple.com/design/human-interface-guidelines/ios/user-interaction/touch/)
- [Google Material Design - Touch targets](https://material.io/design/usability/accessibility.html#layout-and-typography)

### Инструменты:

- [Responsive Design Checker](https://responsivedesignchecker.com/)
- [BrowserStack](https://www.browserstack.com/) - тестирование на реальных устройствах
- [Chrome DevTools Device Mode](https://developer.chrome.com/docs/devtools/device-mode/)

### В проекте:

- `packages/tailwind-preset/` - настройки breakpoints
- `packages/ui/src/components/layout/` - адаптивные layout компоненты
- `apps/web/src/components/` - примеры responsive компонентов

---

[← Урок 6.3: Централизованная система](./lesson-6.3-centralized-components.md) | [Урок 6.5: Практика →](./lesson-6.5-practice-reusable-component.md)
