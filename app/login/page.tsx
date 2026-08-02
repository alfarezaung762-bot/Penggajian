'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/ToastProvider'
import { ShieldCheck, User, Lock, ArrowRight, AlertCircle, X } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [loginType, setLoginType] = useState<'employee' | 'staff'>('employee')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    try {
      const endpoint = loginType === 'employee' ? '/api/auth/login-employee' : '/api/auth/login-staff'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errText = data.error || 'Login gagal. Periksa kembali username & password Anda.'
        setErrorMessage(errText)
        showToast(errText, 'error')
        setLoading(false)
        return
      }

      showToast(`Selamat datang kembali, ${data.data.name}!`, 'success')

      const targetUrl = data.data.redirect || (data.data.type === 'employee' ? '/karyawan/absensi' : '/kelola_hrd_admin/data-karyawan')
      window.location.href = targetUrl
    } catch {
      const connErr = 'Terjadi kesalahan jaringan / server. Silakan coba lagi.'
      setErrorMessage(connErr)
      showToast(connErr, 'error')
      setLoading(false)
    }
  }

  const fillDemo = (user: string, pass: string, type: 'employee' | 'staff') => {
    setLoginType(type)
    setUsername(user)
    setPassword(pass)
    setErrorMessage(null)
  }

  const switchTab = (type: 'employee' | 'staff') => {
    setLoginType(type)
    setErrorMessage(null)
  }

  return (
    <div className="min-h-screen bg-[#f3f4f6] flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">PT SANTOSO MAKMUR JAYA</h1>
          <p className="text-xs text-slate-500 font-medium">Sistem Penggajian & Manajemen SDM Terpadu</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Segmented Switcher Tab */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => switchTab('employee')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                loginType === 'employee'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Login Karyawan
            </button>
            <button
              type="button"
              onClick={() => switchTab('staff')}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                loginType === 'staff'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Login HRD / Admin
            </button>
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900">Selamat Datang</h2>
            <p className="text-xs text-slate-500">
              {loginType === 'employee'
                ? 'Masuk ke portal mandiri absensi & slip gaji karyawan.'
                : 'Masuk ke portal kelola data HRD & penggajian.'}
            </p>
          </div>

          {/* Banner Error Login jika password salah / user tidak ditemukan */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-950 text-xs font-bold flex items-center justify-between gap-2 shadow-xs animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={18} className="text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button type="button" onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-rose-700 p-1">
                <X size={16} />
              </button>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Nama Pengguna (Username)</label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  required
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value)
                    setErrorMessage(null)
                  }}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Kata Sandi (Password)</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setErrorMessage(null)
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Memproses Masuk...' : 'Masuk Ke Akun'} <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Fill Accounts (Karyawan, HRD, Admin) */}
          <div className="border-t border-slate-100 pt-4 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Akun Coba Cepat (Demo Dummy)</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('budi', 'budi123', 'employee')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-[11px] transition-all"
              >
                <p className="font-bold text-slate-800">Karyawan (Demo)</p>
                <p className="text-slate-500 font-mono text-[10px]">budi</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('hrd', 'hrd123', 'staff')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-[11px] transition-all"
              >
                <p className="font-bold text-slate-800">Staf HRD</p>
                <p className="text-slate-500 font-mono text-[10px]">hrd</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin', 'admin123', 'staff')}
                className="p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-left text-[11px] transition-all"
              >
                <p className="font-bold text-slate-800">Admin Owner</p>
                <p className="text-slate-500 font-mono text-[10px]">admin</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('budi_santoso', 'password123', 'employee')}
                className="p-2 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 text-left text-[11px] transition-all"
              >
                <p className="font-bold text-blue-900">Budi Santoso</p>
                <p className="text-blue-700 font-mono text-[10px]">budi_santoso</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('dewi_lestari', 'password123', 'employee')}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 text-left text-[11px] transition-all"
              >
                <p className="font-bold text-emerald-900">Dewi (Lembur)</p>
                <p className="text-emerald-700 font-mono text-[10px]">dewi_lestari</p>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('hendra_gunawan', 'password123', 'employee')}
                className="p-2 bg-rose-50 hover:bg-rose-100 rounded-xl border border-rose-200 text-left text-[11px] transition-all"
              >
                <p className="font-bold text-rose-900">Hendra (Alpha)</p>
                <p className="text-rose-700 font-mono text-[10px]">hendra_gunawan</p>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          © 2026 PT SANTOSO MAKMUR JAYA. Hak Cipta Dilindungi.
        </p>
      </div>
    </div>
  )
}
