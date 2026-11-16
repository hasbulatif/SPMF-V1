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
  Users,
  KeyRound,
} from 'lucide-react'

interface StudentMini {
  id: string
  idMurid: string
  nama: string
  tahun: number
  kelas: { nama: string } | null
  isPrimary: boolean
}
interface GuardianItem {
  id: string
  nama: string
  emel: string
  noTelefon: string
  hubungan: string
  status: string
  students: StudentMini[]
}
interface StudentItem {
  id: string
  idMurid: string
  nama: string
  tahun: number
  kelas: { id: string; nama: string } | null
}

interface GuardiansResp { ok: true; guardians: GuardianItem[] }
interface StudentsResp { ok: true; students: StudentItem[] }

interface FormState {
  id?: string
  nama: string
  emel: string
  noTelefon: string
  hubungan: string
  password: string
  studentIds: string[]
}

const EMPTY_FORM: FormState = {
  nama: '',
  emel: '',
  noTelefon: '',
  hubungan: 'BAPA',
  password: '',
  studentIds: [],
}

const HUBUNGAN_OPTIONS = [
  { value: 'BAPA', label: 'Bapa' },
  { value: 'IBU', label: 'Ibu' },
  { value: 'PENJAGA', label: 'Penjaga' },
]

export function StaffGuardians() {
  const { user } = useSession()
  const { toast } = useToast()
  const peranan = user?.peranan
  const bolehEdit = peranan === 'KERANI' || peranan === 'ADMIN'
  const bolehPadam = peranan === 'ADMIN'

  const [guardians, setGuardians] = useState<GuardianItem[]>([])
  const [students, setStudents] = useState<StudentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [resetId, setResetId] = useState<string | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetting, setResetting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [g, s] = await Promise.all([
        api<GuardiansResp>('/api/staff/guardians').then((r) => r.guardians).catch(() => [] as GuardianItem[]),
        api<StudentsResp>('/api/staff/students').then((r) => r.students).catch(() => [] as StudentItem[]),
      ])
      setGuardians(g)
      setStudents(s)
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
    if (!q) return guardians
    return guardians.filter(
      (g) =>
        g.nama.toLowerCase().includes(q) ||
        g.emel.toLowerCase().includes(q) ||
        g.noTelefon.toLowerCase().includes(q)
    )
  }, [guardians, query])

  function openAdd() {
    setForm({ ...EMPTY_FORM })
    setDialogOpen(true)
  }

  function openEdit(g: GuardianItem) {
    setForm({
      id: g.id,
      nama: g.nama,
      emel: g.emel,
      noTelefon: g.noTelefon,
      hubungan: g.hubungan,
      password: '',
      studentIds: g.students.map((s) => s.id),
    })
    setDialogOpen(true)
  }

  function toggleStudent(sid: string) {
    setForm((f) => {
      const exists = f.studentIds.includes(sid)
      const next = exists ? f.studentIds.filter((x) => x !== sid) : [...f.studentIds, sid]
      return { ...f, studentIds: next }
    })
  }

  async function handleSave() {
    if (!form.nama.trim() || !form.emel.trim() || !form.noTelefon.trim()) {
      toast({ title: 'Medan wajib tidak lengkap', variant: 'destructive' })
      return
    }
    if (!form.id && !form.password) {
      toast({ title: 'Kata laluan diperlukan untuk akaun baharu', variant: 'destructive' })
      return
    }
    setSaving(true)
    try {
      if (form.id) {
        await api('/api/staff/guardians', {
          method: 'PATCH',
          body: JSON.stringify({
            id: form.id,
            nama: form.nama,
            emel: form.emel,
            noTelefon: form.noTelefon,
            hubungan: form.hubungan,
            ...(form.password ? { password: form.password } : {}),
            studentIds: form.studentIds,
          }),
        })
        toast({ title: 'Penjaga dikemaskini' })
      } else {
        await api('/api/staff/guardians', {
          method: 'POST',
          body: JSON.stringify({
            nama: form.nama,
            emel: form.emel,
            noTelefon: form.noTelefon,
            hubungan: form.hubungan,
            password: form.password,
            studentIds: form.studentIds,
          }),
        })
        toast({ title: 'Penjaga dicipta' })
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
      await api(`/api/staff/guardians?id=${deleteId}`, { method: 'DELETE' })
      toast({ title: 'Penjaga dipadam' })
      setDeleteId(null)
      await fetchData()
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  async function handleResetPassword() {
    if (!resetId || !resetPassword) {
      toast({ title: 'Kata laluan baharu diperlukan', variant: 'destructive' })
      return
    }
    setResetting(true)
    try {
      await api('/api/staff/guardians', {
        method: 'PATCH',
        body: JSON.stringify({ id: resetId, password: resetPassword }),
      })
      toast({ title: 'Kata laluan diset semula' })
      setResetId(null)
      setResetPassword('')
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pengurusan Penjaga</h2>
          <p className="text-sm text-muted-foreground">Ibu bapa / penjaga murid berdaftar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
            Muat Semula
          </Button>
          {bolehEdit && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Tambah Penjaga
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <Card className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Cari mengikut nama, emel, atau telefon..."
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
            <h3 className="font-semibold text-foreground">Tiada penjaga dijumpai</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cuba ubah carian atau tambah penjaga baharu.
            </p>
          </div>
          {bolehEdit && (
            <Button size="sm" onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Tambah Penjaga
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
                  <TableHead>Nama</TableHead>
                  <TableHead>Emel</TableHead>
                  <TableHead>No. Telefon</TableHead>
                  <TableHead>Hubungan</TableHead>
                  <TableHead>Anak-anak</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => (
                  <TableRow key={g.id}>
                    <TableCell className="font-medium text-foreground">{g.nama}</TableCell>
                    <TableCell className="text-xs">{g.emel}</TableCell>
                    <TableCell className="text-xs font-mono">{g.noTelefon}</TableCell>
                    <TableCell className="text-xs">
                      {HUBUNGAN_OPTIONS.find((h) => h.value === g.hubungan)?.label ?? g.hubungan}
                    </TableCell>
                    <TableCell className="text-xs">
                      {g.students.length === 0 ? (
                        <span className="text-muted-foreground">-</span>
                      ) : (
                        <div className="flex flex-col gap-0.5">
                          {g.students.slice(0, 2).map((s) => (
                            <span key={s.id} className="flex items-center gap-1">
                              {s.isPrimary && <Badge variant="outline" className="text-[9px] px-1 py-0">Utama</Badge>}
                              {s.nama}
                              <span className="text-muted-foreground">({s.kelas?.nama ?? '-'})</span>
                            </span>
                          ))}
                          {g.students.length > 2 && (
                            <span className="text-muted-foreground">+{g.students.length - 2} lagi</span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${g.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-muted text-muted-foreground'}`}
                      >
                        {g.status === 'AKTIF' ? 'Aktif' : g.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        {bolehEdit && (
                          <>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setResetId(g.id)}>
                              <KeyRound className="h-3 w-3" />
                              Kata Laluan
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(g)}>
                              <Pencil className="h-3 w-3" />
                              Sunting
                            </Button>
                          </>
                        )}
                        {bolehPadam && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeleteId(g.id)}>
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
            {filtered.map((g) => (
              <Card key={g.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-foreground text-sm">{g.nama}</div>
                    <div className="text-[11px] text-muted-foreground truncate">{g.emel}</div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${g.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-muted text-muted-foreground'}`}
                  >
                    {g.status === 'AKTIF' ? 'Aktif' : g.status}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {HUBUNGAN_OPTIONS.find((h) => h.value === g.hubungan)?.label ?? g.hubungan} &middot;{' '}
                  <span className="font-mono">{g.noTelefon}</span>
                </div>
                {g.students.length > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Anak: {g.students.map((s) => s.nama).join(', ')}
                  </div>
                )}
                {(bolehEdit || bolehPadam) && (
                  <div className="mt-2 flex flex-wrap gap-1 border-t pt-2">
                    {bolehEdit && (
                      <>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setResetId(g.id)}>
                          <KeyRound className="h-3 w-3" />
                          Kata Laluan
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openEdit(g)}>
                          <Pencil className="h-3 w-3" />
                          Sunting
                        </Button>
                      </>
                    )}
                    {bolehPadam && (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive" onClick={() => setDeleteId(g.id)}>
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
            <DialogTitle>{form.id ? 'Sunting Penjaga' : 'Tambah Penjaga Baharu'}</DialogTitle>
            <DialogDescription>
              Isikan butiran penjaga dan pautkan dengan anak-anak.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label htmlFor="g-nama" className="mb-1.5 block">Nama Penuh *</Label>
              <Input
                id="g-nama"
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="g-emel" className="mb-1.5 block">Emel *</Label>
                <Input
                  id="g-emel"
                  type="email"
                  value={form.emel}
                  onChange={(e) => setForm({ ...form, emel: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="g-tel" className="mb-1.5 block">No. Telefon *</Label>
                <Input
                  id="g-tel"
                  value={form.noTelefon}
                  onChange={(e) => setForm({ ...form, noTelefon: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="g-hubungan" className="mb-1.5 block">Hubungan *</Label>
                <Select value={form.hubungan} onValueChange={(v) => setForm({ ...form, hubungan: v })}>
                  <SelectTrigger id="g-hubungan" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HUBUNGAN_OPTIONS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="g-password" className="mb-1.5 block">
                  Kata Laluan {form.id ? '(kosongkan jika tidak diubah)' : '*'}
                </Label>
                <Input
                  id="g-password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={form.id ? 'Set semula kata laluan...' : ''}
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">Pautkan Anak-anak</Label>
              <ScrollArea className="h-48 rounded-md border p-2">
                {students.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2">Tiada murid berdaftar.</p>
                ) : (
                  <div className="space-y-1">
                    {students.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md p-2 hover:bg-accent"
                      >
                        <Checkbox
                          checked={form.studentIds.includes(s.id)}
                          onCheckedChange={() => toggleStudent(s.id)}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-foreground truncate">{s.nama}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {s.idMurid} &middot; {s.kelas?.nama ?? '-'}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <p className="mt-1 text-xs text-muted-foreground">
                Anak pertama akan ditanda sebagai anak utama.
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
                  <Users className="h-4 w-4" />
                  {form.id ? 'Kemaskini' : 'Cipta'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetId} onOpenChange={(open) => !open && setResetId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set Semula Kata Laluan</DialogTitle>
            <DialogDescription>
              Masukkan kata laluan baharu untuk penjaga ini.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reset-pw" className="mb-1.5 block">Kata Laluan Baharu</Label>
              <Input
                id="reset-pw"
                type="password"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Pastikan kata laluan selamat dan maklumkan kepada penjaga.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetId(null)} disabled={resetting}>
              Batal
            </Button>
            <Button onClick={handleResetPassword} disabled={resetting || !resetPassword}>
              {resetting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menetapkan...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Set Semula
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
            <AlertDialogTitle>Padam Penjaga</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak boleh diundur. Akaun penjaga dan capaian akan dipadam.
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
