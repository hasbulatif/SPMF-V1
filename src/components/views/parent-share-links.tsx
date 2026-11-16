'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatTarikh, formatTarikhMasa } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { BentoCard } from '@/components/bento-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
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
import {
  Link2,
  Copy,
  Check,
  Clock,
  RefreshCw,
  AlertCircle,
  Trash2,
  Eye,
  ShieldCheck,
  FileText,
} from 'lucide-react'

interface ShareLinkItem {
  id: string
  token: string
  tarikhLuput: string
  dibatalkan: boolean
  bilanganAkses: number
  hadAkses: number | null
  createdAt: string
  url: string
  dokumen: {
    id: string
    tajuk: string
    kategori: string
    student: { nama: string }
  }
  isExpired: boolean
}

interface ShareListResponse {
  ok: true
  links: ShareLinkItem[]
}

export function ParentShareLinks() {
  const { toast } = useToast()
  const [links, setLinks] = useState<ShareLinkItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<ShareLinkItem | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchLinks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<ShareListResponse>('/api/share/list')
      setLinks(res.links)
    } catch (e) {
      const err = e as Error
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchLinks()
  }, [fetchLinks])

  async function handleCopyUrl(link: ShareLinkItem) {
    const fullUrl = `${window.location.origin}${link.url}`
    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopiedId(link.id)
      setTimeout(() => setCopiedId(null), 2000)
      toast({ title: 'Disalin', description: 'Pautan disalin ke papan keratan.' })
    } catch {
      toast({
        title: 'Tidak dapat menyalin',
        description: 'Sila salin secara manual.',
        variant: 'destructive',
      })
    }
  }

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await api(`/api/share/${cancelTarget.token}`, { method: 'DELETE' })
      toast({
        title: 'Pautan dibatalkan',
        description: 'Pautan perkongsian telah dibatalkan.',
      })
      setCancelTarget(null)
      fetchLinks()
    } catch (e) {
      const err = e as Error
      toast({
        title: 'Ralat',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setCancelling(false)
    }
  }

  function statusBadge(link: ShareLinkItem) {
    if (link.dibatalkan) {
      return (
        <Badge variant="destructive" className="text-[11px]">
          Dibatalkan
        </Badge>
      )
    }
    if (link.isExpired) {
      return (
        <Badge variant="secondary" className="text-[11px]">
          Tamat Tempoh
        </Badge>
      )
    }
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-[11px]">
        Aktif
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Skeleton className="col-span-1 sm:col-span-2 lg:col-span-3 h-28 rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 border-destructive/30">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-semibold text-foreground">Tidak dapat memuatkan pautan</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={fetchLinks} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Cuba Semula
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <BentoCard span="full" accent="primary" icon={ShieldCheck} title="Pautan Perkongsian">
        <p className="text-sm text-muted-foreground">
          Pautan perkongsian membenarkan pihak lain (pasangan, agensi) mengakses
          dokumen secara selamat untuk tempoh terhad dengan PIN 6 digit. Setiap pautan
          mempunyai tarikh luput dan had akses yang ditetapkan.
        </p>
      </BentoCard>

      {links.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Link2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tiada pautan perkongsian aktif</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Buka dokumen dan klik butang Kongsi untuk menjana pautan baharu.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link) => {
            const fullUrl = `${window.location.origin}${link.url}`
            const hadAksesLabel =
              link.hadAkses != null
                ? `Diakses ${link.bilanganAkses} / ${link.hadAkses} kali`
                : `Diakses ${link.bilanganAkses} kali`
            return (
              <Card key={link.id} className="p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                  </div>
                  {statusBadge(link)}
                </div>

                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground line-clamp-2">
                    {link.dokumen.tajuk}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {link.dokumen.student.nama}
                  </p>
                </div>

                <div className="rounded-md bg-muted/50 p-2 text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span>Dicipta:</span>
                    <span className="text-foreground/80">{formatTarikh(link.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Luput:</span>
                    <span
                      className={
                        link.isExpired ? 'text-destructive' : 'text-foreground/80'
                      }
                    >
                      {formatTarikh(link.tarikhLuput)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Akses:
                    </span>
                    <span className="text-foreground/80">{hadAksesLabel}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Input
                    readOnly
                    value={fullUrl}
                    className="text-[11px] font-mono h-8"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopyUrl(link)}
                    disabled={link.dibatalkan || link.isExpired}
                    title="Salin pautan"
                  >
                    {copiedId === link.id ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  {!link.dibatalkan && !link.isExpired && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setCancelTarget(link)}
                      title="Batalkan pautan"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog pengesahan pembatalan */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan pautan ini?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak boleh diundur. Penerima tidak akan dapat mengakses
              dokumen melalui pautan ini selepas dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={cancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {cancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
