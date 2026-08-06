import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  scrollbars?: 'auto' | 'always' | 'never'
  scrollbarSize?: number
  scrollbarMargin?: number
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, scrollbars = 'auto', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        <div
          className="h-full w-full overflow-auto scrollbar-thin"
          style={{
            scrollbarWidth: scrollbars === 'never' ? 'none' : 'thin',
            scrollbarColor: `${scrollbars === 'always' ? 'var(--color-border-2)' : 'transparent'} transparent`,
          }}
        >
          {children}
        </div>
      </div>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'