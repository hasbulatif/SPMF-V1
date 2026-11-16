'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { api, formatTarikh } from '@/lib/api'
import { useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileText,
  Search,
  Award,
  Receipt,
  ScrollText,
  ClipboardList,
  CalendarCheck,
  FileCheck2,
  Inbox,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface DocItem {
  id: string
  tajuk: string
  kategori: string
  kategoriLabel: string
  penggal: string
  tahun: number
  tarikh: string
  status: string
  dibaca: boolean
  baharu: boolean
  student: { id: string; nama: string; idMurid: string; tahun: number; kelas: string }
}

interface StudentItem {
  id: string
  idMurid: string
  nama: string
  tahun: number
  kelas: string
  jantina: 'L' | 'P'
  isPrimary: boolean
}

interface DocumentsResponse {
  ok: true
  documents: DocItem[]
  filters: {
    kategori: { value: string; label: string }[]
    penggal: string[]
    tahun: number[]
  }
}

interface StudentsResponse {
  ok: true
  students: StudentItem[]
}

const KATEGORI_ICON: Record<string, LucideIcon> = {
  LAPORAN_KEMAJUAN: FileText,
  SLIP_KEPUTUSAN: ClipboardList,
  SURAT_PENGESAHAN: FileCheck2,
  SURAT_EDARAN: ScrollText,
  RESIT_YURAN: Receipt,
  REKOD_KEHADIRAN: CalendarCheck,
  SIJIL: Award,
  BORANG: ClipboardList,
}

function kategoriIcon(kategori: string): LucideIcon {
  return KATEGORI_ICON[kategori] ?? FileText
}

export function ParentDocumentsList({ initialStudentId }: { initialStudentId?: string }) {
  const { setView } = useView()
  const { toast } = useToast()
  const [documents, setDocuments] = useState<DocItem[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [filters, setFilters] = useState<{
    kategori: { value: string; label: string }[]
    penggal: string[]
    tahun: number[]
  }>({ kategori: [], penggal: [], tahun: [] })

  const [selectedStudent, setSelectedStudent] = useState<string>(initialStudentId ?? 'all')
  const [selectedKategori, setSelectedKategori] = useState<string>('all')
  const [selectedPenggal, setSelectedPenggal] = useState<string>('all')
  const [selectedTahun, setSelectedTahun] = useState<string>('all')
  const [query, setQuery] = useState('')
  const debouncedQuery = useRef<string>('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (selectedStudent !== 'all') params.set('studentId', selectedStudent)
      if (selectedKategori !== 'all') params.set('kategori', selectedKategori)
      if (selectedPenggal !== 'all') params.set('penggal', selectedPenggal)
      if (selectedTahun !== 'all') params.set('tahun', selectedTahun)
      if (debouncedQuery.current) params.set('q', debouncedQuery.current)

      const res = await api<DocumentsResponse>(`/api/guardian/documents?${params.toString()}`)
      setDocuments(res.documents)
      setFilters(res.filters)
    } catch (e) {
      const err = e as Error
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [selectedStudent, selectedKategori, selectedPenggal, selectedTahun])

  useEffect(() => {
    api<StudentsResponse>('/api/guardian/students')
      .then((res) => setStudents(res.students))
      .catch(() => {
        /* bukan kritikal - senarai pelajar tidak wajib */
      })
  }, [])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // debounce carian
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
  }, [query])

  return (
    <div className="space-y-4">
      <Card className="no-print sticky top-0 z-30 p-3 sm:p-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 shadow-sm border-border/60">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari dokumen..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Anak" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Anak</SelectItem>
              {students.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nama} ({s.kelas})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedKategori} onValueChange={setSelectedKategori}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {filters.kategori.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedPenggal} onValueChange={setSelectedPenggal}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Penggal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Penggal</SelectItem>
                {filters.penggal.map((p) => (
                  <SelectItem key={p} value={p}>
                    Penggal {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTahun} onValueChange={setSelectedTahun}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tahun" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tahun</SelectItem>
                {filters.tahun.map((t) => (
                  <SelectItem key={t} value={String(t)}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

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

      {!error && loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-xl" />
          ))}
        </div>
      )}

      {!error && !loading && documents.length === 0 && (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tiada dokumen dijumpai</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cuba ubah penapis carian atau pilih anak yang lain.
            </p>
          </div>
        </Card>
      )}

      {!error && !loading && documents.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((d) => {
            const Icon = kategoriIcon(d.kategori)
            return (
              <Card
                key={d.id}
                role="button"
                tabIndex={0}
                onClick={() =>
                  setView({ name: 'parent-document-preview', documentId: d.id })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setView({ name: 'parent-document-preview', documentId: d.id })
                  }
                }}
                className="group relative cursor-pointer overflow-hidden p-4 transition-all hover:shadow-md hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  {d.baharu && (
                    <Badge variant="destructive" className="text-[10px]">
                      BAHARU
                    </Badge>
                  )}
                </div>
                <h3 className="mt-3 font-medium text-foreground line-clamp-2 text-sm">
                  {d.tajuk}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge variant="secondary" className="text-[11px]">
                    {d.kategoriLabel}
                  </Badge>
                  {d.penggal && (
                    <Badge variant="outline" className="text-[11px]">
                      Penggal {d.penggal}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[11px]">
                    {d.tahun}
                  </Badge>
                </div>
                <div className="mt-3 border-t pt-2 text-xs text-muted-foreground space-y-0.5">
                  <div className="font-medium text-foreground/80 truncate">
                    {d.student.nama}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px]">{d.student.kelas}</span>
                    <span className="text-[11px]">{formatTarikh(d.tarikh)}</span>
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
