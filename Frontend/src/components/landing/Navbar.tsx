import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button, Link as UILink } from '@/components/ui'
import { useScrollY } from '@/hooks/useMedia'
import logo from '@/assets/logo.png'
const navItems = [
  { href: '#product', label: 'Product' },
  { href: '#workflow', label: 'Workflow' },
  { href: '#capabilities', label: 'Capabilities' },
]

export function Navbar() {
  const scrollY = useScrollY()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    setIsScrolled(scrollY > 20)
  }, [scrollY])

  const handleNavClick = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.getElementById(href.slice(1))
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }
    setIsMobileOpen(false)
  }

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-bg-0/90 backdrop-blur-md border-b border-border-1 shadow-sm'
          : 'bg-transparent'
      )}
      role="navigation"
      aria-label="Main navigation"
    >
      <nav className="mx-auto max-w-[1400px] px-6">
        <div className="flex items-center justify-between h-16 lg:h-18">
          <Link
            to="/"
            className="flex items-center gap-4 font-semibold text-xl text-fg-0 tracking-tight"
            aria-label="DataPilot AI Home"
          >
            <img
              src={logo}
              alt="DataPilot AI Logo"
              className="w-33 h-22 "
            />
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-2 text-xs text-fg-3 border-l border-border-1 pl-4">
              <span className="font-medium text-fg-2">Business Analytics Platform</span>
            </div>
            <div className="flex items-center gap-6">
              {navItems.map((item) => (
                <UILink
                  key={item.href}
                  to={item.href}
                  onClick={() => handleNavClick(item.href)}
                  className="text-sm font-medium text-fg-1 hover:text-fg-0 transition-colors"
                >
                  {item.label}
                </UILink>
              ))}
            </div>

            {location.pathname === '/' && (
              <>
                <UILink
                  to="/signin"
                  className="text-sm font-medium text-fg-1 hover:text-fg-0 transition-colors lg:hidden"
                >
                  Sign In
                </UILink>
                <Button asChild size="sm" className="lg:hidden w-full">
                  <Link to="/signup" onClick={() => setIsMobileOpen(false)}>
                    Get Started
                  </Link>
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            {location.pathname === '/' && (
              <>
                <UILink
                  to="/signin"
                  className="hidden lg:inline-flex text-sm font-medium text-fg-1 hover:text-fg-0 transition-colors"
                >
                  Sign In
                </UILink>
                <Button asChild size="sm">
                  <Link to="/signup">Get Started</Link>
                </Button>
              </>
            )}
            <button
              className="lg:hidden p-2 text-fg-1 hover:text-fg-0 transition-colors rounded-md"
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              aria-expanded={isMobileOpen}
              aria-controls="mobile-menu"
              aria-label={isMobileOpen ? 'Close menu' : 'Open menu'}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {isMobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <div
          id="mobile-menu"
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300 ease-out border-t border-border-1 bg-bg-0',
            isMobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="py-4 space-y-2 px-2">
            {navItems.map((item) => (
              <UILink
                key={item.href}
                to={item.href}
                className="block px-3 py-2 text-base font-medium text-fg-1 hover:text-fg-0 hover:bg-bg-1 rounded-md transition-colors"
                onClick={() => setIsMobileOpen(false)}
              >
                {item.label}
              </UILink>
            ))}
            <div className="pt-4 border-t border-border-1 flex flex-col gap-3">
              <UILink
                to="/signin"
                className="px-3 py-2 text-base font-medium text-fg-1 hover:text-fg-0"
                onClick={() => setIsMobileOpen(false)}
              >
                Sign In
              </UILink>
              <UILink
                to="/signup"
                className="btn-primary px-3 py-2 text-base font-medium text-center"
                onClick={() => setIsMobileOpen(false)}
              >
                Get Started
              </UILink>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
