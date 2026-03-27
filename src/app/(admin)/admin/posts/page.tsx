import connectDB from '@/lib/db/connection'
import BlogPost from '@/lib/db/models/BlogPost'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Pencil } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ro } from 'date-fns/locale'

const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  published: 'success',
  draft: 'secondary',
  pending_review: 'warning',
  archived: 'destructive',
}

const statusLabel: Record<string, string> = {
  published: 'Publicat',
  draft: 'Ciornă',
  pending_review: 'În așteptare',
  archived: 'Arhivat',
}

interface SearchParams {
  page?: string
  status?: string
  system?: string
}

export default async function PostsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  await connectDB()

  const page = parseInt(params.page || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const filter: Record<string, string> = {}
  if (params.status) filter.status = params.status
  if (params.system) filter.system = params.system

  const [posts, total] = await Promise.all([
    BlogPost.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title slug status system authorDisplayName updatedAt publishedAt stats')
      .lean(),
    BlogPost.countDocuments(filter),
  ])

  const totalPages = Math.ceil(total / limit)
  const serializedPosts = JSON.parse(JSON.stringify(posts))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{total} articole</span>
        </div>
        <Button asChild>
          <Link href="/admin/posts/new">
            <Plus className="h-4 w-4 mr-2" />
            Articol nou
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-sm">Titlu</th>
                  <th className="text-left p-4 font-medium text-sm">Sistem</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Autor</th>
                  <th className="text-left p-4 font-medium text-sm">Vizualizări</th>
                  <th className="text-left p-4 font-medium text-sm">Actualizat</th>
                  <th className="text-right p-4 font-medium text-sm">Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {serializedPosts.map((post: {
                  _id: string
                  title: string
                  slug: string
                  system: string
                  status: string
                  authorDisplayName?: string
                  stats?: { views: number }
                  updatedAt: string
                }) => (
                  <tr key={post._id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <Link href={`/admin/posts/${post._id}/edit`} className="font-medium hover:text-primary">
                        {post.title}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">/{post.slug}</p>
                    </td>
                    <td className="p-4">
                      <span className="text-xs uppercase font-mono bg-muted px-2 py-1 rounded">
                        {post.system}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant={statusVariant[post.status] || 'secondary'}>
                        {statusLabel[post.status] || post.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {post.authorDisplayName || '—'}
                    </td>
                    <td className="p-4 text-sm">
                      {post.stats?.views?.toLocaleString('ro-RO') || '0'}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true, locale: ro })}
                    </td>
                    <td className="p-4 text-right">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/posts/${post._id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {serializedPosts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nu există articole. Creați primul articol!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/posts?page=${page - 1}`}>Anterior</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Pagina {page} din {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/posts?page=${page + 1}`}>Următor</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
