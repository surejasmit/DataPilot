import React, { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  shape?: 'circle' | 'square'
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = 'md', shape = 'circle', ...props }, ref) => {
    const sizes = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-8 h-8 text-sm',
      md: 'w-10 h-10 text-base',
      lg: 'w-12 h-12 text-lg',
      xl: 'w-16 h-16 text-xl',
    }

    const shapes = {
      circle: 'rounded-full',
      square: 'rounded-lg',
    }

    const [imageError, setImageError] = React.useState(false)

    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }

    if (src && !imageError) {
      return (
        <div
          ref={ref}
          className={cn('relative inline-flex items-center justify-center overflow-hidden bg-bg-2', sizes[size], shapes[shape], className)}
          {...props}
        >
          <img
            src={src}
            alt={alt || ''}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover"
            aria-hidden="true"
          />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center bg-accent-bg text-accent font-medium select-none',
          sizes[size],
          shapes[shape],
          className
        )}
        {...props}
      >
        {fallback || (alt ? getInitials(alt) : '?')}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'