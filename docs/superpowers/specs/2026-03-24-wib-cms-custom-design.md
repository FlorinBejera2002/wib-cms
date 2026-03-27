# WIB CMS - Custom Blog CMS Design Spec

## Overview

A custom full-stack blog CMS built with Next.js 15, Mongoose 6.x, TipTap editor, and shadcn/ui. Connects directly to an existing MongoDB 3.6 server at `192.168.0.31:27017/wib_test` with existing blog post data.

Replaces the previous Payload CMS setup which was incompatible with MongoDB 3.6.

## Constraints

- **MongoDB 3.6** (wire version 6) on remote server `192.168.0.31:27017` - cannot be upgraded
- **Mongoose 6.x** (last major version with full MongoDB 3.6 support)
- Must work with **existing data** in `wib_test` database (blog_posts collection with ~7+ documents)
- Public REST API consumed by **Symfony frontend** at asigurari.ro

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js | 15.x |
| Runtime | Node.js | 22+ |
| Database ODM | Mongoose | ^6.13.0 (pinned for MongoDB 3.6) |
| Auth | NextAuth.js | v5 (Auth.js) |
| Rich Text Editor | TipTap | latest |
| UI Components | shadcn/ui + Tailwind CSS | latest |
| Image Processing | sharp | ^0.33.0 |

## Architecture

```
src/
  app/
    (admin)/                  # Admin panel (protected routes)
      admin/
        layout.tsx            # Admin layout with sidebar nav
        page.tsx              # Dashboard with stats overview
        posts/
          page.tsx            # Blog posts list (data table)
          new/page.tsx        # Create new post
          [id]/edit/page.tsx  # Edit post
        categories/
          page.tsx            # Categories CRUD
        tags/
          page.tsx            # Tags CRUD
        comments/
          page.tsx            # Comments moderation
        media/
          page.tsx            # Media library
        users/
          page.tsx            # User management
        subscribers/
          page.tsx            # Newsletter subscribers
        settings/
          page.tsx            # CMS settings
    api/
      v1/                     # Public REST API for Symfony frontend
        posts/route.ts        # GET /api/v1/posts, GET /api/v1/posts/:slug
        categories/route.ts
        tags/route.ts
        preview/route.ts      # Preview endpoint
      admin/                  # Admin API routes (protected)
        posts/route.ts        # CRUD operations
        upload/route.ts       # Media upload
        webhooks/route.ts     # Webhook management
      auth/[...nextauth]/     # NextAuth routes
  lib/
    db/
      connection.ts           # Mongoose connection singleton
      models/
        BlogPost.ts           # Mongoose schema matching existing data
        BlogCategory.ts
        BlogTag.ts
        BlogComment.ts
        User.ts
        Media.ts
        NewsletterSubscriber.ts
    auth/
      config.ts               # NextAuth configuration
      rbac.ts                 # Role-based access helpers
    hooks/
      useDebounce.ts
      usePagination.ts
    utils/
      slugify.ts
      reading-time.ts
      webhook.ts              # Webhook/n8n trigger utility
  components/
    admin/
      layout/
        Sidebar.tsx
        Header.tsx
        Breadcrumbs.tsx
      posts/
        PostForm.tsx           # Main post editing form
        PostTable.tsx          # Data table with filters
        TipTapEditor.tsx       # Rich text editor component
        ContentBlocks.tsx      # Block editor for structured content
        SeoFields.tsx          # SEO metadata fields
        SocialFields.tsx       # OG fields
      categories/
        CategoryForm.tsx
        CategoryTable.tsx
      tags/
        TagForm.tsx
        TagTable.tsx
      comments/
        CommentTable.tsx
        CommentModeration.tsx
      media/
        MediaLibrary.tsx
        MediaUpload.tsx
      dashboard/
        StatsCards.tsx
        RecentPosts.tsx
        QuickActions.tsx
      shared/
        DataTable.tsx          # Reusable data table (shadcn)
        ConfirmDialog.tsx
        StatusBadge.tsx
        Pagination.tsx
    ui/                        # shadcn/ui components (auto-generated)
```

## Data Models

### BlogPost (maps to existing `blog_posts` collection)

```typescript
{
  _id: ObjectId,
  title: string,              // required
  slug: string,               // required, unique
  system: enum,               // rca, casco, travel, home, common, health, life, accidents, breakdown, cmr, malpraxis
  status: enum,               // draft, pending_review, published, archived
  content: object,            // TipTap JSON content
  contentHtml: string,        // Rendered HTML (for legacy/Symfony consumption)
  excerpt: string,
  introText: string,
  conclusion: string,
  contentBlocks: array,       // Structured content blocks (legacy)
  tocItems: array,            // Table of contents
  featuredImageUrl: string,   // Legacy image URL
  featuredImageAlt: string,
  author: ObjectId,           // ref: User
  authorDisplayName: string,
  category: ObjectId,         // ref: BlogCategory
  tags: [ObjectId],           // ref: BlogTag
  readingTime: number,
  seo: {
    metaTitle: string,
    metaDescription: string,
    metaKeywords: string,
    canonicalUrl: string,
  },
  social: {
    ogTitle: string,
    ogDescription: string,
    ogImage: string,
    socialPosted: object,     // tracks which platforms received this post
  },
  stats: {
    views: number,
    likes: number,
    shares: number,
    comments: number,
  },
  commentsEnabled: boolean,
  version: number,
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

### User

```typescript
{
  _id: ObjectId,
  email: string,              // unique
  name: string,
  password: string,           // bcrypt hashed
  role: enum,                 // admin, editor, author
  avatar: string,
  isActive: boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date,
}
```

### BlogCategory

```typescript
{
  _id: ObjectId,
  name: string,
  slug: string,               // unique
  description: string,
  parent: ObjectId,           // self-reference for hierarchy
  order: number,
  createdAt: Date,
  updatedAt: Date,
}
```

### BlogTag

```typescript
{
  _id: ObjectId,
  name: string,
  slug: string,               // unique
  createdAt: Date,
  updatedAt: Date,
}
```

### BlogComment

```typescript
{
  _id: ObjectId,
  post: ObjectId,             // ref: BlogPost
  author: {
    name: string,
    email: string,
  },
  content: string,
  status: enum,               // pending, approved, spam, deleted
  parentComment: ObjectId,    // self-reference for threading
  createdAt: Date,
  updatedAt: Date,
}
```

### Media

```typescript
{
  _id: ObjectId,
  filename: string,
  url: string,
  mimeType: string,
  size: number,
  alt: string,
  uploadedBy: ObjectId,       // ref: User
  createdAt: Date,
}
```

### NewsletterSubscriber

```typescript
{
  _id: ObjectId,
  email: string,              // unique
  name: string,
  status: enum,               // active, unsubscribed
  subscribedAt: Date,
  unsubscribedAt: Date,
}
```

## Authentication & RBAC

### Auth Flow
- NextAuth.js v5 with Credentials provider (email + password)
- JWT strategy (stateless, no session collection needed in MongoDB)
- Passwords hashed with bcrypt

### Roles

| Permission | Admin | Editor | Author |
|-----------|-------|--------|--------|
| Create posts | Yes | Yes | Yes |
| Edit own posts | Yes | Yes | Yes |
| Edit any posts | Yes | Yes | No |
| Delete posts | Yes | Yes | No |
| Publish posts | Yes | Yes | No |
| Manage categories/tags | Yes | Yes | No |
| Moderate comments | Yes | Yes | No |
| Manage users | Yes | No | No |
| Manage settings | Yes | No | No |
| View dashboard | Yes | Yes | Yes |

## Public REST API (for Symfony frontend)

All public endpoints are read-only and return only published content.

```
GET /api/v1/posts                 # List published posts (paginated, filterable)
  ?page=1&limit=10
  &system=rca
  &category=slug
  &tag=slug
  &search=keyword
  &sort=publishedAt

GET /api/v1/posts/:slug           # Single post by slug

GET /api/v1/categories            # List categories
GET /api/v1/tags                  # List tags

GET /api/v1/preview/:slug?token=  # Preview unpublished post (with secret token)
```

### API Authentication
- Public endpoints: no auth required (read-only published content)
- Admin endpoints: JWT bearer token from NextAuth session
- Preview endpoint: secret token validation

## Webhook / n8n Integration

On post publish, fire a webhook to configured URLs:

```typescript
{
  event: 'post.published',
  data: {
    id: string,
    title: string,
    slug: string,
    url: string,
    excerpt: string,
    system: string,
    publishedAt: string,
  }
}
```

Webhook URLs configurable via admin settings. Used for:
- n8n automation (social media posting)
- Cache invalidation on asigurari.ro
- Newsletter trigger

## Editor (TipTap)

### Features
- Headings (H2-H4)
- Bold, italic, underline, strikethrough
- Bullet lists, ordered lists
- Blockquotes
- Code blocks
- Links
- Images (insert from URL or media library)
- Tables
- Horizontal rule
- Undo/redo

### Content Storage
- Stored as TipTap JSON in `content` field
- HTML rendered on save to `contentHtml` field (for Symfony frontend consumption)
- Auto-generate `tocItems` from headings
- Auto-calculate `readingTime` from content

## Migration Strategy

### Phase 1: Connect to existing data
- Mongoose models map directly to existing MongoDB collections
- Field names use camelCase in code but map to existing field names in DB via `collection` option
- No data migration needed - read existing data as-is

### Phase 2: Gradual enhancement
- New posts created through CMS use TipTap JSON in `content` field
- Legacy posts keep `contentHtml` field (the CMS renders both)
- Optional: script to convert legacy `contentHtml` to TipTap JSON

## Non-Goals (out of scope)

- Multi-language support
- Revision history / version diffing
- Real-time collaborative editing
- Full-text search (use MongoDB text indexes)
- Email sending (handled by n8n)
- Image processing/resizing (use external CDN or sharp on upload)
