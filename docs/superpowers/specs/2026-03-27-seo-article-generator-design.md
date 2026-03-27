# SEO Article Generator — Design Spec

## Overview

Integrate an external SEO article generation endpoint into the CMS "New Post" form via a collapsible chat panel. The user describes what they want in natural language, the system calls a server-side proxy to generate an SEO article, and the result is displayed as a full preview in the chat. The user can refine through follow-up messages or apply the result to populate all form fields.

## External API

- **URL**: `https://www.asigurari.ro/ai-assistant/chat-api/v1/tools/seo/article`
- **Method**: POST
- **Auth**: Static key via `X-SEO-Tool-Key` header
- **Input**: `{ title?, description?, keywords? }` — at least `title` or `description` required
- **Output**: `{ article: { title, summary, meta_description, content_markdown }, keywords, model, usage? }`
- **Expected latency**: 10–30 seconds (LLM generation)
- **Limitation**: Single-turn API — no native conversation support

## Architecture

```
Browser (PostForm + SeoChat panel)
  → POST /api/admin/tools/seo-generate { title, description, keywords }
    → Next.js API route (server)
      → POST external SEO API (with X-SEO-Tool-Key)
      ← markdown response
      → convert content_markdown to HTML via `marked`
      → sanitize HTML via `isomorphic-dompurify`
    ← { article: { title, summary, meta_description, content_html }, keywords }
  → display result in chat panel
  → user clicks "Apply" → populate PostForm fields
```

Server-to-server call means no CORS configuration needed on the external API.

## Server: Proxy Route

**File**: `src/app/api/admin/tools/seo-generate/route.ts`

### Responsibilities

1. Receive `{ title, description, keywords }` from client
2. Validate at least `title` or `description` is present
3. Forward to external API with `X-SEO-Tool-Key` header
4. Convert `content_markdown` → HTML using `marked` (default config with `gfm: true`)
5. Sanitize HTML via `isomorphic-dompurify` to prevent XSS from LLM-generated content
6. Return transformed response to client (drop `model` and `usage` fields — not needed by client)
7. Forward error status codes and messages from external API

### Environment Variables

| Variable | Description |
|----------|-------------|
| `SEO_TOOL_API_URL` | External SEO API URL |
| `SEO_TOOL_STATIC_KEY` | Static authentication key for the SEO API |

Values go in `.env` (not committed). Placeholders go in `.env.example`.

### Response Format (success)

```json
{
  "article": {
    "title": "Ghid CASCO 2026",
    "summary": "Un rezumat...",
    "meta_description": "Meta description SEO...",
    "content_html": "<h1>Ghid CASCO 2026</h1><p>Continutul...</p>"
  },
  "keywords": ["casco", "despagubiri", "asigurare auto"]
}
```

### Error Handling

- Missing title and description: 400 with `{ error: "Title or description is required" }`
- External API errors: forward status code and error body
- Network failure: 500 with `{ error: "Failed to connect to SEO service" }`

## Client: Layout Integration

### Structural Change

The layout split happens **inside PostForm**. PostForm already manages all form state, so it is the natural owner of the chat toggle and the `onApplyArticle` handler.

Current PostForm structure (simplified):
```jsx
<div className="sticky top-0">  {/* action bar */} </div>
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div className="lg:col-span-2"> {/* left: editor, excerpt, SEO */} </div>
  <div className="lg:col-span-1"> {/* right: status, system, category */} </div>
</div>
```

New structure with chat panel:
```jsx
<div className="flex gap-6">
  <div className={seoChatOpen ? "flex-1 min-w-0" : "w-full"}>
    <div className="sticky top-0">  {/* action bar + AI toggle button */} </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2"> {/* left: editor, excerpt, SEO */} </div>
      <div className="lg:col-span-1"> {/* right: status, system, category */} </div>
    </div>
  </div>
  {seoChatOpen && (
    <div className="w-[400px] shrink-0">
      <SeoChat
        currentTitle={form.title}
        currentKeywords={form.seo.metaKeywords}
        isFormDirty={Boolean(form.title || form.contentHtml || form.excerpt)}
        onApplyArticle={handleApplyArticle}
        onClose={() => setSeoChatOpen(false)}
      />
    </div>
  )}
</div>
```

The chat panel is `w-[400px]` fixed width. On screens below `lg` breakpoint, the toggle button is hidden (chat not available on mobile).

## Client: SeoChat Component

**New component**: `src/components/admin/posts/SeoChat.tsx`

### Props Interface

```typescript
interface SeoArticle {
  title: string
  summary: string
  meta_description: string
  content_html: string
}

interface SeoChatProps {
  currentTitle: string
  currentKeywords: string
  isFormDirty: boolean
  onApplyArticle: (article: SeoArticle, keywords: string[]) => void
  onClose: () => void
}
```

### Chat Panel Structure

```
┌─────────────────────────────┐
│  AI Article Generator    [X] │  ← header with close button
├─────────────────────────────┤
│                             │
│  "Describe the article you  │  ← empty state hint
│   want to generate..."      │
│                             │
│  [user message bubble]      │
│                             │
│  [AI response card]         │  ← full article preview
│  [Apply to form] button     │
│                             │
├─────────────────────────────┤
│  [Type your request...]  [→]│  ← input (Enter sends, Shift+Enter newline)
└─────────────────────────────┘
```

### Chat Messages

Two message types:

1. **User message**: right-aligned bubble with the user's text
2. **AI response**: left-aligned card containing:
   - Generated title (bold)
   - Summary text
   - Meta description (muted/small)
   - Content preview (rendered HTML via `dangerouslySetInnerHTML` — safe because HTML is sanitized server-side)
   - Scrollable, max-height ~300px
   - Keywords as badges/chips
   - **"Apply to form"** button at the bottom of the card

Chat auto-scrolls to the latest message when a new response arrives.

### Multi-Turn via Description Enrichment

Since the external API is single-turn, we simulate multi-turn by building up the `description` field from conversation history:

1. **First message**: user types "Write a blog about CASCO for 2026"
   - API call: `{ description: "Write a blog about CASCO for 2026" }`
2. **Second message**: user types "Make it longer and add more about deductibles"
   - API call: `{ description: "Write a blog about CASCO for 2026. Make it longer and add more about deductibles" }`
3. **Third message**: user types "Focus more on young drivers"
   - API call: `{ description: "Write a blog about CASCO for 2026. Make it longer and add more about deductibles. Focus more on young drivers" }`

The chat component concatenates all user messages (joined with ". ") and sends as `description`. The `title` and `keywords` are read from PostForm's current state at send-time via the `currentTitle` and `currentKeywords` props — they are always fresh.

### Chat State

- `messages: Array<{ role: 'user' | 'assistant', content: string, article?: SeoArticle, keywords?: string[] }>`
- `isGenerating: boolean` — loading state
- `error: string | null` — error display inline in chat

State is local to the SeoChat component. Not persisted — cleared on page navigation.

The fetch call uses an `AbortController` with a 60-second timeout. The controller is also aborted on component unmount (cleanup in `useEffect` return) to prevent state updates on unmounted components.

### Apply to Form

When the user clicks "Apply to form" on any AI response card, SeoChat calls `onApplyArticle(article, keywords)`. PostForm's `handleApplyArticle` handler then:

1. Checks if form is dirty: `form.title || form.contentHtml || form.excerpt` (any of these non-empty)
2. If dirty → show AlertDialog confirmation
3. On confirm (or if not dirty), populate via `setForm`:
   - `title` = `article.title`
   - `slug` = `slugify(article.title)` (only in create mode — explicit call, not relying on onChange)
   - `excerpt` = `article.summary`
   - `seo.metaDescription` = `article.meta_description`
   - `seo.metaKeywords` = `keywords.join(', ')`
   - `externalContent` = `article.content_html` (triggers TipTap update, see below)

### Loading State

While generating (10–30s):
- Input field disabled
- Send button shows spinner
- A "Generating..." typing indicator appears in the chat area

## TipTap Integration

The TipTapEditor component currently does not expose its `editor` instance to the parent. To allow PostForm to set content programmatically:

- Add an `externalContent` prop to TipTapEditor (type: `string | null`)
- Inside TipTapEditor, watch `externalContent` via `useEffect`: when it changes (and is not null), call `editor.commands.setContent(externalContent)`
- This triggers TipTap's `onUpdate` callback, which syncs both `content` (JSON) and `contentHtml` to parent form state
- PostForm manages the `externalContent` state: sets it to the HTML string in `handleApplyArticle`, then resets to `null` via a `useEffect` that watches for the change (not from inside TipTapEditor)

## Confirmation Dialog

Uses shadcn `AlertDialog` component (needs to be created from radix — `@radix-ui/react-alert-dialog` is already in package.json):
- Title: "Overwrite content?"
- Body: "This will replace the current title, content, excerpt, and SEO fields with AI-generated content."
- Actions: "Cancel" / "Apply"

AlertDialog is used instead of Dialog because it prevents closing by clicking outside, which is the correct UX for a destructive confirmation.

### Dirty Detection Predicate

The form is considered "dirty" (populated) when **any** of these are non-empty:
- `form.title`
- `form.contentHtml`
- `form.excerpt`

Default values like `system: 'common'` and `status: 'draft'` do NOT count as dirty.

## Visibility

- The SeoChat toggle button appears on both new and edit post pages
- In edit mode, slug is NOT regenerated when applying (matching existing edit behavior)
- In create mode, slug IS generated from `slugify(article.title)`

## Field Mapping

| API Response Field | PostForm Field | Conversion |
|-------------------|----------------|------------|
| `article.title` | Title + slug (create mode: `slugify(title)`, edit mode: unchanged) | Direct string |
| `article.content_html` | TipTap editor content | Via `externalContent` prop → `setContent(html)` → triggers `onUpdate` for JSON sync |
| `article.summary` | Excerpt | Direct string |
| `article.meta_description` | SEO Meta Description | Direct string |
| `keywords` | SEO Keywords | Array joined with `', '` → string |

## Error Handling Summary

| Scenario | Behavior |
|----------|----------|
| Empty chat input | Send button disabled |
| External API returns 4xx/5xx | Error message displayed inline in chat |
| Network failure | Error message in chat: "Failed to connect to SEO service" |
| Timeout (>60s) | AbortController timeout, error message in chat |

## Dependencies

- `marked` — markdown-to-HTML conversion (server-side only, new dependency). Default config with `gfm: true`.
- `isomorphic-dompurify` — HTML sanitization (server-side, new dependency). Sanitizes LLM-generated HTML to prevent XSS.
- `src/components/ui/alert-dialog.tsx` — new shadcn component (radix dependency already exists)
- All other dependencies (lucide-react icons, TipTap) already exist

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/admin/tools/seo-generate/route.ts` | New — proxy route |
| `src/components/admin/posts/SeoChat.tsx` | New — chat panel component |
| `src/components/admin/posts/PostForm.tsx` | Modified — add chat toggle, `seoChatOpen`/`externalContent` state, `handleApplyArticle`, layout wrapper, AlertDialog |
| `src/components/admin/posts/TipTapEditor.tsx` | Modified — add `externalContent` prop |
| `src/components/ui/alert-dialog.tsx` | New — shadcn AlertDialog component |
| `.env.example` | Modified — add SEO_TOOL_API_URL and SEO_TOOL_STATIC_KEY |
| `.env` | Modified — add actual values |
| `package.json` | Modified — add `marked` and `isomorphic-dompurify` |

## Out of Scope

- No persistence of chat history (cleared on page navigation)
- No streaming/SSE — synchronous JSON request
- No integration with NewsForm (can be added later)
- No rate limiting on the proxy (rely on external API's own limits)
- No AI-generated tracking metadata on posts (can be added later)
- No mobile/tablet support for chat panel (hidden below `lg` breakpoint)
