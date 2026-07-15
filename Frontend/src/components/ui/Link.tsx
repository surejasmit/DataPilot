import { forwardRef, type AnchorHTMLAttributes } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: 'default' | 'muted' | 'accent'
  underline?: 'always' | 'hover' | 'never'
  to?: string
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  ({ className, variant = 'default', underline = 'hover', children, to, ...props }, ref) => {
    const variants = {
      default: 'text-fg-1 hover:text-fg-0',
      muted: 'text-fg-2 hover:text-fg-1',
      accent: 'text-accent hover:text-accent-dim',
    }

    const underlines = {
      always: 'underline underline-offset-2',
      hover: 'underline-offset-2 hover:underline',
      never: 'no-underline',
    }

    const classes = cn(
      'inline-flex items-center gap-1.5 text-sm font-medium transition-colors duration-200',
      variants[variant],
      underlines[underline],
      className
    )

    // Use React Router's Link for internal navigation (SPA), plain <a> for external URLs
    if (to) {
      return (
        <RouterLink
          ref={ref}
          to={to}
          className={classes}
          {...(props as any)}
        >
          {children}
        </RouterLink>
      )
    }

    return (
      <a
        ref={ref}
        href={props.href}
        className={classes}
        {...props}
      >
        {children}
      </a>
    )
  }
)

Link.displayName = 'Link'