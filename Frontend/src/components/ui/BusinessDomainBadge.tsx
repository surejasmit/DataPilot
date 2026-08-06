const domainColors: Record<string, string> = {
  hr: 'bg-purple-100 text-purple-800 border border-purple-200',
  sales: 'bg-green-100 text-green-800 border border-green-200',
  finance: 'bg-blue-100 text-blue-800 border border-blue-200',
  customer: 'bg-orange-100 text-orange-800 border border-orange-200',
  inventory: 'bg-teal-100 text-teal-800 border border-teal-200',
  marketing: 'bg-pink-100 text-pink-800 border border-pink-200',
  general: 'bg-gray-100 text-gray-800 border border-gray-200',
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

export function BusinessDomainBadge({ domain }: { domain?: string }) {
  if (!domain) return null
  const d = domain.toLowerCase()
  const colorClass = domainColors[d] || domainColors.general
  const label = domainLabels[d] || domain
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  )
}

export function getDomainFromProjectName(name: string): string {
  const lower = name.toLowerCase()
  if (/employee|hr|human|staff|personnel|recruit|salary|payroll/.test(lower)) return 'hr'
  if (/sales|revenue|deal|quota|pipeline|forecast/.test(lower)) return 'sales'
  if (/financ|budget|expense|profit|loss|accounting|ledger/.test(lower)) return 'finance'
  if (/customer|client|retention|churn|satisfaction|nps/.test(lower)) return 'customer'
  if (/inventory|supply|warehouse|stock|logistics|shipping/.test(lower)) return 'inventory'
  if (/market|campaign|lead|conversion|funnel|brand/.test(lower)) return 'marketing'
  return 'general'
}
