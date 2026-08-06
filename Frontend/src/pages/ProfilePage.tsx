import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { Avatar } from '@/components/ui/Avatar'
import { api } from '@/lib/api'
import {
  User,
  Calendar,
  FolderKanban,
  FileSpreadsheet,
  Lightbulb,
  MessageSquare,
  BarChart3,
  Settings,
  Edit,
  X,
  Save,
  TrendingUp,
  Award,
  Shield,
  Clock,
  Search,
  Plus,
  CheckCircle,
  Loader2,
} from 'lucide-react'

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'achievements' | 'edit'>('overview')
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<{ name: string; email: string } | null>(null)
  const [projectCount, setProjectCount] = useState(0)
  const [editForm, setEditForm] = useState({ name: '', email: '' })

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.auth.getMe(),
      api.projects.getAll(),
    ])
      .then(([userData, projects]) => {
        setUser({ name: userData.name, email: userData.email })
        setEditForm({ name: userData.name, email: userData.email })
        setProjectCount(projects.length)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSaveProfile = async () => {
    setSaving(true)
    setError(null)
    try {
      const updated = await api.auth.updateProfile({ name: editForm.name })
      setUser({ name: updated.name, email: updated.email })
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPasswordError(null)
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordError('Please fill in all fields')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    setPasswordSaving(true)
    try {
      await api.auth.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      })
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'activity', label: 'Activity', icon: Clock },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'edit', label: 'Edit Profile', icon: Settings },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto" />
          <p className="mt-3 text-sm text-fg-2">Loading profile...</p>
        </div>
      </div>
    )
  }

  const displayName = user?.name || 'User'
  const displayEmail = user?.email || ''
  const memberSince = 'January 2024'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {error && (
        <div className="p-3 bg-error-bg/20 border border-error/30 rounded-lg text-sm text-error">{error}</div>
      )}

      {/* Profile Header */}
      <Card variant="elevated" className="p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative">
            <Avatar
              size="xl"
              fallback={initials}
              className="bg-accent-bg text-accent ring-4 ring-bg-0"
            />
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
                  type="email"
                  className="text-center md:text-left bg-transparent border-0 focus:ring-0 text-fg-2"
                  disabled
                />
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-semibold text-fg-0">{displayName}</h1>
                <p className="text-fg-1">{displayEmail}</p>
              </>
            )}
            <div className="flex items-center justify-center md:justify-start gap-4 mt-3 text-sm text-fg-2">
              <span className="flex items-center gap-1">
                <Badge variant="default" size="sm" className="bg-accent-bg text-accent">
                  Data Analyst
                </Badge>
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Member since {memberSince}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => { setIsEditing(false); setEditForm({ name: displayName, email: displayEmail }); }}>
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
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
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Projects', value: projectCount, icon: FolderKanban, color: 'text-data-2' },
          { label: 'Datasets', value: projectCount, icon: FileSpreadsheet, color: 'text-data-1' },
          { label: 'AI Questions', value: 0, icon: MessageSquare, color: 'text-data-4' },
          { label: 'Insights', value: 0, icon: Lightbulb, color: 'text-data-3' },
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
            </div>
          </motion.div>
        )}

        {activeTab === 'activity' && (
          <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Card className="p-0">
              <div className="p-6 text-center">
                <Clock className="w-8 h-8 text-fg-3 mx-auto mb-2" />
                <p className="text-fg-2">Activity history will appear here.</p>
              </div>
            </Card>
          </motion.div>
        )}

        {activeTab === 'achievements' && (
          <motion.div key="achievements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'Data Explorer', description: 'Analyzed 10+ datasets', icon: Search, earned: projectCount >= 10 },
                { name: 'Insight Generator', description: 'Generated 100+ AI insights', icon: Lightbulb, earned: false },
                { name: 'Quality Champion', description: 'Fixed 50+ data quality issues', icon: Shield, earned: false },
                { name: 'Visualization Pro', description: 'Created 20+ dashboards', icon: BarChart3, earned: false },
                { name: 'AI Conversationalist', description: 'Asked 200+ questions to AI', icon: MessageSquare, earned: false },
                { name: 'Project Master', description: 'Completed 15 projects', icon: Award, earned: projectCount >= 15 },
              ].map((achievement, i) => {
                const Icon = achievement.icon
                return (
                  <motion.div
                    key={achievement.name}
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
                <CardDescription>Update your personal information</CardDescription>
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
                      disabled
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border-1">
                  <Button variant="outline" onClick={() => { setIsEditing(false); setActiveTab('overview'); }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-error-bg/20 border border-error/30 rounded-lg text-sm text-error">{passwordError}</div>
                )}
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} disabled={passwordSaving}>
                    {passwordSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Key className="w-4 h-4 mr-1" />}
                    Update Password
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

function Key(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" />
      <path d="m21 2-9.6 9.6" />
      <circle cx="7.5" cy="15.5" r="5.5" />
    </svg>
  )
}
