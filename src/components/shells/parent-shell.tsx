'use client'

import { useEffect, useState } from 'react'
import { AppShell } from './app-shell'
import { useView } from '@/lib/store'
import { api } from '@/lib/api'
import { ParentDashboard } from '@/components/views/parent-dashboard'
import { ParentDocumentsList } from '@/components/views/parent-documents-list'
import { ParentDocumentPreview } from '@/components/views/parent-document-preview'
import { ParentShareLinks } from '@/components/views/parent-share-links'
import { ParentNotifications } from '@/components/views/parent-notifications'
import { ParentBahanGuru } from '@/components/views/parent-bahan-guru'
import { ParentBahanView } from '@/components/views/parent-bahan-view'

interface NotifSummary {
  ok: boolean
  belumDibaca: number
}

export function ParentShell() {
  const { view } = useView()
  const [notifCount, setNotifCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await api<NotifSummary>('/api/guardian/notifications')
        if (!cancelled) setNotifCount(res.belumDibaca)
      } catch {}
    }
    load()
    const id = setInterval(load, 30000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [view.name])

  return (
    <AppShell notificationsBadge={notifCount}>
      {view.name === 'parent-dashboard' && <ParentDashboard />}
      {view.name === 'parent-documents' && (
        <ParentDocumentsList initialStudentId={view.studentId} />
      )}
      {view.name === 'parent-document-preview' && (
        <ParentDocumentPreview documentId={view.documentId} />
      )}
      {view.name === 'parent-share-links' && <ParentShareLinks />}
      {view.name === 'parent-notifications' && <ParentNotifications />}
      {view.name === 'parent-bahan-guru' && (
        <ParentBahanGuru initialStudentId={view.studentId} />
      )}
      {view.name === 'parent-bahan-view' && (
        <ParentBahanView resourceId={view.resourceId} />
      )}
    </AppShell>
  )
}
