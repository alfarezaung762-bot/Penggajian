'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserCheck, ShieldCheck, Lock, User, AlertCircle, Building2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'karyawan' | 'staff'>('karyawan');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const endpoint = tab === 'karyawan' ? '/api/auth/login-employee' : '/api/auth/login-staff';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal login');
      }

      if (tab === 'karyawan') {
        router.push('/karyawan/absensi');
      } else {
        router.push('/kelola_hrd_admin/data-karyawan');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative">
      {/* Background Soft Gradients */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 shadow-xl shadow-slate-200/60 z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3 text-white">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Sistem Penggajian</h1>
          <p className="text-sm text-slate-500 mt-1">Portal Kehadiran & Penggajian Karyawan</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 bg-slate-100 p-1.5 rounded-2xl mb-6 border border-slate-200/80">
          <button
            type="button"
            onClick={() => { setTab('karyawan'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'karyawan'
                ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            Karyawan
          </button>
          <button
            type="button"
            onClick={() => { setTab('staff'); setError(''); }}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'staff'
                ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            HRD / Admin
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3.5 rounded-xl mb-5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <UserCheck className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={tab === 'karyawan' ? 'Masukkan username karyawan' : 'Masukkan username HRD/Admin'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all disabled:opacity-50 mt-2"
          >
            {loading ? 'Memproses...' : 'Masuk Aplikasi'}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-100 pt-5">
          <p className="text-xs text-slate-500">
            Default Login Demo: <code className="text-slate-800 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">budi</code> / <code className="text-slate-800 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">hrd</code> / <code className="text-slate-800 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">admin</code> (pass: <code className="text-slate-800 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">password123</code>)
          </p>
        </div>
      </div>
    </div>
  );
}
