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
import TipTapEditor from './TipTapEditor'
import FeaturedImagePicker from './FeaturedImagePicker'
import MediaPickerDialog from '../media/MediaPickerDialog'
import { SYSTEMS, POST_STATUSES } from '@/lib/constants'
import { Save, Loader2, ImagePlus, RefreshCw, AlertCircle, Eye, Sparkles } from 'lucide-react'
import SeoChat from './SeoChat'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface PostFormData {
  _id?: string
  title: string
  slug: string
  system: string
  status: string
  content?: Record<string, unknown>
  contentHtml?: string
  excerpt?: string
  featuredImageUrl?: string
  featuredImageAlt?: string
  authorDisplayName?: string
  commentsEnabled: boolean
  category?: string
  tags?: string[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
    metaKeywords?: string
    canonicalUrl?: string
  }
  social?: {
    ogTitle?: string
    ogDescription?: string
    ogImage?: string
  }
}

interface PostFormProps {
  initialData?: PostFormData
  categories?: Array<{ _id: string; name: string; slug: string }>
  tags?: Array<{ _id: string; name: string; slug: string }>
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

export default function PostForm({ initialData, categories = [], tags = [] }: PostFormProps) {
  const router = useRouter()
  const isEdit = !!initialData?._id
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [ogPickerOpen, setOgPickerOpen] = useState(false)
  const [seoChatOpen, setSeoChatOpen] = useState(false)
  const [externalContent, setExternalContent] = useState<string | null>(null)
  const [confirmArticle, setConfirmArticle] = useState<{
    article: { title: string; summary: string; meta_description: string; content_html: string }
    keywords: string[]
  } | null>(null)

  const [form, setForm] = useState<PostFormData>({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    system: initialData?.system || 'common',
    status: initialData?.status || 'draft',
    content: initialData?.content || undefined,
    contentHtml: initialData?.contentHtml || '',
    excerpt: initialData?.excerpt || '',
    featuredImageUrl: initialData?.featuredImageUrl || '',
    featuredImageAlt: initialData?.featuredImageAlt || '',
    authorDisplayName: initialData?.authorDisplayName || '',
    commentsEnabled: initialData?.commentsEnabled ?? true,
    category: initialData?.category || '',
    tags: initialData?.tags || [],
    seo: {
      metaTitle: initialData?.seo?.metaTitle || '',
      metaDescription: initialData?.seo?.metaDescription || '',
      metaKeywords: initialData?.seo?.metaKeywords || '',
      canonicalUrl: initialData?.seo?.canonicalUrl || '',
    },
    social: {
      ogTitle: initialData?.social?.ogTitle || '',
      ogDescription: initialData?.social?.ogDescription || '',
      ogImage: initialData?.social?.ogImage || '',
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
    if (externalContent !== null) {
      setExternalContent(null)
    }
  }

  const handleApplyArticle = (
    article: { title: string; summary: string; meta_description: string; content_html: string },
    keywords: string[]
  ) => {
    const isDirty = Boolean(form.title || form.contentHtml || form.excerpt)
    if (isDirty) {
      setConfirmArticle({ article, keywords })
      return
    }
    applyArticleToForm(article, keywords)
  }

  const applyArticleToForm = (
    article: { title: string; summary: string; meta_description: string; content_html: string },
    keywords: string[]
  ) => {
    setForm((prev) => ({
      ...prev,
      title: article.title,
      slug: isEdit ? prev.slug : slugify(article.title),
      excerpt: article.summary,
      seo: {
        ...prev.seo,
        metaDescription: article.meta_description,
        metaKeywords: keywords.join(', '),
      },
    }))
    setExternalContent(article.content_html)
    setConfirmArticle(null)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')

    try {
      const url = isEdit
        ? `/api/admin/posts/${initialData?._id}`
        : '/api/admin/posts'
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

      const data = await res.json()
      if (!isEdit) {
        router.push(`/admin/posts/${data._id}/edit`)
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare la salvare')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex gap-6">
      <div className={seoChatOpen ? 'flex-1 min-w-0' : 'w-full'}>
        <div className="space-y-6">
      {/* Sticky action bar */}
      <div className="flex items-center justify-between bg-white border rounded-lg px-4 py-3 shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Badge variant={statusVariant[form.status] || 'secondary'}>
            {statusLabels[form.status] || form.status}
          </Badge>
          {isEdit && <span className="text-sm text-muted-foreground">Editare articol</span>}
          {!isEdit && <span className="text-sm text-muted-foreground">Articol nou</span>}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant={seoChatOpen ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSeoChatOpen((prev) => !prev)}
            className="hidden lg:inline-flex"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            AI Generator
          </Button>
          {isEdit && initialData?._id && (
            <a href={`/preview/blog/${initialData._id}`} target="_blank" rel="noopener noreferrer"
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
                  placeholder="Titlul articolului"
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
                    placeholder="titlul-articolului"
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
                <Label>Continut articol</Label>
                <TipTapEditor content={form.content} onChange={handleEditorChange} externalContent={externalContent} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Rezumat</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Un scurt rezumat al articolului..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">SEO</CardTitle>
            </CardHeader>
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
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">Meta Keywords</Label>
                <Input
                  id="metaKeywords"
                  value={form.seo?.metaKeywords}
                  onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, metaKeywords: e.target.value } }))}
                  placeholder="cuvant1, cuvant2, cuvant3"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Social / Open Graph</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input
                  id="ogTitle"
                  value={form.social?.ogTitle}
                  onChange={(e) => setForm((p) => ({ ...p, social: { ...p.social, ogTitle: e.target.value } }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogDescription">OG Description</Label>
                <Textarea
                  id="ogDescription"
                  value={form.social?.ogDescription}
                  onChange={(e) => setForm((p) => ({ ...p, social: { ...p.social, ogDescription: e.target.value } }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">OG Image</Label>
                <div className="flex gap-2">
                  <Input
                    id="ogImage"
                    value={form.social?.ogImage}
                    onChange={(e) => setForm((p) => ({ ...p, social: { ...p.social, ogImage: e.target.value } }))}
                    placeholder="URL imagine sau alege din galerie"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setOgPickerOpen(true)}
                    title="Alege din galerie"
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                </div>
                {form.social?.ogImage && (
                  <img
                    src={form.social.ogImage}
                    alt="OG preview"
                    className="w-full h-32 object-cover rounded-md border mt-2"
                  />
                )}
              </div>
            </CardContent>
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
                    {POST_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabels[s] || s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sistem</Label>
                <Select
                  value={form.system}
                  onValueChange={(v) => setForm((p) => ({ ...p, system: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SYSTEMS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="authorDisplayName">Numele autorului</Label>
                <Input
                  id="authorDisplayName"
                  value={form.authorDisplayName}
                  onChange={(e) => setForm((p) => ({ ...p, authorDisplayName: e.target.value }))}
                />
              </div>

              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>Categorie</Label>
                  <Select
                    value={form.category || ''}
                    onValueChange={(v) => setForm((p) => ({ ...p, category: v === '_none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteaza o categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Fara categorie</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {tags.length > 0 && (
                <div className="space-y-2">
                  <Label>Tag-uri</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((t) => {
                      const selected = form.tags?.includes(t._id)
                      return (
                        <button
                          key={t._id}
                          type="button"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              tags: selected
                                ? (p.tags || []).filter((id) => id !== t._id)
                                : [...(p.tags || []), t._id],
                            }))
                          }
                          className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                            selected
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/50'
                          }`}
                        >
                          {t.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Imagine principala</CardTitle>
            </CardHeader>
            <CardContent>
              <FeaturedImagePicker
                imageUrl={form.featuredImageUrl || ''}
                imageAlt={form.featuredImageAlt || ''}
                onImageChange={(url, alt) =>
                  setForm((p) => ({ ...p, featuredImageUrl: url, featuredImageAlt: alt }))
                }
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaPickerDialog
        open={ogPickerOpen}
        onOpenChange={setOgPickerOpen}
        onSelect={(media) => {
          setForm((p) => ({ ...p, social: { ...p.social, ogImage: media.url } }))
        }}
      />
        </div>
      </div>

      {seoChatOpen && (
        <div className="w-[400px] shrink-0 hidden lg:block">
          <SeoChat
            currentTitle={form.title}
            currentKeywords={form.seo?.metaKeywords || ''}
            onApplyArticle={handleApplyArticle}
            onClose={() => setSeoChatOpen(false)}
          />
        </div>
      )}

      <AlertDialog open={!!confirmArticle} onOpenChange={(open) => !open && setConfirmArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suprascrie continutul?</AlertDialogTitle>
            <AlertDialogDescription>
              Aceasta actiune va inlocui titlul, continutul, rezumatul si campurile SEO cu continut generat de AI.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuleaza</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmArticle) {
                  applyArticleToForm(confirmArticle.article, confirmArticle.keywords)
                }
              }}
            >
              Aplica
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
