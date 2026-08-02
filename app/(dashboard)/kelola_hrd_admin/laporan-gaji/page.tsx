'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Printer, Building2, Search, CheckCircle2, AlertCircle } from 'lucide-react'

interface EmployeeData {
  id: number
  name: string
  nik: string
  bank_account_number: string
  jabatan?: { nama: string }
}

interface ReportItem {
  id: number
  employee: EmployeeData
  gaji_pokok: number
  tunjangan_jabatan: number
  uang_makan: number
  total_lembur: number
  total_tunjangan_lain: number
  total_potongan: number
  gaji_net: number
  generated_at: string
}

export default function LaporanGajiPage() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [periodeData, setPeriodeData] = useState<{ id: number; bulan: number; tahun: number; tanggal_mulai: string; tanggal_selesai: string; status: string } | null>(null)
  const [periodeStatus, setPeriodeStatus] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Modal Cutoff State
  const [showCutoffModal, setShowCutoffModal] = useState(false)
  const [cutoffDateInput, setCutoffDateInput] = useState('')
  const [savingCutoff, setSavingCutoff] = useState(false)
  const [cutoffMessage, setCutoffMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/laporan-gaji?bulan=${bulan}&tahun=${tahun}`)
      const data = await res.json()
      if (data.data) {
        setReports(data.data.reports || [])
        setPeriodeData(data.data.periode || null)
        setPeriodeStatus(data.data.periode?.status || null)
        if (data.data.periode?.tanggal_selesai) {
          setCutoffDateInput(new Date(data.data.periode.tanggal_selesai).toISOString().split('T')[0])
        }
      } else {
        setReports([])
        setPeriodeData(null)
        setPeriodeStatus(null)
      }
    } catch {
      setReports([])
      setPeriodeData(null)
      setPeriodeStatus(null)
    }
    setLoading(false)
  }, [bulan, tahun])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const handleUpdateCutoff = async () => {
    if (!periodeData) return
    setSavingCutoff(true)
    setCutoffMessage(null)

    try {
      const res = await fetch(`/api/call_payroll/${periodeData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal_selesai: cutoffDateInput }),
      })

      const data = await res.json()

      if (!res.ok) {
        setCutoffMessage({ type: 'error', text: data.error || 'Gagal mengubah tanggal cutoff.' })
        setSavingCutoff(false)
        return
      }

      setCutoffMessage({ type: 'success', text: data.data.message || 'Tanggal cutoff berhasil diperbarui!' })
      setTimeout(() => {
        setShowCutoffModal(false)
        setCutoffMessage(null)
        fetchReport()
      }, 1200)
    } catch {
      setCutoffMessage({ type: 'error', text: 'Terjadi kesalahan sistem. Coba lagi.' })
    }
    setSavingCutoff(false)
  }

  const fmt = (n: number) => Number(n || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
  const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  // Filter laporan berdasarkan input pencarian
  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    const name = r.employee?.name?.toLowerCase() || ''
    const nik = r.employee?.nik?.toLowerCase() || ''
    const rek = r.employee?.bank_account_number?.toLowerCase() || ''
    const jabatan = r.employee?.jabatan?.nama?.toLowerCase() || ''
    return name.includes(q) || nik.includes(q) || rek.includes(q) || jabatan.includes(q)
  })

  const totalTransfer = reports.reduce((sum, r) => sum + r.gaji_net, 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* CSS Khusus Cetak PDF (@media print) agar tabel tidak terpotong & scrollbar hilang */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
            font-size: 10px !important;
          }
          .no-print {
            display: none !important;
          }
          .overflow-x-auto {
            overflow: visible !important;
            width: 100% !important;
          }
          table {
            width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          th, td {
            padding: 5px 6px !important;
            font-size: 9px !important;
            word-break: break-word !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Header Cetak PDF Khusus Print Out */}
      <div className="hidden print:block mb-6 pb-4 border-b-2 border-slate-800">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-black uppercase text-slate-900 tracking-tight">PT SANTOSO MAKMUR JAYA</h1>
            <h2 className="text-sm font-bold text-slate-700 mt-0.5">LAPORAN REKAPITULASI PEMBAYARAN GAJI & TRANSFER BANK BNI</h2>
            <p className="text-xs text-slate-500 mt-1">Periode: <span className="font-bold text-slate-800">{namaBulan[bulan]} {tahun}</span> | Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block px-3 py-1 text-xs font-black uppercase rounded border ${periodeStatus === 'terkunci' ? 'border-emerald-600 text-emerald-800 bg-emerald-50' : 'border-amber-600 text-amber-800 bg-amber-50'}`}>
              Status: {periodeStatus || 'DRAFT'}
            </span>
          </div>
        </div>
      </div>

      {/* Header & Print Button (Screen Display) */}
      <div className="flex items-center justify-between flex-wrap gap-4 no-print border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Laporan Penggajian & BNI Transfer</h1>
          <p className="text-xs text-slate-500">Rekapitulasi pencairan dana penggajian dan instruksi transfer Bank BNI.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCutoffModal(true)}
            disabled={!periodeData || periodeStatus === 'terkunci'}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
            title={periodeStatus === 'terkunci' ? 'Periode sudah dikunci, tanggal cutoff tidak dapat diubah' : 'Atur tanggal cutoff absensi & transfer BNI'}
          >
            ✏️ Atur Tanggal Transfer & Cutoff
          </button>
          <button
            onClick={() => window.print()}
            disabled={reports.length === 0}
            className="px-5 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs disabled:opacity-50"
          >
            <Printer size={16} /> Cetak Laporan Penggajian BNI (PDF)
          </button>
        </div>
      </div>

      {/* Toolbar Filter & Pencarian Karyawan */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-xs no-print">
        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bulan Periode</label>
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
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
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-50 border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-800"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Search Input pada Halaman Laporan */}
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Cari Karyawan / Rekening</label>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ketik NIK, Nama, atau No. Rek BNI..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-800 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Hero Card Total Payroll */}
      {reports.length > 0 && (
        <div className="bg-[#0f172a] text-white rounded-2xl p-6 shadow-md border border-slate-800 flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Nominal Pencairan Payroll</span>
              {periodeStatus && (
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase flex items-center gap-1 ${periodeStatus === 'terkunci' ? 'bg-emerald-500 text-slate-950' : 'bg-amber-500 text-slate-950'}`}>
                  {periodeStatus === 'terkunci' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                  {periodeStatus}
                </span>
              )}
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{fmt(totalTransfer)}</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs text-slate-300 font-bold">{reports.length} Karyawan Penerima</p>
              <p className="text-[11px] text-slate-400 flex items-center justify-end gap-1 mt-0.5">
                <Building2 size={14} className="text-blue-400" /> Mitra Transfer: Bank BNI
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabel Laporan Gaji & BNI Transfer */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50 flex-wrap gap-2">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Rekapitulasi Gaji Karyawan — Periode {namaBulan[bulan]} {tahun}
            </h3>
            {searchQuery && (
              <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                Menampilkan hasil pencarian untuk &quot;{searchQuery}&quot; ({filteredReports.length} dari {reports.length} data)
              </p>
            )}
          </div>
          <span className="text-xs text-slate-500 font-bold bg-slate-100 px-3 py-1 rounded-lg">
            {filteredReports.length} Karyawan Terdaftar
          </span>
        </div>

        {/* Scrollable Container dengan Min-Width untuk Skrin, Full-Width untuk Print */}
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-xs min-w-[950px] print:min-w-0 print:w-full border-collapse">
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '15%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-5 py-3.5">Nama Karyawan</th>
                <th className="text-left px-5 py-3.5">NIK</th>
                <th className="text-left px-5 py-3.5">No. Rekening BNI</th>
                <th className="text-right px-5 py-3.5">Gaji Pokok</th>
                <th className="text-right px-5 py-3.5">Lembur & Tunj.</th>
                <th className="text-right px-5 py-3.5">Potongan</th>
                <th className="text-right px-5 py-3.5 bg-slate-100/80 text-slate-900">Take Home Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-900">{r.employee?.name}</p>
                    <p className="text-[10px] text-slate-500">{r.employee?.jabatan?.nama || 'Staf'}</p>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-600">{r.employee?.nik}</td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-900">{r.employee?.bank_account_number || '-'}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-700">{fmt(r.gaji_pokok)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-emerald-700 font-semibold">{fmt(r.total_lembur + r.tunjangan_jabatan + r.uang_makan + r.total_tunjangan_lain)}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-rose-600">-{fmt(r.total_potongan)}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-black text-slate-950 text-sm bg-slate-50/60">{fmt(r.gaji_net)}</td>
                </tr>
              ))}

              {/* Total Summary Row */}
              {filteredReports.length > 0 && (
                <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300">
                  <td colSpan={3} className="px-5 py-3.5 text-right text-xs uppercase tracking-wider text-slate-800">
                    TOTAL KESELURUHAN ({filteredReports.length} Karyawan):
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-slate-900">{fmt(filteredReports.reduce((s, r) => s + r.gaji_pokok, 0))}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-emerald-800">{fmt(filteredReports.reduce((s, r) => s + (r.total_lembur + r.tunjangan_jabatan + r.uang_makan + r.total_tunjangan_lain), 0))}</td>
                  <td className="px-5 py-3.5 text-right font-mono text-rose-700">-{fmt(filteredReports.reduce((s, r) => s + r.total_potongan, 0))}</td>
                  <td className="px-5 py-3.5 text-right font-mono font-black text-slate-950 text-sm bg-slate-200/80">{fmt(filteredReports.reduce((s, r) => s + r.gaji_net, 0))}</td>
                </tr>
              )}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    {loading ? 'Memuat laporan penggajian...' : searchQuery ? `Tidak ditemukan karyawan dengan kata kunci "${searchQuery}"` : `Belum ada laporan penggajian yang diproses untuk ${namaBulan[bulan]} ${tahun}`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lembar Tanda Tangan Khusus Cetak PDF */}
      <div className="hidden print:block mt-12 pt-6 border-t border-slate-300 text-xs">
        <div className="grid grid-cols-3 gap-6 text-center">
          <div>
            <p className="font-semibold text-slate-600">Dibuat Oleh,</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">Staf HRD & Payroll</p>
            <p className="text-[10px] text-slate-500">PT Santoso Makmur Jaya</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">Disetujui Oleh,</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">Direktur / Owner</p>
            <p className="text-[10px] text-slate-500">PT Santoso Makmur Jaya</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">Diterima & Dieksekusi,</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">Kasir / Bank BNI</p>
            <p className="text-[10px] text-slate-500">Corporate Payroll Transfer</p>
          </div>
        </div>
      </div>

      {/* Modal Dialog Atur Tanggal Cutoff & Transfer BNI */}
      {showCutoffModal && periodeData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 no-print animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">✏️ Atur Tanggal Cutoff & Transfer BNI</h3>
                <p className="text-xs text-slate-500 mt-0.5">Periode Gaji: {namaBulan[bulan]} {tahun}</p>
              </div>
              <button
                onClick={() => setShowCutoffModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-amber-950 mb-1">
                  <AlertCircle size={14} className="text-amber-600 shrink-0" /> Restriksi Sistem (Strict Guardrails):
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                  <li>Status periode harus <strong>DRAFT</strong> (tidak terkunci).</li>
                  <li>Tanggal cutoff hanya boleh dipilih antara <strong>tanggal 20 s/d akhir bulan</strong>.</li>
                  <li>Mengubah tanggal cutoff otomatis menghitung ulang draf payroll 31 karyawan & mencatat di <strong>Audit Log</strong>.</li>
                </ul>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Tanggal Cutoff Absensi & Transfer (tanggal_selesai)</label>
                <input
                  type="date"
                  value={cutoffDateInput}
                  onChange={(e) => setCutoffDateInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
                />
                <p className="text-[10px] text-slate-400 mt-1">Format: YYYY-MM-DD (Contoh: 2026-06-25 atau 2026-06-30)</p>
              </div>

              {cutoffMessage && (
                <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${cutoffMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                  {cutoffMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {cutoffMessage.text}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCutoffModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleUpdateCutoff}
                disabled={savingCutoff}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all shadow-xs disabled:opacity-50 flex items-center gap-2"
              >
                {savingCutoff ? 'Menghitung Ulang Payroll...' : 'Simpan & Hitung Ulang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
