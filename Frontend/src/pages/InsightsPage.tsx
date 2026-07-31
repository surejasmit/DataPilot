import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api } from '@/lib/api'
import {
  Lightbulb, AlertTriangle, FileText, BarChart3, Search, Filter,
  CheckCircle, XCircle, Info, TrendingUp, Database,
  Loader2, RefreshCw, AlertCircle, Download,
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
  summary: <FileText className="w-4 h-4 text-data-2" />,
  quality: <Database className="w-4 h-4 text-warning" />,
  pattern: <TrendingUp className="w-4 h-4 text-data-3" />,
  anomaly: <AlertTriangle className="w-4 h-4 text-error" />,
  recommendation: <Lightbulb className="w-4 h-4 text-accent" />,
  visualization: <BarChart3 className="w-4 h-4 text-data-4" />,
  statistic: <FileText className="w-4 h-4 text-data-2" />,
  distribution: <BarChart3 className="w-4 h-4 text-data-3" />,
  correlation: <TrendingUp className="w-4 h-4 text-data-4" />,
  trend: <TrendingUp className="w-4 h-4 text-success" />,
  preview: <Database className="w-4 h-4 text-info" />,
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
  info: <Info className="w-3.5 h-3.5" />,
  warning: <AlertTriangle className="w-3.5 h-3.5" />,
  success: <CheckCircle className="w-3.5 h-3.5" />,
  critical: <XCircle className="w-3.5 h-3.5" />,
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
      if (sortBy === 'confidence') return b.confidence - a.confidence
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
          <p className="mt-3 text-sm text-fg-2">Loading insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card variant="outlined" className="p-8 max-w-md w-full text-center border-error/30 bg-error-bg/10">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">Error Loading Insights</h3>
          <p className="text-sm text-fg-2 mb-4">{error}</p>
          <Button onClick={loadInsights}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </Card>
      </div>
    )
  }

  const totalCritical = allInsights.filter(i => i.severity === 'critical').length
  const datasetsWithInsights = projectsData.filter(p => p.insights.length > 0).length
  const avgConfidence = allInsights.length > 0
    ? Math.round(allInsights.reduce((a, b) => a + b.confidence, 0) / allInsights.length)
    : 0

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-fg-0 tracking-tight flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-data-3" />
              AI Insights
            </h1>
            <p className="text-sm text-fg-2 mt-1">Auto-discovered patterns, anomalies, and recommendations</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={loadInsights}>
              <RefreshCw className="w-4 h-4 mr-2" />Refresh
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />Export
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Insights', value: allInsights.length, icon: Lightbulb, color: 'text-data-3', bgColor: 'bg-data-3-bg' },
            { label: 'Critical', value: totalCritical, icon: AlertTriangle, color: 'text-error', bgColor: 'bg-error-bg' },
            { label: 'Datasets', value: datasetsWithInsights, icon: Database, color: 'text-accent', bgColor: 'bg-accent-bg' },
            { label: 'Avg Confidence', value: allInsights.length > 0 ? `${avgConfidence}%` : '—', icon: CheckCircle, color: 'text-success', bgColor: 'bg-success-bg' },
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card variant="elevated" className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-fg-3">{stat.label}</p>
                      <p className="text-2xl font-semibold text-fg-0 mt-1">{stat.value}</p>
                    </div>
                    <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bgColor)}>
                      <Icon className={cn('w-4 h-4', stat.color)} />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section>
        <Card className="p-3">
          <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3" />
              <Input
                placeholder="Search insights..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="px-3 py-1.5 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-xs"
              >
                {typeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-3 py-1.5 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-xs"
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
                className="px-3 py-1.5 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-xs"
              >
                <option value="date">Newest First</option>
                <option value="confidence">Highest Confidence</option>
              </select>
              <div className="flex bg-bg-2 border border-border-1 rounded-lg overflow-hidden">
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('cards')}
                  className="rounded-r-none h-8 px-2"
                >
                  <Filter className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none h-8 px-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <section>
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
                    initial={{ opacity: 0, y: 12 }}
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
                className="space-y-2"
              >
                {filteredInsights.map((insight, index) => (
                  <motion.div
                    key={`${insight.projectId}-${insight.id}`}
                    initial={{ opacity: 0, x: -12 }}
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
              <Lightbulb className="w-10 h-10 text-fg-3 mx-auto mb-3" />
              <h3 className="text-base font-medium text-fg-0 mb-1">No insights found</h3>
              <p className="text-sm text-fg-2 mb-4">
                {allInsights.length === 0
                  ? 'Generate insights from your datasets first.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {allInsights.length === 0 && (
                <Button onClick={() => window.location.href = '/projects'} size="sm">
                  <Database className="w-4 h-4 mr-2" />View Projects
                </Button>
              )}
            </Card>
          )}
        </AnimatePresence>
      </section>
    </div>
  )
}

function InsightCard({ insight }: { insight: any }) {
  return (
    <Card variant="elevated" className="h-full flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            insight.severity === 'critical' ? 'bg-error-bg text-error' :
            insight.severity === 'warning' ? 'bg-warning-bg text-warning' :
            insight.severity === 'success' ? 'bg-success-bg text-success' :
            'bg-info-bg text-info'
          )}>
            {typeIcons[insight.type] || <Info className="w-4 h-4" />}
          </div>
          <Badge variant="default" size="sm" className={severityStyles[insight.severity] || severityStyles.info}>
            {severityIcons[insight.severity] || severityIcons.info}
            {(insight.severity || 'info').charAt(0).toUpperCase() + (insight.severity || 'info').slice(1)}
          </Badge>
        </div>

        <h3 className="font-medium text-sm text-fg-0 mb-1.5 line-clamp-2 group-hover:text-accent transition-colors">{insight.title}</h3>
        <p className="text-xs text-fg-2 mb-3 line-clamp-2">{insight.description}</p>

        {insight.details && Object.keys(insight.details).length > 0 && (
          <div className="p-2.5 bg-bg-2 rounded-lg mb-3">
            {Object.entries(insight.details).slice(0, 2).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs mb-1 last:mb-0">
                <span className="text-fg-3 capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono font-medium text-fg-0 ml-2 truncate max-w-[120px]">{String(val)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2.5 border-t border-border-1">
          <div className="flex items-center gap-1.5 text-[11px] text-fg-3">
            <Avatar size="xs" fallback={insight.dataset.slice(0, 2)} className="bg-bg-3" />
            <span className="truncate max-w-[100px]">{insight.dataset}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-fg-3">
            <CheckCircle className="w-3 h-3" />
            <span>{insight.confidence}%</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

function InsightListItem({ insight }: { insight: any }) {
  const dataset = insight.dataset || 'Unknown Dataset'
  return (
    <Card variant="outlined" className="p-3.5 flex flex-col md:flex-row md:items-center gap-3 hover:border-accent/30 transition-colors">
      <div className={cn(
        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
        severityStyles[insight.severity] || severityStyles.info
      )}>
        {typeIcons[insight.type] || <Info className="w-4 h-4" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-sm font-medium text-fg-0 truncate">{insight.title}</h3>
          <Badge variant="accent" size="sm">{typeLabels[insight.type] || insight.type}</Badge>
        </div>
        <p className="text-xs text-fg-2 line-clamp-1">{insight.description}</p>
      </div>

      <div className="flex items-center gap-3 text-[11px] text-fg-3 flex-shrink-0">
        <span className="flex items-center gap-1">
          <Avatar size="xs" fallback={dataset.slice(0, 2)} className="bg-bg-3" />
          {dataset}
        </span>
        <span>{new Date(insight.createdAt).toLocaleDateString()}</span>
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {insight.confidence}%
        </span>
      </div>
    </Card>
  )
}
