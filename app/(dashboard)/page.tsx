'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardRootRedirect() {
  const router = useRouter()

  useEffect(() => {
    async function checkSessionAndRedirect() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (data.data) {
          if (data.data.type === 'employee') {
            router.replace('/karyawan/absensi')
          } else {
            router.replace('/kelola_hrd_admin/data-karyawan')
          }
        } else {
          router.replace('/login')
        }
      } catch {
        router.replace('/login')
      }
    }

    checkSessionAndRedirect()
  }, [router])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Mengarahkan ke halaman utama...</p>
      </div>
    </div>
  )
}
