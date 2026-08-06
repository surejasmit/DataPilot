import { useState, useEffect } from 'react'
import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Link } from '@/components/ui/Link'
import { api, clearAuthToken } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'

export function UserProfileDropdown() {
  const navigate = useNavigate()
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)

  useEffect(() => {
    api.auth.getMe()
      .then(data => setUser({ name: data.name, email: data.email }))
      .catch(() => {})
  }, [])

  const displayName = user?.name || 'User'
  const displayEmail = user?.email || ''
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const handleSignOut = () => {
    clearAuthToken()
    navigate('/signin')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-auto gap-2 px-3" aria-label="User menu">
          <Avatar size="sm" alt={displayName} fallback={initials} />
          <span className="hidden sm:inline-block text-sm font-medium text-fg-0">{displayName}</span>
          <ChevronDown className="w-4 h-4 hidden sm:inline-block text-fg-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="right" className="w-56 p-0">
        <DropdownMenuLabel className="px-4 py-3 border-b border-border-1">
          <div className="flex items-center gap-3">
            <Avatar size="md" alt={displayName} fallback={initials} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-0 truncate">{displayName}</p>
              <p className="text-xs text-fg-2 truncate">{displayEmail}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link to="/profile" className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-fg-0 hover:bg-bg-2 rounded-md transition-colors">
            <User className="w-4 h-4 text-fg-2" />
            My Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link to="/settings" className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-fg-0 hover:bg-bg-2 rounded-md transition-colors">
            <Settings className="w-4 h-4 text-fg-2" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-md transition-colors"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
