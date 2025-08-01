'use client';

import { RefreshCw } from 'lucide-react';
import * as React from 'react';

import { useMathCaptcha, CAPTCHA_CONFIGS } from '../../../../hooks/src/business/useMathCaptcha';

import { cn } from '../../lib/utils';

import { Button } from './button';
import { FormLabel, FormControl } from './form';
import { Input } from './input';

export interface MathCaptchaProps {
  /** Имя поля для FormField */
  name?: string;
  /** Уровень сложности CAPTCHA */
  difficulty?: 'easy' | 'medium' | 'hard';
  /** Обработчик изменения ответа */
  onAnswerChange?: (answer: string, isValid: boolean) => void;
  /** Обработчик успешной верификации */
  onVerified?: () => void;
  /** Обработчик изменения состояния верификации */
  onVerificationChange?: (isVerified: boolean) => void;
  /** Отключено ли поле */
  disabled?: boolean;
  /** Дополнительный CSS класс */
  className?: string;
  /** Скрыть лейбл с вопросом (используется внутри FormField) */
  hideLabel?: boolean;
  /** Метки для интернационализации */
  labels?: {
    question?: string;
    placeholder?: string;
    refresh?: string;
    verification?: string;
    error?: string;
  };
}

// Обработчики событий для уменьшения сложности главного компонента
const useAnswerHandler = ({
  setUserAnswer,
  onBlur,
  isValid,
  onAnswerChange,
  onVerified,
}: {
  setUserAnswer: (answer: string) => void;
  onBlur: () => void;
  isValid: boolean;
  onAnswerChange?: (answer: string, isValid: boolean) => void;
  onVerified?: () => void;
}) => {
  const handleChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const answer = e.target.value;
      setUserAnswer(answer);
      
      // Вызываем callback'и с текущим состоянием валидности
      // isValid будет пересчитано автоматически в useMemo хука
      onAnswerChange?.(answer, isValid);
      if (isValid && answer.trim() !== '') {
        onVerified?.();
      }
    },
    [setUserAnswer, isValid, onAnswerChange, onVerified]
  );

  const handleBlur = React.useCallback(() => {
    onBlur();
  }, [onBlur]);

  return { handleChange, handleBlur };
};

const useRefreshHandler = (
  refreshChallenge: () => void,
  reset: () => void
) => {
  return React.useCallback(() => {
    refreshChallenge();
    reset();
  }, [refreshChallenge, reset]);
};

// Компонент вопроса
const CaptchaQuestion: React.FC<{
  question: string;
  onRefresh: () => void;
  disabled: boolean;
  refreshLabel: string;
}> = ({ question, onRefresh, disabled, refreshLabel }) => (
  <div className="flex items-center gap-3 p-3 bg-muted rounded-md border">
    <span className="font-mono text-lg font-semibold text-foreground">
      {question}
    </span>
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

// Компонент поля ответа
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
  question 
}) => (
  <FormControl>
    <Input
      type="number"
      value={userAnswer}
      onChange={onChange}
      onBlur={onBlur}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        'transition-colors',
        isVerified && 'border-green-500 bg-green-50/50',
        hasError && 'border-red-500 bg-red-50/50'
      )}
      // Доступность
      aria-label={`${questionLabel} ${question}`}
      aria-describedby={hasError ? `${name}-error` : undefined}
      aria-invalid={hasError}
    />
  </FormControl>
);

// Основная логика компонента
const useMathCaptchaLogic = (
  difficulty: 'easy' | 'medium' | 'hard',
  onAnswerChange?: (answer: string, isValid: boolean) => void,
  onVerified?: () => void,
  onVerificationChange?: (isVerified: boolean) => void
) => {
  // Определяем конфигурацию по уровню сложности
  const config = React.useMemo(() => {
    switch (difficulty) {
      case 'easy':
        return CAPTCHA_CONFIGS.easy;
      case 'hard':
        return CAPTCHA_CONFIGS.hard;
      default:
        return CAPTCHA_CONFIGS.medium;
    }
  }, [difficulty]);

  const captcha = useMathCaptcha(config);

  // Отслеживаем изменения верификации и уведомляем форму
  React.useEffect(() => {
    onVerificationChange?.(captcha.isVerified);
  }, [captcha.isVerified, onVerificationChange]);

  // Обработчики
  const { handleChange, handleBlur } = useAnswerHandler({
    setUserAnswer: captcha.setUserAnswer,
    onBlur: captcha.onBlur,
    isValid: captcha.isValid,
    onAnswerChange,
    onVerified,
  });

  const handleRefresh = useRefreshHandler(
    captcha.refreshChallenge, 
    captcha.reset
  );

  return {
    ...captcha,
    handleChange,
    handleBlur,
    handleRefresh,
  };
};

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
export const MathCaptcha = React.forwardRef<HTMLDivElement, MathCaptchaProps>(
  (props, ref) => {
    const {
      name = 'captcha',
      difficulty = 'medium',
      onAnswerChange,
      onVerified,
      disabled = false,
      className,
      hideLabel = false,
      labels = {},
      ...restProps
    } = props;

    console.log('🔍 MathCaptcha render:', {
      hideLabel,
      hasLabels: Object.keys(labels).length > 0,
      questionLabel: labels.question,
    });

    const {
      challenge,
      userAnswer,
      isVerified,
      hasError,
      handleChange,
      handleBlur,
      handleRefresh,
    } = useMathCaptchaLogic(difficulty, onAnswerChange, onVerified);

    // Определяем метки по умолчанию (fallback для случаев без локализации)
    const defaultLabels = {
      question: 'Solve the math problem:',
      placeholder: 'Enter answer',
      refresh: 'Refresh question',
      verification: 'Verification passed ✓',
      error: 'Incorrect answer. Please try again.',
    };

    const finalLabels = { ...defaultLabels, ...labels };

    console.log('🔍 MathCaptcha finalLabels:', {
      question: finalLabels.question,
      hideLabel,
      willShowLabel: !hideLabel
    });

    return (
      <div
        ref={ref}
        className={cn('space-y-3', className)}
        {...restProps}
      >
        {!hideLabel && (
          <FormLabel className="flex items-center justify-between">
            <span>{finalLabels.question}</span>
            {isVerified && (
              <span className="text-green-600 text-sm font-medium">
                {finalLabels.verification}
              </span>
            )}
          </FormLabel>
        )}

        <div className="space-y-2">
          <CaptchaQuestion
            question={challenge.question}
            onRefresh={handleRefresh}
            disabled={disabled}
            refreshLabel={finalLabels.refresh}
          />

          <CaptchaInput
            userAnswer={userAnswer}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder={finalLabels.placeholder}
            disabled={disabled}
            isVerified={isVerified}
            hasError={hasError}
            name={name}
            questionLabel={finalLabels.question}
            question={challenge.question}
          />
        </div>
      </div>
    );
  }
);

MathCaptcha.displayName = 'MathCaptcha';
