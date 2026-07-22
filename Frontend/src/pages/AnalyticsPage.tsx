import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api, Project, AnalysisData } from '@/lib/api'
import {
  BarChart3, Database, Rows3, Columns3, AlertTriangle,
  Loader2, AlertCircle, RefreshCw, Hash, Type,
  Activity, Sparkles, ArrowRight, FileSpreadsheet,
} from 'lucide-react'

export function AnalyticsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    (async () => {
      try {
        const all = await api.projects.getAll()
        setProjects(all)
        const withData = all.filter(p => p.dataset_name)
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

  useEffect(() => {
    if (!selectedId) return
    setAnalysis(null)
    setError(null)
    ;(async () => {
      try {
        const result = await api.analysis.get(selectedId)
        setAnalysis(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analysis')
      }
    })()
  }, [selectedId])

  const projectsWithData = projects.filter(p => p.dataset_name)

  const renderContent = () => {
    if (loading) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-fg-2">Loading projects...</p>
        </Card>
      )
    }

    if (error && projects.length === 0) {
      return (
        <Card variant="outlined" className="p-8 max-w-md mx-auto text-center border-error/30 bg-error-bg/10">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">Error</h3>
          <p className="text-fg-2 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </Card>
      )
    }

    if (projects.length === 0) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Database className="w-16 h-16 text-fg-3 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">No Projects Yet</h3>
          <p className="text-fg-2 mb-6">Create a project and upload a dataset.</p>
          <Button onClick={() => navigate('/projects/new')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />Create Project
          </Button>
        </Card>
      )
    }

    if (!selectedId || projectsWithData.length === 0) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Database className="w-16 h-16 text-fg-3 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">No Datasets Yet</h3>
          <p className="text-fg-2 mb-6">Upload a dataset to a project.</p>
          <Button onClick={() => navigate('/projects/new')}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />Create Project
          </Button>
        </Card>
      )
    }

    if (!analysis && !error) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-4" />
          <p className="text-fg-2">Loading analysis...</p>
        </Card>
      )
    }

    if (error) {
      return (
        <Card variant="outlined" className="p-8 max-w-md mx-auto text-center border-error/30 bg-error-bg/10">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">Analysis Failed</h3>
          <p className="text-fg-2 mb-4">{error}</p>
          <Button onClick={() => setSelectedId(selectedId)}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </Card>
      )
    }

    if (analysis?.status === 'no_dataset') {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <AlertTriangle className="w-16 h-16 text-warning mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">No Dataset File Found</h3>
          <p className="text-fg-2 mb-4">
            Project has a dataset name set but no actual file was uploaded.
          </p>
          <p className="text-sm text-fg-3 mb-6">
            Go to the project dashboard and upload the file.
          </p>
          {analysis.projectId && (
            <Button onClick={() => navigate(`/projects/${analysis.projectId}`)}>
              <Database className="w-4 h-4 mr-2" />Upload Dataset
            </Button>
          )}
        </Card>
      )
    }

    if (analysis?.status && analysis.status !== 'no_dataset') {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <Loader2 className="w-12 h-12 animate-spin text-accent mx-auto mb-4" />
          <p className="text-fg-2">{analysis.message || `Status: ${analysis.status}`}</p>
        </Card>
      )
    }

    if (!analysis?.datasetSummary) {
      return (
        <Card variant="outlined" className="p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-warning mx-auto mb-4" />
          <p className="text-fg-2">No analysis data available for this dataset.</p>
        </Card>
      )
    }

    const s = analysis.datasetSummary
    const q = analysis.dataQuality
    const stats = analysis.statistics || []

    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <SummaryCard label="Dataset" value={s.datasetName || '—'} icon={Database} />
          <SummaryCard label="Rows" value={s.totalRows?.toLocaleString() || '0'} icon={Rows3} />
          <SummaryCard label="Columns" value={s.totalColumns?.toString() || '0'} icon={Columns3} />
          <SummaryCard label="Size" value={s.datasetSize ? `${(s.datasetSize / 1024 / 1024).toFixed(2)} MB` : '—'} icon={Activity} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card variant="elevated" className="p-5">
            <h3 className="text-sm font-semibold text-fg-0 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" /> Data Quality
            </h3>
            {q ? (
              <div className="space-y-3">
                <Row label="Missing Values" value={q.missingValues.toString()} warn={q.missingValues > 0} />
                <Row label="Duplicate Rows" value={q.duplicateRows.toString()} warn={q.duplicateRows > 0} />
                <Row label="Numeric Columns" value={(q.numericColumns?.length || 0).toString()} />
                <Row label="Categorical Columns" value={(q.categoricalColumns?.length || 0).toString()} />
              </div>
            ) : <p className="text-sm text-fg-3">No quality data</p>}
          </Card>

          <Card variant="elevated" className="p-5">
            <h3 className="text-sm font-semibold text-fg-0 mb-3 flex items-center gap-2">
              <Hash className="w-4 h-4 text-accent" /> Numeric Statistics
            </h3>
            {stats.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {stats.slice(0, 6).map(s => (
                  <div key={s.columnName} className="p-2 bg-bg-2 rounded text-sm">
                    <p className="font-medium text-fg-0 text-xs mb-1">{s.columnName}</p>
                    <div className="flex gap-3 text-xs text-fg-2">
                      <span>Mean: <span className="font-mono text-fg-0">{s.mean != null ? Number(s.mean).toFixed(2) : '—'}</span></span>
                      <span>Min: <span className="font-mono text-fg-0">{s.min != null ? Number(s.min).toFixed(2) : '—'}</span></span>
                      <span>Max: <span className="font-mono text-fg-0">{s.max != null ? Number(s.max).toFixed(2) : '—'}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-fg-3">No numeric columns</p>}
          </Card>
        </div>

        <Card variant="elevated" className="p-5">
          <h3 className="text-sm font-semibold text-fg-0 mb-3 flex items-center gap-2">
            <Type className="w-4 h-4 text-data-2" /> Columns
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-1 text-left text-xs text-fg-2 uppercase">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4 text-right">Unique</th>
                  <th className="pb-2 pr-4 text-right">Missing</th>
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

        <Card variant="elevated" className="p-5">
          <h3 className="text-sm font-semibold text-fg-0 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-data-3" /> Chart Recommendations
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(analysis.chartRecommendations || []).map((r, i) => (
              <div key={i} className="p-3 bg-bg-2 rounded-lg text-center">
                <Badge variant="accent" size="sm" className="mb-1">{r.type}</Badge>
                <p className="text-xs text-fg-2 line-clamp-2">{r.title}</p>
              </div>
            ))}
            {(!analysis.chartRecommendations || analysis.chartRecommendations.length === 0) && (
              <p className="text-sm text-fg-3 col-span-full text-center py-4">No chart recommendations</p>
            )}
          </div>
        </Card>
      </>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-fg-0 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-data-2" />
            Analysis
          </h1>
          <p className="text-fg-1 mt-1">Select a project to view its dataset analysis</p>
        </div>
      </div>

      {projects.length > 0 && (
        <Card variant="elevated" className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="flex-1">
              <label className="text-xs text-fg-2 mb-1 block">Select a project</label>
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
      )}

      {renderContent()}
    </div>
  )
}

function SummaryCard({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
  return (
    <div className="p-4 bg-bg-1 border border-border-1 rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-fg-2">{label}</p>
          <p className="text-lg font-semibold text-fg-0">{value}</p>
        </div>
        <Icon className="w-5 h-5 text-accent" />
      </div>
    </div>
  )
}

function Row({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-fg-2">{label}</span>
      <span className={`font-mono ${warn ? 'text-warning' : 'text-fg-0'}`}>{value}</span>
    </div>
  )
}
