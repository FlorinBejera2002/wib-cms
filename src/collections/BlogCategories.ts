import type { CollectionConfig } from 'payload'

export const BlogCategories: CollectionConfig = {
  slug: 'blog-categories',
  labels: {
    singular: 'Blog Category',
    plural: 'Blog Categories',
  },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', 'system_key', 'sort'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Name',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (auto-generated from name if empty)',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            if (!value && data?.name) {
              return data.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
            }
            return value
          },
        ],
      },
    },
    {
      name: 'system_key',
      type: 'select',
      label: 'System Key',
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
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'icon',
      type: 'text',
      label: 'Icon (CSS class or emoji)',
    },
    {
      name: 'sort',
      type: 'number',
      label: 'Sort Order',
      defaultValue: 0,
    },
  ],
}
