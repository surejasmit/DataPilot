import { User, Settings, LogOut, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Separator } from '@/components/ui/Separator'
import { Link } from '@/components/ui/Link'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'

export function UserProfileDropdown() {
  const user = {
    name: 'smit sureja',
    email: 'smitsureja472007@gmail.com',
    initials: 'AM',
    avatar: null,
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-9 w-auto gap-2 px-3" aria-label="User menu">
          <Avatar size="sm" alt={user.name} fallback={user.initials} src={user.avatar} />
          <span className="hidden sm:inline-block text-sm font-medium text-fg-0">{user.name}</span>
          <ChevronDown className="w-4 h-4 hidden sm:inline-block text-fg-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-0">
        <DropdownMenuLabel className="px-4 py-3 border-b border-border-1">
          <div className="flex items-center gap-3">
            <Avatar size="md" alt={user.name} fallback={user.initials} src={user.avatar} />
            <div className="min-w-0">
              <p className="text-sm font-medium text-fg-0 truncate">{user.name}</p>
              <p className="text-xs text-fg-2 truncate">{user.email}</p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild onClick={() => {}}>
          <Link className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-fg-0 hover:bg-bg-2 rounded-md transition-colors">
            <User className="w-4 h-4 text-fg-2" />
            My Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild onClick={() => {}}>
          <Link className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-fg-0 hover:bg-bg-2 rounded-md transition-colors">
            <Settings className="w-4 h-4 text-fg-2" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-error hover:bg-error/10 rounded-md transition-colors"
          onClick={() => {}}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}