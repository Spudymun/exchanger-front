'use client';

import { Button, ExchangeForm, type AdaptiveWidthProps, cn } from '@repo/ui';
import { useTranslations } from 'next-intl';
import React from 'react';

import { ExchangeBenefits } from './hero-exchange/ExchangeBenefits';
import { ReceivingCard } from './hero-exchange/ReceivingCard';
import { SendingCard } from './hero-exchange/SendingCard';
import { useHeroExchangeForm } from './hero-exchange/useHeroExchangeForm';

export interface HeroExchangeFormData extends Record<string, unknown> {
  fromAmount: string;
  fromCurrency: string;
  tokenStandard?: string;
  toCurrency: string;
  selectedBankId?: string;
}

// ========================================================================================
// HeroExchangeForm v2.0 - Enhanced with AdaptiveContainer Integration
// Добавлена поддержка adaptive width control
// ========================================================================================

interface HeroExchangeFormProps {
  onExchange?: (data: HeroExchangeFormData) => void;
  className?: string;

  // === Adaptive Width Control Props ===
  useAdaptiveContainer?: boolean;
  adaptiveMode?: AdaptiveWidthProps['adaptationMode'];
  minWidth?: number;
  maxWidth?: number;
  preferredWidth?: number;
  growthFactor?: number;
}

// ===== ПОДКОМПОНЕНТЫ ДЛЯ РАЗБИЕНИЯ ФУНКЦИИ =====

interface ExchangeFormCardsProps {
  form: ReturnType<typeof useHeroExchangeForm>['form'];
  calculatedAmount: ReturnType<typeof useHeroExchangeForm>['calculatedAmount'];
  banks: ReturnType<typeof useHeroExchangeForm>['banks'];
  constants: ReturnType<typeof useHeroExchangeForm>['constants'];
  t: ReturnType<typeof useTranslations>;
}

function ExchangeFormCards({
  form,
  calculatedAmount,
  banks,
  constants,
  t,
}: ExchangeFormCardsProps) {
  return (
    <ExchangeForm.CardPair layout="withArrow">
      <ExchangeForm.FieldWrapper>
        <SendingCard
          form={form}
          t={t}
          exchangeRate={constants.EXCHANGE_RATE}
          minAmount={constants.MIN_AMOUNTS.from}
        />
      </ExchangeForm.FieldWrapper>

      <ExchangeForm.Arrow direction="horizontal" />

      <ExchangeForm.FieldWrapper>
        <ReceivingCard form={form} banks={banks} calculatedAmount={calculatedAmount} t={t} />
      </ExchangeForm.FieldWrapper>
    </ExchangeForm.CardPair>
  );
}

interface ExchangeFormActionProps {
  isValid: boolean;
  t: ReturnType<typeof useTranslations>;
}

function ExchangeFormAction({ isValid, t }: ExchangeFormActionProps) {
  return (
    <ExchangeForm.ActionArea variant="simple">
      <Button
        type="submit"
        size="lg"
        disabled={!isValid}
        className="w-full sm:w-auto sm:min-w-[200px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
      >
        {t('exchange')}
      </Button>
    </ExchangeForm.ActionArea>
  );
}

// ===== ГЛАВНАЯ ФУНКЦИЯ =====
export function HeroExchangeForm(props: HeroExchangeFormProps) {
  const {
    onExchange,
    className,
    useAdaptiveContainer = false,
    adaptiveMode = 'clamp',
    minWidth = 320,
    maxWidth = 1200,
    preferredWidth = 900,
    growthFactor = 0.9,
  } = props;

  const t = useTranslations('AdvancedExchangeForm');
  const { form, calculatedAmount, banks, isValid, constants } = useHeroExchangeForm(t, onExchange);

  // Настройки для AdaptiveContainer
  const adaptiveProps: AdaptiveWidthProps = {
    adaptationMode: adaptiveMode,
    minWidth,
    maxWidth,
    preferredWidth,
    growthFactor,
  };

  const cardsProps = { form, calculatedAmount, banks, constants, t };
  const actionProps = { isValid, t };

  return (
    <div
      className={cn('w-full max-w-full overflow-hidden', className)}
      data-testid="hero-exchange-form"
    >
      <div className="space-y-6 sm:space-y-8">
        <ExchangeBenefits t={t} />
        <ExchangeForm
          exchangeData={form.values}
          isSubmitting={form.isSubmitting}
          isValid={isValid}
          onSubmit={form.handleSubmit}
        >
          {useAdaptiveContainer ? (
            <ExchangeForm.EnhancedContainer variant="adaptive-hero" adaptiveProps={adaptiveProps}>
              <ExchangeFormCards {...cardsProps} />
              <ExchangeFormAction {...actionProps} />
            </ExchangeForm.EnhancedContainer>
          ) : (
            <ExchangeForm.Container variant="hero">
              <ExchangeFormCards {...cardsProps} />
              <ExchangeFormAction {...actionProps} />
            </ExchangeForm.Container>
          )}
        </ExchangeForm>
      </div>
    </div>
  );
}
