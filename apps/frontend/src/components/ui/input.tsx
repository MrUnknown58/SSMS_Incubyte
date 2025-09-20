import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all duration-200',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
