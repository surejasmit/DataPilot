import { cn } from '@/lib/utils'

export interface SeparatorProps extends React.HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
}

export const Separator = ({ className, orientation = 'horizontal', ...props }: SeparatorProps) => (
  <hr
    className={cn(
      'bg-border-1 border-0',
      orientation === 'horizontal' ? 'w-full h-px my-6' : 'h-full w-px mx-6',
      className
    )}
    aria-orientation={orientation}
    {...props}
  />
)