# 🎨 Design System Inconsistencies Report

**Дата анализа:** 31 августа 2025  
**Анализируемые файлы:** Существующие страницы в apps/web/app/[locale]/  
**Базовая дизайн-система:** @repo/ui, @repo/design-tokens, @repo/tailwind-preset

## 📊 Executive Summary

Обнаружены **критические нарушения принципа DRY** и несоответствия дизайн-системе между существующими страницами. Необходима централизация общих паттернов и устранение дублирования стилей.

## 🔍 Detailed Analysis

### 1. 🏠 Page Layout Patterns - ДУБЛИРОВАНИЕ

#### **apps/web/app/[locale]/exchange/page.tsx:**

```typescript
<main role="main" className="exchange-page min-h-screen bg-background">
  <div className="container mx-auto px-4 py-8 lg:py-12">
```

#### **Проблемы:**

- ❌ **Хардкод стилей:** `min-h-screen bg-background` дублируется
- ❌ **Хардкод контейнера:** `container mx-auto px-4 py-8 lg:py-12` - одинаковый паттерн
- ❌ **Класс страницы:** `exchange-page` - не используется в стилях, только как идентификатор

#### **✅ Существующее решение в @repo/ui:**

```typescript
// packages/ui/src/lib/shared-styles.ts
layoutStyles.fullHeight: 'min-h-screen'
layoutStyles.container: 'container mx-auto py-8'
```

### 2. 📱 Responsive Breakpoints - НЕСОГЛАСОВАННОСТЬ

#### **Найденные паттерны:**

- `lg:py-12` - используется в exchange/page.tsx
- `px-4` - хардкод padding вместо использования design tokens

#### **✅ Официальные брейкпоинты из @repo/design-tokens:**

```javascript
screens: {
  sm: '640px', // Mobile landscape
  md: '768px', // Tablet
  lg: '1024px', // Desktop
  xl: '1280px', // Large desktop
  '2xl': '1536px', // Extra large desktop
}
```

#### **Проблемы:**

- ❌ **Непоследовательность:** Разные страницы используют разные responsive паттерны
- ❌ **Хардкод значений:** `px-4`, `py-8`, `lg:py-12` вместо semantic spacing

### 3. 🎯 Typography Inconsistencies

#### **Заголовки страниц - ДУБЛИРОВАНИЕ СТИЛЕЙ:**

**Найденные паттерны:**

- `text-2xl font-bold mb-8` - часто используется для заголовков страниц
- Отсутствие использования `pageStyles.title.page` из shared-styles

#### **✅ Централизованное решение существует:**

```typescript
// packages/ui/src/lib/shared-styles.ts
pageStyles.title.page: 'text-4xl font-bold mb-2'
pageStyles.title.section: 'text-2xl font-bold'
```

#### **4.2 PageLayout Components - ОТСУТСТВУЮТ**

**Проблема:** Каждая страница дублирует layout структуру:

```typescript
<main role="main" className="[page-name] min-h-screen bg-background">
  <div className="container mx-auto px-4 py-8 lg:py-12">
    <h1 className="text-2xl font-bold mb-8">
```

**✅ Решение:** Создать универсальный PageLayout компонент

### 5. 🎨 CSS Variables Usage - НЕПОЛНОЕ ИСПОЛЬЗОВАНИЕ

#### **Проблемы:**

- ✅ **Корректно:** Все страницы используют semantic CSS переменные: `bg-background`, `text-foreground`
- ❌ **Некорректно:** Прямое использование Tailwind классов вместо shared-styles
- ❌ **Некорректно:** Дублирование spacing patterns

#### **Centralized CSS Architecture Status:**

- ✅ **Правильно импортируется:** `@import '@repo/tailwind-preset/globals.css'` во всех apps
- ✅ **CSS переменные работают:** theme switching функционирует корректно
- ❌ **Недоиспользуется:** shared-styles.ts не используется в страницах

## 📋 Recommended Actions

### **Immediate (Critical):**

1. **🏗️ Создать PageLayout компонент** в @repo/ui:

   ```typescript
   export function PageLayout({
     children,
     title,
     className
   }: PageLayoutProps) {
     return (
       <main role="main" className={combineStyles(layoutStyles.fullHeight, 'bg-background', className)}>
         <div className={layoutStyles.container}>
           {title && <h1 className={pageStyles.title.page}>{title}</h1>}
           {children}
         </div>
       </main>
     );
   }
   ```

2. **📏 Стандартизировать responsive patterns:**
   - Создать responsive utilities в shared-styles
   - Определить standard spacing patterns
   - Убрать хардкод значения

### **Medium Priority:**

4. **🎨 Расширить shared-styles.ts:**
   - Добавить pageLayoutStyles
   - Добавить responsivePatterns
   - Добавить spacingPatterns

5. **📚 Создать Page Components pattern:**
   - StandardPageLayout
   - DashboardPageLayout
   - AuthPageLayout

### **Long-term:**

6. **🔄 Миграция существующих страниц:**
   - Постепенно переводить на PageLayout компонент
   - Устранять дублирование стилей
   - Стандартизировать паттерны

## 🚨 Impact Assessment

### **Critical Issues:**

- **DRY Violations:** 5+ страниц дублируют layout код
- **Missing Components:** Collapsible нужен для Order page
- **Inconsistent Spacing:** Разные responsive patterns

### **Files Affected:**

- `apps/web/app/[locale]/exchange/page.tsx`
- `apps/web/app/[locale]/*/page.tsx` (все существующие страницы)
- `packages/ui/src/components/` (нужны новые компоненты)

### **Estimated Effort:**

- **PageLayout Component:** 4-6 часов
- **Collapsible Components:** 6-8 часов
- **Migration Existing Pages:** 2-3 часа per page

## 🎯 Success Metrics

- ✅ Zero duplication в layout patterns
- ✅ Consistent responsive behavior
- ✅ All pages use shared-styles
- ✅ Design system coverage 95%+
- ✅ Bundle size optimization through shared components

---

**Next Steps:**

1. Prioritize Collapsible components for Order page
2. Create PageLayout for new pages
3. Plan migration strategy for existing pages
