import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { SearchBar } from './SearchBar'
import { NotificationMenu } from './NotificationMenu'
import { UserProfileDropdown } from './UserProfileDropdown'
import { ThemeToggle } from './ThemeToggle'
import { Menu, X, LayoutDashboard, FolderKanban, Lightbulb, MessageSquare, BarChart3 } from 'lucide-react'

const navigation = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/projects', label: 'Projects', icon: FolderKanban },
  { path: '/insights', label: 'Insights', icon: Lightbulb },
  { path: '/ask-ai', label: 'Ask AI', icon: MessageSquare },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
]

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="min-h-screen bg-bg-0">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-bg-1 border-r border-border-1 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-border-1">
            <svg className="w-8 h-8 text-accent" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="6" fill="currentColor" />
              <path d="M8 10h16M8 16h12M8 22h8" stroke="#0a0b0d" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-semibold text-xl text-fg-0 tracking-tight">DataPilot AI</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto" role="navigation">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path
              const Icon = item.icon
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-accent-bg text-accent border border-accent/30'
                      : 'text-fg-1 hover:text-fg-0 hover:bg-bg-2'
                  )}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-border-1 space-y-2">
            <NavLink
              to="/profile"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                location.pathname === '/profile'
                  ? 'bg-accent-bg text-accent border border-accent/30'
                  : 'text-fg-1 hover:text-fg-0 hover:bg-bg-2'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Profile
            </NavLink>
            <NavLink
              to="/settings"
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                location.pathname === '/settings'
                  ? 'bg-accent-bg text-accent border border-accent/30'
                  : 'text-fg-1 hover:text-fg-0 hover:bg-bg-2'
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Settings
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-bg-0/90 backdrop-blur-md border-b border-border-1">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Mobile menu button + Search */}
            <div className="flex items-center gap-4 flex-1 lg:hidden">
              <button
                className="p-2 text-fg-1 hover:text-fg-0 transition-colors rounded-md"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <SearchBar />
            </div>

            {/* Desktop: Logo (hidden) + Search */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-2xl mx-auto">
              <SearchBar />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              <ThemeToggle />
              <NotificationMenu />
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 xl:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}