'use client'

import { useEffect, useState } from 'react'
import { api, KATEGORI_OPTIONS } from '@/lib/api'
import { useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { BentoCard } from '@/components/bento-card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Loader2,
  Save,
  User,
  Users,
  GraduationCap,
} from 'lucide-react'

interface StudentItem {
  id: string
  idMurid: string
  nama: string
  tahun: number
  kelas: { id: string; nama: string } | null
}
interface ClassItem {
  id: string
  nama: string
  tahun: number
}
interface StudentsResp { ok: true; students: StudentItem[] }
interface ClassesResp { ok: true; classes: ClassItem[] }
interface CreateResp { ok: true; documentId?: string; count?: number }

type Target = 'student' | 'class' | 'year'

export function StaffDocumentCreate() {
  const { setView } = useView()
  const { toast } = useToast()
  const [students, setStudents] = useState<StudentItem[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loadingMeta, setLoadingMeta] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [target, setTarget] = useState<Target>('student')
  const [studentId, setStudentId] = useState<string>('')
  const [kelasId, setKelasId] = useState<string>('')
  const [tahunYear, setTahunYear] = useState<string>('')
  const [kategori, setKategori] = useState<string>('')
  const [tajuk, setTajuk] = useState<string>('')
  const [penggal, setPenggal] = useState<string>('TIADA')
  const [initialStatus, setInitialStatus] = useState<string>('DRAFT')
  const [kandungan, setKandungan] = useState<string>('')

  useEffect(() => {
    Promise.all([
      api<StudentsResp>('/api/staff/students').then((r) => r.students).catch(() => []),
      api<ClassesResp>('/api/staff/classes').then((r) => r.classes).catch(() => []),
    ])
      .then(([s, c]) => {
        setStudents(s)
        setClasses(c)
      })
      .finally(() => setLoadingMeta(false))
  }, [])

  async function handleSubmit() {
    if (!kategori) {
      toast({ title: 'Pilih kategori', variant: 'destructive' })
      return
    }
    if (!tajuk.trim()) {
      toast({ title: 'Tajuk diperlukan', variant: 'destructive' })
      return
    }
    if (target === 'student' && !studentId) {
      toast({ title: 'Pilih murid', variant: 'destructive' })
      return
    }
    if (target === 'class' && !kelasId) {
      toast({ title: 'Pilih kelas', variant: 'destructive' })
      return
    }
    if (target === 'year' && !tahunYear) {
      toast({ title: 'Pilih tahun', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        kategori,
        tajuk: tajuk.trim(),
        target,
        status: initialStatus,
        penggal: penggal === 'TIADA' ? null : penggal,
        ...(kandungan.trim() ? { kandungan: kandungan.trim() } : {}),
      }
      if (target === 'student') body.studentId = studentId
      if (target === 'class') body.kelasId = kelasId
      if (target === 'year') body.tahunYear = Number(tahunYear)

      const res = await api<CreateResp>('/api/staff/documents', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (res.count !== undefined) {
        toast({
          title: 'Dokumen berjaya dicipta',
          description: `${res.count} dokumen dijana untuk ${target === 'class' ? 'kelas' : 'tahun'} tersebut.`,
        })
      } else {
        toast({ title: 'Dokumen berjaya dicipta' })
      }
      setView({ name: 'staff-documents' })
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingMeta) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-[480px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Cipta Dokumen Baharu</h2>
          <p className="text-sm text-muted-foreground">
            Pilih sasaran dan isi butiran dokumen.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setView({ name: 'staff-documents' })}>
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>
      </div>

      <BentoCard
        span="full"
        title="Butiran Dokumen"
        icon={Save}
        accent="primary"
      >
        <div className="space-y-4">
          {/* Target selector */}
          <div>
            <Label className="mb-2 block">Sasaran Dokumen</Label>
            <RadioGroup
              value={target}
              onValueChange={(v) => setTarget(v as Target)}
              className="grid grid-cols-3 gap-2"
            >
              {[
                { v: 'student', label: 'Murid Tunggal', icon: User },
                { v: 'class', label: 'Kelas', icon: Users },
                { v: 'year', label: 'Tahun', icon: GraduationCap },
              ].map((opt) => (
                <label
                  key={opt.v}
                  htmlFor={`target-${opt.v}`}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-md border p-3 text-sm hover:bg-accent transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <opt.icon className="h-4 w-4" />
                  <RadioGroupItem id={`target-${opt.v}`} value={opt.v} />
                  {opt.label}
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Dynamic target picker */}
          {target === 'student' && (
            <div>
              <Label htmlFor="student-select" className="mb-1.5 block">Pilih Murid</Label>
              <Select value={studentId} onValueChange={setStudentId}>
                <SelectTrigger id="student-select" className="w-full">
                  <SelectValue placeholder="Cari dan pilih murid" />
                </SelectTrigger>
                <SelectContent>
                  {students.length === 0 ? (
                    <SelectItem value="_none" disabled>Tiada murid tersedia</SelectItem>
                  ) : (
                    students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nama} ({s.idMurid}) &middot; {s.kelas?.nama ?? `Tahun ${s.tahun}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {target === 'class' && (
            <div>
              <Label htmlFor="class-select" className="mb-1.5 block">Pilih Kelas</Label>
              <Select value={kelasId} onValueChange={setKelasId}>
                <SelectTrigger id="class-select" className="w-full">
                  <SelectValue placeholder="Pilih kelas" />
                </SelectTrigger>
                <SelectContent>
                  {classes.length === 0 ? (
                    <SelectItem value="_none" disabled>Tiada kelas tersedia</SelectItem>
                  ) : (
                    classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nama} (Tahun {c.tahun})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {kelasId && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Dokumen akan dijana untuk setiap murid dalam kelas ini.
                </p>
              )}
            </div>
          )}

          {target === 'year' && (
            <div>
              <Label htmlFor="year-select" className="mb-1.5 block">Pilih Tahun Darjah</Label>
              <Select value={tahunYear} onValueChange={setTahunYear}>
                <SelectTrigger id="year-select" className="w-full">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((t) => (
                    <SelectItem key={t} value={String(t)}>
                      Tahun {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {tahunYear && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Dokumen akan dijana untuk setiap murid dalam tahun ini.
                </p>
              )}
            </div>
          )}

          {/* Kategori */}
          <div>
            <Label htmlFor="kategori-select" className="mb-1.5 block">Kategori Dokumen</Label>
            <Select value={kategori} onValueChange={setKategori}>
              <SelectTrigger id="kategori-select" className="w-full">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {KATEGORI_OPTIONS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tajuk */}
          <div>
            <Label htmlFor="tajuk-input" className="mb-1.5 block">Tajuk Dokumen</Label>
            <Input
              id="tajuk-input"
              value={tajuk}
              onChange={(e) => setTajuk(e.target.value)}
              placeholder="cth. Laporan Kemajuan Penggal 1"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="penggal-select" className="mb-1.5 block">Penggal</Label>
              <Select value={penggal} onValueChange={setPenggal}>
                <SelectTrigger id="penggal-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TIADA">Tiada</SelectItem>
                  <SelectItem value="1">Penggal 1</SelectItem>
                  <SelectItem value="2">Penggal 2</SelectItem>
                  <SelectItem value="3">Penggal 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-select" className="mb-1.5 block">Status Awal</Label>
              <Select value={initialStatus} onValueChange={setInitialStatus}>
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Draf (simpan untuk sunting kemudian)</SelectItem>
                  <SelectItem value="SEMAKAN">Hantar untuk Semakan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kandungan */}
          <div>
            <Label htmlFor="kandungan-input" className="mb-1.5 block">
              Kandungan (Markdown) - Opsyenal
            </Label>
            <Textarea
              id="kandungan-input"
              value={kandungan}
              onChange={(e) => setKandungan(e.target.value)}
              placeholder="Biarkan kosong untuk menjana templat automatik berdasarkan kategori."
              className="min-h-32 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Sokong: tajuk #, senarai -, jadual |...|, penekanan **bold**.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setView({ name: 'staff-documents' })}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mencipta...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Cipta Dokumen
                </>
              )}
            </Button>
          </div>
        </div>
      </BentoCard>
    </div>
  )
}
