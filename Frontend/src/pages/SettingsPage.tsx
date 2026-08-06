import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { ThemeToggle } from '@/components/app/ThemeToggle'
import { api, clearAuthToken } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { Settings, Bell, Globe, Database, Shield, AlertTriangle, Download, Trash2, Lock, Key, Check, Loader2, Palette as PaletteIcon } from 'lucide-react'

interface SettingsSection {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  items: SettingItem[]
}

type SettingItem =
  | { id: string; type: 'toggle'; label: string; description: string }
  | { id: string; type: 'select'; label: string; description: string; options: string[]; defaultValue: string }
  | { id: string; type: 'action'; label: string; description: string; action: string; icon: React.ReactNode }
  | { id: string; type: 'danger'; label: string; description: string; action: string; icon: React.ReactNode }
  | { id: string; type: 'connect'; label: string; description: string; icon: React.ReactNode; connected: boolean }
  | { id: string; component: 'theme' | 'density' | 'language' | 'retention'; label: string; description: string }

export function SettingsPage() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('notifications')
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('settings_notifications')
    return saved ? JSON.parse(saved) : {
      email_updates: true,
      security_alerts: true,
      weekly_digest: false,
      marketing_emails: false,
    }
  })
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>(() => {
    return (localStorage.getItem('settings_density') as 'comfortable' | 'compact' | 'spacious') || 'comfortable'
  })
  const [language, setLanguage] = useState(() => localStorage.getItem('settings_language') || 'en')
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem('settings_dateFormat') || 'MM/DD/YYYY')
  const [timezone, setTimezone] = useState(() => localStorage.getItem('settings_timezone') || 'PST')
  const [numberFormat, setNumberFormat] = useState(() => localStorage.getItem('settings_numberFormat') || '1,234.56')
  const [retention, setRetention] = useState(() => localStorage.getItem('settings_retention') || '1year')
  const [exportFormat, setExportFormat] = useState(() => localStorage.getItem('settings_exportFormat') || 'csv')

  const [userEmail, setUserEmail] = useState('')
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    api.auth.getMe().then(data => setUserEmail(data.email)).catch(() => {})
  }, [])

  useEffect(() => {
    localStorage.setItem('settings_notifications', JSON.stringify(notifications))
  }, [notifications])

  useEffect(() => {
    localStorage.setItem('settings_density', density)
  }, [density])

  useEffect(() => {
    localStorage.setItem('settings_language', language)
  }, [language])

  useEffect(() => {
    localStorage.setItem('settings_dateFormat', dateFormat)
  }, [dateFormat])

  useEffect(() => {
    localStorage.setItem('settings_timezone', timezone)
  }, [timezone])

  useEffect(() => {
    localStorage.setItem('settings_numberFormat', numberFormat)
  }, [numberFormat])

  useEffect(() => {
    localStorage.setItem('settings_retention', retention)
  }, [retention])

  useEffect(() => {
    localStorage.setItem('settings_exportFormat', exportFormat)
  }, [exportFormat])

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
      setShowPasswordModal(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Failed to change password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleteLoading(true)
    try {
      await api.auth.deleteAccount()
      clearAuthToken()
      navigate('/signin')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete account')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleExportData = () => {
    alert('Export feature coming soon. Your data will be downloaded as a ZIP archive.')
  }

  const sections: SettingsSection[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      items: [
        { id: 'email_updates', type: 'toggle', label: 'Email Updates', description: 'Receive product updates and announcements via email' },
        { id: 'security_alerts', type: 'toggle', label: 'Security Alerts', description: 'Get notified about suspicious login attempts' },
        { id: 'weekly_digest', type: 'toggle', label: 'Weekly Digest', description: 'Summary of your projects and insights every Monday' },
        { id: 'marketing_emails', type: 'toggle', label: 'Marketing Emails', description: 'Tips, tutorials, and feature highlights' },
      ],
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: PaletteIcon,
      items: [
        { id: 'theme', component: 'theme', label: 'Theme', description: 'Choose your preferred color scheme' },
        { id: 'density', component: 'density', label: 'Display Density', description: 'Adjust spacing and compactness' },
        { id: 'language', component: 'language', label: 'Language', description: 'Set your preferred language' },
      ],
    },
    {
      id: 'language_region',
      label: 'Language & Region',
      icon: Globe,
      items: [
        { id: 'date_format', type: 'select', label: 'Date Format', description: 'How dates are displayed', options: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], defaultValue: 'MM/DD/YYYY' },
        { id: 'timezone', type: 'select', label: 'Timezone', description: 'Your local timezone for timestamps', options: ['UTC', 'PST', 'EST', 'CET', 'JST'], defaultValue: 'PST' },
        { id: 'number_format', type: 'select', label: 'Number Format', description: 'Decimal and thousand separators', options: ['1,234.56', '1.234,56', '1 234,56'], defaultValue: '1,234.56' },
      ],
    },
    {
      id: 'storage',
      label: 'Storage & Data',
      icon: Database,
      items: [
        { id: 'auto_save', type: 'toggle', label: 'Auto-save', description: 'Automatically save changes every 30 seconds' },
        { id: 'cache_datasets', type: 'toggle', label: 'Cache Datasets', description: 'Keep recently used datasets in local storage' },
        { id: 'retention', component: 'retention', label: 'Data Retention', description: 'How long to keep your data' },
        { id: 'export_format', type: 'select', label: 'Default Export Format', description: 'Preferred format for data exports', options: ['csv', 'xlsx', 'json', 'parquet'], defaultValue: 'csv' },
      ],
    },
    {
      id: 'account',
      label: 'Account Security',
      icon: Shield,
      items: [
        { id: 'password', type: 'action', label: 'Change Password', description: 'Update your account password', action: 'change_password', icon: <Key className="w-4 h-4" /> },
        { id: 'email_display', type: 'action', label: 'Email Address', description: userEmail || 'Loading...', action: 'view_email', icon: <Lock className="w-4 h-4" /> },
      ],
    },
    {
      id: 'danger',
      label: 'Danger Zone',
      icon: AlertTriangle,
      items: [
        { id: 'export_data', type: 'action', label: 'Export All Data', description: 'Download a complete archive of your projects and datasets', action: 'export_data', icon: <Download className="w-4 h-4" /> },
        { id: 'delete_account', type: 'danger', label: 'Delete Account', description: 'Permanently delete your account and all data. This action cannot be undone.', action: 'delete_account', icon: <Trash2 className="w-4 h-4" /> },
      ],
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <section>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-fg-0 tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-accent" />
            Settings
          </h1>
          <p className="text-sm text-fg-2 mt-1">Manage your account preferences and configuration</p>
        </div>
      </section>

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-56 flex-shrink-0">
          <Card variant="outlined" className="p-2 h-fit sticky top-24">
            <nav className="space-y-1" role="navigation" aria-label="Settings sections">
              {sections.map(section => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                      'text-left',
                      activeSection === section.id
                        ? 'bg-accent-bg text-accent border border-accent/30'
                        : 'text-fg-1 hover:text-fg-0 hover:bg-bg-2'
                    )}
                    role="tab"
                    aria-selected={activeSection === section.id}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {section.label}
                  </button>
                )
              })}
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {sections.map(section => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={activeSection === section.id ? 'block' : 'hidden'}
              >
                <SettingsSection
                  section={section}
                  notifications={notifications}
                  setNotifications={setNotifications}
                  density={density}
                  setDensity={setDensity}
                  language={language}
                  setLanguage={setLanguage}
                  dateFormat={dateFormat}
                  setDateFormat={setDateFormat}
                  timezone={timezone}
                  setTimezone={setTimezone}
                  numberFormat={numberFormat}
                  setNumberFormat={setNumberFormat}
                  retention={retention}
                  setRetention={setRetention}
                  exportFormat={exportFormat}
                  setExportFormat={setExportFormat}
                  onAction={action => {
                    if (action === 'change_password') setShowPasswordModal(true)
                    if (action === 'export_data') handleExportData()
                    if (action === 'delete_account') setShowDeleteModal(true)
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-1 border border-border-1 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-fg-0 mb-4">Change Password</h3>
            {passwordError && (
              <div className="p-3 bg-error-bg/20 border border-error/30 rounded-lg text-sm text-error mb-4">{passwordError}</div>
            )}
            <div className="space-y-4">
              <div>
                <Label htmlFor="settings-current-pw">Current Password</Label>
                <Input id="settings-current-pw" type="password" value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="settings-new-pw">New Password</Label>
                <Input id="settings-new-pw" type="password" value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="settings-confirm-pw">Confirm New Password</Label>
                <Input id="settings-confirm-pw" type="password" value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => { setShowPasswordModal(false); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError(null) }}>
                Cancel
              </Button>
              <Button onClick={handleChangePassword} disabled={passwordSaving}>
                {passwordSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Key className="w-4 h-4 mr-1" />}
                Update Password
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}>
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-bg-1 border border-border-1 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-error-bg text-error flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-fg-0">Delete Account</h3>
                <p className="text-sm text-fg-2 mt-1">This will permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
            </div>
            <div className="p-3 bg-bg-2 rounded-lg mb-4">
              <Label className="text-sm">Type <strong>DELETE</strong> to confirm:</Label>
              <Input
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="mt-2"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setShowDeleteModal(false); setDeleteConfirmText('') }}>
                Cancel
              </Button>
              <Button
                className="text-error border-error hover:bg-error/10"
                variant="outline"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
              >
                {deleteLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
                Delete Account
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

function SettingsSection({
  section,
  notifications,
  setNotifications,
  density,
  setDensity,
  language,
  setLanguage,
  dateFormat,
  setDateFormat,
  timezone,
  setTimezone,
  numberFormat,
  setNumberFormat,
  retention,
  setRetention,
  exportFormat,
  setExportFormat,
  onAction,
}: {
  section: SettingsSection
  notifications: Record<string, boolean>
  setNotifications: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  density: string
  setDensity: (d: 'comfortable' | 'compact' | 'spacious') => void
  language: string
  setLanguage: (l: string) => void
  dateFormat: string
  setDateFormat: (d: string) => void
  timezone: string
  setTimezone: (t: string) => void
  numberFormat: string
  setNumberFormat: (n: string) => void
  retention: string
  setRetention: (r: string) => void
  exportFormat: string
  setExportFormat: (f: string) => void
  onAction: (action: string) => void
}) {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="mb-4">
        <h2 className="text-2xl font-light text-fg-0 tracking-tight flex items-center gap-2">
          <section.icon className="w-6 h-6 text-accent" />
          {section.label}
        </h2>
        <p className="text-fg-1 mt-1">Configure your {section.label.toLowerCase()} preferences</p>
      </div>

      <Card variant="elevated">
        <CardContent className="p-6 pt-4">
          <div className="space-y-0 divide-y divide-border-1">
            {section.items.map((item, index) => {
              const delay = index * 0.05

              if ('component' in item) {
                if (item.component === 'theme') {
                  return (
                    <div key={item.id} className="py-4">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="flex items-center justify-between py-4">
                        <div>
                          <p className="font-medium text-fg-0">{item.label}</p>
                          <p className="text-sm text-fg-2">{item.description}</p>
                        </div>
                        <ThemeToggle />
                      </motion.div>
                    </div>
                  )
                }
                if (item.component === 'density') {
                  return (
                    <div key={item.id} className="py-4">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
                        <div className="mb-3">
                          <p className="font-medium text-fg-0">{item.label}</p>
                          <p className="text-sm text-fg-2">{item.description}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {(['comfortable', 'compact', 'spacious'] as const).map(d => (
                            <label key={d} className="relative cursor-pointer">
                              <input type="radio" name="density" value={d} checked={density === d} onChange={() => setDensity(d)} className="sr-only" />
                              <div className={cn('p-4 rounded-xl border-2 text-center transition-all', density === d ? 'border-accent bg-accent-bg/50 text-accent' : 'border-border-1 hover:border-accent/50 text-fg-0')}>
                                <p className="font-medium capitalize">{d}</p>
                                <p className="text-xs text-fg-2 mt-1">{d === 'comfortable' ? 'Default spacing' : d === 'compact' ? 'Tight spacing' : 'Loose spacing'}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )
                }
                if (item.component === 'language') {
                  return (
                    <div key={item.id} className="py-4">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="flex items-center justify-between py-4">
                        <div>
                          <p className="font-medium text-fg-0">{item.label}</p>
                          <p className="text-sm text-fg-2">{item.description}</p>
                        </div>
                        <select value={language} onChange={e => setLanguage(e.target.value)} className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent min-w-[200px]">
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="ja">Japanese</option>
                          <option value="zh">Chinese</option>
                        </select>
                      </motion.div>
                    </div>
                  )
                }
                if (item.component === 'retention') {
                  return (
                    <div key={item.id} className="py-4">
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
                        <div className="mb-3">
                          <p className="font-medium text-fg-0">{item.label}</p>
                          <p className="text-sm text-fg-2">{item.description}</p>
                        </div>
                        <div className="space-y-2">
                          {['30days', '90days', '1year', 'forever'].map(r => (
                            <label key={r} className="flex items-center justify-between p-3 bg-bg-2 rounded-lg cursor-pointer hover:bg-bg-1 transition-colors">
                              <div className="flex items-center gap-3">
                                <input type="radio" name="retention" value={r} checked={retention === r} onChange={() => setRetention(r)} className="sr-only" />
                                <div className={cn('w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors', retention === r ? 'border-accent bg-accent' : 'border-border-2')}>
                                  {retention === r && <Check className="w-3 h-3 text-bg-0" />}
                                </div>
                                <span className="font-medium text-fg-0 capitalize">{r.replace('days', ' days').replace('forever', 'Forever')}</span>
                              </div>
                              <span className="text-sm text-fg-2">
                                {r === '30days' && 'Auto-delete after 30 days'}
                                {r === '90days' && 'Auto-delete after 90 days'}
                                {r === '1year' && 'Auto-delete after 1 year (default)'}
                                {r === 'forever' && 'Keep data forever'}
                              </span>
                            </label>
                          ))}
                        </div>
                      </motion.div>
                    </div>
                  )
                }
              }

              if (!('type' in item)) return null
              const typedItem = item as { type: string; id: string; label: string; description: string; [key: string]: unknown }

              if (typedItem.type === 'toggle') {
                return (
                  <div key={item.id} className="py-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium text-fg-0">{item.label}</p>
                        <p className="text-sm text-fg-2">{item.description}</p>
                      </div>
                      <Button variant={notifications[item.id] ? 'secondary' : 'outline'} size="sm" onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id] }))} className="w-20">
                        {notifications[item.id] ? 'On' : 'Off'}
                      </Button>
                    </motion.div>
                  </div>
                )
              }

              if (typedItem.type === 'select') {
                const selectValues: Record<string, { value: string; setter: (v: string) => void }> = {
                  date_format: { value: dateFormat, setter: setDateFormat },
                  timezone: { value: timezone, setter: setTimezone },
                  number_format: { value: numberFormat, setter: setNumberFormat },
                  export_format: { value: exportFormat, setter: setExportFormat },
                }
                const sv = selectValues[item.id]
                const options = typedItem.options as string[] | undefined
                if (!sv || !options) return null
                return (
                  <div key={item.id} className="py-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="flex items-center justify-between py-4">
                      <div>
                        <p className="font-medium text-fg-0">{item.label}</p>
                        <p className="text-sm text-fg-2">{item.description}</p>
                      </div>
                      <select value={sv.value} onChange={e => sv.setter(e.target.value)} className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent min-w-[200px]">
                        {options.map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </motion.div>
                  </div>
                )
              }

              if (typedItem.type === 'action' || typedItem.type === 'danger') {
                const actionItem = typedItem as unknown as { type: string; action: string; icon: React.ReactNode }
                return (
                  <div key={item.id} className="py-4">
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="flex items-center justify-between py-4">
                      <div>
                        <p className={cn('font-medium', typedItem.type === 'danger' ? 'text-error' : 'text-fg-0')}>{item.label}</p>
                        <p className="text-sm text-fg-2">{item.description}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(typedItem.type === 'danger' && 'text-error border-error hover:bg-error/10')}
                        onClick={() => onAction(actionItem.action)}
                      >
                        {actionItem.icon}
                        {actionItem.action === 'export_data' && 'Export'}
                        {actionItem.action === 'delete_account' && 'Delete Account'}
                        {actionItem.action === 'change_password' && 'Change'}
                        {actionItem.action === 'view_email' && 'View'}
                      </Button>
                    </motion.div>
                  </div>
                )
              }

              return null
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
