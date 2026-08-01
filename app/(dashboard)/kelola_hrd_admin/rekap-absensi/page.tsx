'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Search, Printer, Edit, ShieldAlert, CheckCircle, AlertTriangle, XCircle, FileText, Image as ImageIcon, Calendar, RotateCcw, Filter } from 'lucide-react'

interface EmployeeData {
  id: number
  name: string
  nik: string
  jabatan?: { nama: string }
}

interface AbsensiItem {
  id: number
  employee_id: number
  tanggal: string
  jam_masuk: string | null
  jam_pulang: string | null
  foto_masuk_url: string | null
  foto_pulang_url: string | null
  status: string
  dikoreksi_hrd?: boolean
  catatan_alasan?: string | null
  employee?: EmployeeData
}

export default function RekapAbsensiPage() {
  const { showToast } = useToast()
  const [absensiList, setAbsensiList] = useState<AbsensiItem[]>([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())

  // Default tanggal spesifik = Hari Ini (YYYY-MM-DD)
  const getTodayStr = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Tipe filter: 'tanggal' (spesifik / range), 'bulan', 'tahun'
  const [tipeFilter, setTipeFilter] = useState<'tanggal' | 'bulan' | 'tahun'>('tanggal')
  const [tanggalMulai, setTanggalMulai] = useState<string>(getTodayStr())
  const [tanggalSelesai, setTanggalSelesai] = useState<string>(getTodayStr())

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('semua')

  // State Modal Detail & Koreksi
  const [selectedAbsensi, setSelectedAbsensi] = useState<AbsensiItem | null>(null)
  const [koreksiStatus, setKoreksiStatus] = useState<string>('alpha')
  const [koreksiAlasan, setKoreksiAlasan] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  const fetchRekap = useCallback(async () => {
    setLoading(true)
    try {
      let queryUrl = `/api/absensi?limit=300`
      if (tipeFilter === 'tanggal') {
        if (tanggalMulai && tanggalSelesai) {
          queryUrl += `&start_date=${tanggalMulai}&end_date=${tanggalSelesai}`
        } else if (tanggalMulai) {
          queryUrl += `&tanggal=${tanggalMulai}`
        }
      } else if (tipeFilter === 'bulan') {
        queryUrl += `&bulan=${bulan}&tahun=${tahun}`
      } else if (tipeFilter === 'tahun') {
        queryUrl += `&tahun=${tahun}`
      }

      const res = await fetch(queryUrl)
      const data = await res.json()
      if (data.data?.absensi) {
        setAbsensiList(data.data.absensi)
      } else {
        setAbsensiList([])
      }
    } catch {
      showToast('Gagal memuat rekap absensi', 'error')
    }
    setLoading(false)
  }, [tipeFilter, tanggalMulai, tanggalSelesai, bulan, tahun, showToast])

  useEffect(() => {
    fetchRekap()
  }, [fetchRekap])

  const filtered = absensiList.filter((a) => {
    const empName = (a.employee?.name || '').toLowerCase()
    const nik = (a.employee?.nik || '').toLowerCase()
    const query = search.toLowerCase()
    const matchQuery = empName.includes(query) || nik.includes(query)
    const matchStatus = statusFilter === 'semua' || a.status === statusFilter
    return matchQuery && matchStatus
  })

  // Summary counts
  const totalHadir = filtered.filter(a => a.status === 'hadir').length
  const totalTelat = filtered.filter(a => a.status === 'telat').length
  const totalAlpha = filtered.filter(a => a.status === 'alpha').length
  const totalSakitCuti = filtered.filter(a => a.status === 'sakit' || a.status === 'cuti').length

  const openKoreksiModal = (item: AbsensiItem) => {
    setSelectedAbsensi(item)
    setKoreksiStatus(item.status)
    setKoreksiAlasan(item.catatan_alasan || '')
  }

  const handleKoreksiSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAbsensi) return
    if (!koreksiAlasan.trim()) {
      showToast('Catatan alasan koreksi wajib diisi oleh HRD', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/absensi/${selectedAbsensi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: koreksiStatus,
          alasan: koreksiAlasan,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal mengoreksi status absensi', 'error')
        setSubmitting(false)
        return
      }

      showToast('Status absensi berhasil dikoreksi & dicatat di Audit Log!', 'success')
      setSelectedAbsensi(null)
      fetchRekap()
    } catch {
      showToast('Terjadi kesalahan koneksi', 'error')
    }
    setSubmitting(false)
  }

  const handleResetFilter = () => {
    setTipeFilter('bulan')
    setBulan(new Date().getMonth() + 1)
    setTahun(new Date().getFullYear())
    setStatusFilter('semua')
    setSearch('')
  }

  const handleSetToday = () => {
    setTipeFilter('tanggal')
    const today = getTodayStr()
    setTanggalMulai(today)
    setTanggalSelesai(today)
  }

  const handlePrint = () => {
    window.print()
  }

  const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  const formatTime = (val: string | null) => {
    if (!val) return '--:--'
    const d = new Date(val)
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-6">
      {/* Header & Tombol Cetak */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Rekapitulasi Kehadiran Karyawan</h1>
          <p className="text-xs text-slate-500 mt-0.5">Monitoring absensi harian, filter spesifik tanggal, bukti foto selfie, dan koreksi HRD.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs no-print"
        >
          <Printer size={15} /> Cetak Rekap Absensi
        </button>
      </div>

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 no-print">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Hadir Tepat Waktu</span>
            <CheckCircle size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalHadir}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-amber-600">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Terlambat</span>
            <AlertTriangle size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalTelat}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-rose-600">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alpha (Tanpa Ket.)</span>
            <XCircle size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalAlpha}</p>
        </div>
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between text-blue-600">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sakit / Cuti</span>
            <FileText size={18} />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalSakitCuti}</p>
        </div>
      </div>

      {/* Filter Toolbar Terperinci */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4 no-print">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Filter size={15} className="text-blue-600" /> Filter Presensi Karyawan
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSetToday}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 ${
                tipeFilter === 'tanggal' && tanggalMulai === getTodayStr() && tanggalSelesai === getTodayStr()
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Calendar size={12} /> Presensi Hari Ini
            </button>
            <button
              onClick={handleResetFilter}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <RotateCcw size={12} /> Tampilkan Semua Hari (Bulan Ini)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Mode Dropdown */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Mode Filter Waktu</label>
            <select
              value={tipeFilter}
              onChange={(e) => setTipeFilter(e.target.value as 'tanggal' | 'bulan' | 'tahun')}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
            >
              <option value="tanggal">📅 Tanggal Spesifik / Rentang Tanggal</option>
              <option value="bulan">🗓️ Filter Periode Bulan</option>
              <option value="tahun">📊 Filter Periode Tahun</option>
            </select>
          </div>

          {/* Dynamic Controls based on tipeFilter */}
          {tipeFilter === 'tanggal' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dari Tanggal</label>
                <input
                  type="date"
                  value={tanggalMulai}
                  onChange={(e) => setTanggalMulai(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sampai Tanggal</label>
                <input
                  type="date"
                  value={tanggalSelesai}
                  onChange={(e) => setTanggalSelesai(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
                />
              </div>
            </>
          )}

          {tipeFilter === 'bulan' && (
            <>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Periode Bulan</label>
                <select
                  value={bulan}
                  onChange={(e) => setBulan(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
                >
                  {namaBulan.slice(1).map((n, i) => (
                    <option key={i + 1} value={i + 1}>{n}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun</label>
                <select
                  value={tahun}
                  onChange={(e) => setTahun(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
                >
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {tipeFilter === 'tahun' && (
            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pilih Tahun</label>
              <select
                value={tahun}
                onChange={(e) => setTahun(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status Kehadiran</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none capitalize"
            >
              <option value="semua">Semua Status</option>
              <option value="hadir">Hadir</option>
              <option value="telat">Telat</option>
              <option value="alpha">Alpha</option>
              <option value="sakit">Sakit</option>
              <option value="cuti">Cuti</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pencarian Karyawan</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="NIK / Nama..."
                className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-slate-50 border border-gray-300 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabel Data Rekap */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Daftar Log Presensi — {
              tipeFilter === 'tanggal'
                ? (tanggalMulai === tanggalSelesai
                    ? `Tanggal ${new Date(tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                    : `Rentang ${new Date(tanggalMulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} s/d ${new Date(tanggalSelesai).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  )
                : tipeFilter === 'bulan'
                  ? `Periode ${namaBulan[bulan]} ${tahun}`
                  : `Periode Tahun ${tahun}`
            }
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{filtered.length} Data Ditemukan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3.5">Tanggal</th>
                <th className="text-left px-6 py-3.5">Karyawan</th>
                <th className="text-left px-6 py-3.5">Jam Masuk</th>
                <th className="text-left px-6 py-3.5">Jam Pulang</th>
                <th className="text-center px-6 py-3.5">Status</th>
                <th className="text-center px-6 py-3.5">Foto Bukti</th>
                <th className="text-right px-6 py-3.5 no-print">Aksi HRD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {new Date(a.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-slate-900">{a.employee?.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">NIK: {a.employee?.nik} | {a.employee?.jabatan?.nama}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-800 font-semibold">{formatTime(a.jam_masuk)}</td>
                  <td className="px-6 py-4 font-mono text-slate-800 font-semibold">{formatTime(a.jam_pulang)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`badge ${a.status === 'hadir' ? 'badge-success' : a.status === 'telat' ? 'badge-warning' : 'badge-danger'} capitalize`}>
                      {a.status}
                    </span>
                    {a.dikoreksi_hrd && (
                      <p className="text-[9px] text-indigo-600 font-bold mt-1 flex items-center justify-center gap-0.5">
                        <ShieldAlert size={10} /> Dikoreksi HRD
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {a.foto_masuk_url ? (
                        <a href={a.foto_masuk_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 inline-block hover:scale-105 transition-transform" title="Lihat Foto Masuk">
                          <img src={a.foto_masuk_url} alt="Selfie" className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right no-print">
                    <button
                      onClick={() => openKoreksiModal(a)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0f172a] hover:text-white text-slate-800 font-semibold text-xs transition-all inline-flex items-center gap-1.5"
                    >
                      <Edit size={13} /> Koreksi HRD
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    {loading ? 'Memuat data log presensi...' : 'Tidak ada data rekap absensi untuk filter ini'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail & Form Koreksi Status HRD */}
      {selectedAbsensi && (
        <div className="modal-overlay" onClick={() => setSelectedAbsensi(null)}>
          <div className="modal-content max-w-lg p-0 overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Koreksi Status Presensi — HRD</h3>
                <p className="text-[11px] text-slate-500">{selectedAbsensi.employee?.name} (NIK: {selectedAbsensi.employee?.nik})</p>
              </div>
              <button onClick={() => setSelectedAbsensi(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 font-bold">✕</button>
            </div>

            <form onSubmit={handleKoreksiSubmit} className="p-6 space-y-4 text-xs bg-white">
              {/* Pratinjau Foto Selfie Masuk & Pulang */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <ImageIcon size={12} /> Foto Selfie Masuk
                  </p>
                  {selectedAbsensi.foto_masuk_url ? (
                    <div className="h-28 rounded-lg overflow-hidden border border-slate-300">
                      <img src={selectedAbsensi.foto_masuk_url} alt="Foto Masuk" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-28 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 italic">Tanpa Foto</div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <ImageIcon size={12} /> Foto Selfie Pulang
                  </p>
                  {selectedAbsensi.foto_pulang_url ? (
                    <div className="h-28 rounded-lg overflow-hidden border border-slate-300">
                      <img src={selectedAbsensi.foto_pulang_url} alt="Foto Pulang" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="h-28 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 italic">Tanpa Foto</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Absensi Baru *</label>
                <select
                  value={koreksiStatus}
                  onChange={(e) => setKoreksiStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-bold text-slate-900 focus:outline-none capitalize"
                >
                  <option value="hadir">Hadir</option>
                  <option value="telat">Telat</option>
                  <option value="alpha">Alpha (Tanpa Keterangan)</option>
                  <option value="sakit">Sakit</option>
                  <option value="cuti">Cuti</option>
                  <option value="libur">Libur</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Alasan Koreksi HRD *</label>
                <textarea
                  required
                  rows={3}
                  value={koreksiAlasan}
                  onChange={(e) => setKoreksiAlasan(e.target.value)}
                  placeholder="Contoh: Setelah verifikasi foto selfie terbukti rekayasa AI / tidak valid. Diubah ke Alpha."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-slate-900 focus:outline-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Alasan koreksi ini wajib diisi dan akan dicatat secara otomatis pada Audit Log sistem.</p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedAbsensi(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] font-bold text-xs transition-all disabled:opacity-50 shadow-xs"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Koreksi & Audit Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
