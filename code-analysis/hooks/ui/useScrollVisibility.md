# useScrollVisibility.ts - Анализ файла

## Краткое назначение

React hook для отслеживания видимости элемента при скролле с использованием Intersection Observer API.

## Подробное описание

### Основная функциональность

Файл предоставляет `useScrollVisibility` hook:

- Отслеживание видимости элемента в viewport
- Configurability через options object
- Intersection Observer API integration
- Safe defaults для edge cases
- Client-side only execution

### Ключевые особенности

- **Intersection Observer**: Modern API для performance-efficient tracking
- **Configurable options**: Threshold, rootMargin, root element
- **Safe defaults**: Reasonable fallbacks для missing elements
- **Client-side directive**: Proper SSR handling
- **Cleanup management**: Proper observer cleanup в useEffect

### Архитектурные решения

- Single responsibility hook
- Options pattern для configurability
- useEffect для lifecycle management
- useState для visibility state tracking
- Ref-based element targeting

## Экспортируемые сущности / API

### Hook signature

```typescript
export function useScrollVisibility(
  elementRef: React.RefObject<HTMLElement | null>,
  options: UseScrollVisibilityOptions = {}
): boolean;
```

### Options interface

```typescript
export interface UseScrollVisibilityOptions {
  /** Порог видимости (0-1) */
  threshold?: number;
  /** Отступы для root элемента */
  rootMargin?: string;
  /** Root элемент для наблюдения */
  root?: Element | null;
}
```

### Return value

- `boolean` - текущее состояние видимости элемента

## Зависимости

### Внутренние зависимости

- Нет внутренних зависимостей

### Внешние зависимости

- `react` - useEffect, useState, RefObject
- Browser Intersection Observer API

## Связи с другими файлами

### Импортируется в

- `packages/hooks/src/ui/index.ts` - barrel export
- `apps/web/src/components/FloatingExchangeButton.tsx` - floating button visibility

### Используется совместно с

- FloatingActionButton component
- scrollToRef utility

## Возможные улучшения и риски

### Текущие риски

- **Browser compatibility**: Intersection Observer не поддерживается в старых браузерах
- **Dependencies array**: elementRef.current в dependencies может вызывать лишние re-runs
- **Initial state**: Assumes visible by default может не подходить для всех cases

### Рекомендации по улучшению

1. **Polyfill support**: Add intersection observer polyfill для старых браузеров
2. **Dependencies optimization**: Review dependencies array для performance
3. **Error handling**: Add error boundaries для observer failures
4. **Enhanced options**: More sophisticated configuration options

## TODO и планы развития

### Краткосрочные задачи

- [ ] Add polyfill support для browser compatibility
- [ ] Optimize dependencies array
- [ ] Add error handling для observer failures

### Долгосрочные задачи

- [ ] Multiple elements tracking
- [ ] Enhanced threshold configurations
- [ ] Performance optimization для many observers
- [ ] Integration с scroll restoration

## Дополнительные заметки

### Intersection Observer benefits

- **Performance**: More efficient чем scroll event listeners
- **Accuracy**: Native browser API для visibility detection
- **Battery efficient**: Optimized by browser for mobile devices
- **Flexible**: Rich configuration options

### Hook design patterns

- **Single responsibility**: Only tracks visibility
- **Composable**: Can be combined с other hooks
- **Ref-based**: Works с React ref system
- **Options pattern**: Flexible configuration

### Default behavior

- **Initial state**: `true` (visible) - prevents flash of floating button
- **Missing element**: Treated as visible для graceful degradation
- **Default threshold**: `0` - triggers immediately when any part visible
- **Default margins**: `'0px'` - no additional margins

### Client-side directive

Uses `'use client'` directive для:

- Proper Next.js App Router compatibility
- Ensures browser-only execution
- Prevents SSR hydration issues

### Cleanup management

Proper cleanup через:

- `observer.unobserve(element)` в return function
- Automatic cleanup при component unmount
- Safe cleanup при element changes

### Performance considerations

- Single observer per hook instance
- Efficient cleanup prevents memory leaks
- Browser-optimized intersection detection
- Minimal re-renders через proper state management

### Browser compatibility

Intersection Observer supported in:

- Chrome 58+
- Firefox 55+
- Safari 12.1+
- Edge 16+

For older browsers, polyfill required.

### Usage patterns

Typical usage:

```typescript
const targetRef = useRef<HTMLElement>(null);
const isVisible = useScrollVisibility(targetRef, {
  threshold: 0.5, // 50% visibility required
  rootMargin: '-100px 0px', // Offset from viewport edges
});
```

### Integration с FloatingExchangeButton

Used для:

- Hide floating button when target visible
- Provide smooth UX transition
- Avoid redundant UI elements
- Enhance scroll-based interactions

### State management approach

- Simple boolean state
- Direct IntersectionObserver integration
- No complex state transformations
- Immediate state updates on visibility changes

### Error handling considerations

Current implementation не handles:

- IntersectionObserver not supported
- Element ref changes during observation
- Observer creation failures
- Multiple rapid ref changes

Could benefit от defensive programming patterns.

### Options configuration

Standard Intersection Observer options:

- **threshold**: Visibility percentage required (0-1)
- **rootMargin**: Margins around root element
- **root**: Alternative root element (default: viewport)

### Future enhancements

Potential improvements:

- Multiple element tracking
- Callback-based API
- Enhanced threshold arrays
- Custom visibility calculations
- Integration с scroll restoration APIs
