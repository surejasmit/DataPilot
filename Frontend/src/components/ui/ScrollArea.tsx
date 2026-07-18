import { forwardRef, useImperativeHandle, useRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  scrollbars?: 'auto' | 'always' | 'never'
  scrollbarSize?: number
  scrollbarMargin?: number
}

export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className, children, scrollbars = 'auto', scrollbarSize = 8, scrollbarMargin = 0, ...props }, ref) => {
    const scrollAreaRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)

    useImperativeHandle(ref, () => ({
      scrollAreaRef,
      contentRef,
      scrollTo: (options: ScrollToOptions) => {
        contentRef.current?.scrollTo(options)
      },
    }))

    return (
      <div
        ref={scrollAreaRef}
        className={cn('relative overflow-hidden', className)}
        {...props}
      >
        <div
          ref={contentRef}
          className="h-full w-full overflow-auto scrollbar-thin"
          style={{
            scrollbarWidth: scrollbars === 'never' ? 'none' : 'thin',
            scrollbarColor: `${scrollbars === 'always' ? 'var(--color-border-2)' : 'transparent'} transparent`,
          }}
        >
          <style jsx>{`
            div::-webkit-scrollbar {
              width: ${scrollbarSize}px;
              height: ${scrollbarSize}px;
            }
            div::-webkit-scrollbar-track {
              background: var(--color-bg-0);
              margin: ${scrollbarMargin}px;
            }
            div::-webkit-scrollbar-thumb {
              background: var(--color-border-2);
              border-radius: ${scrollbarSize / 2}px;
              border: ${scrollbarSize / 2}px solid var(--color-bg-0);
            }
            div::-webkit-scrollbar-thumb:hover {
              background: var(--color-fg-3);
            }
            div::-webkit-scrollbar-corner {
              background: var(--color-bg-0);
            }
          `}</style>
          {children}
        </div>
      </div>
    )
  }
)

ScrollArea.displayName = 'ScrollArea'