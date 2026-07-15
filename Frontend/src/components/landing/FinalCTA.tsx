import { Link } from 'react-router-dom'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { ArrowRight } from 'lucide-react'

export function FinalCTA() {
  const sectionRef = useRef<HTMLSectionElement>(null)
  const isVisible = useIntersectionObserver(sectionRef)
  const prefersReduced = useReducedMotion()

  return (
    <section
      id="get-started"
      ref={sectionRef}
      className="py-24 lg:py-32 px-6 relative overflow-hidden"
      aria-labelledby="cta-heading"
    >
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/5 rounded-full blur-[300px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-data-2/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-data-3/5 rounded-full blur-[200px]" />
      </div>

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          className="space-y-8"
          initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
          animate={isVisible && !prefersReduced ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-bg border border-accent/30 text-accent text-sm font-medium">
            Ready to start?
          </span>

          <h2 id="cta-heading" className="text-4xl md:text-5xl lg:text-6xl font-light text-fg-0 tracking-tight leading-[1.05]">
            Your data already contains the story.
            <br />
            <span className="font-medium">DataPilot helps you find it.</span>
          </h2>

          <p className="text-lg text-fg-1 max-w-2xl mx-auto leading-relaxed">
            Upload a CSV. Get a quality profile. Fix issues with control. Discover patterns.
            Build dashboards. Ask questions. All backed by real calculations — not guesses.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto group">
              <Link to="/signup">
                Create Your Workspace
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
              <Link to="/signin">Sign In</Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-fg-2 pt-8 border-t border-border-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              Free tier available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              No credit card
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-data-2" />
              Cancel anytime
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}