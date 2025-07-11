'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '../../lib/utils';

// Form Context
export interface FormContextValue {
  id?: string;
  name?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
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
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ className, name, error, required, disabled, children, ...props }, ref) => {
    const id = React.useId();
    const contextValue: FormContextValue = {
      id,
      name,
      error,
      required,
      disabled,
    };

    return (
      <FormContext.Provider value={contextValue}>
        <div ref={ref} className={cn('space-y-2', className)} {...props}>
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
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
  ({ className, variant, size, required, children, ...props }, ref) => {
    const context = useFormContext();
    const isError = variant === 'error' || !!context?.error;
    const isRequired = required ?? context?.required;

    return (
      <label
        ref={ref}
        htmlFor={context?.id}
        className={cn(
          formLabelVariants({
            variant: isError ? 'error' : 'default',
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
    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildElement(child, context)
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
      success: 'text-green-600 dark:text-green-400',
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
