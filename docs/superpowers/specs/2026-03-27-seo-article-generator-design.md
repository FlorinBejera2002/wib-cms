# SEO Article Generator — Design Spec

## Overview

Integrate an external SEO article generation endpoint into the CMS "New Post" form. A "Generate with AI" button on the PostForm calls a server-side proxy, which forwards the request to the external API, converts the markdown response to HTML, and returns it. The PostForm then auto-populates all relevant fields.

## External API

- **URL**: `https://www.asigurari.ro/ai-assistant/chat-api/v1/tools/seo/article`
- **Method**: POST
- **Auth**: Static key via `X-SEO-Tool-Key` header
- **Input**: `{ title?, description?, keywords? }` — at least `title` or `description` required
- **Output**: `{ article: { title, summary, meta_description, content_markdown }, keywords, model, usage? }`
- **Expected latency**: 10–30 seconds (LLM generation)

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
4. Convert `content_markdown` → HTML using `marked` (default config with `gfm: true`)
5. Return transformed response to client (drop `model` and `usage` fields — not needed by client)
6. Forward error status codes and messages from external API

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

## Client: PostForm Changes

**File**: `src/components/admin/posts/PostForm.tsx`

### Button

- Location: sticky top action bar, alongside existing controls
- Label: "Generate with AI"
- Icon: sparkle or wand icon (from lucide-react)
- Loading state: spinner + "Generating..." text
- Disabled when both title and excerpt are empty (at least one must be filled)

### Generation Flow

1. User fills in title and/or excerpt and/or SEO keywords
2. Clicks "Generate with AI"
3. If any content fields are already populated → confirmation dialog appears
4. On confirm → POST to `/api/admin/tools/seo-generate`:
   - `title` from title field
   - `description` from excerpt field
   - `keywords` from SEO keywords field, split by comma: `value.split(',').map(s => s.trim()).filter(Boolean)`
5. On success, populate fields:
   - `article.title` → Title input + auto-generate slug (only in create mode, matching existing `handleTitleChange` behavior)
   - `article.content_html` → TipTap editor (see "TipTap Integration" below)
   - `article.summary` → Excerpt textarea
   - `article.meta_description` → SEO Meta Description input
   - `keywords` → SEO Keywords field, joined as string: `keywords.join(', ')`
6. On error → inline error banner using existing `setError()` + `AlertCircle` pattern (same as current form errors)

### TipTap Integration

The TipTapEditor component currently does not expose its `editor` instance to the parent. To allow PostForm to set content programmatically:

- Add an `externalContent` prop to TipTapEditor (type: `string | null`)
- Inside TipTapEditor, watch `externalContent` via `useEffect`: when it changes (and is not null), call `editor.commands.setContent(externalContent)`
- This will trigger TipTap's `onUpdate` callback, which already syncs both `content` (JSON) and `contentHtml` to the parent form state
- After calling `setContent`, reset `externalContent` to null to allow future updates

### Confirmation Dialog

Uses shadcn `AlertDialog` component (needs to be created from radix — `@radix-ui/react-alert-dialog` is already in package.json):
- Title: "Overwrite content?"
- Body: "This will replace the current title, content, excerpt, and SEO fields with AI-generated content."
- Actions: "Cancel" / "Generate"

AlertDialog is used instead of Dialog because it prevents closing by clicking outside, which is the correct UX for a destructive confirmation.

## Field Mapping

| API Response Field | PostForm Field | Conversion |
|-------------------|----------------|------------|
| `article.title` | Title + slug generation (create mode only) | Direct string |
| `article.content_html` | TipTap editor content | Via `externalContent` prop → `setContent(html)` → triggers `onUpdate` for JSON sync |
| `article.summary` | Excerpt | Direct string |
| `article.meta_description` | SEO Meta Description | Direct string |
| `keywords` | SEO Keywords | Array joined with `', '` → string |

## Error Handling Summary

| Scenario | Behavior |
|----------|----------|
| Both title and excerpt empty | Button disabled |
| External API returns 4xx/5xx | Inline error banner via `setError()` |
| Network failure | Inline error banner: "Failed to connect to SEO service" |
| Timeout (>60s) | AbortController timeout, inline error banner |

## Dependencies

- `marked` — markdown-to-HTML conversion (server-side only, new dependency). Default config with `gfm: true`. No sanitization needed since content comes from a trusted internal API.
- `src/components/ui/alert-dialog.tsx` — new shadcn component (radix dependency already exists)
- All other dependencies (lucide-react icons, TipTap) already exist

## Files Changed

| File | Change |
|------|--------|
| `src/app/api/admin/tools/seo-generate/route.ts` | New — proxy route |
| `src/components/admin/posts/PostForm.tsx` | Modified — add generate button, dialog, population logic |
| `src/components/admin/posts/TipTapEditor.tsx` | Modified — add `externalContent` prop |
| `src/components/ui/alert-dialog.tsx` | New — shadcn AlertDialog component |
| `.env.example` | Modified — add SEO_TOOL_API_URL and SEO_TOOL_STATIC_KEY |
| `.env` | Modified — add actual values |
| `package.json` | Modified — add `marked` dependency |

## Out of Scope

- No persistence of generated articles (the external API doesn't save either)
- No streaming/SSE — synchronous JSON request
- No integration with NewsForm (can be added later if needed)
- No history of generated articles
- No rate limiting on the proxy (rely on external API's own limits)
- No AI-generated tracking metadata on posts (can be added later)
