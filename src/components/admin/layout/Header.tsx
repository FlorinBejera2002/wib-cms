'use client'

import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

const pageConfig: Record<string, { title: string; action?: { label: string; href: string } }> = {
  '/admin': { title: 'Dashboard' },
  '/admin/posts': { title: 'Articole', action: { label: 'Articol nou', href: '/admin/posts/new' } },
  '/admin/categories': { title: 'Categorii' },
  '/admin/tags': { title: 'Tag-uri' },
  '/admin/comments': { title: 'Comentarii' },
  '/admin/media': { title: 'Media' },
  '/admin/users': { title: 'Utilizatori' },
  '/admin/subscribers': { title: 'Abonați' },
  '/admin/settings': { title: 'Setări' },
}

export default function Header() {
  const pathname = usePathname()

  let config = pageConfig[pathname]
  if (!config) {
    if (pathname.startsWith('/admin/posts/new')) {
      config = { title: 'Articol nou' }
    } else if (pathname.includes('/edit')) {
      config = { title: 'Editare articol' }
    } else {
      config = { title: 'WIB CMS' }
    }
  }

  return (
    <header className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
        {config.action && (
          <Button asChild>
            <Link href={config.action.href}>
              <Plus className="h-4 w-4 mr-2" />
              {config.action.label}
            </Link>
          </Button>
        )}
      </div>
    </header>
  )
}
