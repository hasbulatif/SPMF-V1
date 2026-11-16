'use client'

import { AppShell } from './app-shell'
import { useView } from '@/lib/store'
import { StaffDashboard } from '@/components/views/staff-dashboard'
import { StaffDocuments } from '@/components/views/staff-documents'
import { StaffDocumentCreate } from '@/components/views/staff-document-create'
import { StaffDocumentEdit } from '@/components/views/staff-document-edit'
import { StaffDocumentPreview } from '@/components/views/staff-document-preview'
import { StaffStudents } from '@/components/views/staff-students'
import { StaffGuardians } from '@/components/views/staff-guardians'
import { StaffClasses } from '@/components/views/staff-classes'
import { StaffAuditLogs } from '@/components/views/staff-audit-logs'
import { StaffShareResources } from '@/components/views/staff-share-resources'

export function StaffShell() {
  const { view } = useView()

  return (
    <AppShell>
      {view.name === 'staff-dashboard' && <StaffDashboard />}
      {view.name === 'staff-documents' && <StaffDocuments />}
      {view.name === 'staff-document-create' && <StaffDocumentCreate />}
      {view.name === 'staff-share-resources' && <StaffShareResources />}
      {view.name === 'staff-document-edit' && (
        <StaffDocumentEdit documentId={view.documentId} />
      )}
      {view.name === 'staff-document-preview' && (
        <StaffDocumentPreview documentId={view.documentId} />
      )}
      {view.name === 'staff-students' && <StaffStudents />}
      {view.name === 'staff-guardians' && <StaffGuardians />}
      {view.name === 'staff-classes' && <StaffClasses />}
      {view.name === 'staff-audit-logs' && <StaffAuditLogs />}
    </AppShell>
  )
}
