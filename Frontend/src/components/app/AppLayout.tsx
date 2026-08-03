import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { SearchBar } from './SearchBar'
import { NotificationMenu } from './NotificationMenu'
import { UserProfileDropdown } from './UserProfileDropdown'
import { ThemeToggle } from './ThemeToggle'
import {
  Menu, X, LayoutDashboard, FolderKanban, Lightbulb, MessageSquare, BarChart3,
  Plus, Activity, Settings, User,
} from 'lucide-react'

interface NavItem {
  path: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface NavSection {
  label?: string
  items: NavItem[]
}

const navigationSections: NavSection[] = [
  {
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/projects', label: 'Projects', icon: FolderKanban },
      { path: '/projects/new', label: 'New Project', icon: Plus },
    ],
  },
  {
    label: 'Data & AI',
    items: [
      { path: '/insights', label: 'AI Insights', icon: Lightbulb },
      { path: '/ask-ai', label: 'AI Chat', icon: MessageSquare },
      { path: '/analytics', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Activity',
    items: [
      { path: '/activity', label: 'Activity', icon: Activity },
    ],
  },
  {
    label: 'Account',
    items: [
      { path: '/settings', label: 'Settings', icon: Settings },
      { path: '/profile', label: 'Profile', icon: User },
    ],
  },
]

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-bg-0">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-bg-1 border-r border-border-1 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        aria-label="Main navigation"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border-1">
            <svg className="w-7 h-7 text-accent" viewBox="0 0 32 32" fill="none" aria-hidden="true">
              <rect width="32" height="32" rx="6" fill="currentColor" />
              <path d="M8 10h16M8 16h12M8 22h8" stroke="#0a0b0d" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="font-semibold text-lg text-fg-0 tracking-tight">DataPilot AI</span>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" role="navigation">
            {navigationSections.map((section, sectionIdx) => (
              <div key={sectionIdx}>
                {section.label && (
                  <p className="px-3 mb-2 text-[11px] font-semibold text-fg-3 uppercase tracking-wider">
                    {section.label}
                  </p>
                )}
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.path)
                    const isNewProject = item.path === '/projects/new'
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                          active
                            ? 'bg-accent-bg text-accent border border-accent/30'
                            : isNewProject
                            ? 'text-accent hover:bg-accent-bg/50 border border-accent/20'
                            : 'text-fg-1 hover:text-fg-0 hover:bg-bg-2 border border-transparent'
                        )}
                        onClick={() => setSidebarOpen(false)}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="w-[18px] h-[18px] flex-shrink-0" aria-hidden="true" />
                        {item.label}
                      </NavLink>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="p-3 border-t border-border-1">
            <div className="px-3 py-2">
              <p className="text-[11px] text-fg-3">
                <span className="font-medium text-fg-2">2.4 GB</span> of 5 GB used
              </p>
              <div className="mt-1.5 h-1.5 bg-bg-2 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: '48%' }} />
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-bg-0/90 backdrop-blur-md border-b border-border-1">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center gap-4 flex-1 lg:hidden">
              <button
                className="p-2 text-fg-1 hover:text-fg-0 transition-colors rounded-md"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
                aria-expanded={sidebarOpen}
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <SearchBar />
            </div>

            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-xl">
              <SearchBar />
            </div>

            <div className="flex items-center gap-2 lg:gap-3">
              <ThemeToggle />
              <NotificationMenu />
              <UserProfileDropdown />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 xl:p-8 max-w-[1600px] w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
