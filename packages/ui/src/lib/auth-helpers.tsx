'use client';

import * as React from 'react';

import type { AuthFormContextValue } from './auth-form-types';

function shouldEnhanceProp(contextValue: unknown, childProp: unknown): boolean {
  // 🔍 ДЕБАГ ЛОГИ для отслеживания проблемы shouldEnhanceProp
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

function addForm(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.form, childProps.form)) {
    enhancedProps.form = context?.form;
  }
}

function addIsLoading(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  // 🔍 ДЕБАГ ЛОГИ для отслеживания проблемы контекста
  console.log('🔍 addIsLoading DEBUG:', {
    'context?.isLoading': context?.isLoading,
    'childProps.isLoading': childProps.isLoading,
    'shouldEnhance': shouldEnhanceProp(context?.isLoading, childProps.isLoading),
  });

  if (shouldEnhanceProp(context?.isLoading, childProps.isLoading)) {
    enhancedProps.isLoading = context?.isLoading;
    console.log('🔍 Enhanced isLoading to:', context?.isLoading);
  }
}

function addTranslation(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.t, childProps.t)) {
    enhancedProps.t = context?.t;
  }
}

function addFieldId(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.fieldId, childProps.fieldId)) {
    enhancedProps.fieldId = context?.fieldId;
  }
}

function addFormType(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.formType, childProps.formType)) {
    enhancedProps.formType = context?.formType;
  }
}

function addOnSubmit(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.onSubmit, childProps.onSubmit)) {
    enhancedProps.onSubmit = context?.onSubmit;
  }
}

function addValidationErrors(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (shouldEnhanceProp(context?.validationErrors, childProps.validationErrors)) {
    enhancedProps.validationErrors = context?.validationErrors;
  }
}

function addContextProps(
  enhancedProps: Record<string, unknown>,
  context: AuthFormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  addForm(enhancedProps, context, childProps);
  addIsLoading(enhancedProps, context, childProps);
  addTranslation(enhancedProps, context, childProps);
  addFieldId(enhancedProps, context, childProps);
  addFormType(enhancedProps, context, childProps);
  addOnSubmit(enhancedProps, context, childProps);
  addValidationErrors(enhancedProps, context, childProps);
}

function getComponentName(childType: unknown): string {
  if (typeof childType === 'function') {
    return (childType as { displayName?: string; name?: string }).displayName || 
           (childType as { displayName?: string; name?: string }).name || 
           'Unknown';
  }
  return String(childType);
}

export function enhanceChildWithContext(
  child: React.ReactNode,
  context: AuthFormContextValue | undefined
) {
  if (!React.isValidElement(child) || typeof child.type === 'string') {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps: Record<string, unknown> = {};
  const componentName = getComponentName(child.type);
  const isAuthSubmitButton = componentName === 'AuthSubmitButton' || componentName.includes('AuthSubmitButton');

  // 🔍 ДЕБАГ ЛОГИ для отслеживания проблемы в модалках
  if (isAuthSubmitButton) {
    console.log('🔍 enhanceChildWithContext for AuthSubmitButton:', {
      componentName,
      'context?.isLoading': context?.isLoading,
      'childProps.isLoading': childProps.isLoading,
      hasContext: !!context
    });
  }

  // Добавляем пропы контекста только к React компонентам, НЕ к DOM элементам
  addContextProps(enhancedProps, context, childProps);

  if (isAuthSubmitButton) {
    console.log('🔍 enhancedProps for AuthSubmitButton:', enhancedProps);
  }

  return React.cloneElement(child, enhancedProps);
}
