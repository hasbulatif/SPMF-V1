'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, useView } from '@/lib/store'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Mail, Lock, Loader2, AlertCircle, Info, BookOpen } from 'lucide-react'
import { SchoolLogo } from '@/components/school-logo'
import { useToast } from '@/hooks/use-toast'

export function LoginView() {
  const router = useRouter()
  const { setUser } = useSession()
  const { setView } = useView()
  const { toast } = useToast()
  const [emel, setEmel] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locked, setLocked] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLocked(false)
    if (!emel || !password) {
      setError('Sila masukkan emel dan kata laluan.')
      return
    }
    setLoading(true)
    try {
      const res = await api<{ ok: boolean; user: unknown }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ emel, password }),
      })
      if (res.ok && res.user) {
        setUser(res.user as never)
        toast({ title: 'Log masuk berjaya', description: 'Selamat datang ke SPMF.' })
        const u = res.user as { type: string }
        setView(
          u.type === 'GUARDIAN'
            ? { name: 'parent-dashboard' }
            : { name: 'staff-dashboard' }
        )
        router.refresh()
      }
    } catch (e) {
      const err = e as Error & { locked?: boolean }
      setError(err.message)
      setLocked(!!err.locked)
    } finally {
      setLoading(false)
    }
  }

  function fillDemo(emelVal: string, pw: string) {
    setEmel(emelVal)
    setPassword(pw)
    setError(null)
    setLocked(false)
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-emerald-50 via-background to-amber-50">
      <div className="pointer-events-none absolute inset-0 pattern-bg opacity-60" />
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:flex flex-col gap-6 pr-8">
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-primary/20 ring-1 ring-border overflow-hidden">
                <SchoolLogo size={56} priority />
              </div>
              <div>
                <div className="text-xl font-bold text-foreground">
                  Sekolah Rendah Al Furqan
                </div>
                <div className="text-sm text-muted-foreground">Shah Alam, Selangor</div>
              </div>
            </div>

            <div>
              <h1 className="text-3xl font-bold leading-tight text-foreground">
                Sistem Pengurusan Murid
                <br />
                <span className="text-primary">Al Furqan (SPMF)</span>
              </h1>
              <p className="mt-3 text-muted-foreground">
                Portal selamat untuk ibu bapa mengakses dokumen anak anda -
                laporan kemajuan, keputusan peperiksaan, sijil, resit yuran dan
                surat rasmi sekolah.
              </p>
            </div>

            <div className="grid gap-3">
              <FeatureRow icon={<BookOpen className="h-4 w-4" />} text="Semua dokumen anak di satu tempat" />
              <FeatureRow icon={<Lock className="h-4 w-4" />} text="Akses selamat dengan kawalan peranan" />
              <FeatureRow icon={<Mail className="h-4 w-4" />} text="Cetak dan muat turun PDF berkualiti A4" />
            </div>
          </div>

          <Card className="w-full max-w-md mx-auto shadow-xl border-border/60">
            <CardHeader className="space-y-3">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-border overflow-hidden">
                  <SchoolLogo size={40} priority />
                </div>
                <div>
                  <div className="text-sm font-bold">SPMF</div>
                  <div className="text-[11px] text-muted-foreground">Al Furqan Shah Alam</div>
                </div>
              </div>
              <CardTitle className="text-2xl">Log Masuk</CardTitle>
              <p className="text-sm text-muted-foreground">
                Masukkan emel dan kata laluan akaun SPMF anda.
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
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
                      disabled={loading || locked}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Kata Laluan</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading || locked}
                    />
                  </div>
                </div>

                {error && (
                  <div
                    className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
                      locked
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={loading || locked}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sedang log masuk...
                    </>
                  ) : (
                    'Log Masuk'
                  )}
                </Button>
              </form>

              <Separator className="my-5" />

              <div className="rounded-lg bg-muted/50 p-3 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  <Info className="h-3.5 w-3.5" />
                  Akaun Demo
                </div>
                <p className="text-muted-foreground">
                  Klik untuk mengisi automatik:
                </p>
                <div className="grid gap-1.5">
                  <DemoButton label="Ibu Bapa (2 anak)" desc="aisyah.hamid@gmail.com" onClick={() => fillDemo('aisyah.hamid@gmail.com', 'IbuBapa@Furqan2026')} />
                  <DemoButton label="Ibu Bapa (2 anak)" desc="fatimah.abdullah@gmail.com" onClick={() => fillDemo('fatimah.abdullah@gmail.com', 'IbuBapa@Furqan2026')} />
                  <DemoButton label="Guru Kelas" desc="ahmad.fazil@alfurqan.edu.my" onClick={() => fillDemo('ahmad.fazil@alfurqan.edu.my', 'GuruFurqan@2026')} />
                  <DemoButton label="Penolong Kanan" desc="noraini.yusof@alfurqan.edu.my" onClick={() => fillDemo('noraini.yusof@alfurqan.edu.my', 'PKFurqan@2026')} />
                  <DemoButton label="Kerani" desc="siti.ismail@alfurqan.edu.my" onClick={() => fillDemo('siti.ismail@alfurqan.edu.my', 'KeraniFurqan@2026')} />
                  <DemoButton label="Admin" desc="admin@alfurqan.edu.my" onClick={() => fillDemo('admin@alfurqan.edu.my', 'AdminFurqan@2026')} />
                </div>
              </div>

              <div className="mt-4 text-center text-xs text-muted-foreground space-y-2">
                <p>Tiada akaun? Daftar sekarang:</p>
                <div className="flex gap-2 justify-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setView({ name: 'signup' })}
                  >
                    Daftar Akaun Ibu Bapa / Guru
                  </Button>
                </div>
                <p className="pt-1">Atau hubungi pejabat sekolah di 03-5512 3456.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card/60 p-3 backdrop-blur-sm border border-border/40">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <span className="text-sm text-foreground">{text}</span>
    </div>
  )
}

function DemoButton({ label, desc, onClick }: { label: string; desc: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-md bg-background px-2 py-1.5 text-left text-[11px] hover:bg-accent transition-colors border border-border/50"
    >
      <span className="font-medium text-foreground">{label}</span>
      <span className="text-muted-foreground truncate ml-2">{desc}</span>
    </button>
  )
}
