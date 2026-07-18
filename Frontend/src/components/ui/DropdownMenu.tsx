import React, { createContext, useContext, useState, useRef, useEffect, type ReactNode, forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { X, ChevronDown } from 'lucide-react'

interface DropdownMenuContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
  contentRef: React.RefObject<HTMLDivElement | null>
}

const DropdownMenuContext = createContext<DropdownMenuContextType | null>(null)

function useDropdownMenu() {
  const context = useContext(DropdownMenuContext)
  if (!context) {
    throw new Error('DropdownMenu components must be used within DropdownMenu')
  }
  return context
}

interface DropdownMenuProps {
  children: ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, triggerRef, contentRef }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { isOpen, setIsOpen, triggerRef } = useDropdownMenu()

    return (
      <button
        ref={(el) => {
          triggerRef.current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-medium text-fg-1 hover:text-fg-0 transition-colors',
          className
        )}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        {...props}
      >
        {children}
        <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
      </button>
    )
  }
)

DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  align?: 'left' | 'right'
  sideOffset?: number
}

export const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ className, children, align = 'right', sideOffset = 8, ...props }, ref) => {
    const { isOpen, setIsOpen, contentRef } = useDropdownMenu()

    if (!isOpen) return null

    return (
      <div
        ref={(el) => {
          contentRef.current = el
          if (typeof ref === 'function') ref(el)
          else if (ref) ref.current = el
        }}
        className={cn(
          'fixed z-50 min-w-[180px] bg-bg-1 border border-border-1 rounded-xl shadow-lg p-1 animate-scale-in',
          align === 'right' ? 'right-0' : 'left-0',
          className
        )}
        role="menu"
        {...props}
      >
        {children}
      </div>
    )
  }
)

DropdownMenuContent.displayName = 'DropdownMenuContent'

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  inset?: boolean
  shortcut?: string
  icon?: ReactNode
  destructive?: boolean
}

export const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, children, inset, shortcut, icon, destructive, onClick, ...props }, ref) => {
    const { setIsOpen } = useDropdownMenu()

    return (
      <button
        ref={ref}
        className={cn(
          'relative flex w-full items-center gap-2 px-3 py-2 text-sm text-fg-0 transition-colors',
          'rounded-md hover:bg-bg-2 focus:outline-none focus:bg-bg-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          inset && 'pl-8',
          destructive && 'text-error focus:bg-error/10',
          className
        )}
        onClick={(e) => {
          onClick?.(e)
          setIsOpen(false)
        }}
        role="menuitem"
        {...props}
      >
        {icon && <span className="flex h-4 w-4 items-center justify-center">{icon}</span>}
        <span className="flex-1 text-left">{children}</span>
        {shortcut && <span className="ml-auto text-xs text-fg-3 font-mono">{shortcut}</span>}
      </button>
    )
  }
)

DropdownMenuItem.displayName = 'DropdownMenuItem'

interface DropdownMenuSeparatorProps extends React.HTMLAttributes<HTMLHRElement> {}

export const DropdownMenuSeparator = forwardRef<HTMLHRElement, DropdownMenuSeparatorProps>(
  ({ className, ...props }, ref) => (
    <hr
      ref={ref}
      className={cn('h-px bg-border-1 my-1', className)}
      role="separator"
      {...props}
    />
  )
)

DropdownMenuSeparator.displayName = 'DropdownMenuSeparator'

interface DropdownMenuLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  inset?: boolean
}

export const DropdownMenuLabel = forwardRef<HTMLDivElement, DropdownMenuLabelProps>(
  ({ className, inset, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('px-3 py-1.5 text-xs font-medium text-fg-2 uppercase tracking-wider', inset && 'pl-8', className)}
      {...props}
    >
      {children}
    </div>
  )
)

DropdownMenuLabel.displayName = 'DropdownMenuLabel'

interface DropdownMenuGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export const DropdownMenuGroup = forwardRef<HTMLDivElement, DropdownMenuGroupProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn('space-y-0.5', className)} {...props}>
      {children}
    </div>
  )
)

DropdownMenuGroup.displayName = 'DropdownMenuGroup'

interface DropdownMenuShortcutProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: ReactNode
}

export const DropdownMenuShortcut = forwardRef<HTMLSpanElement, DropdownMenuShortcutProps>(
  ({ className, children, ...props }, ref) => (
    <span ref={ref} className={cn('ml-auto text-xs text-fg-3 font-mono', className)} {...props}>
      {children}
    </span>
  )
)

DropdownMenuShortcut.displayName = 'DropdownMenuShortcut'