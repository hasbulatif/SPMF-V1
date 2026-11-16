'use client'

import { useState, useEffect, useRef } from 'react'
import { api, formatTarikh } from '@/lib/api'
import { useView } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import {
  ArrowLeft,
  FileText,
  Link2,
  ExternalLink,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  GraduationCap,
  Building2,
  User,
} from 'lucide-react'

interface ResourceDetail {
  id: string
  tajuk: string
  keterangan: string | null
  jenis: 'PDF_UPLOAD' | 'GOOGLE_DRIVE'
  failUrl: string | null
  failName: string | null
  googleUrl: string | null
  googlePreviewUrl: string | null
  createdAt: string
  staff: string
  relatedStudentId: string | null
  relatedStudentName: string | null
  sasaranAsalLabel: string
}

export function ParentBahanView({ resourceId }: { resourceId: string }) {
  const { setView } = useView()
  const { toast } = useToast()
  const [resource, setResource] = useState<ResourceDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const recordedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Kita perlu fetch resource ini dari guardian share-resources endpoint
        // yang sudah difilter - tapi kita perlukan endpoint detail tunggal
        // Untuk prototaip, panggil list endpoint dan cari ID yang betul
        const res = await api<{ ok: boolean; resources: ResourceDetail[]; anakLabels: unknown[] }>(
          '/api/guardian/share-resources'
        )
        const found = res.resources.find((r) => r.id === resourceId)
        if (!found) {
          throw new Error('Bahan tidak dijumpai atau anda tidak mempunyai akses.')
        }
        if (!cancelled) {
          setResource(found)
          // Catat audit (sekali sahaja)
          if (!recordedRef.current) {
            recordedRef.current = true
            fetch(`/api/guardian/share-resources/${resourceId}/view`, { method: 'POST' }).catch(() => {})
          }
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [resourceId])

  function handlePrint() {
    window.print()
  }

  function handleDownload() {
    if (!resource?.failUrl) return
    const a = document.createElement('a')
    a.href = resource.failUrl
    a.download = resource.failName ?? 'bahan.pdf'
    a.click()
    toast({ title: 'Muat turun dimulakan' })
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !resource) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="py-10 text-center space-y-3">
          <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
          <p className="text-sm">{error ?? 'Bahan tidak dijumpai'}</p>
          <Button onClick={() => setView({ name: 'parent-bahan-guru' })} variant="outline">
            <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
          </Button>
        </CardContent>
      </Card>
    )
  }

  const isPdf = resource.jenis === 'PDF_UPLOAD'

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="no-print sticky top-16 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-b flex flex-col sm:flex-row sm:items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => setView({ name: 'parent-bahan-guru' })}>
          <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-bold truncate">{resource.tajuk}</h1>
          <p className="text-[11px] text-muted-foreground truncate">
            Dikongsi oleh {resource.staff} · {formatTarikh(resource.createdAt)}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isPdf ? (
            <>
              <Button size="sm" variant="outline" onClick={() => window.open(resource.failUrl!, '_blank')}>
                <ExternalLink className="mr-1 h-3.5 w-3.5" /> Buka Tab Baru
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="mr-1 h-3.5 w-3.5" /> Cetak
              </Button>
              <Button size="sm" onClick={handleDownload}>
                <Download className="mr-1 h-3.5 w-3.5" /> Muat Turun
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => window.open(resource.googleUrl!, '_blank')}>
              <ExternalLink className="mr-1 h-3.5 w-3.5" /> Buka di Google Drive
            </Button>
          )}
        </div>
      </div>

      {/* Maklumat bahan */}
      <Card className="no-print">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${isPdf ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
              {isPdf ? <FileText className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold">{resource.tajuk}</h2>
              {resource.keterangan && (
                <p className="text-sm text-muted-foreground mt-1">{resource.keterangan}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3">
            <div className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" />
              <span>Dikongsi oleh: <strong className="text-foreground">{resource.staff}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              {resource.relatedStudentName ? (
                <>
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Untuk anak: <strong className="text-foreground">{resource.relatedStudentName}</strong></span>
                </>
              ) : (
                <>
                  <Building2 className="h-3.5 w-3.5" />
                  <span>{resource.sasaranAsalLabel}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium">{formatTarikh(resource.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pratonton PDF / Google Drive */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-muted/40 px-4 py-2 border-b flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {isPdf ? <FileText className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              Pratonton {isPdf ? 'PDF' : 'Google Drive'}
            </span>
            <Badge variant="outline" className="text-[10px]">
              {isPdf ? resource.failName : 'Embed Drive'}
            </Badge>
          </div>
          <div className="bg-neutral-200 dark:bg-neutral-900 min-h-[600px] flex items-center justify-center">
            {isPdf && resource.failUrl ? (
              <iframe
                src={`${resource.failUrl}#toolbar=1&view=FitH`}
                title={resource.tajuk}
                className="w-full h-[80vh] bg-white"
                style={{ minHeight: '600px' }}
              />
            ) : !isPdf && resource.googlePreviewUrl ? (
              <iframe
                src={resource.googlePreviewUrl}
                title={resource.tajuk}
                className="w-full h-[80vh]"
                style={{ minHeight: '600px' }}
                allow="autoplay"
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground p-8">
                <AlertCircle className="mx-auto h-8 w-8 mb-2 opacity-50" />
                Pratonton tidak tersedia.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
