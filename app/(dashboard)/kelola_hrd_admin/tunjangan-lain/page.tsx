'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Plus, Edit, Trash2, Info, Gift, Search, X, Calendar } from 'lucide-react'

interface JabatanRef {
  id: number
  nama: string
}

interface TunjanganItem {
  id: number
  nama: string
  nominal: number | string
  jabatan_id?: number | null
  tanggal_pencairan: string
  status_aktif: boolean
  jabatan_target?: JabatanRef | null
}

export default function TunjanganLainPage() {
  const { showToast } = useToast()
  const [tunjanganList, setTunjanganList] = useState<TunjanganItem[]>([])
  const [jabatanList, setJabatanList] = useState<JabatanRef[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    nominal: '',
    jabatan_target_id: '',
    tanggal_pencairan: '',
    status_aktif: true
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [tRes, jRes] = await Promise.all([
        fetch('/api/tunjangan-lain'),
        fetch('/api/crud_jabatan')
      ])
      const tData = await tRes.json()
      const jData = await jRes.json()
      if (tData.data) setTunjanganList(tData.data)
      if (jData.data) setJabatanList(jData.data)
    } catch {
      showToast('Gagal memuat data tunjangan', 'error')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openAdd = () => {
    setEditId(null)
    setForm({
      nama: '',
      nominal: '',
      jabatan_target_id: '',
      tanggal_pencairan: '',
      status_aktif: true
    })
    setShowModal(true)
  }

  const openEdit = (t: TunjanganItem) => {
    setEditId(t.id)
    setForm({
      nama: t.nama,
      nominal: String(t.nominal),
      jabatan_target_id: t.jabatan_id ? String(t.jabatan_id) : '',
      tanggal_pencairan: (t.tanggal_pencairan as string).split('T')[0],
      status_aktif: t.status_aktif
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = {
        nama: form.nama,
        nominal: Number(form.nominal),
        jabatan_target_id: form.jabatan_target_id ? Number(form.jabatan_target_id) : null,
        tanggal_pencairan: form.tanggal_pencairan,
        status_aktif: form.status_aktif
      }
      const url = editId ? `/api/tunjangan-lain/${editId}` : '/api/tunjangan-lain'
      const res = await fetch(url, {
        method: editId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan tunjangan', 'error')
        setSubmitting(false)
        return
      }
      showToast(editId ? 'Data tunjangan berhasil diperbarui!' : 'Tunjangan baru berhasil dibuat!', 'success')
      setShowModal(false)
      fetchData()
    } catch {
      showToast('Gagal menyimpan tunjangan', 'error')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tunjangan ini?')) return
    try {
      const res = await fetch(`/api/tunjangan-lain/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Gagal menghapus tunjangan', 'error')
        return
      }
      showToast('Data tunjangan berhasil dihapus!', 'success')
      fetchData()
    } catch {
      showToast('Terjadi kesalahan saat menghapus', 'error')
    }
  }

  const fmt = (n: unknown) =>
    Number(n || 0).toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    })

  const filteredTunjangan = tunjanganList.filter((t) => {
    const query = search.toLowerCase()
    const nameMatch = t.nama.toLowerCase().includes(query)
    const targetMatch = (t.jabatan_target?.nama || 'Semua Jabatan').toLowerCase().includes(query)
    return nameMatch || targetMatch
  })

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Tunjangan Lainnya</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola pencairan tunjangan insidental seperti THR, Bonus Tahunan, atau Pesangon Karyawan.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs"
        >
          <Plus size={16} /> Buat Tunjangan Baru
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
            placeholder="Cari Nama Tunjangan atau Target..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total: <span className="font-bold text-slate-900">{filteredTunjangan.length} Tunjangan</span>
        </div>
      </div>

      {/* Table Tunjangan */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3.5">No</th>
                <th className="text-left px-6 py-3.5">Nama Tunjangan</th>
                <th className="text-left px-6 py-3.5">Target Jabatan</th>
                <th className="text-right px-6 py-3.5">Nominal</th>
                <th className="text-left px-6 py-3.5">Tgl Pencairan</th>
                <th className="text-center px-6 py-3.5">Status</th>
                <th className="text-right px-6 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTunjangan.map((t, idx) => (
                <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-400">{idx + 1}</td>
                  <td className="px-6 py-4 font-bold text-slate-900">{t.nama}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                      {t.jabatan_target?.nama || 'Semua Jabatan'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">{fmt(t.nominal)}</td>
                  <td className="px-6 py-4 text-slate-700 font-semibold">
                    {new Date(t.tanggal_pencairan).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                        t.status_aktif
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {t.status_aktif ? 'DISALURKAN' : 'LOCKED'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(t)}
                        title="Edit Tunjangan"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(t.id)}
                        title="Hapus Tunjangan"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredTunjangan.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                    {loading ? 'Memuat data tunjangan...' : 'Belum ada data tunjangan insidental'}
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
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Gift size={16} className="text-blue-600" />
                {editId ? 'Edit Tunjangan Insidental' : 'Buat Tunjangan Insidental Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Tunjangan *</label>
                  <input
                    required
                    type="text"
                    value={form.nama}
                    onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                    placeholder="Contoh: THR Keagamaan 2026 / Bonus Akhir Tahun"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nominal (IDR) *</label>
                    <input
                      required
                      type="number"
                      min={0}
                      value={form.nominal}
                      onChange={(e) => setForm((p) => ({ ...p, nominal: e.target.value }))}
                      placeholder="0"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tanggal Pencairan *</label>
                    <input
                      required
                      type="date"
                      value={form.tanggal_pencairan}
                      onChange={(e) => setForm((p) => ({ ...p, tanggal_pencairan: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Jabatan</label>
                  <select
                    value={form.jabatan_target_id}
                    onChange={(e) => setForm((p) => ({ ...p, jabatan_target_id: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Semua Jabatan (Seluruh Karyawan)</option>
                    {jabatanList.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.nama}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Callout Box */}
                <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-[11px] flex items-start gap-2.5">
                  <Info size={16} className="shrink-0 mt-0.5 text-blue-600" />
                  <p className="leading-relaxed">
                    Tunjangan ini akan otomatis ditambahkan ke slip gaji karyawan pada periode penggajian yang mencakup tanggal pencairan.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
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
                  {submitting ? 'Simpan...' : 'Simpan Tunjangan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
