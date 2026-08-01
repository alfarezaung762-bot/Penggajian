'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { CheckCircle2, XCircle, Eye, Search, Calendar, Check, X, FileText } from 'lucide-react'

interface EmployeeRef {
  id?: number
  name?: string
  nik?: string
  jabatan?: { nama?: string }
}

interface PengajuanItem {
  id: number
  jenis: 'cuti' | 'sakit' | 'lembur'
  tanggal_mulai_cuti?: string | null
  tanggal_selesai_cuti?: string | null
  alasan_cuti?: string | null
  tanggal_sakit?: string | null
  tanggal_lembur?: string | null
  jam_mulai_lembur?: string | null
  jam_selesai_lembur?: string | null
  total_menit_lembur?: number | null
  foto_bukti_url?: string | null
  status: 'menunggu' | 'disetujui' | 'ditolak'
  catatan_penolakan?: string | null
  diajukan_pada: string
  diproses_pada?: string | null
  employee?: EmployeeRef | null
}

export default function ApprovalPengajuanPage() {
  const { showToast } = useToast()
  const [pengajuanList, setPengajuanList] = useState<PengajuanItem[]>([])
  const [loading, setLoading] = useState(true)

  // Default filter status: 'menunggu'
  const [statusFilter, setStatusFilter] = useState('menunggu')

  // Helper tanggal hari ini YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Filter tanggal: default 'today' / 'semua' / 'spesifik'
  const [filterTanggalOption, setFilterTanggalOption] = useState<string>('semua')
  const [tanggalSpesifik, setTanggalSpesifik] = useState<string>(getTodayStr())
  const [searchQuery, setSearchQuery] = useState('')

  // State Detail Modal
  const [showDetail, setShowDetail] = useState<PengajuanItem | null>(null)
  const [processing, setProcessing] = useState(false)
  const [catatanPenolakan, setCatatanPenolakan] = useState('')
  const [keputusan, setKeputusan] = useState<'setujui' | 'tolak'>('setujui')

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (statusFilter) params.set('status', statusFilter)
      if (searchQuery.trim()) params.set('search', searchQuery.trim())

      if (filterTanggalOption === 'today') {
        params.set('tanggal', getTodayStr())
      } else if (filterTanggalOption === 'spesifik' && tanggalSpesifik) {
        params.set('tanggal', tanggalSpesifik)
      }

      const res = await fetch(`/api/pengajuan?${params}`)
      const data = await res.json()
      if (data.data?.pengajuan) setPengajuanList(data.data.pengajuan)
    } catch {
      showToast('Gagal memuat daftar pengajuan', 'error')
    }
    setLoading(false)
  }, [statusFilter, filterTanggalOption, tanggalSpesifik, searchQuery, showToast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleProses = async (id: number, status: 'disetujui' | 'ditolak') => {
    if (status === 'ditolak' && !catatanPenolakan.trim()) {
      showToast('Catatan penolakan wajib diisi jika menolak pengajuan', 'warning')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch(`/api/pengajuan/${id}/proses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          catatan_penolakan: status === 'ditolak' ? catatanPenolakan : null
        })
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal memproses pengajuan', 'error')
        setProcessing(false)
        return
      }

      showToast(`Pengajuan berhasil ${status === 'disetujui' ? 'disetujui' : 'ditolak'}!`, 'success')

      // Trigger realtime update event untuk badge di sidebar
      window.dispatchEvent(new CustomEvent('pengajuan-updated'))

      setShowDetail(null)
      setCatatanPenolakan('')
      fetchData()
    } catch {
      showToast('Gagal memproses pengajuan', 'error')
    }
    setProcessing(false)
  }

  const formatDate = (d: unknown) => {
    if (!d) return '-'
    return new Date(d as string).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Persetujuan Pengajuan Karyawan</h1>
        <p className="text-xs text-slate-500 mt-0.5">Persetujuan permohonan Cuti Tahunan, Izin Sakit, dan Lembur Karyawan.</p>
      </div>

      {/* Toolbar Filter */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl">
            {[
              { key: 'menunggu', label: '⏳ Pending' },
              { key: 'disetujui', label: '✓ Approved' },
              { key: 'ditolak', label: '✕ Rejected' },
              { key: '', label: 'All Requests' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === tab.key
                    ? 'bg-[#0f172a] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Controls: Date Filter & Search */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter Tanggal Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <Calendar size={14} /> Tanggal:
              </label>
              <select
                value={filterTanggalOption}
                onChange={(e) => setFilterTanggalOption(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-gray-300 focus:outline-none"
              >
                <option value="semua">Semua Tanggal</option>
                <option value="today">Hari Ini ({formatDate(getTodayStr())})</option>
                <option value="spesifik">Pilih Tanggal Spesifik</option>
              </select>
            </div>

            {filterTanggalOption === 'spesifik' && (
              <input
                type="date"
                value={tanggalSpesifik}
                onChange={(e) => setTanggalSpesifik(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 border border-gray-300 focus:outline-none"
              />
            )}

            {/* Pencarian Karyawan */}
            <div className="relative flex-1 md:w-56">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari NIK / Nama..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-gray-300 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feed Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3.5">Tgl Ajuan</th>
                <th className="text-left px-6 py-3.5">Karyawan</th>
                <th className="text-left px-6 py-3.5">Jenis</th>
                <th className="text-left px-6 py-3.5">Detail Permohonan</th>
                <th className="text-center px-6 py-3.5">Status</th>
                <th className="text-right px-6 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pengajuanList.map((p) => {
                const emp = p.employee
                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-700">{formatDate(p.diajukan_pada)}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      <div>
                        <p>{emp?.name || '-'}</p>
                        <p className="text-[10px] font-normal text-slate-500">{emp?.jabatan?.nama || '-'}</p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        p.jenis === 'cuti' ? 'bg-blue-100 text-blue-700' :
                        p.jenis === 'sakit' ? 'bg-amber-100 text-amber-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {p.jenis}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate font-medium">
                      {p.jenis === 'cuti' && `${formatDate(p.tanggal_mulai_cuti)} s/d ${formatDate(p.tanggal_selesai_cuti)}`}
                      {p.jenis === 'sakit' && formatDate(p.tanggal_sakit)}
                      {p.jenis === 'lembur' && `${formatDate(p.tanggal_lembur)} (${p.total_menit_lembur || 0} mnt)`}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold capitalize ${
                        p.status === 'menunggu' ? 'bg-amber-100 text-amber-800' :
                        p.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-rose-100 text-rose-800'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => { setShowDetail(p); setCatatanPenolakan('') }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center gap-1"
                          title="Lihat Detail & Keputusan"
                        >
                          <Eye size={14} /> Detail
                        </button>
                        {p.status === 'menunggu' && (
                          <>
                            <button
                              onClick={() => handleProses(p.id, 'disetujui')}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold transition-colors"
                              title="Setujui Langsung"
                            >
                              <Check size={16} />
                            </button>
                            <button
                              onClick={() => { setShowDetail(p); setCatatanPenolakan('') }}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold transition-colors"
                              title="Tolak Permohonan"
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {pengajuanList.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                    {loading ? 'Memuat data pengajuan...' : 'Tidak ada pengajuan ditemukan'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail & Approval — Ikuti Desain Modal CRUD Standard */}
      {showDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150" onClick={e => e.stopPropagation()}>
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-blue-600" /> Detail Permohonan Pengajuan
              </h3>
              <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body Content Modal */}
            <div className="p-6 space-y-5 text-xs">
              {/* Ringkasan Karyawan & Status */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pemohon</p>
                    <p className="text-sm font-extrabold text-slate-900">{showDetail.employee?.name || '-'}</p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {showDetail.employee?.nik || '-'} • {showDetail.employee?.jabatan?.nama || '-'}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold capitalize ${
                    showDetail.status === 'menunggu' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                    showDetail.status === 'disetujui' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                    'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}>
                    {showDetail.status}
                  </span>
                </div>
              </div>

              {/* Rincian Permohonan */}
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Ajuan</p>
                  <p className="font-extrabold text-slate-800 capitalize text-sm">{showDetail.jenis}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Diajukan</p>
                  <p className="font-bold text-slate-800">{formatDate(showDetail.diajukan_pada)}</p>
                </div>

                {showDetail.jenis === 'cuti' && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Mulai Cuti</p>
                      <p className="font-bold text-slate-800">{formatDate(showDetail.tanggal_mulai_cuti)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Selesai Cuti</p>
                      <p className="font-bold text-slate-800">{formatDate(showDetail.tanggal_selesai_cuti)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Alasan Cuti</p>
                      <p className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-slate-700 leading-relaxed">
                        {showDetail.alasan_cuti || '-'}
                      </p>
                    </div>
                  </>
                )}

                {showDetail.jenis === 'sakit' && (
                  <div className="col-span-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Izin Sakit</p>
                    <p className="font-bold text-slate-800">{formatDate(showDetail.tanggal_sakit)}</p>
                  </div>
                )}

                {showDetail.jenis === 'lembur' && (
                  <>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Lembur</p>
                      <p className="font-bold text-slate-800">{formatDate(showDetail.tanggal_lembur)}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Durasi Lembur</p>
                      <p className="font-bold text-slate-800 font-mono">{showDetail.total_menit_lembur || 0} menit</p>
                    </div>
                  </>
                )}
              </div>

              {/* Preview Foto Bukti (Jika Ada) */}
              {showDetail.foto_bukti_url ? (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lampiran Foto Bukti</p>
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50">
                    <img
                      src={showDetail.foto_bukti_url}
                      alt="Foto Bukti"
                      className="max-h-56 w-full object-contain rounded-lg border border-slate-200"
                    />
                  </div>
                </div>
              ) : null}

              {/* Form Input Alasan Penolakan / Keputusan HRD (Hanya jika status 'menunggu') */}
              {showDetail.status === 'menunggu' && (
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <label className="block text-xs font-bold text-slate-900">
                    Pilih Keputusan HRD / Manager *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setKeputusan('setujui')
                        setCatatanPenolakan('')
                      }}
                      className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all border ${
                        keputusan === 'setujui'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800'
                      }`}
                    >
                      <CheckCircle2 size={16} /> 🟢 Setujui Permohonan
                    </button>
                    <button
                      type="button"
                      onClick={() => setKeputusan('tolak')}
                      className={`py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all border ${
                        keputusan === 'tolak'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:text-rose-800'
                      }`}
                    >
                      <XCircle size={16} /> 🔴 Tolak Permohonan
                    </button>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Catatan Penolakan{' '}
                      {keputusan === 'tolak' ? (
                        <span className="text-rose-600 font-extrabold">(Wajib Diisi)</span>
                      ) : (
                        <span className="text-slate-400 font-normal italic">(Di-disabled & Dikunci Saat Disetujui)</span>
                      )}
                    </label>
                    <textarea
                      disabled={keputusan !== 'tolak'}
                      value={keputusan === 'setujui' ? '' : catatanPenolakan}
                      onChange={(e) => setCatatanPenolakan(e.target.value)}
                      rows={2.5}
                      placeholder={
                        keputusan === 'tolak'
                          ? 'Tuliskan alasan penolakan permohonan secara rinci...'
                          : 'Permohonan disetujui. Kolom catatan penolakan otomatis dikosongkan & dikunci.'
                      }
                      className={`w-full px-3.5 py-2.5 rounded-xl border text-xs transition-all resize-none ${
                        keputusan === 'tolak'
                          ? 'border-rose-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500'
                          : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed italic font-medium'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Catatan Penolakan yang sudah ada (Jika ditolak) */}
              {showDetail.status === 'ditolak' && showDetail.catatan_penolakan && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                  <p className="font-extrabold text-rose-900">Alasan Penolakan:</p>
                  <p>{showDetail.catatan_penolakan}</p>
                </div>
              )}
            </div>

            {/* Footer Modal Action — Standar CRUD Modal */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2.5">
              {showDetail.status === 'menunggu' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowDetail(null)}
                    disabled={processing}
                    className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Batal
                  </button>
                  {keputusan === 'tolak' ? (
                    <button
                      type="button"
                      onClick={() => handleProses(showDetail.id, 'ditolak')}
                      disabled={processing}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <XCircle size={16} /> Tolak Permohonan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleProses(showDetail.id, 'disetujui')}
                      disabled={processing}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      <CheckCircle2 size={16} /> Setujui Permohonan
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDetail(null)}
                  className="px-5 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition-colors"
                >
                  Tutup
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
