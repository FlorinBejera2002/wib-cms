# SEO Article Generator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible chat panel to the PostForm that generates SEO articles via an external API and auto-populates all form fields.

**Architecture:** A server-side Next.js API route proxies requests to the external SEO API (hiding the API key), converts markdown→HTML, sanitizes it, and returns it. A new SeoChat React component renders a chat UI on the right side of PostForm. The user types natural-language requests, sees full article previews, and clicks "Apply" to populate the form.

**Tech Stack:** Next.js 15 API routes, React 19, TipTap, shadcn/ui (AlertDialog), marked, isomorphic-dompurify, lucide-react

**Spec:** `docs/superpowers/specs/2026-03-27-seo-article-generator-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/app/api/admin/tools/seo-generate/route.ts` | Create | Server proxy: validate, forward to external API, convert md→HTML, sanitize, return |
| `src/components/admin/posts/SeoChat.tsx` | Create | Chat panel UI: message list, input, loading state, Apply button, error display |
| `src/components/ui/alert-dialog.tsx` | Create | shadcn AlertDialog primitive (from radix) |
| `src/components/admin/posts/PostForm.tsx` | Modify | Add chat toggle button, flex wrapper, `seoChatOpen`/`externalContent` state, `handleApplyArticle` |
| `src/components/admin/posts/TipTapEditor.tsx` | Modify | Add `externalContent` prop with `useEffect` to call `setContent` |
| `.env.example` | Modify | Add `SEO_TOOL_API_URL` and `SEO_TOOL_STATIC_KEY` placeholders |
| `.env` | Modify | Add actual values |
| `package.json` | Modify | Add `marked`, `isomorphic-dompurify`, `@types/dompurify` |

---

### Task 1: Install dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install marked and isomorphic-dompurify**

```bash
cd C:\Users\flori\Documents\projects\wib-cms
yarn add marked isomorphic-dompurify
yarn add -D @types/dompurify
```

**Note:** `isomorphic-dompurify` can have compatibility issues with Next.js server-side rendering. If you encounter `ERR_REQUIRE_ESM` or `window is not defined` errors during build, try one of these fallbacks:
- Add `serverExternalPackages: ['isomorphic-dompurify']` to `next.config.mjs`
- Or replace `isomorphic-dompurify` with `dompurify` + `jsdom` directly in the route

- [ ] **Step 2: Verify installation**

Run: `node -e "require('marked'); require('isomorphic-dompurify'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add package.json yarn.lock
git commit -m "chore: add marked and isomorphic-dompurify dependencies"
```

---

### Task 2: Add environment variables

**Files:**
- Modify: `.env.example`
- Modify: `.env`

- [ ] **Step 1: Add placeholders to .env.example**

Add to the end of `.env.example`:

```env
# --- SEO Article Generator ---
SEO_TOOL_API_URL=https://www.asigurari.ro/ai-assistant/chat-api/v1/tools/seo/article
SEO_TOOL_STATIC_KEY=your-seo-tool-key-here
```

- [ ] **Step 2: Add actual values to .env**

Add to `.env`:

```env
# --- SEO Article Generator ---
SEO_TOOL_API_URL=https://www.asigurari.ro/ai-assistant/chat-api/v1/tools/seo/article
SEO_TOOL_STATIC_KEY=<actual-key-from-provider>
```

- [ ] **Step 3: Commit (only .env.example)**

```bash
git add .env.example
git commit -m "chore: add SEO tool env var placeholders"
```

---

### Task 3: Create the server-side proxy route

**Files:**
- Create: `src/app/api/admin/tools/seo-generate/route.ts`

- [ ] **Step 1: Create the proxy route**

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// gfm: true is the default in marked, no config needed

const SEO_API_URL = process.env.SEO_TOOL_API_URL
const SEO_API_KEY = process.env.SEO_TOOL_STATIC_KEY

export async function POST(request: NextRequest) {
  if (!SEO_API_URL || !SEO_API_KEY) {
    return NextResponse.json(
      { error: 'SEO tool not configured' },
      { status: 503 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    )
  }

  const { title, description, keywords } = body as {
    title?: string
    description?: string
    keywords?: string[]
  }

  if (!title && !description) {
    return NextResponse.json(
      { error: 'Title or description is required' },
      { status: 400 }
    )
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 60000)

    const apiPayload: Record<string, unknown> = {}
    if (title) apiPayload.title = title
    if (description) apiPayload.description = description
    if (keywords && keywords.length > 0) apiPayload.keywords = keywords

    const res = await fetch(SEO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SEO-Tool-Key': SEO_API_KEY,
      },
      body: JSON.stringify(apiPayload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown upstream error' }))
      return NextResponse.json(errorData, { status: res.status })
    }

    const data = await res.json()

    const contentMarkdown: string = data.article?.content_markdown || ''
    const contentHtmlRaw = marked.parse(contentMarkdown) as string
    const contentHtml = DOMPurify.sanitize(contentHtmlRaw)

    return NextResponse.json({
      article: {
        title: data.article?.title || '',
        summary: data.article?.summary || '',
        meta_description: data.article?.meta_description || '',
        content_html: contentHtml,
      },
      keywords: data.keywords || [],
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timed out' },
        { status: 504 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to connect to SEO service' },
      { status: 500 }
    )
  }
}
```

- [ ] **Step 2: Verify the route compiles**

Run: `npx next build --no-lint 2>&1 | head -20` (or just check for TS errors)
Alternatively: `npx tsc --noEmit src/app/api/admin/tools/seo-generate/route.ts` — but this may need full project context, so just ensure no red squiggles in editor or run `npx tsc --noEmit` from project root.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/tools/seo-generate/route.ts
git commit -m "feat: add server-side proxy route for SEO article generation"
```

---

### Task 4: Create the shadcn AlertDialog component

**Files:**
- Create: `src/components/ui/alert-dialog.tsx`

- [ ] **Step 1: Create the AlertDialog component manually**

This project does not have a `components.json` file, so the shadcn CLI will not work. Create `src/components/ui/alert-dialog.tsx` manually using the standard shadcn AlertDialog source. The component wraps `@radix-ui/react-alert-dialog` (already in `package.json`) with shadcn styling.

Reference the existing shadcn components in `src/components/ui/` (e.g., `dialog.tsx`) for the project's styling conventions (cn utility, className patterns). The AlertDialog follows the same patterns as Dialog but uses the `alert-dialog` radix primitive.

Check for the file: `src/components/ui/alert-dialog.tsx`

- [ ] **Step 2: Verify it exists and exports correctly**

The file should export: `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/alert-dialog.tsx
git commit -m "feat: add shadcn AlertDialog component"
```

---

### Task 5: Add externalContent prop to TipTapEditor

**Files:**
- Modify: `src/components/admin/posts/TipTapEditor.tsx`

- [ ] **Step 1: Update the TipTapEditorProps interface**

In `src/components/admin/posts/TipTapEditor.tsx`, change the interface at line 36-39:

```typescript
// Before:
interface TipTapEditorProps {
  content?: Record<string, unknown>
  onChange?: (json: Record<string, unknown>, html: string) => void
}

// After:
interface TipTapEditorProps {
  content?: Record<string, unknown>
  onChange?: (json: Record<string, unknown>, html: string) => void
  externalContent?: string | null
}
```

- [ ] **Step 2: Add useEffect import and externalContent to destructuring**

Change line 33 to include `useEffect`:

```typescript
import { useState, useCallback, useEffect } from 'react'
```

Change line 41 to include `externalContent`:

```typescript
export default function TipTapEditor({ content, onChange, externalContent }: TipTapEditorProps) {
```

- [ ] **Step 3: Add the useEffect that watches externalContent**

Add after the `useEditor` call (after line 69), before `const [imagePickerOpen`:

```typescript
  useEffect(() => {
    if (editor && externalContent) {
      editor.commands.setContent(externalContent)
    }
  }, [editor, externalContent])
```

When `externalContent` changes to a non-null string, `setContent` is called. This triggers TipTap's `onUpdate` callback (line 64-68), which fires `onChange` — syncing both `content` (JSON) and `contentHtml` back to PostForm.

PostForm is responsible for resetting `externalContent` back to `null` after setting it (see Task 7).

- [ ] **Step 4: Verify the component still works**

Run the dev server: `yarn dev`
Navigate to `/admin/posts/new`, verify the editor loads and typing works normally.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/posts/TipTapEditor.tsx
git commit -m "feat: add externalContent prop to TipTapEditor for programmatic content setting"
```

---

### Task 6: Create the SeoChat component

**Files:**
- Create: `src/components/admin/posts/SeoChat.tsx`

- [ ] **Step 1: Create the SeoChat component**

```tsx
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
    <div className="flex flex-col h-[calc(100vh-6rem)] border rounded-lg bg-white shadow-sm sticky top-20">
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
```

- [ ] **Step 2: Verify the component compiles**

Run: `npx tsc --noEmit` from project root. No errors expected for SeoChat.tsx.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/posts/SeoChat.tsx
git commit -m "feat: add SeoChat component for AI article generation"
```

---

### Task 7: Integrate SeoChat into PostForm

**Files:**
- Modify: `src/components/admin/posts/PostForm.tsx`

This is the most complex task. We modify PostForm to:
1. Add `seoChatOpen` and `externalContent` state
2. Add `handleApplyArticle` handler
3. Add a toggle button in the action bar
4. Wrap the form in a flex layout that accommodates the chat panel
5. Pass `externalContent` to TipTapEditor
6. Add an AlertDialog for overwrite confirmation

- [ ] **Step 1: Add new imports**

At the top of `PostForm.tsx`, add these imports. Insert after line 22 (the lucide imports):

```typescript
import { Sparkles } from 'lucide-react'
import SeoChat from './SeoChat'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
```

Also add `Sparkles` to the existing lucide-react import on line 22:

```typescript
import { Save, Loader2, ImagePlus, RefreshCw, AlertCircle, Eye, Sparkles } from 'lucide-react'
```

(Remove the separate `Sparkles` import if you consolidated it.)

- [ ] **Step 2: Add new state variables**

After line 86 (`const [ogPickerOpen, setOgPickerOpen] = useState(false)`), add:

```typescript
  const [seoChatOpen, setSeoChatOpen] = useState(false)
  const [externalContent, setExternalContent] = useState<string | null>(null)
  const [confirmArticle, setConfirmArticle] = useState<{
    article: { title: string; summary: string; meta_description: string; content_html: string }
    keywords: string[]
  } | null>(null)
```

- [ ] **Step 3: Add handleApplyArticle handler**

After `handleEditorChange` (line 125), add:

```typescript
  const handleApplyArticle = (
    article: { title: string; summary: string; meta_description: string; content_html: string },
    keywords: string[]
  ) => {
    const isDirty = Boolean(form.title || form.contentHtml || form.excerpt)
    if (isDirty) {
      setConfirmArticle({ article, keywords })
      return
    }
    applyArticleToForm(article, keywords)
  }

  const applyArticleToForm = (
    article: { title: string; summary: string; meta_description: string; content_html: string },
    keywords: string[]
  ) => {
    setForm((prev) => ({
      ...prev,
      title: article.title,
      slug: isEdit ? prev.slug : slugify(article.title),
      excerpt: article.summary,
      seo: {
        ...prev.seo,
        metaDescription: article.meta_description,
        metaKeywords: keywords.join(', '),
      },
    }))
    setExternalContent(article.content_html)
    setConfirmArticle(null)
  }
```

- [ ] **Step 4: Add handleEditorChange update to reset externalContent**

Modify the existing `handleEditorChange` to also reset `externalContent`. This ensures the reset happens synchronously after TipTap processes the content (no fragile timers):

```typescript
  const handleEditorChange = (json: Record<string, unknown>, html: string) => {
    setForm((prev) => ({ ...prev, content: json, contentHtml: html }))
    if (externalContent !== null) {
      setExternalContent(null)
    }
  }
```

This replaces the original one-liner at line 123-125. When `setContent` is called on TipTap, it triggers `onUpdate` → `handleEditorChange` → which resets `externalContent` to `null`. No `useEffect` or timer needed.

- [ ] **Step 5: Update the return JSX — wrap in flex layout**

Replace the opening `<div className="space-y-6">` (line 161) and closing `</div>` (line 472) with a flex wrapper:

The return should now be:

```tsx
  return (
    <div className="flex gap-6">
      <div className={seoChatOpen ? 'flex-1 min-w-0' : 'w-full'}>
        <div className="space-y-6">
          {/* ... all existing content stays here unchanged ... */}
        </div>
      </div>

      {seoChatOpen && (
        <div className="w-[400px] shrink-0 hidden lg:block">
          <SeoChat
            currentTitle={form.title}
            currentKeywords={form.seo?.metaKeywords || ''}
            onApplyArticle={handleApplyArticle}
            onClose={() => setSeoChatOpen(false)}
          />
        </div>
      )}

      <AlertDialog open={!!confirmArticle} onOpenChange={(open) => !open && setConfirmArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suprascrie continutul?</AlertDialogTitle>
            <AlertDialogDescription>
              Aceasta actiune va inlocui titlul, continutul, rezumatul si campurile SEO cu continut generat de AI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuleaza</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmArticle) {
                  applyArticleToForm(confirmArticle.article, confirmArticle.keywords)
                }
              }}
            >
              Aplica
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
```

- [ ] **Step 6: Add the AI toggle button in the action bar**

In the sticky action bar (line 163-184), add a toggle button in the right-side button group, before the Preview link. Insert after line 171 (`<div className="flex items-center gap-3">`):

```tsx
          <Button
            variant={seoChatOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSeoChatOpen((prev) => !prev)}
            className="hidden lg:inline-flex"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generator
          </Button>
```

- [ ] **Step 7: Pass externalContent to TipTapEditor**

Find the TipTapEditor usage (line 234):

```tsx
// Before:
<TipTapEditor content={form.content} onChange={handleEditorChange} />

// After:
<TipTapEditor content={form.content} onChange={handleEditorChange} externalContent={externalContent} />
```

- [ ] **Step 8: Verify everything works**

Run: `yarn dev`
1. Navigate to `/admin/posts/new`
2. Verify the "AI Generator" button appears in the action bar
3. Click it — the chat panel should appear on the right
4. Type a message and send (will fail if no .env values, but the UI should work)
5. Click X to close the panel
6. Verify the form still works normally (save, edit, etc.)

- [ ] **Step 9: Commit**

```bash
git add src/components/admin/posts/PostForm.tsx
git commit -m "feat: integrate SeoChat panel into PostForm with apply and overwrite confirmation"
```

---

### Task 8: End-to-end manual test

- [ ] **Step 1: Verify .env has the correct values**

Ensure `.env` contains:
```
SEO_TOOL_API_URL=https://www.asigurari.ro/ai-assistant/chat-api/v1/tools/seo/article
SEO_TOOL_STATIC_KEY=<actual-key-from-provider>
```

- [ ] **Step 2: Start the dev server**

```bash
yarn dev
```

- [ ] **Step 3: Test the full flow**

1. Navigate to `http://localhost:3000/admin/posts/new`
2. Click "AI Generator" button → chat panel opens
3. Type: "Scrie un articol despre asigurarea CASCO in 2026"
4. Wait for the response (10-30 seconds)
5. Verify the response shows: title, summary, meta description, content preview, keywords
6. Click "Apply to form"
7. Verify all fields are populated: title, slug, TipTap content, excerpt, SEO meta description, SEO keywords
8. Type another message: "Fa articolul mai lung si adauga mai multe despre despagubiri"
9. Verify a new article is generated
10. Click "Apply to form" on the new response → confirm dialog should appear (form is dirty)
11. Click "Aplica" → verify fields are updated

- [ ] **Step 4: Test error cases**

1. Temporarily change `SEO_TOOL_STATIC_KEY` to an invalid value in `.env`
2. Restart dev server
3. Send a message → should see error in chat
4. Restore the correct key

- [ ] **Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```

(Skip if no fixes needed.)
