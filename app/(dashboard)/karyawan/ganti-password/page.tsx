'use client'

import { useState } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { KeyRound, Lock, Eye, EyeOff, Save } from 'lucide-react'

export default function GantiPasswordPage() {
  const { showToast } = useToast()
  const [form, setForm] = useState({ password_lama: '', password_baru: '', konfirmasi_password: '' })
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password_baru !== form.konfirmasi_password) {
      showToast('Konfirmasi password baru tidak cocok', 'error')
      return
    }
    if (form.password_baru.length < 6) {
      showToast('Password baru minimal 6 karakter', 'warning')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/ganti-password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password_lama: form.password_lama,
          password_baru: form.password_baru,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal mengubah password', 'error')
        setLoading(false)
        return
      }
      showToast('Password berhasil diperbarui!', 'success')
      setForm({ password_lama: '', password_baru: '', konfirmasi_password: '' })
    } catch {
      showToast('Terjadi kesalahan. Coba lagi.', 'error')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Ganti Password</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Pengamanan mandiri akun: ubah password login berkala.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="block font-semibold text-foreground">Password Lama *</label>
            <div className="relative">
              <input
                required
                type={showPw ? 'text' : 'password'}
                value={form.password_lama}
                onChange={e => setForm(p => ({ ...p, password_lama: e.target.value }))}
                placeholder="Masukkan password saat ini"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-foreground">Password Baru (min 6 karakter) *</label>
            <input
              required
              minLength={6}
              type={showPw ? 'text' : 'password'}
              value={form.password_baru}
              onChange={e => setForm(p => ({ ...p, password_baru: e.target.value }))}
              placeholder="Masukkan password baru"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-foreground">Konfirmasi Password Baru *</label>
            <input
              required
              minLength={6}
              type={showPw ? 'text' : 'password'}
              value={form.konfirmasi_password}
              onChange={e => setForm(p => ({ ...p, konfirmasi_password: e.target.value }))}
              placeholder="Ulangi password baru"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="showPw"
              checked={showPw}
              onChange={e => setShowPw(e.target.checked)}
              className="rounded border-border"
            />
            <label htmlFor="showPw" className="text-muted-foreground select-none cursor-pointer">
              Tampilkan karakter password
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xs"
          >
            <Save size={16} /> {loading ? 'Memproses...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  )
}
