import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button, Input } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'
import {
  LayoutDashboard,
  FolderKanban,
  FileSpreadsheet,
  Star,
  MoreVertical,
  Eye,
  Edit,
  Download,
  Trash2,
  Search,
  Filter,
  ArrowUpDown,
  ChevronDown,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api'
import { Project } from '@/lib/api'

const statusStyles = {
  completed: 'bg-success-bg text-success border-success/30',
  processing: 'bg-warning-bg text-warning border-warning/30',
  draft: 'bg-info-bg text-info border-info/30',
  archived: 'bg-bg-3 text-fg-3 border-border-2',
  active: 'bg-accent-bg text-accent border-accent/30',
  pending: 'bg-warning-bg text-warning border-warning/30',
  error: 'bg-error-bg text-error border-error/30',
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const formatBytes = (bytes: number | null) => {
  if (!bytes) return 'Unknown'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatRows = (rows: number | null) => {
  if (!rows) return 'Unknown'
  return rows.toLocaleString()
}

export function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | string>('all')
  const [sortBy, setSortBy] = useState<'updated_at' | 'name' | 'dataset_rows' | 'dataset_size'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await api.projects.getAll()
      setProjects(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (key: typeof sortBy) => {
    if (sortBy === key) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(key)
      setSortOrder('desc')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      await api.projects.delete(id)
      setProjects(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const handleToggleFavorite = async (project: Project) => {
    try {
      const updated = await api.projects.toggleFavorite(project.id)
      setProjects(prev => prev.map(p => p.id === project.id ? updated : p))
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        const matchesSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.dataset_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
          (p.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
        const matchesFilter = filterStatus === 'all' || p.status === filterStatus
        return matchesSearch && matchesFilter
      })
      .sort((a, b) => {
        let aVal: string | number = a[sortBy] ?? ''
        let bVal: string | number = b[sortBy] ?? ''
        if (sortBy === 'dataset_rows') {
          aVal = a.dataset_rows ?? 0
          bVal = b.dataset_rows ?? 0
        }
        if (sortBy === 'dataset_size') {
          aVal = a.dataset_size ?? 0
          bVal = b.dataset_size ?? 0
        }
        if (typeof aVal === 'string') {
          aVal = aVal.toLowerCase()
          bVal = bVal.toLowerCase()
        }
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return sortOrder === 'asc' ? comparison : -comparison
      })
  }, [projects, searchQuery, filterStatus, sortBy, sortOrder])

  const statusOptions = Array.from(new Set(projects.map(p => p.status))).filter(Boolean)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-light text-fg-0">Projects</h1>
          <p className="text-fg-1 mt-0.5">Manage and explore your data analysis projects</p>
        </div>
        <Button asChild size="lg" onClick={() => navigate('/projects/new')}>
          <Plus className="w-5 h-5" />
          New Project
        </Button>
      </div>

      {/* Search & Filters */}
      <Card variant="outlined" className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3" />
            <Input
              type="search"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="w-4 h-4" />
                  <span>Status: {filterStatus === 'all' ? 'All' : filterStatus}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                <DropdownMenuItem
                  className={cn('flex items-center gap-2', filterStatus === 'all' && 'text-accent')}
                  onClick={() => setFilterStatus('all')}
                >
                  {filterStatus === 'all' && <span>✓</span>}
                  All
                </DropdownMenuItem>
                {statusOptions.map(status => (
                  <DropdownMenuItem
                    key={status}
                    className={cn('flex items-center gap-2 capitalize', filterStatus === status && 'text-accent')}
                    onClick={() => setFilterStatus(status)}
                  >
                    {filterStatus === status && <span>✓</span>}
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowUpDown className="w-4 h-4" />
                  <span>Sort: {sortBy.replace('_', ' ')}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                {[
                  { key: 'updated_at', label: 'Last Updated' },
                  { key: 'name', label: 'Name' },
                  { key: 'dataset_rows', label: 'Rows' },
                  { key: 'dataset_size', label: 'Size' },
                ].map(({ key, label }) => (
                  <DropdownMenuItem
                    key={key}
                    className="flex items-center justify-between gap-2"
                    onClick={() => handleSort(key as typeof sortBy)}
                  >
                    <span className="capitalize">{label}</span>
                    {sortBy === key && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </Card>

      {error && (
        <Card variant="outlined" className="p-4 border-error/30 bg-error-bg/20">
          <div className="flex items-center gap-3 text-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={fetchProjects}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Projects Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {[1, 2, 3, 4, 5, 6].map(i => (
              <Card key={i} variant="outlined" className="p-4 animate-pulse">
                <div className="h-10 bg-bg-2 rounded w-3/4 mb-3" />
                <div className="h-4 bg-bg-2 rounded w-1/2 mb-3" />
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="h-16 bg-bg-2 rounded" />
                  <div className="h-16 bg-bg-2 rounded" />
                  <div className="h-16 bg-bg-2 rounded" />
                  <div className="h-16 bg-bg-2 rounded" />
                </div>
                <div className="h-4 bg-bg-2 rounded w-1/4" />
              </Card>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="projects"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.03 }}
              >
                <Card variant="outlined" className="p-4 flex flex-col h-full group hover:border-accent/30 transition-colors">
                  <CardContent className="flex-1 p-0">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-bg text-accent flex items-center justify-center flex-shrink-0">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" aria-label="More options">
                            <MoreVertical className="w-4 h-4 text-fg-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Edit className="w-4 h-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-error" onClick={() => handleDelete(project.id)}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <h3 className="font-medium text-fg-0 mb-1 truncate">{project.name}</h3>
                    <p className="text-sm text-fg-2 mb-3 truncate">{project.dataset_name || 'No dataset'}</p>

                    <div className="grid grid-cols-2 gap-3 mb-4 p-3 bg-bg-2 rounded-lg">
                      <div>
                        <p className="text-[11px] text-fg-3 uppercase tracking-wider">Rows</p>
                        <p className="font-mono text-fg-0">{formatRows(project.dataset_rows)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-fg-3 uppercase tracking-wider">Columns</p>
                        <p className="font-mono text-fg-0">{project.dataset_columns ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-fg-3 uppercase tracking-wider">Size</p>
                        <p className="font-mono text-fg-0">{formatBytes(project.dataset_size)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-fg-3 uppercase tracking-wider">Updated</p>
                        <p className="font-mono text-fg-0 text-xs">{formatDate(project.updated_at)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-fg-3">
                      <Avatar size="xs" fallback={project.owner_name?.split(' ').map(n => n[0]).join('') || '?'} />
                      <span>{project.owner_name || 'Unknown'}</span>
                      {project.favorite && <Star className="w-3 h-3 fill-current text-warning" />}
                    </div>
                  </CardContent>

                  <div className="border-t border-border-1 mt-4 pt-4 flex items-center justify-between">
                    <Badge className={statusStyles[project.status as keyof typeof statusStyles] || statusStyles.active}>
                      {project.status}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => handleToggleFavorite(project)}
                      >
                        {project.favorite ? (
                          <Star className="w-3 h-3 fill-current text-warning" />
                        ) : (
                          <Star className="w-3 h-3 text-fg-3" />
                        )}
                      </Button>
                      <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <Link to={`/projects/${project.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          Open
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}

            {filteredProjects.length === 0 && projects.length > 0 && (
              <motion.div
                key="empty-filtered"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="col-span-full flex flex-col items-center justify-center py-16 px-8 text-center"
              >
                <FolderKanban className="w-12 h-12 text-fg-3 mb-4" />
                <p className="text-fg-1">No projects found</p>
                <p className="text-sm text-fg-2 mt-1">Try adjusting your search or filters</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {projects.length === 0 && !loading && (
          <motion.div
            key="empty-all"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-full"
          >
            <Card variant="outlined" className="p-12 text-center">
              <FolderKanban className="w-16 h-16 text-fg-3 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-fg-0 mb-2">No projects yet</h3>
              <p className="text-fg-2 mb-6">Create your first project to start analyzing data</p>
              <Button asChild size="lg" onClick={() => navigate('/projects/new')}>
                <Plus className="w-5 h-5" />
                Create New Project
              </Button>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}