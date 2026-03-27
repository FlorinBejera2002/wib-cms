'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ro } from 'date-fns/locale'

interface Subscriber {
  _id: string
  email: string
  name?: string
  status: string
  subscribedAt: string
}

export default function SubscribersPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSubscribers = async () => {
    const res = await fetch('/api/admin/subscribers')
    const data = await res.json()
    setSubscribers(data)
    setLoading(false)
  }

  useEffect(() => { fetchSubscribers() }, [])

  const exportCsv = () => {
    const csv = ['Email,Nume,Status,Data abonat']
      .concat(subscribers.map((s) => `${s.email},${s.name || ''},${s.status},${s.subscribedAt}`))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subscribers.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{subscribers.length} abonați</span>
        <Button variant="outline" size="sm" onClick={exportCsv} disabled={!subscribers.length}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Abonați Newsletter</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : subscribers.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">Nu există abonați.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-sm">Email</th>
                    <th className="text-left p-3 font-medium text-sm">Nume</th>
                    <th className="text-left p-3 font-medium text-sm">Status</th>
                    <th className="text-left p-3 font-medium text-sm">Abonat</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.map((sub) => (
                    <tr key={sub._id} className="border-b">
                      <td className="p-3 text-sm">{sub.email}</td>
                      <td className="p-3 text-sm text-muted-foreground">{sub.name || '—'}</td>
                      <td className="p-3">
                        <Badge variant={sub.status === 'active' ? 'success' : 'secondary'}>
                          {sub.status === 'active' ? 'Activ' : 'Dezabonat'}
                        </Badge>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(sub.subscribedAt), { addSuffix: true, locale: ro })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
