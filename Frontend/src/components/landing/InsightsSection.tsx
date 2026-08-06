import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import { TrendingUp, Users, AlertTriangle, BarChart3, Filter, Zap } from 'lucide-react'

const insights = [
  {
    type: 'revenue',
    title: 'Sales Revenue increased 23% compared to last quarter',
    description: 'Strongest growth across all regions. Driven by enterprise segment expansion and new product launches. North America leads with $2.4M in revenue.',
    metric: '+23%',
    icon: TrendingUp,
    color: 'data-1',
    evidence: 'Quarter-over-quarter comparison · 12,480 transactions',
    tags: ['Revenue', 'Growth', 'Quarterly'],
  },
  {
    type: 'attrition',
    title: 'Employee attrition rate is highest in Engineering department',
    description: 'Engineering department shows 18% attrition rate, 2.4x the company average. Exit interviews cite compensation and growth opportunities as primary factors.',
    metric: '18%',
    icon: Users,
    color: 'data-2',
    evidence: 'HR analytics · 847 employees · 12-month window',
    tags: ['HR', 'Attrition', 'Engineering'],
  },
  {
    type: 'regional',
    title: 'Top performing region: North America with $2.4M revenue',
    description: 'North America generated $2.4M in Q4, exceeding forecast by 12%. EMEA follows at $1.8M with 8% growth. APAC shows potential at $1.2M.',
    metric: '$2.4M',
    icon: BarChart3,
    color: 'data-3',
    evidence: 'Regional revenue breakdown · Q4 2025',
    tags: ['Regional', 'Performance', 'Q4'],
  },
  {
    type: 'retention',
    title: 'Customer retention rate improved by 8% after campaign',
    description: 'Post-campaign retention increased from 72% to 80%. Repeat customers now generate 2.3x more revenue per transaction than new customers.',
    metric: '+8%',
    icon: Zap,
    color: 'data-4',
    evidence: 'Cohort analysis · 6-month window · 2,840 customers',
    tags: ['Retention', 'Campaign', 'Customers'],
  },
  {
    type: 'anomaly',
    title: 'March sales declined −12.3% vs. forecast',
    description: 'Isolation forest flags March as anomalous. Coincides with supply chain delay for Widget A (stockout days: 12). Recovery in April (+8.1%).',
    metric: '−12.3%',
    icon: AlertTriangle,
    color: 'warning',
    evidence: 'Isolation Forest (contamination=0.01) · 30-day window',
    tags: ['Anomaly', 'Supply Chain', 'Recovery'],
  },
  {
    type: 'segment',
    title: 'Widget C has 94% repeat purchase rate',
    description: 'Highest retention across all products. Buyers return within 45 days median. Widget A: 67%, Widget B: 52%. Cross-sell opportunity identified.',
    metric: '94%',
    icon: Filter,
    color: 'data-5',
    evidence: 'Cohort analysis · 6-month window · 2,840 Widget C buyers',
    tags: ['Retention', 'Product', 'Cross-sell'],
  },
]

export function InsightsSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const isVisible = useIntersectionObserver(sectionRef)
  const prefersReduced = useReducedMotion()

  return (
    <section
      id="insights"
      ref={sectionRef}
      className="py-24 lg:py-32 px-6"
      aria-labelledby="insights-heading"
    >
      <div className="mx-auto max-w-[1400px]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-bg border border-accent/30 text-accent text-sm font-medium mb-4">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
            </span>
            Automatic Discovery
          </span>
          <h2 id="insights-heading" className="text-3xl md:text-4xl lg:text-5xl font-light text-fg-0 tracking-tight">
            Business insights you didn't know to look for
          </h2>
          <p className="mt-4 text-lg text-fg-1 max-w-2xl mx-auto">
            Statistical engine runs correlation matrices, trend decompositions, segment comparisons,
            and anomaly detection. Each insight cites the exact calculation — no hallucinations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {insights.map((insight, index) => {
            const Icon = insight.icon
            return (
              <motion.article
                key={insight.type}
                className="group bg-bg-1 border border-border-1 rounded-xl p-6 transition-all duration-300 hover:border-accent/50 hover:shadow-lg hover:shadow-accent/10"
                initial={prefersReduced ? {} : { opacity: 0, y: 20 }}
                animate={isVisible && !prefersReduced ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0', `bg-${insight.color}/15 text-${insight.color}`)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs font-medium px-2 py-0.5 rounded', `bg-${insight.color}/20 text-${insight.color}`)}>
                        {insight.type}
                      </span>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-fg-0 mb-2 group-hover:text-accent transition-colors">
                  {insight.title}
                </h3>

                <p className="text-sm text-fg-1 mb-4 leading-relaxed">
                  {insight.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-border-1">
                  <div className="text-right">
                    <div className={cn('text-2xl font-bold font-mono', `text-${insight.color}`)}>
                      {insight.metric}
                    </div>
                    <div className="text-xs text-fg-2 mt-0.5">Effect size</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border-1">
                  <div className="flex items-center gap-2 text-xs text-fg-2 mb-2">
                    <span className="font-mono text-fg-3">Evidence:</span>
                    <span>{insight.evidence}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {insight.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-bg-2 text-fg-2 rounded border border-border-1"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-fg-2 mb-4">
            All insights are computed on your dataset version. Re-run anytime after cleaning.
          </p>
          <div className="flex items-center justify-center gap-4 text-sm text-fg-2 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-success" />
              Statistically validated
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Row-level evidence
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-data-2" />
              Reproducible
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
