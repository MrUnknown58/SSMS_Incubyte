import * as React from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive';

const variantClass: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  destructive: 'bg-red-100 text-red-700',
};

export function Badge({
  className,
  variant = 'default',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: BadgeVariant }) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
        variantClass[variant],
        className
      )}
      {...props}
    />
  );
}
