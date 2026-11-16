'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatTarikh, formatTarikhMasa, buildPdfFileName } from '@/lib/api'
import { useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { DocumentMarkdown } from '@/components/document-markdown'
import { SchoolHeader } from '@/components/school-header'
import {
  ArrowLeft,
  Printer,
  Download,
  Pencil,
  AlertCircle,
} from 'lucide-react'

interface DocData {
  ok: true
  document: {
    id: string
    tajuk: string
    kategori: string
    kategoriLabel: string
    penggal: string | null
    tahun: number
    tarikh: string
    status: string
    statusLabel: string
    kandungan: string
    ringkasan?: string | null
    student: { id: string; nama: string; idMurid: string; tahun: number; kelas: { nama: string } | null }
    diterbitOleh: string | null
    createdAt: string
  }
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  SEMAKAN: 'bg-amber-100 text-amber-800 border-amber-200',
  DILULUSKAN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DITERBITKAN: 'bg-primary text-primary-foreground border-transparent',
  DITARIK: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function StaffDocumentPreview({ documentId }: { documentId: string }) {
  const { setView } = useView()
  const { toast } = useToast()
  const [data, setData] = useState<DocData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<DocData>(`/api/documents/${documentId}`)
      setData(res)
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

  function handlePrint() {
    try {
      window.print()
    } catch {
      /* noop */
    }
  }

  function handleDownload() {
    if (!data) return
    toast({
      title: 'Muat Turun PDF',
      description: 'Pilih "Save as PDF" dalam dialog cetakan untuk menyimpan fail PDF.',
    })
    setTimeout(() => window.print(), 400)
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full max-w-[800px] mx-auto rounded-xl" />
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
        <Button variant="outline" size="sm" onClick={() => setView({ name: 'staff-documents' })}>
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Senarai
        </Button>
      </Card>
    )
  }

  const doc = data.document

  return (
    <div className="space-y-4">
      {/* Action bar */}
      <div className="no-print sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <Button variant="ghost" size="sm" onClick={() => setView({ name: 'staff-documents' })}>
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Button>
          <div className="flex-1 min-w-0 px-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground truncate">{doc.tajuk}</span>
              <Badge
                variant="outline"
                className={`text-[10px] ${STATUS_BADGE_CLASS[doc.status] ?? ''}`}
              >
                {doc.statusLabel}
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {doc.kategoriLabel} &middot; {doc.student.nama} &middot;{' '}
              {doc.student.kelas?.nama ?? `Tahun ${doc.student.tahun}`}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setView({ name: 'staff-document-edit', documentId: doc.id })}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Sunting</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">Cetak</span>
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Muat Turun PDF</span>
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
              Diterbitkan oleh: {doc.diterbitOleh ?? '-'}. Status: {doc.statusLabel}.
            </div>
            <div className="mt-0.5 italic">
              Fail cadangan: {buildPdfFileName(doc.kategori, doc.student.idMurid, doc.penggal ?? undefined)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
