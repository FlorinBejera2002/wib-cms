# WIB CMS

Custom Blog CMS for asigurari.ro — **Next.js 15 + Mongoose 6.x + TipTap + shadcn/ui**

## Architecture

```
WIB CMS (Next.js 15, port 3000)
    ├── Admin Panel (/admin/*) — shadcn/ui + TipTap editor
    ├── Admin API (/api/admin/*) — authenticated CRUD
    ├── Public API (/api/v1/*) — CORS-enabled, read-only
    └── MongoDB (192.168.0.31:27017/wib_test) ← shared with Symfony
              └── Symfony frontend reads via Public API

n8n webhooks ← triggered on post.published event
```

## Stack

| Component | Version |
|---|---|
| Next.js | 15.x |
| Mongoose | 6.x (MongoDB 3.6 compatible) |
| NextAuth.js | v5 (beta) |
| TipTap | 2.x |
| Tailwind CSS | 3.x + shadcn/ui |
| Node.js | 22.x |
| MongoDB | existing (192.168.0.31) |

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env
# Edit .env — set NEXTAUTH_SECRET, ADMIN_PASSWORD

# 2. Install dependencies
npm install

# 3. Seed admin user
npm run seed

# 4. Run in development
npm run dev

# 5. Open admin panel
# URL: http://localhost:3000/admin
# Email: admin@asigurari.ro
# Password: (from .env)
```

## Public REST API (for Symfony frontend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/posts` | GET | List published posts (paginated) |
| `/api/v1/posts?slug=...` | GET | Get single post by slug |
| `/api/v1/posts?system=rca` | GET | Filter by insurance system |
| `/api/v1/posts?search=...` | GET | Full-text search |
| `/api/v1/categories` | GET | All categories |
| `/api/v1/tags` | GET | All tags |
| `/api/v1/subscribers` | POST | Subscribe to newsletter |
| `/api/v1/preview?slug=...&token=...` | GET | Preview draft posts |

## MongoDB Collections

| Collection | Description |
|------------|-------------|
| `blog_posts` | Blog articles (TipTap JSON + HTML, SEO, stats) |
| `blog_categories` | Hierarchical categories |
| `blog_tags` | Article tags |
| `blog_comments` | User comments (moderated) |
| `cms_users` | CMS admin users |
| `cms_media` | Uploaded media files |
| `newsletter_subscribers` | Email subscribers |

## Roles & Permissions

| Permission | Admin | Editor | Author |
|------------|-------|--------|--------|
| Create posts | ✅ | ✅ | ✅ |
| Edit own posts | ✅ | ✅ | ✅ |
| Edit any posts | ✅ | ✅ | ❌ |
| Publish posts | ✅ | ✅ | ❌ |
| Delete posts | ✅ | ✅ | ❌ |
| Manage categories/tags | ✅ | ✅ | ❌ |
| Moderate comments | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |

## Admin Pages

- **Dashboard** — Stats overview, recent posts
- **Articole** — Post list with filters, TipTap editor with SEO & OG fields
- **Categorii** — CRUD categories
- **Tag-uri** — CRUD tags
- **Comentarii** — Moderate comments (approve/spam/delete)
- **Media** — Upload and manage images
- **Utilizatori** — User management (admin only)
- **Abonați** — Newsletter subscribers + CSV export

## Deployment

- **Build:** `npm install && npm run build`
- **Start:** `node server.js`
- **Node:** 22.x
- **Port:** 3000
