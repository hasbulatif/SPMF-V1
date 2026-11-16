'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { api, formatTarikhMasa } from '@/lib/api'
import { useSession } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
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
  Search,
  RefreshCw,
  AlertCircle,
  Inbox,
  ShieldAlert,
  Loader2,
  History,
} from 'lucide-react'

interface AuditLogItem {
  id: string
  masa: string
  namaUser: string
  userType: string
  tindakan: string
  documentId: string | null
  dokumen: string | null
  metadata: string | null
  peranti: string | null
}
interface AuditResp {
  ok: true
  logs: AuditLogItem[]
  tindakanOptions: string[]
}

const TINDAKAN_STYLE: Record<string, string> = {
  LOG_MASUK: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LOG_KELUAR: 'bg-muted text-muted-foreground border-border',
  LIHAT_DOKUMEN: 'bg-zinc-200 text-zinc-700 border-zinc-300',
  MUAT_TURUN: 'bg-amber-100 text-amber-800 border-amber-200',
  CETAK: 'bg-amber-100 text-amber-800 border-amber-200',
  KONGSI: 'bg-violet-100 text-violet-800 border-violet-200',
  TERBIT: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LULUS: 'bg-amber-100 text-amber-800 border-amber-200',
  TOLAK: 'bg-destructive/10 text-destructive border-destructive/20',
  CRUD_MURID: 'bg-sky-100 text-sky-800 border-sky-200',
  CRUD_GUARDIAN: 'bg-sky-100 text-sky-800 border-sky-200',
}

const USER_TYPE_LABEL: Record<string, string> = {
  STAFF: 'Staf',
  GUARDIAN: 'Ibu Bapa',
  UMUM: 'Umum',
}

const USER_TYPE_BADGE: Record<string, string> = {
  STAFF: 'bg-primary/10 text-primary border-primary/20',
  GUARDIAN: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UMUM: 'bg-muted text-muted-foreground border-border',
}

export function StaffAuditLogs() {
  const { user } = useSession()
  const peranan = user?.peranan
  const bolehAkses = peranan === 'ADMIN' || peranan === 'PENOLONG_KANAN'

  const [logs, setLogs] = useState<AuditLogItem[]>([])
  const [tindakanOptions, setTindakanOptions] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const [tindakanFilter, setTindakanFilter] = useState<string>('all')
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all')
  const [query, setQuery] = useState('')
  const debouncedQuery = useRef<string>('')
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const limitRef = useRef<number>(100)

  const fetchLogs = useCallback(async (limit: number = 100, append: boolean = false) => {
    if (!append) setLoading(true)
    else setLoadingMore(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (tindakanFilter !== 'all') params.set('tindakan', tindakanFilter)
      if (userTypeFilter !== 'all') params.set('userType', userTypeFilter)
      if (debouncedQuery.current) params.set('q', debouncedQuery.current)
      params.set('limit', String(limit))

      const res = await api<AuditResp>(`/api/staff/audit-logs?${params.toString()}`)
      setLogs(res.logs)
      setTindakanOptions(res.tindakanOptions)
    } catch (e) {
      const err = e as Error
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [tindakanFilter, userTypeFilter])

  useEffect(() => {
    fetchLogs(limitRef.current)
  }, [fetchLogs])

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      if (debouncedQuery.current !== query) {
        debouncedQuery.current = query
        fetchLogs(limitRef.current)
      }
    }, 300)
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [query, fetchLogs])

  function loadMore() {
    limitRef.current += 100
    fetchLogs(limitRef.current)
  }

  if (!bolehAkses) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center gap-3 border-amber-300/60 bg-amber-50/40">
        <ShieldAlert className="h-10 w-10 text-amber-600" />
        <div>
          <h3 className="font-semibold text-foreground">Akses Ditolak</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Hanya Pentadbir Sistem dan Penolong Kanan boleh mengakses log audit.
          </p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Log Audit</h2>
          <p className="text-sm text-muted-foreground">
            Rekod aktiviti pengguna dalam sistem.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchLogs(limitRef.current)}>
          <RefreshCw className="h-4 w-4" />
          Muat Semula
        </Button>
      </div>

      {/* Filter bar */}
      <Card className="p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Cari nama pengguna atau metadata..."
              className="pl-9"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Select value={tindakanFilter} onValueChange={setTindakanFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Tindakan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Tindakan</SelectItem>
              {tindakanOptions.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Pengguna" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pengguna</SelectItem>
              <SelectItem value="STAFF">Staf</SelectItem>
              <SelectItem value="GUARDIAN">Ibu Bapa / Penjaga</SelectItem>
              <SelectItem value="UMUM">Umum</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <Card className="p-6 flex flex-col items-center justify-center text-center gap-3 border-destructive/30">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => fetchLogs(limitRef.current)} variant="outline" size="sm">
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
      {!error && !loading && logs.length === 0 && (
        <Card className="p-12 flex flex-col items-center justify-center text-center gap-3 border-dashed">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
            <Inbox className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Tiada log dijumpai</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Cuba ubah penapis carian.
            </p>
          </div>
        </Card>
      )}

      {/* Desktop table */}
      {!error && !loading && logs.length > 0 && (
        <>
          <Card className="hidden md:block overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Masa</TableHead>
                  <TableHead>Pengguna</TableHead>
                  <TableHead>Tindakan</TableHead>
                  <TableHead>Dokumen</TableHead>
                  <TableHead>Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTarikhMasa(l.masa)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{l.namaUser}</span>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${USER_TYPE_BADGE[l.userType] ?? ''}`}
                        >
                          {USER_TYPE_LABEL[l.userType] ?? l.userType}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${TINDAKAN_STYLE[l.tindakan] ?? 'bg-muted text-muted-foreground border-border'}`}
                      >
                        {l.tindakan}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                      {l.dokumen ?? '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-sm truncate">
                      {l.metadata ?? '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {logs.map((l) => (
              <Card key={l.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{l.namaUser}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${USER_TYPE_BADGE[l.userType] ?? ''}`}
                      >
                        {USER_TYPE_LABEL[l.userType] ?? l.userType}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {formatTarikhMasa(l.masa)}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${TINDAKAN_STYLE[l.tindakan] ?? 'bg-muted text-muted-foreground border-border'}`}
                  >
                    {l.tindakan}
                  </Badge>
                </div>
                {(l.dokumen || l.metadata) && (
                  <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                    {l.dokumen && <div>Dokumen: {l.dokumen}</div>}
                    {l.metadata && <div className="truncate">{l.metadata}</div>}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Load more */}
          {logs.length >= limitRef.current && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Memuatkan...
                  </>
                ) : (
                  <>
                    <History className="h-4 w-4" />
                    Memuatkan Lebih Banyak
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
