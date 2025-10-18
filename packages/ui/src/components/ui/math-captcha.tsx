'use client';

// Removed dependency on hooks - UI component should receive data via props
import { RefreshCw } from 'lucide-react';
import * as React from 'react';


import { cn } from '../../lib/utils';

import { Button } from './button';
import { FormLabel, FormControl } from './form';
import { Input } from './input';

export interface MathCaptchaProps {
  /** Имя поля для FormField */
  name?: string;
  /** Текущий вопрос CAPTCHA */
  question: string;
  /** Текущий ответ пользователя */
  userAnswer: string;
  /** Состояние верификации */
  isVerified: boolean;
  /** Есть ли ошибка в ответе */
  hasError: boolean;
  /** Обработчик изменения ответа */
  onAnswerChange: (answer: string) => void;
  /** Обработчик потери фокуса */
  onBlur: () => void;
  /** Обработчик обновления вопроса */
  onRefresh: () => void;
  /** Отключено ли поле */
  disabled?: boolean;
  /** Дополнительный CSS класс */
  className?: string;
  /** Скрыть лейбл с вопросом (используется внутри FormField) */
  hideLabel?: boolean;
  /** Метки для интернационализации */
  labels: {
    question: string;
    placeholder: string;
    refresh: string;
    verification: string;
    error: string;
  };
}

// Simple event handlers without business logic
const useAnswerHandler = (onAnswerChange: (answer: string) => void) => {
  return React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onAnswerChange(e.target.value);
    },
    [onAnswerChange]
  );
};

// Question component with semantic CSS classes
const CaptchaQuestion: React.FC<{
  question: string;
  onRefresh: () => void;
  disabled: boolean;
  refreshLabel: string;
}> = ({ question, onRefresh, disabled, refreshLabel }) => (
  <div className="flex items-center gap-3 p-3 bg-muted rounded-md border-border">
    <span className="font-mono text-lg font-semibold text-foreground">{question}</span>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onRefresh}
      disabled={disabled}
      title={refreshLabel}
      className="h-8 w-8 p-0 hover:bg-muted-foreground/10"
    >
      <RefreshCw className="h-4 w-4" />
    </Button>
  </div>
);

// Input component with semantic CSS classes
const CaptchaInput: React.FC<{
  userAnswer: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  placeholder: string;
  disabled: boolean;
  isVerified: boolean;
  hasError: boolean;
  name: string;
  questionLabel: string;
  question: string;
}> = ({
  userAnswer,
  onChange,
  onBlur,
  placeholder,
  disabled,
  isVerified,
  hasError,
  name,
  questionLabel,
  question,
}) => (
    <FormControl>
      <Input
        type="text"
        inputMode="numeric"
        value={userAnswer}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          'transition-colors',
          isVerified && 'border-success bg-success/10',
          hasError && 'border-destructive bg-destructive/10'
        )}
        // Доступность
        aria-label={`${questionLabel} ${question}`}
        aria-describedby={hasError ? `${name}-error` : undefined}
        aria-invalid={hasError}
      />
    </FormControl>
  );

// Removed business logic - UI component only handles presentation

/**
 * Математическая CAPTCHA для проверки, что действие выполняет человек
 *
 * Особенности:
 * - Интеграция с FormField для единообразия с другими полями формы
 * - Три уровня сложности: easy (1-10), medium (10-50), hard (50-100)
 * - Автоматическое обновление вопроса при неправильном ответе
 * - Поддержка интернационализации через labels
 * - Полная типизация TypeScript
 *
 * @example
 * ```tsx
 * <MathCaptcha
 *   name="captcha"
 *   difficulty="medium"
 *   onVerified={() => console.log('CAPTCHA прошла!')}
 *   error={form.errors.captcha}
 *   labels={{
 *     question: t('captcha.question'),
 *     placeholder: t('captcha.placeholder'),
 *     refresh: t('captcha.refresh'),
 *   }}
 * />
 * ```
 */
// Removed - labels are now required props

const MathCaptchaHeader: React.FC<{
  hideLabel: boolean;
  labels: {
    question: string;
    verification: string;
  };
  isVerified: boolean;
}> = ({ hideLabel, labels, isVerified }) => {
  if (hideLabel) return null;

  return (
    <FormLabel className="flex items-center justify-between">
      <span>{labels.question}</span>
      {isVerified && (
        <span className="text-success text-sm font-medium">{labels.verification}</span>
      )}
    </FormLabel>
  );
};

const MathCaptchaInputs: React.FC<{
  question: string;
  userAnswer: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  onRefresh: () => void;
  labels: {
    refresh: string;
    placeholder: string;
    question: string;
  };
  disabled: boolean;
  isVerified: boolean;
  hasError: boolean;
  name: string;
}> = ({
  question,
  userAnswer,
  handleChange,
  onBlur,
  onRefresh,
  labels,
  disabled,
  isVerified,
  hasError,
  name,
}) => (
    <div className="space-y-2">
      <CaptchaQuestion
        question={question}
        onRefresh={onRefresh}
        disabled={disabled}
        refreshLabel={labels.refresh}
      />

      <CaptchaInput
        userAnswer={userAnswer}
        onChange={handleChange}
        onBlur={onBlur}
        placeholder={labels.placeholder}
        disabled={disabled}
        isVerified={isVerified}
        hasError={hasError}
        name={name}
        questionLabel={labels.question}
        question={question}
      />
    </div>
  );

export const MathCaptcha = React.forwardRef<HTMLDivElement, MathCaptchaProps>((props, ref) => {
  const {
    name = 'captcha',
    question,
    userAnswer,
    isVerified,
    hasError,
    onAnswerChange,
    onBlur,
    onRefresh,
    disabled = false,
    className,
    hideLabel = false,
    labels,
    ...restProps
  } = props;

  const handleChange = useAnswerHandler(onAnswerChange);

  return (
    <div ref={ref} className={cn('space-y-3', className)} {...restProps}>
      <MathCaptchaHeader hideLabel={hideLabel} labels={labels} isVerified={isVerified} />

      <MathCaptchaInputs
        question={question}
        userAnswer={userAnswer}
        handleChange={handleChange}
        onBlur={onBlur}
        onRefresh={onRefresh}
        labels={labels}
        disabled={disabled}
        isVerified={isVerified}
        hasError={hasError}
        name={name}
      />
    </div>
  );
});

MathCaptcha.displayName = 'MathCaptcha';
