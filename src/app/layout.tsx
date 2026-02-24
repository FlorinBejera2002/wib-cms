import type { Metadata } from 'next'

export const metadata: Metadata = {
  description: 'Blog & Content Management System for asigurari.ro',
  title: 'WIB CMS',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Payload's RootLayout (in (payload)/layout.tsx) renders <html> and <body>.
  // This root layout just passes children through to avoid nested html/body tags.
  return children
}
