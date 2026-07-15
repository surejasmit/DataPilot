import { useState, useEffect } from 'react'
import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import {
  MessageSquare,
  Search,
  Database,
  Zap,
  CheckCircle,
  BarChart3,
} from 'lucide-react'

interface DemoStep {
  step: number
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const demoSteps: DemoStep[] = [
  {
    step: 1,
    label: 'Understand',
    description: 'Parses "strongest growth" → compare regions by revenue growth rate (period-over-period).',
    icon: Search,
    color: 'data-2',
  },
  {
    step: 2,
    label: 'Query',
    description: 'Generates: df.groupby("region")["revenue"].sum().pct_change().idxmax() — safe, parameterized.',
    icon: Database,
    color: 'data-1',
  },
  {
    step: 3,
    label: 'Compute',
    description: 'Executes on v2 dataset. West: +18.4%, North: +5.2%, East: +1.2%, South: −2.1%.',
    icon: Zap,
    color: 'accent',
  },
  {
    step: 4,
    label: 'Explain',
    description: 'SLM receives computed result + evidence, produces natural language answer with citations.',
    icon: MessageSquare,
    color: 'data-3',
  },
]

const followUpQuestions = [
  'Why did West region outperform others?',
  'Show me the revenue trend for West region by month',
  'Which product drove the growth in West?',
  'Compare growth rates: new vs. repeat customers',
  'Was the growth statistically significant?',
]

export function AskDataSection() {
  const sectionRef = useRef<HTMLSectionElement>(null)
  const isVisible = useIntersectionObserver(sectionRef)
  const prefersReduced = useReducedMotion()
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (prefersReduced) return
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % demoSteps.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [prefersReduced])

  return (
    <section
      id="ask-data"
      ref={sectionRef}
      className="py-24 lg:py-32 px-6 relative bg-gradient-to-b from-transparent via-data-2-bg/20 to-transparent"
      aria-labelledby="ask-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-bg border border-accent/30 text-accent text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Natural Language Interface
          </span>
          <h2 id="ask-heading" className="text-3xl md:text-4xl lg:text-5xl font-light text-fg-0 tracking-tight">
            Ask your data <span className="font-medium">anything</span>
          </h2>
          <p className="mt-4 text-lg text-fg-1 max-w-2xl mx-auto">
            Type a question in plain English. DataPilot translates it to a structured query,
            executes it on your actual dataset, and returns the computed answer with evidence.
            The SLM explains — it never guesses numbers.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className={cn('space-y-6', isVisible && !prefersReduced ? 'animate-fade-in-left' : '')}>
            <div className="bg-bg-1 border border-border-1 rounded-xl p-6">
              <div className="mb-6 p-4 bg-bg-2 rounded-lg border border-border-1">
                <div className="flex items-center gap-3 mb-4">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <span className="font-mono text-fg-0 text-lg">"Which region had the strongest growth?"</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-fg-2 flex-wrap">
                  <Badge variant="info" size="sm">v2 dataset</Badge>
                  <Badge variant="default" size="sm">12,480 rows</Badge>
                  <Badge variant="accent" size="sm">Cleaned</Badge>
                </div>
              </div>

              <div className="space-y-3">
                {demoSteps.map((step, index) => {
                  const isActive = index === activeStep
                  const Icon = step.icon
                  return (
                    <motion.div
                      key={step.step}
                      className={cn(
                        'p-4 rounded-lg border transition-all duration-300 flex items-start gap-3',
                        isActive
                          ? 'border-accent/50 bg-accent-bg/30 ring-1 ring-accent/20'
                          : 'border-border-1 bg-bg-2'
                      )}
                      animate={{ opacity: isActive ? 1 : 0.6 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${step.color}/15 text-${step.color}`)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium px-2 py-0.5 rounded bg-bg-1 text-fg-2">
                            Step {step.step}
                          </span>
                          <span className={cn('text-xs font-semibold', `text-${step.color}`)}>
                            {step.label}
                          </span>
                          {isActive && (
                            <motion.span
                              className="w-2 h-2 rounded-full bg-accent"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </div>
                        <p className="text-sm text-fg-1">{step.description}</p>
                      </div>
                      <div className={cn('flex-shrink-0 w-8 h-8 flex items-center justify-center', isActive ? 'text-accent' : 'text-fg-3')}>
                        {isActive ? <CheckCircle className="w-5 h-5" /> : <span className="text-2xl font-mono">{step.step}</span>}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-border-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-fg-0">Result</span>
                  <Badge variant="success" size="sm">Calculated</Badge>
                </div>
                <div className="p-4 bg-bg-2 rounded-lg">
                  <p className="font-medium text-fg-0 mb-2">West region had the strongest growth at 18.4%</p>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div className="text-center p-2 bg-bg-1 rounded">
                      <div className="font-mono text-fg-0">West</div>
                      <div className="text-success text-xs">+18.4%</div>
                    </div>
                    <div className="text-center p-2 bg-bg-1 rounded">
                      <div className="font-mono text-fg-0">North</div>
                      <div className="text-fg-1 text-xs">+5.2%</div>
                    </div>
                    <div className="text-center p-2 bg-bg-1 rounded">
                      <div className="font-mono text-fg-0">East</div>
                      <div className="text-fg-1 text-xs">+1.2%</div>
                    </div>
                    <div className="text-center p-2 bg-bg-1 rounded">
                      <div className="font-mono text-fg-0">South</div>
                      <div className="text-error text-xs">−2.1%</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border-1 text-xs text-fg-2">
                    <span className="font-mono">Evidence: </span>Revenue sum by region, period-over-period pct_change, dataset v2 rows 1–12,480
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-bg-1 border border-border-1 rounded-xl p-6">
              <h4 className="font-semibold text-fg-0 mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-accent" />
                Try these follow-ups
              </h4>
              <div className="space-y-2">
                {followUpQuestions.map((q) => (
                  <button
                    key={q}
                    className="w-full p-3 rounded-lg bg-bg-2 border border-border-1 hover:border-accent/50 hover:bg-accent-bg/30 text-left transition-colors text-sm text-fg-1"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className={cn('relative', isVisible && !prefersReduced ? 'animate-fade-in-right' : '')}>
            <div className="bg-bg-0/50 backdrop-blur-sm border border-border-1 rounded-2xl p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-fg-0 mb-4">How it works</h3>
              <div className="space-y-5 text-sm text-fg-1">
                <div className="flex items-start gap-3 p-4 bg-bg-2 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-data-2/15 text-data-2 flex items-center justify-center flex-shrink-0">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-medium text-fg-0 mb-1">Intent Parsing</h5>
                    <p>Identifies entities (region, growth), metrics (revenue), and operations (compare, rank).</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-bg-2 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-data-1/15 text-data-1 flex items-center justify-center flex-shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-medium text-fg-0 mb-1">Safe Query Generation</h5>
                    <p>Produces parameterized Pandas/SQL — no arbitrary code execution. Validated against schema.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-bg-2 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-accent/15 text-accent flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-medium text-fg-0 mb-1">Real Execution</h5>
                    <p>Runs on your dataset version. Returns exact numbers, row counts, confidence intervals.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-bg-2 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-data-3/15 text-data-3 flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-medium text-fg-0 mb-1">Natural Explanation</h5>
                    <p>SLM receives the computed result + evidence, generates human-readable answer. Never hallucinates.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-bg-2 rounded-lg">
                  <div className="w-8 h-8 rounded-lg bg-data-4/15 text-data-4 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-medium text-fg-0 mb-1">Optional Visualization</h5>
                    <p>When the answer benefits from a chart, one is auto-generated and embedded in the response.</p>
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