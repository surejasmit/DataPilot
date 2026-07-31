import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  FolderKanban, Lightbulb, MessageSquare, BarChart3,
  Upload, FileSpreadsheet, FileText,
  ArrowRight, Plus, Loader2, ArrowUpRight,
  AlertCircle, Database, Layers, Activity, TrendingUp,
} from 'lucide-react'
import { useRecentProjects, useProjectStats } from '@/hooks/useProjects'

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

const activityIcons: Record<string, { icon: any; color: string }> = {
  project: { icon: FolderKanban, color: 'bg-accent-bg text-accent' },
  dataset: { icon: FileSpreadsheet, color: 'bg-data-1-bg text-data-1' },
  insight: { icon: Lightbulb, color: 'bg-data-3-bg text-data-3' },
  report: { icon: FileText, color: 'bg-info-bg text-info' },
  chat: { icon: MessageSquare, color: 'bg-data-4-bg text-data-4' },
}

export function DashboardPage() {
  const navigate = useNavigate()
  const { recentProjects, loading, error, refetch } = useRecentProjects(4)
  const { stats } = useProjectStats()

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold text-fg-0 tracking-tight">Dashboard</h1>
          <p className="text-fg-2">Loading your workspace...</p>
        </section>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} variant="elevated" className="p-5 animate-pulse">
                  <div className="h-4 bg-bg-2 rounded w-1/3 mb-3" />
                  <div className="h-7 bg-bg-2 rounded w-1/2" />
                </Card>
              ))}
            </div>
            <Card variant="elevated" className="p-6 animate-pulse">
              <div className="h-5 bg-bg-2 rounded w-1/4 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-20 bg-bg-2 rounded-lg" />
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} variant="elevated" className="p-4 animate-pulse">
                <div className="h-4 bg-bg-2 rounded w-1/2 mb-2" />
                <div className="h-3 bg-bg-2 rounded w-3/4" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in">
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold text-fg-0 tracking-tight">Dashboard</h1>
          <p className="text-fg-2">Start analyzing datasets with AI-powered insights.</p>
        </section>
        <Card variant="outlined" className="p-4 border-error/30 bg-error-bg/20">
          <div className="flex items-center gap-3 text-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
            <Button variant="ghost" size="sm" className="ml-auto" onClick={refetch}>
              Retry
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  const dashboardStats = [
    {
      label: 'Projects',
      value: stats.totalProjects.toString(),
      change: stats.totalProjects > 0 ? `${stats.completedProjects} completed` : 'No projects yet',
      trend: stats.totalProjects > 0 ? 'up' as const : 'down' as const,
      icon: FolderKanban,
      color: 'text-accent',
      bgColor: 'bg-accent-bg',
    },
    {
      label: 'Datasets',
      value: stats.totalDatasets.toString(),
      change: stats.totalDatasets > 0 ? 'Active' : 'No datasets',
      trend: 'up' as const,
      icon: Database,
      color: 'text-data-1',
      bgColor: 'bg-data-1-bg',
    },
    {
      label: 'Insights',
      value: stats.totalDatasets.toString(),
      change: 'Generated',
      trend: 'up' as const,
      icon: Lightbulb,
      color: 'text-data-3',
      bgColor: 'bg-data-3-bg',
    },
    {
      label: 'In Progress',
      value: stats.draftProjects.toString(),
      change: stats.draftProjects > 0 ? 'Active drafts' : 'All caught up',
      trend: 'up' as const,
      icon: Layers,
      color: 'text-data-2',
      bgColor: 'bg-data-2-bg',
    },
  ]

  const mockActivity = recentProjects.slice(0, 5).map((p, i) => ({
    id: p.id,
    type: i === 0 ? 'dataset' : i === 1 ? 'insight' : 'project',
    title: i === 0 ? `Uploaded ${p.dataset_name || 'dataset'}` : i === 1 ? `Generated insights for ${p.name}` : `Updated ${p.name}`,
    time: formatDate(p.updated_at),
    project: p.name,
  }))

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 space-y-6">
          <section>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-fg-0 tracking-tight">Dashboard</h1>
                <p className="text-sm text-fg-2 mt-1">Your data analysis workspace</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => navigate('/projects/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
                <Button variant="outline" onClick={() => navigate('/ask-ai')}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Ask AI
                </Button>
              </div>
            </div>
          </section>

          <section>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardStats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <Card variant="elevated" className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', stat.bgColor)}>
                          <Icon className={cn('w-4.5 h-4.5', stat.color)} />
                        </div>
                        <div className={cn('flex items-center gap-1 text-xs font-medium',
                          stat.trend === 'up' ? 'text-success' : 'text-fg-3'
                        )}>
                          {stat.trend === 'up' ? <ArrowUpRight className="w-3.5 h-3.5" /> : null}
                          <span>{stat.change}</span>
                        </div>
                      </div>
                      <p className="text-2xl font-semibold text-fg-0">{stat.value}</p>
                      <p className="text-xs text-fg-3 mt-1">{stat.label}</p>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-fg-0">Recent Projects</h2>
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate('/projects')}>
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            {recentProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recentProjects.slice(0, 4).map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      variant="elevated"
                      className="p-4 hover:shadow-md transition-all cursor-pointer group"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-accent-bg text-accent flex items-center justify-center flex-shrink-0">
                            <FolderKanban className="w-4.5 h-4.5" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium text-fg-0 truncate group-hover:text-accent transition-colors">
                              {project.name}
                            </h3>
                            <p className="text-xs text-fg-3 truncate">{project.dataset_name || 'No dataset'}</p>
                          </div>
                        </div>
                        <Badge
                          variant={project.status === 'completed' ? 'success' : project.status === 'processing' ? 'info' : 'default'}
                          size="sm"
                        >
                          {project.status}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-fg-3">
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="w-3 h-3" />
                          {formatRows(project.dataset_rows)} rows
                        </span>
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3" />
                          {formatBytes(project.dataset_size)}
                        </span>
                        <span className="ml-auto">{formatDate(project.updated_at)}</span>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card variant="outlined" className="p-10 text-center">
                <FolderKanban className="w-12 h-12 text-fg-3 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-fg-0 mb-1">No projects yet</h3>
                <p className="text-xs text-fg-2 mb-4">Create your first project to start analyzing data</p>
                <Button size="sm" onClick={() => navigate('/projects/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </Card>
            )}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-fg-0">Recent Activity</h2>
            </div>
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-border-1">
                {mockActivity.map((activity, index) => {
                  const activityStyle = activityIcons[activity.type] || activityIcons.project
                  const Icon = activityStyle.icon
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="p-3.5 hover:bg-bg-1 transition-colors flex items-center gap-3"
                    >
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', activityStyle.color)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-fg-0 truncate">{activity.title}</p>
                        <p className="text-xs text-fg-3">{activity.project}</p>
                      </div>
                      <span className="text-xs text-fg-3 font-mono whitespace-nowrap">{activity.time}</span>
                    </motion.div>
                  )
                })}
                {recentProjects.length === 0 && (
                  <div className="p-6 text-center text-fg-2">
                    <Activity className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No recent activity</p>
                  </div>
                )}
              </div>
            </Card>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-fg-0">Pinned Insights</h2>
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate('/insights')}>
                View all <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card variant="elevated" className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-data-3-bg text-data-3 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg-0">Top Pattern Detected</p>
                    <p className="text-xs text-fg-2 mt-0.5">Revenue growth correlates with customer retention rate across all segments</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="success" size="sm">92% confidence</Badge>
                      <span className="text-[11px] text-fg-3">2h ago</span>
                    </div>
                  </div>
                </div>
              </Card>
              <Card variant="elevated" className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-warning-bg text-warning flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-fg-0">Anomaly in Sales Data</p>
                    <p className="text-xs text-fg-2 mt-0.5">Unusual spike detected in Q1 West region sales (3.2x standard deviation)</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="warning" size="sm">Critical</Badge>
                      <span className="text-[11px] text-fg-3">5h ago</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </section>
        </div>

        <aside className="w-full lg:w-72 flex-shrink-0 space-y-4">
          <Card variant="elevated" className="p-4">
            <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-1.5">
              {[
                { label: 'Upload Dataset', icon: Upload, route: '/projects/new', color: 'text-accent' },
                { label: 'AI Insights', icon: Lightbulb, route: '/insights', color: 'text-data-3' },
                { label: 'Ask AI Chat', icon: MessageSquare, route: '/ask-ai', color: 'text-data-4' },
                { label: 'View Reports', icon: BarChart3, route: '/analytics', color: 'text-data-2' },
              ].map(action => (
                <button
                  key={action.route}
                  onClick={() => navigate(action.route)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-fg-1 hover:text-fg-0 hover:bg-bg-2 transition-colors text-left"
                >
                  <action.icon className={cn('w-4 h-4 flex-shrink-0', action.color)} />
                  {action.label}
                  <ArrowRight className="w-3 h-3 ml-auto text-fg-3 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </Card>

          <Card variant="elevated" className="p-4">
            <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3">Storage</h3>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-fg-2">Used</span>
                  <span className="font-mono text-fg-0">2.4 GB / 5 GB</span>
                </div>
                <div className="h-1.5 bg-bg-2 rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: '48%' }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-bg-2 rounded-lg">
                  <p className="text-[11px] text-fg-3">Datasets</p>
                  <p className="text-sm font-semibold text-fg-0">{stats.totalDatasets}</p>
                </div>
                <div className="p-2.5 bg-bg-2 rounded-lg">
                  <p className="text-[11px] text-fg-3">Projects</p>
                  <p className="text-sm font-semibold text-fg-0">{stats.totalProjects}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card variant="elevated" className="p-4">
            <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3">Recent Chats</h3>
            <div className="space-y-2">
              {[
                { question: 'Which region had highest growth?', time: '2h ago' },
                { question: 'Show customer churn patterns', time: '1d ago' },
                { question: 'Compare Q1 vs Q2 revenue', time: '3d ago' },
              ].map((chat, i) => (
                <button
                  key={i}
                  onClick={() => navigate('/ask-ai')}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-bg-2 transition-colors group"
                >
                  <p className="text-xs text-fg-1 truncate group-hover:text-fg-0">{chat.question}</p>
                  <p className="text-[11px] text-fg-3 mt-0.5">{chat.time}</p>
                </button>
              ))}
            </div>
          </Card>

          <Card variant="elevated" className="p-4">
            <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-3">Processing</h3>
            <div className="space-y-2">
              {recentProjects.filter(p => p.status === 'processing').slice(0, 2).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 bg-warning-bg/20 rounded-lg">
                  <Loader2 className="w-4 h-4 text-warning animate-spin flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-fg-0 truncate">{p.name}</p>
                    <p className="text-[11px] text-fg-3">Analyzing...</p>
                  </div>
                </div>
              ))}
              {recentProjects.filter(p => p.status === 'processing').length === 0 && (
                <p className="text-xs text-fg-3 text-center py-2">No active jobs</p>
              )}
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}
