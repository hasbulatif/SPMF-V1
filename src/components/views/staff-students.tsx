'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { api } from '@/lib/api'
import { useSession } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  AlertCircle,
  Inbox,
  Loader2,
  User,
} from 'lucide-react'

interface GuardianMini {
  id: string
  nama: string
  emel: string
  noTelefon: string
  hubungan: string
  isPrimary: boolean
}
interface StudentItem {
  id: string
  idMurid: string
  nama: string
  tahun: number
  jantina: 'L' | 'P'
  status: string
  noKP: string | null
  kelas: { id: string; nama: string } | null
  guardians: GuardianMini[]
}
interface GuardianItem {
  id: string
  nama: string
  emel: string
  noTelefon: string
  hubungan: string
  status: string
}
interface ClassItem { id: string; nama: string; tahun: number }

interface StudentsResp { ok: true; students: StudentItem[] }
interface GuardiansResp { ok: true; guardians: GuardianItem[] }
interface ClassesResp { ok: true; classes: ClassItem[] }

interface FormState {
  id?: string
  idMurid: string
  nama: string
  tahun: string
  kelasId: string
  jantina: 'L' | 'P'
  noKP: string
  guardianIds: string[]
}

const EMPTY_FORM: FormState = {
  idMurid: '',
  nama: '',
  tahun: '1',
  kelasId: '',
  jantina: 'L',
  noKP: '',
  guardianIds: [],
}

export function StaffStudents() {
  const { user } = useSession()
  const { toast } = useToast()
  const peranan = user?.peranan
  const bolehEdit = peranan === 'KERANI' || peranan === 'ADMIN' || peranan === 'PENOLONG_KANAN'
  const bolehPadam = peranan === 'ADMIN'

  const [students, setStudents] = useState<StudentItem[]>([])
  const [guardians, setGuardians] = useState<GuardianItem[]>([])
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [s, g, c] = await Promise.all([
        api<StudentsResp>('/api/staff/students').then((r) => r.students).catch(() => [] as StudentItem[]),
        api<GuardiansResp>('/api/staff/guardians').then((r) => r.guardians).catch(() => [] as GuardianItem[]),
        api<ClassesResp>('/api/staff/classes').then((r) => r.classes).catch(() => [] as ClassItem[]),
      ])
      setStudents(s)
      setGuardians(g)
      setClasses(c)
    } catch (e) {
      const err = e as Error
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students
    return students.filter(
      (s) =>
        s.nama.toLowerCase().includes(q) ||
        s.idMurid.toLowerCase().includes(q) ||
        (s.kelas?.nama ?? '').toLowerCase().includes(q)
    )
  }, [students, query])

  function openAdd() {
    setForm({ ...EMPTY_FORM, kelasId: classes[0]?.id ?? '' })
    setDialogOpen(true)
  }

  function openEdit(s: StudentItem) {
    setForm({
      id: s.id,
      idMurid: s.idMurid,
      nama: s.nama,
      tahun: String(s.tahun),
      kelasId: s.kelas?.id ?? '',
      jantina: s.jantina,
      noKP: s.noKP ?? '',
      guardianIds: s.guardians.map((g) => g.id),
    })
    setDialogOpen(true)
  }

  function toggleGuardian(gid: string) {
    setForm((f) => {
      const exists = f.guardianIds.includes(gid)
      const next = exists ? f.guardianIds.filter((x) => x !== gid) : [...f.guardianIds, gid]
      return { ...f, guardianIds: next }
    })
  }

  async function handleSave() {
    if (!form.idMurid.trim() || !form.nama.trim() || !form.tahun || !form.kelasId) {
      toast({ title: 'Medan wajib tidak lengkap', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (form.id) {
        await api('/api/staff/students', {
          method: 'PATCH',
          body: JSON.stringify({
            id: form.id,
            nama: form.nama,
            tahun: Number(form.tahun),
            kelasId: form.kelasId,
            jantina: form.jantina,
            noKP: form.noKP || null,
            guardianIds: form.guardianIds,
          }),
        })
        toast({ title: 'Murid dikemaskini' })
      } else {
        await api('/api/staff/students', {
          method: 'POST',
          body: JSON.stringify({
            idMurid: form.idMurid,
            nama: form.nama,
            tahun: Number(form.tahun),
            kelasId: form.kelasId,
            jantina: form.jantina,
            noKP: form.noKP || null,
            guardianIds: form.guardianIds,
          }),
        })
        toast({ title: 'Murid dicipta' })
      }
      setDialogOpen(false)
      await fetchData()
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!deleteId) return
    setDeleting(true)
    try {
      await api(`/api/staff/students?id=${deleteId}`, { method: 'DELETE' })
      toast({ title: 'Murid dipadam' })
      setDeleteId(null)
      await fetchData()
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pengurusan Murid</h2>
          <p className="text-sm text-muted-foreground">Senarai murid berdaftar di sekolah.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Muat Semula
          </Button>
          {bolehEdit && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Tambah Murid
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari mengikut nama, ID murid, atau kelas..."
            className="pl-9"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-6 flex flex-col items-center justify-center text-center gap-3 border-destructive/30">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={fetchData} variant="outline" size="sm">
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
      {!error && !loading && filtered.length === 0 && (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tiada murid dijumpai</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cuba ubah carian atau tambah murid baharu.
            </p>
          </div>
          {bolehEdit && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Tambah Murid
            </Button>
          )}
        </Card>
      )}

      {/* Desktop table */}
      {!error && !loading && filtered.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Murid</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Tahun</TableHead>
                  <TableHead>Jantina</TableHead>
                  <TableHead>Penjaga</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.idMurid}</TableCell>
                    <TableCell className="font-medium text-foreground">{s.nama}</TableCell>
                    <TableCell className="text-xs">{s.kelas?.nama ?? '-'}</TableCell>
                    <TableCell className="text-xs">{s.tahun}</TableCell>
                    <TableCell className="text-xs">{s.jantina === 'L' ? 'Lelaki' : 'Perempuan'}</TableCell>
                    <TableCell className="text-xs">
                      {s.guardians.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {s.guardians.slice(0, 2).map((g) => (
                            <span key={g.id} className="flex items-center gap-1">
                              {g.isPrimary && <Badge variant="outline" className="text-[9px] px-1 py-0">Utama</Badge>}
                              {g.nama}
                              <span className="text-muted-foreground">({g.hubungan})</span>
                            </span>
                          ))}
                          {s.guardians.length > 2 && (
                            <span className="text-muted-foreground">+{s.guardians.length - 2} lagi</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${s.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-muted text-muted-foreground'}`}
                      >
                        {s.status === 'AKTIF' ? 'Aktif' : s.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {bolehEdit && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(s)}>
                            <Pencil className="h-3 w-3" />
                            Sunting
                          </Button>
                        )}
                        {bolehPadam && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeleteId(s.id)}>
                            <Trash2 className="h-3 w-3" />
                            Padam
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((s) => (
              <Card key={s.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground text-sm">{s.nama}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{s.idMurid}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${s.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-muted text-muted-foreground'}`}
                  >
                    {s.status === 'AKTIF' ? 'Aktif' : s.status}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Kelas {s.kelas?.nama ?? '-'} &middot; Tahun {s.tahun} &middot;{' '}
                  {s.jantina === 'L' ? 'Lelaki' : 'Perempuan'}
                </div>
                {s.guardians.length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Penjaga: {s.guardians.map((g) => g.nama).join(', ')}
                  </div>
                )}
                {(bolehEdit || bolehPadam) && (
                  <div className="mt-2 flex gap-1 border-t pt-2">
                    {bolehEdit && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(s)}>
                        <Pencil className="h-3 w-3" />
                        Sunting
                      </Button>
                    )}
                    {bolehPadam && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeleteId(s.id)}>
                        <Trash2 className="h-3 w-3" />
                        Padam
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Sunting Murid' : 'Tambah Murid Baharu'}</DialogTitle>
            <DialogDescription>
              Isikan butiran murid dan pautkan dengan penjaga.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label htmlFor="f-idMurid" className="mb-1.5 block">ID Murid *</Label>
              <Input
                id="f-idMurid"
                value={form.idMurid}
                onChange={(e) => setForm({ ...form, idMurid: e.target.value })}
                disabled={!!form.id}
                placeholder="cth. M2024001"
              />
            </div>
            <div>
              <Label htmlFor="f-nama" className="mb-1.5 block">Nama Penuh *</Label>
              <Input
                id="f-nama"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                placeholder="Nama murid"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="f-tahun" className="mb-1.5 block">Tahun *</Label>
                <Select value={form.tahun} onValueChange={(v) => setForm({ ...form, tahun: v })}>
                  <SelectTrigger id="f-tahun" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((t) => (
                      <SelectItem key={t} value={String(t)}>Tahun {t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="f-kelas" className="mb-1.5 block">Kelas *</Label>
                <Select value={form.kelasId} onValueChange={(v) => setForm({ ...form, kelasId: v })}>
                  <SelectTrigger id="f-kelas" className="w-full">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.length === 0 ? (
                      <SelectItem value="_none" disabled>Tiada kelas</SelectItem>
                    ) : (
                      classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.nama} (Tahun {c.tahun})</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="f-jantina" className="mb-1.5 block">Jantina *</Label>
                <Select value={form.jantina} onValueChange={(v) => setForm({ ...form, jantina: v as 'L' | 'P' })}>
                  <SelectTrigger id="f-jantina" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Lelaki</SelectItem>
                    <SelectItem value="P">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="f-nokp" className="mb-1.5 block">No. KP</Label>
                <Input
                  id="f-nokp"
                  value={form.noKP}
                  onChange={(e) => setForm({ ...form, noKP: e.target.value })}
                  placeholder="Opsyenal"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Penjaga</Label>
              <ScrollArea className="h-48 rounded-md border p-2">
                {guardians.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">Tiada penjaga berdaftar.</p>
                ) : (
                  <div className="space-y-1">
                    {guardians.map((g) => (
                      <label
                        key={g.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-accent"
                      >
                        <Checkbox
                          checked={form.guardianIds.includes(g.id)}
                          onCheckedChange={() => toggleGuardian(g.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">{g.nama}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {g.hubungan} &middot; {g.emel}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <p className="mt-1 text-xs text-muted-foreground">
                Penjaga pertama dipilih akan ditanda sebagai penjaga utama.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  {form.id ? 'Kemaskini' : 'Cipta'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Padam Murid</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak boleh diundur. Semua dokumen berkaitan akan terjejas.
              Adakah anda pasti?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memadam...
                </>
              ) : (
                'Padam'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
