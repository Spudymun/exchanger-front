'use client';

import type { UseFormReturn } from '@repo/hooks';
import * as React from 'react';

import type { AuthFormContextValue } from '../lib/auth-form-types';
import { enhanceChildWithContext } from '../lib/auth-helpers';
import { cn } from '../lib/utils';

import { BaseErrorBoundary } from './error-boundaries';

// ===== CONTEXT SETUP =====
const AuthFormContext = React.createContext<AuthFormContextValue | undefined>(undefined);

export function useAuthFormContext() {
  return React.useContext(AuthFormContext);
}

// ===== PROVIDER =====
export interface AuthFormProviderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSubmit'> {
  children: React.ReactNode;
  form?: UseFormReturn<Record<string, unknown>>;
  isLoading?: boolean;
  t?: (key: string) => string;
  fieldId?: string;
  formType?: 'login' | 'register';
  onSubmit?: (data?: Record<string, unknown>) => void;
  validationErrors?: Record<string, string>;
  defaultErrorStyling?: 'auto' | 'disabled' | 'forced';
}

const AuthFormProvider = React.forwardRef<HTMLDivElement, AuthFormProviderProps>(
  (
    {
      children,
      form,
      isLoading,
      t,
      fieldId,
      formType,
      onSubmit,
      validationErrors,
      defaultErrorStyling,
      ...htmlProps
    },
    ref
  ) => {
    const contextValue = React.useMemo<AuthFormContextValue>(
      () => ({
        form,
        isLoading,
        t,
        fieldId,
        formType,
        onSubmit,
        validationErrors,
        defaultErrorStyling,
      }),
      [form, isLoading, t, fieldId, formType, onSubmit, validationErrors, defaultErrorStyling]
    );

    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildWithContext(child, contextValue)
    );

    return (
      <AuthFormContext.Provider value={contextValue}>
        <div ref={ref} {...htmlProps}>
          {enhancedChildren}
        </div>
      </AuthFormContext.Provider>
    );
  }
);

AuthFormProvider.displayName = 'AuthForm.Provider';

// ===== FORM WRAPPER =====
export interface FormWrapperProps extends React.HTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
}

const FormWrapper = React.forwardRef<HTMLFormElement, FormWrapperProps>(
  ({ className, children, onSubmit, ...props }, ref) => {
    const context = useAuthFormContext();

    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildWithContext(child, context)
    );

    const handleSubmit = React.useCallback<React.FormEventHandler<HTMLFormElement>>(
      e => {
        const formFromContext = context?.form;
        if (formFromContext?.handleSubmit) {
          formFromContext.handleSubmit(e);
        }
        onSubmit?.(e);
      },
      [context?.form, onSubmit]
    );

    // Filter out form-specific props that shouldn't be passed to DOM
    const {
      form: _form,
      isLoading: _isLoading,
      t: _t,
      fieldId: _fieldId,
      formType: _formType,
      onSubmit: _onSubmitFromProps,
      validationErrors: _validationErrors,
      ...domProps
    } = props as Record<string, unknown>;

    return (
      <form
        ref={ref}
        className={cn('space-y-4', className)}
        onSubmit={handleSubmit}
        {...domProps}
        noValidate
      >
        {enhancedChildren}
      </form>
    );
  }
);

FormWrapper.displayName = 'AuthForm.FormWrapper';

// ===== FIELD WRAPPER =====
export interface FieldWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const FieldWrapper = React.forwardRef<HTMLDivElement, FieldWrapperProps>(
  ({ className, children, ...props }, ref) => {
    const context = useAuthFormContext();

    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildWithContext(child, context)
    );

    // Filter out form-specific props that shouldn't be passed to DOM
    const {
      form: _form,
      isLoading: _isLoading,
      t: _t,
      fieldId: _fieldId,
      formType: _formType,
      onSubmit: _onSubmit,
      validationErrors: _validationErrors,
      ...domProps
    } = props as Record<string, unknown>;

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...domProps}>
        {enhancedChildren}
      </div>
    );
  }
);

FieldWrapper.displayName = 'AuthForm.FieldWrapper';

// ===== ACTIONS WRAPPER =====
export interface ActionsWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const ActionsWrapper = React.forwardRef<HTMLDivElement, ActionsWrapperProps>(
  ({ className, children, ...props }, ref) => {
    const context = useAuthFormContext();

    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildWithContext(child, context)
    );

    // Filter out form-specific props that shouldn't be passed to DOM
    const {
      form: _form,
      isLoading: _isLoading,
      t: _t,
      fieldId: _fieldId,
      formType: _formType,
      onSubmit: _onSubmit,
      validationErrors: _validationErrors,
      ...domProps
    } = props as Record<string, unknown>;

    return (
      <div ref={ref} className={cn('flex flex-col space-y-4', className)} {...domProps}>
        {enhancedChildren}
      </div>
    );
  }
);

ActionsWrapper.displayName = 'AuthForm.ActionsWrapper';

// ===== ERROR BOUNDARY WRAPPER =====
const AuthFormWithErrorBoundary = React.forwardRef<HTMLDivElement, AuthFormProviderProps>(
  (props, ref) => (
    <BaseErrorBoundary componentName="AuthForm">
      <AuthFormProvider ref={ref} {...props} />
    </BaseErrorBoundary>
  )
);

AuthFormWithErrorBoundary.displayName = 'AuthForm';

// ===== COMPOUND COMPONENT EXPORT =====
const AuthFormCompound = Object.assign(AuthFormWithErrorBoundary, {
  Provider: AuthFormProvider,
  FormWrapper,
  FieldWrapper,
  ActionsWrapper,
  useContext: useAuthFormContext,
});

export default AuthFormCompound;
