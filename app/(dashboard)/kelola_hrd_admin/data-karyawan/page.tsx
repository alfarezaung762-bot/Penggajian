'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Plus, Search, Edit, UserX, UserCheck, KeyRound, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

export default function DataKaryawanPage() {
  const { showToast } = useToast()
  const [employees, setEmployees] = useState<Record<string, unknown>[]>([])
  const [jabatanList, setJabatanList] = useState<Record<string, unknown>[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [showDetail, setShowDetail] = useState<Record<string, unknown> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<Record<string, string | number>>({})

  const fetchEmployees = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(pagination.page), limit: '10' })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/crud_employee?${params}`)
      const data = await res.json()
      if (data.data) { setEmployees(data.data.employees); setPagination(data.data.pagination) }
    } catch { /* */ }
    setLoading(false)
  }, [pagination.page, search, statusFilter])

  const fetchJabatan = useCallback(async () => {
    try { const res = await fetch('/api/crud_jabatan'); const data = await res.json(); if (data.data) setJabatanList(data.data) } catch { /* */ }
  }, [])

  useEffect(() => { fetchEmployees() }, [fetchEmployees])
  useEffect(() => { fetchJabatan() }, [fetchJabatan])

  const openAdd = () => { setEditId(null); setForm({}); setShowModal(true) }
  const openEdit = (emp: Record<string, unknown>) => {
    setEditId(emp.id as number)
    setForm({
      jabatan_id: emp.jabatan_id as number, nik: emp.nik as string, name: emp.name as string, username: emp.username as string,
      gender: emp.gender as string, join_date: (emp.join_date as string).split('T')[0],
      status_pernikahan: emp.status_pernikahan as string, jumlah_tanggungan: emp.jumlah_tanggungan as number,
      bank_account_number: emp.bank_account_number as string, status_kepegawaian: emp.status_kepegawaian as string,
      durasi_kontrak_bulan: (emp.durasi_kontrak_bulan as number) || 0,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true)
    try {
      const body = { ...form, jabatan_id: Number(form.jabatan_id), jumlah_tanggungan: Number(form.jumlah_tanggungan), durasi_kontrak_bulan: form.status_kepegawaian === 'kontrak' ? Number(form.durasi_kontrak_bulan) : null }
      const url = editId ? `/api/crud_employee/${editId}` : '/api/crud_employee'
      const method = editId ? 'PATCH' : 'POST'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Gagal', 'error'); setSubmitting(false); return }
      showToast(editId ? 'Karyawan berhasil diubah!' : 'Karyawan berhasil ditambah!', 'success')
      setShowModal(false); fetchEmployees()
    } catch { showToast('Gagal menyimpan', 'error') }
    setSubmitting(false)
  }

  const toggleActive = async (id: number, currentlyActive: boolean) => {
    const endpoint = currentlyActive ? `/api/crud_employee/${id}` : `/api/crud_employee/${id}`
    const method = currentlyActive ? 'DELETE' : 'PATCH'
    const body = currentlyActive ? undefined : JSON.stringify({ is_active: true })
    try {
      const res = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json' }, body })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Gagal', 'error'); return }
      showToast(currentlyActive ? 'Karyawan dinonaktifkan' : 'Karyawan diaktifkan kembali', 'success')
      fetchEmployees()
    } catch { showToast('Gagal mengubah status', 'error') }
  }

  const resetPassword = async (id: number) => {
    const pw = prompt('Masukkan password baru untuk karyawan:')
    if (!pw || pw.length < 6) { showToast('Password minimal 6 karakter', 'warning'); return }
    try {
      const res = await fetch(`/api/crud_employee/${id}/reset-password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password_baru: pw }) })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Gagal', 'error'); return }
      showToast('Password berhasil direset!', 'success')
    } catch { showToast('Gagal reset password', 'error') }
  }

  const fmt = (n: unknown) => Number(n || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  return (
    <div className="space-y-6">
      {/* Title & Action */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Data Karyawan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola data seluruh karyawan, status kepegawaian, dan akun.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs"
        >
          <Plus size={16} /> Tambah Karyawan Baru
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 flex-wrap items-center bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
            placeholder="Cari nama, NIK, username..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })) }}
          className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Semua Status</option>
          <option value="aktif">Status: Aktif</option>
          <option value="nonaktif">Status: Nonaktif</option>
        </select>
      </div>

      {/* Main Directory Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3.5">Nama Karyawan</th>
                <th className="text-left px-6 py-3.5">NIK</th>
                <th className="text-left px-6 py-3.5">Jabatan</th>
                <th className="text-left px-6 py-3.5">Status Kepegawaian</th>
                <th className="text-center px-6 py-3.5">Status Aktif</th>
                <th className="text-right px-6 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {employees.map((emp) => (
                <tr key={emp.id as number} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{emp.name as string}</p>
                      <p className="text-[10px] font-normal text-slate-400">@{emp.username as string}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-mono font-medium">{emp.nik as string}</td>
                  <td className="px-6 py-4 font-bold text-slate-800">
                    {(emp.jabatan as Record<string, unknown>)?.nama as string}
                  </td>
                  <td className="px-6 py-4 capitalize text-slate-600 font-medium">{emp.status_kepegawaian as string}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`badge ${emp.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {emp.is_active ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => setShowDetail(emp)} title="Detail Karyawan" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"><Eye size={15} /></button>
                      <button onClick={() => openEdit(emp)} title="Edit Karyawan" className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600"><Edit size={15} /></button>
                      <button onClick={() => resetPassword(emp.id as number)} title="Reset Password" className="p-1.5 rounded-lg hover:bg-slate-100 text-amber-600"><KeyRound size={15} /></button>
                      <button onClick={() => toggleActive(emp.id as number, emp.is_active as boolean)} title={emp.is_active ? 'Nonaktifkan' : 'Aktifkan'} className="p-1.5 rounded-lg hover:bg-slate-100">
                        {emp.is_active ? <UserX size={15} className="text-red-600" /> : <UserCheck size={15} className="text-emerald-600" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr><td colSpan={6} className="text-center py-10 text-slate-400">{loading ? 'Memuat data...' : 'Tidak ada data karyawan'}</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Menampilkan Hal {pagination.page} dari {pagination.totalPages} ({pagination.total} data)</span>
            <div className="flex items-center gap-1">
              <button disabled={pagination.page <= 1} onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))} className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))} className="p-1 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetail && (
        <div className="modal-overlay" onClick={() => setShowDetail(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="text-sm font-bold text-slate-900">Detail Karyawan</h3><button onClick={() => setShowDetail(null)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">✕</button></div>
            <div className="p-6 grid grid-cols-2 gap-4 text-xs">
              {[
                ['Nama Lengkap', showDetail.name], ['NIK', showDetail.nik], ['Username', showDetail.username], ['Jabatan', (showDetail.jabatan as Record<string, unknown>)?.nama],
                ['Jenis Kelamin', showDetail.gender === 'L' ? 'Laki-laki' : 'Perempuan'], ['Tanggal Masuk', new Date(showDetail.join_date as string).toLocaleDateString('id-ID')],
                ['Status Pernikahan', showDetail.status_pernikahan === 'K' ? 'Kawin' : 'Tidak Kawin'], ['Tanggungan', showDetail.jumlah_tanggungan],
                ['No. Rekening BNI', showDetail.bank_account_number], ['Status Kepegawaian', showDetail.status_kepegawaian],
                ['Gaji Pokok', fmt((showDetail.jabatan as Record<string, unknown>)?.gaji_pokok)], ['Status Aktif', showDetail.is_active ? 'Aktif' : 'Nonaktif'],
              ].map(([label, val], i) => (
                <div key={i}><p className="text-[11px] text-slate-500 font-semibold uppercase">{label as string}</p><p className="font-bold text-slate-900">{String(val)}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-content-lg" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center"><h3 className="text-sm font-bold text-slate-900">{editId ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}</h3><button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">✕</button></div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div><label className="block text-xs font-semibold mb-1">Nama Lengkap *</label><input required value={form.name || ''} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none" /></div>
              <div><label className="block text-xs font-semibold mb-1">NIK (16 digit) *</label><input required maxLength={16} pattern="[0-9]{16}" value={form.nik || ''} onChange={e => setForm(p => ({ ...p, nik: e.target.value.replace(/\D/g, '').slice(0, 16) }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none" /></div>
              <div><label className="block text-xs font-semibold mb-1">Username *</label><input required value={form.username || ''} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none" /></div>
              {!editId && <div><label className="block text-xs font-semibold mb-1">Password *</label><input required type="password" minLength={6} value={form.password || ''} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none" /></div>}
              <div><label className="block text-xs font-semibold mb-1">Jabatan *</label><select required value={form.jabatan_id || ''} onChange={e => setForm(p => ({ ...p, jabatan_id: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"><option value="">Pilih Jabatan</option>{jabatanList.map((j) => <option key={j.id as number} value={j.id as number}>{j.nama as string}</option>)}</select></div>
              <div><label className="block text-xs font-semibold mb-1">Jenis Kelamin *</label><select required value={form.gender || ''} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"><option value="">Pilih</option><option value="L">Laki-laki</option><option value="P">Perempuan</option></select></div>
              <div><label className="block text-xs font-semibold mb-1">Tanggal Masuk *</label><input required type="date" value={form.join_date || ''} onChange={e => setForm(p => ({ ...p, join_date: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none" /></div>
              <div><label className="block text-xs font-semibold mb-1">Status Pernikahan *</label><select required value={form.status_pernikahan || ''} onChange={e => setForm(p => ({ ...p, status_pernikahan: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"><option value="">Pilih</option><option value="TK">Tidak Kawin</option><option value="K">Kawin</option></select></div>
              <div><label className="block text-xs font-semibold mb-1">Jumlah Tanggungan *</label><input required type="number" min={0} max={3} value={form.jumlah_tanggungan ?? ''} onChange={e => setForm(p => ({ ...p, jumlah_tanggungan: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none" /></div>
              <div><label className="block text-xs font-semibold mb-1">No. Rekening BNI (10 digit) *</label><input required maxLength={10} pattern="[0-9]{10}" value={form.bank_account_number || ''} onChange={e => setForm(p => ({ ...p, bank_account_number: e.target.value.replace(/\D/g, '').slice(0, 10) }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none" /></div>
              <div><label className="block text-xs font-semibold mb-1">Status Kepegawaian *</label><select required value={form.status_kepegawaian || ''} onChange={e => setForm(p => ({ ...p, status_kepegawaian: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none"><option value="">Pilih</option><option value="tetap">Tetap</option><option value="kontrak">Kontrak</option></select></div>
              {form.status_kepegawaian === 'kontrak' && <div><label className="block text-xs font-semibold mb-1">Durasi Kontrak (bulan) *</label><input required type="number" min={1} max={120} value={form.durasi_kontrak_bulan || ''} onChange={e => setForm(p => ({ ...p, durasi_kontrak_bulan: e.target.value }))} className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none" /></div>}
              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 text-xs">Batal</button>
                <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] font-bold text-xs transition-all disabled:opacity-50">{submitting ? 'Simpan...' : 'Simpan Karyawan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
