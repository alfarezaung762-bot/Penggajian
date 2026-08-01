'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Plus, Edit, Trash2, Briefcase, Search, X, HelpCircle } from 'lucide-react'

interface JabatanItem {
  id: number
  nama: string
  gaji_pokok: number | string
  tunjangan_jabatan: number | string
  uang_makan: number | string
  _count?: {
    employee?: number
  }
}

export default function JabatanPage() {
  const { showToast } = useToast()
  const [jabatanList, setJabatanList] = useState<JabatanItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    gaji_pokok: '',
    tunjangan_jabatan: '',
    uang_makan: ''
  })

  const fetchJabatan = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/crud_jabatan')
      const data = await res.json()
      if (data.data) setJabatanList(data.data)
    } catch {
      showToast('Gagal memuat data jabatan', 'error')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    fetchJabatan()
  }, [fetchJabatan])

  const openAdd = () => {
    setEditId(null)
    setForm({ nama: '', gaji_pokok: '', tunjangan_jabatan: '', uang_makan: '' })
    setShowModal(true)
  }

  const openEdit = (j: JabatanItem) => {
    setEditId(j.id)
    setForm({
      nama: j.nama,
      gaji_pokok: String(j.gaji_pokok),
      tunjangan_jabatan: String(j.tunjangan_jabatan),
      uang_makan: String(j.uang_makan)
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = {
        nama: form.nama,
        gaji_pokok: Number(form.gaji_pokok),
        tunjangan_jabatan: Number(form.tunjangan_jabatan || 0),
        uang_makan: Number(form.uang_makan || 0)
      }
      const url = editId ? `/api/crud_jabatan/${editId}` : '/api/crud_jabatan'
      const method = editId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan data jabatan', 'error')
        setSubmitting(false)
        return
      }

      showToast(editId ? 'Data Jabatan berhasil diperbarui!' : 'Jabatan baru berhasil ditambahkan!', 'success')
      setShowModal(false)
      fetchJabatan()
    } catch {
      showToast('Terjadi kesalahan saat menyimpan data', 'error')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data jabatan ini?')) return
    try {
      const res = await fetch(`/api/crud_jabatan/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menghapus data jabatan', 'error')
        return
      }
      showToast('Data Jabatan berhasil dihapus!', 'success')
      fetchJabatan()
    } catch {
      showToast('Gagal menghapus data', 'error')
    }
  }

  const fmt = (n: unknown) =>
    Number(n || 0).toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    })

  const filteredJabatan = jabatanList.filter((j) =>
    j.nama.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header & Main Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Data Jabatan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola nominal Gaji Pokok, Tunjangan Jabatan, dan Uang Makan harian per posisi.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs"
        >
          <Plus size={16} /> Tambah Jabatan Baru
        </button>
      </div>

      {/* Toolbar Search */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari Nama Jabatan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total: <span className="font-bold text-slate-900">{filteredJabatan.length} Jabatan</span>
        </div>
      </div>

      {/* Table Data Jabatan */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3.5">Nama Jabatan</th>
                <th className="text-right px-6 py-3.5">Gaji Pokok</th>
                <th className="text-right px-6 py-3.5">Tunjangan Jabatan</th>
                <th className="text-right px-6 py-3.5">Uang Makan / Hari</th>
                <th className="text-center px-6 py-3.5">Jumlah Karyawan</th>
                <th className="text-right px-6 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredJabatan.map((j) => (
                <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{j.nama}</td>
                  <td className="px-6 py-4 text-right font-mono font-semibold text-slate-800">{fmt(j.gaji_pokok)}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">{fmt(j.tunjangan_jabatan)}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">{fmt(j.uang_makan)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 font-mono font-bold text-slate-700 text-[11px]">
                      {j._count?.employee || 0} Orang
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(j)}
                        title="Edit Data Jabatan"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(j.id)}
                        title="Hapus Jabatan"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredJabatan.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                    {loading ? 'Memuat data jabatan...' : 'Tidak ada data jabatan ditemukan'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Standardized CRUD Form */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase size={16} className="text-blue-600" />
                {editId ? 'Edit Data Jabatan' : 'Tambah Jabatan Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Jabatan *</label>
                  <input
                    required
                    value={form.nama}
                    onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                    placeholder="Contoh: Senior Developer / Staf HRD"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gaji Pokok (IDR) *</label>
                  <input
                    required
                    type="number"
                    min={0}
                    value={form.gaji_pokok}
                    onChange={(e) => setForm((p) => ({ ...p, gaji_pokok: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <label className="block font-bold text-slate-700">Tunjangan Jabatan (IDR)</label>
                    <div className="group relative flex items-center">
                      <HelpCircle size={14} className="text-slate-400 hover:text-slate-600 cursor-pointer" />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block w-64 p-2 bg-slate-900 text-white text-[11px] font-normal rounded-lg shadow-lg z-50 pointer-events-none">
                        Tunjangan tetap berdasarkan level posisi, tanggung jawab manajerial, keahlian struktural, & tingkat risiko posisi kerja.
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={form.tunjangan_jabatan}
                    onChange={(e) => setForm((p) => ({ ...p, tunjangan_jabatan: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">*Mencakup kompensasi tanggung jawab posisi, level manajerial, & keahlian struktural.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Uang Makan per Hari (IDR)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.uang_makan}
                    onChange={(e) => setForm((p) => ({ ...p, uang_makan: e.target.value }))}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Footer Modal Action */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition-all disabled:opacity-50 shadow-xs"
                >
                  {submitting ? 'Simpan...' : 'Simpan Jabatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
