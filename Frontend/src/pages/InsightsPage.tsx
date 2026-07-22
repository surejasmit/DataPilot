import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Card, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import {
  Lightbulb, AlertTriangle, FileText, BarChart3, Zap, Search, Filter,
  CheckCircle, XCircle, Info, TrendingUp, Database, ExternalLink,
  Loader2, RefreshCw, AlertCircle,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface ApiInsight {
  id: number
  type: string
  title: string
  description: string
  details: Record<string, string>
  severity: string
  confidence: number
  createdAt: string
}

interface ProjectInsights {
  projectId: number
  projectName: string
  datasetName: string
  insights: ApiInsight[]
}

const typeIcons: Record<string, any> = {
  summary: <FileText className="w-5 h-5 text-data-2" />,
  quality: <Database className="w-5 h-5 text-warning" />,
  pattern: <TrendingUp className="w-5 h-5 text-data-3" />,
  anomaly: <AlertTriangle className="w-5 h-5 text-error" />,
  recommendation: <Lightbulb className="w-5 h-5 text-accent" />,
  visualization: <BarChart3 className="w-5 h-5 text-data-4" />,
  statistic: <FileText className="w-5 h-5 text-data-2" />,
  distribution: <BarChart3 className="w-5 h-5 text-data-3" />,
  correlation: <TrendingUp className="w-5 h-5 text-data-4" />,
  trend: <TrendingUp className="w-5 h-5 text-success" />,
  preview: <Database className="w-5 h-5 text-info" />,
}

const typeLabels: Record<string, string> = {
  summary: 'Summary',
  quality: 'Data Quality',
  pattern: 'Pattern',
  anomaly: 'Anomaly',
  recommendation: 'Recommendation',
  visualization: 'Visualization',
  statistic: 'Statistics',
  distribution: 'Distribution',
  correlation: 'Correlation',
  trend: 'Trend',
  preview: 'Preview',
}

const severityStyles: Record<string, string> = {
  info: 'bg-info-bg text-info border-info/30',
  warning: 'bg-warning-bg text-warning border-warning/30',
  success: 'bg-success-bg text-success border-success/30',
  critical: 'bg-error-bg text-error border-error/30',
}

const severityIcons: Record<string, any> = {
  info: <Info className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
  success: <CheckCircle className="w-4 h-4" />,
  critical: <XCircle className="w-4 h-4" />,
}

export function InsightsPage() {
  const [projectsData, setProjectsData] = useState<ProjectInsights[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'confidence' | 'date'>('date')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')

  const loadInsights = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.analysis.getAllInsights()
      setProjectsData(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadInsights() }, [])

  const allInsights = useMemo(() => {
    return projectsData.flatMap(p =>
      p.insights.map(i => ({
        ...i,
        dataset: p.datasetName || p.projectName,
        projectId: p.projectId,
      }))
    )
  }, [projectsData])

  const filteredInsights = useMemo(() => {
    let result = [...allInsights]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(i =>
        i.title.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query)
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
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return result
  }, [allInsights, searchQuery, typeFilter, severityFilter, sortBy])

  const typeOptions = [
    { value: 'all', label: 'All Types' },
    { value: 'summary', label: 'Summary' },
    { value: 'statistic', label: 'Statistics' },
    { value: 'distribution', label: 'Distribution' },
    { value: 'quality', label: 'Data Quality' },
    { value: 'correlation', label: 'Correlation' },
    { value: 'trend', label: 'Trend' },
    { value: 'preview', label: 'Preview' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="mt-3 text-fg-2">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card variant="outlined" className="p-8 max-w-md w-full text-center border-error/30 bg-error-bg/10">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">Error Loading Insights</h3>
          <p className="text-fg-2 mb-4">{error}</p>
          <Button onClick={loadInsights}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-fg-0 tracking-tight flex items-center gap-2">
            <Lightbulb className="w-7 h-7 text-data-3" />
            AI Insights
          </h1>
          <p className="text-fg-1 mt-1">Auto-discovered patterns, anomalies, and recommendations from your datasets</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadInsights}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Insights', value: allInsights.length, icon: Lightbulb, color: 'text-data-3' },
          { label: 'Critical', value: allInsights.filter(i => i.severity === 'critical').length, icon: AlertTriangle, color: 'text-error' },
          { label: 'Datasets', value: projectsData.filter(p => p.insights.length > 0).length, icon: Database, color: 'text-accent' },
          { label: 'Avg Confidence', value: allInsights.length > 0 ? `${Math.round(allInsights.reduce((a, b) => a + b.confidence, 0) / allInsights.length)}%` : '—', icon: CheckCircle, color: 'text-success' },
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
              className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm"
            >
              {typeOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm"
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
              className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm"
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
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <FileText className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <AnimatePresence mode="wait">
        {filteredInsights.length > 0 ? (
          viewMode === 'cards' ? (
            <motion.div
              key="cards"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {filteredInsights.map((insight, index) => (
                <motion.div
                  key={`${insight.projectId}-${insight.id}`}
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
                  key={`${insight.projectId}-${insight.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <InsightListItem insight={insight} />
                </motion.div>
              ))}
            </motion.div>
          )
        ) : (
          <Card className="p-12 text-center">
            <Lightbulb className="w-12 h-12 text-fg-3 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-fg-0 mb-2">No insights found</h3>
            <p className="text-fg-2 mb-4">
              {allInsights.length === 0
                ? 'Generate insights from your datasets first.'
                : 'Try adjusting your search or filters.'}
            </p>
            {allInsights.length === 0 && (
              <Button onClick={() => window.location.href = '/projects'}>
                <Database className="w-4 h-4 mr-2" />View Projects
              </Button>
            )}
          </Card>
        )}
      </AnimatePresence>
    </div>
  )
}

function InsightCard({ insight }: { insight: any }) {
  return (
    <Card variant="elevated" className="h-full flex flex-col overflow-hidden group">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', insight.severity === 'critical' ? 'bg-error-bg text-error' : insight.severity === 'warning' ? 'bg-warning-bg text-warning' : insight.severity === 'success' ? 'bg-success-bg text-success' : 'bg-info-bg text-info')}>
            {typeIcons[insight.type] || <Info className="w-5 h-5" />}
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="default" size="sm" className={severityStyles[insight.severity] || severityStyles.info}>
              {severityIcons[insight.severity] || severityIcons.info}
              {(insight.severity || 'info').charAt(0).toUpperCase() + (insight.severity || 'info').slice(1)}
            </Badge>
          </div>
        </div>

        <h3 className="font-semibold text-fg-0 mb-2 line-clamp-2 group-hover:text-accent transition-colors">{insight.title}</h3>
        <p className="text-sm text-fg-2 mb-4 line-clamp-3">{insight.description}</p>

        {insight.details && Object.keys(insight.details).length > 0 && (
          <div className="p-3 bg-bg-2 rounded-lg mb-4">
            {Object.entries(insight.details).slice(0, 2).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-sm mb-1 last:mb-0">
                <span className="text-fg-2 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono font-medium text-fg-0 ml-2 truncate max-w-[140px]">{String(val)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border-1">
          <div className="flex items-center gap-2 text-xs text-fg-2">
            <Avatar size="xs" fallback={insight.dataset.slice(0, 2)} className="bg-bg-3" />
            <span className="truncate max-w-[120px]">{insight.dataset}</span>
            <span>•</span>
            <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-fg-3">
            <CheckCircle className="w-3 h-3" />
            <span>{insight.confidence}% confidence</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function InsightListItem({ insight }: { insight: any }) {
  const dataset = insight.dataset || 'Unknown Dataset'
  return (
    <Card variant="outlined" className="p-4 flex flex-col md:flex-row md:items-center gap-4">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', severityStyles[insight.severity] || severityStyles.info)}>
        {typeIcons[insight.type] || <Info className="w-5 h-5" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-fg-0">{insight.title}</h3>
          <Badge variant="default" size="sm" className={severityStyles[insight.severity] || severityStyles.info}>
            {severityIcons[insight.severity] || severityIcons.info}
            {insight.severity || 'info'}
          </Badge>
          <Badge variant="accent" size="sm">{typeLabels[insight.type] || insight.type}</Badge>
        </div>
        <p className="text-sm text-fg-2 mb-2 line-clamp-2">{insight.description}</p>
        <div className="flex items-center gap-4 text-xs text-fg-3">
          <span className="flex items-center gap-1">
            <Avatar size="xs" fallback={dataset.slice(0, 2)} className="bg-bg-3" />
            {dataset}
          </span>
          <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {insight.confidence}% confidence
          </span>
        </div>
      </div>
    </Card>
  )
}
