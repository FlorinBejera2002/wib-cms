'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Setari generale</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL site</Label>
            <Input
              defaultValue={process.env.NEXT_PUBLIC_SITE_URL || 'https://www.asigurari.ro'}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label>URL CMS</Label>
            <Input defaultValue={typeof window !== 'undefined' ? window.location.origin : ''} disabled />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Baza de date</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>MongoDB URI</Label>
            <Input defaultValue="mongodb://localhost:27017/wib_test" disabled type="password" />
          </div>
          <p className="text-xs text-muted-foreground">
            Configuratia bazei de date se modifica din fisierul .env
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Webhooks n8n</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>N8N Webhook URL</Label>
            <Input placeholder="http://n8n:5678/webhook/..." disabled />
          </div>
          <p className="text-xs text-muted-foreground">
            Configurat prin variabila de mediu N8N_WEBHOOK_URL
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Versiune</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>WIB CMS v1.0.0</p>
            <p>Next.js 15 + Mongoose + TipTap</p>
            <p>Blog CMS pentru asigurari.ro</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
