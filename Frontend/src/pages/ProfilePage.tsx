import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Separator } from '@/components/ui/Separator'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Label } from '@/components/ui/Label'
import { Avatar } from '@/components/ui/Avatar'
import {
  User,
  Mail,
  Calendar,
  FolderKanban,
  FileSpreadsheet,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Settings,
  Edit,
  Camera,
  X,
  Check,
  Save,
  TrendingUp,
  Award,
  Star,
  Shield,
  Clock,
  MapPin,
  Search,
  Plus,
  CheckCircle,
} from 'lucide-react'

const mockUser = {
  name: 'smit sureja',
  email: 'smitsureja472007@gmail.com',
  role: 'Data Analyst',
  memberSince: 'January 2024',
  avatar: null,
  location: 'morbi , gujarat',
  bio: 'Passionate about turning raw data into actionable insights. Love exploring patterns and building predictive models.',
  stats: {
    projects: 12,
    datasets: 47,
    questions: 234,
    insights: 1287,
  },
  recentActivity: [
    { id: '1', type: 'project', title: 'Created "Sales Analysis Q1 2026"', time: '2 hours ago', icon: FolderKanban, color: 'text-data-2' },
    { id: '2', type: 'dataset', title: 'Uploaded sales_2026.csv', time: '3 hours ago', icon: FileSpreadsheet, color: 'text-data-1' },
    { id: '3', type: 'insight', title: 'Generated insight: West region growth', time: '5 hours ago', icon: Lightbulb, color: 'text-data-3' },
    { id: '4', type: 'ai', title: 'Asked: "Which product has highest margin?"', time: '1 day ago', icon: MessageSquare, color: 'text-data-4' },
    { id: '5', type: 'project', title: 'Completed "Customer Churn Prediction"', time: '3 days ago', icon: FolderKanban, color: 'text-data-2' },
    { id: '5', type: 'viz', title: 'Created dashboard: Q1 Revenue Overview', time: '1 week ago', icon: BarChart3, color: 'text-accent' },
  ],
  achievements: [
    { id: '1', name: 'Data Explorer', description: 'Analyzed 10+ datasets', icon: Search, earned: true },
    { id: '2', name: 'Insight Generator', description: 'Generated 100+ AI insights', icon: Lightbulb, earned: true },
    { id: '3', name: 'Quality Champion', description: 'Fixed 50+ data quality issues', icon: Shield, earned: true },
    { id: '4', name: 'Visualization Pro', description: 'Created 20+ dashboards', icon: BarChart3, earned: false },
    { id: '5', name: 'AI Conversationalist', description: 'Asked 200+ questions to AI', icon: MessageSquare, earned: false },
    { id: '6', name: 'Project Master', description: 'Completed 15 projects', icon: Award, earned: false },
  ],
}

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'achievements' | 'edit'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: mockUser.name,
    email: mockUser.email,
    location: mockUser.location,
    bio: mockUser.bio,
  })

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'activity', label: 'Activity', icon: Clock },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'edit', label: 'Edit Profile', icon: Settings },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Profile Header */}
      <Card variant="elevated" className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative">
            <Avatar
              size="xl"
              fallback={mockUser.name.split(' ').map(n => n[0]).join('')}
              src={mockUser.avatar}
              className="bg-accent-bg text-accent ring-4 ring-bg-0"
            />
            {isEditing && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute bottom-0 right-0 bg-bg-0"
                onClick={() => {}}
              >
                <Camera className="w-4 h-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 text-center md:text-left">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-2xl font-semibold text-center md:text-left bg-transparent border-0 focus:ring-0 text-fg-0"
                />
                <Input
                  value={editForm.email}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                  type="email"
                  className="text-center md:text-left bg-transparent border-0 focus:ring-0 text-fg-2"
                  disabled
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-fg-0">{mockUser.name}</h1>
                <p className="text-fg-1">{mockUser.email}</p>
              </>
            )}
            <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-fg-2">
              <span className="flex items-center gap-1">
                <Badge variant="default" size="sm" className="bg-accent-bg text-accent">
                  {mockUser.role}
                </Badge>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {mockUser.memberSince}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {mockUser.location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditForm({ name: mockUser.name, email: mockUser.email, location: mockUser.location, bio: mockUser.bio }); }}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={() => { /* save */ setIsEditing(false); }}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                <Edit className="w-4 h-4 mr-1" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {!isEditing && mockUser.bio && (
          <div className="mt-6 pt-6 border-t border-border-1">
            <p className="text-fg-1">{mockUser.bio}</p>
          </div>
        )}

        {isEditing && (
          <div className="mt-6">
            <Textarea
              value={editForm.bio}
              onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
              placeholder="Tell us about yourself..."
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <Input
                value={editForm.location}
                onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                placeholder="Location"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Projects', value: mockUser.stats.projects, icon: FolderKanban, color: 'text-data-2', trend: '+3 this month' },
          { label: 'Datasets', value: mockUser.stats.datasets, icon: FileSpreadsheet, color: 'text-data-1', trend: '+8 this week' },
          { label: 'AI Questions', value: mockUser.stats.questions, icon: MessageSquare, color: 'text-data-4', trend: '+42 today' },
          { label: 'Insights', value: mockUser.stats.insights.toLocaleString(), icon: Lightbulb, color: 'text-data-3', trend: '+156 this week' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-5 bg-bg-1 border border-border-1 rounded-xl hover:border-accent/30 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-fg-2">{stat.label}</p>
                <p className="text-3xl font-light text-fg-0">{stat.value}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs text-fg-3 mt-2">{stat.trend}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border-1">
        <nav className="flex gap-1" role="tablist">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => { setActiveTab(tab.id as any); setIsEditing(false); }}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all',
                  'rounded-t-lg border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'text-accent border-accent bg-accent-bg/30'
                    : 'text-fg-2 hover:text-fg-0 hover:bg-bg-1 border-transparent'
                )}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common actions from your profile</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <Button asChild variant="outline" onClick={() => window.location.href = '/projects/new'}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Project
                  </Button>
                  <Button asChild variant="outline" onClick={() => window.location.href = '/ask-ai'}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask AI
                  </Button>
                  <Button asChild variant="outline" onClick={() => window.location.href = '/insights'}>
                    <Lightbulb className="w-4 h-4 mr-2" />
                    View Insights
                  </Button>
                  <Button asChild variant="outline" onClick={() => window.location.href = '/analytics'}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-warning" />
                    Favorite Projects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {['Sales Analysis Q1 2026', 'Marketing Campaign ROI', 'Customer Churn Prediction'].map((proj, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-bg-2 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-accent-bg text-accent flex items-center justify-center">
                            <Star className="w-4 h-4 fill-current" />
                          </div>
                          <span className="font-medium text-fg-0">{proj}</span>
                        </div>
                        <Button variant="ghost" size="sm">Open</Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="p-0">
              <div className="divide-y divide-border-1">
                {mockUser.recentActivity.map((activity, i) => {
                  const Icon = activity.icon
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="p-4 flex items-center gap-4 hover:bg-bg-1 transition-colors"
                    >
                      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', activity.color)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-fg-0">{activity.title}</p>
                        <p className="text-xs text-fg-2">{activity.time}</p>
                      </div>
                      <span className="text-xs text-fg-3 capitalize">{activity.type}</span>
                    </motion.div>
                  )
                })}
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div key="achievements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockUser.achievements.map((achievement, i) => {
                const Icon = achievement.icon
                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card variant={achievement.earned ? 'elevated' : 'outlined'} className={cn('h-full', !achievement.earned && 'opacity-50')}>
                      <CardContent className="p-6 text-center">
                        <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4', achievement.earned ? 'bg-warning-bg text-warning' : 'bg-bg-2 text-fg-3')}>
                          <Icon className="w-8 h-8" />
                        </div>
                        <h3 className="font-semibold text-fg-0 mb-1">{achievement.name}</h3>
                        <p className="text-sm text-fg-2 mb-4">{achievement.description}</p>
                        {achievement.earned ? (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Earned
                          </Badge>
                        ) : (
                          <Badge variant="default" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Locked
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'edit' && (
          <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>Update your personal information and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={editForm.name}
                      onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                      disabled
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={editForm.location}
                      onChange={e => setEditForm({ ...editForm, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={editForm.bio}
                    onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border-1">
                  <Button variant="outline" onClick={() => { setIsEditing(false); setActiveTab('overview'); }}>
                    Cancel
                  </Button>
                  <Button onClick={() => { /* save */ setIsEditing(false); setActiveTab('overview'); }}>
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}