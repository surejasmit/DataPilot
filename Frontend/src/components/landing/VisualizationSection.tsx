import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  PieChart,
  Layout,
  Maximize,
  ArrowUpRight,
  ArrowDownRight,
  Grid,
  Activity,
} from 'lucide-react'

interface ChartRule {
  title: string
  description: string
  columns: string[]
  chartType: string
  icon: React.ElementType
  color: string
  example: React.ReactNode
}

const chartRules: ChartRule[] = [
  {
    title: 'Time Series',
    description: 'Date/Time + Numeric → Line chart with trend',
    columns: ['Date', 'Revenue'],
    chartType: 'Line Chart',
    icon: Activity,
    color: 'data-2',
    example: (
      <svg viewBox="0 0 200 80" className="w-full h-24" aria-hidden="true">
        <defs>
          <linearGradient id="vizLineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-data-2)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-data-2)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M10 65 Q30 45 50 40 T90 25 T130 30 T170 18 T190 15" stroke="var(--color-data-2)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 65 Q30 45 50 40 T90 25 T130 30 T170 18 T190 15 L190 65 L10 65 Z" fill="url(#vizLineGrad)" />
        <circle cx="50" cy="40" r="3" fill="var(--color-data-2)" />
        <circle cx="90" cy="25" r="3" fill="var(--color-data-2)" />
        <circle cx="130" cy="30" r="3" fill="var(--color-data-2)" />
        <circle cx="170" cy="18" r="3" fill="var(--color-data-2)" />
      </svg>
    ),
  },
  {
    title: 'Category Comparison',
    description: 'Category + Numeric → Bar chart (horizontal for many)',
    columns: ['Region', 'Revenue'],
    chartType: 'Bar Chart',
    icon: BarChart3,
    color: 'data-1',
    example: (
      <svg viewBox="0 0 200 80" className="w-full h-24" aria-hidden="true">
        <rect x="20" y="30" width="50" height="35" fill="var(--color-data-1)" rx="2" />
        <rect x="80" y="45" width="50" height="20" fill="var(--color-data-1)" rx="2" opacity="0.7" />
        <rect x="140" y="50" width="50" height="15" fill="var(--color-data-1)" rx="2" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: 'Distribution',
    description: 'Single Numeric → Histogram with KDE overlay',
    columns: ['Revenue'],
    chartType: 'Histogram',
    icon: Grid,
    color: 'data-3',
    example: (
      <svg viewBox="0 0 200 80" className="w-full h-24" aria-hidden="true">
        <rect x="15" y="45" width="18" height="20" fill="var(--color-data-3)" rx="1" />
        <rect x="38" y="35" width="18" height="30" fill="var(--color-data-3)" rx="1" />
        <rect x="61" y="25" width="18" height="40" fill="var(--color-data-3)" rx="1" />
        <rect x="84" y="20" width="18" height="45" fill="var(--color-data-3)" rx="1" />
        <rect x="107" y="30" width="18" height="35" fill="var(--color-data-3)" rx="1" />
        <rect x="130" y="40" width="18" height="25" fill="var(--color-data-3)" rx="1" />
        <rect x="153" y="50" width="18" height="15" fill="var(--color-data-3)" rx="1" />
        <rect x="176" y="60" width="18" height="5" fill="var(--color-data-3)" rx="1" />
      </svg>
    ),
  },
  {
    title: 'Relationship',
    description: 'Numeric + Numeric → Scatter with correlation',
    columns: ['Units', 'Revenue'],
    chartType: 'Scatter Plot',
    icon: Maximize,
    color: 'data-4',
    example: (
      <svg viewBox="0 0 200 80" className="w-full h-24" aria-hidden="true">
        <circle cx="30" cy="60" r="3" fill="var(--color-data-4)" />
        <circle cx="50" cy="55" r="3" fill="var(--color-data-4)" />
        <circle cx="70" cy="45" r="3" fill="var(--color-data-4)" />
        <circle cx="90" cy="35" r="3" fill="var(--color-data-4)" />
        <circle cx="110" cy="30" r="3" fill="var(--color-data-4)" />
        <circle cx="130" cy="25" r="3" fill="var(--color-data-4)" />
        <circle cx="150" cy="20" r="3" fill="var(--color-data-4)" />
        <circle cx="170" cy="15" r="3" fill="var(--color-data-4)" />
        <line x1="20" y1="70" x2="180" y2="10" stroke="var(--color-data-4)" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
      </svg>
    ),
  },
  {
    title: 'Proportion',
    description: 'Category → Donut or stacked bar for parts-of-whole',
    columns: ['Product'],
    chartType: 'Donut Chart',
    icon: PieChart,
    color: 'data-5',
    example: (
      <svg viewBox="0 0 200 80" className="w-full h-24" aria-hidden="true">
        <circle cx="100" cy="40" r="25" fill="none" stroke="var(--color-data-5)" strokeWidth="15" strokeDasharray="157" strokeDashoffset="0" />
        <circle cx="100" cy="40" r="25" fill="none" stroke="var(--color-data-2)" strokeWidth="15" strokeDasharray="157" strokeDashoffset="78" />
        <circle cx="100" cy="40" r="25" fill="none" stroke="var(--color-data-3)" strokeWidth="15" strokeDasharray="157" strokeDashoffset="120" />
        <circle cx="100" cy="40" r="25" fill="none" stroke="var(--color-data-1)" strokeWidth="15" strokeDasharray="157" strokeDashoffset="145" />
      </svg>
    ),
  },
  {
    title: 'Key Metric',
    description: 'Single aggregate → KPI card with sparkline',
    columns: ['Total Revenue'],
    chartType: 'KPI Card',
    icon: Layout,
    color: 'accent',
    example: (
      <svg viewBox="0 0 200 80" className="w-full h-24" aria-hidden="true">
        <rect x="20" y="10" width="160" height="60" rx="8" fill="var(--color-accent-bg)" stroke="var(--color-accent)" strokeWidth="1.5" />
        <text x="100" y="40" textAnchor="middle" fill="var(--color-accent)" fontFamily="monospace" fontSize="14" fontWeight="600">$2.4M</text>
        <path d="M40 55 Q70 45 100 40 T160 35" stroke="var(--color-accent)" strokeWidth="2" fill="none" opacity="0.7" />
      </svg>
    ),
  },
]

export function VisualizationSection() {
  const sectionRef = useRef<HTMLSectionElement>(null)
  const isVisible = useIntersectionObserver(sectionRef)
  const prefersReduced = useReducedMotion()

  return (
    <section
      id="visualization"
      ref={sectionRef}
      className="py-24 lg:py-32 px-6"
      aria-labelledby="viz-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-bg border border-accent/30 text-accent text-sm font-medium mb-4">
            Smart Chart Selection
          </span>
          <h2 id="viz-heading" className="text-3xl md:text-4xl lg:text-5xl font-light text-fg-0 tracking-tight">
            Dashboards that <span className="font-medium">design themselves</span>
          </h2>
          <p className="mt-4 text-lg text-fg-1 max-w-2xl mx-auto">
            Column types drive visualization choice. Time + numeric → line. Category + numeric → bar.
            Single numeric → histogram. Two numeric → scatter. All editable — add, remove, resize, retype.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chartRules.map((rule, index) => {
            const Icon = rule.icon
            return (
              <motion.article
                key={rule.title}
                className="group bg-bg-1 border border-border-1 rounded-xl p-6 transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
                initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
                animate={isVisible && !prefersReduced ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${rule.color}/15 text-${rule.color}`)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded', `bg-${rule.color}/20 text-${rule.color}`)}>
                        {rule.chartType}
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-fg-0 mb-2 group-hover:text-accent transition-colors">
                  {rule.title}
                </h3>

                <p className="text-sm text-fg-1 mb-4 leading-relaxed">
                  {rule.description}
                </p>

                <div className="mb-4 p-3 bg-bg-2 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-fg-2 mb-2">
                    <span className="font-mono text-fg-3">Columns:</span>
                    {rule.columns.map((col, i) => (
                      <span key={col} className="flex items-center gap-1">
                        <code className="px-1.5 py-0.5 bg-bg-1 text-fg-0 rounded text-xs font-mono">{col}</code>
                        {i < rule.columns.length - 1 && <span className="text-fg-3">+</span>}
                      </span>
                    ))}
                  </div>
                  <div className="relative h-24 bg-bg-1 rounded border border-border-1">
                    {rule.example}
                  </div>
                </div>

                <div className="pt-4 border-t border-border-1 text-xs text-fg-2">
                  <span className="font-mono text-fg-3">Auto-applied when:</span>{' '}
                  <code className="px-1.5 py-0.5 bg-bg-2 text-fg-0 rounded">{rule.columns.join(' + ')}</code>
                </div>
              </motion.article>
            )
          })}
        </div>

        <div className="mt-16">
          <div className="bg-bg-1 border border-border-1 rounded-2xl p-6 lg:p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl md:text-3xl font-light text-fg-0 mb-4">
                  Fully editable — <span className="font-medium">your dashboard, your rules</span>
                </h3>
                <p className="text-fg-1 mb-6 leading-relaxed">
                  The generated dashboard is a starting point. Every widget is a live component you can
                  customize without leaving the interface.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: ArrowUpRight, label: 'Drag to reposition', color: 'data-1' },
                    { icon: Maximize, label: 'Resize freely', color: 'data-2' },
                    { icon: BarChart3, label: 'Change chart type', color: 'data-3' },
                    { icon: Grid, label: 'Swap columns', color: 'data-4' },
                    { icon: Activity, label: 'Add annotations', color: 'data-5' },
                    { icon: ArrowDownRight, label: 'Export PNG/PDF', color: 'accent' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-bg-2 rounded-lg">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', `bg-${item.color}/15 text-${item.color}`)}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm text-fg-1">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="bg-bg-0 border border-border-1 rounded-xl p-4 aspect-square">
                  <div className="grid grid-cols-2 gap-3 h-full">
                    <div className="col-span-2 row-span-2 bg-bg-2 rounded-lg border border-border-1 p-2 relative">
                      <div className="absolute top-2 right-2 flex gap-1">
                        <div className="w-2 h-2 rounded bg-fg-3" />
                        <div className="w-2 h-2 rounded bg-fg-3" />
                      </div>
                      <div className="text-center text-xs text-fg-2 h-full flex items-center justify-center">
                        Revenue Trend (Line)
                      </div>
                    </div>
                    <div className="bg-bg-2 rounded-lg border border-border-1 p-2">
                      <div className="text-center text-xs text-fg-2 h-full flex items-center justify-center">
                        Region Bar Chart
                      </div>
                    </div>
                    <div className="bg-bg-2 rounded-lg border border-border-1 p-2">
                      <div className="text-center text-xs text-fg-2 h-full flex items-center justify-center">
                        Product Donut
                      </div>
                    </div>
                    <div className="bg-accent-bg border-accent/30 border rounded-lg p-2">
                      <div className="text-center text-xs text-accent h-full flex items-center justify-center">
                        Total Revenue KPI
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}