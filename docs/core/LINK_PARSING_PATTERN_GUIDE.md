# 🔗 Link Parsing Pattern Guide

## 📋 Обзор

Документация по централизованному паттерну парсинга ссылок в переводах. Система позволяет создавать кликабельные ссылки внутри текстов переводов с использованием специальных маркеров.

## 🏗️ Архитектура

### Компоненты системы

```
packages/utils/src/link-parsing.ts  # Централизованная утилита парсинга
packages/constants/src/app-routes.ts  # Маршруты для ссылок
apps/web/messages/*/advanced-exchange.json  # Переводы с маркерами
apps/web/src/components/exchange/TermsAgreementText.tsx  # Пример использования
```

### Принципы

1. **Централизация** - Вся логика парсинга в одном месте
2. **Консистентность** - Единые маркеры для всех переводов
3. **Типизация** - Полная поддержка TypeScript
4. **Расширяемость** - Легко добавлять новые типы ссылок

## 📝 Использование

### 1. Маркировка ссылок в переводах

В JSON файлах переводов используйте стандартные маркеры:

```json
{
  "security": {
    "terms": {
      "agreement": "Я согласен с [LINK_RULES_START]Правилами сервиса[LINK_RULES_END] и [LINK_AML_START]AML Политикой[LINK_AML_END]"
    }
  }
}
```

### 2. Создание компонента с ссылками

```tsx
import { LEGAL_ROUTES } from '@repo/constants';
import { parseLinkText, createLegalLinksMap } from '@repo/utils';
import { Link } from '../navigation';

export function TextWithLinks({ t }: { t: (key: string) => string }) {
  const text = t('security.terms.agreement');

  // Создаем карту ссылок
  const linkMap = createLegalLinksMap(LEGAL_ROUTES);

  // Wrapper для next-intl Link
  function NextIntlLinkWrapper({ href, children, target, rel, className }) {
    return (
      <Link href={href} target={target} rel={rel} className={className}>
        {children}
      </Link>
    );
  }

  // Парсим текст
  const elements = parseLinkText(text, linkMap, NextIntlLinkWrapper);

  return <>{elements}</>;
}
```

### 3. Кастомная карта ссылок

```tsx
import { parseLinkText, LINK_MARKERS } from '@repo/utils';

const customLinkMap = {
  rules: {
    href: '/custom-rules',
    target: '_blank',
    rel: 'noopener noreferrer',
    className: 'text-blue-600 hover:underline',
  },
  aml: {
    href: '/custom-aml',
    target: '_self',
    className: 'text-primary hover:underline',
  },
};

const elements = parseLinkText(translatedText, customLinkMap);
```

## 🎨 Поддерживаемые маркеры

### Стандартные маркеры

| Тип       | Начальный маркер       | Конечный маркер      | Назначение                  |
| --------- | ---------------------- | -------------------- | --------------------------- |
| `RULES`   | `[LINK_RULES_START]`   | `[LINK_RULES_END]`   | Правила сервиса             |
| `AML`     | `[LINK_AML_START]`     | `[LINK_AML_END]`     | AML политика                |
| `PRIVACY` | `[LINK_PRIVACY_START]` | `[LINK_PRIVACY_END]` | Политика конфиденциальности |
| `RETURNS` | `[LINK_RETURNS_START]` | `[LINK_RETURNS_END]` | Политика возвратов          |

### Добавление новых маркеров

1. **Обновите константы** в `packages/utils/src/link-parsing.ts`:

```typescript
export const LINK_MARKERS = {
  // ... существующие маркеры
  NEW_TYPE: {
    start: '[LINK_NEW_TYPE_START]' as const,
    end: '[LINK_NEW_TYPE_END]' as const,
  },
} as const;
```

2. **Добавьте маршрут** в `packages/constants/src/app-routes.ts`:

```typescript
export const LEGAL_ROUTES = {
  // ... существующие маршруты
  NEW_TYPE: '/new-type' as const,
} as const;
```

3. **Обновите createLegalLinksMap** (если нужно):

```typescript
export function createLegalLinksMap(routes) {
  return {
    // ... существующие ссылки
    new_type: {
      href: routes.NEW_TYPE,
      target: '_blank',
      rel: EXTERNAL_LINK_REL,
      className: DEFAULT_LINK_CLASSES,
    },
  };
}
```

## ⚙️ API Reference

### Основные функции

#### `parseLinkText(text, linkMap, LinkComponent?, markers?)`

Парсит текст с маркерами и возвращает массив React элементов.

**Параметры:**

- `text: string` - Текст с маркерами ссылок
- `linkMap: LinkMarkersMap` - Карта маркеров к конфигурации ссылок
- `LinkComponent?: React.ComponentType<LinkWrapperProps>` - Компонент для рендеринга ссылок
- `markers?: typeof LINK_MARKERS` - Маркеры для парсинга

**Возвращает:** `React.ReactNode[]`

#### `createLegalLinksMap(routes)`

Создает стандартную карту ссылок для правовых страниц.

**Параметры:**

- `routes: { RULES: string; AML_POLICY: string; PRIVACY?: string; RETURNS?: string }`

**Возвращает:** `LinkMarkersMap`

#### `validateLinkMarkers(text, markers?)`

Валидирует корректность маркеров в тексте.

**Параметры:**

- `text: string` - Текст для валидации
- `markers?: typeof LINK_MARKERS` - Маркеры для проверки

**Возвращает:** `string[]` - Массив ошибок валидации

### Типы

```typescript
interface LinkConfig {
  href: string;
  target?: '_blank' | '_self';
  rel?: string;
  className?: string;
}

type LinkMarkersMap = Record<string, LinkConfig>;

interface LinkWrapperProps {
  href: string;
  children: React.ReactNode;
  target?: '_blank' | '_self';
  rel?: string;
  className?: string;
}
```

## 🔍 Валидация и отладка

### Проверка корректности маркеров

```typescript
import { validateLinkMarkers } from '@repo/utils';

const text = 'Текст с [LINK_RULES_START]ссылкой[LINK_RULES_END]';
const errors = validateLinkMarkers(text);

if (errors.length > 0) {
  console.error('Ошибки в маркерах:', errors);
}
```

### Отладка парсинга

```typescript
import { extractLinkInfo, LINK_MARKERS } from '@repo/utils';

const part = '[LINK_RULES_START]Правила[LINK_RULES_END]';
const linkInfo = extractLinkInfo(part, LINK_MARKERS);

console.log(linkInfo); // { type: 'rules', text: 'Правила' }
```

## 🚀 Миграция с старого подхода

### Было (старый подход):

```tsx
// ❌ Хардкод маркеров и дублирование логики
const parts = agreementText.split(/(\[LINK_RULES_START\].*?\[LINK_RULES_END\])/);

return (
  <>
    {parts.map((part, index) => {
      if (part.startsWith('[LINK_RULES_START]')) {
        const linkText = part.replace('[LINK_RULES_START]', '').replace('[LINK_RULES_END]', '');
        return (
          <Link key={index} href="/rules" target="_blank">
            {linkText}
          </Link>
        );
      }
      return part;
    })}
  </>
);
```

### Стало (новый подход):

```tsx
// ✅ Централизованная утилита, переиспользуемая логика
const linkMap = createLegalLinksMap(LEGAL_ROUTES);
const elements = parseLinkText(agreementText, linkMap, NextIntlLinkWrapper);

return <>{elements}</>;
```

## ✅ Best Practices

### 1. Консистентность маркеров

- Используйте только стандартные маркеры из `LINK_MARKERS`
- Следуйте паттерну `[LINK_TYPE_START]` и `[LINK_TYPE_END]`

### 2. Валидация

- Всегда проверяйте маркеры с помощью `validateLinkMarkers`
- Добавьте ESLint правила для автоматической проверки

### 3. Переиспользование

- Используйте `createLegalLinksMap` для стандартных правовых ссылок
- Создавайте кастомные карты только при необходимости

### 4. Типизация

- Всегда указывайте типы для кастомных LinkWrapper компонентов
- Используйте предоставленные интерфейсы

### 5. Производительность

- Кэшируйте результат `createLegalLinksMap` если он не изменяется
- Мемоизируйте компоненты с парсингом при необходимости

## 🐛 Частые проблемы

### Проблема: "Cannot read properties of undefined"

**Причина:** В массив попадают не только строки  
**Решение:** Утилита уже содержит проверку типов

### Проблема: "Property 'children' is missing"

**Причина:** Неправильная передача children в React.createElement  
**Решение:** Используйте предоставленный `DefaultLinkWrapper` или следуйте его паттерну

### Проблема: Маркеры не парсятся

**Причина:** Несоответствие маркеров в тексте и в `LINK_MARKERS`  
**Решение:** Используйте `validateLinkMarkers` для диагностики

## 📦 Интеграция с проектом

Система полностью интегрирована в архитектуру проекта:

- ✅ Следует принципам centralized constants
- ✅ Использует существующую типизацию
- ✅ Совместима с next-intl
- ✅ Поддерживает все современные React паттерны
- ✅ Включена в ESLint правила проекта

## 🔄 Примеры использования

### Простой случай

```tsx
// Для простого текста с одной ссылкой
const simpleText = 'Согласен с [LINK_RULES_START]правилами[LINK_RULES_END]';
const linkMap = { rules: { href: '/rules', target: '_blank' } };
const elements = parseLinkText(simpleText, linkMap);
```

### Сложный случай

```tsx
// Для текста с множественными ссылками разных типов
const complexText = t('agreement.full');
const linkMap = createLegalLinksMap(LEGAL_ROUTES);
const elements = parseLinkText(complexText, linkMap, CustomLinkComponent);
```

### Кастомная стилизация

```tsx
function StyledLinkWrapper({ href, children, className }) {
  return (
    <Link href={href} className={cn('text-blue-600 hover:text-blue-800 underline', className)}>
      {children}
    </Link>
  );
}

const elements = parseLinkText(text, linkMap, StyledLinkWrapper);
```

---

**Документация обновлена:** 1 октября 2025  
**Версия системы:** 1.0  
**Статус:** Production Ready
