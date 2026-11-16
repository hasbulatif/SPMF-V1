'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import {
  api,
  KATEGORI_OPTIONS,
  STATUS_OPTIONS,
  STATUS_LABEL,
  formatTarikh,
  relatifMasa,
} from '@/lib/api'
import { useSession, useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Plus,
  Search,
  RefreshCw,
  AlertCircle,
  Inbox,
  FileText,
  Pencil,
  Send,
  CheckCircle2,
  XCircle,
  Rocket,
} from 'lucide-react'

interface DocItem {
  id: string
  tajuk: string
  kategori: string
  kategoriLabel: string
  penggal: string | null
  tahun: number
  tarikh: string
  status: string
  statusLabel: string
  createdAt: string
  student: { id: string; nama: string; idMurid: string; tahun: number; kelas: { nama: string } | null }
  diterbitOleh: string | null
}

interface DocsResponse {
  ok: true
  documents: DocItem[]
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  SEMAKAN: 'bg-amber-100 text-amber-800 border-amber-200',
  DILULUSKAN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DITERBITKAN: 'bg-primary text-primary-foreground border-transparent',
  DITARIK: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function StaffDocuments() {
  const { user } = useSession()
  const { setView } = useView()
  const { toast } = useToast()
  const peranan = user?.peranan
  const bolehLulus = peranan === 'PENOLONG_KANAN' || peranan === 'ADMIN'

  const [documents, setDocuments] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [kategoriFilter, setKategoriFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const debouncedQuery = useRef<string>('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (kategoriFilter !== 'all') params.set('kategori', kategoriFilter)
      if (debouncedQuery.current) params.set('q', debouncedQuery.current)

      const res = await api<DocsResponse>(`/api/staff/documents?${params.toString()}`)
      setDocuments(res.documents)
    } catch (e) {
      const err = e as Error
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, kategoriFilter])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (debouncedQuery.current !== query) {
        debouncedQuery.current = query
        fetchDocuments()
      }
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, fetchDocuments])

  async function updateStatus(doc: DocItem, status: 'SEMAKAN' | 'DILULUSKAN' | 'DITARIK' | 'DITERBITKAN' | 'DRAFT') {
    setActingId(doc.id)
    try {
      await api('/api/staff/documents', {
        method: 'PATCH',
        body: JSON.stringify({ id: doc.id, status }),
      })
      toast({
        title: 'Status dikemaskini',
        description: `${doc.tajuk} kini: ${STATUS_LABEL[status] ?? status}`,
      })
      await fetchDocuments()
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setActingId(null)
    }
  }

  const filteredDocs = documents

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pengurusan Dokumen</h2>
          <p className="text-sm text-muted-foreground">
            Cipta, sunting dan urus aliran kerja dokumen.
          </p>
        </div>
        <Button size="sm" onClick={() => setView({ name: 'staff-document-create' })}>
          <Plus className="h-4 w-4" />
          Cipta Dokumen Baharu
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="p-3 sm:p-4 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari dokumen mengikut tajuk..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={kategoriFilter} onValueChange={setKategoriFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {KATEGORI_OPTIONS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-6 flex flex-col items-center justify-center text-center gap-3 border-destructive/30">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchDocuments} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
            Cuba Semula
          </Button>
        </Card>
      )}

      {/* Loading */}
      {!error && loading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!error && !loading && filteredDocs.length === 0 && (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tiada dokumen dijumpai</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cuba ubah penapis carian atau cipta dokumen baharu.
            </p>
          </div>
          <Button size="sm" onClick={() => setView({ name: 'staff-document-create' })}>
            <Plus className="h-4 w-4" />
            Cipta Dokumen
          </Button>
        </Card>
      )}

      {/* Desktop table */}
      {!error && !loading && filteredDocs.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tajuk</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Murid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tarikh</TableHead>
                  <TableHead>Diterbit Oleh</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocs.map((d) => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer hover:bg-accent/40"
                    onClick={() => setView({ name: 'staff-document-preview', documentId: d.id })}
                  >
                    <TableCell className="max-w-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-medium text-foreground truncate">{d.tajuk}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.kategoriLabel}
                      {d.penggal && <span className="block text-[10px]">Penggal {d.penggal}</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="text-foreground">{d.student.nama}</div>
                      <div className="text-muted-foreground">{d.student.kelas?.nama ?? '-'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${STATUS_BADGE_CLASS[d.status] ?? ''}`}
                      >
                        {d.statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTarikh(d.tarikh)}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {d.diterbitOleh ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div
                        className="flex justify-end gap-1 flex-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {d.status === 'DRAFT' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={actingId === d.id}
                            onClick={() => updateStatus(d, 'SEMAKAN')}
                          >
                            <Send className="h-3 w-3" />
                            Hantar Semakan
                          </Button>
                        )}
                        {d.status === 'SEMAKAN' && bolehLulus && (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              className="h-7 text-xs"
                              disabled={actingId === d.id}
                              onClick={() => updateStatus(d, 'DILULUSKAN')}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              Lulus
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={actingId === d.id}
                              onClick={() => updateStatus(d, 'DITARIK')}
                            >
                              <XCircle className="h-3 w-3" />
                              Tolak
                            </Button>
                          </>
                        )}
                        {d.status === 'DILULUSKAN' && bolehLulus && (
                          <Button
                            size="sm"
                            variant="default"
                            className="h-7 text-xs"
                            disabled={actingId === d.id}
                            onClick={() => updateStatus(d, 'DITERBITKAN')}
                          >
                            <Rocket className="h-3 w-3" />
                            Terbit
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => setView({ name: 'staff-document-edit', documentId: d.id })}
                        >
                          <Pencil className="h-3 w-3" />
                          Sunting
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredDocs.map((d) => (
              <Card key={d.id} className="p-3">
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => setView({ name: 'staff-document-preview', documentId: d.id })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-foreground text-sm truncate">{d.tajuk}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {d.kategoriLabel}
                        {d.penggal && ` &middot; Penggal ${d.penggal}`}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] shrink-0 ${STATUS_BADGE_CLASS[d.status] ?? ''}`}
                    >
                      {d.statusLabel}
                    </Badge>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    {d.student.nama} &middot; {d.student.kelas?.nama ?? '-'}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground">
                    {formatTarikh(d.tarikh)} &middot; {d.diterbitOleh ?? '-'}
                  </div>
                </button>
                <div className="mt-2 flex flex-wrap gap-1.5 border-t pt-2">
                  {d.status === 'DRAFT' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      disabled={actingId === d.id}
                      onClick={() => updateStatus(d, 'SEMAKAN')}
                    >
                      <Send className="h-3 w-3" />
                      Hantar Semakan
                    </Button>
                  )}
                  {d.status === 'SEMAKAN' && bolehLulus && (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        disabled={actingId === d.id}
                        onClick={() => updateStatus(d, 'DILULUSKAN')}
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Lulus
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={actingId === d.id}
                        onClick={() => updateStatus(d, 'DITARIK')}
                      >
                        <XCircle className="h-3 w-3" />
                        Tolak
                      </Button>
                    </>
                  )}
                  {d.status === 'DILULUSKAN' && bolehLulus && (
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 text-xs"
                      disabled={actingId === d.id}
                      onClick={() => updateStatus(d, 'DITERBITKAN')}
                    >
                      <Rocket className="h-3 w-3" />
                      Terbit
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setView({ name: 'staff-document-edit', documentId: d.id })}
                  >
                    <Pencil className="h-3 w-3" />
                    Sunting
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
