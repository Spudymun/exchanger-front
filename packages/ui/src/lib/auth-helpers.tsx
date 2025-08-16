'use client';

import * as React from 'react';

import type { AuthFormContextValue } from './auth-form-types';

function shouldEnhanceProp(contextValue: unknown, childProp: unknown): boolean {
  return contextValue !== undefined && !childProp;
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
  if (shouldEnhanceProp(context?.isLoading, childProps.isLoading)) {
    enhancedProps.isLoading = context?.isLoading;
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

export function enhanceChildWithContext(
  child: React.ReactNode,
  context: AuthFormContextValue | undefined
) {
  if (!React.isValidElement(child) || typeof child.type === 'string') {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps: Record<string, unknown> = {};

  // Добавляем пропы контекста только к React компонентам, НЕ к DOM элементам
  addContextProps(enhancedProps, context, childProps);

  return React.cloneElement(child, enhancedProps);
}
