import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import { ThemeToggle } from '@/components/app/ThemeToggle'
import { Settings, Bell, Palette, Globe, Database, Shield, Wifi, AlertTriangle, Download, Trash2, Lock, Key, Smartphone, Cpu, ExternalLink, Check, Palette as PaletteIcon, X } from 'lucide-react'

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
    id: 'language',
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
      { id: 'two_factor', type: 'action', label: 'Two-Factor Authentication', description: 'Add an extra layer of security to your account', action: 'enable_2fa', icon: <Lock className="w-4 h-4" /> },
      { id: 'password', type: 'action', label: 'Change Password', description: 'Update your account password', action: 'change_password', icon: <Key className="w-4 h-4" /> },
      { id: 'sessions', type: 'action', label: 'Active Sessions', description: 'View and manage your active login sessions', action: 'view_sessions', icon: <Smartphone className="w-4 h-4" /> },
      { id: 'api_keys', type: 'action', label: 'API Keys', description: 'Manage API keys for programmatic access', action: 'manage_api', icon: <Cpu className="w-4 h-4" /> },
    ],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    icon: Wifi,
    items: [
      { id: 'github', type: 'connect', label: 'GitHub', description: 'Sync repositories and notebooks', icon: <span className="font-bold text-lg">⌘</span>, connected: false },
      { id: 'slack', type: 'connect', label: 'Slack', description: 'Receive notifications in Slack channels', icon: <span className="font-bold text-lg">#</span>, connected: true },
      { id: 'google_drive', type: 'connect', label: 'Google Drive', description: 'Import/export datasets from Drive', icon: <span className="font-bold text-lg">G</span>, connected: false },
      { id: 'aws', type: 'connect', label: 'AWS S3', description: 'Connect to S3 buckets for data storage', icon: <span className="font-bold text-lg">☁</span>, connected: false },
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

export function SettingsPage() {
  const [activeSection, setActiveSection] = useState('notifications')
  const [notifications, setNotifications] = useState({
    email_updates: true,
    security_alerts: true,
    weekly_digest: false,
    marketing_emails: false,
  })
  const [density, setDensity] = useState<'comfortable' | 'compact' | 'spacious'>('comfortable')
  const [language, setLanguage] = useState('en')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')
  const [timezone, setTimezone] = useState('PST')
  const [numberFormat, setNumberFormat] = useState('1,234.56')
  const [retention, setRetention] = useState('1year')
  const [exportFormat, setExportFormat] = useState('csv')

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-light text-fg-0 tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-accent" />
          Settings
        </h1>
        <p className="text-fg-1 mt-1">Manage your account preferences and configuration</p>
      </div>

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
                <SettingsSection section={section} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function SettingsSection({ section }: { section: typeof sections[0] }) {
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Header */}
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
            {section.items.map((item, index) => (
              <div key={item.id} className={index > 0 ? 'pt-4' : ''}>
                {renderSettingsItem(item, index)}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function renderSettingsItem(item: SettingItem, index: number) {
  if (item.component === 'theme') {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between py-4"
      >
        <div>
          <p className="font-medium text-fg-0">{item.label}</p>
          <p className="text-sm text-fg-2">{item.description}</p>
        </div>
        <ThemeToggle />
      </motion.div>
    )
  }

  if (item.component === 'density') {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="mb-3">
          <p className="font-medium text-fg-0">{item.label}</p>
          <p className="text-sm text-fg-2">{item.description}</p>
        </div>
        <RadioGroup value={density} onValueChange={setDensity}>
          <div className="grid grid-cols-3 gap-3">
            {['comfortable', 'compact', 'spacious'].map(d => (
              <label key={d} className="relative cursor-pointer">
                <input
                  type="radio"
                  name="density"
                  value={d}
                  checked={density === d}
                  onChange={() => setDensity(d as any)}
                  className="sr-only"
                />
                <div className={cn(
                  'p-4 rounded-xl border-2 text-center transition-all',
                  density === d
                    ? 'border-accent bg-accent-bg/50 text-accent'
                    : 'border-border-1 hover:border-accent/50 text-fg-0'
                )}>
                  <p className="font-medium capitalize">{d}</p>
                  <p className="text-xs text-fg-2 mt-1">
                    {d === 'comfortable' ? 'Default spacing' : d === 'compact' ? 'Tight spacing' : 'Loose spacing'}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </RadioGroup>
      </motion.div>
    )
  }

  if (item.component === 'language') {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between py-4"
      >
        <div>
          <p className="font-medium text-fg-0">{item.label}</p>
          <p className="text-sm text-fg-2">{item.description}</p>
        </div>
        <select
          value={language}
          onChange={e => setLanguage(e.target.value)}
          className="px-3 py-2 bg-bg-2 border border-border-1 text-fg-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent min-w-[200px]"
        >
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="ja">Japanese</option>
          <option value="zh">Chinese</option>
        </select>
      </motion.div>
    )
  }

  if (item.component === 'retention') {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="mb-3">
          <p className="font-medium text-fg-0">{item.label}</p>
          <p className="text-sm text-fg-2">{item.description}</p>
        </div>
        <RadioGroup value={retention} onValueChange={setRetention}>
          <div className="space-y-2">
            {['30days', '90days', '1year', 'forever'].map(r => (
              <label key={r} className="flex items-center justify-between p-3 bg-bg-2 rounded-lg cursor-pointer hover:bg-bg-1 transition-colors">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="retention"
                    value={r}
                    checked={retention === r}
                    onChange={() => setRetention(r as any)}
                    className="sr-only"
                  />
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
        </RadioGroup>
      </motion.div>
    )
  }

  if (item.type === 'toggle') {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between py-4"
      >
        <div>
          <p className="font-medium text-fg-0">{item.label}</p>
          <p className="text-sm text-fg-2">{item.description}</p>
        </div>
        <Button
          variant={notifications[item.id] ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setNotifications(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
          className="w-20"
        >
          {notifications[item.id] ? 'On' : 'Off'}
        </Button>
      </motion.div>
    )
  }

  if (item.type === 'connect') {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between py-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-bg-2 flex items-center justify-center">
            <item.icon className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-fg-0">{item.label}</p>
            <p className="text-sm text-fg-2">{item.description}</p>
          </div>
        </div>
        <Button
          variant={item.connected ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => alert(`${item.connected ? 'Disconnect' : 'Connect'} ${item.label} (demo)`)}
        >
          {item.connected ? 'Connected' : 'Connect'}
        </Button>
      </motion.div>
    )
  }

  if (item.type === 'action' || item.type === 'danger') {
    return (
      <motion.div
        key={item.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="flex items-center justify-between py-4"
      >
        <div>
          <p className={cn('font-medium', item.type === 'danger' ? 'text-error' : 'text-fg-0')}>{item.label}</p>
          <p className="text-sm text-fg-2">{item.description}</p>
        </div>
        <Button
          variant={item.type === 'danger' ? 'outline' : 'outline'}
          size="sm"
          className={cn(item.type === 'danger' && 'text-error border-error hover:bg-error/10')}
          onClick={() => alert(`${item.label} clicked (demo)`)}
        >
          {item.icon && <item.icon className="w-4 h-4 mr-1" />}
          {item.action === 'export_data' && 'Export'}
          {item.action === 'delete_account' && 'Delete Account'}
          {item.action === 'enable_2fa' && 'Enable'}
          {item.action === 'change_password' && 'Change'}
          {item.action === 'view_sessions' && 'View'}
          {item.action === 'manage_api' && 'Manage'}
        </Button>
      </motion.div>
    )
  }

  return null
}