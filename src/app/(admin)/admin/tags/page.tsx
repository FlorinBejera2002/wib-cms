'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Pencil, Trash2, Plus, Loader2 } from 'lucide-react'

interface Tag {
  _id: string
  name: string
  slug: string
}

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', slug: '' })

  const fetchTags = async () => {
    const res = await fetch('/api/admin/tags')
    const data = await res.json()
    setTags(data)
    setLoading(false)
  }

  useEffect(() => { fetchTags() }, [])

  const slugify = (text: string) =>
    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')

  const handleSave = async () => {
    setSaving(true)
    const method = editing ? 'PUT' : 'POST'
    const url = editing ? `/api/admin/tags/${editing}` : '/api/admin/tags'
    await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    setForm({ name: '', slug: '' })
    setEditing(null)
    setSaving(false)
    fetchTags()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur doriți să ștergeți acest tag?')) return
    await fetch(`/api/admin/tags/${id}`, { method: 'DELETE' })
    fetchTags()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Tag-uri ({tags.length})</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : tags.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4">Nu există tag-uri.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <div key={tag._id} className="flex items-center gap-1 px-3 py-1.5 rounded-full border bg-muted/50 text-sm">
                    <span>{tag.name}</span>
                    <button onClick={() => { setEditing(tag._id); setForm({ name: tag.name, slug: tag.slug }) }} className="ml-1 text-muted-foreground hover:text-foreground">
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button onClick={() => handleDelete(tag._id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <div>
        <Card>
          <CardHeader><CardTitle className="text-lg">{editing ? 'Editare tag' : 'Tag nou'}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nume</Label>
              <Input value={form.name} onChange={(e) => setForm({ name: e.target.value, slug: editing ? form.slug : slugify(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSave} disabled={saving || !form.name} className="flex-1">
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {editing ? 'Salvează' : 'Adaugă'}
              </Button>
              {editing && (
                <Button variant="outline" onClick={() => { setEditing(null); setForm({ name: '', slug: '' }) }}>Anulează</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
