# WIB Payload CMS

Blog & Content Management System for asigurari.ro — **Payload CMS 3.x + MongoDB**

## Architecture

```
Payload CMS (Next.js 15, port 3000)
    └── MongoDB (192.168.0.31:27017/wib_test) ← DIRECT, no sync layer
              └── Symfony frontend reads directly

n8n (port 5678) ← triggered via afterChange hook
nginx preview (port 8056) ← unchanged
```

## Stack

| Component | Version |
|---|---|
| Payload CMS | 3.x |
| Next.js | 15.x |
| @payloadcms/db-mongodb | 3.x |
| @payloadcms/plugin-seo | 3.x |
| Node.js | 22.x |
| MongoDB | existing (192.168.0.31) |

## Quick Start

```bash
# 1. Copy environment file
cp .env.example .env
# Edit .env — set PAYLOAD_SECRET, ADMIN_PASSWORD, OPENAI_API_KEY

# 2. Install dependencies
npm install

# 3. Run in development
npm run dev

# 4. Open admin panel
# URL: http://localhost:3000/admin
# Email: admin@asigurari.ro
# Password: (from .env)

# 5. (Optional) Run data migration from old Directus format
npm run migrate
```

## Services

| Service | URL | Description |
|---------|-----|-------------|
| Payload CMS | http://localhost:3000 | CMS Admin Panel + API |
| n8n | http://localhost:5678 | Automation Workflows |
| Preview | http://localhost:8056 | Article preview (nginx SPA) |

## API Endpoints

- `GET /api/blog-posts` — All posts (public: only published)
- `GET /api/blog-posts?where[status][equals]=published` — Published posts
- `GET /api/blog-categories` — All categories
- `GET /api/blog-tags` — All tags
- `GET /api/news` — All news (public: only published)
- `GET /api/preview/:id?token=<secret>` — Preview endpoint (HTML)
- `POST /api/users/login` — Admin login
- `GET /api/graphql` — GraphQL endpoint

## Collections

- `blog-posts` — Blog articles (34 fields + SEO + AI)
- `blog-categories` — 11 insurance categories
- `blog-tags` — Article tags (M2M)
- `blog-comments` — User comments (with threading)
- `newsletter-subscribers` — Email subscribers
- `news` — Breaking news articles
- `media` — File uploads

## Roles

- **Admin** — Full access to everything
- **Editor** — Full CRUD on all content, can publish
- **Contributor** — Create drafts only, read own posts

## Plugins

- **@payloadcms/plugin-seo** — Auto-generate meta tags, SERP preview
- **payload-ai** (optional) — AI content generation, rewriting, images

## Deployment (Render.com)

- **Build Command:** `npm install && npm run build`
- **Start Command:** `node server.js`
- **Node Version:** 22
- **Port:** 3000
- See `RENDER_ENV_VARS.txt` for required environment variables

## Data Migration

```bash
# Migrate from old Directus/mongo-sync format to Payload format
npm run migrate

# Field mappings: contentHtml→content, featuredImageUrl→featured_image_url,
# authorDisplayName→author_display_name, introText→intro_text,
# readingTime→reading_time, publishedAt→published_at
```
