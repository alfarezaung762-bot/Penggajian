'use client'

import { useState, useEffect, useCallback, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ToastProvider } from '@/app/components/ToastProvider'
import {
  Users, Briefcase, Calendar, ClipboardCheck,
  FileBarChart, FileText, DollarSign, Settings, ShieldCheck, Clock,
  Gift, Lock, ScrollText, ChevronDown, ChevronRight, Menu, X,
  LogOut, KeyRound, Search, Bell, HelpCircle
} from 'lucide-react'

interface SessionData {
  id: number
  role: string
  type: string
  name: string
}

interface MenuItem {
  label: string
  href: string
  icon: ReactNode
  roles?: string[]
  type?: string[]
  children?: MenuItem[]
  badgeKey?: string
}

const karyawanMenu: MenuItem[] = [
  { label: 'Dashboard Absensi', href: '/karyawan/absensi', icon: <Clock size={18} /> },
  { label: 'Pengajuan Cuti & Lembur', href: '/karyawan/pengajuan', icon: <ClipboardCheck size={18} /> },
  { label: 'Slip Gaji Saya', href: '/karyawan/slip-gaji', icon: <FileText size={18} /> },
]

const hrdMenu: MenuItem[] = [
  { label: 'Data Karyawan', href: '/kelola_hrd_admin/data-karyawan', icon: <Users size={18} /> },
  { label: 'Rekap Kehadiran', href: '/kelola_hrd_admin/rekap-absensi', icon: <Calendar size={18} /> },
  { label: 'Persetujuan Pengajuan', href: '/kelola_hrd_admin/approval-pengajuan', icon: <ClipboardCheck size={18} />, badgeKey: 'pendingApproval' },
  {
    label: 'Pengaturan & Master HRD', href: '#', icon: <Settings size={18} />,
    children: [
      { label: 'Data Jabatan', href: '/kelola_hrd_admin/jabatan', icon: <Briefcase size={16} /> },
      { label: 'Jadwal Kerja & Libur', href: '/kelola_hrd_admin/jadwal-kerja', icon: <Clock size={16} /> },
      { label: 'Potongan Gaji', href: '/kelola_hrd_admin/potongan-gaji', icon: <DollarSign size={16} /> },
      { label: 'Tarif Lembur', href: '/kelola_hrd_admin/tarif-lembur', icon: <Clock size={16} /> },
      { label: 'Laporan Gaji (BNI)', href: '/kelola_hrd_admin/laporan-gaji', icon: <FileText size={16} /> },
    ]
  },
]

const adminOwnerMenu: MenuItem[] = [
  // Menu Eksklusif Admin/Owner (PALING ATAS)
  { label: 'Proses Penggajian', href: '/kelola_hrd_admin/payroll', icon: <DollarSign size={18} /> },
  { label: 'Log Aktivitas Audit', href: '/kelola_hrd_admin/log-aktivitas', icon: <ScrollText size={18} /> },
  { label: 'Tunjangan Lainnya', href: '/kelola_hrd_admin/tunjangan-lain', icon: <Gift size={18} /> },
  { label: 'Manajemen Akun Staff', href: '/kelola_hrd_admin/akun', icon: <ShieldCheck size={18} /> },
  { label: 'Pengaturan Perusahaan', href: '/kelola_hrd_admin/pengaturan-umum', icon: <Settings size={18} /> },
  // Modul Operasional HRD (Collapsible Menu Dropdown - Bisa Minimize & Open)
  {
    label: 'Modul Operasional HRD', href: '#', icon: <Users size={18} />,
    children: [
      { label: 'Data Karyawan', href: '/kelola_hrd_admin/data-karyawan', icon: <Users size={16} /> },
      { label: 'Data Jabatan', href: '/kelola_hrd_admin/jabatan', icon: <Briefcase size={16} /> },
      { label: 'Jadwal Kerja & Libur', href: '/kelola_hrd_admin/jadwal-kerja', icon: <Clock size={16} /> },
      { label: 'Rekap Kehadiran', href: '/kelola_hrd_admin/rekap-absensi', icon: <Calendar size={16} /> },
      { label: 'Persetujuan Pengajuan', href: '/kelola_hrd_admin/approval-pengajuan', icon: <ClipboardCheck size={16} />, badgeKey: 'pendingApproval' },
      { label: 'Potongan Gaji', href: '/kelola_hrd_admin/potongan-gaji', icon: <DollarSign size={16} /> },
      { label: 'Tarif Lembur', href: '/kelola_hrd_admin/tarif-lembur', icon: <Clock size={16} /> },
      { label: 'Laporan Gaji (BNI)', href: '/kelola_hrd_admin/laporan-gaji', icon: <FileText size={16} /> },
    ]
  },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<SessionData | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Modul Operasional HRD', 'Pengaturan & Master HRD'])
  const [badges, setBadges] = useState<Record<string, number>>({})
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setSession(data.data)
        } else {
          router.push('/login')
        }
      })
      .catch(() => router.push('/login'))
  }, [router])

  useEffect(() => {
    const theme = localStorage.getItem('theme')
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const refreshPendingCount = useCallback(() => {
    if (session && session.type === 'account') {
      fetch('/api/pengajuan?status=menunggu&count_only=true')
        .then(res => res.json())
        .then(data => {
          if (data.data?.count !== undefined) {
            setBadges(prev => ({ ...prev, pendingApproval: data.data.count }))
          }
        })
        .catch(() => {})
    }
  }, [session])

  useEffect(() => {
    refreshPendingCount()
    const handleCustomEvent = () => refreshPendingCount()
    window.addEventListener('pengajuan-updated', handleCustomEvent)
    const interval = setInterval(refreshPendingCount, 15000)

    return () => {
      window.removeEventListener('pengajuan-updated', handleCustomEvent)
      clearInterval(interval)
    }
  }, [refreshPendingCount])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  const toggleSubmenu = (label: string) => {
    setExpandedMenus(prev =>
      prev.includes(label)
        ? prev.filter(l => l !== label)
        : [...prev, label]
    )
  }

  const menuItems = session?.type === 'employee'
    ? karyawanMenu
    : session?.role === 'admin_owner'
      ? adminOwnerMenu
      : hrdMenu

  const isActive = (href: string) => {
    if (href === '#') return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f4f6]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-800 rounded-full animate-spin" />
          <p className="text-slate-500 text-xs font-medium">Memuat sesi pengguna...</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <div className="min-h-screen flex bg-[#f3f4f6] text-slate-900 font-sans">
        {/* Mobile Overlay */}
        {mobileSidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-[#eaebee] text-slate-600 border-r border-slate-200/80 transition-all duration-300 no-print ${
            mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          } ${sidebarOpen ? 'w-64' : 'w-20'}`}
        >
          {/* Sidebar Header */}
          <div className="p-5 border-b border-slate-200/60 flex items-center justify-between">
            {sidebarOpen ? (
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-[#0f172a] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-slate-900 leading-tight truncate">
                    {session.type === 'employee' ? 'Portal Karyawan' : session.role === 'admin_owner' ? 'Admin Owner' : 'Staf HRD'}
                  </h2>
                  <p className="text-[11px] text-slate-500 truncate">PT SANTOSO MAKMUR JAYA</p>
                </div>
              </div>
            ) : (
              <div className="w-9 h-9 mx-auto rounded-xl bg-[#0f172a] text-white flex items-center justify-center shadow-xs">
                <ShieldCheck size={20} />
              </div>
            )}
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Action Button in Sidebar */}
          {session.type === 'account' && sidebarOpen && (
            <div className="px-4 pt-4">
              <button
                onClick={() => router.push('/kelola_hrd_admin/payroll')}
                className="w-full py-2.5 px-4 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                <Lock size={14} /> Hitung Gaji
              </button>
            </div>
          )}

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              if (item.children) {
                const validChildren = item.children.filter(child => !child.roles || child.roles.includes(session.role))
                if (validChildren.length === 0) return null

                const isExpanded = expandedMenus.includes(item.label)
                const hasActiveChild = validChildren.some(child => isActive(child.href))
                return (
                  <div key={item.label} className="space-y-1">
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                        hasActiveChild
                          ? 'bg-[#dbeafe] text-[#1e40af]'
                          : 'text-slate-600 hover:bg-slate-200/60'
                      }`}
                    >
                      {item.icon}
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </>
                      )}
                    </button>
                    {sidebarOpen && isExpanded && (
                      <div className="ml-5 pl-2 border-l border-slate-200/80 space-y-1">
                        {validChildren.map(child => {
                          const childBadge = child.badgeKey ? badges[child.badgeKey] : 0
                          return (
                            <button
                              key={child.label}
                              onClick={() => { router.push(child.href); setMobileSidebarOpen(false) }}
                              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[12px] font-semibold transition-all text-left ${
                                isActive(child.href)
                                  ? 'bg-[#dbeafe] text-[#1e40af] font-bold'
                                  : 'text-slate-600 hover:bg-slate-200/60'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {child.icon}
                                <span className="truncate">{child.label}</span>
                              </div>
                              {childBadge > 0 && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-red-500 text-white shadow-xs">
                                  {childBadge}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              }

              return (
                <button
                  key={item.label}
                  onClick={() => { router.push(item.href); setMobileSidebarOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive(item.href)
                      ? 'bg-[#dbeafe] text-[#1e40af] font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {item.icon}
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badgeKey && badges[item.badgeKey] > 0 && (
                        <span className="ml-auto px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-red-500 text-white">
                          {badges[item.badgeKey]}
                        </span>
                      )}
                    </>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className="p-4 border-t border-slate-200/60 space-y-1">
            {sidebarOpen && (
              <button
                onClick={() => router.push('/kelola_hrd_admin/pengaturan-umum')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <HelpCircle size={16} /> Pusat Bantuan
              </button>
            )}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} /> {sidebarOpen && 'Keluar'}
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#f3f4f6]">
          {/* Header Bar */}
          <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between gap-4 shadow-2xs no-print">
            <div className="flex items-center gap-3 flex-1 max-w-md">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 rounded-xl border border-slate-200 lg:hidden text-slate-500"
              >
                <Menu size={18} />
              </button>
              {/* Search Bar Input */}
              <div className="relative w-full hidden sm:block">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari karyawan, NIK, atau komponen..."
                  className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 relative"
                title="Notifikasi"
              >
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <button
                onClick={() => router.push(session.type === 'employee' ? '/karyawan/ganti-password' : '/kelola_hrd_admin/pengaturan-umum')}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                title="Pengaturan"
              >
                <Settings size={18} />
              </button>

              {/* Profile Pill */}
              <div className="relative ml-2">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-all shadow-2xs"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#0f172a] text-white flex items-center justify-center text-xs font-bold">
                    {session.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-slate-800 hidden md:inline-block">{session.name}</span>
                  <ChevronDown size={14} className="text-slate-400 hidden sm:block" />
                </button>

                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200 rounded-2xl shadow-lg z-50 py-2">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-bold text-slate-900">{session.name}</p>
                        <p className="text-[11px] text-slate-500 capitalize">
                          {session.type === 'employee' ? 'Karyawan' : session.role === 'admin_owner' ? 'Admin / Pemilik' : 'Staf HRD'}
                        </p>
                      </div>
                      <button
                        onClick={() => { setShowProfileMenu(false); router.push(session.type === 'employee' ? '/karyawan/ganti-password' : '/kelola_hrd_admin/ganti-password') }}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <KeyRound size={15} /> Ganti Password
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={15} /> Keluar
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Page Body Container */}
          <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
