import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-google-blue focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default:
          'bg-google-blue text-white hover:bg-google-blue-dark shadow-sm hover:shadow-md active:scale-[0.98]',
        destructive:
          'bg-google-red text-white hover:bg-error-2 shadow-sm hover:shadow-md active:scale-[0.98]',
        outline:
          'border border-light-4 bg-white text-text-primary hover:bg-light-2 hover:border-google-blue active:scale-[0.98]',
        secondary:
          'bg-light-2 text-text-primary hover:bg-light-3 active:scale-[0.98]',
        ghost:
          'text-text-primary hover:bg-light-2 active:scale-[0.98]',
        link: 'text-google-blue underline-offset-4 hover:underline hover:text-google-blue-dark',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
