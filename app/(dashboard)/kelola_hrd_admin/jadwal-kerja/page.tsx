'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Calendar, Clock, Plus, Trash2, Edit, X } from 'lucide-react'

interface JadwalKerjaItem {
  id: number
  hari: string
  jam_masuk: string | null
  jam_pulang: string | null
  toleransi_telat_menit: number
}

interface HariLiburItem {
  id: number
  tanggal: string
  keterangan: string
}

export default function JadwalKerjaPage() {
  const { showToast } = useToast()
  const [jadwalList, setJadwalList] = useState<JadwalKerjaItem[]>([])
  const [liburList, setLiburList] = useState<HariLiburItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'jadwal' | 'libur'>('jadwal')
  const [submitting, setSubmitting] = useState(false)

  const [editJadwal, setEditJadwal] = useState<{
    id: number
    hari: string
    is_libur: boolean
    jam_masuk: string
    jam_pulang: string
    toleransi_telat_menit: number
  } | null>(null)

  const [formLibur, setFormLibur] = useState({ tanggal: '', keterangan: '' })

  const extractHHMM = (val: string | null): string => {
    if (!val) return ''
    if (val.includes('T')) {
      const d = new Date(val)
      const h = String(d.getUTCHours()).padStart(2, '0')
      const m = String(d.getUTCMinutes()).padStart(2, '0')
      return `${h}:${m}`
    }
    return val.substring(0, 5)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/jadwal-kerja')
      const data = await res.json()
      if (data.data) {
        setJadwalList(data.data.jadwal || [])
        setLiburList(data.data.hari_libur || [])
      }
    } catch {
      showToast('Gagal memuat data jadwal kerja', 'error')
    }
    setLoading(false)
  }, [showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openEditModal = (item: JadwalKerjaItem) => {
    const isLibur = !item.jam_masuk || !item.jam_pulang
    setEditJadwal({
      id: item.id,
      hari: item.hari,
      is_libur: isLibur,
      jam_masuk: isLibur ? '08:00' : extractHHMM(item.jam_masuk),
      jam_pulang: isLibur ? '17:00' : extractHHMM(item.jam_pulang),
      toleransi_telat_menit: item.toleransi_telat_menit ?? 15,
    })
  }

  const handleUpdateJadwal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editJadwal) return
    setSubmitting(true)
    try {
      const payload = {
        hari: editJadwal.hari,
        jam_masuk: editJadwal.is_libur ? null : editJadwal.jam_masuk,
        jam_pulang: editJadwal.is_libur ? null : editJadwal.jam_pulang,
        toleransi_telat_menit: editJadwal.is_libur ? 0 : Number(editJadwal.toleransi_telat_menit || 15),
      }

      const res = await fetch('/api/jadwal-kerja', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menyimpan shift', 'error')
        setSubmitting(false)
        return
      }

      showToast(`Jadwal hari ${editJadwal.hari.toUpperCase()} berhasil diperbarui!`, 'success')
      setEditJadwal(null)
      fetchData()
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error')
    }
    setSubmitting(false)
  }

  const handleAddLibur = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/jadwal-kerja/hari-libur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formLibur),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menambahkan hari libur', 'error')
        setSubmitting(false)
        return
      }
      showToast('Hari libur berhasil ditambahkan!', 'success')
      setFormLibur({ tanggal: '', keterangan: '' })
      fetchData()
    } catch {
      showToast('Gagal menambah hari libur', 'error')
    }
    setSubmitting(false)
  }

  const handleDeleteLibur = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tanggal libur ini?')) return
    try {
      const res = await fetch(`/api/jadwal-kerja/hari-libur/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Gagal menghapus hari libur', 'error')
        return
      }
      showToast('Hari libur berhasil dihapus!', 'success')
      fetchData()
    } catch {
      showToast('Terjadi kesalahan', 'error')
    }
  }

  const formatDisplayTime = (val: string | null) => {
    if (!val) return <span className="inline-block px-2.5 py-1 text-[10px] font-extrabold text-amber-800 bg-amber-100 border border-amber-200 rounded-full uppercase">Libur Mingguan</span>
    const timeStr = extractHHMM(val)
    return <span className="font-mono text-xs font-bold text-slate-900">{timeStr} WIB</span>
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Pengaturan Shift & Kalender Libur</h1>
        <p className="text-xs text-slate-500 mt-0.5">Konfigurasi jam masuk, jam pulang, toleransi keterlambatan harian, dan tanggal hari libur perusahaan.</p>
      </div>

      {/* Tabs Switcher */}
      <div className="flex gap-1.5 p-1 bg-white border border-slate-200 rounded-2xl w-fit shadow-xs">
        <button
          onClick={() => setTab('jadwal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'jadwal'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock size={14} className="inline mr-1.5" /> Jam Kerja Harian
        </button>
        <button
          onClick={() => setTab('libur')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            tab === 'libur'
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar size={14} className="inline mr-1.5" /> Kalender Hari Libur
        </button>
      </div>

      {/* Content Tab 1: Jadwal Kerja */}
      {tab === 'jadwal' ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3.5">Hari</th>
                  <th className="text-left px-6 py-3.5">Jam Masuk</th>
                  <th className="text-left px-6 py-3.5">Jam Pulang</th>
                  <th className="text-center px-6 py-3.5">Toleransi Telat</th>
                  <th className="text-right px-6 py-3.5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {jadwalList.map((j) => (
                  <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-extrabold text-slate-900 capitalize text-sm">{j.hari}</td>
                    <td className="px-6 py-4">{formatDisplayTime(j.jam_masuk)}</td>
                    <td className="px-6 py-4">{formatDisplayTime(j.jam_pulang)}</td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-slate-800">
                      {j.jam_masuk ? `${j.toleransi_telat_menit} Menit` : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(j)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0f172a] hover:text-white text-slate-800 text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs"
                        title="Atur Shift Hari Ini"
                      >
                        <Edit size={14} /> Atur Shift
                      </button>
                    </td>
                  </tr>
                ))}
                {jadwalList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                      {loading ? 'Memuat data jadwal kerja...' : 'Belum ada data jadwal kerja'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Content Tab 2: Kalender Libur */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Form Input Libur */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Plus size={18} className="text-blue-600" /> Tambah Hari Libur Nasional
            </h3>
            <form onSubmit={handleAddLibur} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Libur *</label>
                <input
                  required
                  type="date"
                  value={formLibur.tanggal}
                  onChange={(e) => setFormLibur((p) => ({ ...p, tanggal: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Keterangan / Nama Libur *</label>
                <input
                  required
                  value={formLibur.keterangan}
                  onChange={(e) => setFormLibur((p) => ({ ...p, keterangan: e.target.value }))}
                  placeholder="Contoh: Idul Fitri 1447 H / Cuti Bersama"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-xl font-bold transition-all disabled:opacity-50 shadow-xs text-xs"
              >
                {submitting ? 'Menyimpan...' : 'Simpan Hari Libur'}
              </button>
            </form>
          </div>

          {/* Tabel Daftar Libur */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="text-left px-6 py-3.5">Tanggal Libur</th>
                    <th className="text-left px-6 py-3.5">Keterangan</th>
                    <th className="text-right px-6 py-3.5">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {liburList.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {new Date(l.tanggal).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-slate-700 font-semibold">{l.keterangan}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteLibur(l.id)}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                          title="Hapus Tanggal Libur"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {liburList.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-10 text-slate-400 font-medium">
                        Belum ada data hari libur tersimpan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Shift — Standardized CRUD Modal */}
      {editJadwal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setEditJadwal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                Konfigurasi Shift — Hari {editJadwal.hari.toUpperCase()}
              </h3>
              <button
                onClick={() => setEditJadwal(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateJadwal}>
              <div className="p-6 space-y-4 text-xs">
                <div className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    id="is_libur_check"
                    checked={editJadwal.is_libur}
                    onChange={(e) => setEditJadwal((p) => ({ ...p!, is_libur: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="is_libur_check" className="font-bold text-slate-900 cursor-pointer select-none">
                    Set Hari Ini Sebagai Libur Mingguan
                  </label>
                </div>

                {!editJadwal.is_libur && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Jam Masuk (HH:mm) *</label>
                        <input
                          type="time"
                          required
                          value={editJadwal.jam_masuk}
                          onChange={(e) => setEditJadwal((p) => ({ ...p!, jam_masuk: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Jam Pulang (HH:mm) *</label>
                        <input
                          type="time"
                          required
                          value={editJadwal.jam_pulang}
                          onChange={(e) => setEditJadwal((p) => ({ ...p!, jam_pulang: e.target.value }))}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Toleransi Keterlambatan (Menit)</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={editJadwal.toleransi_telat_menit}
                        onChange={(e) =>
                          setEditJadwal((p) => ({ ...p!, toleransi_telat_menit: parseInt(e.target.value) || 0 }))
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-slate-50 text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Keterlambatan di bawah toleransi ini tidak memicu denda potongan telat.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditJadwal(null)}
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
                  {submitting ? 'Menyimpan...' : 'Simpan Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
