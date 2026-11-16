'use client'

import { useState, useEffect, useRef } from 'react'
import { api, formatTarikh } from '@/lib/api'
import { useView, useSession } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { BentoCard } from '@/components/bento-card'
import { useToast } from '@/hooks/use-toast'
import {
  Upload,
  Link2,
  FileText,
  Trash2,
  Search,
  Loader2,
  Users,
  GraduationCap,
  Building2,
  ExternalLink,
  Info,
  Plus,
  RefreshCw,
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
  studentId: string | null
  kelasId: string | null
  createdAt: string
  staff: string
  student: { id: string; nama: string; idMurid: string; kelas: string } | null
  kelas: { id: string; nama: string; tahun: number } | null
  sasaranLabel: string
}

interface StudentOption {
  id: string
  idMurid: string
  nama: string
  tahun: number
  kelas: { id: string; nama: string }
}

interface ClassOption {
  id: string
  nama: string
  tahun: number
  jumlahMurid: number
}

const JENIS_LABEL: Record<string, string> = {
  PDF_UPLOAD: 'Fail PDF',
  GOOGLE_DRIVE: 'Pautan Google Drive',
}

export function StaffShareResources() {
  const { user } = useSession()
  const { toast } = useToast()
  const [resources, setResources] = useState<ResourceItem[]>([])
  const [students, setStudents] = useState<StudentOption[]>([])
  const [classes, setClasses] = useState<ClassOption[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  // borang
  const [tajuk, setTajuk] = useState('')
  const [keterangan, setKeterangan] = useState('')
  const [jenis, setJenis] = useState<'PDF_UPLOAD' | 'GOOGLE_DRIVE'>('PDF_UPLOAD')
  const [target, setTarget] = useState<'student' | 'class'>('student')
  const [studentId, setStudentId] = useState('')
  const [kelasId, setKelasId] = useState('')
  const [googleUrl, setGoogleUrl] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  async function loadAll() {
    setLoading(true)
    try {
      const [r, s, c] = await Promise.all([
        api<{ ok: boolean; resources: ResourceItem[] }>('/api/staff/share-resources'),
        api<{ ok: boolean; students: StudentOption[] }>('/api/staff/students'),
        api<{ ok: boolean; classes: ClassOption[] }>('/api/staff/classes'),
      ])
      setResources(r.resources)
      setStudents(s.students)
      setClasses(c.classes)
    } catch (e) {
      toast({ title: 'Ralat', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  function resetForm() {
    setTajuk('')
    setKeterangan('')
    setJenis('PDF_UPLOAD')
    setTarget('student')
    setStudentId('')
    setKelasId('')
    setGoogleUrl('')
    setSelectedFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!tajuk) {
      toast({ title: 'Tajuk diperlukan', variant: 'destructive' })
      return
    }
    if (jenis === 'PDF_UPLOAD' && !selectedFile) {
      toast({ title: 'Fail PDF diperlukan', variant: 'destructive' })
      return
    }
    if (jenis === 'GOOGLE_DRIVE' && !googleUrl) {
      toast({ title: 'URL Google Drive diperlukan', variant: 'destructive' })
      return
    }
    if (target === 'student' && !studentId) {
      toast({ title: 'Pilih murid terlebih dahulu', variant: 'destructive' })
      return
    }
    if (target === 'class' && !kelasId) {
      toast({ title: 'Pilih kelas terlebih dahulu', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('tajuk', tajuk)
      formData.append('keterangan', keterangan)
      formData.append('jenis', jenis)
      formData.append('target', target)
      formData.append('studentId', studentId)
      formData.append('kelasId', kelasId)
      if (jenis === 'GOOGLE_DRIVE') {
        formData.append('googleUrl', googleUrl)
      }
      if (jenis === 'PDF_UPLOAD' && selectedFile) {
        formData.append('fail', selectedFile)
      }

      // fetch manual sebab api() menghantar JSON
      const res = await fetch('/api/staff/share-resources', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || json.ok === false) {
        throw new Error(json.error ?? 'Gagal menyimpan bahan')
      }
      toast({
        title: 'Bahan berjaya dikongsi',
        description: target === 'student'
          ? `Bahan dihantar kepada ibu bapa ${students.find((s) => s.id === studentId)?.nama ?? ''}.`
          : `Bahan dihantar kepada seluruh ibu bapa kelas ${classes.find((c) => c.id === kelasId)?.nama ?? ''}.`,
      })
      resetForm()
      setFormOpen(false)
      loadAll()
    } catch (e) {
      toast({ title: 'Ralat', description: (e as Error).message, variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await api(`/api/staff/share-resources/${deleteTarget.id}`, { method: 'DELETE' })
      toast({ title: 'Bahan dipadam' })
      setDeleteTarget(null)
      loadAll()
    } catch (e) {
      toast({ title: 'Ralat', description: (e as Error).message, variant: 'destructive' })
    }
  }

  const filtered = resources.filter((r) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      r.tajuk.toLowerCase().includes(q) ||
      (r.keterangan?.toLowerCase().includes(q) ?? false) ||
      r.sasaranLabel.toLowerCase().includes(q)
    )
  })

  const totalForStudents = resources.filter((r) => r.studentId).length
  const totalForClass = resources.filter((r) => !r.studentId && r.kelasId).length
  const totalPdf = resources.filter((r) => r.jenis === 'PDF_UPLOAD').length
  const totalDrive = resources.filter((r) => r.jenis === 'GOOGLE_DRIVE').length

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Kongsi Bahan kepada Ibu Bapa</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Muat naik PDF atau kongsi pautan Google Drive terus kepada ibu bapa tertentu atau seluruh kelas.
            Tidak perlu key in laporan di sini.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`mr-1 h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Muat Semula
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setFormOpen((o) => !o) }}>
            <Plus className="mr-1 h-4 w-4" /> Kongsi Bahan Baharu
          </Button>
        </div>
      </div>

      {/* Statistik ringkas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <BentoCard span="sm">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Jumlah Bahan</div>
              <div className="text-xl font-bold">{resources.length}</div>
            </div>
          </div>
        </BentoCard>
        <BentoCard span="sm">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Untuk Murid</div>
              <div className="text-xl font-bold">{totalForStudents}</div>
            </div>
          </div>
        </BentoCard>
        <BentoCard span="sm">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Untuk Kelas</div>
              <div className="text-xl font-bold">{totalForClass}</div>
            </div>
          </div>
        </BentoCard>
        <BentoCard span="sm">
          <div className="flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary" />
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">PDF / Drive</div>
              <div className="text-xl font-bold">{totalPdf} / {totalDrive}</div>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Borang kongsi bahan (collapsible) */}
      {formOpen && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Kongsi Bahan Baharu</CardTitle>
            <CardDescription>
              Pilih jenis bahan dan sasaran penerima. Ibu bapa akan dapat melihat bahan ini dalam portal mereka.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Jenis bahan */}
              <div className="space-y-2">
                <Label>Jenis Bahan</Label>
                <RadioGroup
                  value={jenis}
                  onValueChange={(v) => setJenis(v as 'PDF_UPLOAD' | 'GOOGLE_DRIVE')}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${jenis === 'PDF_UPLOAD' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                    <RadioGroupItem value="PDF_UPLOAD" />
                    <Upload className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Muat Naik PDF</div>
                      <div className="text-[11px] text-muted-foreground">Fail PDF tempatan (maks 10 MB)</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${jenis === 'GOOGLE_DRIVE' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                    <RadioGroupItem value="GOOGLE_DRIVE" />
                    <Link2 className="h-4 w-4 text-primary" />
                    <div>
                      <div className="text-sm font-medium">Pautan Google Drive</div>
                      <div className="text-[11px] text-muted-foreground">Tampal URL share Google Drive</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              {/* Sasaran */}
              <div className="space-y-2">
                <Label>Sasaran Penerima</Label>
                <RadioGroup
                  value={target}
                  onValueChange={(v) => setTarget(v as 'student' | 'class')}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${target === 'student' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                    <RadioGroupItem value="student" />
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <div className="text-sm font-medium">Murid Tertentu</div>
                  </label>
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${target === 'class' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                    <RadioGroupItem value="class" />
                    <Building2 className="h-4 w-4 text-primary" />
                    <div className="text-sm font-medium">Seluruh Kelas</div>
                  </label>
                </RadioGroup>
              </div>

              {/* Pemilih murid atau kelas */}
              {target === 'student' ? (
                <div className="space-y-2">
                  <Label htmlFor="studentId">Pilih Murid</Label>
                  <Select value={studentId} onValueChange={setStudentId}>
                    <SelectTrigger id="studentId">
                      <SelectValue placeholder="Cari dan pilih murid..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nama} · {s.idMurid} · {s.kelas.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Hanya ibu bapa murid ini akan dapat melihat bahan tersebut.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="kelasId">Pilih Kelas</Label>
                  <Select value={kelasId} onValueChange={setKelasId}>
                    <SelectTrigger id="kelasId">
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nama} · Tahun {c.tahun} · {c.jumlahMurid} murid
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    Semua ibu bapa murid dalam kelas ini akan menerima bahan tersebut.
                  </p>
                </div>
              )}

              {/* Tajuk */}
              <div className="space-y-2">
                <Label htmlFor="tajuk">Tajuk Bahan</Label>
                <Input
                  id="tajuk"
                  placeholder="cth: Nota Panduan Solat, Bahan Ujian Bulanan..."
                  value={tajuk}
                  onChange={(e) => setTajuk(e.target.value)}
                  maxLength={150}
                />
              </div>

              {/* Keterangan */}
              <div className="space-y-2">
                <Label htmlFor="keterangan">Keterangan (pilihan)</Label>
                <Textarea
                  id="keterangan"
                  placeholder="Nota ringkas untuk ibu bapa..."
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  rows={2}
                  maxLength={500}
                />
              </div>

              {/* Fail PDF atau URL Drive */}
              {jenis === 'PDF_UPLOAD' ? (
                <div className="space-y-2">
                  <Label htmlFor="fail">Fail PDF</Label>
                  <div className="rounded-lg border-2 border-dashed border-border p-4 text-center">
                    <input
                      ref={fileRef}
                      id="fail"
                      type="file"
                      accept="application/pdf"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="text-sm text-primary hover:underline"
                    >
                      Klik untuk pilih fail PDF
                    </button>
                    {selectedFile && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        {selectedFile.name} · {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="googleUrl">URL Google Drive</Label>
                  <Input
                    id="googleUrl"
                    type="url"
                    placeholder="https://drive.google.com/file/d/.../view"
                    value={googleUrl}
                    onChange={(e) => setGoogleUrl(e.target.value)}
                  />
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Pastikan fail Google Drive ditetapkan sebagai &quot;Sesiapa sahaja dengan pautan boleh lihat&quot;.
                      Format URL: https://drive.google.com/file/d/ID_FAIL/view
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Sedang menyimpan...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-1 h-4 w-4" /> Kongsi Bahan
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Carian */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari bahan mengikut tajuk atau murid..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Senarai bahan */}
      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-muted-foreground">
            <Upload className="mx-auto h-10 w-10 mb-3 opacity-40" />
            <p className="text-sm">
              {search
                ? 'Tiada bahan dijumpai untuk carian ini.'
                : 'Belum ada bahan dikongsi. Klik "Kongsi Bahan Baharu" untuk mula.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((r) => (
            <Card key={r.id} className="overflow-hidden hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${r.jenis === 'PDF_UPLOAD' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                    {r.jenis === 'PDF_UPLOAD' ? <FileText className="h-6 w-6" /> : <Link2 className="h-6 w-6" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-sm truncate">{r.tajuk}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {JENIS_LABEL[r.jenis]}
                      </Badge>
                    </div>
                    {r.keterangan && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{r.keterangan}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        {r.studentId ? <GraduationCap className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                        {r.sasaranLabel}
                      </span>
                      <span>·</span>
                      <span>{r.staff}</span>
                      <span>·</span>
                      <span>{formatTarikh(r.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 sm:flex-col">
                    {r.jenis === 'PDF_UPLOAD' && r.failUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(r.failUrl!, '_blank')}
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Buka PDF
                      </Button>
                    )}
                    {r.jenis === 'GOOGLE_DRIVE' && r.googleUrl && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(r.googleUrl!, '_blank')}
                      >
                        <ExternalLink className="mr-1 h-3.5 w-3.5" /> Buka Drive
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => setDeleteTarget(r)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Padam
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog confirm delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Bahan Kongsi?</AlertDialogTitle>
            <AlertDialogDescription>
              Adakah anda pasti ingin memadam &quot;{deleteTarget?.tajuk}&quot;?
              Bahan ini akan dialih keluar daripada portal ibu bapa dan fail PDF (jika ada) akan dipadam secara kekal.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ya, Padam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
