'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, relatifMasa, formatTarikhMasa } from '@/lib/api'
import { useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { BentoCard } from '@/components/bento-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Bell,
  Info,
  Clock,
  CheckCheck,
  RefreshCw,
  AlertCircle,
  Inbox,
  ChevronRight,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface NotifikasiItem {
  id: string
  jenis: string
  mesej: string
  dibaca: boolean
  createdAt: string
  documentId?: string
}

interface NotificationsResponse {
  ok: true
  notifikasi: NotifikasiItem[]
  belumDibaca: number
}

const JENIS_ICON: Record<string, LucideIcon> = {
  DOKUMEN_BAHARU: Bell,
  SISTEM: Info,
  PERINGATAN: Clock,
}

function jenisIcon(jenis: string): LucideIcon {
  return JENIS_ICON[jenis] ?? Info
}

export function ParentNotifications() {
  const { setView } = useView()
  const { toast } = useToast()
  const [items, setItems] = useState<NotifikasiItem[]>([])
  const [belumDibaca, setBelumDibaca] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<NotificationsResponse>('/api/guardian/notifications')
      setItems(res.notifikasi)
      setBelumDibaca(res.belumDibaca)
    } catch (e) {
      const err = e as Error
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function handleMarkAllRead() {
    setMarkingAll(true)
    try {
      await api('/api/guardian/notifications?action=readAll', { method: 'PATCH' })
      setItems((prev) => prev.map((n) => ({ ...n, dibaca: true })))
      setBelumDibaca(0)
      toast({
        title: 'Berjaya',
        description: 'Semua notifikasi ditandakan sebagai dibaca.',
      })
    } catch (e) {
      const err = e as Error
      toast({
        title: 'Ralat',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setMarkingAll(false)
    }
  }

  function handleClick(n: NotifikasiItem) {
    if (n.documentId) {
      setView({ name: 'parent-document-preview', documentId: n.documentId })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 rounded-xl" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 border-destructive/30">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-semibold text-foreground">Tidak dapat memuatkan notifikasi</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Cuba Semula
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <BentoCard
        span="full"
        accent="primary"
        icon={Bell}
        title="Notifikasi"
        action={
          <Button
            size="sm"
            variant="outline"
            onClick={handleMarkAllRead}
            disabled={markingAll || belumDibaca === 0}
          >
            <CheckCheck className="h-4 w-4" />
            Tandakan Semua Dibaca
          </Button>
        }
      >
        <p className="text-sm text-muted-foreground">
          {belumDibaca > 0 ? (
            <>
              Anda ada <span className="font-semibold text-foreground">{belumDibaca}</span> notifikasi belum dibaca.
            </>
          ) : (
            'Semua notifikasi telah dibaca.'
          )}
        </p>
      </BentoCard>

      {items.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tiada notifikasi</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Notifikasi baharu akan muncul di sini.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const Icon = jenisIcon(n.jenis)
            const clickable = !!n.documentId
            return (
              <Card
                key={n.id}
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => handleClick(n) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          handleClick(n)
                        }
                      }
                    : undefined
                }
                className={`flex items-start gap-3 p-4 transition-all ${
                  clickable ? 'cursor-pointer hover:shadow-md hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none' : ''
                } ${
                  n.dibaca
                    ? 'bg-card border-border/60'
                    : 'bg-primary/5 border-primary/20'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    n.dibaca
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary/15 text-primary'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm leading-relaxed ${
                        n.dibaca ? 'text-muted-foreground' : 'text-foreground font-medium'
                      }`}
                    >
                      {n.mesej}
                    </p>
                    {clickable && (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span title={formatTarikhMasa(n.createdAt)}>{relatifMasa(n.createdAt)}</span>
                    {!n.dibaca && (
                      <Badge variant="default" className="text-[10px] py-0 px-1.5">
                        Baharu
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
