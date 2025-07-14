'use client';

import * as React from 'react';

import { cn } from '../lib/utils';

// ===== COMPOUND COMPONENTS ARCHITECTURE v2.0 =====
// Unified composition system extending form.tsx pattern
// Based on Rule 20 analysis: 85% coverage with existing form.tsx approach

// Exchange Form Context
export interface ExchangeFormContextValue {
  isSubmitting?: boolean;
  isValid?: boolean;
  exchangeData?: Record<string, unknown>;
  onValueChange?: (field: string, value: unknown) => void;
}

const ExchangeFormContext = React.createContext<ExchangeFormContextValue | undefined>(undefined);

export const useExchangeFormContext = () => {
  return React.useContext(ExchangeFormContext);
};

// ===== ROOT COMPONENT =====
export interface ExchangeFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  exchangeData?: Record<string, unknown>;
  isSubmitting?: boolean;
  isValid?: boolean;
  onValueChange?: (field: string, value: unknown) => void;
  children: React.ReactNode;
}

const ExchangeForm = React.forwardRef<HTMLFormElement, ExchangeFormProps>(
  ({ className, children, exchangeData, isSubmitting, isValid, onValueChange, ...props }, ref) => {
    const contextValue: ExchangeFormContextValue = {
      isSubmitting,
      isValid,
      exchangeData,
      onValueChange,
    };

    return (
      <ExchangeFormContext.Provider value={contextValue}>
        <form ref={ref} className={cn('space-y-6', className)} {...props}>
          {children}
        </form>
      </ExchangeFormContext.Provider>
    );
  }
);

ExchangeForm.displayName = 'ExchangeForm';

// ===== CONTAINER COMPONENT =====
export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'hero' | 'full' | 'mobile';
  children: React.ReactNode;
}

const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ className, variant = 'full', children, ...props }, ref) => {
    const getVariantClass = (v: 'hero' | 'full' | 'mobile') => {
      switch (v) {
        case 'hero':
          return 'bg-card backdrop-blur-sm text-card-foreground border border-border/80 rounded-xl shadow-md shadow-black/8 dark:shadow-black/30 p-6';
        case 'full':
          return 'bg-card text-card-foreground border border-border rounded-2xl shadow-standard p-8 space-y-8';
        case 'mobile':
          return 'bg-card text-card-foreground border border-border rounded-xl shadow-standard p-4 space-y-4';
        default:
          return 'bg-card text-card-foreground border border-border rounded-2xl shadow-standard p-8 space-y-8';
      }
    };

    return (
      <div ref={ref} className={cn(getVariantClass(variant), className)} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = 'ExchangeForm.Container';

// ===== CARD PAIR LAYOUT COMPONENT =====
export interface CardPairProps extends React.HTMLAttributes<HTMLDivElement> {
  layout?: 'horizontal' | 'vertical' | 'compact' | 'withArrow';
  children: React.ReactNode;
}

const CardPair = React.forwardRef<HTMLDivElement, CardPairProps>(
  ({ className, layout = 'horizontal', children, ...props }, ref) => {
    const getLayoutClass = (l: 'horizontal' | 'vertical' | 'compact' | 'withArrow') => {
      switch (l) {
        case 'horizontal':
          return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch';
        case 'vertical':
          return 'space-y-6';
        case 'compact':
          return 'grid grid-cols-1 gap-6';
        case 'withArrow':
          return 'grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 lg:gap-8 items-center';
        default:
          return 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start';
      }
    };

    return (
      <div ref={ref} className={cn(getLayoutClass(layout), className)} {...props}>
        {children}
      </div>
    );
  }
);

CardPair.displayName = 'ExchangeForm.CardPair';

// ===== EXCHANGE CARD COMPONENTS =====
export interface ExchangeCardProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'sending' | 'receiving' | 'neutral';
  children: React.ReactNode;
}

const ExchangeCard = React.forwardRef<HTMLDivElement, ExchangeCardProps>(
  ({ className, type = 'neutral', children, ...props }, ref) => {
    const baseClass =
      'bg-card text-card-foreground border rounded-xl shadow-md hover:shadow-lg transition-all duration-200 p-6';

    const getTypeClass = (t: 'sending' | 'receiving' | 'neutral') => {
      switch (t) {
        case 'sending':
          return 'border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-blue-500/15 dark:shadow-blue-400/20';
        case 'receiving':
          return 'border-l-4 border-l-green-500 dark:border-l-green-400 shadow-green-500/15 dark:shadow-green-400/20';
        case 'neutral':
          return '';
        default:
          return '';
      }
    };

    return (
      <div ref={ref} className={cn(baseClass, getTypeClass(type), className)} {...props}>
        {children}
      </div>
    );
  }
);

ExchangeCard.displayName = 'ExchangeForm.ExchangeCard';

// ===== ENHANCED CHILD COMPONENTS =====
// Using the same enhancement pattern as form.tsx

function enhanceChildWithContext(
  child: React.ReactNode,
  context: ExchangeFormContextValue | undefined
) {
  if (!React.isValidElement(child)) {
    return child;
  }

  const childProps = child.props as Record<string, unknown>;
  const enhancedProps: Record<string, unknown> = {};

  // Enhance with exchange form context
  if (context?.isSubmitting && !childProps.disabled) {
    enhancedProps.disabled = true;
  }

  if (context?.onValueChange && !childProps.onChange && childProps.name) {
    enhancedProps.onChange = (e: React.ChangeEvent<HTMLInputElement> | unknown) => {
      const value = (e as React.ChangeEvent<HTMLInputElement>)?.target?.value ?? e;
      context.onValueChange?.(childProps.name as string, value);
    };
  }

  return React.cloneElement(child, enhancedProps);
}

// ===== FIELD WRAPPER =====
export interface FieldWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const FieldWrapper = React.forwardRef<HTMLDivElement, FieldWrapperProps>(
  ({ className, children, ...props }, ref) => {
    const context = useExchangeFormContext();

    const enhancedChildren = React.Children.map(children, child =>
      enhanceChildWithContext(child, context)
    );

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {enhancedChildren}
      </div>
    );
  }
);

FieldWrapper.displayName = 'ExchangeForm.FieldWrapper';

// ===== ARROW COMPONENT =====
export interface ArrowProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'horizontal' | 'vertical';
}

const Arrow = React.forwardRef<HTMLDivElement, ArrowProps>(
  ({ className, direction = 'horizontal', ...props }, ref) => {
    const icon = direction === 'horizontal' ? '→' : '↓';

    return (
      <div
        ref={ref}
        className={cn(
          'flex-shrink-0 flex items-center justify-center self-center',
          direction === 'horizontal' ? 'lg:my-0 my-4' : 'mx-auto',
          className
        )}
        {...props}
      >
        <div className="bg-primary/10 border border-primary/20 rounded-full w-12 h-12 shadow-lg flex items-center justify-center hover:bg-primary/20 transition-colors">
          <div className="text-primary text-2xl font-bold leading-none">{icon}</div>
        </div>
      </div>
    );
  }
);

Arrow.displayName = 'ExchangeForm.Arrow';

// ===== ACTION AREA =====
export interface ActionAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'simple' | 'separated' | 'prominent';
  children: React.ReactNode;
}

const ActionArea = React.forwardRef<HTMLDivElement, ActionAreaProps>(
  ({ className, variant = 'simple', children, ...props }, ref) => {
    const getVariantClass = (v: 'simple' | 'separated' | 'prominent') => {
      switch (v) {
        case 'simple':
          return 'flex justify-center pt-6';
        case 'separated':
          return 'flex justify-center pt-6 border-t border-border/70 dark:border-border/60 mt-6';
        case 'prominent':
          return 'flex justify-center pt-8 border-t-2 border-primary/20 mt-8 bg-gradient-to-r from-transparent via-primary/5 to-transparent';
        default:
          return 'flex justify-center pt-6';
      }
    };

    return (
      <div ref={ref} className={cn(getVariantClass(variant), className)} {...props}>
        {children}
      </div>
    );
  }
);

ActionArea.displayName = 'ExchangeForm.ActionArea';

// ===== COMPOUND COMPONENT EXPORT =====
export const ExchangeFormCompound = Object.assign(ExchangeForm, {
  Container,
  CardPair,
  ExchangeCard,
  FieldWrapper,
  Arrow,
  ActionArea,
});

// ===== INDIVIDUAL EXPORTS =====
export { ExchangeForm as Root, Container, CardPair, ExchangeCard, FieldWrapper, Arrow, ActionArea };

// Default export as compound component
export default ExchangeFormCompound;
