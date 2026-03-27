# SEO Article Generator — Design Spec

## Overview

Integrate an external SEO article generation endpoint into the CMS "New Post" form. A "Generate with AI" button on the PostForm calls a server-side proxy, which forwards the request to the external API, converts the markdown response to HTML, and returns it. The PostForm then auto-populates all relevant fields.

## External API

- **URL**: `https://www.asigurari.ro/ai-assistant/chat-api/v1/tools/seo/article`
- **Method**: POST
- **Auth**: Static key via `X-SEO-Tool-Key` header
- **Input**: `{ title?, description?, keywords? }` — at least `title` or `description` required
- **Output**: `{ article: { title, summary, meta_description, content_markdown }, keywords, model, usage? }`

## Architecture

```
Browser (PostForm)
  → POST /api/admin/tools/seo-generate { title, description, keywords }
    → Next.js API route (server)
      → POST external SEO API (with X-SEO-Tool-Key)
      ← markdown response
      → convert content_markdown to HTML via `marked`
    ← { article: { title, summary, meta_description, content_html }, keywords }
  → populate PostForm fields
```

Server-to-server call means no CORS configuration needed on the external API.

## Server: Proxy Route

**File**: `src/app/api/admin/tools/seo-generate/route.ts`

### Responsibilities

1. Receive `{ title, description, keywords }` from client
2. Validate at least `title` or `description` is present
3. Forward to external API with `X-SEO-Tool-Key` header
4. Convert `content_markdown` → HTML using `marked`
5. Return transformed response to client
6. Forward error status codes and messages from external API

### Environment Variables

| Variable | Value |
|----------|-------|
| `SEO_TOOL_API_URL` | `https://www.asigurari.ro/ai-assistant/chat-api/v1/tools/seo/article` |
| `SEO_TOOL_STATIC_KEY` | `py94HJrud(@?D!^N` |

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

## Client: PostForm Changes

**File**: `src/components/admin/posts/PostForm.tsx`

### Button

- Location: sticky top action bar, alongside existing controls
- Label: "Generate with AI"
- Icon: sparkle or wand icon (from lucide-react)
- Loading state: spinner + "Generating..." text
- Disabled when: no title and no excerpt filled in

### Generation Flow

1. User fills in title and/or excerpt and/or SEO keywords
2. Clicks "Generate with AI"
3. If any content fields are already populated → confirmation dialog appears
4. On confirm → POST to `/api/admin/tools/seo-generate`:
   - `title` from title field
   - `description` from excerpt field
   - `keywords` from SEO keywords field
5. On success, populate fields:
   - `article.title` → Title input + auto-generate slug
   - `article.content_html` → TipTap editor via `editor.commands.setContent(html)`
   - `article.summary` → Excerpt textarea
   - `article.meta_description` → SEO Meta Description input
   - `keywords` → SEO Keywords field
6. On error → toast notification with error message

### Confirmation Dialog

Uses existing shadcn `Dialog` component:
- Title: "Overwrite content?"
- Body: "This will replace the current title, content, excerpt, and SEO fields with AI-generated content."
- Actions: "Cancel" / "Generate"

## Field Mapping

| API Response Field | PostForm Field |
|-------------------|----------------|
| `article.title` | Title + slug generation |
| `article.content_html` | TipTap editor content |
| `article.summary` | Excerpt |
| `article.meta_description` | SEO Meta Description |
| `keywords` | SEO Keywords |

## Error Handling Summary

| Scenario | Behavior |
|----------|----------|
| No title or description filled in | Button disabled or toast "Enter a title or description first" |
| External API returns 4xx/5xx | Toast with error message from response |
| Network failure | Toast "Failed to connect to SEO service" |
| Timeout (>60s) | AbortController timeout, toast notification |

## Dependencies

- `marked` — markdown-to-HTML conversion (server-side only, new dependency)
- All other dependencies (shadcn Dialog, lucide-react icons, TipTap) already exist

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/admin/tools/seo-generate/route.ts` | New — proxy route |
| `src/components/admin/posts/PostForm.tsx` | Modified — add generate button, dialog, population logic |
| `.env.example` | Modified — add SEO_TOOL_API_URL and SEO_TOOL_STATIC_KEY |
| `.env` | Modified — add actual values |
| `package.json` | Modified — add `marked` dependency |

## Out of Scope

- No persistence of generated articles (the external API doesn't save either)
- No streaming/SSE — synchronous JSON request
- No integration with NewsForm (can be added later if needed)
- No history of generated articles
- No rate limiting on the proxy (rely on external API's own limits)
