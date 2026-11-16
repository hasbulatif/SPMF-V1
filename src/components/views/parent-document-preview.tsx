'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  api,
  formatTarikh,
  formatTarikhMasa,
  buildPdfFileName,
} from '@/lib/api'
import { useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DocumentMarkdown } from '@/components/document-markdown'
import { SchoolHeader } from '@/components/school-header'
import {
  ArrowLeft,
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  QrCode,
  Clock,
} from 'lucide-react'

interface DocData {
  ok: true
  document: {
    id: string
    tajuk: string
    kategori: string
    kategoriLabel: string
    penggal: string
    tahun: number
    tarikh: string
    status: string
    statusLabel: string
    kandungan: string
    ringkasan?: string
    student: { id: string; nama: string; idMurid: string; tahun: number; kelas: { nama: string } }
    diterbitOleh: string
    createdAt: string
  }
}

interface ShareLinkResult {
  ok: true
  shareLink: {
    id: string
    token: string
    pin: string
    tarikhLuput: string
    url: string
  }
}

export function ParentDocumentPreview({ documentId }: { documentId: string }) {
  const { setView } = useView()
  const { toast } = useToast()
  const [data, setData] = useState<DocData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const markedReadRef = useRef(false)

  // state untuk dialog kongsi
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTempoh, setShareTempoh] = useState<'1' | '7' | '30'>('7')
  const [shareLoading, setShareLoading] = useState(false)
  const [shareResult, setShareResult] = useState<ShareLinkResult['shareLink'] | null>(null)
  const [copiedField, setCopiedField] = useState<'pin' | 'url' | 'all' | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<DocData>(`/api/documents/${documentId}`)
      setData(res)
      if (!markedReadRef.current) {
        markedReadRef.current = true
        // tandakan dibaca (fire and forget)
        api(`/api/documents/${documentId}/mark-read`, { method: 'POST' }).catch(() => {})
      }
    } catch (e) {
      const err = e as Error
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [documentId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function recordAudit(tindakan: 'MUAT_TURUN' | 'CETAK') {
    api(`/api/documents/${documentId}/mark-read`, {
      method: 'PATCH',
      body: JSON.stringify({ tindakan }),
    }).catch(() => {
      /* bukan kritikal */
    })
  }

  function handlePrint() {
    try {
      recordAudit('CETAK')
      window.print()
    } catch {
      /* noop */
    }
  }

  function handleDownload() {
    try {
      recordAudit('MUAT_TURUN')
      toast({
        title: 'Muat Turun PDF',
        description:
          'Pilih "Save as PDF" dalam dialog cetakan untuk menyimpan fail PDF.',
      })
      // beri masa toast dipaparkan sebelum buka dialog cetakan
      setTimeout(() => window.print(), 400)
    } catch {
      /* noop */
    }
  }

  async function handleCreateShare() {
    setShareLoading(true)
    try {
      const res = await api<ShareLinkResult>('/api/share/create', {
        method: 'POST',
        body: JSON.stringify({
          documentId,
          tempohHari: Number(shareTempoh),
        }),
      })
      setShareResult(res.shareLink)
      toast({
        title: 'Pautan berjaya dijana',
        description: 'Salin pautan dan PIN untuk dikongsi.',
      })
    } catch (e) {
      const err = e as Error
      toast({
        title: 'Ralat',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setShareLoading(false)
    }
  }

  async function copyToClipboard(text: string, field: 'pin' | 'url' | 'all') {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      toast({ title: 'Disalin', description: 'Teks disalin ke papan keratan.' })
    } catch {
      toast({
        title: 'Tidak dapat menyalin',
        description: 'Sila salin secara manual.',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full max-w-[800px] mx-auto rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 border-destructive/30">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-semibold text-foreground">Tidak dapat memuatkan dokumen</h3>
          <p className="text-sm text-muted-foreground mt-1">{error ?? 'Ralat tidak diketahui'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setView({ name: 'parent-documents' })}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Senarai
        </Button>
      </Card>
    )
  }

  const doc = data.document
  const shareUrl = shareResult
    ? `${window.location.origin}${shareResult.url}`
    : ''

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="no-print sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setView({ name: 'parent-documents' })}
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <div className="flex-1 min-w-0 px-2">
            <div className="font-semibold text-foreground truncate">{doc.tajuk}</div>
            <div className="text-xs text-muted-foreground truncate">
              {doc.kategoriLabel} &middot; {doc.student.nama} &middot;{' '}
              {doc.student.kelas?.nama ?? doc.student.tahun}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Cetak</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Muat Turun PDF</span>
            </Button>
            <Button size="sm" onClick={() => setShareOpen(true)}>
              <Share2 className="h-4 w-4" />
              <span className="hidden sm:inline">Kongsi</span>
            </Button>
          </div>
        </div>
      </div>

      {/* A4 paper preview */}
      <div className="overflow-x-auto">
        <div className="print-area a4-paper mx-auto">
          <SchoolHeader />

          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-emerald-700">
                {doc.kategoriLabel}
              </div>
              <h1 className="mt-0.5 text-lg font-bold text-neutral-900">{doc.tajuk}</h1>
              {doc.penggal && (
                <div className="text-[11px] text-neutral-600">
                  Penggal {doc.penggal} &middot; Tahun {doc.tahun}
                </div>
              )}
            </div>
            <div className="text-right text-[11px] text-neutral-600">
              <div>Tarikh: {formatTarikh(doc.tarikh)}</div>
              <div className="mt-0.5">Rujukan: {doc.id.slice(-8).toUpperCase()}</div>
            </div>
          </div>

          <Separator className="my-3 bg-neutral-300" />

          {/* Maklumat murid */}
          <div className="mb-4 grid grid-cols-2 gap-2 text-[12px]">
            <div>
              <span className="text-neutral-500">Nama Murid:</span>{' '}
              <span className="font-medium">{doc.student.nama}</span>
            </div>
            <div>
              <span className="text-neutral-500">No. ID Murid:</span>{' '}
              <span className="font-medium">{doc.student.idMurid}</span>
            </div>
            <div>
              <span className="text-neutral-500">Tahun:</span>{' '}
              <span className="font-medium">{doc.student.tahun}</span>
            </div>
            <div>
              <span className="text-neutral-500">Kelas:</span>{' '}
              <span className="font-medium">{doc.student.kelas?.nama ?? '-'}</span>
            </div>
          </div>

          <DocumentMarkdown content={doc.kandungan} />

          <Separator className="my-6 bg-neutral-300" />

          <div className="mt-6 text-[10px] text-neutral-500">
            <div>
              Dokumen ini dijana oleh Sistem Pengurusan Murid Al Furqan (SPMF) pada{' '}
              {formatTarikhMasa(doc.createdAt)}.
            </div>
            <div className="mt-0.5">
              Diterbitkan oleh: {doc.diterbitOleh}. Status: {doc.statusLabel}.
            </div>
            <div className="mt-0.5 italic">
              Dokumen ini adalah salinan rasmi untuk ibu bapa / penjaga. Sila rujuk
              pejabat sekolah untuk pengesahan lanjut.
            </div>
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog
        open={shareOpen}
        onOpenChange={(open) => {
          setShareOpen(open)
          if (!open) {
            setShareResult(null)
            setShareTempoh('7')
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kongsi Dokumen</DialogTitle>
            <DialogDescription>
              Jana pautan selamat untuk berkongsi dokumen ini dengan pihak lain
              (pasangan, agensi). Penerima perlu memasukkan PIN 6 digit untuk akses.
            </DialogDescription>
          </DialogHeader>

          {!shareResult ? (
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Tempoh Pautan</Label>
                <RadioGroup
                  value={shareTempoh}
                  onValueChange={(v) => setShareTempoh(v as '1' | '7' | '30')}
                  className="grid grid-cols-3 gap-2"
                >
                  {[
                    { v: '1', label: '24 Jam' },
                    { v: '7', label: '7 Hari' },
                    { v: '30', label: '30 Hari' },
                  ].map((opt) => (
                    <label
                      key={opt.v}
                      htmlFor={`tempoh-${opt.v}`}
                      className="flex cursor-pointer items-center justify-center gap-2 rounded-md border p-2 text-sm hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                    >
                      <RadioGroupItem id={`tempoh-${opt.v}`} value={opt.v} />
                      {opt.label}
                    </label>
                  ))}
                </RadioGroup>
              </div>

              <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                <div className="font-medium text-foreground mb-1">{doc.tajuk}</div>
                <div>
                  {doc.student.nama} &middot; {doc.kategoriLabel}
                </div>
              </div>

              <DialogFooter>
                <Button
                  className="w-full"
                  onClick={handleCreateShare}
                  disabled={shareLoading}
                >
                  {shareLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Menjana pautan...
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      Jana Pautan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              {/* PIN */}
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  PIN Perkongsian
                </div>
                <div className="mt-1 font-mono text-2xl font-bold tracking-[0.4em] text-primary">
                  {shareResult.pin}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => copyToClipboard(shareResult.pin, 'pin')}
                >
                  {copiedField === 'pin' ? (
                    <>
                      <Check className="h-3.5 w-3.5" /> Disalin
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Salin PIN
                    </>
                  )}
                </Button>
              </div>

              {/* URL */}
              <div>
                <Label className="mb-1.5 block text-xs">Pautan Perkongsian</Label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={shareUrl}
                    className="font-mono text-xs"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(shareUrl, 'url')}
                  >
                    {copiedField === 'url' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* QR */}
              <div className="flex flex-col items-center gap-2 rounded-lg border bg-muted/30 p-3">
                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5" />
                  Imbas QR untuk akses pantas
                </div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(shareUrl)}`}
                  alt="QR Code perkongsian"
                  width={160}
                  height={160}
                  className="rounded-md bg-white"
                />
              </div>

              {/* Note */}
              <div className="flex items-start gap-2 rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  Pautan ini sah sehingga {formatTarikh(shareResult.tarikhLuput)}. PIN
                  diperlukan untuk akses.
                </span>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  className="sm:flex-1"
                  onClick={() => {
                    setShareOpen(false)
                    setShareResult(null)
                  }}
                >
                  Tutup
                </Button>
                <Button
                  className="sm:flex-1"
                  onClick={() =>
                    copyToClipboard(
                      `${shareUrl}\nPIN: ${shareResult.pin}`,
                      'all'
                    )
                  }
                >
                  {copiedField === 'all' ? (
                    <>
                      <Check className="h-4 w-4" /> Disalin
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" /> Salin Pautan &amp; PIN
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
