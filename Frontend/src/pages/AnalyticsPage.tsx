import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { Avatar } from '@/components/ui/Avatar'
import {
  BarChart3,
  TrendingUp,
  PieChart,
  AreaChart,
  Users,
  DollarSign,
  Filter,
  Download,
  Calendar,
  ChevronDown,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'

const timeRanges = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
]

const kpiData = [
  {
    label: 'Total Revenue',
    value: '$127,430',
    change: '+12.5%',
    trend: 'up',
    icon: DollarSign,
    color: 'text-success',
    sparkline: [12, 19, 15, 25, 22, 30, 28, 35, 32, 40, 38, 45],
  },
  {
    label: 'Active Users',
    value: '8,432',
    change: '+8.2%',
    trend: 'up',
    icon: Users,
    color: 'text-data-2',
    sparkline: [65, 72, 68, 78, 74, 82, 79, 85, 83, 88, 86, 91],
  },
  {
    label: 'Conversion Rate',
    value: '3.24%',
    change: '-0.3%',
    trend: 'down',
    icon: Target,
    color: 'text-warning',
    sparkline: [3.5, 3.3, 3.4, 3.2, 3.3, 3.1, 3.2, 3.0, 3.1, 3.0, 3.1, 3.24],
  },
  {
    label: 'Avg Session',
    value: '4m 32s',
    change: '+15s',
    trend: 'up',
    icon: Activity,
    color: 'text-data-4',
    sparkline: [240, 255, 248, 262, 258, 270, 265, 275, 270, 280, 272, 272],
  },
]

const chartData = {
  revenue: [
    { month: 'Jan', revenue: 45000, target: 40000 },
    { month: 'Feb', revenue: 52000, target: 45000 },
    { month: 'Mar', revenue: 48000, target: 50000 },
    { month: 'Apr', revenue: 61000, target: 55000 },
    { month: 'May', revenue: 55000, target: 58000 },
    { month: 'Jun', revenue: 67000, target: 60000 },
  ],
  usersByRegion: [
    { region: 'North America', users: 3420, percentage: 40.5 },
    { region: 'Europe', users: 2105, percentage: 25.0 },
    { region: 'Asia Pacific', users: 1850, percentage: 21.9 },
    { region: 'Latin America', users: 678, percentage: 8.0 },
    { region: 'Other', users: 379, percentage: 4.6 },
  ],
  topPages: [
    { page: '/dashboard', views: 12450, unique: 8230, bounce: '32%' },
    { page: '/projects', views: 8930, unique: 6120, bounce: '41%' },
    { page: '/insights', views: 6540, unique: 4890, bounce: '28%' },
    { page: '/ask-ai', views: 4320, unique: 3120, bounce: '35%' },
    { page: '/analytics', views: 3210, unique: 2450, bounce: '45%' },
  ],
}

export function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('30d')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-light text-fg-0 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-data-2" />
            Analytics
          </h1>
          <p className="text-fg-1 mt-1">Track performance metrics and gain actionable insights</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3" />
            <select
              value={timeRange}
              onChange={e => setTimeRange(e.target.value)}
              className="pl-10 pr-8 py-2 bg-bg-1 border border-border-1 text-fg-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
            >
              {timeRanges.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="elevated" className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-fg-2 font-medium mb-1">{kpi.label}</p>
                    <p className="text-3xl font-semibold text-fg-0">{kpi.value}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={cn('text-sm font-medium', kpi.trend === 'up' ? 'text-success' : 'text-error')}>
                        {kpi.trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                        {kpi.change}
                      </span>
                      <span className="text-xs text-fg-3">vs last period</span>
                    </div>
                  </div>
                  <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', kpi.color)}>
                    <Icon className="w-6 h-6" />
                  </div>
                </div>

                {/* Mini sparkline */}
                <div className="mt-4 h-16 relative">
                  <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id={`gradient-${kpi.label}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={kpi.color === 'text-success' ? '#00d4a6' : kpi.color === 'text-data-2' ? '#5c9eff' : kpi.color === 'text-warning' ? '#f5a623' : '#c084fc'} stopOpacity="0.3" />
                        <stop offset="100%" stopColor={kpi.color === 'text-success' ? '#00d4a6' : kpi.color === 'text-data-2' ? '#5c9eff' : kpi.color === 'text-warning' ? '#f5a623' : '#c084fc'} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d={kpi.sparkline.map((v, i) => {
                        const x = (i / (kpi.sparkline.length - 1)) * 200
                        const y = 60 - (v / Math.max(...kpi.sparkline)) * 50
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ')}
                      stroke={kpi.color === 'text-success' ? '#00d4a6' : kpi.color === 'text-data-2' ? '#5c9eff' : kpi.color === 'text-warning' ? '#f5a623' : '#c084fc'}
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d={kpi.sparkline.map((v, i) => {
                        const x = (i / (kpi.sparkline.length - 1)) * 200
                        const y = 60 - (v / Math.max(...kpi.sparkline)) * 50
                        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                      }).join(' ') + ' L 200 60 L 0 60 Z'}
                      fill={`url(#gradient-${kpi.label})`}
                    />
                  </svg>
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-success" />
                  Revenue Overview
                </CardTitle>
                <CardDescription>Monthly revenue vs target</CardDescription>
              </div>
              <Badge variant="accent">Live</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative">
              <svg viewBox="0 0 400 256" className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenue-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00d4a6" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#00d4a6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="target-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5c9eff" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#5c9eff" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Grid lines */}
                <g stroke="#2a2e35" strokeWidth="0.5">
                  {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
                    <line key={i} x1="0" y1={`${y * 200}`} x2="400" y2={`${y * 200}`} />
                  ))}
                  {[0.2, 0.4, 0.6, 0.8].map((x, i) => (
                    <line key={i} x1={`${x * 400}`} y1="0" x2={`${x * 400}`} y2="200" />
                  ))}
                </g>

                {/* Target area */}
                <path
                  d={chartData.revenue.map((d, i) => {
                    const x = (i / (chartData.revenue.length - 1)) * 400
                    const y = 200 - (d.target / 70000) * 180
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ') + ' L 400 200 L 0 200 Z'}
                  fill="url(#target-gradient)"
                />

                {/* Revenue area */}
                <path
                  d={chartData.revenue.map((d, i) => {
                    const x = (i / (chartData.revenue.length - 1)) * 400
                    const y = 200 - (d.revenue / 70000) * 180
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ') + ' L 400 200 L 0 200 Z'}
                  fill="url(#revenue-gradient)"
                />

                {/* Revenue line */}
                <path
                  d={chartData.revenue.map((d, i) => {
                    const x = (i / (chartData.revenue.length - 1)) * 400
                    const y = 200 - (d.revenue / 70000) * 180
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ')}
                  stroke="#00d4a6"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Target line */}
                <path
                  d={chartData.revenue.map((d, i) => {
                    const x = (i / (chartData.revenue.length - 1)) * 400
                    const y = 200 - (d.target / 70000) * 180
                    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                  }).join(' ')}
                  stroke="#5c9eff"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Dots */}
                {chartData.revenue.map((d, i) => (
                  <circle
                    key={i}
                    cx={(i / (chartData.revenue.length - 1)) * 400}
                    cy={200 - (d.revenue / 70000) * 180}
                    r="5"
                    fill="#00d4a6"
                    stroke="#0a0b0d"
                    strokeWidth="2"
                  />
                ))}

                {/* X-axis labels */}
                {chartData.revenue.map((d, i) => (
                  <text
                    key={`label-${i}`}
                    x={(i / (chartData.revenue.length - 1)) * 400}
                    y="220"
                    textAnchor="middle"
                    fontSize="11"
                    fill="#8b9097"
                    fontFamily="Space Grotesk, system-ui"
                  >
                    {d.month}
                  </text>
                ))}

                {/* Y-axis labels */}
                {['$70k', '$50k', '$30k', '$10k'].map((label, i) => (
                  <text
                    key={`y-${i}`}
                    x="-10"
                    y={i * 60 + 20}
                    textAnchor="end"
                    fontSize="10"
                    fill="#8b9097"
                    fontFamily="Space Grotesk, system-ui"
                  >
                    {label}
                  </text>
                ))}
              </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-accent" />
                <span className="text-sm text-fg-1">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-1 bg-data-2" style={{ borderRadius: '2px', opacity: 0.8 }} />
                <span className="text-sm text-fg-1">Target</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users by Region */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-data-2" />
              Users by Region
            </CardTitle>
            <CardDescription>Geographic distribution of active users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 relative flex items-end justify-center gap-4 px-4">
              {chartData.usersByRegion.map((region, i) => (
                <div key={region.region} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t transition-all duration-500 bg-accent"
                    style={{
                      height: `${region.percentage * 1.5}%`,
                      minHeight: '20px',
                    }}
                  />
                  <span className="text-xs text-fg-2 mt-2 text-center w-24 truncate">{region.region}</span>
                  <span className="text-sm font-medium text-fg-0">{region.percentage}%</span>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {chartData.usersByRegion.map((region, i) => (
                <div key={region.region} className="flex items-center gap-4">
                  <div className="w-3 h-3 rounded-full bg-accent" style={{ opacity: 1 - i * 0.15 }} />
                  <span className="text-sm text-fg-1 w-32 truncate">{region.region}</span>
                  <div className="flex-1 h-2 bg-bg-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${region.percentage}%` }}
                      transition={{ delay: i * 0.1, duration: 0.8 }}
                      className="h-full bg-accent rounded-full"
                    />
                  </div>
                  <span className="text-sm font-mono text-fg-0 w-16 text-right">{region.users.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Pages Table */}
      <Card variant="elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-data-4" />
            Top Pages
          </CardTitle>
          <CardDescription>Most visited pages in the selected period</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-1">
                  <th className="px-6 py-3 text-left text-xs font-medium text-fg-2 uppercase tracking-wider">Page</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-fg-2 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-fg-2 uppercase tracking-wider">Unique</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-fg-2 uppercase tracking-wider">Bounce Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-fg-2 uppercase tracking-wider">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-1">
                {chartData.topPages.map((page, i) => (
                  <tr key={page.page} className="hover:bg-bg-1 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-bg text-accent flex items-center justify-center">
                          <Activity className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-medium text-fg-0 font-mono text-sm">{page.page}</p>
                          <p className="text-xs text-fg-2">Page #{i + 1}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-fg-0">{page.views.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-mono text-fg-1">{page.unique.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant={parseInt(page.bounce) > 40 ? 'warning' : 'success'} size="sm">
                        {page.bounce}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-fg-0">{(2 + i * 0.5).toFixed(1)}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: 'Goal Completion',
            value: '68%',
            description: 'Revenue target on track',
            icon: Target,
            color: 'text-accent',
            progress: 68,
          },
          {
            title: 'User Retention',
            value: '72%',
            description: '30-day rolling retention',
            icon: Users,
            color: 'text-data-2',
            progress: 72,
          },
          {
            title: 'Data Quality',
            value: '94%',
            description: 'Overall dataset health score',
            icon: Activity,
            color: 'text-success',
            progress: 94,
          },
        ].map((item, index) => {
          const Icon = item.icon
          return (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="elevated" className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', item.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Badge variant="accent" size="sm">{item.value}</Badge>
                </div>
                <h3 className="font-medium text-fg-0 mb-1">{item.title}</h3>
                <p className="text-sm text-fg-2 mb-4">{item.description}</p>
                <div className="h-2 bg-bg-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.progress}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
                    className={cn('h-full rounded-full', item.color.replace('text-', 'bg-'))}
                  />
                </div>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}