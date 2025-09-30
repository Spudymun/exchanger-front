'use client';

import { AuthSubmitButton, ExchangeForm, type AdaptiveWidthProps, cn } from '@repo/ui';
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
  onExchange?: (data: HeroExchangeFormData) => Promise<void>;
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
  constants: ReturnType<typeof useHeroExchangeForm>['constants'];
  t: ReturnType<typeof useTranslations>;
}

function ExchangeFormCards({
  form,
  calculatedAmount,
  constants,
  t,
}: ExchangeFormCardsProps) {
  return (
    <ExchangeForm.CardPair layout="withArrow">
      <ExchangeForm.FieldWrapper>
        <SendingCard form={form} t={t} minAmount={constants.minCryptoAmount} />
      </ExchangeForm.FieldWrapper>

      <ExchangeForm.Arrow direction="horizontal" />

      <ExchangeForm.FieldWrapper>
        <ReceivingCard form={form} calculatedAmount={calculatedAmount} t={t} />
      </ExchangeForm.FieldWrapper>
    </ExchangeForm.CardPair>
  );
}

interface ExchangeFormActionProps {
  isValid: boolean;
  t: ReturnType<typeof useTranslations>;
  form: ReturnType<typeof useHeroExchangeForm>['form']; // ✅ ФИКС: добавляем form
}

function ExchangeFormAction({ isValid, t, form }: ExchangeFormActionProps) {
  return (
    <ExchangeForm.ActionArea variant="simple">
      <AuthSubmitButton
        form={form} // ✅ ФИКС: передаем form для обработки submit
        submitStyle="hero" // ✅ Используем новый prop согласно плану
        size="lg"
        isValid={isValid} // ✅ Legacy compatibility
        isLoading={form.isSubmitting} // ✅ ФИКС: используем form.isSubmitting для показа спинера
        t={t}
        variant="default"
      >
        {t('exchange')}
      </AuthSubmitButton>
    </ExchangeForm.ActionArea>
  );
}

// ===== RENDER COMPONENTS =====
function HeroExchangeFormContent({
  useAdaptiveContainer,
  adaptiveProps,
  cardsProps,
  actionProps,
  form,
  isValid,
}: {
  useAdaptiveContainer: boolean;
  adaptiveProps: AdaptiveWidthProps;
  cardsProps: Parameters<typeof ExchangeFormCards>[0];
  actionProps: Parameters<typeof ExchangeFormAction>[0];
  form: ReturnType<typeof useHeroExchangeForm>['form'];
  isValid: boolean;
}) {
  return (
    <ExchangeForm
      exchangeData={form.values}
      isSubmitting={form.isSubmitting}
      isValid={isValid}
      onSubmit={form.handleSubmit}
      defaultErrorStyling="disabled"
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
  const { form, calculatedAmount, isValid, constants } = useHeroExchangeForm(t, onExchange);

  // Настройки для AdaptiveContainer
  const adaptiveProps: AdaptiveWidthProps = {
    adaptationMode: adaptiveMode,
    minWidth,
    maxWidth,
    preferredWidth,
    growthFactor,
  };

  const cardsProps = { form, calculatedAmount, constants, t };
  const actionProps = { isValid, t, form }; // ✅ ФИКС: передаем form в actionProps

  return (
    <div
      className={cn('w-full max-w-full overflow-hidden', className)}
      data-testid="hero-exchange-form"
    >
      <div className="space-y-6 sm:space-y-8">
        <ExchangeBenefits t={t} />
        <HeroExchangeFormContent
          useAdaptiveContainer={useAdaptiveContainer}
          adaptiveProps={adaptiveProps}
          cardsProps={cardsProps}
          actionProps={actionProps}
          form={form}
          isValid={isValid}
        />
      </div>
    </div>
  );
}
