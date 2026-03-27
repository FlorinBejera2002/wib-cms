'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, X, AlertCircle } from 'lucide-react'

interface SeoArticle {
  title: string
  summary: string
  meta_description: string
  content_html: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  article?: SeoArticle
  keywords?: string[]
  error?: string
}

interface SeoChatProps {
  currentTitle: string
  currentKeywords: string
  onApplyArticle: (article: SeoArticle, keywords: string[]) => void
  onClose: () => void
}

export default function SeoChat({
  currentTitle,
  currentKeywords,
  onApplyArticle,
  onClose,
}: SeoChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isGenerating) return

    // Add user message
    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsGenerating(true)

    // Build description from all user messages
    const allUserMessages = updatedMessages
      .filter((m) => m.role === 'user')
      .map((m) => m.content)
    const description = allUserMessages.join('. ')

    // Build keywords from PostForm SEO field
    const keywords = currentKeywords
      ? currentKeywords.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined

    // Build payload
    const payload: Record<string, unknown> = { description }
    if (currentTitle) payload.title = currentTitle
    if (keywords && keywords.length > 0) payload.keywords = keywords

    try {
      abortControllerRef.current = new AbortController()
      const clientTimeout = setTimeout(() => abortControllerRef.current?.abort(), 65000)
      const res = await fetch('/api/admin/tools/seo-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      })
      clearTimeout(clientTimeout)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        const errorMsg = typeof errorData.error === 'string'
          ? errorData.error
          : JSON.stringify(errorData.error)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', error: errorMsg },
        ])
        return
      }

      const data = await res.json()
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.article.title,
          article: data.article,
          keywords: data.keywords,
        },
      ])
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', error: 'Failed to connect to SEO service' },
      ])
    } finally {
      setIsGenerating(false)
      abortControllerRef.current = null
    }
  }, [input, isGenerating, messages, currentTitle, currentKeywords])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[min(560px,calc(100vh-6rem))] border rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h3 className="font-semibold text-sm">AI Article Generator</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            Describe the article you want to generate...
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2 max-w-[85%] text-sm">
                  {msg.content}
                </div>
              </div>
            ) : msg.error ? (
              <div className="flex items-start gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                {msg.error}
              </div>
            ) : msg.article ? (
              <Card className="p-4 space-y-3">
                <h4 className="font-bold text-base">{msg.article.title}</h4>
                <p className="text-sm text-muted-foreground">{msg.article.summary}</p>
                <p className="text-xs text-muted-foreground italic">
                  Meta: {msg.article.meta_description}
                </p>
                <div
                  className="prose prose-sm max-h-[300px] overflow-y-auto border rounded p-3 bg-muted/20"
                  dangerouslySetInnerHTML={{ __html: msg.article.content_html }}
                />
                {msg.keywords && msg.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {msg.keywords.map((kw, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onApplyArticle(msg.article!, msg.keywords || [])}
                >
                  Apply to form
                </Button>
              </Card>
            ) : null}
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating article...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want..."
            disabled={isGenerating}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isGenerating}
            className="self-end"
          >
            {isGenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
