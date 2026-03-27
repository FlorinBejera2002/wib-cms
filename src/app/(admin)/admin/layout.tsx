import AdminLayoutClient from './AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminLayoutClient
      userRole="admin"
      userName="Admin"
    >
      {children}
    </AdminLayoutClient>
  )
}
