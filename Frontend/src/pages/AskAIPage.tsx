import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/ScrollArea'
import {
  Send, Loader2, Sparkles, Copy, ArrowUpRight,
  Menu, X, Database,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { api, Project } from '@/lib/api'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestedActions?: SuggestedAction[]
}

interface SuggestedAction {
  label: string
  action: string
}

export function AskAIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your AI data analyst. Select a dataset from the sidebar, then ask me anything about your data.",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const [selectedDataset, setSelectedDataset] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    api.projects.getAll()
      .then(projs => {
        const withDataset = projs.filter(p => p.dataset_name)
        const readyProjects = withDataset.filter(p => p.dataset_path && (p.status === 'READY' || p.status === 'completed'))
        const listToShow = readyProjects.length > 0 ? readyProjects : withDataset
        setProjects(listToShow)
        if (listToShow.length > 0 && !selectedDataset) {
          const defaultProject = listToShow.find(p => p.dataset_path) || listToShow[0]
          setSelectedDataset(defaultProject)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (selectedDataset) {
      api.datasets.getSuggestedQuestions(String(selectedDataset.id))
        .then(qs => setSuggestedQuestions(Array.isArray(qs) ? qs : []))
        .catch(() => setSuggestedQuestions([]))
    }
  }, [selectedDataset])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    if (!selectedDataset) {
      const msg: Message = {
        id: `${Date.now()}-err`,
        role: 'assistant',
        content: 'Please select a dataset first from the sidebar before asking questions.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, msg])
      return
    }

    const userMessage: Message = {
      id: `${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    const userInput = input
    setInput('')
    setShowSuggestions(false)
    setIsLoading(true)

    try {
      const response = await api.datasets.askQuestion(String(selectedDataset.id), userInput)
      const answer = typeof response === 'string'
        ? response
        : response?.answer || response?.message || response?.response || JSON.stringify(response)

      const aiMessage: Message = {
        id: `${Date.now()}-ai`,
        role: 'assistant',
        content: answer,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, aiMessage])
    } catch (err) {
      const errMessage: Message = {
        id: `${Date.now()}-err`,
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt)
    setTimeout(() => {
      const form = document.querySelector('form')
      if (form) form.requestSubmit()
    }, 0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const promptsToShow = suggestedQuestions.length > 0 ? suggestedQuestions : [
    'Which product has the highest sales?',
    'Find missing values in my dataset',
    'Show correlation matrix',
    'What are the top 5 rows by revenue?',
  ]

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[600px] animate-fade-in -m-4 lg:-m-6 xl:-m-8">
      {/* Sidebar - Dataset Selection */}
      <aside className={cn(
        'w-64 flex-shrink-0 border-r border-border-1 bg-bg-1 flex flex-col transition-all duration-300',
        'hidden lg:flex'
      )}>
        <div className="p-3 border-b border-border-1">
          <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider mb-2">Datasets</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {projects.length === 0 && (
            <p className="text-xs text-fg-3 p-3">No datasets available. Upload a dataset first.</p>
          )}
          {projects.map(project => (
            <button
              key={project.id}
              onClick={() => {
                setSelectedDataset(project)
                setMessages([{
                  id: 'welcome',
                  role: 'assistant',
                  content: `Switched to dataset "${project.dataset_name || project.name}". Ask me anything about this data!`,
                  timestamp: new Date(),
                }])
                setShowSuggestions(true)
              }}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors',
                selectedDataset?.id === project.id
                  ? 'bg-accent-bg text-accent border border-accent/20'
                  : 'text-fg-1 hover:bg-bg-2 hover:text-fg-0'
              )}
            >
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{project.dataset_name || project.name}</span>
              </div>
              {project.dataset_rows && (
                <p className="text-[11px] text-fg-3 mt-0.5 ml-6">{project.dataset_rows.toLocaleString()} rows</p>
              )}
            </button>
          ))}
        </div>
      </aside>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 py-3 border-b border-border-1 bg-bg-0/50">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 text-fg-2 hover:text-fg-0 transition-colors rounded-md"
              onClick={() => setShowChatHistory(!showChatHistory)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-fg-0 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                AI Chat
              </h1>
              <p className="text-[11px] text-fg-3">
                {selectedDataset ? `Asking about: ${selectedDataset.dataset_name || selectedDataset.name}` : 'Select a dataset to start'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedDataset && (
              <Badge variant="accent" size="sm" className="gap-1.5 hidden sm:flex">
                <Database className="w-3 h-3" />
                {selectedDataset.dataset_name || selectedDataset.name}
              </Badge>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
              {!selectedDataset && (
                <div className="p-6 text-center">
                  <Database className="w-12 h-12 text-fg-3 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-fg-0 mb-2">No Dataset Selected</h3>
                  <p className="text-sm text-fg-2 mb-4">Select a dataset from the sidebar to start asking questions about your data.</p>
                  {projects.length === 0 && (
                    <p className="text-xs text-fg-3">No projects with datasets found. Upload a dataset first.</p>
                  )}
                </div>
              )}

              <AnimatePresence mode="popLayout">
                {messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ delay: index * 0.02 }}
                    className={cn('flex gap-3', message.role === 'user' && 'flex-row-reverse')}
                  >
                    <Avatar
                      size="sm"
                      fallback={message.role === 'user' ? 'You' : 'AI'}
                      className={cn(
                        'flex-shrink-0 mt-0.5',
                        message.role === 'user' ? 'bg-accent-bg text-accent' : 'bg-data-4-bg text-data-4'
                      )}
                    >
                      {message.role === 'assistant' && <Sparkles className="w-4 h-4" />}
                    </Avatar>

                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl p-4',
                        message.role === 'user'
                          ? 'bg-accent text-bg-0 rounded-tr-sm'
                          : 'bg-bg-2 rounded-tl-sm'
                      )}
                    >
                      <div className="prose prose-sm prose-invert max-w-none">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                      </div>

                      {message.suggestedActions && message.suggestedActions.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.suggestedActions.map((action, i) => (
                            <Button
                              key={i}
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs"
                              onClick={() => handleSuggestionClick(action.label)}
                            >
                              <ArrowUpRight className="w-3 h-3" />
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-border-1/50">
                        <span className="text-[11px] text-fg-3 font-mono">
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(message.content)}
                            aria-label="Copy message"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <Avatar size="sm" fallback="AI" className="bg-data-4-bg text-data-4 flex-shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </Avatar>
                  <div className="bg-bg-2 rounded-2xl p-4 max-w-[85%] rounded-tl-sm">
                    <div className="flex items-center gap-2 text-fg-2">
                      <Loader2 className="w-4 h-4 animate-spin text-accent" />
                      <span className="text-sm">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {showSuggestions && messages.length <= 1 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-4 pb-4"
            >
              <div className="max-w-3xl mx-auto">
                <p className="text-xs text-fg-3 mb-2.5 font-medium">Try asking</p>
                <div className="grid grid-cols-2 gap-2">
                  {promptsToShow.slice(0, 4).map((prompt, i) => (
                    <button
                      key={i}
                      className="text-left p-3 bg-bg-1 border border-border-1 rounded-xl text-sm text-fg-1 hover:text-fg-0 hover:border-accent/40 hover:bg-accent-bg/10 transition-all"
                      onClick={() => handleSuggestionClick(prompt)}
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div className="border-t border-border-1 bg-bg-0/80 backdrop-blur-sm p-4">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedDataset ? "Ask any question about your dataset..." : "Select a dataset first..."}
                  disabled={!selectedDataset}
                  className={cn(
                    'w-full px-4 py-3 pr-24 bg-bg-1 border border-border-1 text-fg-0 placeholder-fg-3',
                    'rounded-xl resize-none transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
                    'min-h-[48px] max-h-[150px]',
                    !selectedDataset && 'opacity-50 cursor-not-allowed'
                  )}
                  rows={1}
                  style={{ height: 'auto' }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading || !selectedDataset}
                    className="h-8 w-8 p-0 rounded-lg"
                    aria-label="Send message"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-fg-3 text-center mt-2">
                Press <kbd className="px-1 py-0.5 bg-bg-2 rounded text-[10px] font-mono">Enter</kbd> to send
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Right sidebar - Dataset Info */}
      <aside className="w-64 flex-shrink-0 border-l border-border-1 bg-bg-1 hidden xl:flex flex-col">
        <div className="p-3 border-b border-border-1">
          <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider">Dataset Info</h3>
        </div>
        <div className="p-3 space-y-3">
          {selectedDataset ? (
            <>
              <div className="p-3 bg-bg-2 rounded-lg">
                <p className="text-xs text-fg-3 mb-1">Active Dataset</p>
                <p className="text-sm font-medium text-fg-0">{selectedDataset.dataset_name || selectedDataset.name}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-fg-3">
                  {selectedDataset.dataset_rows && <span>{selectedDataset.dataset_rows.toLocaleString()} rows</span>}
                  {selectedDataset.dataset_columns && (
                    <>
                      <span>·</span>
                      <span>{selectedDataset.dataset_columns} columns</span>
                    </>
                  )}
                </div>
              </div>
              {selectedDataset.dataset_size && (
                <div className="p-3 bg-bg-2 rounded-lg">
                  <p className="text-xs text-fg-3 mb-1">File Size</p>
                  <p className="text-sm font-medium text-fg-0">{(selectedDataset.dataset_size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              )}
            </>
          ) : (
            <div className="p-3 bg-bg-2 rounded-lg text-center">
              <Database className="w-8 h-8 text-fg-3 mx-auto mb-2" />
              <p className="text-sm text-fg-2">No dataset selected</p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Chat History Overlay */}
      {showChatHistory && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowChatHistory(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-bg-1 border-r border-border-1 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border-1">
              <h3 className="font-medium text-fg-0 text-sm">Datasets</h3>
              <button onClick={() => setShowChatHistory(false)} className="p-1 text-fg-2 hover:text-fg-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {projects.map(project => (
                <button
                  key={project.id}
                  onClick={() => {
                    setSelectedDataset(project)
                    setShowChatHistory(false)
                    setMessages([{
                      id: 'welcome',
                      role: 'assistant',
                      content: `Switched to dataset "${project.dataset_name || project.name}". Ask me anything!`,
                      timestamp: new Date(),
                    }])
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors',
                    selectedDataset?.id === project.id
                      ? 'bg-accent-bg text-accent border border-accent/20'
                      : 'text-fg-1 hover:bg-bg-2 hover:text-fg-0'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{project.dataset_name || project.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
