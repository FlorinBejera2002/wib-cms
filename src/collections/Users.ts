import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  labels: {
    singular: 'User',
    plural: 'Users',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === 'admin',
    update: ({ req, id }) => {
      if (!req.user) return false
      if (req.user.role === 'admin') return true
      // Users can update their own profile
      return req.user.id === id
    },
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      label: 'First Name',
    },
    {
      name: 'lastName',
      type: 'text',
      label: 'Last Name',
    },
    {
      name: 'role',
      type: 'select',
      label: 'Role',
      required: true,
      defaultValue: 'contributor',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Contributor', value: 'contributor' },
      ],
      admin: {
        position: 'sidebar',
      },
      // Prevent non-admins from promoting themselves
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      label: 'Avatar',
      relationTo: 'media',
    },
    {
      name: 'bio',
      type: 'textarea',
      label: 'Bio',
    },
  ],
}
