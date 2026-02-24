import type { CollectionConfig } from 'payload'

export const NewsletterSubscribers: CollectionConfig = {
  slug: 'newsletter-subscribers',
  labels: {
    singular: 'Newsletter Subscriber',
    plural: 'Newsletter Subscribers',
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'confirmed', 'subscribed_at'],
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => true, // Public can subscribe
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'email',
      type: 'email',
      label: 'Email',
      required: true,
      unique: true,
    },
    {
      name: 'name',
      type: 'text',
      label: 'Name',
    },
    {
      name: 'confirmed',
      type: 'checkbox',
      label: 'Email Confirmed',
      defaultValue: false,
    },
    {
      name: 'subscribed_at',
      type: 'date',
      label: 'Subscribed At',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'unsubscribed_at',
      type: 'date',
      label: 'Unsubscribed At',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
