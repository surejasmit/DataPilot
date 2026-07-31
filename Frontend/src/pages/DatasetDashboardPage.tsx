import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Input } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { api, Project, DatasetPreview, AnalysisData } from '@/lib/api'
import {
  Database, FileSpreadsheet, Rows3, Columns3, AlertTriangle, AlertCircle, CheckCircle2,
  Table2, Info, ArrowUpDown, Search, ChevronLeft, ChevronRight,
  Loader2, BarChart3, Activity, Hash, Type, Calendar, Download,
  Trash2, Sparkles, FileText, RefreshCw, ShieldAlert,
  X, Check, Settings2, Braces, TrendingUp,
  ClipboardCheck, ClipboardX, PieChart, ScatterChart, LineChart
} from 'lucide-react'

type Tab = 'preview' | 'columns' | 'quality' | 'charts' | 'cleaning'

const chartIcons: Record<string, any> = {
  bar: BarChart3,
  pie: PieChart,
  histogram: BarChart3,
  scatter: ScatterChart,
  line: LineChart,
  heatmap: Activity,
  boxplot: Activity,
}

export function DatasetDashboardPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [preview, setPreview] = useState<DatasetPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('preview')
  const [previewPage, setPreviewPage] = useState(1)
  const [previewSearch, setPreviewSearch] = useState('')
  const [previewSortCol, setPreviewSortCol] = useState('')
  const [previewSortOrder, setPreviewSortOrder] = useState<'asc' | 'desc'>('asc')
  const [previewLimit, setPreviewLimit] = useState(20)
  const [qualityLoading, setQualityLoading] = useState(false)
  const [cleaningLoading, setCleaningLoading] = useState<number | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{ issue: any; operation: string; label: string } | null>(null)
  const [confirmCleanDialog, setConfirmCleanDialog] = useState<{ operation: string } | null>(null)
  const [cleaningHistory, setCleaningHistory] = useState<any[]>([])
  const [exporting, setExporting] = useState(false)

  const hasDataset = !!project?.dataset_name
  const isAnalyzing = analysis?.status === 'UPLOADING' || analysis?.status === 'ANALYZING' || project?.status === 'UPLOADING' || project?.status === 'ANALYZING'
  const isFailed = analysis?.status === 'FAILED' || project?.status === 'FAILED'

  const loadAnalysis = useCallback(async (isRefresh = false) => {
    if (!id) return
    if (!isRefresh) setLoading(true)
    setError(null)
    try {
      const projectData = await api.projects.getById(id)
      setProject(projectData)
      if (projectData.dataset_name) {
        const analysisData = await api.analysis.get(id)
        setAnalysis(analysisData)
        if (!isRefresh) {
          const previewData = await api.datasets.getPreview(id, 1, previewLimit, '', '', 'asc')
          setPreview(previewData)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analysis')
    } finally {
      if (!isRefresh) setLoading(false)
    }
  }, [id, previewLimit])

  const loadPreview = useCallback(async () => {
    if (!id || !hasDataset) return
    try {
      const data = await api.datasets.getPreview(id, previewPage, previewLimit, previewSearch, previewSortCol, previewSortOrder)
      setPreview(data)
    } catch { /* ignore */ }
  }, [id, hasDataset, previewPage, previewLimit, previewSearch, previewSortCol, previewSortOrder])

  const loadQualityReport = useCallback(async () => {
    if (!id || !hasDataset) return
    setQualityLoading(true)
    try {
      await api.datasets.getQualityReport(id)
      const analysisData = await api.analysis.get(id)
      setAnalysis(analysisData)
    } catch {
      try {
        await api.datasets.generateQualityReport(id!)
        const analysisData = await api.analysis.get(id)
        setAnalysis(analysisData)
      } catch { /* ignore */ }
    } finally {
      setQualityLoading(false)
    }
  }, [id, hasDataset])

  const loadCleaningHistory = useCallback(async () => {
    if (!id) return
    try {
      const history = await api.datasets.getCleaningHistory(id)
      setCleaningHistory(history)
    } catch { /* ignore */ }
  }, [id])

  useEffect(() => { loadAnalysis() }, [loadAnalysis])
  useEffect(() => { if (hasDataset) loadPreview() }, [loadPreview, hasDataset])
  useEffect(() => { if (hasDataset) { loadQualityReport(); loadCleaningHistory() } }, [hasDataset, loadQualityReport, loadCleaningHistory])

  useEffect(() => {
    let interval: any
    if (isAnalyzing) {
      interval = setInterval(() => {
        loadAnalysis(true)
      }, 3000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isAnalyzing, loadAnalysis])

  const handleConfirmCleaning = async () => {
    if (confirmDialog && id) {
      setCleaningLoading(-1)
      try {
        await api.datasets.getPreview(id, 1, 1)
      } catch { /* ignore */ }
      setCleaningLoading(null)
      setConfirmDialog(null)
      loadAnalysis(true)
      loadQualityReport()
      loadCleaningHistory()
    }
  }

  const handleConfirmCleanOperation = async () => {
    if (confirmCleanDialog && id) {
      setCleaningLoading(-1)
      try {
        const history = await api.datasets.getCleaningHistory(id)
        const pendingOp = history.find(h => h.status === 'pending')
        if (pendingOp) {
          await api.datasets.confirmCleaning(id, pendingOp.id)
        }
      } catch { /* ignore */ }
      setCleaningLoading(null)
      setConfirmCleanDialog(null)
      loadAnalysis(true)
      loadQualityReport()
      loadCleaningHistory()
    }
  }

  const handleExportReport = async () => {
    if (!id) return
    setExporting(true)
    try {
      const blob = await api.analysis.exportReport(id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${project?.name || 'report'}_report.pdf`
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

  const handleIssueAction = async (issue: any, operation: string) => {
    if (!id) return
    const labels: Record<string, string> = {
      'remove_missing': 'Remove Missing Values',
      'fill_missing': 'Fill Missing Values',
      'remove_duplicates': 'Remove Duplicate Rows',
      'trim_spaces': 'Trim Spaces',
      'convert_types': 'Convert Data Types',
      'normalize': 'Normalize Data',
      'standardize': 'Standardize Data',
    }
    setConfirmDialog({ issue, operation, label: labels[operation] || operation })
  }

  const executeCleaning = async (operation: string) => {
    if (!id || !project) return
    setConfirmCleanDialog({ operation })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="mt-3 text-sm text-fg-2">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card variant="outlined" className="p-8 max-w-md w-full text-center border-error/30 bg-error-bg/10">
          <AlertCircle className="w-10 h-10 text-error mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">Error Loading Analysis</h3>
          <p className="text-sm text-fg-2 mb-4">{error}</p>
          <Button onClick={loadAnalysis}><RefreshCw className="w-4 h-4 mr-2" />Retry</Button>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card variant="outlined" className="p-8 max-w-md w-full text-center">
          <Database className="w-10 h-10 text-fg-3 mx-auto mb-3" />
          <h3 className="text-base font-medium text-fg-0 mb-2">Project Not Found</h3>
          <p className="text-sm text-fg-2 mb-4">The requested project does not exist.</p>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold text-fg-0">{project.name}</h1>
              <Badge className={project.status === 'READY' || project.status === 'completed' ? 'bg-success-bg text-success' : project.status === 'ANALYZING' || project.status === 'processing' ? 'bg-warning-bg text-warning' : 'bg-info-bg text-info'}>{project.status}</Badge>
            </div>
            <p className="text-sm text-fg-2 mt-1">{project.dataset_name || 'No dataset uploaded'}</p>
          </div>
          <div className="flex gap-2">
            {project.dataset_name && (
              <>
                <Button variant="outline" size="sm" onClick={handleExportReport} disabled={exporting}>
                  {exporting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {exporting ? 'Generating...' : 'Export Report'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/insights`)}>
                  <Sparkles className="w-4 h-4 mr-2" />Insights
                </Button>
                <Button variant="outline" size="sm" onClick={() => { loadAnalysis(true); loadQualityReport(); loadCleaningHistory() }}>
                  <RefreshCw className="w-4 h-4 mr-2" />Refresh
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {!project.dataset_name || analysis?.status === 'no_dataset' ? (
        <Card variant="outlined" className="p-12 text-center">
          <Database className="w-16 h-16 text-fg-3 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-fg-0 mb-2">No Dataset File Found</h3>
          <p className="text-fg-2 mb-6">This project has a dataset name set but no actual file was uploaded. Please upload the file.</p>
          <Button onClick={() => navigate(`/projects/${id}/upload`)}>
            <FileSpreadsheet className="w-4 h-4 mr-2" />Upload Dataset
          </Button>
        </Card>
      ) : (
        <>
          {(analysis?.status === 'UPLOADING' || analysis?.status === 'ANALYZING' || project?.status === 'UPLOADING' || project?.status === 'ANALYZING') && (
            <div className="p-4 bg-warning-bg/20 border border-warning/30 rounded-xl flex items-center gap-3 mb-4 animate-pulse">
              <Loader2 className="w-5 h-5 text-warning animate-spin flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-warning">Dataset Analysis in Progress...</p>
                <p className="text-xs text-fg-2">Python ML service is analyzing rows, columns, data types, and statistics. Page will update automatically when complete.</p>
              </div>
            </div>
          )}
          {(analysis?.status === 'FAILED' || project?.status === 'FAILED') && (
            <div className="p-4 bg-error-bg/20 border border-error/30 rounded-xl flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-error">Dataset Analysis Failed</p>
                <p className="text-xs text-fg-2">The ML service encountered an error while analyzing the dataset. Please try refreshing or re-uploading.</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => loadAnalysis(true)}>
                <RefreshCw className="w-4 h-4 mr-1" />Retry
              </Button>
            </div>
          )}
          {analysis?.datasetSummary && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <Card variant="elevated" className="p-4">
                <h2 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-accent" /> Dataset Summary
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  <ProfileCard label="Dataset Name" value={analysis.datasetSummary.datasetName || 'N/A'} icon={FileText} />
                  <ProfileCard label="Dataset Size" value={analysis.datasetSummary.datasetSize ? `${(analysis.datasetSummary.datasetSize / 1024 / 1024).toFixed(2)} MB` : 'N/A'} icon={Database} />
                  <ProfileCard label="Rows" value={analysis.datasetSummary.totalRows?.toLocaleString() || '0'} icon={Rows3} />
                  <ProfileCard label="Columns" value={analysis.datasetSummary.totalColumns?.toString() || '0'} icon={Columns3} />
                  <ProfileCard label="Missing Values" value={analysis.dataQuality?.missingValues?.toString() || '0'} icon={AlertTriangle} severity={analysis.dataQuality && analysis.dataQuality.missingValues > 0 ? 'warning' : 'success'} />
                  <ProfileCard label="Duplicate Rows" value={analysis.dataQuality?.duplicateRows?.toString() || '0'} icon={AlertTriangle} severity={analysis.dataQuality && analysis.dataQuality.duplicateRows > 0 ? 'warning' : 'success'} />
                  <ProfileCard label="Numeric Columns" value={analysis.dataQuality?.numericColumns?.length?.toString() || '0'} icon={Hash} />
                  <ProfileCard label="Categorical Columns" value={analysis.dataQuality?.categoricalColumns?.length?.toString() || '0'} icon={Type} />
                  <ProfileCard label="Memory Usage" value={analysis.datasetSummary.memoryUsage ? `${(analysis.datasetSummary.memoryUsage / 1024 / 1024).toFixed(2)} MB` : 'N/A'} icon={Activity} />
                  <ProfileCard label="File Type" value={analysis.datasetSummary.fileType || 'N/A'} icon={FileSpreadsheet} />
                  <ProfileCard label="Upload Date" value={analysis.datasetSummary.uploadDate ? new Date(analysis.datasetSummary.uploadDate).toLocaleDateString() : 'N/A'} icon={Calendar} />
                  <ProfileCard label="Shape" value={`${analysis.datasetSummary.totalRows}x${analysis.datasetSummary.totalColumns}`} icon={Table2} />
                </div>
              </Card>
            </motion.div>
          )}

          <Card variant="elevated" className="overflow-hidden">
            <div className="flex border-b border-border-1 overflow-x-auto">
              {([
                { key: 'preview' as Tab, label: 'Data Preview', icon: Table2 },
                { key: 'columns' as Tab, label: 'Columns', icon: Columns3 },
                { key: 'quality' as Tab, label: 'Quality', icon: ShieldAlert },
                { key: 'charts' as Tab, label: 'Charts', icon: BarChart3 },
                { key: 'cleaning' as Tab, label: 'Cleaning', icon: Settings2 },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap',
                    activeTab === tab.key ? 'border-accent text-accent' : 'border-transparent text-fg-2 hover:text-fg-0'
                  )}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-4">
              <AnimatePresence mode="wait">
                {activeTab === 'preview' && (
                  <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="flex flex-col sm:flex-row gap-3 mb-4">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3" />
                        <Input
                          placeholder="Search data..."
                          value={previewSearch}
                          onChange={e => { setPreviewSearch(e.target.value); setPreviewPage(1) }}
                          className="pl-9 h-9"
                        />
                      </div>
                      <select
                        value={previewLimit}
                        onChange={e => { setPreviewLimit(parseInt(e.target.value)); setPreviewPage(1) }}
                        className="px-3 py-1.5 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-xs"
                      >
                        <option value={10}>10 rows</option>
                        <option value={20}>20 rows</option>
                        <option value={50}>50 rows</option>
                        <option value={100}>100 rows</option>
                      </select>
                    </div>

                    {preview && preview.rows.length > 0 ? (
                      <>
                        <div className="overflow-x-auto border border-border-1 rounded-lg">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-bg-2">
                                <th className="px-3 py-2 text-left text-fg-3 font-medium">#</th>
                                {Object.keys(preview.rows[0]).map(col => (
                                  <th
                                    key={col}
                                    className="px-3 py-2 text-left text-xs font-medium text-fg-2 cursor-pointer hover:text-accent transition-colors"
                                    onClick={() => {
                                      if (previewSortCol === col) {
                                        setPreviewSortOrder(o => o === 'asc' ? 'desc' : 'asc')
                                      } else {
                                        setPreviewSortCol(col)
                                        setPreviewSortOrder('asc')
                                      }
                                    }}
                                  >
                                    <div className="flex items-center gap-1">
                                      {col}
                                      {previewSortCol === col && (
                                        <ArrowUpDown className={cn('w-3 h-3', previewSortOrder === 'desc' && 'rotate-180')} />
                                      )}
                                    </div>
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border-1">
                              {preview.rows.map((row, i) => (
                                <tr key={i} className="hover:bg-bg-1 transition-colors">
                                  <td className="px-3 py-2 text-xs text-fg-3 font-mono">{(preview.page - 1) * preview.limit + i + 1}</td>
                                  {Object.entries(row).map(([col, val]) => (
                                    <td key={col} className="px-3 py-2 text-sm text-fg-0 font-mono max-w-[200px] truncate">
                                      {val === null || val === undefined ? <span className="text-error italic">null</span> : String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <p className="text-sm text-fg-2">
                            Showing {((preview.page - 1) * preview.limit) + 1} - {Math.min(preview.page * preview.limit, preview.total)} of {preview.total.toLocaleString()} rows
                          </p>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" disabled={preview.page <= 1} onClick={() => setPreviewPage(p => p - 1)}>
                              <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-fg-2">Page {preview.page} of {preview.totalPages}</span>
                            <Button variant="outline" size="sm" disabled={preview.page >= preview.totalPages} onClick={() => setPreviewPage(p => p + 1)}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="py-8 text-center">
                        <Table2 className="w-8 h-8 text-fg-3 mx-auto mb-2" />
                        <p className="text-fg-2">{previewSearch ? 'No matching rows found' : 'No preview data available'}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'columns' && (
                  <motion.div key="columns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="overflow-x-auto border border-border-1 rounded-lg">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-bg-2">
                            <th className="px-4 py-2.5 text-left text-fg-3 font-medium uppercase">Column Name</th>
                            <th className="px-4 py-2.5 text-left text-fg-3 font-medium uppercase">Detected Type</th>
                            <th className="px-4 py-2.5 text-left text-fg-3 font-medium uppercase">Examples</th>
                            <th className="px-4 py-2.5 text-right text-fg-3 font-medium uppercase">Unique Values</th>
                            <th className="px-4 py-2.5 text-right text-fg-3 font-medium uppercase">Null Count</th>
                            <th className="px-4 py-2.5 text-right text-fg-3 font-medium uppercase">Null %</th>
                            <th className="px-4 py-2.5 text-center text-fg-3 font-medium uppercase">Type</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-1">
                          {(analysis?.columnAnalysis || []).map(col => (
                            <tr key={col.columnName} className="hover:bg-bg-1 transition-colors">
                              <td className="px-4 py-3 text-sm font-medium text-fg-0 font-mono">{col.columnName}</td>
                              <td className="px-4 py-3">
                                <Badge variant={
                                  col.dataType === 'number' ? 'success' :
                                  col.dataType === 'date' ? 'info' :
                                  col.dataType === 'boolean' ? 'warning' : 'accent'
                                } size="sm">{col.dataType}</Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-fg-2 font-mono max-w-[200px] truncate">
                                {col.modeValue || '—'}
                              </td>
                              <td className="px-4 py-3 text-right text-sm text-fg-0 font-mono">{col.uniqueCount?.toLocaleString() || '—'}</td>
                              <td className="px-4 py-3 text-right text-sm text-fg-0 font-mono">{col.missingCount || '0'}</td>
                              <td className="px-4 py-3 text-right text-sm text-fg-0 font-mono">{col.missingPercentage ? `${col.missingPercentage}%` : '0%'}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge variant={col.isNumeric ? 'success' : col.isCategorical ? 'accent' : col.isDatetime ? 'info' : 'default'} size="sm">
                                  {col.isNumeric ? 'Numeric' : col.isCategorical ? 'Categorical' : col.isDatetime ? 'Date' : 'Other'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'quality' && (
                  <motion.div key="quality" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {qualityLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-accent" />
                        <span className="ml-3 text-fg-2">Analyzing dataset quality...</span>
                      </div>
                    ) : analysis?.dataQuality ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 bg-bg-2 rounded-lg text-center">
                            <p className="text-xl font-semibold text-fg-0">{analysis.dataQuality.totalRows?.toLocaleString()}</p>
                            <p className="text-[11px] text-fg-3">Total Rows</p>
                          </div>
                          <div className="p-3 bg-bg-2 rounded-lg text-center">
                            <p className={cn('text-xl font-semibold', analysis.dataQuality.missingValues > 0 ? 'text-warning' : 'text-success')}>{analysis.dataQuality.missingValues}</p>
                            <p className="text-[11px] text-fg-3">Missing Values</p>
                          </div>
                          <div className="p-3 bg-bg-2 rounded-lg text-center">
                            <p className={cn('text-xl font-semibold', analysis.dataQuality.duplicateRows > 0 ? 'text-warning' : 'text-success')}>{analysis.dataQuality.duplicateRows}</p>
                            <p className="text-[11px] text-fg-3">Duplicate Rows</p>
                          </div>
                          <div className="p-3 bg-bg-2 rounded-lg text-center">
                            <p className="text-xl font-semibold text-fg-0">{analysis.issues?.length || 0}</p>
                            <p className="text-[11px] text-fg-3">Issues Found</p>
                          </div>
                        </div>

                        {analysis.issues && analysis.issues.length > 0 ? (
                          <div className="space-y-2">
                            <h3 className="text-sm font-medium text-fg-0 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-warning" /> Detected Issues
                            </h3>
                            {analysis.issues.map((issue: any, i: number) => (
                              <div key={i} className={cn(
                                'p-3 rounded-lg border flex items-start gap-3',
                                issue.severity === 'critical' ? 'bg-error-bg/20 border-error/30' :
                                issue.severity === 'warning' ? 'bg-warning-bg/20 border-warning/30' :
                                'bg-info-bg/20 border-info/30'
                              )}>
                                <div className={cn(
                                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                                  issue.severity === 'critical' ? 'text-error' :
                                  issue.severity === 'warning' ? 'text-warning' : 'text-info'
                                )}>
                                  {issue.severity === 'critical' ? <AlertCircle className="w-4 h-4" /> :
                                   issue.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                   <Info className="w-4 h-4" />}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-fg-0">{issue.message}</p>
                                  <div className="flex gap-2 mt-2">
                                    {issue.type === 'missing_values' && (
                                      <>
                                        <Button variant="outline" size="sm" onClick={() => handleIssueAction(issue, 'remove_missing')}>
                                          <Trash2 className="w-3 h-3 mr-1" /> Remove Missing
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleIssueAction(issue, 'fill_missing')}>
                                          <ClipboardCheck className="w-3 h-3 mr-1" /> Fill Missing
                                        </Button>
                                      </>
                                    )}
                                    {issue.type === 'duplicate_rows' && (
                                      <Button variant="outline" size="sm" onClick={() => handleIssueAction(issue, 'remove_duplicates')}>
                                        <Trash2 className="w-3 h-3 mr-1" /> Remove Duplicates
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-6 text-center">
                            <CheckCircle2 className="w-10 h-10 text-success mx-auto mb-2" />
                            <p className="text-fg-0 font-medium">No issues detected</p>
                            <p className="text-sm text-fg-2">Your dataset looks clean!</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <ShieldAlert className="w-8 h-8 text-fg-3 mx-auto mb-2" />
                        <p className="text-fg-2">Generate quality report to see issues</p>
                        <Button variant="outline" size="sm" className="mt-3" onClick={loadQualityReport} loading={qualityLoading}>
                          <RefreshCw className="w-4 h-4 mr-2" /> Generate Report
                        </Button>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'charts' && (
                  <motion.div key="charts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {analysis?.chartRecommendations && analysis.chartRecommendations.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {analysis.chartRecommendations.map((rec, i) => {
                          const Icon = chartIcons[rec.type] || BarChart3
                          return (
                            <Card key={i} variant="outlined" className="p-3 hover:border-accent/30 transition-all">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="accent" size="sm">{rec.type}</Badge>
                                <span className="text-sm font-medium text-fg-0">{rec.title}</span>
                              </div>
                              <div className="h-24 flex items-center justify-center bg-bg-2 rounded-lg mb-2">
                                <Icon className="w-8 h-8 text-accent/50" />
                              </div>
                              <p className="text-xs text-fg-2 mb-2">{rec.reason}</p>
                              <div className="flex flex-wrap gap-1">
                                {(Array.isArray(rec.columns) ? rec.columns : [rec.columns]).map((col: string, j: number) => (
                                  <Badge key={j} variant="default" size="sm" className="bg-bg-2 text-fg-2">{col}</Badge>
                                ))}
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <BarChart3 className="w-8 h-8 text-fg-3 mx-auto mb-2" />
                        <p className="text-fg-2">No chart recommendations available</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'cleaning' && (
                  <motion.div key="cleaning" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { op: 'remove_missing', label: 'Remove Missing Values', icon: Trash2 },
                          { op: 'fill_missing', label: 'Fill Missing Values', icon: ClipboardCheck },
                          { op: 'remove_duplicates', label: 'Remove Duplicate Rows', icon: ClipboardX },
                          { op: 'trim_spaces', label: 'Trim Spaces', icon: Settings2 },
                          { op: 'normalize', label: 'Normalize Data', icon: TrendingUp },
                          { op: 'standardize', label: 'Standardize Data', icon: Activity },
                          { op: 'convert_types', label: 'Convert Data Types', icon: Braces },
                        ].map(item => (
                          <button
                            key={item.op}
                            onClick={() => executeCleaning(item.op)}
                            className="p-3 bg-bg-2 border border-border-1 rounded-xl text-center hover:border-accent/50 transition-all group"
                          >
                            <item.icon className="w-5 h-5 text-accent mx-auto mb-1.5 group-hover:scale-110 transition-transform" />
                            <p className="text-xs font-medium text-fg-0">{item.label}</p>
                          </button>
                        ))}
                      </div>

                      {cleaningHistory.length > 0 && (
                        <div>
                          <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-2">Cleaning History</h3>
                          <div className="space-y-1.5">
                            {cleaningHistory.map((h: any) => (
                              <div key={h.id} className="flex items-center justify-between p-2.5 bg-bg-2 rounded-lg text-xs">
                                <div>
                                  <p className="text-fg-0">{h.operation.replace(/_/g, ' ')}</p>
                                  <p className="text-fg-3 text-[11px]">{new Date(h.created_at).toLocaleString()}</p>
                                </div>
                                <Badge variant={h.status === 'confirmed' ? 'success' : h.status === 'pending' ? 'warning' : 'default'} size="sm">{h.status}</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Card>
        </>
      )}

      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-1 border border-border-1 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-warning-bg text-warning flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg-0">DataPilot AI detected:</h3>
                  <p className="text-sm text-fg-2 mt-1">{confirmDialog.issue.message}</p>
                </div>
              </div>

              <div className="p-3 bg-bg-2 rounded-lg mb-4">
                <p className="text-sm text-fg-0 font-medium">Choose what to do</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {confirmDialog.issue.type === 'missing_values' && (
                  <>
                    <Button variant="outline" size="sm" onClick={() => { handleConfirmCleaning(); setConfirmDialog(null) }} disabled={cleaningLoading !== null}>
                      <Trash2 className="w-4 h-4 mr-2" /> Remove Missing Values
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { handleConfirmCleaning(); setConfirmDialog(null) }} disabled={cleaningLoading !== null}>
                      <ClipboardCheck className="w-4 h-4 mr-2" /> Fill Missing Values
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { handleConfirmCleaning(); setConfirmDialog(null) }} disabled={cleaningLoading !== null}>
                      Median Imputation
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { handleConfirmCleaning(); setConfirmDialog(null) }} disabled={cleaningLoading !== null}>
                      Mean Imputation
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { handleConfirmCleaning(); setConfirmDialog(null) }} disabled={cleaningLoading !== null}>
                      Mode Imputation
                    </Button>
                  </>
                )}
                {confirmDialog.issue.type === 'duplicate_rows' && (
                  <Button variant="outline" size="sm" onClick={() => { handleConfirmCleaning(); setConfirmDialog(null) }} disabled={cleaningLoading !== null}>
                    <Trash2 className="w-4 h-4 mr-2" /> Remove Duplicate Rows
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setConfirmDialog(null)}>
                  <X className="w-4 h-4 mr-2" /> Ignore
                </Button>
              </div>

              {cleaningLoading !== null && (
                <div className="flex items-center gap-2 text-sm text-accent">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmCleanDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmCleanDialog(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-bg-1 border border-border-1 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-warning-bg text-warning flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-fg-0">Confirm Operation</h3>
                  <p className="text-sm text-fg-2 mt-1">
                    {confirmCleanDialog.operation === 'remove_missing' && 'Remove all rows with missing values?'}
                    {confirmCleanDialog.operation === 'fill_missing' && 'Fill missing values with mode/mean/median?'}
                    {confirmCleanDialog.operation === 'remove_duplicates' && 'Remove all duplicate rows?'}
                    {confirmCleanDialog.operation === 'trim_spaces' && 'Trim whitespace from all string columns?'}
                    {confirmCleanDialog.operation === 'normalize' && 'Normalize numeric columns (0-1 range)?'}
                    {confirmCleanDialog.operation === 'standardize' && 'Standardize numeric columns (z-score)?'}
                    {confirmCleanDialog.operation === 'convert_types' && 'Convert data types?'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setConfirmCleanDialog(null)}>
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={handleConfirmCleanOperation} disabled={cleaningLoading !== null}>
                  <Check className="w-4 h-4 mr-2" /> Yes
                </Button>
              </div>

              {cleaningLoading !== null && (
                <div className="flex items-center gap-2 text-sm text-accent mt-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing...
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProfileCard({ label, value, icon: Icon, severity }: { label: string; value: string; icon: any; severity?: 'warning' | 'success' | 'info' }) {
  return (
    <div className="p-2.5 bg-bg-2 rounded-lg">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn('w-3 h-3', severity === 'warning' ? 'text-warning' : severity === 'success' ? 'text-success' : 'text-accent')} />
        <p className="text-[11px] text-fg-3 truncate">{label}</p>
      </div>
      <p className="text-sm font-semibold text-fg-0 truncate">{value}</p>
    </div>
  )
}
