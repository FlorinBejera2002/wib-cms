import type { CollectionConfig } from 'payload'

export const BlogComments: CollectionConfig = {
  slug: 'blog-comments',
  labels: {
    singular: 'Blog Comment',
    plural: 'Blog Comments',
  },
  admin: {
    useAsTitle: 'author_name',
    defaultColumns: ['author_name', 'post', 'status', 'createdAt'],
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      // Public can only read approved comments
      return {
        status: {
          equals: 'approved',
        },
      }
    },
    create: () => true, // Public can submit comments
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'post',
      type: 'relationship',
      label: 'Blog Post',
      relationTo: 'blog-posts',
      required: true,
    },
    {
      name: 'author_name',
      type: 'text',
      label: 'Author Name',
      required: true,
    },
    {
      name: 'author_email',
      type: 'email',
      label: 'Author Email',
      required: true,
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Content',
      required: true,
    },
    {
      name: 'status',
      type: 'select',
      label: 'Status',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Spam', value: 'spam' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'parent_comment',
      type: 'relationship',
      label: 'Parent Comment (reply to)',
      relationTo: 'blog-comments',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
