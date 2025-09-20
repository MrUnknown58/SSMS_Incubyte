import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm',
  secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-medium focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200',
          variantClass[variant],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
