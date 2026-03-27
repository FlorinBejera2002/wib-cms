import connectDB from '@/lib/db/connection'
import BlogPost from '@/lib/db/models/BlogPost'
import BlogComment from '@/lib/db/models/BlogComment'
import User from '@/lib/db/models/User'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { FileText, MessageSquare, Users, Eye } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { ro } from 'date-fns/locale'

async function getStats() {
  await connectDB()

  const [totalPosts, publishedPosts, draftPosts, pendingComments, totalUsers, recentPosts] =
    await Promise.all([
      BlogPost.countDocuments(),
      BlogPost.countDocuments({ status: 'published' }),
      BlogPost.countDocuments({ status: 'draft' }),
      BlogComment.countDocuments({ status: 'pending' }),
      User.countDocuments({ isActive: true }),
      BlogPost.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .select('title slug status updatedAt stats system')
        .lean(),
    ])

  const totalViews = await BlogPost.aggregate([
    { $group: { _id: null, total: { $sum: '$stats.views' } } },
  ])

  return {
    totalPosts,
    publishedPosts,
    draftPosts,
    pendingComments,
    totalUsers,
    totalViews: totalViews[0]?.total || 0,
    recentPosts: JSON.parse(JSON.stringify(recentPosts)),
  }
}

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

export default async function DashboardPage() {
  const stats = await getStats()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articole</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              {stats.publishedPosts} publicate · {stats.draftPosts} ciorne
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vizualizări Totale</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews.toLocaleString('ro-RO')}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comentarii în așteptare</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingComments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilizatori Activi</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Articole Recente</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentPosts.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nu există articole.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentPosts.map((post: { _id: string; title: string; slug: string; status: string; updatedAt: string; system?: string }) => (
                <Link
                  key={post._id}
                  href={`/admin/posts/${post._id}/edit`}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{post.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.system && <span className="uppercase mr-2">{post.system}</span>}
                      {formatDistanceToNow(new Date(post.updatedAt), { addSuffix: true, locale: ro })}
                    </p>
                  </div>
                  <Badge variant={statusVariant[post.status] || 'secondary'}>
                    {statusLabel[post.status] || post.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
