'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Lock, DollarSign, RefreshCw, Users, ShieldAlert, CheckCircle2 } from 'lucide-react'

interface EmployeeData {
  id: number
  name: string
  nik: string
  jabatan?: { nama: string }
}

interface PayrollItem {
  id: number
  employee: EmployeeData
  gaji_pokok: number
  tunjangan_jabatan: number
  uang_makan: number
  tunjangan_lain: number
  uang_lembur: number
  total_potongan: number
  pph21: number
  gaji_net: number
  is_locked: boolean
}

export default function PayrollPage() {
  const { showToast } = useToast()
  const [payrollList, setPayrollList] = useState<PayrollItem[]>([])
  const [totalKaryawanAktif, setTotalKaryawanAktif] = useState<number>(0)
  const [isLocked, setIsLocked] = useState<boolean>(false)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [locking, setLocking] = useState(false)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())

  const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const fmt = (n: number) => Number(n || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })

  const fetchPayroll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll?bulan=${bulan}&tahun=${tahun}`)
      const data = await res.json()
      if (data.data) {
        setPayrollList(data.data.payroll || [])
        setTotalKaryawanAktif(data.data.total_karyawan_aktif || 0)
        setIsLocked(Boolean(data.data.is_locked))
      } else {
        setPayrollList([])
        setTotalKaryawanAktif(0)
        setIsLocked(false)
      }
    } catch {
      showToast('Gagal mengambil data kalkulasi payroll', 'error')
    }
    setLoading(false)
  }, [bulan, tahun, showToast])

  useEffect(() => {
    fetchPayroll()
  }, [fetchPayroll])

  const handleGenerate = async () => {
    if (!confirm(`Jalankan kalkulasi penggajian bulanan ${namaBulan[bulan]} ${tahun} untuk seluruh karyawan aktif?`)) return
    setGenerating(true)
    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan, tahun }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal menghitung payroll', 'error')
        setGenerating(false)
        return
      }

      showToast(`Kalkulasi payroll ${namaBulan[bulan]} ${tahun} berhasil diproses!`, 'success')
      fetchPayroll()
    } catch {
      showToast('Terjadi kesalahan saat menghitung payroll', 'error')
    }
    setGenerating(false)
  }

  const handleLock = async () => {
    if (!confirm(`KUNCI FINAL payroll ${namaBulan[bulan]} ${tahun}? Setelah dikunci, status slip gaji tidak dapat diubah lagi demi integritas audit.`)) return
    setLocking(true)
    try {
      const res = await fetch('/api/payroll/lock', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan, tahun }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Hanya Admin/Owner yang berhak mengunci final payroll', 'error')
        setLocking(false)
        return
      }

      showToast('Payroll berhasil dikunci final!', 'success')
      fetchPayroll()
    } catch {
      showToast('Gagal mengunci final payroll', 'error')
    }
    setLocking(false)
  }

  const totalGajiNet = payrollList.reduce((sum, p) => sum + p.gaji_net, 0)
  const countDisplay = payrollList.length > 0 ? payrollList.length : totalKaryawanAktif

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Proses Penggajian (Payroll)</h1>
        <p className="text-xs text-slate-500 mt-0.5">Kalkulasi penggajian bulanan, kompensasi lembur, PPh 21, dan penguncian status final.</p>
      </div>

      {/* Filter & Controls */}
      <div className="flex gap-4 items-center justify-between flex-wrap bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
        <div className="flex gap-3 items-center">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bulan Periode</label>
            <select
              value={bulan}
              onChange={(e) => setBulan(Number(e.target.value))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none"
            >
              {namaBulan.slice(1).map((n, i) => (
                <option key={i + 1} value={i + 1}>{n}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tahun Periode</label>
            <select
              value={tahun}
              onChange={(e) => setTahun(Number(e.target.value))}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-slate-50 focus:outline-none"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          {!isLocked && (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="px-4 py-2.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              <DollarSign size={16} /> {generating ? 'Memproses Payroll...' : 'Hitung Penggajian Bulanan'}
            </button>
          )}
          {payrollList.length > 0 && !isLocked && (
            <button
              onClick={handleLock}
              disabled={locking}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs"
            >
              <Lock size={16} /> {locking ? 'Mengunci...' : 'Kunci Final Penggajian'}
            </button>
          )}
          {isLocked && (
            <button
              onClick={handleLock}
              disabled={locking}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs"
              title="Buka kunci periode gaji ini agar draf dapat direvisi kembali oleh HRD"
            >
              <Lock size={16} /> {locking ? 'Membuka Kunci...' : '🔓 Buka Kunci Periode (Unlock)'}
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Karyawan Aktif</p>
          <p className="text-2xl font-black text-slate-900">{countDisplay} Orang</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Pembayaran Gaji Bersih</p>
          <p className="text-2xl font-black text-emerald-600">{fmt(totalGajiNet)}</p>
        </div>
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-1">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Periode Ini</p>
          <div className="pt-1">
            {isLocked ? (
              <span className="badge badge-locked font-bold">🔒 DIKUNCI FINAL</span>
            ) : payrollList.length > 0 ? (
              <span className="badge badge-warning font-bold">📝 DRAFT KALKULASI</span>
            ) : (
              <span className="badge badge-secondary font-bold">⚪ BELUM DIKALKULASI</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Payroll Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Hasil Kalkulasi Payroll — {namaBulan[bulan]} {tahun}
          </h3>
          <span className="text-xs text-slate-500 font-semibold">{payrollList.length} Slip Gaji Dihasilkan</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="text-left px-6 py-3.5">Nama Karyawan</th>
                <th className="text-right px-6 py-3.5">Gaji Pokok</th>
                <th className="text-right px-6 py-3.5">Tunjangan</th>
                <th className="text-right px-6 py-3.5">Uang Lembur</th>
                <th className="text-right px-6 py-3.5">Potongan (BPJS/Alpha)</th>
                <th className="text-right px-6 py-3.5">PPh 21</th>
                <th className="text-right px-6 py-3.5">Gaji Bersih</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payrollList.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{p.employee?.name}</p>
                      <p className="text-[10px] font-mono text-slate-500">NIK: {p.employee?.nik} | {p.employee?.jabatan?.nama}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">{fmt(p.gaji_pokok)}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-slate-700">{fmt(p.tunjangan_jabatan + p.uang_makan + p.tunjangan_lain)}</td>
                  <td className="px-6 py-4 text-right font-mono font-medium text-emerald-700">{fmt(p.uang_lembur)}</td>
                  <td className="px-6 py-4 text-right font-mono text-rose-600 font-medium">-{fmt(p.total_potongan - p.pph21)}</td>
                  <td className="px-6 py-4 text-right font-mono text-rose-600 font-medium">-{fmt(p.pph21)}</td>
                  <td className="px-6 py-4 text-right font-mono font-black text-emerald-600 text-sm">{fmt(p.gaji_net)}</td>
                </tr>
              ))}
              {payrollList.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                    {loading ? (
                      'Memuat data penggajian...'
                    ) : (
                      <div className="space-y-3">
                        <p className="text-slate-500">Belum ada kalkulasi penggajian yang diproses untuk bulan {namaBulan[bulan]} {tahun}.</p>
                        <button
                          onClick={handleGenerate}
                          disabled={generating}
                          className="px-5 py-2.5 bg-[#0f172a] text-white font-bold rounded-xl text-xs hover:bg-[#1e293b] transition-all shadow-xs"
                        >
                          Hitung Penggajian Bulanan Sekarang
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
