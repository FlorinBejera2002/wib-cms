'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Send, Loader2, X, AlertCircle, Square } from 'lucide-react'
import { POST_FORM_LABELS as L } from '@/lib/post-form-labels'

export interface ArticleSnapshot {
  title: string
  summary: string
  meta_description: string
  meta_keywords: string[]
  content_markdown: string
  category: string | null
  insurance_system: string | null
}

export interface SelectionInfo {
  field: 'title' | 'summary' | 'meta_description' | 'content_markdown'
  start_utf16: number
  end_utf16: number
  text: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  article?: ArticleSnapshot
  error?: string
}

interface SeoChatProps {
  article: ArticleSnapshot | null
  selection: SelectionInfo | null
  categoryOptions: string[]
  insuranceSystemOptions: string[]
  keywords: string[]
  onApplyArticle: (article: ArticleSnapshot) => void
  onClearSelection?: () => void
  onClose: () => void
}

function detectMode(text: string, hasArticle: boolean): 'edit' | 'respond_only' {
  if (!hasArticle) return 'edit'
  const lower = text.toLowerCase().trim()
  const questionPatterns = /^(explica|de ce|cum |ce |care |spune|analizeaza|why|what|how|explain|describe|tell)/
  if (lower.includes('?') || questionPatterns.test(lower)) return 'respond_only'
  return 'edit'
}

export default function SeoChat({
  article,
  selection,
  categoryOptions,
  insuranceSystemOptions,
  keywords,
  onApplyArticle,
  onClearSelection,
  onClose,
}: SeoChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [lastEditArticle, setLastEditArticle] = useState<ArticleSnapshot | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingText])

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort()
    if (streamingText) {
      setMessages((prev) => [...prev, { role: 'assistant', content: streamingText }])
      setStreamingText('')
    }
    setIsLoading(false)
    abortControllerRef.current = null
  }, [streamingText])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: trimmed }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setIsLoading(true)
    setStreamingText('')
    setLastEditArticle(null)

    const mode = detectMode(trimmed, !!article)
    const delivery = mode === 'respond_only' ? 'sse' : 'json'

    // Build messages array for API
    const apiMessages = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const payload: Record<string, unknown> = {
      request_mode: mode,
      delivery,
      messages: apiMessages,
    }

    if (article) payload.article = article
    if (selection && mode === 'edit') payload.selection = selection
    if (keywords.length > 0) payload.keywords = keywords
    if (categoryOptions.length > 0) payload.category_options = categoryOptions
    if (insuranceSystemOptions.length > 0) payload.insurance_system_options = insuranceSystemOptions

    try {
      abortControllerRef.current = new AbortController()
      const res = await fetch('/api/admin/tools/seo-article', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }))
        const errorMsg = typeof errorData.error === 'string'
          ? errorData.error
          : JSON.stringify(errorData)
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '', error: errorMsg },
        ])
        return
      }

      if (delivery === 'sse') {
        // Stream SSE response
        const reader = res.body?.getReader()
        if (!reader) throw new Error('No response body')
        const decoder = new TextDecoder()
        let buffer = ''
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const parts = buffer.split('\n\n')
          buffer = parts.pop() || ''

          for (const part of parts) {
            const lines = part.split('\n')
            let eventType = ''
            let eventData = ''
            for (const line of lines) {
              if (line.startsWith('event:')) eventType = line.slice(6).trim()
              else if (line.startsWith('data:')) eventData = line.slice(5).trim()
            }

            if (eventType === 'token' && eventData) {
              try {
                const parsed = JSON.parse(eventData)
                accumulated += parsed.token || parsed.text || ''
                setStreamingText(accumulated)
              } catch {
                accumulated += eventData
                setStreamingText(accumulated)
              }
            } else if (eventType === 'done') {
              // Stream complete
            } else if (eventType === 'error') {
              setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '', error: eventData },
              ])
              setStreamingText('')
              return
            }
          }
        }

        // Finalize streaming message
        if (accumulated) {
          setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }])
        }
        setStreamingText('')
      } else {
        // JSON response
        const data = await res.json()
        const assistantText = data.assistant_response || data.message || ''

        if (data.article) {
          const art: ArticleSnapshot = {
            title: data.article.title || '',
            summary: data.article.summary || '',
            meta_description: data.article.meta_description || '',
            meta_keywords: data.article.meta_keywords || data.keywords || [],
            content_markdown: data.article.content_markdown || '',
            category: data.article.category || null,
            insurance_system: data.article.insurance_system || null,
          }
          setLastEditArticle(art)
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: assistantText, article: art },
          ])
        } else {
          setMessages((prev) => [
            ...prev,
            { role: 'assistant', content: assistantText },
          ])
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '', error: 'Failed to connect to SEO service' },
      ])
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [input, isLoading, messages, article, selection, keywords, categoryOptions, insuranceSystemOptions])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[min(600px,calc(100vh-6rem))] border rounded-lg bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <h3 className="font-semibold text-sm">{L.aiChatTitle}</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center mt-8">
            {L.aiPlaceholder}
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === 'user' ? (
              <div className="flex justify-end">
                <div className="bg-green-600 text-white rounded-lg px-3 py-2 max-w-[85%] text-sm">
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
                {msg.content && (
                  <p className="text-sm text-muted-foreground">{msg.content}</p>
                )}
                <h4 className="font-bold text-base">{msg.article.title}</h4>
                <p className="text-sm text-muted-foreground">{msg.article.summary}</p>
                <p className="text-xs text-muted-foreground italic">
                  Meta: {msg.article.meta_description}
                </p>
                {msg.article.meta_keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {msg.article.meta_keywords.map((kw, j) => (
                      <Badge key={j} variant="secondary" className="text-xs">
                        {kw}
                      </Badge>
                    ))}
                  </div>
                )}
                {msg.article.category && (
                  <p className="text-xs text-muted-foreground">
                    Categorie: <span className="font-medium">{msg.article.category}</span>
                  </p>
                )}
                {msg.article.insurance_system && (
                  <p className="text-xs text-muted-foreground">
                    Sistem: <span className="font-medium">{msg.article.insurance_system}</span>
                  </p>
                )}
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => onApplyArticle(msg.article!)}
                >
                  {L.aiApply}
                </Button>
              </Card>
            ) : msg.content ? (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap">
                  {msg.content}
                </div>
              </div>
            ) : null}
          </div>
        ))}

        {/* Streaming text */}
        {isLoading && streamingText && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 max-w-[85%] text-sm whitespace-pre-wrap">
              {streamingText}
              <span className="inline-block w-1.5 h-4 bg-green-600 ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading indicator for JSON mode */}
        {isLoading && !streamingText && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {L.aiGenerating}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Selection indicator */}
      {selection && (
        <div className="px-3 pt-2">
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-md px-2 py-1 text-xs">
            <span className="text-green-700 font-medium">{L.aiSelectionLabel}</span>
            <span className="text-green-600 truncate max-w-[250px]">
              &ldquo;{selection.text}&rdquo;
            </span>
            {onClearSelection && (
              <button
                onClick={onClearSelection}
                className="ml-auto text-green-500 hover:text-green-700"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={L.aiPlaceholder}
            disabled={isLoading}
            rows={2}
            className="flex-1 resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
          />
          {isLoading ? (
            <Button
              size="icon"
              variant="destructive"
              onClick={handleStop}
              className="self-end"
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="self-end bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
