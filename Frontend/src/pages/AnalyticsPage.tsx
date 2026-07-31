import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api, Project, AnalysisData } from '@/lib/api'
import {
  BarChart3, Database, Rows3, Columns3, AlertTriangle,
  Loader2, AlertCircle, RefreshCw, Hash,
  Activity, Sparkles, ArrowRight, FileSpreadsheet, Download,
} from 'lucide-react'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const all = await api.projects.getAll()
        setProjects(all)
        const withData = all.filter(p => p.dataset_name && p.dataset_path)
        if (withData.length > 0) {
          setSelectedId(withData[0].id.toString())
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const loadAnalysis = useCallback(async () => {
    if (!selectedId) return
    setAnalysis(null)
    setError(null)
    try {
      const result = await api.analysis.get(selectedId)
      setAnalysis(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis')
    }
  }, [selectedId])

  useEffect(() => { loadAnalysis() }, [loadAnalysis])

  useEffect(() => {
    let interval: any
    const isProcessing = analysis?.status === 'UPLOADING' || analysis?.status === 'ANALYZING'
    if (isProcessing) {
      interval = setInterval(loadAnalysis, 3000)
    }
    return () => { if (interval) clearInterval(interval) }
  }, [analysis?.status, loadAnalysis])

  const handleExportReport = async () => {
    if (!selectedId) return
    setExporting(true)
    try {
      const blob = await api.analysis.exportReport(selectedId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${projects.find(p => p.id.toString() === selectedId)?.name || 'report'}_report.pdf`
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        window.URL.revokeObjectURL(url)
        a.remove()
      }, 1000)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const projectsWithData = projects.filter(p => p.dataset_name && p.dataset_path)

  const renderContent = () => {
    if (loading) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-fg-2">Loading projects...</p>
        </Card>
      )
    }

    if (error && projects.length === 0) {
      return (
        <Card variant="outlined" className="p-8 max-w-md mx-auto text-center border-error/30 bg-error-bg/10">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">Error</h3>
          <p className="text-sm text-fg-2 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </Card>
      )
    }

    if (projects.length === 0) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Database className="w-12 h-12 text-fg-3 mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">No Projects Yet</h3>
          <p className="text-sm text-fg-2 mb-4">Create a project and upload a dataset to see reports.</p>
          <Button onClick={() => navigate('/projects/new')} size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" />Create Project
          </Button>
        </Card>
      )
    }

    if (!selectedId || projectsWithData.length === 0) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Database className="w-12 h-12 text-fg-3 mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">No Datasets Yet</h3>
          <p className="text-sm text-fg-2 mb-4">Upload a dataset to a project to view reports.</p>
          <Button onClick={() => navigate('/projects/new')} size="sm">
            <FileSpreadsheet className="w-4 h-4 mr-2" />Create Project
          </Button>
        </Card>
      )
    }

    if (!analysis && !error) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-fg-2">Loading analysis...</p>
        </Card>
      )
    }

    if (error) {
      return (
        <Card variant="outlined" className="p-8 max-w-md mx-auto text-center border-error/30 bg-error-bg/10">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">Analysis Failed</h3>
          <p className="text-sm text-fg-2 mb-4">{error}</p>
          <Button onClick={() => setSelectedId(selectedId)}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </Card>
      )
    }

    if (analysis?.status === 'no_dataset') {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">No Dataset File Found</h3>
          <p className="text-sm text-fg-2 mb-4">
            Project has a dataset name set but no actual file was uploaded.
          </p>
          {analysis.projectId && (
            <Button onClick={() => navigate(`/projects/${analysis.projectId}`)} size="sm">
              <Database className="w-4 h-4 mr-2" />Upload Dataset
            </Button>
          )}
        </Card>
      )
    }

    if (analysis?.status === 'UPLOADING' || analysis?.status === 'ANALYZING') {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto mb-3" />
          <p className="text-sm text-fg-2">{analysis.message || `Status: ${analysis.status}`}</p>
        </Card>
      )
    }

    if (analysis?.status === 'FAILED') {
      return (
        <Card variant="outlined" className="p-8 max-w-md mx-auto text-center border-error/30 bg-error-bg/10">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">Analysis Failed</h3>
          <p className="text-sm text-fg-2 mb-4">The ML service encountered an error while analyzing the dataset.</p>
          <Button onClick={loadAnalysis}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </Card>
      )
    }

    if (!analysis?.datasetSummary) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-warning mx-auto mb-3" />
          <p className="text-sm text-fg-2">No analysis data available for this dataset.</p>
        </Card>
      )
    }

    const s = analysis.datasetSummary
    const q = analysis.dataQuality
    const stats = analysis.statistics || []

    return (
      <div className="space-y-6">
        <section>
          <h2 className="text-sm font-semibold text-fg-0 mb-3">Dataset Overview</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryCard label="Dataset" value={s.datasetName || '—'} icon={Database} />
            <SummaryCard label="Rows" value={s.totalRows?.toLocaleString() || '0'} icon={Rows3} />
            <SummaryCard label="Columns" value={s.totalColumns?.toString() || '0'} icon={Columns3} />
            <SummaryCard label="Size" value={s.datasetSize ? `${(s.datasetSize / 1024 / 1024).toFixed(2)} MB` : '—'} icon={Activity} />
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-fg-0 mb-3">Quality & Statistics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card variant="elevated" className="p-4">
              <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3 flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-warning" /> Data Quality
              </h3>
              {q ? (
                <div className="space-y-2.5">
                  <Row label="Missing Values" value={q.missingValues.toString()} warn={q.missingValues > 0} />
                  <Row label="Duplicate Rows" value={q.duplicateRows.toString()} warn={q.duplicateRows > 0} />
                  <Row label="Numeric Columns" value={(q.numericColumns?.length || 0).toString()} />
                  <Row label="Categorical Columns" value={(q.categoricalColumns?.length || 0).toString()} />
                </div>
              ) : <p className="text-xs text-fg-3">No quality data</p>}
            </Card>

            <Card variant="elevated" className="p-4">
              <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Hash className="w-3.5 h-3.5 text-accent" /> Numeric Statistics
              </h3>
              {stats.length > 0 ? (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {stats.slice(0, 6).map(s => (
                    <div key={s.columnName} className="p-2 bg-bg-2 rounded text-xs">
                      <p className="font-medium text-fg-0 text-[11px] mb-1">{s.columnName}</p>
                      <div className="flex gap-3 text-fg-3">
                        <span>Mean: <span className="font-mono text-fg-0">{s.mean != null ? Number(s.mean).toFixed(2) : '—'}</span></span>
                        <span>Min: <span className="font-mono text-fg-0">{s.min != null ? Number(s.min).toFixed(2) : '—'}</span></span>
                        <span>Max: <span className="font-mono text-fg-0">{s.max != null ? Number(s.max).toFixed(2) : '—'}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : <p className="text-xs text-fg-3">No numeric columns</p>}
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-fg-0 mb-3">Column Analysis</h2>
          <Card variant="elevated" className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border-1 text-left text-fg-3 uppercase">
                    <th className="pb-2 pr-4 font-medium">Name</th>
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 text-right font-medium">Unique</th>
                    <th className="pb-2 pr-4 text-right font-medium">Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {(analysis.columnAnalysis || []).map(col => (
                    <tr key={col.columnName} className="border-b border-border-1/50">
                      <td className="py-2 pr-4 font-mono text-fg-0">{col.columnName}</td>
                      <td className="py-2 pr-4"><Badge variant={col.isNumeric ? 'success' : col.isCategorical ? 'accent' : 'info'} size="sm">{col.dataType}</Badge></td>
                      <td className="py-2 pr-4 text-right font-mono text-fg-0">{col.uniqueCount}</td>
                      <td className="py-2 pr-4 text-right font-mono text-fg-0">{col.missingCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-fg-0 mb-3">Chart Recommendations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(analysis.chartRecommendations || []).map((r, i) => (
              <Card key={i} variant="outlined" className="p-3 text-center hover:border-accent/30 transition-colors">
                <Badge variant="accent" size="sm" className="mb-1.5">{r.type}</Badge>
                <p className="text-xs text-fg-2 line-clamp-2">{r.title}</p>
              </Card>
            ))}
            {(!analysis.chartRecommendations || analysis.chartRecommendations.length === 0) && (
              <p className="text-xs text-fg-3 col-span-full text-center py-4">No chart recommendations</p>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportReport} disabled={exporting}>
              {exporting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Download className="w-4 h-4 mr-2" />
              )}
              {exporting ? 'Generating...' : 'Export Report'}
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${selectedId}/insights`)}>
              <Sparkles className="w-4 h-4 mr-2" />View Insights
            </Button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-fg-0 tracking-tight flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-data-2" />
              Reports
            </h1>
            <p className="text-sm text-fg-2 mt-1">Dataset analysis reports and export options</p>
          </div>
        </div>
      </section>

      {projects.length > 0 && (
        <section>
          <Card variant="elevated" className="p-3">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1">
                <select
                  value={selectedId || ''}
                  onChange={e => setSelectedId(e.target.value)}
                  className="w-full px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm"
                >
                  {projectsWithData.length === 0 && <option value="">No projects with datasets</option>}
                  {projectsWithData.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.dataset_name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedId && (
                <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${selectedId}`)}>
                  Open Dashboard <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </Card>
        </section>
      )}

      <section>
        {renderContent()}
      </section>
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="p-3.5 bg-bg-1 border border-border-1 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] text-fg-3">{label}</p>
          <p className="text-base font-semibold text-fg-0 mt-0.5">{value}</p>
        </div>
        <Icon className="w-4 h-4 text-accent" />
      </div>
    </div>
  )
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-fg-2">{label}</span>
      <span className={cn('font-mono', warn ? 'text-warning' : 'text-fg-0')}>{value}</span>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
