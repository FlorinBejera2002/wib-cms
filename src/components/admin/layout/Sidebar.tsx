'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Newspaper,
  FolderTree,
  Tags,
  MessageSquare,
  Image,
  Users,
  Mail,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  permission?: string
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Articole', href: '/admin/posts', icon: <FileText className="h-5 w-5" /> },
  { label: 'Stiri', href: '/admin/news', icon: <Newspaper className="h-5 w-5" /> },
  { label: 'Categorii', href: '/admin/categories', icon: <FolderTree className="h-5 w-5" /> },
  { label: 'Tag-uri', href: '/admin/tags', icon: <Tags className="h-5 w-5" /> },
  { label: 'Comentarii', href: '/admin/comments', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Media', href: '/admin/media', icon: <Image className="h-5 w-5" /> },
  { label: 'Utilizatori', href: '/admin/users', icon: <Users className="h-5 w-5" />, permission: 'manageUsers' },
  { label: 'Abonați', href: '/admin/subscribers', icon: <Mail className="h-5 w-5" /> },
  { label: 'Setări', href: '/admin/settings', icon: <Settings className="h-5 w-5" />, permission: 'manageSettings' },
]

interface SidebarProps {
  userRole: string
  userName: string
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  const filteredItems = navItems.filter((item) => {
    if (!item.permission) return true
    if (userRole === 'admin') return true
    if (userRole === 'editor' && item.permission !== 'manageUsers' && item.permission !== 'manageSettings') return true
    return false
  })

  return (
    <aside
      className={cn(
        'flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link href="/admin" className="text-xl font-bold text-sidebar-primary">
            WIB CMS
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="px-3 py-2 mb-2">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
            <p className="text-xs text-muted-foreground capitalize">{userRole}</p>
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors w-full',
          )}
          title={collapsed ? 'Deconectare' : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Deconectare</span>}
        </button>
      </div>
    </aside>
  )
}
