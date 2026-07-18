import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import {
  Lightbulb,
  AlertTriangle,
  FileText,
  BarChart3,
  Zap,
  Search,
  Filter,
  Download,
  Copy,
  CheckCircle,
  XCircle,
  Info,
  HelpCircle,
  TrendingUp,
  Database,
  Eye,
  ExternalLink,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface Insight {
  id: string
  type: 'summary' | 'quality' | 'pattern' | 'anomaly' | 'recommendation' | 'visualization'
  title: string
  description: string
  severity: 'info' | 'warning' | 'success' | 'critical'
  confidence: number
  dataset: string
  createdAt: Date
  tags: string[]
  actionable: boolean
  details?: {
    metric?: string
    value?: string
    change?: string
    recommendation?: string
  }
}

const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'pattern',
    title: 'West Region Revenue Growth',
    description: 'West region revenue increased 18.4% vs prior quarter, driven by Enterprise segment growth of 34% YoY.',
    severity: 'success',
    confidence: 97,
    dataset: 'Sales Analysis Q1 2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 30),
    tags: ['Revenue', 'Regional', 'Growth'],
    actionable: true,
    details: {
      metric: 'Revenue Growth',
      value: '+18.4%',
      change: 'vs prior quarter',
      recommendation: 'Investigate Enterprise segment drivers and replicate in other regions',
    },
  },
  {
    id: '2',
    type: 'quality',
    title: 'Missing Values in Age Column',
    description: '124 missing values (1.0%) detected in the Age column. Median imputation recommended due to outlier presence.',
    severity: 'warning',
    confidence: 92,
    dataset: 'Sales Analysis Q1 2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    tags: ['Data Quality', 'Missing Data', 'Cleaning'],
    actionable: true,
    details: {
      recommendation: 'Apply median imputation (median age: 38) to preserve distribution',
    },
  },
  {
    id: '3',
    type: 'quality',
    title: 'Duplicate Rows Found',
    description: '18 exact duplicate rows identified across all columns. Recommend removal to prevent skewed analysis.',
    severity: 'warning',
    confidence: 100,
    dataset: 'Sales Analysis Q1 2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3),
    tags: ['Data Quality', 'Duplicates', 'Cleaning'],
    actionable: true,
    details: {
      recommendation: 'Remove 18 duplicate rows before analysis',
    },
  },
  {
    id: '4',
    type: 'anomaly',
    title: 'March Sales Anomaly Detected',
    description: 'March sales declined 12.3% vs forecast. Statistical anomaly detected (p < 0.05). Requires investigation.',
    severity: 'critical',
    confidence: 89,
    dataset: 'Sales Analysis Q1 2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    tags: ['Anomaly', 'Sales', 'Forecast'],
    actionable: true,
    details: {
      metric: 'Sales vs Forecast',
      value: '-12.3%',
      change: 'vs predicted',
      recommendation: 'Investigate March promotions, supply chain, or market events',
    },
  },
  {
    id: '5',
    type: 'pattern',
    title: 'Strong Correlation: Price & Churn',
    description: 'Negative correlation (-0.73) between product price and customer churn rate. Higher prices correlate with lower churn.',
    severity: 'info',
    confidence: 94,
    dataset: 'Customer Churn Prediction',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    tags: ['Correlation', 'Churn', 'Pricing'],
    actionable: true,
    details: {
      metric: 'Pearson Correlation',
      value: '-0.73',
      recommendation: 'Consider value-based pricing strategy to improve retention',
    },
  },
  {
    id: '6',
    type: 'recommendation',
    title: 'Recommended Chart: Revenue by Region',
    description: 'Auto-generated visualization recommendation based on dataset structure and detected patterns.',
    severity: 'info',
    confidence: 88,
    dataset: 'Sales Analysis Q1 2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    tags: ['Visualization', 'Dashboard', 'Revenue'],
    actionable: true,
    details: {
      recommendation: 'Create stacked bar chart showing quarterly revenue by region and segment',
    },
  },
  {
    id: '7',
    type: 'summary',
    title: 'Dataset Summary: Customer Churn',
    description: '8,234 customers analyzed. Overall churn rate: 23.4%. Key drivers: contract type, tenure, and monthly charges.',
    severity: 'info',
    confidence: 95,
    dataset: 'Customer Churn Prediction',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    tags: ['Summary', 'Churn', 'Overview'],
    actionable: false,
  },
  {
    id: '8',
    type: 'visualization',
    title: 'Suggested: Feature Importance Plot',
    description: 'Random Forest model identifies top 5 features driving churn: ContractType (0.32), Tenure (0.28), MonthlyCharges (0.19), InternetService (0.12), PaymentMethod (0.09).',
    severity: 'info',
    confidence: 91,
    dataset: 'Customer Churn Prediction',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4),
    tags: ['ML', 'Feature Importance', 'Model'],
    actionable: true,
    details: {
      recommendation: 'Add feature importance bar chart to model report',
    },
  },
  {
    id: '9',
    type: 'quality',
    title: 'Outliers Detected via IQR Method',
    description: '42 outliers identified in MonthlyCharges column (values > $118.5). Review for data entry errors or legitimate high-value customers.',
    severity: 'warning',
    confidence: 85,
    dataset: 'Customer Churn Prediction',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    tags: ['Outliers', 'Data Quality', 'Charges'],
    actionable: true,
    details: {
      recommendation: 'Verify top 10 charges for accuracy; consider winsorization at 99th percentile',
    },
  },
  {
    id: '10',
    type: 'pattern',
    title: 'Seasonal Pattern: Q4 Peak',
    description: 'Revenue consistently peaks in Q4 across all regions (avg +22% vs Q3). Strong holiday season effect detected.',
    severity: 'success',
    confidence: 93,
    dataset: 'Sales Analysis Q1 2026',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
    tags: ['Seasonality', 'Revenue', 'Trends'],
    actionable: true,
    details: {
      metric: 'Q4 vs Q3 Growth',
      value: '+22%',
      recommendation: 'Plan inventory and marketing for Q4 peak; analyze Q1 drop-off',
    },
  },
]

const typeIcons = {
  summary: <FileText className="w-5 h-5 text-data-2" />,
  quality: <Database className="w-5 h-5 text-warning" />,
  pattern: <TrendingUp className="w-5 h-5 text-data-3" />,
  anomaly: <AlertTriangle className="w-5 h-5 text-error" />,
  recommendation: <Lightbulb className="w-5 h-5 text-accent" />,
  visualization: <BarChart3 className="w-5 h-5 text-data-4" />,
}

const typeLabels = {
  summary: 'Summary',
  quality: 'Data Quality',
  pattern: 'Pattern',
  anomaly: 'Anomaly',
  recommendation: 'Recommendation',
  visualization: 'Visualization',
}

const severityStyles = {
  info: 'bg-info-bg text-info border-info/30',
  warning: 'bg-warning-bg text-warning border-warning/30',
  success: 'bg-success-bg text-success border-success/30',
  critical: 'bg-error-bg text-error border-error/30',
}

const severityIcons = {
  info: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  success: <CheckCircle className="w-4 h-4" />,
  critical: <XCircle className="w-4 h-4" />,
}

export function InsightsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'confidence' | 'date'>('date')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  const filteredInsights = useMemo(() => {
    let result = [...mockInsights]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(i =>
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.tags.some(t => t.toLowerCase().includes(query))
      )
    }

    if (typeFilter !== 'all') {
      result = result.filter(i => i.type === typeFilter)
    }

    if (severityFilter !== 'all') {
      result = result.filter(i => i.severity === severityFilter)
    }

    result.sort((a, b) => {
      if (sortBy === 'confidence') {
        return b.confidence - a.confidence
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

    return result
  }, [searchQuery, typeFilter, severityFilter, sortBy])

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'summary', label: 'Summary' },
    { value: 'quality', label: 'Data Quality' },
    { value: 'pattern', label: 'Patterns' },
    { value: 'anomaly', label: 'Anomalies' },
    { value: 'recommendation', label: 'Recommendations' },
    { value: 'visualization', label: 'Visualizations' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-fg-0 tracking-tight flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-data-3" />
            AI Insights
          </h1>
          <p className="text-fg-1 mt-1">Auto-discovered patterns, anomalies, and recommendations from your datasets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button size="sm">
            <Lightbulb className="w-4 h-4 mr-2" />
            Generate Insights
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Insights', value: mockInsights.length, icon: Lightbulb, color: 'text-data-3' },
          { label: 'Critical', value: mockInsights.filter(i => i.severity === 'critical').length, icon: AlertTriangle, color: 'text-error' },
          { label: 'Actionable', value: mockInsights.filter(i => i.actionable).length, icon: Zap, color: 'text-accent' },
          { label: 'Avg Confidence', value: `${Math.round(mockInsights.reduce((a, b) => a + b.confidence, 0) / mockInsights.length)}%`, icon: CheckCircle, color: 'text-success' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 bg-bg-1 border border-border-1 rounded-xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-fg-2">{stat.label}</p>
                <p className="text-2xl font-semibold text-fg-0">{stat.value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3" />
            <Input
              placeholder="Search insights..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="info">Info</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'confidence' | 'date')}
              className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="date">Newest First</option>
              <option value="confidence">Highest Confidence</option>
            </select>
            <div className="flex bg-bg-2 border border-border-1 rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-r-none"
              >
                <div className="w-5 h-5 grid grid-cols-2 gap-1">
                  <div className="bg-accent/20 rounded" />
                  <div className="bg-accent/20 rounded" />
                  <div className="bg-accent/20 rounded" />
                  <div className="bg-accent/20 rounded" />
                </div>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <div className="w-5 h-5 flex flex-col gap-1">
                  <div className="h-1 bg-accent/20 rounded w-3/4" />
                  <div className="h-1 bg-accent/20 rounded w-1/2" />
                  <div className="h-1 bg-accent/20 rounded w-3/4" />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Insights */}
      <AnimatePresence mode="wait">
        {viewMode === 'cards' ? (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <InsightCard insight={insight} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {filteredInsights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                <InsightListItem insight={insight} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {filteredInsights.length === 0 && (
        <Card className="p-12 text-center">
          <Lightbulb className="w-12 h-12 text-fg-3 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">No insights found</h3>
          <p className="text-fg-2 mb-4">Try adjusting your search or filters</p>
          <Button variant="outline" onClick={() => { setSearchQuery(''); setTypeFilter('all'); setSeverityFilter('all'); }}>
            Clear filters
          </Button>
        </Card>
      )}
    </div>
  )
}

function InsightCard({ insight }: { insight: Insight }) {
  return (
    <Card variant="elevated" className="h-full flex flex-col overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', insight.severity === 'critical' ? 'bg-error-bg text-error' : insight.severity === 'warning' ? 'bg-warning-bg text-warning' : insight.severity === 'success' ? 'bg-success-bg text-success' : 'bg-info-bg text-info')}>
            {typeIcons[insight.type]}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="default" size="sm" className={severityStyles[insight.severity]}>
              {severityIcons[insight.severity]}
              {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
            </Badge>
          </div>
        </div>

        <h3 className="font-semibold text-fg-0 mb-2 line-clamp-2 group-hover:text-accent transition-colors">{insight.title}</h3>
        <p className="text-sm text-fg-2 mb-4 line-clamp-3">{insight.description}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {insight.tags.map(tag => (
            <Badge key={tag} variant="accent" size="sm">{tag}</Badge>
          ))}
        </div>

        {insight.details?.metric && (
          <div className="p-3 bg-bg-2 rounded-lg mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-fg-2">{insight.details.metric}</span>
              <span className="font-mono font-medium text-fg-0">{insight.details.value}</span>
            </div>
            {insight.details.change && (
              <p className="text-xs text-fg-3">{insight.details.change}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border-1">
          <div className="flex items-center gap-2 text-xs text-fg-2">
            <Avatar size="xs" fallback={insight.dataset.slice(0, 2)} className="bg-bg-3" />
            <span className="truncate max-w-[120px]">{insight.dataset}</span>
            <span>•</span>
            <span>{insight.createdAt.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-fg-3">
            <CheckCircle className="w-3 h-3" />
            <span>{insight.confidence}% confidence</span>
          </div>
        </div>
      </div>

      <CardFooter className="p-4 pt-0">
        <div className="flex items-center gap-2 w-full">
          {insight.actionable && (
            <Button variant="outline" size="sm" className="flex-1 gap-1">
              <Zap className="w-3.5 h-3.5" />
              Take Action
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1">
            <ExternalLink className="w-3.5 h-3.5" />
            Details
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

function InsightListItem({ insight }: { insight: Insight }) {
  return (
    <Card variant="outlined" className="p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', severityStyles[insight.severity])}>
        {typeIcons[insight.type]}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-fg-0">{insight.title}</h3>
          <Badge variant="default" size="sm" className={severityStyles[insight.severity]}>
            {severityIcons[insight.severity]}
            {insight.severity}
          </Badge>
          <Badge variant="accent" size="sm">{typeLabels[insight.type]}</Badge>
        </div>
        <p className="text-sm text-fg-2 mb-2 line-clamp-2">{insight.description}</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {insight.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="accent" size="sm">{tag}</Badge>
          ))}
          {insight.tags.length > 3 && <Badge variant="default" size="sm">+{insight.tags.length - 3} more</Badge>}
        </div>
        <div className="flex items-center gap-4 text-xs text-fg-3">
          <span className="flex items-center gap-1">
            <Avatar size="xs" fallback={insight.dataset.slice(0, 2)} className="bg-bg-3" />
            {insight.dataset}
          </span>
          <span>{insight.createdAt.toLocaleDateString()}</span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {insight.confidence}% confidence
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:ml-auto">
        {insight.actionable && (
          <Button variant="outline" size="sm" className="gap-1">
            <Zap className="w-3.5 h-3.5" />
            Action
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}