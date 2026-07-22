import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button, Input } from '@/components/ui'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ScrollArea } from '@/components/ui/ScrollArea'
import {
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  ArrowUpRight,
  Mic,
  Paperclip,
  Menu,
  X,
  ChevronDown,
  Database,
  BarChart3,
  Lightbulb,
  Trash2,
  Edit,
} from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu'

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
    <div className="flex flex-col h-[calc(100vh-200px)] min-h-[600px] animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-light text-fg-0 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-accent" />
            Ask AI About Your Dataset
          </h1>
          <p className="text-fg-1 mt-1">Query your data in natural language. Get instant answers backed by real calculations.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent" className="gap-1">
            <Database className="w-3 h-3" />
            Active: Sales Analysis Q1 2026
          </Badge>
          <Button variant="ghost" size="sm" className="gap-1">
            <BarChart3 className="w-4 h-4" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-hidden bg-bg-1 border border-border-1 rounded-2xl flex flex-col">
        <ScrollArea className="flex-1 p-4 space-y-6">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
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

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-1/50">
                    <span className="text-xs text-fg-3 font-mono">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(message.content)}
                        aria-label="Copy message"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </Button>
                      {message.role === 'assistant' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Menu className="w-3.5 h-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Message Options</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => copyToClipboard(message.content)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-error">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
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
                  <span>AI is thinking...</span>
                  <div className="flex gap-1 ml-2">
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    >.</motion.span>
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                    >.</motion.span>
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                    >.</motion.span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </ScrollArea>

        {/* Suggested Prompts */}
        {showSuggestions && messages.length <= 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 border-t border-border-1"
          >
            <p className="text-sm text-fg-2 mb-3">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.slice(0, 6).map((prompt, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  className="text-left gap-2 hover:bg-accent-bg/30 hover:border-accent/50"
                  onClick={() => handleSuggestionClick(prompt)}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-fg-2" />
                  <span className="text-sm">{prompt}</span>
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-border-1 bg-bg-0/50">
          <form onSubmit={handleSubmit} className="flex items-end gap-3">
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask any question about your dataset..."
                className={cn(
                  'w-full px-4 py-3 bg-bg-2 border border-border-1 text-fg-0 placeholder-fg-3',
                  'rounded-xl resize-none transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent',
                  'min-h-[52px] max-h-[150px] pr-14'
                )}
                rows={1}
                style={{ height: 'auto' }}
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-fg-2 hover:text-fg-0"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-fg-2 hover:text-fg-0"
                  aria-label="Voice input"
                >
                  <Mic className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              size="lg"
              disabled={!input.trim() || isLoading}
              className="h-12 w-12 p-0 rounded-xl group"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5 group-hover:rotate-45 transition-transform" />
              )}
            </Button>
          </form>
          <p className="text-xs text-fg-3 text-center mt-2">
            Press <kbd className="px-1.5 py-0.5 bg-bg-2 rounded font-mono">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-bg-2 rounded font-mono">Shift+Enter</kbd> for new line
          </p>
        </div>
      </div>
    </div>
  )
}