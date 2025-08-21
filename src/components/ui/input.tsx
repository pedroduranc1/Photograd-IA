import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { TextInput, TextInputProps as RNTextInputProps } from 'react-native';

import { cn } from '~/src/utils/utils';

const inputVariants = cva(
  'web:flex h-10 native:h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-sm native:text-base native:leading-[1.25] text-foreground placeholder:text-muted-foreground web:ring-offset-background file:border-0 file:bg-transparent file:text-foreground file:text-sm file:font-medium web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2 web:disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        destructive: 'border-destructive web:focus-visible:ring-destructive',
      },
      size: {
        default: 'h-10 native:h-12',
        sm: 'h-9 native:h-10',
        lg: 'h-11 native:h-14',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface InputProps extends RNTextInputProps, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <TextInput
        ref={ref}
        className={cn(inputVariants({ variant, size, className }))}
        placeholderTextColor={'hsl(var(--muted-foreground))'}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };