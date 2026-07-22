import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api, Project } from '@/lib/api'
import {
  Lightbulb, Sparkles, RefreshCw, Loader2, AlertTriangle, AlertCircle, CheckCircle2,
  Info, TrendingUp, Database, Hash, Activity, FileText, PieChart,
  ArrowLeft,
} from 'lucide-react'

interface Insight {
  id: number
  insight_type: string
  title: string
  description: string
  details: Record<string, string>
  severity: string
  confidence: number
  created_at: string
}

const severityStyles: Record<string, string> = {
  info: 'bg-info-bg text-info border-info/30',
  warning: 'bg-warning-bg text-warning border-warning/30',
  success: 'bg-success-bg text-success border-success/30',
  critical: 'bg-error-bg text-error border-error/30',
  error: 'bg-error-bg text-error border-error/30',
}

const typeIcons: Record<string, any> = {
  statistic: <Hash className="w-5 h-5 text-data-2" />,
  distribution: <PieChart className="w-5 h-5 text-data-3" />,
  quality: <AlertTriangle className="w-5 h-5 text-warning" />,
  correlation: <Activity className="w-5 h-5 text-data-4" />,
  summary: <FileText className="w-5 h-5 text-accent" />,
  preview: <Database className="w-5 h-5 text-info" />,
  trend: <TrendingUp className="w-5 h-5 text-success" />,
}

export function DatasetInsightsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  const loadInsights = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const projectData = await api.projects.getById(id)
      setProject(projectData)
      if (projectData.dataset_name) {
        const dsId = projectData.id.toString()
        const data = await api.datasets.getInsights(dsId)
        setInsights(data || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights')
    } finally {
      setLoading(false)
    }
  }, [id])

  const generateInsights = async () => {
    if (!id) return
    setGenerating(true)
    try {
      const data = await api.datasets.generateInsights(id)
      setInsights(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setGenerating(false)
    }
  }

  useEffect(() => { loadInsights() }, [loadInsights])

  const filteredInsights = insights.filter(i => {
    if (typeFilter !== 'all' && i.insight_type !== typeFilter) return false
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false
    return true
  })

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

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card variant="outlined" className="p-8 max-w-md w-full text-center">
          <Database className="w-12 h-12 text-fg-3 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">Project Not Found</h3>
          <p className="text-fg-2 mb-4">The requested project does not exist.</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${id}`)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <h1 className="text-2xl font-light text-fg-0">Dataset Insights</h1>
          </div>
          <p className="text-fg-2 mt-1 ml-12">{project.dataset_name || project.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadInsights}>
            <RefreshCw className="w-4 h-4 mr-2" />Refresh
          </Button>
          <Button size="sm" onClick={generateInsights} loading={generating} disabled={generating}>
            <Sparkles className="w-4 h-4 mr-2" />{generating ? 'Generating...' : 'Generate Insights'}
          </Button>
        </div>
      </div>

      {!project.dataset_name ? (
        <Card variant="outlined" className="p-12 text-center">
          <Database className="w-16 h-16 text-fg-3 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">No Dataset Uploaded</h3>
          <p className="text-fg-2 mb-6">Upload a dataset to generate insights.</p>
          <Button onClick={() => navigate(`/projects/${id}`)}>
            <Database className="w-4 h-4 mr-2" />Go to Dashboard
          </Button>
        </Card>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Insights', value: insights.length, icon: Lightbulb, color: 'text-data-3' },
              { label: 'Warnings', value: insights.filter(i => i.severity === 'warning' || i.severity === 'critical').length, icon: AlertTriangle, color: 'text-warning' },
              { label: 'Statistics', value: insights.filter(i => i.insight_type === 'statistic').length, icon: Hash, color: 'text-data-2' },
              { label: 'Correlations', value: insights.filter(i => i.insight_type === 'correlation').length, icon: Activity, color: 'text-data-4' },
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
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex flex-wrap gap-2">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                >
                  <option value="all">All Types</option>
                  <option value="statistic">Statistics</option>
                  <option value="distribution">Distribution</option>
                  <option value="quality">Quality</option>
                  <option value="correlation">Correlation</option>
                  <option value="summary">Summary</option>
                  <option value="preview">Preview</option>
                  <option value="trend">Trend</option>
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
              </div>
            </div>
          </Card>

          {/* Generating State */}
          {generating && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-accent" />
              <span className="ml-3 text-fg-2">Generating insights from dataset...</span>
            </div>
          )}

          {/* Insights Grid */}
          {!generating && (
            <AnimatePresence mode="wait">
              {filteredInsights.length > 0 ? (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {filteredInsights.map((insight, index) => (
                    <motion.div
                      key={insight.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <Card variant="elevated" className="h-full flex flex-col group hover:border-accent/30 transition-all">
                        <CardContent className="flex-1 p-5">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                              insight.severity === 'critical' ? 'bg-error-bg text-error' :
                              insight.severity === 'warning' ? 'bg-warning-bg text-warning' :
                              insight.severity === 'success' ? 'bg-success-bg text-success' :
                              'bg-info-bg text-info'
                            )}>
                              {typeIcons[insight.insight_type] || <Info className="w-5 h-5" />}
                            </div>
                            <Badge variant="default" size="sm" className={severityStyles[insight.severity] || severityStyles.info}>
                              {insight.severity}
                            </Badge>
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

                          <div className="flex items-center justify-between pt-3 border-t border-border-1 mt-auto">
                            <Badge variant="accent" size="sm">{insight.insight_type}</Badge>
                            <div className="flex items-center gap-1 text-xs text-fg-3">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{insight.confidence}% confidence</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="p-12 text-center">
                    <Lightbulb className="w-12 h-12 text-fg-3 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-fg-0 mb-2">No insights yet</h3>
                    <p className="text-fg-2 mb-4">Generate insights to see patterns and statistics from your dataset</p>
                    <Button onClick={generateInsights} loading={generating}>
                      <Sparkles className="w-4 h-4 mr-2" />Generate Insights
                    </Button>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  )
}
