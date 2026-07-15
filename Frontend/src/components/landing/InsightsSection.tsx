import { useRef } from 'react'
import { motion } from 'framer-motion'
import { useIntersectionObserver, useReducedMotion } from '@/hooks/useMedia'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import { TrendingUp, Users, AlertTriangle, BarChart3, Filter, Zap } from 'lucide-react'

const insights = [
  {
    type: 'correlation',
    title: 'Revenue strongly correlates with repeat purchases (r = 0.73)',
    description: 'Customers with 2+ prior orders generate 2.3× more revenue per transaction. The relationship holds across all regions and product categories.',
    metric: 'r = 0.73',
    icon: TrendingUp,
    color: 'data-1',
    evidence: 'Pearson correlation · n = 12,480 · p < 0.001',
    tags: ['Correlation', 'Revenue', 'Significant'],
  },
  {
    type: 'trend',
    title: 'West region revenue increased 18.4% YoY',
    description: 'Strongest growth across all four regions. Driven by Widget C adoption (+42%) and enterprise segment expansion. East region flat at +1.2%.',
    metric: '+18.4%',
    icon: BarChart3,
    color: 'data-2',
    evidence: 'Year-over-year comparison · 3,120 West region rows',
    tags: ['Trend', 'Regional', 'Growth'],
  },
  {
    type: 'anomaly',
    title: 'March sales declined −12.3% vs. forecast',
    description: 'Isolation forest flags March as anomalous. Coincides with supply chain delay for Widget A (stockout days: 12). Recovery in April (+8.1%).',
    metric: '−12.3%',
    icon: AlertTriangle,
    color: 'warning',
    evidence: 'Isolation Forest (contamination=0.01) · 30-day window',
    tags: ['Anomaly', 'Seasonal', 'Supply Chain'],
  },
  {
    type: 'distribution',
    title: 'Revenue distribution is bimodal — two distinct segments',
    description: "Hartigan's dip test confirms two modes: enterprise (mean $4,200) and SMB (mean $890). Suggests different sales motions or pricing tiers.",
    metric: '2 modes',
    icon: Filter,
    color: 'data-3',
    evidence: "Hartigan's dip test p < 0.001 · Gaussian mixture fit",
    tags: ['Distribution', 'Segmentation', 'Product'],
  },
  {
    type: 'performance',
    title: 'Rep "A. Chen" outperforms team by 31%',
    description: 'Mean revenue per deal: $1,620 vs team $1,235. Effect persists after controlling for region and product. Top 3 deals closed in Q4.',
    metric: '+31%',
    icon: Zap,
    color: 'data-4',
    evidence: 'ANCOVA · 342 deals · Covariates: region, product',
    tags: ['Performance', 'Personnel', 'Significant'],
  },
  {
    type: 'segment',
    title: 'Widget C has 94% repeat purchase rate',
    description: 'Highest retention across all products. Buyers return within 45 days median. Widget A: 67%, Widget B: 52%. Cross-sell opportunity identified.',
    metric: '94%',
    icon: Users,
    color: 'data-5',
    evidence: 'Cohort analysis · 6-month window · 2,840 Widget C buyers',
    tags: ['Retention', 'Product', 'Cross-sell'],
  },
]

export function InsightsSection() {
  const sectionRef = useRef<HTMLSectionElement>(null)
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
            Patterns you didn't know to look for
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