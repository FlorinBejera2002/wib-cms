'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import TipTapEditor from '@/components/admin/posts/TipTapEditor'
import { Save, Loader2, RefreshCw, AlertCircle, ChevronDown, ChevronRight, Eye } from 'lucide-react'

const NEWS_CATEGORIES = [
  'rca',
  'casco',
  'legislatie',
  'piata',
  'sfaturi',
  'travel',
  'home',
  'health',
  'general',
] as const

const NEWS_STATUSES = ['draft', 'pending_review', 'published', 'archived'] as const

const categoryLabels: Record<string, string> = {
  rca: 'RCA',
  casco: 'CASCO',
  legislatie: 'Legislatie',
  piata: 'Piata',
  sfaturi: 'Sfaturi',
  travel: 'Travel',
  home: 'Home',
  health: 'Health',
  general: 'General',
}

const statusLabels: Record<string, string> = {
  draft: 'Ciorna',
  pending_review: 'In asteptare',
  published: 'Publicat',
  archived: 'Arhivat',
}

const statusVariant: Record<string, 'success' | 'warning' | 'secondary' | 'destructive'> = {
  published: 'success',
  draft: 'secondary',
  pending_review: 'warning',
  archived: 'destructive',
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

interface NewsFormData {
  _id?: string
  title: string
  slug: string
  category: string
  status: string
  content?: Record<string, unknown>
  contentHtml?: string
  excerpt?: string
  authorName?: string
  featuredImageUrl?: string
  isBreaking: boolean
  sourceName?: string
  sourceUrl?: string
  seo?: {
    metaTitle?: string
    metaDescription?: string
  }
}

interface NewsFormProps {
  initialData?: NewsFormData
  newsId?: string
}

export default function NewsForm({ initialData, newsId }: NewsFormProps) {
  const router = useRouter()
  const isEdit = !!newsId
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [seoOpen, setSeoOpen] = useState(false)

  const [form, setForm] = useState<NewsFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    category: initialData?.category || 'general',
    status: initialData?.status || 'draft',
    content: initialData?.content || undefined,
    contentHtml: initialData?.contentHtml || '',
    excerpt: initialData?.excerpt || '',
    authorName: initialData?.authorName || 'Echipa asigurari.ro',
    featuredImageUrl: initialData?.featuredImageUrl || '',
    isBreaking: initialData?.isBreaking ?? false,
    sourceName: initialData?.sourceName || '',
    sourceUrl: initialData?.sourceUrl || '',
    seo: {
      metaTitle: initialData?.seo?.metaTitle || '',
      metaDescription: initialData?.seo?.metaDescription || '',
    },
  })

  const handleTitleChange = (title: string) => {
    setForm((prev) => ({
      ...prev,
      title,
      slug: isEdit ? prev.slug : slugify(title),
    }))
  }

  const handleEditorChange = (json: Record<string, unknown>, html: string) => {
    setForm((prev) => ({ ...prev, content: json, contentHtml: html }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const url = isEdit
        ? `/api/admin/news/${newsId}`
        : '/api/admin/news'
      const method = isEdit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Eroare la salvare')
      }

      router.push('/admin/news')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Sticky action bar */}
      <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[form.status] || 'secondary'}>
            {statusLabels[form.status] || form.status}
          </Badge>
          {isEdit && <span className="text-sm text-muted-foreground">Editare stire</span>}
          {!isEdit && <span className="text-sm text-muted-foreground">Stire noua</span>}
        </div>
        <div className="flex items-center gap-3">
          {newsId && (
            <a href={`/preview/news/${newsId}`} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Eye className="h-4 w-4" />
              Preview
            </a>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isEdit ? 'Salveaza' : 'Creeaza'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Continut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titlu</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Titlul stirii"
                  className="text-lg font-medium h-12"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug (URL)</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="titlul-stirii"
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setForm((p) => ({ ...p, slug: slugify(p.title) }))}
                    title="Regenereaza slug din titlu"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Continut stire</Label>
                <TipTapEditor content={form.content} onChange={handleEditorChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Rezumat</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Un scurt rezumat al stirii..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* SEO - Collapsible */}
          <Card>
            <CardHeader
              className="pb-3 cursor-pointer select-none"
              onClick={() => setSeoOpen((v) => !v)}
            >
              <CardTitle className="text-lg flex items-center gap-2">
                {seoOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                SEO
              </CardTitle>
            </CardHeader>
            {seoOpen && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metaTitle">Meta Title</Label>
                  <Input
                    id="metaTitle"
                    value={form.seo?.metaTitle}
                    onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, metaTitle: e.target.value } }))}
                    placeholder="Titlu pentru motoarele de cautare"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="metaDescription">Meta Description</Label>
                  <Textarea
                    id="metaDescription"
                    value={form.seo?.metaDescription}
                    onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, metaDescription: e.target.value } }))}
                    placeholder="Descriere pentru motoarele de cautare"
                    rows={2}
                  />
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right column - Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Publicare</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWS_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabels[s] || s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categorie</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWS_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {categoryLabels[c] || c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorName">Numele autorului</Label>
                <Input
                  id="authorName"
                  value={form.authorName}
                  onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isBreaking"
                  checked={form.isBreaking}
                  onChange={(e) => setForm((p) => ({ ...p, isBreaking: e.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="isBreaking" className="cursor-pointer">
                  Stire de ultima ora (breaking)
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Imagine principala</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="featuredImageUrl">URL imagine</Label>
                <Input
                  id="featuredImageUrl"
                  value={form.featuredImageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, featuredImageUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
              {form.featuredImageUrl && (
                <img
                  src={form.featuredImageUrl}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md border"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Sursa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="sourceName">Numele sursei</Label>
                <Input
                  id="sourceName"
                  value={form.sourceName}
                  onChange={(e) => setForm((p) => ({ ...p, sourceName: e.target.value }))}
                  placeholder="ex: Mediafax, Agerpres"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sourceUrl">URL sursa</Label>
                <Input
                  id="sourceUrl"
                  value={form.sourceUrl}
                  onChange={(e) => setForm((p) => ({ ...p, sourceUrl: e.target.value }))}
                  placeholder="https://..."
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
