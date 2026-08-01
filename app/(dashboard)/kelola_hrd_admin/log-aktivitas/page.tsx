'use client'

import { useState, useEffect, useCallback } from 'react'
import { ScrollText, ChevronLeft, ChevronRight, Filter, RotateCcw, Zap, Eye, X, ArrowRight, User, Shield } from 'lucide-react'

interface AccountRef {
  id: number
  name: string
  username: string
  role: string
}

interface LogItem {
  id: number
  account_id: number
  aksi: string
  tabel_target: string
  id_target: number
  nilai_lama: Record<string, unknown> | null
  nilai_baru: Record<string, unknown> | null
  created_at: string
  account?: AccountRef
}

export default function LogAktivitasPage() {
  const [logs, setLogs] = useState<LogItem[]>([])
  const [accounts, setAccounts] = useState<AccountRef[]>([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)

  // Helper tanggal hari ini YYYY-MM-DD
  const getTodayStr = () => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  // Filter state
  const [tanggalMulai, setTanggalMulai] = useState('')
  const [tanggalSelesai, setTanggalSelesai] = useState('')
  const [accountId, setAccountId] = useState('')
  const [aksi, setAksi] = useState('')
  const [tabelTarget, setTabelTarget] = useState('')
  const [isPresetActive, setIsPresetActive] = useState(false)

  // State Modal Detail Diff
  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        limit: '30'
      })

      if (tanggalMulai) params.set('start_date', tanggalMulai)
      if (tanggalSelesai) params.set('end_date', tanggalSelesai)
      if (accountId) params.set('account_id', accountId)
      if (aksi) params.set('aksi', aksi)
      if (tabelTarget) params.set('tabel', tabelTarget)

      const res = await fetch(`/api/log-aktivitas?${params}`)
      const data = await res.json()
      if (data.data) {
        setLogs(data.data.logs || [])
        if (data.data.accounts) setAccounts(data.data.accounts)
        if (data.data.pagination) setPagination(data.data.pagination)
      }
    } catch {
      /* ignore */
    }
    setLoading(false)
  }, [pagination.page, tanggalMulai, tanggalSelesai, accountId, aksi, tabelTarget])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  // Handler Preset Cepat "Perubahan Gaji & Jabatan" (Maker-Checker)
  const handlePresetGajiJabatan = () => {
    setTabelTarget('jabatan,jenis_potongan')
    setAksi('ubah')
    setTanggalMulai('')
    setTanggalSelesai('')
    setAccountId('')
    setIsPresetActive(true)
    setPagination(p => ({ ...p, page: 1 }))
  }

  // Handler Reset Filter
  const handleResetFilter = () => {
    setTanggalMulai('')
    setTanggalSelesai('')
    setAccountId('')
    setAksi('')
    setTabelTarget('')
    setIsPresetActive(false)
    setPagination(p => ({ ...p, page: 1 }))
  }

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }) + ' WIB'
  }

  const getTabelLabel = (tabel: string) => {
    switch (tabel) {
      case 'jabatan':
        return 'Data Jabatan'
      case 'jenis_potongan':
        return 'Potongan Gaji'
      case 'pengajuan':
        return 'Pengajuan Cuti/Sakit/Lembur'
      case 'absensi':
        return 'Absensi Harian'
      case 'employee':
        return 'Data Karyawan'
      case 'periode_penggajian':
        return 'Payroll & Gaji'
      case 'tunjangan_lain':
        return 'Tunjangan Lainnya'
      default:
        return tabel
    }
  }

  const getAksiBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'tambah':
      case 'create':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">TAMBAH</span>
      case 'ubah':
      case 'update':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-300">UBAH</span>
      case 'hapus':
      case 'delete':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">HAPUS</span>
      case 'setujui':
      case 'approve':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">SETUJUI</span>
      case 'tolak':
      case 'reject':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">TOLAK</span>
      case 'kunci':
      case 'lock':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-300">KUNCI</span>
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-300">{action}</span>
    }
  }

  // Ringkasan perbandingan singkat untuk tabel
  const getSummaryDiff = (oldVal: Record<string, unknown> | null, newVal: Record<string, unknown> | null) => {
    if (!oldVal && !newVal) return '-'
    if (!oldVal && newVal) {
      const keys = Object.keys(newVal).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at')
      return `Data baru dibuat (${keys.slice(0, 3).join(', ')}${keys.length > 3 ? '...' : ''})`
    }
    if (oldVal && !newVal) {
      return 'Data dihapus dari sistem'
    }

    const changedKeys: string[] = []
    const changesStr: string[] = []

    if (oldVal && newVal) {
      const allKeys = Array.from(new Set([...Object.keys(oldVal), ...Object.keys(newVal)]))
      for (const k of allKeys) {
        if (k === 'updated_at' || k === 'created_at' || k === 'id') continue
        const vOld = oldVal[k]
        const vNew = newVal[k]
        if (JSON.stringify(vOld) !== JSON.stringify(vNew)) {
          changedKeys.push(k)
          if (changesStr.length < 2) {
            const formatVal = (v: unknown) => {
              if (v === null || v === undefined) return 'null'
              if (typeof v === 'number' && (k.includes('gaji') || k.includes('tunjangan') || k.includes('nominal') || k.includes('makan'))) {
                return `Rp ${v.toLocaleString('id-ID')}`
              }
              return String(v)
            }
            changesStr.push(`${k}: ${formatVal(vOld)} → ${formatVal(vNew)}`)
          }
        }
      }
    }

    if (changedKeys.length === 0) return 'Tidak ada perubahan field'
    return changesStr.join(' • ') + (changedKeys.length > 2 ? ` (+${changedKeys.length - 2} field lainnya)` : '')
  }

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Log Aktivitas Audit (Audit Trails)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Catatan jejak audit sistem: pemantauan aksi pengguna, pengubahan data finansial/administratif, dan maker-checker log.
        </p>
      </div>

      {/* Toolbar Filter Terperinci */}
      <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Filter size={15} className="text-blue-600" /> Filter Audit Log
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Preset Cepat Perubahan Gaji & Jabatan */}
            <button
              onClick={handlePresetGajiJabatan}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 shadow-xs ${
                isPresetActive
                  ? 'bg-amber-500 text-white ring-2 ring-amber-300'
                  : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
              }`}
              title="Filter cepat untuk memantau perubahan data gaji dan master jabatan (Maker-Checker)"
            >
              <Zap size={14} className={isPresetActive ? 'animate-pulse text-white' : 'text-amber-600'} />
              ⚡ Perubahan Gaji & Jabatan
            </button>
            <button
              onClick={handleResetFilter}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw size={13} /> Reset Filter
            </button>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={tanggalMulai}
              onChange={(e) => { setTanggalMulai(e.target.value); setIsPresetActive(false); setPagination(p => ({ ...p, page: 1 })) }}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Sampai Tanggal</label>
            <input
              type="date"
              value={tanggalSelesai}
              onChange={(e) => { setTanggalSelesai(e.target.value); setIsPresetActive(false); setPagination(p => ({ ...p, page: 1 })) }}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Pelaku / Staf</label>
            <select
              value={accountId}
              onChange={(e) => { setAccountId(e.target.value); setIsPresetActive(false); setPagination(p => ({ ...p, page: 1 })) }}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
            >
              <option value="">Semua Pelaku / Staf</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name} (@{a.username})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Jenis Aksi</label>
            <select
              value={aksi}
              onChange={(e) => { setAksi(e.target.value); setIsPresetActive(false); setPagination(p => ({ ...p, page: 1 })) }}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none capitalize"
            >
              <option value="">Semua Jenis Aksi</option>
              <option value="tambah">Tambah (Create)</option>
              <option value="ubah">Ubah (Update)</option>
              <option value="hapus">Hapus (Delete)</option>
              <option value="setujui">Setujui (Approve)</option>
              <option value="tolak">Tolak (Reject)</option>
              <option value="kunci">Kunci Payroll (Lock)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tabel Target</label>
            <select
              value={tabelTarget}
              onChange={(e) => { setTabelTarget(e.target.value); setIsPresetActive(false); setPagination(p => ({ ...p, page: 1 })) }}
              className="w-full px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-gray-300 focus:outline-none"
            >
              <option value="">Semua Tabel Target</option>
              <option value="jabatan">Data Jabatan</option>
              <option value="jenis_potongan">Potongan Gaji</option>
              <option value="pengajuan">Pengajuan Cuti/Sakit/Lembur</option>
              <option value="absensi">Absensi Harian</option>
              <option value="employee">Data Karyawan</option>
              <option value="periode_penggajian">Payroll & Slip Gaji</option>
              <option value="tunjangan_lain">Tunjangan Lainnya</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Log Aktivitas */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3.5">Waktu & Tanggal</th>
                <th className="text-left px-6 py-3.5">Pelaku / Staf</th>
                <th className="text-left px-6 py-3.5">Aksi</th>
                <th className="text-left px-6 py-3.5">Tabel Target</th>
                <th className="text-center px-6 py-3.5">Target ID</th>
                <th className="text-left px-6 py-3.5">Ringkasan Perubahan</th>
                <th className="text-right px-6 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {logs.map((l) => {
                const acc = l.account
                return (
                  <tr key={l.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-mono text-slate-700 whitespace-nowrap">
                      {formatDisplayDate(l.created_at)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      <div>
                        <p>{acc?.name || 'System Auto'}</p>
                        <p className="text-[10px] font-normal text-slate-500 capitalize">
                          @{acc?.username || 'system'} • {acc?.role === 'admin_owner' ? 'Admin Owner' : 'Staf HRD'}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      {getAksiBadge(l.aksi)}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {getTabelLabel(l.tabel_target)}
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono font-semibold text-slate-600">
                      #{l.id_target}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 max-w-xs truncate font-medium">
                      {getSummaryDiff(l.nilai_lama, l.nilai_baru)}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors flex items-center gap-1 ml-auto"
                        title="Lihat Detail & Perbandingan Perubahan"
                      >
                        <Eye size={14} /> Detail
                      </button>
                    </td>
                  </tr>
                )
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                    {loading ? 'Memuat audit log...' : 'Belum ada log aktivitas yang cocok dengan filter'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span>
              Menampilkan halaman <span className="font-bold text-slate-900">{pagination.page}</span> dari{' '}
              <span className="font-bold text-slate-900">{pagination.totalPages}</span> ({pagination.total} total log)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Detail Diff Viewer — Komparasi Nilai Lama vs Nilai Baru */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ScrollText size={16} className="text-blue-600" />
                Rincian Jejak Audit — Log #{selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {/* Metadata Audit Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pelaku Aksi</p>
                  <p className="font-extrabold text-slate-900">{selectedLog.account?.name || 'System'}</p>
                  <p className="text-[10px] text-slate-500 font-medium capitalize">
                    @{selectedLog.account?.username} • {selectedLog.account?.role}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Jenis Aksi</p>
                  <div className="mt-1">{getAksiBadge(selectedLog.aksi)}</div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tabel Target</p>
                  <p className="font-bold text-slate-800">{getTabelLabel(selectedLog.tabel_target)}</p>
                  <p className="text-[10px] font-mono text-slate-500">ID #{selectedLog.id_target}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Timestamp Waktu</p>
                  <p className="font-bold text-slate-800 font-mono text-[11px]">{formatDisplayDate(selectedLog.created_at)}</p>
                </div>
              </div>

              {/* Visual Diff Comparison Box */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  Perbandingan Komparasi Data (Nilai Lama vs Nilai Baru)
                </h4>

                <DiffViewer oldVal={selectedLog.nilai_lama} newVal={selectedLog.nilai_baru} />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs transition-colors"
              >
                Tutup Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Sub-komponen DiffViewer untuk membandingkan Nilai Lama vs Nilai Baru field per field
function DiffViewer({ oldVal, newVal }: { oldVal: Record<string, unknown> | null; newVal: Record<string, unknown> | null }) {
  if (!oldVal && !newVal) {
    return <p className="text-slate-400 italic py-4 text-center">Tidak ada snapshot data lama maupun baru.</p>
  }

  const formatValue = (k: string, v: unknown) => {
    if (v === null || v === undefined) return <span className="text-slate-400 italic">null / kosong</span>
    if (typeof v === 'boolean') return v ? 'TRUE (Aktif)' : 'FALSE (Nonaktif)'
    if (typeof v === 'number' && (k.includes('gaji') || k.includes('tunjangan') || k.includes('nominal') || k.includes('makan'))) {
      return `Rp ${v.toLocaleString('id-ID')}`
    }
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v)
  }

  // Jika pembuatan data baru
  if (!oldVal && newVal) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
        <p className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider">🟢 Data Baru Berhasil Dibuat:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {Object.entries(newVal).map(([k, v]) => (
            <div key={k} className="p-2 bg-white rounded-lg border border-emerald-200">
              <span className="font-bold text-slate-500 text-[10px] block uppercase">{k}</span>
              <span className="font-semibold text-emerald-800">{formatValue(k, v)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Jika penghapusan data
  if (oldVal && !newVal) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
        <p className="font-bold text-rose-900 text-[11px] uppercase tracking-wider">🔴 Data Dihapus Dari Sistem:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {Object.entries(oldVal).map(([k, v]) => (
            <div key={k} className="p-2 bg-white rounded-lg border border-rose-200">
              <span className="font-bold text-slate-500 text-[10px] block uppercase">{k}</span>
              <span className="font-semibold text-rose-800">{formatValue(k, v)}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Perubahan data (oldVal && newVal)
  const allKeys = Array.from(new Set([...Object.keys(oldVal || {}), ...Object.keys(newVal || {})]))
  const diffs = allKeys.filter(k => {
    if (k === 'updated_at' || k === 'created_at' || k === 'id') return false
    return JSON.stringify(oldVal?.[k]) !== JSON.stringify(newVal?.[k])
  })

  if (diffs.length === 0) {
    return <p className="text-slate-500 italic py-4 text-center">Tidak ada perbedaan field yang terdeteksi pada snapshot log ini.</p>
  }

  return (
    <div className="space-y-2.5">
      {diffs.map((key) => {
        const vOld = oldVal?.[key]
        const vNew = newVal?.[key]
        return (
          <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
            <p className="font-extrabold text-slate-800 uppercase text-[11px] tracking-wider">{key}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                <span className="text-[10px] font-bold text-rose-700 uppercase block mb-0.5">Nilai Sebelum (Lama):</span>
                <span className="font-mono font-bold text-rose-900">{formatValue(key, vOld)}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-700 uppercase block mb-0.5">Nilai Sesudah (Baru):</span>
                <span className="font-mono font-bold text-emerald-900">{formatValue(key, vNew)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
