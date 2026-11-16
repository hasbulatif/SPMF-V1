'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatTarikh } from '@/lib/api'
import { useSession, useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DocumentMarkdown } from '@/components/document-markdown'
import {
  ArrowLeft,
  Pencil,
  Save,
  RefreshCw,
  AlertCircle,
  Loader2,
  Eye,
  Code,
  Send,
  CheckCircle2,
  XCircle,
  Rocket,
  Undo2,
  ExternalLink,
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

export function StaffDocumentEdit({ documentId }: { documentId: string }) {
  const { user } = useSession()
  const { setView } = useView()
  const { toast } = useToast()
  const peranan = user?.peranan
  const bolehLulus = peranan === 'PENOLONG_KANAN' || peranan === 'ADMIN'

  const [data, setData] = useState<DocData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kandungan, setKandungan] = useState<string>('')
  const [tab, setTab] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [acting, setActing] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<DocData>(`/api/documents/${documentId}`)
      setData(res)
      setKandungan(res.document.kandungan)
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

  async function saveContent() {
    if (!data) return
    setSaving(true)
    try {
      await api('/api/staff/documents', {
        method: 'PATCH',
        body: JSON.stringify({ id: data.document.id, kandungan }),
      })
      toast({ title: 'Kandungan disimpan' })
      await fetchData()
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(status: 'SEMAKAN' | 'DILULUSKAN' | 'DITARIK' | 'DITERBITKAN' | 'DRAFT') {
    if (!data) return
    setActing(true)
    try {
      await api('/api/staff/documents', {
        method: 'PATCH',
        body: JSON.stringify({ id: data.document.id, status }),
      })
      toast({ title: 'Status dikemaskini' })
      await fetchData()
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-[480px] w-full rounded-xl" />
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
  const dirty = kandungan !== doc.kandungan

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setView({ name: 'staff-documents' })}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-lg font-semibold text-foreground truncate">{doc.tajuk}</h2>
            <Badge
              variant="outline"
              className={`text-[10px] ${STATUS_BADGE_CLASS[doc.status] ?? ''}`}
            >
              {doc.statusLabel}
            </Badge>
          </div>
          <div className="ml-9 mt-0.5 text-xs text-muted-foreground">
            {doc.kategoriLabel} &middot; {doc.student.nama} &middot;{' '}
            {doc.student.kelas?.nama ?? `Tahun ${doc.student.tahun}`} &middot;{' '}
            {formatTarikh(doc.tarikh)}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setView({ name: 'staff-document-preview', documentId: doc.id })}>
            <ExternalLink className="h-4 w-4" />
            Pratonton Penuh
          </Button>
        </div>
      </div>

      {/* Editor card */}
      <Card className="p-3 sm:p-4">
        <Tabs value={tab} onValueChange={(v) => setTab(v as 'edit' | 'preview')}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <TabsList>
              <TabsTrigger value="edit">
                <Code className="h-4 w-4" />
                Sunting
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4" />
                Pratonton
              </TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={fetchData} disabled={saving}>
                <RefreshCw className="h-4 w-4" />
                Muat Semula
              </Button>
              <Button size="sm" onClick={saveContent} disabled={saving || !dirty}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan
                  </>
                )}
              </Button>
            </div>
          </div>

          <TabsContent value="edit" className="mt-0">
            <Textarea
              value={kandungan}
              onChange={(e) => setKandungan(e.target.value)}
              className="min-h-96 font-mono text-sm"
              placeholder="Tulis kandungan dokumen dalam markdown..."
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Sokong: tajuk #, ##, ###, senarai -, jadual |...|, **bold**, *italic*.
              {dirty && <span className="text-amber-700"> &middot; Perubahan belum disimpan</span>}
            </p>
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <div className="rounded-md border bg-muted/20 p-4 min-h-96 overflow-auto">
              <DocumentMarkdown content={kandungan} />
            </div>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Workflow actions */}
      <Card className="p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Tindakan Aliran Kerja</h3>
            <p className="text-xs text-muted-foreground">
              Status semasa: <span className="font-medium text-foreground">{doc.statusLabel}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {doc.status === 'DRAFT' && (
              <Button
                size="sm"
                variant="outline"
                disabled={acting}
                onClick={() => updateStatus('SEMAKAN')}
              >
                <Send className="h-4 w-4" />
                Hantar Semakan
              </Button>
            )}
            {doc.status === 'SEMAKAN' && bolehLulus && (
              <>
                <Button size="sm" variant="default" disabled={acting} onClick={() => updateStatus('DILULUSKAN')}>
                  <CheckCircle2 className="h-4 w-4" />
                  Lulus
                </Button>
                <Button size="sm" variant="outline" disabled={acting} onClick={() => updateStatus('DITARIK')}>
                  <XCircle className="h-4 w-4" />
                  Tolak
                </Button>
              </>
            )}
            {doc.status === 'DILULUSKAN' && bolehLulus && (
              <Button size="sm" variant="default" disabled={acting} onClick={() => updateStatus('DITERBITKAN')}>
                <Rocket className="h-4 w-4" />
                Terbitkan
              </Button>
            )}
            {doc.status === 'DITERBITKAN' && bolehLulus && (
              <Button size="sm" variant="outline" disabled={acting} onClick={() => updateStatus('DRAFT')}>
                <Undo2 className="h-4 w-4" />
                Tukar ke Draf
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setView({ name: 'staff-document-preview', documentId: doc.id })}>
              <Pencil className="h-4 w-4" />
              Pratonton
            </Button>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
          <div>
            <div className="text-[10px] uppercase tracking-wide">Kategori</div>
            <div className="text-foreground font-medium">{doc.kategoriLabel}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide">Penggal</div>
            <div className="text-foreground font-medium">{doc.penggal ? `Penggal ${doc.penggal}` : '-'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide">Diterbit Oleh</div>
            <div className="text-foreground font-medium">{doc.diterbitOleh ?? '-'}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wide">Dicipta</div>
            <div className="text-foreground font-medium">{formatTarikh(doc.createdAt)}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
