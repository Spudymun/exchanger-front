# 🌍 I18N Troubleshooting Guide

## Статус документа

- **Создан**: 11 июля 2025
- **Обновлен**: 11 июля 2025
- **Версия**: 1.0
- **Основан на**: реальном опыте решения проблем с next-intl + Next.js 15

## 🚨 Критические проблемы и решения

### Проблема 1: 404 ошибки на /en и /ru

**Симптомы:**

- GET /en → 404
- GET /ru → 404
- Приложение не загружается
- Отображается стандартная 404 страница Next.js вместо локализированной

**Причины:**

1. Неправильная структура файлов (нет `src/i18n/` папки)
2. Отсутствует `generateStaticParams` в layout
3. Неправильный путь в `next.config.js`
4. Не используется `setRequestLocale`
5. Неправильная архитектура 404 страниц (отсутствует глобальный `not-found.tsx` или локализированная страница)

**Решение:**

```typescript
// 1. Создать правильную структуру src/i18n/
// 2. Добавить в layout.tsx:
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}

// 3. Добавить в page.tsx:
export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  // ...
}

// 4. Проверить next.config.js:
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// 5. Создать правильную архитектуру 404:
// app/not-found.tsx - глобальная 404 с редиректом
// app/[locale]/not-found-page/page.tsx - локализированная 404
```

### Проблема 2: Redirect loops (307 redirects)

**Симптомы:**

- Бесконечные 307 редиректы
- Приложение не загружается
- Браузер показывает "Too many redirects"

**Причины:**

1. Конфликт между root layout и middleware
2. Неправильная конфигурация middleware
3. Root layout пытается редиректить вручную

**Решение:**

```typescript
// Root layout должен содержать html и body теги (требование Next.js):
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>
        {children}
      </body>
    </html>
  );
}

// Middleware должен использовать createMiddleware:
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);
```

### Проблема 3: "Cannot find module" ошибки

**Симптомы:**

- Cannot find module '@/i18n/routing'
- Cannot find module './src/i18n/routing'

**Причины:**

1. Неправильные пути импорта
2. Файлы не созданы в правильной директории
3. Нет алиасов в tsconfig.json

**Решение:**

```typescript
// Создать все файлы в src/i18n/:
src / i18n / routing.ts;
src / i18n / navigation.ts;
src / i18n / request.ts;

// Использовать правильные пути:
import { routing } from '../../src/i18n/routing'; // из app/[locale]/layout.tsx
import { routing } from './src/i18n/routing'; // из middleware.ts
```

### Проблема 4: Hydration errors

**Симптомы:**

- Ошибки гидратации в браузере
- Контент не отображается корректно

**Причины:**

1. Неправильное использование NextIntlClientProvider
2. Передача messages в ClientProvider
3. Неправильная конфигурация request.ts

**Решение:**

```typescript
// В layout.tsx НЕ передавать messages:
<NextIntlClientProvider>
  {children}
</NextIntlClientProvider>

// НЕ ТАК:
<NextIntlClientProvider messages={messages}>
  {children}
</NextIntlClientProvider>
```

### Проблема 5: Typescript ошибки

**Симптомы:**

- 'hasLocale' is defined but never used
- Cannot find name 'SUPPORTED_LOCALES'

**Причины:**

1. Неправильные импорты
2. Использование старых констант
3. Lint правила

**Решение:**

```typescript
// Использовать из routing.ts:
import { routing } from './routing';

// Валидация:
if (!hasLocale(routing.locales, locale)) {
  notFound();
}

// generateStaticParams:
export function generateStaticParams() {
  return routing.locales.map(locale => ({ locale }));
}
```

### 🚨 Проблема 6: MALFORMED_ARGUMENT - Ошибка интерполяции

**Симптомы:**

- `Error: INVALID_MESSAGE: MALFORMED_ARGUMENT (Password must contain at least {{min}} characters)`
- Сообщения валидации не отображаются корректно
- Параметры в фигурных скобках не заменяются значениями

**Причина:**

**КРИТИЧНО**: В `next-intl` используются **одинарные фигурные скобки** `{parameter}`, а НЕ двойные `{{parameter}}`!

**Неправильно:**

```json
{
  "validation": {
    "password": {
      "minLength": "Password must contain at least {{min}} characters"
    }
  }
}
```

**Правильно:**

```json
{
  "validation": {
    "password": {
      "minLength": "Password must contain at least {min} characters"
    }
  }
}
```

**Решение:**

1. **Исправить все файлы переводов** - заменить `{{parameter}}` на `{parameter}`:

```powershell
# Поиск всех двойных скобок:
Select-String -Pattern "\{\{.*\}\}" -Path "messages/*.json"
```

2. **Правильное использование в коде**:

```typescript
// ✅ Правильно:
t('validation.password.minLength', { min: 8 });
// Результат: "Password must contain at least 8 characters"

// ❌ Неправильно:
t('validation.password.minLength', { min: '8' }); // Может не работать в некоторых случаях
```

3. **Проверить все интерполяции в проекте**:

```typescript
// Типичные случаи для исправления:
{
  "minLength": "Minimum {min} characters",     // ✅ Правильно
  "maxLength": "Maximum {max} characters",     // ✅ Правильно
  "minAmount": "Minimum amount: {min}",        // ✅ Правильно
  "maxAmount": "Maximum amount: {max}"         // ✅ Правильно
}
```

**Документация**: [next-intl Interpolation Guide](https://next-intl-docs.vercel.app/docs/usage/messages#interpolation-of-dynamic-values)

## 🔧 Диагностические команды

### Проверка структуры файлов:

```powershell
# Проверить наличие всех файлов:
Test-Path "src/i18n/routing.ts"
Test-Path "src/i18n/navigation.ts"
Test-Path "src/i18n/request.ts"
Test-Path "middleware.ts"
Test-Path "app/[locale]/layout.tsx"
Test-Path "app/[locale]/page.tsx"
```

### Проверка конфигурации:

```powershell
# Проверить next.config.js:
Select-String "request.ts" next.config.js

# Проверить middleware:
Select-String "createMiddleware" middleware.ts
```

### Проверка переводов:

```powershell
# Проверить модульные файлы переводов:
Test-Path "messages/en/home-page.json"
Test-Path "messages/en/layout.json"
Test-Path "messages/ru/home-page.json"
Test-Path "messages/ru/layout.json"
# И другие модули...
```

## 📋 Чек-лист для устранения неполадок

### При 404 ошибках:

- [ ] Структура `src/i18n/` создана
- [ ] Все три файла существуют (routing.ts, navigation.ts, request.ts)
- [ ] `generateStaticParams` добавлен в layout
- [ ] `setRequestLocale` добавлен в layout и page
- [ ] Правильный путь в next.config.js

### При redirect loops:

- [ ] Root layout содержит html и body теги (требование Next.js)
- [ ] Middleware использует createMiddleware
- [ ] Нет конфликтующих редиректов

### При module errors:

- [ ] Правильные пути импорта
- [ ] Файлы существуют в нужных местах
- [ ] Нет опечаток в путях

### При hydration errors:

- [ ] NextIntlClientProvider без messages prop
- [ ] Правильная конфигурация request.ts
- [ ] suppressHydrationWarning в html теге

### При ошибках интерполяции (MALFORMED_ARGUMENT):

- [ ] Все интерполяции используют одинарные скобки `{parameter}`
- [ ] Нет двойных скобок `{{parameter}}` в файлах переводов
- [ ] Параметры передаются как числа или строки: `{ min: 8 }`
- [ ] Проверены все модульные файлы переводов: messages/en/_, messages/ru/_

## 🎯 Финальная проверка

После исправления всех проблем:

1. **Перезапустить сервер**:

   ```powershell
   taskkill /f /im node.exe
   cd apps/web && npm run dev
   ```

2. **Проверить маршруты**:
   - http://localhost:3000 → должен редиректить на /en
   - http://localhost:3000/en → должен работать (200)
   - http://localhost:3000/ru → должен работать (200)

3. **Проверить в терминале**:
   - Нет 404 ошибок
   - Нет redirect loops
   - Middleware компилируется без ошибок

## 📚 Полезные ресурсы

- [next-intl Official Docs](https://next-intl-docs.vercel.app/)
- [App Router Setup Guide](https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing)
- [Static Rendering Guide](https://next-intl-docs.vercel.app/docs/getting-started/app-router/with-i18n-routing#static-rendering)
- [Middleware Configuration](https://next-intl-docs.vercel.app/docs/routing/middleware)

---

**Помните**: Всегда следуйте официальной документации next-intl, а не собственным предположениям!
