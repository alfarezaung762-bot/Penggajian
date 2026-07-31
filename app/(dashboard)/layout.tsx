'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  Briefcase,
  Percent,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  UserCheck,
  Clock,
  Gift,
  Lock,
  History,
  LogOut,
  Building2,
  Menu,
  X,
  User,
  ClipboardList,
} from 'lucide-react';

interface UserSession {
  id: number;
  name: string;
  username: string;
  role: 'karyawan' | 'hrd' | 'admin_owner';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const checkSession = useCallback(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.data) {
          setUser(data.data);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/login');
      });
  }, [router]);

  useEffect(() => {
    checkSession();

    // Listen for tab focus / visibility changes to keep session cookie in sync across tabs
    const handleFocus = () => {
      checkSession();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [checkSession]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  // Navigation Items per Role
  const karyawanNav = [
    { name: 'Absensi Saya', href: '/karyawan/absensi', icon: Calendar },
    { name: 'Pengajuan (Cuti/Sakit/Lembur)', href: '/karyawan/pengajuan', icon: ClipboardList },
    { name: 'Slip Gaji', href: '/karyawan/slip-gaji', icon: FileText },
  ];

  const sharedHrdAdminNav = [
    { name: 'Data Karyawan', href: '/kelola_hrd_admin/data-karyawan', icon: Users },
    { name: 'Data Jabatan', href: '/kelola_hrd_admin/jabatan', icon: Briefcase },
    { name: 'Potongan Gaji', href: '/kelola_hrd_admin/potongan-gaji', icon: Percent },
    { name: 'Pengaturan Jadwal & Kebijakan', href: '/kelola_hrd_admin/jadwal-kerja', icon: Calendar },
    { name: 'Approval Pengajuan', href: '/kelola_hrd_admin/approval-pengajuan', icon: CheckCircle2 },
    { name: 'Rekap Absensi', href: '/kelola_hrd_admin/rekap-absensi', icon: FileSpreadsheet },
    { name: 'Laporan Gaji', href: '/kelola_hrd_admin/laporan-gaji', icon: FileText },
  ];

  const adminOnlyNav = [
    { name: 'Manajemen Akun Staff', href: '/kelola_hrd_admin/akun', icon: UserCheck },
    { name: 'Tarif Lembur', href: '/kelola_hrd_admin/tarif-lembur', icon: Clock },
    { name: 'Tunjangan Lainnya', href: '/kelola_hrd_admin/tunjangan-lain', icon: Gift },
    { name: 'Proses & Lock Payroll', href: '/kelola_hrd_admin/payroll', icon: Lock },
    { name: 'Log Aktivitas (Audit)', href: '/kelola_hrd_admin/log-aktivitas', icon: History },
  ];

  let navItems = [];
  if (user?.role === 'karyawan') {
    navItems = karyawanNav;
  } else if (user?.role === 'hrd') {
    navItems = sharedHrdAdminNav;
  } else {
    navItems = [...sharedHrdAdminNav, ...adminOnlyNav];
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin_owner':
        return <span className="bg-purple-100 text-purple-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-purple-200">Admin / Owner</span>;
      case 'hrd':
        return <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">HRD Staff</span>;
      default:
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-emerald-200">Karyawan</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight hidden sm:inline">Penggajian App</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-slate-100/80 border border-slate-200 px-3.5 py-1.5 rounded-full">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center text-slate-600 shadow-xs border border-slate-200">
              <User className="w-4 h-4" />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-semibold text-slate-900 leading-tight">{user?.name}</p>
              <p className="text-[10px] text-slate-500">@{user?.username}</p>
            </div>
            {getRoleBadge(user?.role)}
          </div>

          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-200"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`fixed md:static inset-y-16 left-0 w-64 bg-white border-r border-slate-200 flex flex-col z-30 transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
        >
          <div className="p-4 flex-1 overflow-y-auto space-y-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Menu Navigasi
            </p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-md shadow-blue-600/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.name}</span>
                </Link>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-200 text-xs text-slate-400 text-center font-medium">
            &copy; 2026 Sistem Penggajian Web v2.0
          </div>
        </aside>

        {/* Main Content View */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
