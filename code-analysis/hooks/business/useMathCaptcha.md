# useMathCaptcha.ts - Анализ файла

## Краткое назначение

Mathematical CAPTCHA hook для bot protection через простые математические задачи с конфигурируемой сложностью.

## Подробное описание

### Основная функциональность

Файл предоставляет `useMathCaptcha` hook для защиты от ботов:

- Генерация математических задач (сложение, вычитание, умножение)
- Проверка пользовательских ответов
- State management для verification статуса
- Конфигурируемые уровни сложности
- Auto-verification при правильном ответе

### Ключевые особенности

- **Configurable difficulty**: Predefined easy/medium/hard конфигурации
- **Multiple operations**: Поддержка сложения, вычитания и умножения
- **State management**: Полное управление состоянием captcha
- **User experience**: Blur validation и error states
- **Type safety**: Полное типирование всех interfaces

### Архитектурные решения

- Модульная архитектура с отдельными hooks для challenge и user answer
- Constants для magic numbers
- Functional composition с helper hooks
- Comprehensive state management с useEffect для auto-verification

## Экспортируемые сущности / API

### Основные exports

```typescript
// Главная функция
export function useMathCaptcha(config: MathCaptchaConfig = DEFAULT_CONFIG): UseMathCaptchaReturn;

// Core interfaces
export interface MathChallenge {
  question: string;
  answer: number;
  id: string;
}

export interface UseMathCaptchaReturn {
  challenge: MathChallenge;
  userAnswer: string;
  isValid: boolean;
  isVerified: boolean;
  hasError: boolean;
  setUserAnswer: (answer: string) => void;
  onBlur: () => void;
  refreshChallenge: () => void;
  verify: () => boolean;
  reset: () => void;
}

export interface MathCaptchaConfig {
  minNumber: number;
  maxNumber: number;
  operations: Array<'add' | 'subtract' | 'multiply'>;
}

// Predefined configurations
export const CAPTCHA_CONFIGS: Record<string, MathCaptchaConfig> = {
  easy: { minNumber: 1, maxNumber: 10, operations: ['add', 'subtract'] },
  medium: { minNumber: 1, maxNumber: 20, operations: ['add', 'subtract', 'multiply'] },
  hard: { minNumber: 5, maxNumber: 50, operations: ['add', 'subtract', 'multiply'] },
};
```

## Зависимости

### Внутренние зависимости

- Нет прямых внутренних зависимостей

### Внешние зависимости

- `react` - useState, useCallback, useMemo, useEffect

## Связи с другими файлами

### Дублируется в

- `packages/ui/src/lib/useMathCaptchaLocal.ts` - локальная версия в UI package

### Используется в

- Компоненты форм для bot protection
- Authentication flows
- Registration processes

## Возможные улучшения и риски

### Текущие риски

- **Code duplication**: Дублируется в `useMathCaptchaLocal.ts`
- **Predictable patterns**: Математические задачи могут быть предсказуемыми
- **Security level**: Basic protection, не защищает от advanced bots

### Рекомендации по улучшению

1. **Eliminate duplication**: Consolidate с useMathCaptchaLocal
2. **Enhanced randomization**: More complex question patterns
3. **Visual elements**: Add visual challenges для stronger protection
4. **Accessibility**: Improve accessibility для users с disabilities

## TODO и планы развития

### Краткосрочные задачи

- [ ] Resolve duplication с useMathCaptchaLocal
- [ ] Add unit tests для всех scenarios
- [ ] Improve accessibility features

### Долгосрочные задачи

- [ ] Visual CAPTCHA integration
- [ ] Multiple question types
- [ ] Advanced bot detection
- [ ] Analytics для CAPTCHA effectiveness

## Дополнительные заметки

### Architecture breakdown

```typescript
useMathCaptcha()
  -> useChallenge() // Challenge generation и refresh
  -> useUserAnswer() // User input management
  -> generateMathChallenge() // Core challenge generation
```

### Helper hooks

- **useChallenge**: Управляет generation и refresh математических задач
- **useUserAnswer**: Управляет user input, verification status и blur state

### Challenge generation logic

- **Addition**: Straightforward addition в пределах range
- **Subtraction**: Ensures positive results (larger - smaller)
- **Multiplication**: Uses smaller numbers (1-10) для reasonable answers
- **Fallback**: Defaults к addition если operation неизвестен

### State management patterns

- `isValid`: Проверка правильности текущего ответа
- `isVerified`: Confirmation статус (set на true при правильном ответе)
- `hasError`: Error state (показывается после blur с неправильным ответом)
- Auto-verification через useEffect когда answer становится valid

### Security considerations

- Генерирует unique ID для каждой challenge
- Random operation selection
- Configurable difficulty levels
- Protection против empty submissions

### User experience features

- Blur validation для immediate feedback
- Error states для visual feedback
- Refresh capability для new challenges
- Reset functionality для form resets

### Code duplication issue

Файл дублируется в `packages/ui/src/lib/useMathCaptchaLocal.ts`. Возможные причины:

- Package boundary concerns
- Different dependencies
- Legacy code organization

### Performance characteristics

- Efficient generation с простыми математическими операциями
- Memoized validity checks
- Callback-based methods для stable references
- Minimal re-renders через proper state management
