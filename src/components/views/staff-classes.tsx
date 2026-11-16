'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import { BentoCard, StatCard } from '@/components/bento-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  GraduationCap,
  RefreshCw,
  AlertCircle,
  Building2,
  UserCog,
} from 'lucide-react'

interface ClassItem {
  id: string
  nama: string
  tahun: number
  guruKelasId: string | null
  guruKelas: string | null
  jumlahMurid: number
}
interface ClassesResp { ok: true; classes: ClassItem[] }

// Tahun -> warna emerald yang berbeza (1 paling cerah, 6 paling gelap)
const TAHUN_ACCENT: Record<number, { bg: string; ring: string; text: string }> = {
  1: { bg: 'bg-emerald-50', ring: 'border-emerald-100', text: 'text-emerald-700' },
  2: { bg: 'bg-emerald-100', ring: 'border-emerald-200', text: 'text-emerald-700' },
  3: { bg: 'bg-emerald-200/70', ring: 'border-emerald-300', text: 'text-emerald-800' },
  4: { bg: 'bg-emerald-300/60', ring: 'border-emerald-400', text: 'text-emerald-900' },
  5: { bg: 'bg-emerald-400/50', ring: 'border-emerald-500', text: 'text-emerald-900' },
  6: { bg: 'bg-emerald-600/30', ring: 'border-emerald-700', text: 'text-emerald-900' },
}

function accentForTahun(t: number) {
  return TAHUN_ACCENT[t] ?? TAHUN_ACCENT[1]
}

export function StaffClasses() {
  const { toast } = useToast()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<ClassesResp>('/api/staff/classes')
      setClasses(res.classes)
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

  const totalMurid = classes.reduce((sum, c) => sum + c.jumlahMurid, 0)

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 border-destructive/30">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-semibold text-foreground">Tidak dapat memuatkan kelas</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Cuba Semula
        </Button>
      </Card>
    )
  }

  // Susun mengikut tahun
  const sortedClasses = [...classes].sort((a, b) =>
    a.tahun - b.tahun || a.nama.localeCompare(b.nama)
  )

  // Kumpulan mengikut tahun
  const byTahun: Record<number, ClassItem[]> = {}
  sortedClasses.forEach((c) => {
    if (!byTahun[c.tahun]) byTahun[c.tahun] = []
    byTahun[c.tahun].push(c)
  })
  const tahunList = Object.keys(byTahun).map(Number).sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Pengurusan Kelas</h2>
          <p className="text-sm text-muted-foreground">Senarai kelas mengikut tahun darjah.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="h-4 w-4" />
          Muat Semula
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Jumlah Kelas"
          value={classes.length}
          icon={Building2}
          accent="primary"
        />
        <StatCard
          label="Jumlah Murid"
          value={totalMurid}
          icon={Users}
          hint="Kesemua kelas"
        />
        <StatCard
          label="Tahun Darjah"
          value={tahunList.length}
          icon={GraduationCap}
          hint={tahunList.map((t) => `T${t}`).join(', ')}
        />
        <StatCard
          label="Pursa Murid/Kelas"
          value={classes.length ? Math.round(totalMurid / classes.length) : 0}
          icon={UserCog}
        />
      </div>

      {/* Class bento grid - grouped by tahun */}
      {sortedClasses.length === 0 ? (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tiada kelas dijumpai</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Sila hubungi pentadbir untuk mendaftar kelas.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {tahunList.map((tahun) => (
            <div key={tahun} className="space-y-2">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Tahun {tahun}</h3>
                <Badge variant="outline" className="text-[10px]">
                  {byTahun[tahun].length} kelas &middot;{' '}
                  {byTahun[tahun].reduce((s, c) => s + c.jumlahMurid, 0)} murid
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {byTahun[tahun].map((c) => {
                  const accent = accentForTahun(c.tahun)
                  return (
                    <BentoCard key={c.id} span="sm">
                      <div className={`flex items-center gap-3 rounded-lg ${accent.bg} ${accent.ring} border p-3`}>
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/60">
                          <GraduationCap className={`h-5 w-5 ${accent.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground truncate">{c.nama}</div>
                          <div className="text-xs text-muted-foreground">Tahun {c.tahun}</div>
                        </div>
                        <div className="text-right">
                          <div className={`text-xl font-bold ${accent.text}`}>{c.jumlahMurid}</div>
                          <div className="text-[10px] text-muted-foreground">murid</div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <UserCog className="h-3 w-3" />
                            Guru Kelas
                          </span>
                          <span className="font-medium text-foreground truncate ml-2">
                            {c.guruKelas ?? '-'}
                          </span>
                        </div>
                      </div>
                    </BentoCard>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
