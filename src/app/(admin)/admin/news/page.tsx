'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
  draft: 'Ciorna',
  pending_review: 'In asteptare',
  archived: 'Arhivat',
}

const categoryLabel: Record<string, string> = {
  rca: 'RCA',
  casco: 'CASCO',
  legislatie: 'Legislatie',
  piata: 'Piata',
  sfaturi: 'Sfaturi',
  travel: 'Calatorie',
  home: 'Locuinta',
  health: 'Sanatate',
  general: 'General',
}

interface NewsItem {
  _id: string
  title: string
  slug: string
  category: string
  status: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

interface NewsResponse {
  items: NewsItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function NewsPage() {
  const [data, setData] = useState<NewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('limit', '20')
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (categoryFilter !== 'all') params.set('category', categoryFilter)

      const res = await fetch(`/api/admin/news?${params.toString()}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Failed to fetch news:', error)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, categoryFilter])

  useEffect(() => {
    fetchNews()
  }, [fetchNews])

  const handleDelete = async (id: string) => {
    if (!window.confirm('Sigur doriti sa stergeti aceasta stire?')) return

    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/news/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchNews()
      }
    } catch (error) {
      console.error('Failed to delete news:', error)
    } finally {
      setDeleting(null)
    }
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value)
    setPage(1)
  }

  const items = data?.items || []
  const total = data?.total || 0
  const totalPages = data?.totalPages || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Stiri</h1>
          <span className="text-sm text-muted-foreground">{total} stiri</span>
        </div>
        <Button asChild>
          <Link href="/admin/news/new">
            <Plus className="h-4 w-4 mr-2" />
            Adauga Stire
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Categorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate categoriile</SelectItem>
            <SelectItem value="rca">RCA</SelectItem>
            <SelectItem value="casco">CASCO</SelectItem>
            <SelectItem value="legislatie">Legislatie</SelectItem>
            <SelectItem value="piata">Piata</SelectItem>
            <SelectItem value="sfaturi">Sfaturi</SelectItem>
            <SelectItem value="travel">Calatorie</SelectItem>
            <SelectItem value="home">Locuinta</SelectItem>
            <SelectItem value="health">Sanatate</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toate statusurile</SelectItem>
            <SelectItem value="draft">Ciorna</SelectItem>
            <SelectItem value="pending_review">In asteptare</SelectItem>
            <SelectItem value="published">Publicat</SelectItem>
            <SelectItem value="archived">Arhivat</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-medium text-sm">Titlu</th>
                  <th className="text-left p-4 font-medium text-sm">Categorie</th>
                  <th className="text-left p-4 font-medium text-sm">Status</th>
                  <th className="text-left p-4 font-medium text-sm">Data publicarii</th>
                  <th className="text-right p-4 font-medium text-sm">Actiuni</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-muted-foreground">
                      Se incarca...
                    </td>
                  </tr>
                ) : (
                  <>
                    {items.map((item) => (
                      <tr key={item._id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-4">
                          <Link href={`/admin/news/${item._id}/edit`} className="font-medium hover:text-primary">
                            {item.title}
                          </Link>
                          <p className="text-xs text-muted-foreground mt-0.5">/{item.slug}</p>
                        </td>
                        <td className="p-4">
                          <span className="text-xs uppercase font-mono bg-muted px-2 py-1 rounded">
                            {categoryLabel[item.category] || item.category}
                          </span>
                        </td>
                        <td className="p-4">
                          <Badge variant={statusVariant[item.status] || 'secondary'}>
                            {statusLabel[item.status] || item.status}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {item.publishedAt
                            ? formatDistanceToNow(new Date(item.publishedAt), { addSuffix: true, locale: ro })
                            : '—'}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/admin/news/${item._id}/edit`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(item._id)}
                              disabled={deleting === item._id}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          Nu exista stiri. Creati prima stire!
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)}>
              Anterior
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Pagina {page} din {totalPages}
          </span>
          {page < totalPages && (
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)}>
              Urmator
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
