'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useView } from '@/lib/store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  School,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  User,
  Phone,
  Briefcase,
  ArrowLeft,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { SchoolLogo } from '@/components/school-logo'

type JenisAkaun = 'GUARDIAN' | 'STAFF'

export function SignupView() {
  const router = useRouter()
  const { setUser } = useSession()
  const { setView } = useView()
  const { toast } = useToast()

  const [jenis, setJenis] = useState<JenisAkaun>('GUARDIAN')
  const [nama, setNama] = useState('')
  const [emel, setEmel] = useState('')
  const [noTelefon, setNoTelefon] = useState('')
  const [hubungan, setHubungan] = useState('IBU')
  const [noPekerja, setNoPekerja] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function validatePassword(pw: string): string | null {
    if (pw.length < 8) return 'Kata laluan mesti sekurang-kurangnya 8 aksara.'
    if (!/[A-Z]/.test(pw)) return 'Kata laluan mesti mengandungi sekurang-kurangnya satu huruf besar.'
    if (!/[a-z]/.test(pw)) return 'Kata laluan mesti mengandungi sekurang-kurangnya satu huruf kecil.'
    if (!/[0-9]/.test(pw)) return 'Kata laluan mesti mengandungi sekurang-kurangnya satu nombor.'
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validasi
    if (!nama.trim()) {
      setError('Nama diperlukan.')
      return
    }
    if (!emel.trim()) {
      setError('Emel diperlukan.')
      return
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emel.trim())) {
      setError('Format emel tidak sah.')
      return
    }
    const pwError = validatePassword(password)
    if (pwError) {
      setError(pwError)
      return
    }
    if (password !== confirmPassword) {
      setError('Kata laluan dan pengesahan tidak sepadan.')
      return
    }
    if (jenis === 'GUARDIAN' && !noTelefon.trim()) {
      setError('No. telefon diperlukan untuk akaun ibu bapa.')
      return
    }
    if (jenis === 'STAFF' && !noPekerja.trim()) {
      setError('No. Pekerja diperlukan untuk akaun guru.')
      return
    }

    setLoading(true)
    try {
      const res = await api<{ ok: boolean; user: unknown; message?: string }>(
        '/api/auth/signup',
        {
          method: 'POST',
          body: JSON.stringify({
            jenis,
            nama: nama.trim(),
            emel: emel.trim(),
            password,
            confirmPassword,
            noTelefon: noTelefon.trim(),
            hubungan,
            noPekerja: noPekerja.trim(),
          }),
        }
      )
      if (res.ok && res.user) {
        setUser(res.user as never)
        toast({
          title: 'Pendaftaran Berjaya!',
          description: res.message ?? 'Akaun anda telah dicipta.',
        })
        const u = res.user as { type: string }
        setView(
          u.type === 'GUARDIAN'
            ? { name: 'parent-dashboard' }
            : { name: 'staff-dashboard' }
        )
        router.refresh()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-background to-amber-50">
      <div className="pointer-events-none absolute inset-0 pattern-bg opacity-60" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <Card className="w-full max-w-lg shadow-xl border-border/60">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border overflow-hidden">
                  <SchoolLogo size={40} priority />
                </div>
                <div>
                  <div className="text-sm font-bold">SPMF</div>
                  <div className="text-[11px] text-muted-foreground">Al Furqan Shah Alam</div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView({ name: 'login' })}
              >
                <ArrowLeft className="mr-1 h-4 w-4" /> Kembali
              </Button>
            </div>
            <CardTitle className="text-2xl">Daftar Akaun Baharu</CardTitle>
            <CardDescription>
              Cipta akaun baharu untuk mengakses portal SPMF.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Pilih jenis akaun */}
              <div className="space-y-2">
                <Label>Jenis Akaun</Label>
                <RadioGroup
                  value={jenis}
                  onValueChange={(v) => setJenis(v as JenisAkaun)}
                  className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                >
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${jenis === 'GUARDIAN' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                    <RadioGroupItem value="GUARDIAN" />
                    <div>
                      <div className="text-sm font-medium">Ibu Bapa / Penjaga</div>
                      <div className="text-[11px] text-muted-foreground">Akses dokumen anak</div>
                    </div>
                  </label>
                  <label className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${jenis === 'STAFF' ? 'border-primary bg-primary/5' : 'hover:bg-accent'}`}>
                    <RadioGroupItem value="STAFF" />
                    <div>
                      <div className="text-sm font-medium">Guru / Staf Sekolah</div>
                      <div className="text-[11px] text-muted-foreground">Pengurusan dokumen murid</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <Separator />

              {/* Nama Penuh */}
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Penuh</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="nama"
                    placeholder="cth: Ahmad bin Abdullah"
                    className="pl-10"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Emel */}
              <div className="space-y-2">
                <Label htmlFor="emel">Emel</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="emel"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@contoh.com"
                    className="pl-10"
                    value={emel}
                    onChange={(e) => setEmel(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Medan khusus ibu bapa */}
              {jenis === 'GUARDIAN' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="noTelefon">No. Telefon</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="noTelefon"
                          placeholder="0123456789"
                          className="pl-10"
                          value={noTelefon}
                          onChange={(e) => setNoTelefon(e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hubungan">Hubungan</Label>
                      <Select value={hubungan} onValueChange={setHubungan}>
                        <SelectTrigger id="hubungan">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="IBU">Ibu</SelectItem>
                          <SelectItem value="BAPA">Bapa</SelectItem>
                          <SelectItem value="PENJAGA">Penjaga</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-blue-50 border border-blue-200 p-2 text-[11px] text-blue-800">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Selepas daftar, akaun anda tiada anak dipautkan. Sila hubungi pejabat sekolah
                      dengan No. Pendaftaran Murid anak anda untuk memautkan akaun.
                    </span>
                  </div>
                </>
              )}

              {/* Medan khusus guru */}
              {jenis === 'STAFF' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="noPekerja">No. Pekerja</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="noPekerja"
                        placeholder="cth: AF-S-005"
                        className="pl-10"
                        value={noPekerja}
                        onChange={(e) => setNoPekerja(e.target.value)}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800">
                    <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Akaun guru baharu akan dicipta dengan peranan &quot;Guru Kelas&quot;.
                      Pentadbir sistem boleh menukar peranan anda (PK/Kerani/Admin) jika perlu.
                    </span>
                  </div>
                </>
              )}

              {/* Kata Laluan */}
              <div className="space-y-2">
                <Label htmlFor="password">Kata Laluan</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Minima 8 aksara (huruf besar + kecil + nombor)"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Pengesahan Kata Laluan */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Sahkan Kata Laluan</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Taip semula kata laluan"
                    className="pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                {confirmPassword && password === confirmPassword && (
                  <div className="flex items-center gap-1 text-[11px] text-green-600">
                    <CheckCircle2 className="h-3 w-3" /> Kata laluan sepadan
                  </div>
                )}
              </div>

              {/* Ralat */}
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Butang daftar */}
              <Button
                type="submit"
                className="w-full h-11"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sedang mendaftar...
                  </>
                ) : (
                  'Daftar Akaun'
                )}
              </Button>
            </form>

            <Separator className="my-5" />

            <div className="text-center text-xs text-muted-foreground space-y-2">
              <p>Sudah ada akaun?</p>
              <Button
                variant="link"
                size="sm"
                className="text-xs p-0"
                onClick={() => setView({ name: 'login' })}
              >
                Log Masuk di sini
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
