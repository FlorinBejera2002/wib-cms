'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImagePlus, X } from 'lucide-react'
import MediaPickerDialog from '../media/MediaPickerDialog'

interface FeaturedImagePickerProps {
  imageUrl: string
  imageAlt: string
  onImageChange: (url: string, alt: string) => void
}

export default function FeaturedImagePicker({ imageUrl, imageAlt, onImageChange }: FeaturedImagePickerProps) {
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="space-y-3">
      {!imageUrl ? (
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          className="w-full h-40 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-sm font-medium">Alege imagine principala</span>
        </button>
      ) : (
        <>
          <div className="relative rounded-lg overflow-hidden border">
            <img
              src={imageUrl}
              alt={imageAlt || ''}
              className="w-full aspect-video object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPickerOpen(true)}
              className="flex-1"
            >
              <ImagePlus className="h-4 w-4 mr-1.5" />
              Schimba
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onImageChange('', '')}
            >
              <X className="h-4 w-4 mr-1.5" />
              Sterge
            </Button>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Text alternativ</Label>
            <Input
              value={imageAlt}
              onChange={(e) => onImageChange(imageUrl, e.target.value)}
              placeholder="Descriere imagine..."
              className="h-8 text-sm"
            />
          </div>
        </>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(media) => onImageChange(media.url, media.alt)}
      />
    </div>
  )
}
