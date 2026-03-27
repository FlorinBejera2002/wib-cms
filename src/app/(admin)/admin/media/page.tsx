'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Upload, Trash2, Loader2, Copy } from 'lucide-react'

interface MediaItem {
  _id: string
  filename: string
  url: string
  mimeType: string
  size: number
  alt?: string
  createdAt: string
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchMedia = async () => {
    const res = await fetch('/api/admin/media')
    const data = await res.json()
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { fetchMedia() }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('files', f))

    await fetch('/api/admin/media', { method: 'POST', body: formData })
    setUploading(false)
    fetchMedia()
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sigur doriți să ștergeți acest fișier?')) return
    await fetch(`/api/admin/media/${id}`, { method: 'DELETE' })
    fetchMedia()
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1048576).toFixed(1)} MB`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleUpload}
          className="max-w-xs"
        />
        {uploading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fișiere media ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nu există fișiere. Încărcați primul fișier!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {items.map((item) => (
                <div key={item._id} className="group relative border rounded-lg overflow-hidden">
                  {item.mimeType.startsWith('image/') ? (
                    <img src={item.url} alt={item.alt || item.filename} className="w-full h-32 object-cover" />
                  ) : (
                    <div className="w-full h-32 bg-muted flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{item.mimeType}</span>
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.filename}</p>
                    <p className="text-xs text-muted-foreground">{formatSize(item.size)}</p>
                  </div>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => copyUrl(item.url)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="secondary" className="h-7 w-7" onClick={() => handleDelete(item._id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
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
