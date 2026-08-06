import { Link } from 'react-router-dom'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border-1 bg-bg-1 py-12 px-6" role="contentinfo">
      <div className="mx-auto max-w-[1400px]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-fg-0 font-semibold text-lg tracking-tight">
            <svg
              className="w-6 h-6 text-accent"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
            >
              <rect width="32" height="32" rx="6" fill="currentColor" />
              <path
                d="M8 10h16M8 16h12M8 22h8"
                stroke="#0a0b0d"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span>DataPilot AI</span>
          </div>

          <nav className="flex flex-wrap items-center justify-center gap-6" aria-label="Footer navigation">
            <Link to="/" className="text-sm text-fg-2 hover:text-fg-0 transition-colors">
              Product
            </Link>
            <Link to="#workflow" className="text-sm text-fg-2 hover:text-fg-0 transition-colors">
              Workflow
            </Link>
            <Link to="/signin" className="text-sm text-fg-2 hover:text-fg-0 transition-colors">
              Sign In
            </Link>
            <Link to="/signup" className="text-sm font-medium text-accent hover:text-accent-dim transition-colors">
              Get Started
            </Link>
          </nav>

          <p className="text-sm text-fg-3">
            © {currentYear} DataPilot AI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}