import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, FolderOpen, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { api, Project } from '@/lib/api'

interface SearchResult {
  id: string
  type: 'project' | 'action'
  title: string
  description: string
  shortcut?: string
  route?: string
}

const typeIcons = {
  project: <FolderOpen className="w-4 h-4 text-data-2" />,
  action: <Zap className="w-4 h-4 text-accent" />,
}

const typeLabels = {
  project: 'Projects',
  action: 'Actions',
}

const actionResults: SearchResult[] = [
  { id: 'action-1', type: 'action', title: 'Create new project', description: 'Start analyzing a new dataset', shortcut: '⌘N', route: '/projects/new' },
  { id: 'action-2', type: 'action', title: 'Ask AI a question', description: 'Query your data in natural language', shortcut: '⌘K', route: '/ask-ai' },
  { id: 'action-3', type: 'action', title: 'View insights', description: 'Auto-discover patterns in active dataset', route: '/insights' },
]

export function SearchBar() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    api.projects.getAll()
      .then(setProjects)
      .catch(() => {})
  }, [])

  const projectResults: SearchResult[] = useMemo(() => {
    return projects.map(p => ({
      id: String(p.id),
      type: 'project' as const,
      title: p.name,
      description: p.dataset_name || p.description || 'No dataset',
      route: `/projects/${p.id}`,
    }))
  }, [projects])

  const allResults = useMemo(() => [...projectResults, ...actionResults], [projectResults])

  const filteredResults = useMemo(() => {
    if (!query.trim()) return allResults.slice(0, 8)
    const q = query.toLowerCase()
    return allResults.filter(
      r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q)
    )
  }, [query, allResults])

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
        navigate(selected.route)
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

  const handleResultClick = (route: string) => {
    navigate(route)
    setIsOpen(false)
    setQuery('')
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
                  if (result.route) handleResultClick(result.route)
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
              navigate('/projects/new')
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
