'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Plus, Edit, Trash2, DollarSign, Search, X, Info, Sliders } from 'lucide-react'

interface PotonganItem {
  id: number
  nama: string
  kategori: 'bpjs' | 'pajak' | 'kehadiran' | 'kustom' | string
  mode_hitung: 'otomatis' | 'manual' | string
  tipe_nilai: 'persen' | 'nominal' | string
  nilai_default: number | string | null
  status_aktif: boolean
}

export default function PotonganGajiPage() {
  const { showToast } = useToast()
  const [potonganList, setPotonganList] = useState<PotonganItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    nama: '',
    kategori: 'bpjs',
    mode_hitung: 'otomatis',
    tipe_nilai: 'persen',
    nilai_default: '',
    status_aktif: true
  })

  const fetchPotongan = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/potongan')
      const data = await res.json()
      if (data.data) setPotonganList(data.data)
    } catch {
      showToast('Gagal memuat data potongan', 'error')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    fetchPotongan()
  }, [fetchPotongan])

  const openAdd = () => {
    setEditId(null)
    setForm({
      nama: '',
      kategori: 'bpjs',
      mode_hitung: 'otomatis',
      tipe_nilai: 'persen',
      nilai_default: '',
      status_aktif: true
    })
    setShowModal(true)
  }

  const openEdit = (p: PotonganItem) => {
    setEditId(p.id)
    setForm({
      nama: p.nama,
      kategori: p.kategori,
      mode_hitung: p.mode_hitung,
      tipe_nilai: p.tipe_nilai,
      nilai_default: String(p.nilai_default ?? ''),
      status_aktif: p.status_aktif
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body = {
        ...form,
        nilai_default: form.nilai_default ? Number(form.nilai_default) : null
      }
      const url = editId ? `/api/potongan/${editId}` : '/api/potongan'
      const method = editId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan potongan', 'error')
        setSubmitting(false)
        return
      }

      showToast(editId ? 'Jenis potongan berhasil diperbarui!' : 'Jenis potongan baru berhasil ditambahkan!', 'success')
      setShowModal(false)
      fetchPotongan()
    } catch {
      showToast('Terjadi kesalahan saat menyimpan data', 'error')
    }
    setSubmitting(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jenis potongan ini?')) return
    try {
      const res = await fetch(`/api/potongan/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Gagal menghapus potongan', 'error')
        return
      }
      showToast('Jenis potongan berhasil dihapus!', 'success')
      fetchPotongan()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  const getKategoriBadge = (kategori: string) => {
    switch (kategori) {
      case 'bpjs':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-700 border border-blue-200">BPJS</span>
      case 'pajak':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 border border-purple-200">Pajak PPh21</span>
      case 'kehadiran':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-700 border border-amber-200">Kehadiran</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">Kustom</span>
    }
  }

  const filteredPotongan = potonganList.filter((p) => {
    const query = search.toLowerCase()
    return p.nama.toLowerCase().includes(query) || p.kategori.toLowerCase().includes(query)
  })

  return (
    <div className="space-y-6">
      {/* Header & Button */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Potongan Gaji</h1>
          <p className="text-xs text-slate-500 mt-0.5">Pengaturan jenis potongan wajib, pajak PPh21, BPJS, denda ketidakhadiran, dan potongan kustom.</p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs"
        >
          <Plus size={16} /> Tambah Jenis Potongan
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
            placeholder="Cari Nama atau Kategori Potongan..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 border border-gray-300 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total: <span className="font-bold text-slate-900">{filteredPotongan.length} Jenis Potongan</span>
        </div>
      </div>

      {/* Table Potongan Gaji */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3.5">Nama Potongan</th>
                <th className="text-left px-6 py-3.5">Kategori</th>
                <th className="text-left px-6 py-3.5">Mode Hitung</th>
                <th className="text-right px-6 py-3.5">Nilai Default</th>
                <th className="text-center px-6 py-3.5">Status</th>
                <th className="text-right px-6 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredPotongan.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{p.nama}</td>
                  <td className="px-6 py-4">{getKategoriBadge(p.kategori)}</td>
                  <td className="px-6 py-4 capitalize font-medium text-slate-700">{p.mode_hitung}</td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                    {p.tipe_nilai === 'persen'
                      ? `${p.nilai_default ?? 0}%`
                      : `Rp ${Number(p.nilai_default || 0).toLocaleString('id-ID')}`}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                        p.status_aktif
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {p.status_aktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        title="Edit Potongan"
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        title="Hapus Potongan"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPotongan.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                    {loading ? 'Memuat data potongan...' : 'Tidak ada data potongan ditemukan'}
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
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <DollarSign size={16} className="text-blue-600" />
                {editId ? 'Edit Jenis Potongan' : 'Tambah Jenis Potongan Baru'}
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
                  <label className="block font-bold text-slate-700 mb-1">Nama Potongan *</label>
                  <input
                    required
                    value={form.nama}
                    onChange={(e) => setForm((p) => ({ ...p, nama: e.target.value }))}
                    placeholder="Contoh: BPJS Kesehatan / Potongan Keamanan / Denda Alpha"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Dropdown 3 Opsi Perhitungan Eksplisit */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-slate-700">Metode & Rumus Perhitungan *</label>
                    <span className="text-[11px] text-blue-600 font-semibold">Pilih 1 dari 3 Metode</span>
                  </div>
                  <select
                    value={
                      form.kategori === 'pajak'
                        ? 'pph21'
                        : form.kategori === 'kehadiran'
                        ? 'absensi'
                        : 'manual'
                    }
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((p) => {
                        if (val === 'pph21') {
                          return { ...p, kategori: 'pajak', mode_hitung: 'otomatis', tipe_nilai: 'nominal', nilai_default: '0' }
                        } else if (val === 'absensi') {
                          return { ...p, kategori: 'kehadiran', mode_hitung: 'otomatis', tipe_nilai: 'nominal', nilai_default: '0' }
                        } else {
                          return { ...p, kategori: 'kustom', mode_hitung: 'manual', tipe_nilai: 'nominal' }
                        }
                      })
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pph21">🏛️ 1. Berdasarkan Perhitungan Pajak PPh 21 (Rumus UU HPP & PTKP)</option>
                    <option value="absensi">⏰ 2. Berdasarkan Perhitungan Absensi (Denda Alpha / Ketidakhadiran)</option>
                    <option value="manual">✍️ 3. Manual (Input Rate % atau Nominal Rp Fixed)</option>
                  </select>
                </div>

                {/* Sub-Kategori Khusus Jika Memilih Mode Manual */}
                {form.mode_hitung === 'manual' && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori Potongan Manual *</label>
                    <select
                      value={form.kategori}
                      onChange={(e) => setForm((p) => ({ ...p, kategori: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="bpjs">BPJS (Kesehatan / JHT / JP)</option>
                      <option value="kustom">Kustom / Lainnya (Potongan Keamanan, Seragam, Koperasi, Kasbon)</option>
                    </select>
                  </div>
                )}

                {/* Banner Penjelasan & Tooltip per Metode */}
                {form.kategori === 'pajak' ? (
                  <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl text-[11px] text-purple-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-purple-950">
                      <Info size={14} /> Berdasarkan Perhitungan Pajak PPh 21 (Otomasis Engine)
                    </p>
                    <p className="text-purple-800 leading-relaxed">
                      Potongan dihitung dinamis dari Tarif Progresif (5%, 15%, 25%, 30%) dikurangi Batas PTKP Karyawan (TK/0 s/d K/3). HRD tidak perlu memasukkan angka manual.
                    </p>
                  </div>
                ) : form.kategori === 'kehadiran' ? (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-blue-950">
                      <Info size={14} /> Berdasarkan Perhitungan Absensi (Otomatis Engine)
                    </p>
                    <p className="text-blue-800 leading-relaxed">
                      Potongan dihitung dinamis dari database absensi: <code className="bg-blue-100 px-1 py-0.5 rounded font-mono">Hari Alpha x (Gaji Pokok / 30)</code>. HRD tidak perlu memasukkan angka manual.
                    </p>
                  </div>
                ) : (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950">
                      <Sliders size={14} /> Mode Manual (Input Patokan Rate % / Nominal Rp Fixed)
                    </p>
                    <p className="text-amber-800 leading-relaxed">
                      Masukkan nilai persentase dari Gaji Pokok (seperti BPJS Kesehatan 1%, JHT 2%) atau nominal rupiah tetap (seperti Potongan Keamanan, Seragam, atau Koperasi Rp 50.000).
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tipe Nilai *</label>
                    <select
                      disabled={form.mode_hitung === 'otomatis'}
                      value={form.tipe_nilai}
                      onChange={(e) => setForm((p) => ({ ...p, tipe_nilai: e.target.value }))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    >
                      <option value="persen">Persentase (%)</option>
                      <option value="nominal">Nominal Tetap (Rp)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      {form.mode_hitung === 'otomatis' ? 'Nilai Default (Otomatis Engine)' : 'Nilai Default *'}
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min={0}
                      disabled={form.mode_hitung === 'otomatis'}
                      value={form.mode_hitung === 'otomatis' ? 0 : form.nilai_default}
                      onChange={(e) => setForm((p) => ({ ...p, nilai_default: e.target.value }))}
                      placeholder={form.tipe_nilai === 'persen' ? 'Contoh: 1.0' : 'Contoh: 50000'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="status_aktif_check"
                    checked={form.status_aktif}
                    onChange={(e) => setForm((p) => ({ ...p, status_aktif: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="status_aktif_check" className="font-bold text-slate-900 cursor-pointer select-none">
                    Status Aktif (Dipakai dalam Perhitungan Gaji)
                  </label>
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
                  {submitting ? 'Simpan...' : 'Simpan Potongan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
