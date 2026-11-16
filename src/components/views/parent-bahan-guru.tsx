'use client'

import { useState, useEffect } from 'react'
import { api, formatTarikh, relatifMasa } from '@/lib/api'
import { useView } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { BentoCard } from '@/components/bento-card'
import { useToast } from '@/hooks/use-toast'
import {
  FileText,
  Link2,
  Search,
  ExternalLink,
  Eye,
  GraduationCap,
  Building2,
  Upload,
  Inbox,
  Clock,
} from 'lucide-react'

interface ResourceItem {
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
  isForMyChild: boolean
  isForMyClass: boolean
}

interface AnakLabel {
  id: string
  nama: string
  idMurid: string
  kelas: string
  tahun: number
}

const JENIS_LABEL: Record<string, string> = {
  PDF_UPLOAD: 'Fail PDF',
  GOOGLE_DRIVE: 'Google Drive',
}

export function ParentBahanGuru({ initialStudentId }: { initialStudentId?: string }) {
  const { setView } = useView()
  const { toast } = useToast()
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [anakLabels, setAnakLabels] = useState<AnakLabel[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStudentId, setFilterStudentId] = useState<string>(initialStudentId ?? 'ALL')
  const [search, setSearch] = useState('')

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterStudentId !== 'ALL') params.set('studentId', filterStudentId)
      const res = await api<{ ok: boolean; resources: ResourceItem[]; anakLabels: AnakLabel[] }>(
        `/api/guardian/share-resources${params.toString() ? `?${params.toString()}` : ''}`
      )
      setResources(res.resources)
      setAnakLabels(res.anakLabels)
    } catch (e) {
      toast({ title: 'Ralat', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [filterStudentId])

  const filtered = resources.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.tajuk.toLowerCase().includes(q) ||
      (r.keterangan?.toLowerCase().includes(q) ?? false) ||
      (r.relatedStudentName?.toLowerCase().includes(q) ?? false)
    )
  })

  // Kumpul ikut anak
  const grouped: Record<string, ResourceItem[]> = {}
  for (const r of filtered) {
    const key = r.relatedStudentId ?? '_lain'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(r)
  }

  const totalBahan = resources.length
  const totalPdf = resources.filter((r) => r.jenis === 'PDF_UPLOAD').length
  const totalDrive = resources.filter((r) => r.jenis === 'GOOGLE_DRIVE').length

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Bahan Daripada Guru</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bahan PDF atau pautan Google Drive yang dikongsi oleh guru kelas anak anda.
        </p>
      </div>

      {/* Statistik ringkas */}
      <div className="grid grid-cols-3 gap-3">
        <BentoCard span="sm">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Jumlah Bahan</div>
              <div className="text-xl font-bold">{totalBahan}</div>
            </div>
          </div>
        </BentoCard>
        <BentoCard span="sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-destructive" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Fail PDF</div>
              <div className="text-xl font-bold">{totalPdf}</div>
            </div>
          </div>
        </BentoCard>
        <BentoCard span="sm">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Google Drive</div>
              <div className="text-xl font-bold">{totalDrive}</div>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Penapis */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari bahan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {anakLabels.length > 0 && (
            <Select value={filterStudentId} onValueChange={setFilterStudentId}>
              <SelectTrigger className="sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Anak</SelectItem>
                {anakLabels.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nama} · {a.kelas}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </Card>

      {/* Senarai bahan dikumpul ikut anak */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Inbox className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">
              {search || filterStudentId !== 'ALL'
                ? 'Tiada bahan dijumpai untuk penapis ini.'
                : 'Belum ada bahan dikongsi oleh guru kelas anak anda.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {/* Jika "Semua Anak" - papar berkumpul ikut anak */}
          {filterStudentId === 'ALL' ? (
            Object.entries(grouped).map(([key, items]) => {
              const anak = anakLabels.find((a) => a.id === key)
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center gap-2 sticky top-16 bg-background/95 backdrop-blur py-2 z-10">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-semibold">
                      {anak ? `${anak.nama} · ${anak.kelas}` : 'Bahan Umum'}
                    </h2>
                    <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {items.map((r) => (
                      <ResourceCard key={r.id} resource={r} onView={() => setView({ name: 'parent-bahan-view', resourceId: r.id })} />
                    ))}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filtered.map((r) => (
                <ResourceCard key={r.id} resource={r} onView={() => setView({ name: 'parent-bahan-view', resourceId: r.id })} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ResourceCard({ resource, onView }: { resource: ResourceItem; onView: () => void }) {
  const isPdf = resource.jenis === 'PDF_UPLOAD'
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group" >
      <CardContent className="p-4 space-y-3" onClick={onView}>
        <div className="flex items-start gap-3">
          <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${isPdf ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
            {isPdf ? <FileText className="h-6 w-6" /> : <Link2 className="h-6 w-6" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
              {resource.tajuk}
            </h3>
            <Badge variant="secondary" className="text-[10px] mt-1">
              {JENIS_LABEL[resource.jenis]}
            </Badge>
          </div>
        </div>
        {resource.keterangan && (
          <p className="text-xs text-muted-foreground line-clamp-2">{resource.keterangan}</p>
        )}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap border-t pt-2">
          <span className="flex items-center gap-1">
            {resource.isForMyChild ? <GraduationCap className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
            {resource.sasaranAsalLabel}
          </span>
          <span>·</span>
          <span>{resource.staff}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {relatifMasa(resource.createdAt)}
          </span>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation()
            onView()
          }}
        >
          <Eye className="mr-1 h-3.5 w-3.5" /> Pratonton
        </Button>
      </CardContent>
    </Card>
  )
}
