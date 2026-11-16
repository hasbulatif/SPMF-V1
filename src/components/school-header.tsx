'use client'

import { SchoolLogo } from '@/components/school-logo'

export function SchoolHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-2 mb-3">
      <div className="flex items-center gap-3">
        <SchoolLogo size={compact ? 44 : 56} priority />
        <div>
          <div className={`font-bold text-emerald-800 ${compact ? 'text-sm' : 'text-base'}`}>
            SEKOLAH RENDAH AL FURQAN
          </div>
          <div className={`text-neutral-600 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            Shah Alam, Selangor Darul Ehsan
          </div>
          {!compact && (
            <div className="text-[10px] text-neutral-500">
              Tel: 03-5512 3456 | Emel: pejabat@alfurqan.edu.my
            </div>
          )}
        </div>
      </div>
      <div className="text-right text-[10px] text-neutral-500">
        <div>Sistem Pengurusan Murid</div>
        <div>Al Furqan (SPMF)</div>
      </div>
    </div>
  )
}
