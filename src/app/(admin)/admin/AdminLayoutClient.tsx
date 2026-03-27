'use client'

import Sidebar from '@/components/admin/layout/Sidebar'
import Header from '@/components/admin/layout/Header'

interface AdminLayoutClientProps {
  children: React.ReactNode
  userRole: string
  userName: string
}

export default function AdminLayoutClient({ children, userRole, userName }: AdminLayoutClientProps) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar userRole={userRole} userName={userName} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
