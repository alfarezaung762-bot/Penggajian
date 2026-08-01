'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Plus, Edit, UserX, UserCheck, ShieldCheck, KeyRound } from 'lucide-react'

export default function AkunAdminPage() {
  const { showToast } = useToast()
  const [accounts, setAccounts] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: '', username: '', password: '', role: 'hrd' })

  const fetchAccounts = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/crud_account')
      const data = await res.json()
      if (data.data) setAccounts(data.data)
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])

  const openAdd = () => { setEditId(null); setForm({ name: '', username: '', password: '', role: 'hrd' }); setShowModal(true) }
  const openEdit = (acc: Record<string, unknown>) => {
    setEditId(acc.id as number)
    setForm({ name: acc.name as string, username: acc.username as string, password: '', role: acc.role as string })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const body: Record<string, string> = { name: form.name, username: form.username, role: form.role }
      if (form.password) body.password = form.password
      const url = editId ? `/api/auth/crud_account/${editId}` : '/api/auth/crud_account'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Gagal', 'error'); setSubmitting(false); return }
      showToast(editId ? 'Akun diubah!' : 'Akun ditambah!', 'success')
      setShowModal(false); fetchAccounts()
    } catch { showToast('Gagal menyimpan', 'error') }
    setSubmitting(false)
  }

  const toggleActive = async (id: number, currentlyActive: boolean) => {
    try {
      const res = await fetch(`/api/auth/crud_account/${id}`, {
        method: currentlyActive ? 'DELETE' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: currentlyActive ? undefined : JSON.stringify({ is_active: true }),
      })
      if (!res.ok) { showToast('Gagal', 'error'); return }
      showToast(currentlyActive ? 'Akun dinonaktifkan' : 'Akun diaktifkan', 'success')
      fetchAccounts()
    } catch { showToast('Gagal', 'error') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Manajemen Akun HRD & Admin</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kontrol hak akses pengguna sistem (Khusus Admin / Owner).</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2.5 bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs">
          <Plus size={16} /> Tambah Akun Baru
        </button>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3">Nama Staff</th>
                <th className="text-left px-6 py-3">Username</th>
                <th className="text-left px-6 py-3">Role Access</th>
                <th className="text-center px-6 py-3">Status</th>
                <th className="text-right px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((acc) => (
                <tr key={acc.id as number} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-foreground">{acc.name as string}</td>
                  <td className="px-6 py-3.5 font-mono text-muted-foreground">@{acc.username as string}</td>
                  <td className="px-6 py-3.5">
                    <span className="badge badge-info capitalize">{acc.role === 'admin_owner' ? 'Admin / Owner' : 'HRD Staff'}</span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <span className={`badge ${acc.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {acc.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(acc)} className="p-1.5 rounded-lg hover:bg-muted text-accent" title="Edit"><Edit size={15} /></button>
                      <button onClick={() => toggleActive(acc.id as number, acc.is_active as boolean)} className="p-1.5 rounded-lg hover:bg-muted" title={acc.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                        {acc.is_active ? <UserX size={15} className="text-danger" /> : <UserCheck size={15} className="text-success" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">{loading ? 'Loading...' : 'Belum ada data akun'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-content-sm" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-border flex justify-between items-center"><h3 className="text-sm font-bold text-foreground">{editId ? 'Edit Akun Staff' : 'Tambah Akun Staff'}</h3><button onClick={() => setShowModal(false)} className="p-1 hover:bg-muted rounded-lg text-muted-foreground">✕</button></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div><label className="block font-semibold mb-1">Nama Lengkap *</label><input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:outline-none" /></div>
              <div><label className="block font-semibold mb-1">Username *</label><input required value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:outline-none" /></div>
              <div><label className="block font-semibold mb-1">{editId ? 'Password Baru (opsional)' : 'Password *'}</label><input type="password" minLength={6} required={!editId} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:outline-none" /></div>
              <div><label className="block font-semibold mb-1">Role *</label><select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-border focus:outline-none"><option value="hrd">HRD Staff</option><option value="admin_owner">Admin / Owner</option></select></div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-semibold hover:bg-muted text-xs">Batal</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] font-bold text-xs transition-all disabled:opacity-50">{submitting ? 'Simpan...' : 'Simpan Akun'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
