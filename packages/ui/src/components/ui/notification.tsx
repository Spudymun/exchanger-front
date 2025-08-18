import { cva, type VariantProps } from 'class-variance-authority';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../lib/utils';

const notificationVariants = cva(
  'relative flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'border-border bg-background text-foreground',
        success: 'border-success bg-success/10 text-success',
        error: 'border-destructive bg-destructive/10 text-destructive',
        warning: 'border-warning bg-warning/10 text-warning',
        info: 'border-info bg-info/10 text-info',
      },
      size: {
        default: 'p-4',
        sm: 'p-3 text-sm',
        lg: 'p-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const iconVariants = cva('flex-shrink-0', {
  variants: {
    variant: {
      default: 'text-foreground',
      success: 'text-success',
      error: 'text-destructive',
      warning: 'text-warning',
      info: 'text-info',
    },
    size: {
      default: 'h-5 w-5',
      sm: 'h-4 w-4',
      lg: 'h-6 w-6',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

const getVariantIcon = (variant: 'default' | 'success' | 'error' | 'warning' | 'info') => {
  switch (variant) {
    case 'success':
      return CheckCircle;
    case 'error':
      return AlertCircle;
    case 'warning':
      return AlertTriangle;
    case 'info':
      return Info;
    default:
      return Info;
  }
};

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
  showIcon?: boolean;
  closable?: boolean;
  closeLabel?: string;
}

// Helper functions to reduce complexity
const renderIcon = (
  variant: NonNullable<NotificationProps['variant']>,
  size: NotificationProps['size'],
  showIcon: boolean
) => {
  if (!showIcon) return null;

  const IconComponent = getVariantIcon(variant);
  return <IconComponent className={cn(iconVariants({ variant, size }))} aria-hidden="true" />;
};

const renderContent = (
  title: string | undefined,
  description: string | undefined,
  children: React.ReactNode
) => (
  <div className="flex-1 space-y-1">
    {title && <div className="font-medium leading-none tracking-tight">{title}</div>}
    {description && <div className="text-sm opacity-90 leading-relaxed">{description}</div>}
    {children && !title && !description && <div className="leading-relaxed">{children}</div>}
  </div>
);

const renderCloseButton = (
  closable: boolean,
  onClose: (() => void) | undefined,
  size: NotificationProps['size'],
  closeLabel?: string
) => {
  if (!closable || !onClose) return null;

  return (
    <button
      type="button"
      onClick={onClose}
      className={cn(
        'flex-shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'
      )}
      aria-label={closeLabel || 'Close notification'}
    >
      <X className="h-full w-full" />
    </button>
  );
};

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      title,
      description,
      onClose,
      showIcon = true,
      closable = true,
      closeLabel,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant, size }), className)}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        {...props}
      >
        {renderIcon(variant || 'default', size, showIcon)}
        {renderContent(title, description, children)}
        {renderCloseButton(closable, onClose, size, closeLabel)}
      </div>
    );
  }
);

Notification.displayName = 'Notification';

export { Notification, notificationVariants };
