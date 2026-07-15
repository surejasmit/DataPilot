import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  size?: 'sm' | 'md'
}

export const Badge = ({ className, variant = 'default', size = 'md', children, ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-bg-3 text-fg-1 border border-border-1',
    success: 'bg-success-bg text-success border border-success/30',
    warning: 'bg-warning-bg text-warning border border-warning/30',
    error: 'bg-error-bg text-error border border-error/30',
    info: 'bg-info-bg text-info border border-info/30',
    accent: 'bg-accent-bg text-accent border border-accent/30',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}