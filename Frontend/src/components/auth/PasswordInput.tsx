import { forwardRef, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'
import { Eye, EyeOff, Check } from 'lucide-react'

export interface PasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const [showPassword, setShowPassword] = useState(false)
    const [hasContent, setHasContent] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasContent(e.target.value.length > 0)
      props.onChange?.(e)
    }

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
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={showPassword ? 'text' : 'password'}
            className={cn(
              'w-full px-3.5 py-2.5 bg-bg-2 border border-border-1 text-fg-0 placeholder-fg-3',
              'rounded-md transition-colors duration-200 pr-12',
              'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent focus:ring-offset-2 focus:ring-offset-bg-0',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'invalid:border-error invalid:focus:ring-error',
              error && 'border-error focus:ring-error',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            onChange={handleChange}
            {...props}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-fg-3 hover:text-fg-1 transition-colors rounded"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          {hasContent && !error && (
            <div className="absolute right-10 top-1/2 -translate-y-1/2 text-success">
              <Check className="w-4 h-4" />
            </div>
          )}
        </div>
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

PasswordInput.displayName = 'PasswordInput'