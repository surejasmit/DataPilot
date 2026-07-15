import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-fg-1 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full px-3.5 py-2.5 bg-bg-2 border border-border-1 text-fg-0 placeholder-fg-3',
            'rounded-md transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:ring-offset-2 focus:ring-offset-bg-0',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'invalid:border-error invalid:focus:ring-error',
            error && 'border-error focus:ring-error',
            className
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-error" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-fg-3">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'