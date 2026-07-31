import React, { forwardRef, createContext, useContext } from 'react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { cn } from '@/lib/utils'

interface RadioGroupContextValue {
  groupValue: string
  onValueChange: (value: string) => void
  name: string
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null)

interface RadioGroupProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  name?: string
  className?: string
}

const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(
  ({ className, value, onValueChange, children, name = 'radio-group', ...props }, ref) => (
    <RadioGroupPrimitive.Root
      ref={ref}
      className={cn('space-y-2', className)}
      value={value}
      onValueChange={onValueChange}
      {...props}
    >
      <legend className="sr-only">{name}</legend>
      <RadioGroupContext.Provider value={{ groupValue: value, onValueChange, name }}>
        {children}
      </RadioGroupContext.Provider>
    </RadioGroupPrimitive.Root>
  )
)

RadioGroup.displayName = 'RadioGroup'

interface RadioGroupItemProps {
  value: string
  children?: React.ReactNode
  className?: string
}

const RadioGroupItem = forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = useContext(RadioGroupContext)
    const checked = context?.groupValue === value

    const handleChange = () => {
      context?.onValueChange(value)
    }

    return (
      <label className={cn('flex items-start gap-3 cursor-pointer', className)}>
        <input
          ref={ref}
          type="radio"
          name={context?.name}
          checked={checked}
          onChange={handleChange}
          className={cn(
            'appearance-none w-4 h-4 border-2 rounded-full transition-all duration-200',
            'border-border-2 bg-transparent',
            'checked:border-accent checked:bg-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg-0',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          {...props}
        />
        {children && (
          <div className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-fg-0">{children}</span>
          </div>
        )}
      </label>
    )
  }
)

RadioGroupItem.displayName = 'RadioGroupItem'

export { RadioGroup, RadioGroupItem }