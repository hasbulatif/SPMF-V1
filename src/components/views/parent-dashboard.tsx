'use client'

import { useEffect, useState, useCallback } from 'react'
import { api, formatTarikh, getInisial } from '@/lib/api'
import { useView } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'
import { BentoCard, StatCard } from '@/components/bento-card'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Users,
  FileText,
  Bell,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  GraduationCap,
  Clock,
} from 'lucide-react'

interface DokumenTerkini {
  id: string
  tajuk: string
  kategori: string
  kategoriLabel: string
  tarikh: string
  penggal: string
}

interface AnakItem {
  id: string
  idMurid: string
  nama: string
  tahun: number
  kelas: string
  jantina: 'L' | 'P'
  isPrimary: boolean
  jumlahDokumen: number
  baharuCount: number
  dokumenTerkini: DokumenTerkini[]
}

interface NotifikasiItem {
  id: string
  jenis: string
  mesej: string
  dibaca: boolean
  createdAt: string
  documentId?: string
}

interface DashboardData {
  ok: true
  user: { nama: string; hubungan: string }
  anak: AnakItem[]
  notifikasi: {
    belumDibaca: number
    terbaru: NotifikasiItem[]
  }
  statistik: { jumlahAnak: number; jumlahDokumen: number; jumlahBaharu: number }
}

export function ParentDashboard() {
  const { setView } = useView()
  const { toast } = useToast()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api<DashboardData>('/api/guardian/dashboard')
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="h-28 rounded-xl" />
        <Skeleton className="col-span-1 sm:col-span-2 h-40 rounded-xl" />
        <Skeleton className="col-span-1 sm:col-span-2 h-64 rounded-xl" />
        <Skeleton className="col-span-1 sm:col-span-2 h-64 rounded-xl" />
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

  const { user, anak, notifikasi, statistik } = data

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Jumlah Anak"
          value={statistik.jumlahAnak}
          icon={Users}
          hint="Anak didaftarkan di sekolah"
        />
        <StatCard
          label="Jumlah Dokumen"
          value={statistik.jumlahDokumen}
          icon={FileText}
          hint="Kesemua dokumen tersedia"
        />
        <StatCard
          label="Dokumen Baharu"
          value={statistik.jumlahBaharu}
          icon={Bell}
          accent="primary"
          hint="Belum dibaca"
        />
        <BentoCard
          span="lg"
          accent="primary"
          title={`Selamat datang, ${user.nama}`}
          icon={GraduationCap}
          action={
            <Button
              size="sm"
              variant="default"
              onClick={() => setView({ name: 'parent-documents' })}
            >
              Lihat Dokumen
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        >
          <p className="text-sm text-muted-foreground">
            Akaun ibu bapa / penjaga (
            <span className="font-medium text-foreground">{user.hubungan}</span>).
            Gunakan navigasi di sebelah kiri untuk mengakses dokumen anak,
            mengurus pautan perkongsian, dan menyemak notifikasi.
          </p>
        </BentoCard>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {anak.map((child) => (
          <BentoCard
            key={child.id}
            span="md"
            accent={child.baharuCount > 0 ? 'gold' : 'default'}
            action={
              child.baharuCount > 0 ? (
                <Badge variant="default" className="bg-amber-600 hover:bg-amber-600">
                  BAHARU {child.baharuCount}
                </Badge>
              ) : null
            }
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11 border">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {getInisial(child.nama)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground truncate">{child.nama}</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {child.idMurid} &middot; Tahun {child.tahun} &middot; {child.kelas}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Jumlah dokumen: <span className="font-medium text-foreground">{child.jumlahDokumen}</span>
                </div>
              </div>
            </div>

            {child.dokumenTerkini.length > 0 && (
              <div className="mt-4 space-y-2 border-t pt-3">
                <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Dokumen Terkini
                </div>
                {child.dokumenTerkini.slice(0, 2).map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() =>
                      setView({ name: 'parent-document-preview', documentId: d.id })
                    }
                    className="flex w-full items-center justify-between gap-2 rounded-md p-1.5 text-left hover:bg-accent transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-foreground truncate">{d.tajuk}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {d.kategoriLabel}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] text-muted-foreground">
                        {formatTarikh(d.tarikh)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              className="mt-3 w-full"
              onClick={() => setView({ name: 'parent-documents', studentId: child.id })}
            >
              Lihat Dokumen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </BentoCard>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard
          span="md"
          title="Notifikasi Terkini"
          icon={Bell}
          accent={notifikasi.belumDibaca > 0 ? 'primary' : 'default'}
          action={
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setView({ name: 'parent-notifications' })}
            >
              Lihat Semua
              <ArrowRight className="h-4 w-4" />
            </Button>
          }
        >
          {notifikasi.terbaru.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Tiada notifikasi baharu.
            </p>
          ) : (
            <ul className="space-y-2">
              {notifikasi.terbaru.slice(0, 5).map((n) => (
                <li
                  key={n.id}
                  className={`rounded-md p-2 ${
                    n.dibaca ? 'bg-muted/40' : 'bg-primary/5 border border-primary/15'
                  }`}
                >
                  <div className="text-sm text-foreground line-clamp-2">{n.mesej}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {formatTarikh(n.createdAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </BentoCard>
      </div>
    </div>
  )
}
