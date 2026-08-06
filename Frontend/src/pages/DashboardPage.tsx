import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BusinessDomainBadge, getDomainFromProjectName } from '@/components/ui/BusinessDomainBadge'
import {
  FolderOpen, Database, Lightbulb, FileText,
  Plus, ArrowUpRight, ArrowRight,
  AlertCircle, Activity,
  FileSpreadsheet,
} from 'lucide-react'
import { useRecentProjects, useProjectStats } from '@/hooks/useProjects'
import { useMemo } from 'react'

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

export function DashboardPage() {
  const navigate = useNavigate()
  const { recentProjects, loading, error, refetch } = useRecentProjects(8)
  const { stats, projects } = useProjectStats()

  const allProjects = useMemo(() => {
    return [...projects].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
  }, [projects])

  const domainDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    projects.forEach(p => {
      const domain = getDomainFromProjectName(p.name)
      counts[domain] = (counts[domain] || 0) + 1
    })
    return Object.entries(counts)
      .map(([domain, count]) => ({ domain, count, percentage: projects.length > 0 ? Math.round((count / projects.length) * 100) : 0 }))
      .sort((a, b) => b.count - a.count)
  }, [projects])

  const datasetHealth = useMemo(() => {
    const datasets = projects.filter(p => p.dataset_name)
    return datasets.slice(0, 5).map(p => ({
      name: p.dataset_name || 'Unknown',
      projectName: p.name,
      rows: p.dataset_rows || 0,
      size: p.dataset_size || 0,
      status: p.status,
    }))
  }, [projects])

  const activityTimeline = useMemo(() => {
    return allProjects.slice(0, 8).map((p, i) => {
      const types = ['dataset', 'insight', 'project', 'report'] as const
      const type = types[i % types.length]
      const titles: Record<string, (p: typeof allProjects[0]) => string> = {
        dataset: (proj) => `Uploaded dataset ${proj.dataset_name || ''}`,
        insight: (proj) => `Generated insights for ${proj.name}`,
        project: (proj) => `Updated project ${proj.name}`,
        report: (proj) => `Report exported for ${proj.name}`,
      }
      return {
        id: p.id,
        type,
        title: titles[type](p),
        time: formatDate(p.updated_at),
        domain: getDomainFromProjectName(p.name),
      }
    })
  }, [allProjects])

  const activityIcons: Record<string, { icon: typeof FolderOpen; color: string }> = {
    dataset: { icon: FileSpreadsheet, color: 'bg-blue-100 text-blue-600' },
    insight: { icon: Lightbulb, color: 'bg-amber-100 text-amber-600' },
    project: { icon: FolderOpen, color: 'bg-indigo-100 text-indigo-600' },
    report: { icon: FileText, color: 'bg-emerald-100 text-emerald-600' },
  }

  const kpiCards = [
    {
      label: 'Total Projects',
      value: stats.totalProjects,
      change: stats.totalProjects > 0 ? `${stats.completedProjects} completed` : 'No projects yet',
      trend: stats.totalProjects > 0 ? 'up' as const : 'neutral' as const,
      icon: FolderOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Active Datasets',
      value: stats.totalDatasets,
      change: stats.totalDatasets > 0 ? 'Uploaded & ready' : 'No datasets',
      trend: stats.totalDatasets > 0 ? 'up' as const : 'neutral' as const,
      icon: Database,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Business Insights',
      value: stats.totalDatasets,
      change: 'Auto-generated',
      trend: 'up' as const,
      icon: Lightbulb,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
    {
      label: 'Reports Generated',
      value: stats.completedProjects,
      change: stats.completedProjects > 0 ? 'Exported' : 'Pending',
      trend: stats.completedProjects > 0 ? 'up' as const : 'neutral' as const,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  const statusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed': return 'success' as const
      case 'processing': return 'info' as const
      case 'draft': return 'warning' as const
      default: return 'default' as const
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold text-fg-0 tracking-tight">Business Intelligence Dashboard</h1>
          <p className="text-fg-2">Loading your workspace...</p>
        </section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} variant="elevated" className="p-5 animate-pulse">
              <div className="h-4 bg-bg-2 rounded w-1/3 mb-3" />
              <div className="h-7 bg-bg-2 rounded w-1/2" />
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
          <h1 className="text-2xl font-semibold text-fg-0 tracking-tight">Business Intelligence Dashboard</h1>
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

  return (
    <div className="animate-fade-in space-y-6">
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-fg-0 tracking-tight">Business Intelligence Dashboard</h1>
            <p className="text-sm text-fg-2 mt-1">Your data analysis workspace</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate('/projects/new')}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>
        </div>
      </section>

      <section>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((stat, index) => {
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
                      {stat.trend === 'up' && <ArrowUpRight className="w-3.5 h-3.5" />}
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

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-fg-0">Recent Projects</h2>
            <Button asChild variant="ghost" size="sm" className="h-8 text-xs" onClick={() => navigate('/projects')}>
              View all <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
          {recentProjects.length > 0 ? (
            <Card variant="elevated" className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-1 bg-bg-1">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-fg-3 uppercase tracking-wider">Project</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-fg-3 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-fg-3 uppercase tracking-wider">Dataset</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-fg-3 uppercase tracking-wider">Domain</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-fg-3 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-1">
                    {recentProjects.slice(0, 6).map((project, index) => (
                      <motion.tr
                        key={project.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="hover:bg-bg-1 transition-colors cursor-pointer"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                              <FolderOpen className="w-4 h-4" />
                            </div>
                            <span className="font-medium text-fg-0">{project.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusBadgeVariant(project.status)} size="sm">
                            {project.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-fg-2 truncate max-w-[160px]">{project.dataset_name || '—'}</td>
                        <td className="px-4 py-3">
                          <BusinessDomainBadge domain={getDomainFromProjectName(project.name)} />
                        </td>
                        <td className="px-4 py-3 text-fg-3 text-xs whitespace-nowrap">{formatDate(project.created_at)}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card variant="outlined" className="p-10 text-center">
              <FolderOpen className="w-12 h-12 text-fg-3 mx-auto mb-3" />
              <h3 className="text-sm font-medium text-fg-0 mb-1">No projects yet</h3>
              <p className="text-xs text-fg-2 mb-4">Create your first project to start analyzing data</p>
              <Button size="sm" onClick={() => navigate('/projects/new')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </Card>
          )}
        </div>

        <div>
          <h2 className="text-sm font-semibold text-fg-0 mb-3">Quick Actions</h2>
          <Card variant="elevated" className="p-4">
            <div className="space-y-2">
              <button
                onClick={() => navigate('/projects/new')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-fg-1 hover:text-fg-0 hover:bg-blue-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4" />
                </div>
                <span>New Project</span>
                <ArrowRight className="w-3 h-3 ml-auto text-fg-3 opacity-0 group-hover:opacity-100" />
              </button>
              <button
                onClick={() => navigate('/insights')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-fg-1 hover:text-fg-0 hover:bg-amber-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <span>View Insights</span>
                <ArrowRight className="w-3 h-3 ml-auto text-fg-3 opacity-0 group-hover:opacity-100" />
              </button>
              <button
                onClick={() => navigate('/analytics')}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-fg-1 hover:text-fg-0 hover:bg-emerald-50 transition-colors text-left group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4" />
                </div>
                <span>Export Report</span>
                <ArrowRight className="w-3 h-3 ml-auto text-fg-3 opacity-0 group-hover:opacity-100" />
              </button>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-semibold text-fg-0 mb-3">Business Domain Distribution</h2>
          <Card variant="elevated" className="p-5">
            {domainDistribution.length > 0 ? (
              <div className="space-y-3">
                {domainDistribution.map((item, index) => {
                  const domainColors: Record<string, string> = {
                    hr: 'bg-purple-500',
                    sales: 'bg-green-500',
                    finance: 'bg-blue-500',
                    customer: 'bg-orange-500',
                    inventory: 'bg-teal-500',
                    marketing: 'bg-pink-500',
                    general: 'bg-gray-400',
                  }
                  const domainLabels: Record<string, string> = {
                    hr: 'Human Resources',
                    sales: 'Sales & Revenue',
                    finance: 'Finance & Accounting',
                    customer: 'Customer Analytics',
                    inventory: 'Inventory & Supply Chain',
                    marketing: 'Marketing & Campaigns',
                    general: 'General Business',
                  }
                  return (
                    <motion.div
                      key={item.domain}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3"
                    >
                      <span className="text-xs text-fg-2 w-28 truncate">{domainLabels[item.domain] || item.domain}</span>
                      <div className="flex-1 h-6 bg-bg-2 rounded-full overflow-hidden">
                        <motion.div
                          className={cn('h-full rounded-full', domainColors[item.domain] || 'bg-gray-400')}
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                      <span className="text-xs font-mono text-fg-2 w-12 text-right">{item.count}</span>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-fg-3 text-sm">No projects to analyze</div>
            )}
          </Card>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-fg-0 mb-3">Dataset Health</h2>
          <Card variant="elevated" className="p-5">
            {datasetHealth.length > 0 ? (
              <div className="space-y-3">
                {datasetHealth.map((ds, index) => (
                  <motion.div
                    key={ds.projectName}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-bg-2 rounded-lg"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg-0 truncate">{ds.name}</p>
                      <p className="text-xs text-fg-3 truncate">{ds.projectName}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-xs font-mono text-fg-0">{ds.rows.toLocaleString()} rows</p>
                      </div>
                      <Badge
                        variant={ds.status === 'completed' ? 'success' : ds.status === 'processing' ? 'info' : 'default'}
                        size="sm"
                      >
                        {ds.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-fg-3 text-sm">No datasets uploaded</div>
            )}
          </Card>
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-fg-0">Recent Activity</h2>
        </div>
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-border-1">
            {activityTimeline.map((activity, index) => {
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
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-fg-3">{activity.type}</p>
                    </div>
                  </div>
                  <BusinessDomainBadge domain={activity.domain} />
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
    </div>
  )
}
