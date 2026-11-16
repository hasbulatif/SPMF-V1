'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  api,
  STAFF_ROLE_LABEL,
  relatifMasa,
} from '@/lib/api'
import { useSession, useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { BentoCard, StatCard } from '@/components/bento-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  FileText,
  Eye,
  Clock,
  Plus,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ScrollText,
  History,
  Activity,
} from 'lucide-react'

interface DashboardData {
  ok: true
  user: { nama: string; peranan?: string }
  statistik: {
    totalMurid: number
    totalGuardian: number
    totalKelas: number
    totalDokumen: number
    kadarBaca: number
    dokumenMenungguSemakan: number
  }
  aliranStatus: Array<{ status: string; label: string; count: number }>
  kategoriBreakdown: Array<{ kategori: string; label: string; count: number }>
  dokumenTerkini: Array<{
    id: string
    tajuk: string
    kategori: string
    kategoriLabel: string
    status: string
    statusLabel: string
    createdAt: string
    student: { nama: string; idMurid: string; tahun: number; kelas?: { nama: string } | null }
    diterbitOleh: string | null
  }>
  auditTerkini: Array<{
    id: string
    tindakan: string
    namaUser: string
    userType: string
    masa: string
    dokumen: string | null
    metadata: string | null
  }>
  dokumenMenunggu: Array<{
    id: string
    tajuk: string
    kategori: string
    kategoriLabel: string
    updatedAt: string
    student: { nama: string; idMurid: string; kelas?: { nama: string } | null }
  }>
}

const STATUS_BADGE_CLASS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-border',
  SEMAKAN: 'bg-amber-100 text-amber-800 border-amber-200',
  DILULUSKAN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DITERBITKAN: 'bg-primary text-primary-foreground border-transparent',
  DITARIK: 'bg-destructive/10 text-destructive border-destructive/20',
}

export function StaffDashboard() {
  const { user } = useSession()
  const { setView } = useView()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<DashboardData>('/api/staff/dashboard')
      setData(res)
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

  const peranan = user?.peranan
  const bolehLulus = peranan === 'PENOLONG_KANAN' || peranan === 'ADMIN'

  async function quickAction(docId: string, status: 'DILULUSKAN' | 'DITARIK') {
    setActingId(docId)
    try {
      await api('/api/staff/documents', {
        method: 'PATCH',
        body: JSON.stringify({ id: docId, status }),
      })
      toast({
        title: status === 'DILULUSKAN' ? 'Dokumen diluluskan' : 'Dokumen ditolak',
        description: 'Status telah dikemaskini.',
      })
      await fetchData()
    } catch (e) {
      const err = e as Error
      toast({ title: 'Ralat', description: err.message, variant: 'destructive' })
    } finally {
      setActingId(null)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="col-span-1 sm:col-span-2 lg:col-span-3 h-40 rounded-xl" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="col-span-1 sm:col-span-2 h-64 rounded-xl" />
        <Skeleton className="col-span-1 sm:col-span-2 h-64 rounded-xl" />
        <Skeleton className="col-span-1 sm:col-span-2 lg:col-span-3 h-64 rounded-xl" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 border-destructive/30">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div>
          <h3 className="font-semibold text-foreground">Tidak dapat memuatkan dashboard</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {error ?? 'Berlaku ralat tidak dijangka.'}
          </p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4" />
          Cuba Semula
        </Button>
      </Card>
    )
  }

  const { statistik, aliranStatus, kategoriBreakdown, dokumenTerkini, auditTerkini, dokumenMenunggu } = data
  const maxKategori = Math.max(1, ...kategoriBreakdown.map((k) => k.count))

  return (
    <div className="space-y-4">
      {/* Row 1: Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Jumlah Murid"
          value={statistik.totalMurid}
          icon={Users}
          hint="Murid berdaftar"
        />
        <StatCard
          label="Jumlah Dokumen"
          value={statistik.totalDokumen}
          icon={FileText}
          hint="Kesemua dokumen"
        />
        <StatCard
          label="Kadar Baca Ibu Bapa"
          value={`${statistik.kadarBaca}%`}
          icon={Eye}
          accent="primary"
          hint="Dokumen diterbitkan dibaca"
        />
        <StatCard
          label="Menunggu Semakan"
          value={statistik.dokumenMenungguSemakan}
          icon={Clock}
          accent={statistik.dokumenMenungguSemakan > 0 ? 'gold' : 'default'}
          hint={statistik.dokumenMenungguSemakan > 0 ? 'Memerlukan tindakan' : 'Tiada dokumen tertunggak'}
        />
      </div>

      {/* Row 2: Welcome + Workflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard
          span="lg"
          accent="primary"
          icon={ScrollText}
          title={`Selamat datang, ${data.user.nama}`}
          action={
            <Button
              size="sm"
              onClick={() => setView({ name: 'staff-document-create' })}
            >
              <Plus className="h-4 w-4" />
              Cipta Dokumen
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            Peranan:{' '}
            <span className="font-medium text-foreground">
              {STAFF_ROLE_LABEL[data.user.peranan ?? ''] ?? 'Staf'}
            </span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Gunakan navigasi di sebelah kiri untuk mengurus dokumen, murid, penjaga, dan kelas.
          </p>
        </BentoCard>

        <BentoCard
          span="md"
          icon={Activity}
          title="Aliran Status Dokumen"
        >
          <div className="flex flex-wrap gap-2">
            {aliranStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tiada data.</p>
            ) : (
              aliranStatus.map((s) => (
                <Badge
                  key={s.status}
                  variant="outline"
                  className={`text-[11px] ${STATUS_BADGE_CLASS[s.status] ?? ''}`}
                >
                  {s.label}: {s.count}
                </Badge>
              ))
            )}
          </div>
        </BentoCard>
      </div>

      {/* Row 3: Kategori breakdown + Menunggu semakan + Audit terkini */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard
          span="md"
          icon={FileText}
          title="Dokumen Mengikut Kategori"
        >
          <ul className="space-y-2">
            {kategoriBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tiada data.</p>
            ) : (
              kategoriBreakdown.slice(0, 6).map((k) => (
                <li key={k.kategori}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground truncate pr-2">{k.label}</span>
                    <span className="font-medium text-muted-foreground">{k.count}</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-primary/15">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(k.count / maxKategori) * 100}%` }}
                    />
                  </div>
                </li>
              ))
            )}
          </ul>
        </BentoCard>

        <BentoCard
          span="md"
          icon={Clock}
          accent={dokumenMenunggu.length > 0 ? 'gold' : 'default'}
          title="Menunggu Semakan"
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setView({ name: 'staff-documents' })}
            >
              Lihat Semua
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        >
          {dokumenMenunggu.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Tiada dokumen menunggu semakan.
            </p>
          ) : (
            <ul className="space-y-2">
              {dokumenMenunggu.slice(0, 5).map((d) => (
                <li
                  key={d.id}
                  className="rounded-md border border-amber-200/60 bg-amber-50/40 p-2"
                >
                  <button
                    type="button"
                    onClick={() => setView({ name: 'staff-document-preview', documentId: d.id })}
                    className="block w-full text-left"
                  >
                    <div className="text-sm font-medium text-foreground truncate">{d.tajuk}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {d.student.nama} &middot; {d.student.kelas?.nama ?? '-'} &middot; {relatifMasa(d.updatedAt)}
                    </div>
                  </button>
                  {bolehLulus && (
                    <div className="mt-2 flex gap-1.5">
                      <Button
                        size="sm"
                        variant="default"
                        className="h-7 text-xs"
                        disabled={actingId === d.id}
                        onClick={() => quickAction(d.id, 'DILULUSKAN')}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Lulus
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={actingId === d.id}
                        onClick={() => quickAction(d.id, 'DITARIK')}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Tolak
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </BentoCard>

        <BentoCard
          span="lg"
          icon={History}
          title="Dokumen Terkini"
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setView({ name: 'staff-documents' })}
            >
              Lihat Semua
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        >
          <ul className="divide-y divide-border/60">
            {dokumenTerkini.length === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground">
                Tiada dokumen.
              </li>
            ) : (
              dokumenTerkini.slice(0, 6).map((d) => (
                <li key={d.id}>
                  <button
                    type="button"
                    onClick={() => setView({ name: 'staff-document-preview', documentId: d.id })}
                    className="flex w-full items-center gap-3 py-2 text-left hover:bg-accent/40 rounded-md px-1.5 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-foreground truncate">{d.tajuk}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {d.student.nama} &middot; {d.student.kelas?.nama ?? `Tahun ${d.student.tahun}`}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${STATUS_BADGE_CLASS[d.status] ?? ''}`}
                      >
                        {d.statusLabel}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {relatifMasa(d.createdAt)}
                      </span>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </BentoCard>
      </div>

      {/* Row 4: Audit activity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard
          span="lg"
          icon={History}
          title="Aktiviti Audit Terkini"
          action={
            peranan === 'ADMIN' || peranan === 'PENOLONG_KANAN' ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setView({ name: 'staff-audit-logs' })}
              >
                Lihat Semua
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : null
          }
        >
          <ul className="space-y-2">
            {auditTerkini.length === 0 ? (
              <li className="py-4 text-center text-sm text-muted-foreground">
                Tiada aktiviti direkodkan.
              </li>
            ) : (
              auditTerkini.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-start gap-2 rounded-md p-1.5 hover:bg-accent/40">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary text-[10px] font-semibold">
                    {a.tindakan.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-foreground truncate">
                      <span className="font-medium">{a.namaUser}</span>{' '}
                      <span className="text-muted-foreground">&middot; {a.tindakan}</span>
                    </div>
                    {a.dokumen && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {a.dokumen}
                      </div>
                    )}
                    {a.metadata && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {a.metadata}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {relatifMasa(a.masa)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </BentoCard>
      </div>
    </div>
  )
}
