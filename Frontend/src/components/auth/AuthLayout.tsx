import { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  description: string
  /** Content rendered as a background visual behind the left panel (e.g. animated illustration) */
  backgroundVisual?: ReactNode
  /** Content rendered inline below the description on the left panel (e.g. demo credentials) */
  sideContent?: ReactNode
}

export function AuthLayout({ children, title, description, backgroundVisual, sideContent }: AuthLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-bg-0">
      {/* Ambient background blurs */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-success/5 rounded-full blur-[200px]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-8 lg:p-12 xl:p-16 relative z-10">
          {/* Background visual layer (absolutely positioned, behind text) */}
          {backgroundVisual && (
            <div className="absolute inset-0 overflow-hidden z-0" aria-hidden="true">
              {backgroundVisual}
            </div>
          )}

          {/* Logo */}
          <div className="relative z-10">
            <Link to="/" className="flex items-center gap-2 font-semibold text-xl text-fg-0 tracking-tight" aria-label="DataPilot AI Home">
              <svg className="w-7 h-7 text-accent" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <rect width="32" height="32" rx="6" fill="currentColor" />
                <path d="M8 10h16M8 16h12M8 22h8" stroke="#0a0b0d" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              <span>DataPilot AI</span>
            </Link>
          </div>

          {/* Title + description + inline side content */}
          <div className="flex-1 flex flex-col justify-end pb-8 relative z-10">
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-light text-fg-0 tracking-tight leading-[1.1]">
              {title}
            </h1>
            <p className="mt-3 text-base lg:text-lg text-fg-1 max-w-md leading-relaxed">
              {description}
            </p>

            {sideContent && (
              <div className="mt-6">
                {sideContent}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-sm text-fg-3 relative z-10">
            © {new Date().getFullYear()} DataPilot AI. All rights reserved.
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="lg:hidden mb-8">
              <Link to="/" className="flex items-center gap-2 font-semibold text-xl text-fg-0 tracking-tight" aria-label="DataPilot AI Home">
                <svg className="w-7 h-7 text-accent" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                  <rect width="32" height="32" rx="6" fill="currentColor" />
                  <path d="M8 10h16M8 16h12M8 22h8" stroke="#0a0b0d" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span>DataPilot AI</span>
              </Link>
            </div>

            <div className="bg-bg-1 border border-border-1 rounded-2xl p-6 lg:p-8">
              {/* Mobile title */}
              <div className="lg:hidden mb-6">
                <h1 className="text-2xl font-semibold text-fg-0 tracking-tight">{title}</h1>
                <p className="mt-1.5 text-sm text-fg-2">{description}</p>
              </div>
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}