'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';
import { useAuthFormContext } from '../auth-form-compound';
import { useExchangeFormContext } from '../exchange-form';

// Утилитарная функция для определения defaultErrorStyling (устраняет избыточность)
function resolveErrorStyling(
  errorStyling: string | undefined,
  ...contexts: Array<{ defaultErrorStyling?: string } | undefined>
): 'auto' | 'disabled' | 'forced' {
  if (errorStyling) return errorStyling as 'auto' | 'disabled' | 'forced';

  for (const context of contexts) {
    if (context?.defaultErrorStyling) {
      return context.defaultErrorStyling as 'auto' | 'disabled' | 'forced';
    }
  }

  return 'auto';
}

// Form Context
export interface FormContextValue {
  id?: string;
  name?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  defaultErrorStyling?: 'auto' | 'disabled' | 'forced';
}

const FormContext = React.createContext<FormContextValue | undefined>(undefined);

export const useFormContext = () => {
  return React.useContext(FormContext);
};

// Form Field
export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  name?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  errorStyling?: 'auto' | 'disabled' | 'forced'; // ДОБАВЛЯЕМ ТОЛЬКО ЭТОТ ПРОП
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, name, error, required, disabled, errorStyling, children, ...props }, ref) => {
    const id = React.useId();
    const parentContext = useFormContext(); // Получаем parent context
    const authContext = useAuthFormContext(); // Получаем auth context
    const exchangeContext = useExchangeFormContext(); // Получаем exchange context

    // Используем утилитарную функцию (устраняет дублирование логики)
    const defaultErrorStyling = resolveErrorStyling(
      errorStyling,
      parentContext,
      authContext,
      exchangeContext
    );

    const contextValue: FormContextValue = React.useMemo(
      () => ({
        id,
        name,
        error,
        required,
        disabled,
        defaultErrorStyling,
      }),
      [id, name, error, required, disabled, defaultErrorStyling]
    );

    return (
      <FormContext.Provider value={contextValue}>
        <div ref={ref} className={cn('form-field-container', className)} {...props}>
          {children}
        </div>
      </FormContext.Provider>
    );
  }
);

FormField.displayName = 'FormField';

// Form Label
const formLabelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        error: 'text-destructive',
      },
      size: {
        default: 'text-sm',
        sm: 'text-xs',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface FormLabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof formLabelVariants> {
  required?: boolean;
  errorStyling?: 'auto' | 'disabled' | 'forced';
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, variant, size, required, errorStyling, children, ...props }, ref) => {
    const context = useFormContext();

    // Determine error styling behavior
    const effectiveErrorStyling = errorStyling ?? context?.defaultErrorStyling ?? 'auto';

    const shouldShowError = (() => {
      switch (effectiveErrorStyling) {
        case 'disabled':
          return false;
        case 'forced':
          return true;
        case 'auto':
        default:
          return variant === 'error' || !!context?.error;
      }
    })();

    const isRequired = required ?? context?.required;

    return (
      <label
        ref={ref}
        htmlFor={context?.id}
        className={cn(
          formLabelVariants({
            variant: shouldShowError ? 'error' : 'default',
            size,
          }),
          className
        )}
        {...props}
      >
        {children}
        {isRequired && (
          <span className="ml-1 text-destructive" aria-label="required">
            *
          </span>
        )}
      </label>
    );
  }
);

FormLabel.displayName = 'FormLabel';

// Form Control Helper
function createBasicProps(context: FormContextValue | undefined) {
  return {
    id: context?.id,
    name: context?.name,
  };
}

function addAriaProps(props: Record<string, unknown>, context: FormContextValue | undefined) {
  if (context?.error) {
    props['aria-describedby'] = `${context.id}-error`;
    props['aria-invalid'] = true;
  }
}

function addStateProps(
  props: Record<string, unknown>,
  context: FormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  if (context?.disabled && !childProps.disabled) {
    props.disabled = true;
  }
  if (context?.required && !childProps.required) {
    props.required = true;
  }
}

function createEnhancedProps(
  context: FormContextValue | undefined,
  childProps: Record<string, unknown>
) {
  const enhancedProps = createBasicProps(context);
  addAriaProps(enhancedProps, context);
  addStateProps(enhancedProps, context, childProps);
  return enhancedProps;
}

function enhanceChildElement(child: React.ReactNode, context: FormContextValue | undefined) {
  if (!React.isValidElement(child)) {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps = createEnhancedProps(context, childProps);
  return React.cloneElement(child, enhancedProps);
}

const FormControl = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const context = useFormContext();

    // ОПТИМИЗАЦИЯ: Мемоизируем обработку children для предотвращения лишних вычислений
    const enhancedChildren = React.useMemo(
      () => React.Children.map(children, child => enhanceChildElement(child, context)),
      [children, context]
    );

    return (
      <div ref={ref} className={cn('relative', className)} {...props}>
        {enhancedChildren}
      </div>
    );
  }
);

FormControl.displayName = 'FormControl';

// Form Message
const formMessageVariants = cva('text-sm font-medium', {
  variants: {
    variant: {
      default: 'text-muted-foreground',
      error: 'text-destructive',
      success: 'text-success',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

export interface FormMessageProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof formMessageVariants> {}

function getMessageVariant(
  variant: 'default' | 'error' | 'success' | null | undefined,
  hasError: boolean
) {
  if (variant) return variant;
  return hasError ? 'error' : 'default';
}

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, variant, children, ...props }, ref) => {
    const context = useFormContext();
    const message = children || context?.error;
    const messageVariant = getMessageVariant(variant, !!context?.error);

    if (!message) {
      return null;
    }

    const isError = messageVariant === 'error';

    return (
      <p
        ref={ref}
        id={context?.error ? `${context.id}-error` : undefined}
        className={cn(formMessageVariants({ variant: messageVariant }), className)}
        role={isError ? 'alert' : undefined}
        aria-live={isError ? 'polite' : undefined}
        {...props}
      >
        {message}
      </p>
    );
  }
);

FormMessage.displayName = 'FormMessage';

// Form Description
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
});

FormDescription.displayName = 'FormDescription';

export {
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
  formLabelVariants,
  formMessageVariants,
};
