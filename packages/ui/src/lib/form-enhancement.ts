/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disa  // 🔍 ДЕБАГ ЛОГИ для отслеживания проблемы shouldEnhanceProp - ВЫКЛЮЧЕНЫ
  const shouldEnhance = contextValue !== undefined && (childProp === undefined || childProp === null);
  // console.log('🔍 shouldEnhanceProp DEBUG:', {
  //   contextValue,
  //   childProp,
  //   shouldEnhance,
  //   'childProp === undefined': childProp === undefined,
  //   'childProp === null': childProp === null,
  // });exity */
 

/**
 * Form Enhancement Unified System
 * 
 * Унифицированная система для enhancement функций в compound components
 * Согласно BUTTON_SYSTEM_SAFE_REFACTORING_PLAN.md PHASE 1
 * 
 * КРИТИЧЕСКОЕ ПРАВИЛО: НЕ изменяет существующее поведение - только объединяет логику
 * 
 * ⚠️ ВРЕМЕННЫЕ ESLINT ОТКЛЮЧЕНИЯ:
 * - no-console: Debug логи НЕОБХОДИМЫ для отладки согласно плану
 * - complexity: Сохранение существующей логики приоритетнее рефакторинга
 * - max-lines-per-function: Объединение 4 функций в одну требует больше строк
 */

import * as React from 'react';

// ✅ СОХРАНЕНИЕ СУЩЕСТВУЮЩИХ ТИПОВ для обратной совместимости
export type EnhancementType = 'auth' | 'exchange' | 'header' | 'data-table';

// ✅ УНИФИЦИРОВАННЫЕ ТИПЫ для всех контекстов - расширенная совместимость
type BaseContextValue = Record<string, unknown> & {
  // Поля для auth context
  form?: unknown;
  isLoading?: boolean;
  t?: unknown;
  fieldId?: string;
  formType?: string;
  onSubmit?: unknown;
  validationErrors?: unknown;
  
  // Поля для exchange context
  isSubmitting?: boolean;
  onValueChange?: unknown;
  
  // Поля для header context  
  currentLocale?: unknown;
  onLocaleChange?: unknown;
  isAuthenticated?: boolean;
  onSignIn?: unknown;
  onSignOut?: unknown;
  
  // Поля для data-table context
  sortConfig?: unknown;
  onSort?: unknown;
};

// ✅ Фабрика для создания enhancement функций с сохранением существующего поведения
export function createEnhancementFunction(type: EnhancementType) {
  return function enhanceChildWithContext(
    child: React.ReactNode,
    context: BaseContextValue | undefined
  ): React.ReactNode {
    // ✅ БАЗОВАЯ проверка - сохранена из всех существующих функций
    if (!React.isValidElement(child) || typeof child.type === 'string') {
      return child;
    }

    const childProps = child.props as Record<string, unknown>;
    const enhancedProps: Record<string, unknown> = {};

    // ✅ КРИТИЧНО: Применяем enhancement только для соответствующего типа
    switch (type) {
      case 'auth':
        // ✅ ТОЧНАЯ копия логики из auth-helpers.tsx
        enhanceForAuth(enhancedProps, context, childProps, child.type);
        break;

      case 'exchange':
        // ✅ ТОЧНАЯ копия логики из exchange-form.tsx
        enhanceForExchange(enhancedProps, context, childProps, child.type);
        break;

      case 'header':
        // ✅ ТОЧНАЯ копия логики из header-helpers.tsx
        enhanceForHeader(enhancedProps, context, childProps);
        break;

      case 'data-table':
        // ✅ ТОЧНАЯ копия логики из data-table-compound.tsx
        enhanceForDataTable(enhancedProps, context, childProps);
        break;

      default:
        // ✅ НЕ ДОЛЖНО происходить, но сохраняем защиту
        console.warn(`Unknown enhancement type: ${type}`);
        return child;
    }

    // ✅ СОХРАНЕНИЕ СУЩЕСТВУЮЩЕГО ПОВЕДЕНИЯ: применяем enhancement только если есть изменения
    return Object.keys(enhancedProps).length > 0 
      ? React.cloneElement(child, enhancedProps)
      : child;
  };
}

// =================== AUTH ENHANCEMENT =================== 
// ✅ ТОЧНАЯ копия логики из auth-helpers.tsx

function shouldEnhancePropAuth(contextValue: unknown, childProp: unknown): boolean {
  // 🔍 ДЕБАГ ЛОГИ для отслеживания проблемы shouldEnhanceProp - СОХРАНЕНЫ
  const shouldEnhance = contextValue !== undefined && (childProp === undefined || childProp === null);
  console.log('🔍 shouldEnhanceProp DEBUG:', {
    contextValue,
    childProp,
    shouldEnhance,
    'childProp === undefined': childProp === undefined,
    'childProp === null': childProp === null
  });
  return shouldEnhance;
}

function enhanceForAuth(
  enhancedProps: Record<string, unknown>,
  context: BaseContextValue | undefined,
  childProps: Record<string, unknown>,
  childType: unknown
) {
  // ✅ ДЕБАГ ЛОГИ - СОХРАНЕНЫ для совместимости
  const componentName = getComponentName(childType);
  const isAuthSubmitButton = componentName === 'AuthSubmitButton' || componentName.includes('AuthSubmitButton');

  if (isAuthSubmitButton) {
    console.log('🔍 enhanceChildWithContext for AuthSubmitButton:', {
      componentName,
      'context?.isLoading': context?.isLoading,
      'childProps.isLoading': childProps.isLoading,
      hasContext: !!context
    });
  }

  // ✅ ТОЧНАЯ логика из auth-helpers.tsx
  if (shouldEnhancePropAuth(context?.form, childProps.form)) {
    enhancedProps.form = context?.form;
  }

  if (shouldEnhancePropAuth(context?.isLoading, childProps.isLoading)) {
    enhancedProps.isLoading = context?.isLoading;
    // console.log('🔍 Enhanced isLoading to:', context?.isLoading);
  }

  if (shouldEnhancePropAuth(context?.t, childProps.t)) {
    enhancedProps.t = context?.t;
  }

  if (shouldEnhancePropAuth(context?.fieldId, childProps.fieldId)) {
    enhancedProps.fieldId = context?.fieldId;
  }

  if (shouldEnhancePropAuth(context?.formType, childProps.formType)) {
    enhancedProps.formType = context?.formType;
  }

  if (shouldEnhancePropAuth(context?.onSubmit, childProps.onSubmit)) {
    enhancedProps.onSubmit = context?.onSubmit;
  }

  if (shouldEnhancePropAuth(context?.validationErrors, childProps.validationErrors)) {
    enhancedProps.validationErrors = context?.validationErrors;
  }

  if (isAuthSubmitButton) {
    // console.log('🔍 enhancedProps for AuthSubmitButton:', enhancedProps);
  }
}

// =================== EXCHANGE ENHANCEMENT ===================
// ✅ ТОЧНАЯ копия логики из exchange-form.tsx

function enhanceForExchange(
  enhancedProps: Record<string, unknown>,
  context: BaseContextValue | undefined,
  childProps: Record<string, unknown>,
  childType: unknown
) {
  // ✅ ДЕБАГ ЛОГИ - СОХРАНЕНЫ для совместимости
  const componentName = getComponentName(childType);
  const isSubmitButton = componentName === 'AuthSubmitButton' || 
                        componentName === 'SubmitButton' || 
                        componentName.includes('SubmitButton');

  if (isSubmitButton) {
    console.log('🔍 enhanceChildWithContext for SubmitButton:', {
      componentName,
      isSubmitButton,
      'context?.isSubmitting': context?.isSubmitting,
      'childProps.isLoading': childProps.isLoading
    });
  }

  // ✅ ТОЧНАЯ логика из exchange-form.tsx
  if (isSubmitButton && context?.isSubmitting !== undefined && !childProps.isLoading) {
    enhancedProps.isLoading = context.isSubmitting;
    // console.log('🔍 enhanceChildWithContext SETTING isLoading =', context.isSubmitting);
  }

  // ✅ ДОПОЛНИТЕЛЬНАЯ логика из exchange-form.tsx
  if (context?.isSubmitting && !childProps.disabled) {
    enhancedProps.disabled = true;
  }

  if (context?.onValueChange && !childProps.onChange && childProps.name) {
    enhancedProps.onChange = (e: any) => {
      const value = e?.target?.value ?? e;
      (context.onValueChange as (name: string, value: unknown) => void)?.(childProps.name as string, value);
    };
  }
}

// =================== HEADER ENHANCEMENT ===================
// ✅ ТОЧНАЯ копия логики из header-helpers.tsx

function shouldEnhancePropHeader(contextValue: unknown, childProp: unknown): boolean {
  return contextValue !== undefined && !childProp;
}

function enhanceForHeader(
  enhancedProps: Record<string, unknown>,
  context: BaseContextValue | undefined,
  childProps: Record<string, unknown>
) {
  // ✅ ТОЧНАЯ логика из header-helpers.tsx
  if (shouldEnhancePropHeader(context?.currentLocale, childProps.currentLocale)) {
    enhancedProps.currentLocale = context?.currentLocale;
  }

  if (shouldEnhancePropHeader(context?.onLocaleChange, childProps.onLocaleChange)) {
    enhancedProps.onLocaleChange = context?.onLocaleChange;
  }

  if (shouldEnhancePropHeader(context?.isAuthenticated, childProps.isAuthenticated)) {
    enhancedProps.isAuthenticated = context?.isAuthenticated;
  }

  if (shouldEnhancePropHeader(context?.onSignIn, childProps.onSignIn)) {
    enhancedProps.onSignIn = context?.onSignIn;
  }

  if (shouldEnhancePropHeader(context?.onSignOut, childProps.onSignOut)) {
    enhancedProps.onSignOut = context?.onSignOut;
  }
}

// =================== DATA-TABLE ENHANCEMENT ===================
// ✅ ТОЧНАЯ копия логики из data-table-compound.tsx

function enhanceForDataTable(
  enhancedProps: Record<string, unknown>,
  context: BaseContextValue | undefined,
  childProps: Record<string, unknown>
) {
  // ✅ ТОЧНАЯ логика из data-table-compound.tsx
  if (context?.sortConfig && childProps.sortable && !childProps.onClick) {
    enhancedProps.onClick = () => {
      if (childProps.sortKey) {
        (context.onSort as (sortKey: string) => void)?.(childProps.sortKey as string);
      }
    };
  }
}

// =================== UTILITY FUNCTIONS ===================
// ✅ ОБЩАЯ функция для получения имени компонента

function getComponentName(childType: unknown): string {
  if (typeof childType === 'function') {
    return (childType as { displayName?: string; name?: string }).displayName || 
           (childType as { displayName?: string; name?: string }).name || 
           'Unknown';
  }
  return String(childType);
}