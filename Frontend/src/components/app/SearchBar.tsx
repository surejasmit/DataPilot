import { useState, useRef, useEffect, useMemo } from 'react'
import { Search, X, Command, ArrowUp, ArrowDown, Home, FolderOpen, Lightbulb, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

interface SearchResult {
  id: string
  type: 'project' | 'dataset' | 'insight' | 'action'
  title: string
  description: string
  shortcut?: string
  route?: string
}

const mockResults: SearchResult[] = [
  { id: '1', type: 'project', title: 'Sales Analysis Q1 2026', description: 'Revenue trends and regional breakdown', route: '/projects/1' },
  { id: '2', type: 'project', title: 'Customer Churn Prediction', description: 'ML model for retention analysis', route: '/projects/2' },
  { id: '3', type: 'project', title: 'Marketing Campaign ROI', description: 'Channel performance and attribution', route: '/projects/3' },
  { id: '4', type: 'dataset', title: 'sales_2026.csv', description: '12,480 rows × 14 columns', route: '/projects/1/dataset' },
  { id: '5', type: 'dataset', title: 'customer_data.xlsx', description: '8,234 rows × 22 columns', route: '/projects/2/dataset' },
  { id: '6', type: 'dataset', title: 'products.json', description: '1,542 rows × 8 columns', route: '/projects/3/dataset' },
  { id: '7', type: 'insight', title: 'West region revenue +18.4%', description: 'Statistically significant growth detected', route: '/insights/1' },
  { id: '8', type: 'insight', title: 'Missing values in Age column', description: '124 nulls (1.0%) - median imputation recommended', route: '/insights/2' },
  { id: '9', type: 'insight', title: 'Duplicate rows detected', description: '18 exact duplicates found', route: '/insights/3' },
  { id: '10', type: 'action', title: 'Create new project', description: 'Start analyzing a new dataset', shortcut: '⌘N', route: '/projects/new' },
  { id: '11', type: 'action', title: 'Ask AI a question', description: 'Query your data in natural language', shortcut: '⌘K', route: '/ask-ai' },
  { id: '12', type: 'action', title: 'Generate insights', description: 'Auto-discover patterns in active dataset', shortcut: '⌘I', route: '/insights' },
]

const typeIcons = {
  project: <FolderOpen className="w-4 h-4 text-data-2" />,
  dataset: <Home className="w-4 h-4 text-data-1" />,
  insight: <Lightbulb className="w-4 h-4 text-data-3" />,
  action: <Zap className="w-4 h-4 text-accent" />,
}

const typeLabels = {
  project: 'Projects',
  dataset: 'Datasets',
  insight: 'Insights',
  action: 'Actions',
}

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const filteredResults = useMemo(() => {
    if (!query.trim()) return mockResults.slice(0, 6)
    return mockResults.filter(
      (r) =>
        r.title.toLowerCase().includes(query.toLowerCase()) ||
        r.description.toLowerCase().includes(query.toLowerCase())
    )
  }, [query])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1))
      setIsOpen(true)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const selected = filteredResults[selectedIndex]
      if (selected?.route) {
        window.location.href = selected.route
      }
      setIsOpen(false)
      setQuery('')
    }
  }

  const handleFocus = () => setIsOpen(true)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setSelectedIndex(0)
    setIsOpen(true)
  }

  const handleClear = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const groupedResults = useMemo(() => {
    const groups: Record<string, SearchResult[]> = {}
    filteredResults.forEach((r) => {
      if (!groups[r.type]) groups[r.type] = []
      groups[r.type].push(r)
    })
    return groups
  }, [filteredResults])

  return (
    <div className="relative flex-1 max-w-xl" ref={resultsRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-3 pointer-events-none" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Search projects, datasets, insights…"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 h-10 text-sm bg-bg-1 border-border-1 focus:border-accent focus:ring-accent"
          aria-label="Global search"
          aria-expanded={isOpen && filteredResults.length > 0}
          aria-controls="search-results"
        />
        {query && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-fg-3 hover:text-fg-0"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div
        id="search-results"
        className={cn(
          'absolute top-full left-0 right-0 z-50 mt-1.5 bg-bg-1 border border-border-1 rounded-xl shadow-xl overflow-hidden animate-scale-in',
          isOpen && (query || filteredResults.length > 0) ? 'block' : 'hidden'
        )}
        role="listbox"
      >
        {Object.entries(groupedResults).map(([type, results]) => (
          <div key={type} className="py-1">
            <div className="px-3 py-1.5 text-[11px] font-semibold text-fg-3 uppercase tracking-wider bg-bg-0/50 border-b border-border-1">
              {typeLabels[type as keyof typeof typeLabels]}
            </div>
            {results.slice(0, 4).map((result, index) => (
              <button
                key={result.id}
                role="option"
                aria-selected={selectedIndex === index}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors',
                  selectedIndex === results.indexOf(result) && filteredResults[selectedIndex]?.id === result.id
                    ? 'bg-accent-bg/30 text-fg-0'
                    : 'hover:bg-bg-2 text-fg-0'
                )}
                onClick={() => {
                  if (result.route) window.location.href = result.route
                  setIsOpen(false)
                  setQuery('')
                }}
                onMouseEnter={() => setSelectedIndex(filteredResults.indexOf(result))}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-bg-2 flex items-center justify-center">
                  {typeIcons[result.type]}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{result.title}</p>
                  <p className="text-xs text-fg-2 truncate">{result.description}</p>
                </div>
                {result.shortcut && (
                  <span className="flex-shrink-0 px-2 py-0.5 text-[10px] font-mono text-fg-3 bg-bg-2 rounded">
                    {result.shortcut}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}

        {filteredResults.length === 0 && query && (
          <div className="p-6 text-center text-fg-2">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No results for "{query}"</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        )}

        <div className="border-t border-border-1 p-2">
          <button
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-accent hover:bg-accent-bg/20 rounded-lg transition-colors"
            onClick={() => {
              window.location.href = '/projects/new'
              setIsOpen(false)
              setQuery('')
            }}
          >
            <Zap className="w-4 h-4" />
            Create new project
          </button>
        </div>

        <div className="px-3 pb-2 text-[11px] text-fg-3 flex items-center justify-center gap-2">
          <kbd className="px-1.5 py-0.5 bg-bg-2 rounded text-fg-1 font-mono">⌘</kbd>
          <kbd className="px-1.5 py-0.5 bg-bg-2 rounded text-fg-1 font-mono">K</kbd>
          <span>to open search</span>
        </div>
      </div>
    </div>
  )
}