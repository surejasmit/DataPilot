import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  asChild?: boolean
  children: ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, asChild, children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-0 disabled:opacity-50 disabled:cursor-not-allowed'

    const variants = {
      primary: 'bg-accent text-bg-0 hover:bg-accent-dim active:bg-accent/90 shadow-md shadow-accent/20',
      secondary: 'bg-bg-3 text-fg-0 border border-border-1 hover:bg-bg-2 hover:border-border-2 active:bg-bg-1',
      ghost: 'text-fg-1 hover:text-fg-0 hover:bg-bg-2 active:bg-bg-3',
      outline: 'border border-border-2 text-fg-0 hover:border-accent hover:text-accent hover:bg-accent-bg active:bg-accent/10',
    }

    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-sm',
      md: 'px-4 py-2 text-base gap-2 rounded-md',
      lg: 'px-6 py-2.5 text-base gap-2.5 rounded-lg',
    }

    if (asChild) {
      return (
        <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
          {children}
        </span>
      )
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'