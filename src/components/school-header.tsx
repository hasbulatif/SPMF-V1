'use client'

import { School } from 'lucide-react'

export function SchoolHeader({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b-2 border-emerald-700 pb-2 mb-3">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-700 text-white">
          <School className="h-6 w-6" />
        </div>
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
