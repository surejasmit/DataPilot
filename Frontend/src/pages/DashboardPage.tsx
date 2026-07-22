import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button, Input } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import {
  LayoutDashboard,
  FolderKanban,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Upload,
  Search,
  FileSpreadsheet,
  Zap,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  Plus,
  Menu,
  X,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  Users,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Star,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { ThemeToggle } from '@/components/app/ThemeToggle'
import { NotificationMenu } from '@/components/app/NotificationMenu'
import { UserProfileDropdown } from '@/components/app/UserProfileDropdown'
import { SearchBar } from '@/components/app/SearchBar'
import { useRecentProjects, useProjectStats } from '@/hooks/useProjects'
import { Project } from '@/lib/api'

// Quick Action data
const quickActions = [
  { id: '1', label: 'Upload Dataset', icon: Upload, color: 'bg-accent-bg text-accent', route: '/projects/new' },
  { id: '2', label: 'Generate Insights', icon: Lightbulb, color: 'bg-data-3-bg text-data-3', route: '/insights' },
  { id: '3', label: 'Explore Analytics', icon: BarChart3, color: 'bg-data-2-bg text-data-2', route: '/analytics' },
  { id: '4', label: 'Ask AI', icon: MessageSquare, color: 'bg-data-4-bg text-data-4', route: '/ask-ai' },
  { id: '5', label: 'View Reports', icon: FileText, color: 'bg-info-bg text-info', route: '/reports' },
  { id: '6', label: 'Recent Projects', icon: Clock, color: 'bg-warning-bg text-warning', route: '/projects' },
]

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

const statusStyles: Record<string, string> = {
  completed: 'bg-success-bg text-success border-success/30',
  processing: 'bg-warning-bg text-warning border-warning/30',
  draft: 'bg-info-bg text-info border-info/30',
  archived: 'bg-bg-3 text-fg-3 border-border-2',
  active: 'bg-accent-bg text-accent border-accent/30',
  pending: 'bg-warning-bg text-warning border-warning/30',
  error: 'bg-error-bg text-error border-error/30',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { recentProjects, loading, error, refetch } = useRecentProjects(4)
  const { stats } = useProjectStats()

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <section className="space-y-4">
          <h1 className="text-3xl font-light text-fg-0 tracking-tight">Welcome back 👋</h1>
          <p className="text-fg-1">Start analyzing datasets with AI-powered insights.</p>
        </section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <Card key={i} variant="elevated" className="p-5 animate-pulse">
              <div className="h-6 bg-bg-2 rounded w-1/4 mb-2" />
              <div className="h-8 bg-bg-2 rounded w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <section className="space-y-4">
          <h1 className="text-3xl font-light text-fg-0 tracking-tight">Welcome back 👋</h1>
          <p className="text-fg-1">Start analyzing datasets with AI-powered insights.</p>
        </section>
        <Card variant="outlined" className="p-4 border-error/30 bg-error-bg/20">
          <div className="flex items-center gap-3 text-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={refetch}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Compute stats from real data
  const dashboardStats = [
    { 
      label: 'Projects', 
      value: stats.totalProjects.toString(), 
      change: stats.totalProjects > 0 ? `${stats.completedProjects} completed` : 'No projects yet', 
      trend: stats.totalProjects > 0 ? 'up' as const : 'down' as const, 
      icon: FolderKanban, 
      color: 'text-data-2' 
    },
    { 
      label: 'Datasets', 
      value: stats.totalDatasets.toString(), 
      change: stats.totalDatasets > 0 ? 'Active' : 'No datasets', 
      trend: 'up' as const, 
      icon: FileSpreadsheet, 
      color: 'text-data-1' 
    },
    { 
      label: 'Completed', 
      value: stats.completedProjects.toString(), 
      change: stats.totalProjects > 0 ? `${Math.round((stats.completedProjects / stats.totalProjects) * 100)}%` : '0%', 
      trend: 'up' as const, 
      icon: CheckCircle, 
      color: 'text-success' 
    },
    { 
      label: 'In Progress', 
      value: stats.draftProjects.toString(), 
      change: stats.draftProjects > 0 ? 'Drafts' : 'None', 
      trend: 'up' as const, 
      icon: FileText, 
      color: 'text-data-4' 
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Hero Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light text-fg-0 tracking-tight">Welcome back 👋</h1>
            <p className="text-fg-1 mt-1">Start analyzing datasets with AI-powered insights.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" onClick={() => navigate('/projects/new')}>
              <Plus className="w-5 h-5" />
              Create New Project
            </Button>
            <Button asChild variant="outline" size="lg" onClick={() => navigate('/analytics')}>
              <BarChart3 className="w-5 h-5" />
              View Dashboard
            </Button>
            <Button asChild variant="ghost" size="lg" onClick={() => navigate('/ask-ai')}>
              <MessageSquare className="w-5 h-5" />
              Ask AI
            </Button>
          </div>
        </div>
      </section>

      {/* Statistics Cards */}
      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.4 }}
                className="group"
              >
                <Card variant="elevated" className="p-5 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-fg-2 font-medium">{stat.label}</p>
                      <p className="text-3xl font-semibold text-fg-0">{stat.value}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={cn('text-sm font-medium', stat.trend === 'up' ? 'text-success' : 'text-error')}>
                          {stat.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Mini sparkline */}
                  <div className="mt-4 h-16 relative">
                    <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                      <path
                        d="M0,50 L20,45 L40,48 L60,42 L80,45 L100,38 L120,42 L140,36 L160,40 L180,35 L200,30"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                      />
                    </svg>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Quick Action Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-fg-0">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03, duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(action.route)}
                className={cn(
                  'group p-4 rounded-xl bg-bg-1 border border-border-1 text-left transition-all duration-200',
                  'hover:border-accent/50 hover:bg-accent-bg/20 hover:shadow-lg'
                )}
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-3', action.color)}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-fg-0 group-hover:text-accent transition-colors">{action.label}</span>
                <ArrowRight className="w-4 h-4 text-fg-3 group-hover:text-accent transition-all absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0" />
              </motion.button>
            )
          })}
        </div>
      </section>

      {/* Recent Projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-fg-0">Recent Projects</h2>
          <Button asChild variant="ghost" size="sm" onClick={() => navigate('/projects')}>
            View all <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card variant="elevated" className="h-full flex flex-col">
                  <CardContent className="flex-1 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-accent-bg text-accent flex items-center justify-center">
                        <FolderKanban className="w-5 h-5" />
                      </div>
                      <Badge
                        variant={
                          project.status === 'completed' ? 'success' :
                          project.status === 'processing' ? 'info' : 'default'
                        }
                        size="sm"
                      >
                        {project.status}
                      </Badge>
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

                  <div className="border-t border-border-1 mt-4 pt-4 flex items-center justify-between bg-bg-0/50">
                    <Badge className={statusStyles[project.status as keyof typeof statusStyles] || statusStyles.active}>
                      {project.status}
                    </Badge>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="h-auto px-2"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <Link to={`/projects/${project.id}`}>Open <ExternalLink className="w-3 h-3 ml-1" /></Link>
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card variant="outlined" className="p-12 text-center">
            <FolderKanban className="w-16 h-16 text-fg-3 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-fg-0 mb-2">No projects yet</h3>
            <p className="text-fg-2 mb-6">Create your first project to start analyzing data</p>
            <Button asChild size="lg" onClick={() => navigate('/projects/new')}>
              <Plus className="w-5 h-5" />
              Create New Project
            </Button>
          </Card>
        )}
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-fg-0">Recent Activity</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/activity">View all</Link>
          </Button>
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-border-1">
            {recentProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 hover:bg-bg-1 transition-colors flex items-center gap-4"
              >
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', statusStyles[project.status as keyof typeof statusStyles] || 'bg-accent-bg text-accent')}>
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-fg-0">{project.name}</p>
                  <p className="text-xs text-fg-2 mt-0.5">{project.dataset_name || 'No dataset'} • {formatRows(project.dataset_rows)} rows</p>
                </div>
                <span className="text-xs text-fg-3 font-mono whitespace-nowrap">{formatDate(project.updated_at)}</span>
              </motion.div>
            ))}
            {recentProjects.length === 0 && (
              <div className="p-8 text-center text-fg-2">
                <FolderKanban className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      </section>
    </div>
  )
}