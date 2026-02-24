import type { CollectionConfig } from 'payload'
import { afterPublishHook } from '../hooks/afterPublishHook'

export const BlogPosts: CollectionConfig = {
  slug: 'blog-posts',
  labels: {
    singular: 'Blog Post',
    plural: 'Blog Posts',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'system', 'category', 'published_at'],
    listSearchableFields: ['title', 'slug', 'excerpt'],
    preview: (doc) => {
      if (!doc?.slug) return null
      const secret = process.env.PREVIEW_SECRET || 'ee4016c8434b8bfac95a92cb7cc44bb9'
      const siteUrl = process.env.SITE_URL || 'https://www.asigurari.ro'
      return `${siteUrl}/blog/${doc.slug}?preview=true&token=${secret}`
    },
  },
  hooks: {
    afterChange: [afterPublishHook],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 5000,
      },
    },
  },
  access: {
    // Public can read published posts
    read: ({ req }) => {
      if (req.user) return true
      return {
        status: {
          equals: 'published',
        },
      }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => {
      if (!req.user) return false
      return req.user.role === 'admin' || req.user.role === 'editor'
    },
  },
  fields: [
    // ── Core ──────────────────────────────────────────────────
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from title)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.title) {
              return data.title
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'system',
      type: 'select',
      label: 'Insurance System',
      required: true,
      defaultValue: 'common',
      options: [
        { label: 'RCA', value: 'rca' },
        { label: 'Casco', value: 'casco' },
        { label: 'Travel', value: 'travel' },
        { label: 'Home', value: 'home' },
        { label: 'Common', value: 'common' },
        { label: 'Health', value: 'health' },
        { label: 'Life', value: 'life' },
        { label: 'Accidents', value: 'accidents' },
        { label: 'Breakdown', value: 'breakdown' },
        { label: 'CMR', value: 'cmr' },
        { label: 'Malpraxis', value: 'malpraxis' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Pending Review', value: 'pending_review' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Content',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Excerpt',
      admin: {
        description: 'Short description for listings and SEO',
      },
    },
    {
      name: 'intro_text',
      type: 'textarea',
      label: 'Intro Text',
    },
    {
      name: 'conclusion',
      type: 'textarea',
      label: 'Conclusion',
    },

    // ── Images ────────────────────────────────────────────────
    {
      name: 'featured_image',
      type: 'upload',
      label: 'Featured Image',
      relationTo: 'media',
    },
    {
      name: 'featured_image_alt',
      type: 'text',
      label: 'Featured Image Alt Text',
    },
    {
      name: 'featured_image_url',
      type: 'text',
      label: 'Featured Image URL (legacy)',
      admin: {
        description: 'For articles imported from old system',
      },
    },

    // ── Structured ────────────────────────────────────────────
    {
      name: 'toc_items',
      type: 'json',
      label: 'Table of Contents',
      admin: {
        description: 'Auto-generated TOC items (JSON)',
      },
    },
    {
      name: 'content_sections',
      type: 'json',
      label: 'Content Sections',
      admin: {
        description: 'Structured content blocks (JSON)',
      },
    },

    // ── Metadata ──────────────────────────────────────────────
    {
      name: 'author',
      type: 'relationship',
      label: 'Author',
      relationTo: 'users',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'author_display_name',
      type: 'text',
      label: 'Author Display Name',
      admin: {
        description: 'Override author name displayed publicly',
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      label: 'Category',
      relationTo: 'blog-categories',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      label: 'Tags',
      relationTo: 'blog-tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'published_at',
      type: 'date',
      label: 'Published At',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'reading_time',
      type: 'number',
      label: 'Reading Time (minutes)',
      admin: {
        position: 'sidebar',
        description: 'Auto-calculated',
        readOnly: true,
      },
    },

    // ── Social ────────────────────────────────────────────────
    {
      name: 'og_title',
      type: 'text',
      label: 'OG Title',
      admin: {
        description: 'Open Graph title (for social sharing)',
      },
    },
    {
      name: 'og_description',
      type: 'textarea',
      label: 'OG Description',
    },
    {
      name: 'og_image',
      type: 'upload',
      label: 'OG Image',
      relationTo: 'media',
    },
    {
      name: 'social_posted',
      type: 'json',
      label: 'Social Posted',
      admin: {
        description: 'Tracks which social platforms received this post',
        readOnly: true,
      },
    },

    // ── Stats ─────────────────────────────────────────────────
    {
      name: 'stats_views',
      type: 'number',
      label: 'Views',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'stats_likes',
      type: 'number',
      label: 'Likes',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'stats_shares',
      type: 'number',
      label: 'Shares',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },
    {
      name: 'stats_comments',
      type: 'number',
      label: 'Comments',
      defaultValue: 0,
      admin: {
        position: 'sidebar',
        readOnly: true,
      },
    },

    // ── Internal ──────────────────────────────────────────────
    {
      name: 'version',
      type: 'number',
      label: 'Version',
      defaultValue: 1,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'mongo_id',
      type: 'text',
      label: 'Legacy Mongo ID',
      admin: {
        hidden: true,
        description: 'Original MongoDB _id from Directus sync',
      },
    },
  ],
}
