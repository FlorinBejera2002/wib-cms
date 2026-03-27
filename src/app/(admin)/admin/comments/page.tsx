'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ro } from 'date-fns/locale'

interface Comment {
  _id: string
  post: { _id: string; title: string; slug: string } | null
  author: { name: string; email: string }
  content: string
  status: string
  createdAt: string
}

const statusVariant: Record<string, 'warning' | 'success' | 'destructive' | 'secondary'> = {
  pending: 'warning',
  approved: 'success',
  spam: 'destructive',
  deleted: 'secondary',
}

const statusLabel: Record<string, string> = {
  pending: 'În așteptare',
  approved: 'Aprobat',
  spam: 'Spam',
  deleted: 'Șters',
}

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const fetchComments = async () => {
    setLoading(true)
    const res = await fetch(`/api/admin/comments?status=${filter}`)
    const data = await res.json()
    setComments(data)
    setLoading(false)
  }

  useEffect(() => { fetchComments() }, [filter])

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/comments/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    fetchComments()
  }

  const deleteComment = async (id: string) => {
    if (!confirm('Sigur doriți să ștergeți acest comentariu?')) return
    await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' })
    fetchComments()
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {['pending', 'approved', 'spam'].map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {statusLabel[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comentarii — {statusLabel[filter]}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : comments.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nu există comentarii {statusLabel[filter].toLowerCase()}.</p>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment._id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">{comment.author.name}</p>
                      <p className="text-xs text-muted-foreground">{comment.author.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant[comment.status]}>
                        {statusLabel[comment.status]}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: ro })}
                      </span>
                    </div>
                  </div>
                  {comment.post && (
                    <p className="text-xs text-muted-foreground">
                      Articol: <span className="font-medium">{comment.post.title}</span>
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                  <div className="flex gap-1 pt-1">
                    {comment.status !== 'approved' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(comment._id, 'approved')}>
                        <Check className="h-3 w-3 mr-1" /> Aprobă
                      </Button>
                    )}
                    {comment.status !== 'spam' && (
                      <Button size="sm" variant="outline" onClick={() => updateStatus(comment._id, 'spam')}>
                        <X className="h-3 w-3 mr-1" /> Spam
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => deleteComment(comment._id)}>
                      <Trash2 className="h-3 w-3 mr-1 text-destructive" /> Șterge
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
