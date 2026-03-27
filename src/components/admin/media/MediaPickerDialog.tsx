'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Upload, Loader2, Check } from 'lucide-react'

interface MediaItem {
  _id: string
  filename: string
  url: string
  mimeType: string
  size: number
  alt?: string
  createdAt: string
}

interface MediaPickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (media: { url: string; alt: string }) => void
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export default function MediaPickerDialog({ open, onOpenChange, onSelect }: MediaPickerDialogProps) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const fetchMedia = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/media')
      const data = await res.json()
      setItems(data.filter((m: MediaItem) => m.mimeType.startsWith('image/')))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchMedia()
      setSelectedId(null)
      setSearch('')
    }
  }, [open])

  const filteredItems = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter(
      (m) =>
        m.filename.toLowerCase().includes(q) ||
        (m.alt && m.alt.toLowerCase().includes(q))
    )
  }, [items, search])

  const selectedItem = useMemo(
    () => items.find((m) => m._id === selectedId) || null,
    [items, selectedId]
  )

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    setUploading(true)
    const formData = new FormData()
    Array.from(files).forEach((f) => formData.append('files', f))

    try {
      await fetch('/api/admin/media', { method: 'POST', body: formData })
      await fetchMedia()
    } catch {
      // ignore
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleConfirm = () => {
    if (selectedItem) {
      onSelect({
        url: selectedItem.url,
        alt: selectedItem.alt || selectedItem.filename.replace(/\.[^.]+$/, '').replace(/-/g, ' '),
      })
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Alege imagine</DialogTitle>
          <DialogDescription>Selecteaza o imagine din galerie sau incarca una noua.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cauta fisiere..."
              className="pl-9"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Incarca
          </Button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto border rounded-lg p-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              {search ? 'Nu s-au gasit imagini.' : 'Nu exista imagini in galerie.'}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filteredItems.map((item) => (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => setSelectedId(item._id)}
                  onDoubleClick={() => {
                    setSelectedId(item._id)
                    handleConfirm()
                  }}
                  className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedId === item._id
                      ? 'border-primary ring-2 ring-primary/30'
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                >
                  <img
                    src={item.url}
                    alt={item.alt || item.filename}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  {selectedId === item._id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                        <Check className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[10px] text-white truncate">{item.filename}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedItem && (
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <img
              src={selectedItem.url}
              alt={selectedItem.alt || ''}
              className="h-12 w-12 object-cover rounded"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{selectedItem.filename}</p>
              <p className="text-xs text-muted-foreground">{formatSize(selectedItem.size)}</p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuleaza
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId}>
            Selecteaza
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
