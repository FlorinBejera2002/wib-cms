import type { CollectionConfig } from 'payload'
import { afterPublishHook } from '../hooks/afterPublishHook'

export const News: CollectionConfig = {
  slug: 'news',
  labels: {
    singular: 'News Article',
    plural: 'News Articles',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'category', 'is_breaking', 'published_at'],
    listSearchableFields: ['title', 'slug', 'excerpt'],
  },
  hooks: {
    afterChange: [afterPublishHook],
  },
  access: {
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
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
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
      name: 'excerpt',
      type: 'textarea',
      label: 'Excerpt',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Content',
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
      name: 'featured_image_url',
      type: 'text',
      label: 'Featured Image URL',
    },
    {
      name: 'author_name',
      type: 'text',
      label: 'Author Name',
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
      name: 'is_breaking',
      type: 'checkbox',
      label: 'Breaking News',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'source_url',
      type: 'text',
      label: 'Source URL',
    },
    {
      name: 'source_name',
      type: 'text',
      label: 'Source Name',
    },
  ],
}
