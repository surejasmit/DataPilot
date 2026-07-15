import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import { Badge, Link, Button } from '@/components/ui'
import {
  FileSpreadsheet,
  AlertTriangle,
  Wand2,
  Lightbulb,
  BarChart3,
  MessageSquare,
} from 'lucide-react'

const stages = [
  {
    title: 'Raw Dataset',
    subtitle: 'Upload & Profile',
    icon: (
      <FileSpreadsheet className="w-6 h-6 text-data-1" aria-hidden="true" />
    ),
    data: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="p-2 bg-bg-2 rounded">
            <p className="text-fg-2">Rows</p>
            <p className="font-mono text-fg-0 text-lg">12,480</p>
          </div>
          <div className="p-2 bg-bg-2 rounded">
            <p className="text-fg-2">Columns</p>
            <p className="font-mono text-fg-0 text-lg">14</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-fg-2">
          <Badge variant="info" size="sm">CSV</Badge>
          <Badge variant="default" size="sm">UTF-8</Badge>
          <Badge variant="default" size="sm">1.2 MB</Badge>
        </div>
      </div>
    ),
  },
  {
    title: 'Issues Detected',
    subtitle: 'Quality Profile',
    icon: (
      <AlertTriangle className="w-6 h-6 text-warning" aria-hidden="true" />
    ),
    data: (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-bg-2 rounded">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-error" />
            <span className="text-sm text-fg-1">Missing Values</span>
          </div>
          <span className="font-mono text-fg-0">124 (1.0%)</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-bg-2 rounded">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-warning" />
            <span className="text-sm text-fg-1">Duplicate Rows</span>
          </div>
          <span className="font-mono text-fg-0">18</span>
        </div>
        <div className="flex items-center justify-between p-3 bg-bg-2 rounded">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-info" />
            <span className="text-sm text-fg-1">Outliers (IQR)</span>
          </div>
          <span className="font-mono text-fg-0">42</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Cleaning Applied',
    subtitle: 'Interactive Fix',
    icon: (
      <Wand2 className="w-6 h-6 text-accent" aria-hidden="true" />
    ),
    data: (
      <div className="space-y-3">
        <div className="p-3 bg-accent-bg border border-accent/20 rounded">
          <p className="text-sm text-accent font-medium">Fill missing Age with Median</p>
          <p className="text-xs text-accent/70 mt-0.5">Recommended — distribution has outliers</p>
        </div>
        <div className="p-3 bg-bg-2 rounded">
          <p className="text-sm text-fg-1">Remove 18 duplicate rows</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-fg-2">
          <Badge variant="success" size="sm">v2 Created</Badge>
          <Badge variant="accent" size="sm">2 operations</Badge>
        </div>
      </div>
    ),
  },
  {
    title: 'Insight Generated',
    subtitle: 'Auto-Discovered',
    icon: (
      <Lightbulb className="w-6 h-6 text-data-3" aria-hidden="true" />
    ),
    data: (
      <div className="space-y-3">
        <div className="p-3 bg-bg-2 rounded border-l-3 border-accent">
          <p className="font-medium text-fg-0 text-sm">West region revenue increased 18.4%</p>
          <p className="text-xs text-fg-2 mt-0.5">{'vs. prior period · p < 0.01'}</p>
        </div>
        <div className="p-3 bg-bg-2 rounded border-l-3 border-data-2">
          <p className="font-medium text-fg-0 text-sm">Repeat customers generate 2.3× revenue</p>
          <p className="text-xs text-fg-2 mt-0.5">vs. one-time buyers</p>
        </div>
        <div className="p-3 bg-bg-2 rounded border-l-3 border-warning">
          <p className="font-medium text-fg-0 text-sm">March sales declined −12.3% vs. forecast</p>
          <p className="text-xs text-fg-2 mt-0.5">Anomaly detected · investigate</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Dashboard Built',
    subtitle: 'Auto-Generated',
    icon: (
      <BarChart3 className="w-6 h-6 text-data-2" aria-hidden="true" />
    ),
    data: (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          {['Revenue Trend', 'Region Comparison', 'Product Distribution', 'KPI Cards'].map((title) => (
            <div key={title} className="p-3 bg-bg-2 rounded text-center">
              <div className="w-full h-16 bg-bg-3 rounded flex items-center justify-center">
                <span className="text-xs text-fg-2">{title}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-fg-2 text-center">Editable · Exportable · Shareable</p>
      </div>
    ),
  },
  {
    title: 'Ask Your Data',
    subtitle: 'Natural Language',
    icon: (
      <MessageSquare className="w-6 h-6 text-data-4" aria-hidden="true" />
    ),
    data: (
      <div className="space-y-3">
        <div className="p-3 bg-bg-2 rounded">
          <p className="text-sm text-fg-1 italic">"Which region had the strongest growth?"</p>
        </div>
        <div className="p-3 bg-accent-bg border border-accent/20 rounded">
          <p className="font-medium text-fg-0 text-sm">West region: +18.4% growth</p>
          <p className="text-xs text-fg-2 mt-0.5">Calculated from v2 dataset · 3.2M rows analyzed</p>
        </div>
      </div>
    ),
  },
]

export function Hero() {
  const heroRef = useRef<HTMLSectionElement>(null)
  const prefersReduced = useReducedMotion()
  const [isVisible, setIsVisible] = useState(false)
  const [activeStage, setActiveStage] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    )
    if (heroRef.current) observer.observe(heroRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (prefersReduced) return
    const interval = setInterval(() => {
      setActiveStage((prev) => (prev + 1) % stages.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [prefersReduced])

  return (
    <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-success/5 rounded-full blur-[200px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-border-1/20 rounded-full" />
      </div>

      <div className="relative mx-auto max-w-[1400px] px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div className={cn('space-y-8', isVisible ? 'animate-fade-in-up' : 'opacity-0')}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-bg border border-accent/30 text-accent text-sm font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              New: Interactive Cleaning + Auto-Dashboards
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-light text-fg-0 tracking-tight leading-[1.05]">
              Turn messy datasets into{' '}
              <span className="font-medium">answers you can act on</span>
            </h1>

            <p className="text-lg md:text-xl text-fg-1 max-w-xl leading-relaxed">
              Upload a dataset. DataPilot profiles it, detects quality issues, recommends fixes you control,
              discovers patterns, generates dashboards, and answers questions — all backed by real calculations,
              not guesses.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Button asChild size="lg">
                <Link to="/signup">Start Analyzing</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a
                  href="#workflow"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  See How It Works
                </a>
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-sm text-fg-2 pt-4 border-t border-border-1">
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                No auto-modification of your data
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Versioned cleaning history
              </span>
              <span className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Calculated answers, not hallucinations
              </span>
            </div>
          </div>

          <div className={cn('relative', isVisible ? 'animate-fade-in-up delay-200' : 'opacity-0')}>
            <div className="bg-bg-0/80 backdrop-blur-md border border-border-1 rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border-1 bg-bg-1">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-error/60" />
                  <div className="w-3 h-3 rounded-full bg-warning/60" />
                  <div className="w-3 h-3 rounded-full bg-success/60" />
                </div>
                <div className="ml-4 text-xs text-fg-2 font-mono text-center flex-1">sales_2026.csv — 12,480 rows × 14 columns</div>
              </div>

              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {stages.map((stage, index) => (
                    <motion.div
                      key={stage.title}
                      className={cn('relative', index === activeStage ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0')}
                      initial={false}
                      animate={{ opacity: index === activeStage ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-xl bg-bg-2 flex items-center justify-center flex-shrink-0">
                            {stage.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold text-fg-0">{stage.title}</h3>
                            <p className="text-sm text-fg-2 mt-0.5">{stage.subtitle}</p>
                          </div>
                        </div>
                        <div className="ml-15">{stage.data}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 flex items-center justify-center gap-2" role="tablist" aria-label="Processing stages">
                  {stages.map((_, index) => (
                    <button
                      key={index}
                      role="tab"
                      aria-selected={index === activeStage}
                      aria-label={`Stage ${index + 1}: ${stages[index].title}`}
                      onClick={() => setActiveStage(index)}
                      className={cn(
                        'w-2.5 h-2.5 rounded-full transition-all duration-300',
                        index === activeStage
                          ? 'bg-accent w-8'
                          : 'bg-fg-3 hover:bg-fg-2'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

import { useState, useEffect } from 'react'