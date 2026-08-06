import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Home, Search, RefreshCw, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-bg-0">
      <div className="text-center max-w-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-2xl bg-accent-bg/50 border border-accent/30 flex items-center justify-center">
            <Search className="w-12 h-12 text-accent/50" />
          </div>

          <h1 className="text-6xl font-light text-fg-0 mb-2">404</h1>
          <h2 className="text-2xl font-medium text-fg-0 mb-4">Page Not Found</h2>
          <p className="text-fg-1 mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved. 
            Let's get you back on track.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" onClick={() => window.location.href = '/dashboard'}>
              <Home className="w-5 h-5 mr-2" />
              Go to Dashboard
            </Button>
            <Button asChild variant="outline" size="lg" onClick={() => window.history.back()}>
              <ArrowLeft className="w-5 h-5 mr-2" />
              Go Back
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 space-y-4"
        >
          <p className="text-fg-2 text-sm">Or explore these sections:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { label: 'Dashboard', href: '/dashboard', icon: Home },
              { label: 'Projects', href: '/projects', icon: Search },
              { label: 'Insights', href: '/insights', icon: RefreshCw },
              { label: 'Ask AI', href: '/ask-ai', icon: Search },
            ].map(item => (
              <Button
                key={item.label}
                asChild
                variant="ghost"
                size="sm"
                className="gap-1"
              >
                <Link to={item.href}>
                  <item.icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}