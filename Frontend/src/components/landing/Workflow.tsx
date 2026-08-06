import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import {
  FileSpreadsheet,
  Search,
  Filter,
  Lightbulb,
  BarChart3,
  MessageSquare,
  ArrowRight,
  CheckCircle,
} from 'lucide-react'

const steps = [
  {
    number: '01',
    title: 'Upload Business Data',
    description: 'Drag a CSV or connect a source. Supports CSV, Excel, JSON, Parquet. DataPilot reads structure, infers types, computes statistics, and builds a quality profile — all locally first.',
    icon: FileSpreadsheet,
    color: 'data-1',
    details: ['Auto-detect delimiters & encoding', 'Infer 15+ data types', 'Row/column stats & distributions', 'Missing & duplicate counts'],
  },
  {
    number: '02',
    title: 'AI-Powered Analysis',
    description: 'Automated statistical profiling, quality assessment, and data validation. Every issue is explained with row-level evidence and actionable recommendations.',
    icon: Search,
    color: 'data-2',
    details: ['Missing value patterns', 'Exact & fuzzy duplicates', 'IQR & Z-score outliers', 'Schema validation rules'],
  },
  {
    number: '03',
    title: 'Interactive Cleaning',
    description: 'For each issue, DataPilot recommends a fix with reasoning. You preview the exact row changes, compare options, then confirm. Nothing applies without you.',
    icon: Filter,
    color: 'accent',
    details: ['Per-issue recommendations', 'Side-by-side preview', 'Versioned history (v1 → v2 → v3)', 'Rollback anytime'],
  },
  {
    number: '04',
    title: 'Business Insights',
    description: 'Discover KPIs, trends, anomalies, and segment differences. Statistical engine finds correlations and patterns. Each insight cites the exact calculation behind it.',
    icon: Lightbulb,
    color: 'data-3',
    details: ['Pearson/Spearman correlations', 'Time-series decompositions', 'Segment performance gaps', 'Anomaly scoring (isolation forest)'],
  },
  {
    number: '05',
    title: 'Visualize & Report',
    description: 'Column types drive chart selection: time+numeric → line, category+numeric → bar, single numeric → histogram. Export dashboards to PDF or share with your team.',
    icon: BarChart3,
    color: 'data-2',
    details: ['Smart chart type inference', 'Drag-drop grid layout', 'KPI cards for aggregates', 'Export to PNG/PDF/Embed'],
  },
  {
    number: '06',
    title: 'Ask Your Data',
    description: 'Type a question in plain English. DataPilot parses intent, generates safe Pandas/SQL, executes it, returns the computed answer with evidence. The SLM explains — it never guesses numbers.',
    icon: MessageSquare,
    color: 'data-4',
    details: ['NL → structured query', 'Execution sandbox', 'Cited row/column evidence', 'Auto-chart when useful'],
  },
]

const stepColors: Record<string, string> = {
  'data-1': 'bg-data-1',
  'data-2': 'bg-data-2',
  'data-3': 'bg-data-3',
  'data-4': 'bg-data-4',
  'data-5': 'bg-data-5',
  accent: 'bg-accent',
}

export function Workflow() {
  const sectionRef = useRef<HTMLElement>(null)
  const isVisible = useIntersectionObserver(sectionRef)
  const prefersReduced = useReducedMotion()
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)

  return (
    <section
      id="workflow"
      ref={sectionRef}
      className="py-24 lg:py-32 px-6 relative"
      aria-labelledby="workflow-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 id="workflow-heading" className="text-3xl md:text-4xl lg:text-5xl font-light text-fg-0 tracking-tight">
            How it works: <span className="font-medium">Data → Insight → Action</span>
          </h2>
          <p className="mt-4 text-lg text-fg-1 max-w-2xl mx-auto">
            Six connected stages. Each builds on the last. You stay in control at every step.
          </p>
        </div>

        <div className="relative">
          <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border-1 to-transparent -translate-x-1/2" aria-hidden="true" />

          <div className="space-y-8 lg:space-y-12">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0
              const Icon = step.icon
              const isExpanded = expandedIndex === index

              return (
                <motion.div
                  key={step.number}
                  className={cn(
                    'relative flex gap-6 lg:gap-10',
                    isLeft ? '' : 'flex-row-reverse'
                  )}
                  initial={prefersReduced ? {} : { opacity: 0, y: 30 }}
                  animate={isVisible && !prefersReduced ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  style={{ willChange: 'opacity, transform' }}
                >
                  <div
                    className={cn(
                      'flex-shrink-0 w-[80px] lg:w-[100px] relative z-10',
                      isLeft ? 'pr-4 text-right' : 'pl-4 text-left'
                    )}
                  >
                    <div
                      className={cn(
                        'relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl flex items-center justify-center mx-auto',
                        isLeft ? 'mr-auto' : 'ml-auto',
                        stepColors[step.color]
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="w-8 h-8 lg:w-9 lg:h-9 text-bg-0" />
                    </div>
                    <div className="absolute top-1/2 -translate-y-1/2 w-px h-full bg-border-1" aria-hidden="true">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 border-bg-0" style={{ backgroundColor: `var(--color-${step.color})` }} />
                    </div>
                    <span className={cn('absolute top-1/2 -translate-y-1/2 text-2xl font-mono font-bold text-fg-2', isLeft ? 'right-[-60px]' : 'left-[-60px]')}>
                      {step.number}
                    </span>
                  </div>

                  <div
                    className={cn(
                      'flex-1 lg:w-1/2 p-4 lg:p-6 bg-bg-1 border border-border-1 rounded-xl transition-all duration-300 cursor-pointer',
                      isLeft ? 'lg:ml-auto' : 'lg:mr-auto',
                      isExpanded && 'ring-2 ring-accent/50 shadow-lg shadow-accent/10'
                    )}
                    onClick={() => setExpandedIndex(isExpanded ? null : index)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpandedIndex(isExpanded ? null : index) } }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-bg-2 flex items-center justify-center">
                        <Icon className={cn('w-5 h-5', stepColors[step.color] + ' text-bg-0')} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-fg-0">{step.title}</h3>
                        <p className="mt-2 text-fg-1 text-sm leading-relaxed">{step.description}</p>

                        {isExpanded && (
                          <motion.ul
                            className="mt-4 space-y-2 pt-4 border-t border-border-1"
                            initial="hidden"
                            animate="visible"
                            variants={{
                              hidden: { opacity: 0, height: 0 },
                              visible: { opacity: 1, height: 'auto', transition: { staggerChildren: 0.05 } },
                            }}
                          >
                            {step.details.map((detail) => (
                              <motion.li
                                key={detail}
                                variants={{
                                  hidden: { opacity: 0, x: -10 },
                                  visible: { opacity: 1, x: 0 },
                                }}
                                className="flex items-center gap-2 text-sm text-fg-2"
                              >
                                <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', stepColors[step.color])} />
                                {detail}
                              </motion.li>
                            ))}
                          </motion.ul>
                        )}
                      </div>
                      <motion.div
                        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-fg-3"
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ArrowRight className="w-5 h-5" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )
            })}

            <div className="flex-shrink-0 w-[80px] lg:w-[100px] relative" aria-hidden="true">
              <div className="relative w-16 h-16 lg:w-20 lg:h-20 rounded-xl flex items-center justify-center mx-auto bg-bg-1 border border-border-1">
                <CheckCircle className="w-8 h-8 lg:w-9 lg:h-9 text-success" />
              </div>
              <span className="absolute top-1/2 -translate-y-1/2 right-[-60px] text-sm font-medium text-fg-2 whitespace-nowrap">Done</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
