import { forwardRef, type LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'block text-sm font-medium text-fg-1',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
      </label>
    )
  }
)

Label.displayName = 'Label'