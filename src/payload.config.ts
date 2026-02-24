import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { seoPlugin } from '@payloadcms/plugin-seo'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { BlogCategories } from './collections/BlogCategories'
import { BlogComments } from './collections/BlogComments'
import { BlogPosts } from './collections/BlogPosts'
import { BlogTags } from './collections/BlogTags'
import { Media } from './collections/Media'
import { News } from './collections/News'
import { NewsletterSubscribers } from './collections/NewsletterSubscribers'
import { Users } from './collections/Users'
import { previewEndpoint } from './endpoints/preview'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  // ── Admin ──────────────────────────────────────────────────
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— WIB CMS',
    },
    importMap: {
      baseDir: path.resolve(dirname, 'app/(payload)'),
    },
  },

  // ── Collections ────────────────────────────────────────────
  collections: [
    Users,
    Media,
    BlogPosts,
    BlogCategories,
    BlogTags,
    BlogComments,
    NewsletterSubscribers,
    News,
  ],

  // ── Editor ─────────────────────────────────────────────────
  editor: lexicalEditor(),

  // ── Database ───────────────────────────────────────────────
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || 'mongodb://192.168.0.31:27017/wib_test',
  }),

  // ── Secret ─────────────────────────────────────────────────
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-change-in-production',

  // ── TypeScript ─────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // ── Plugins ────────────────────────────────────────────────
  plugins: [
    seoPlugin({
      collections: ['blog-posts', 'news'],
      generateTitle: ({ doc }) => `${doc.title} | Asigurari.ro`,
      generateDescription: ({ doc }) => doc.excerpt || '',
      generateURL: ({ doc, collectionSlug }) => {
        const base = process.env.SITE_URL || 'https://www.asigurari.ro'
        if (collectionSlug === 'blog-posts') return `${base}/blog/${doc.slug}`
        if (collectionSlug === 'news') return `${base}/stiri/${doc.slug}`
        return base
      },
      uploadsCollection: 'media',
    }),
  ],

  // ── CORS ───────────────────────────────────────────────────
  cors: [
    process.env.CORS_ORIGIN || 'https://www.asigurari.ro',
    'http://localhost:3000',
    'http://localhost:8056',
  ],

  // ── CSRF ───────────────────────────────────────────────────
  csrf: [
    process.env.CORS_ORIGIN || 'https://www.asigurari.ro',
    'http://localhost:3000',
  ],

  // ── Upload ─────────────────────────────────────────────────
  upload: {
    limits: {
      fileSize: 10_000_000, // 10MB
    },
  },

  // ── Custom Endpoints ───────────────────────────────────────
  endpoints: [previewEndpoint],

  // ── Server URL ─────────────────────────────────────────────
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',

  // ── Sharp (image processing) ───────────────────────────────
  sharp,
})
