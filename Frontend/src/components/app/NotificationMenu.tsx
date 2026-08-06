import { useState } from 'react'
import { Bell, X, Mail, AlertTriangle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  description: string
  time: string
  read: boolean
}

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'success',
    title: 'Project "Sales Analysis" completed',
    description: 'Dashboard generated with 12 insights',
    time: '5 min ago',
    read: false,
  },
  {
    id: '2',
    type: 'info',
    title: 'New dataset uploaded',
    description: 'customer_data.csv (2.4 MB) processed',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '3',
    type: 'warning',
    title: 'Storage 85% full',
    description: 'Consider archiving old projects',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '4',
    type: 'error',
    title: 'Import failed',
    description: 'products.xlsx - invalid format',
    time: 'Yesterday',
    read: true,
  },
  {
    id: '5',
    type: 'success',
    title: 'Insight generated',
    description: 'Correlation found between price and churn',
    time: '2 days ago',
    read: true,
  },
]

const typeIcons = {
  info: <Mail className="w-4 h-4 text-info" />,
  success: <CheckCircle className="w-4 h-4 text-success" />,
  warning: <AlertTriangle className="w-4 h-4 text-warning" />,
  error: <X className="w-4 h-4 text-error" />,
}

export function NotificationMenu() {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-error text-[10px] font-medium flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="right" className="w-80 max-w-[380px] p-0">
        <DropdownMenuLabel className="flex items-center justify-between px-4 py-3 border-b border-border-1">
          <span className="font-medium text-fg-0">Notifications</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs text-fg-2 hover:text-fg-0" onClick={handleMarkAllRead}>
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-fg-2">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={cn(
                  'p-4 gap-3 hover:bg-bg-2 group',
                  !notification.read && 'bg-accent-bg/20'
                )}
                onClick={() => handleDismiss(notification.id)}
                inset
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center">
                  {typeIcons[notification.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium text-fg-0', !notification.read && 'font-semibold')}>
                    {notification.title}
                  </p>
                  <p className="text-xs text-fg-2 mt-0.5 truncate">{notification.description}</p>
                  <p className="text-[11px] text-fg-3 mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 rounded-full bg-accent flex-shrink-0 mt-1" />
                )}
              </DropdownMenuItem>
            ))
          )}
        </div>

        <DropdownMenuSeparator />
        <DropdownMenuItem className="px-4 py-3 text-center text-sm text-fg-2 hover:text-fg-0 cursor-default" onClick={() => {}}>
          All notifications shown
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
