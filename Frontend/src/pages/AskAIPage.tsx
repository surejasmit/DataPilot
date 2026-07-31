import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/ScrollArea'
import {
  Send, Loader2, MessageSquare, Sparkles, Copy, ArrowUpRight,
  Paperclip, Menu, X, Database, Plus,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isStreaming?: boolean
  suggestedActions?: SuggestedAction[]
}

interface SuggestedAction {
  label: string
  action: string
}

const mockChats = [
  { id: '1', title: 'Q1 Revenue Analysis', time: '2h ago', active: true },
  { id: '2', title: 'Customer Churn Patterns', time: '1d ago', active: false },
  { id: '3', title: 'Product Performance', time: '3d ago', active: false },
  { id: '4', title: 'Regional Comparison', time: '1w ago', active: false },
]

const mockMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: `Hello! I'm your AI data analyst. I can help you explore your datasets, generate insights, create visualizations, and answer questions about your data.

What would you like to do today?`,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    suggestedActions: [
      { label: 'Analyze my latest dataset', action: 'analyze' },
      { label: 'Show me data quality issues', action: 'quality' },
      { label: 'Generate a summary report', action: 'report' },
    ],
  },
  {
    id: '2',
    role: 'user',
    content: 'Which region had the highest revenue growth last quarter?',
    timestamp: new Date(Date.now() - 1000 * 60 * 3),
  },
  {
    id: '3',
    role: 'assistant',
    content: `Based on your **Sales Analysis Q1 2026** dataset (12,480 rows), the **West region** had the highest revenue growth at **+18.4%** compared to the prior quarter.

**Key findings:**
- West: +18.4% ($2.3M → $2.7M)
- Northeast: +12.1% ($1.8M → $2.0M)
- South: +5.2% ($1.5M → $1.6M)
- Midwest: -2.3% ($1.9M → $1.8M)

The growth in the West region is statistically significant (p < 0.01) and driven primarily by the **Enterprise** segment, which grew 34% YoY.

Would you like me to create a visualization of this trend or drill down into the top-performing products in the West region?`,
    timestamp: new Date(Date.now() - 1000 * 60 * 2),
    suggestedActions: [
      { label: 'Create revenue trend chart', action: 'chart' },
      { label: 'Show top products in West', action: 'products' },
      { label: 'Compare all regions', action: 'compare' },
    ],
  },
]

const suggestedPrompts = [
  'Which product has the highest sales?',
  'Find missing values in my dataset',
  'Show correlation matrix',
  'Predict customer churn',
  'What are the top 5 customers by revenue?',
  'Show me outliers in the data',
  'Create a dashboard summary',
  'Explain the data distribution',
]

export function AskAIPage() {
  const [messages, setMessages] = useState<Message[]>(mockMessages)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [showChatHistory, setShowChatHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

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

    await new Promise(resolve => setTimeout(resolve, 1500))

    const aiMessage: Message = {
      id: `${Date.now()}-ai`,
      role: 'assistant',
      content: `I analyzed your question about "${userInput}". Based on the current dataset, here are the key findings...`,
      timestamp: new Date(),
      suggestedActions: [
        { label: 'Create visualization', action: 'viz' },
        { label: 'Export results', action: 'export' },
        { label: 'Ask follow-up', action: 'followup' },
      ],
    }

    setMessages(prev => [...prev, aiMessage])
    setIsLoading(false)
  }

  const handleSuggestionClick = (prompt: string) => {
    setInput(prompt)
    handleSubmit(new Event('submit') as any)
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

  return (
    <div className="flex h-[calc(100vh-160px)] min-h-[600px] animate-fade-in -m-4 lg:-m-6 xl:-m-8">
      <aside className={cn(
        'w-64 flex-shrink-0 border-r border-border-1 bg-bg-1 flex flex-col transition-all duration-300',
        'hidden lg:flex'
      )}>
        <div className="p-3 border-b border-border-1">
          <Button className="w-full justify-start gap-2" variant="outline" size="sm" onClick={() => {}}>
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {mockChats.map(chat => (
            <button
              key={chat.id}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors',
                chat.active
                  ? 'bg-accent-bg text-accent border border-accent/20'
                  : 'text-fg-1 hover:bg-bg-2 hover:text-fg-0'
              )}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{chat.title}</span>
              </div>
              <p className="text-[11px] text-fg-3 mt-0.5 ml-6">{chat.time}</p>
            </button>
          ))}
        </div>
      </aside>

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
              <p className="text-[11px] text-fg-3">Ask anything about your data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="accent" size="sm" className="gap-1.5 hidden sm:flex">
              <Database className="w-3 h-3" />
              Sales Analysis Q1 2026
            </Badge>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <ScrollArea className="flex-1 px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-6">
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
                              onClick={() => handleSuggestionClick(action.action)}
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
                  {suggestedPrompts.slice(0, 4).map((prompt, i) => (
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
                  placeholder="Ask any question about your dataset..."
                  className={cn(
                    'w-full px-4 py-3 pr-24 bg-bg-1 border border-border-1 text-fg-0 placeholder-fg-3',
                    'rounded-xl resize-none transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
                    'min-h-[48px] max-h-[150px]'
                  )}
                  rows={1}
                  style={{ height: 'auto' }}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-fg-3 hover:text-fg-0"
                    aria-label="Attach file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading}
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

      <aside className="w-64 flex-shrink-0 border-l border-border-1 bg-bg-1 hidden xl:flex flex-col">
        <div className="p-3 border-b border-border-1">
          <h3 className="text-xs font-semibold text-fg-3 uppercase tracking-wider">Dataset Info</h3>
        </div>
        <div className="p-3 space-y-3">
          <div className="p-3 bg-bg-2 rounded-lg">
            <p className="text-xs text-fg-3 mb-1">Active Dataset</p>
            <p className="text-sm font-medium text-fg-0">Sales Analysis Q1 2026</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-fg-3">
              <span>12,480 rows</span>
              <span>·</span>
              <span>24 columns</span>
            </div>
          </div>
          <div className="p-3 bg-bg-2 rounded-lg">
            <p className="text-xs text-fg-3 mb-1">Data Quality</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-bg-3 rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: '94%' }} />
              </div>
              <span className="text-xs font-medium text-success">94%</span>
            </div>
          </div>
          <div className="p-3 bg-bg-2 rounded-lg">
            <p className="text-xs text-fg-3 mb-1">Quick Stats</p>
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-xs">
                <span className="text-fg-2">Numeric columns</span>
                <span className="font-mono text-fg-0">8</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-fg-2">Categorical columns</span>
                <span className="font-mono text-fg-0">14</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-fg-2">Date columns</span>
                <span className="font-mono text-fg-0">2</span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {showChatHistory && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowChatHistory(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-bg-1 border-r border-border-1 flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-border-1">
              <h3 className="font-medium text-fg-0 text-sm">Chat History</h3>
              <button onClick={() => setShowChatHistory(false)} className="p-1 text-fg-2 hover:text-fg-0">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {mockChats.map(chat => (
                <button
                  key={chat.id}
                  className={cn(
                    'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors',
                    chat.active
                      ? 'bg-accent-bg text-accent border border-accent/20'
                      : 'text-fg-1 hover:bg-bg-2 hover:text-fg-0'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <p className="text-[11px] text-fg-3 mt-0.5 ml-6">{chat.time}</p>
                </button>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}
