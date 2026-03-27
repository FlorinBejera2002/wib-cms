'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
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
import { POST_FORM_LABELS as L } from '@/lib/post-form-labels'
import { Save, Loader2, ImagePlus, RefreshCw, AlertCircle, Eye, Sparkles, FileText, Search, Share2, Settings2, Image as ImageIcon, Tag } from 'lucide-react'
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
  draft: L.statusDraft,
  pending_review: L.statusPending,
  published: L.statusPublished,
  archived: L.statusArchived,
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
      contentHtml: article.content_html,
      seo: {
        ...prev.seo,
        metaTitle: article.title,
        metaDescription: article.meta_description,
        metaKeywords: keywords.join(', '),
      },
      social: {
        ...prev.social,
        ogTitle: article.title,
        ogDescription: article.meta_description,
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

  const [headerActionsEl, setHeaderActionsEl] = useState<HTMLElement | null>(null)
  const [headerStatusEl, setHeaderStatusEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const actionsEl = document.getElementById('header-actions')
    const statusEl = document.getElementById('header-status')
    if (actionsEl) setHeaderActionsEl(actionsEl)
    if (statusEl) setHeaderStatusEl(statusEl)
  }, [])

  return (
    <div className="relative">
      {/* Portal status badge under the title */}
      {headerStatusEl && createPortal(
        <div className="mt-1">
          <Badge variant={statusVariant[form.status] || 'secondary'}>
            {statusLabels[form.status] || form.status}
          </Badge>
        </div>,
        headerStatusEl
      )}

      {/* Portal action buttons into the Header bar */}
      {headerActionsEl && createPortal(
        <div className="flex items-center gap-2">
          {isEdit && initialData?._id && (
            <Button variant="outline" size="sm" asChild>
              <a href={`/preview/blog/${initialData._id}`} target="_blank" rel="noopener noreferrer">
                <Eye className="h-4 w-4 mr-2" />
                {L.previewButton}
              </a>
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm" className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {isEdit ? L.saveEdit : L.saveCreate}
          </Button>
        </div>,
        headerActionsEl
      )}

      <div className="space-y-6">

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-green-100/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-600" />
                {L.sectionContent}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-semibold">{L.titleLabel}</Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={L.titlePlaceholder}
                  className="text-lg font-medium h-12 border-green-200 focus-visible:ring-green-500/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-semibold">{L.slugLabel}</Label>
                <div className="flex gap-2">
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder={L.slugPlaceholder}
                    className="font-mono text-sm bg-green-50/40"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setForm((p) => ({ ...p, slug: slugify(p.title) }))}
                    title={L.slugRegenerate}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">{L.contentLabel}</Label>
                <TipTapEditor content={form.content} onChange={handleEditorChange} externalContent={externalContent} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt" className="text-sm font-semibold">{L.excerptLabel}</Label>
                <Textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  placeholder={L.excerptPlaceholder}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Search className="h-5 w-5 text-green-600" />
                {L.sectionSeo}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="metaTitle">{L.metaTitleLabel}</Label>
                <Input
                  id="metaTitle"
                  value={form.seo?.metaTitle}
                  onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, metaTitle: e.target.value } }))}
                  placeholder={L.metaTitlePlaceholder}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaDescription">{L.metaDescriptionLabel}</Label>
                <Textarea
                  id="metaDescription"
                  value={form.seo?.metaDescription}
                  onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, metaDescription: e.target.value } }))}
                  placeholder={L.metaDescriptionPlaceholder}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metaKeywords">{L.metaKeywordsLabel}</Label>
                <Input
                  id="metaKeywords"
                  value={form.seo?.metaKeywords}
                  onChange={(e) => setForm((p) => ({ ...p, seo: { ...p.seo, metaKeywords: e.target.value } }))}
                  placeholder={L.metaKeywordsPlaceholder}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Share2 className="h-5 w-5 text-green-600" />
                {L.sectionSocial}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ogTitle">{L.ogTitleLabel}</Label>
                <Input
                  id="ogTitle"
                  value={form.social?.ogTitle}
                  onChange={(e) => setForm((p) => ({ ...p, social: { ...p.social, ogTitle: e.target.value } }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogDescription">{L.ogDescriptionLabel}</Label>
                <Textarea
                  id="ogDescription"
                  value={form.social?.ogDescription}
                  onChange={(e) => setForm((p) => ({ ...p, social: { ...p.social, ogDescription: e.target.value } }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">{L.ogImageLabel}</Label>
                <div className="flex gap-2">
                  <Input
                    id="ogImage"
                    value={form.social?.ogImage}
                    onChange={(e) => setForm((p) => ({ ...p, social: { ...p.social, ogImage: e.target.value } }))}
                    placeholder={L.ogImagePlaceholder}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setOgPickerOpen(true)}
                    title={L.ogImagePickerTitle}
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
          <Card className="border-green-100/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-green-600" />
                {L.sectionPublish}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>{L.statusLabel}</Label>
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
                <Label>{L.systemLabel}</Label>
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
                <Label htmlFor="authorDisplayName">{L.authorLabel}</Label>
                <Input
                  id="authorDisplayName"
                  value={form.authorDisplayName}
                  onChange={(e) => setForm((p) => ({ ...p, authorDisplayName: e.target.value }))}
                />
              </div>

              {categories.length > 0 && (
                <div className="space-y-2">
                  <Label>{L.categoryLabel}</Label>
                  <Select
                    value={form.category || ''}
                    onValueChange={(v) => setForm((p) => ({ ...p, category: v === '_none' ? '' : v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={L.categoryPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">{L.categoryNone}</SelectItem>
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
                  <Label>{L.tagsLabel}</Label>
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

          <Card className="border-green-100/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-green-600" />
                {L.sectionFeaturedImage}
              </CardTitle>
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

      {/* Floating AI chat - bottom right */}
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        {seoChatOpen && (
          <div className="mb-3 w-[400px] animate-in fade-in slide-in-from-bottom-4 duration-300">
            <SeoChat
              currentTitle={form.title}
              currentKeywords={form.seo?.metaKeywords || ''}
              onApplyArticle={handleApplyArticle}
              onClose={() => setSeoChatOpen(false)}
            />
          </div>
        )}
        {!seoChatOpen && (
          <Button
            onClick={() => setSeoChatOpen(true)}
            className="h-12 px-5 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 animate-in fade-in zoom-in-90 duration-200"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            {L.aiButton}
          </Button>
        )}
      </div>

      <AlertDialog open={!!confirmArticle} onOpenChange={(open) => !open && setConfirmArticle(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{L.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {L.confirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{L.confirmCancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmArticle) {
                  applyArticleToForm(confirmArticle.article, confirmArticle.keywords)
                }
              }}
            >
              {L.confirmApply}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
