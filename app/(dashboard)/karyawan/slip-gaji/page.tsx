'use client'

import { useState, useEffect, useCallback } from 'react'
import { FileText, Download, ChevronDown, ChevronUp, Lock, CheckCircle2 } from 'lucide-react'

export default function SlipGajiKaryawanPage() {
  const [payrollList, setPayrollList] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [bulan, setBulan] = useState(new Date().getMonth() + 1)
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [selectedSlip, setSelectedSlip] = useState<Record<string, unknown> | null>(null)

  const fetchPayroll = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/payroll?bulan=${bulan}&tahun=${tahun}`)
      const data = await res.json()
      if (data.data) {
        const list = Array.isArray(data.data.payroll)
          ? data.data.payroll
          : Array.isArray(data.data)
          ? data.data
          : []
        setPayrollList(list)
      } else {
        setPayrollList([])
      }
    } catch {
      setPayrollList([])
    }
    setLoading(false)
  }, [bulan, tahun])

  useEffect(() => { fetchPayroll() }, [fetchPayroll])

  const fmt = (n: unknown) => Number(n || 0).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
  const namaBulan = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Slip Gaji</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Rincian penerimaan gaji bulanan dan potongan pajak.</p>
      </div>

      {/* Filter */}
      <div className="flex gap-3 items-center bg-card border border-border p-4 rounded-2xl shadow-xs w-fit">
        <div>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Bulan</label>
          <select value={bulan} onChange={e => setBulan(Number(e.target.value))} className="px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none">
            {namaBulan.slice(1).map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Tahun</label>
          <select value={tahun} onChange={e => setTahun(Number(e.target.value))} className="px-3 py-1.5 rounded-xl text-xs font-semibold focus:outline-none">
            {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* List / Detail View */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      ) : payrollList.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center shadow-xs">
          <FileText size={40} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground">Belum ada slip gaji untuk periode {namaBulan[bulan]} {tahun}</p>
        </div>
      ) : (
        payrollList.map((p, i) => (
          <div
            key={i}
            className="bg-card border border-border hover:border-accent/40 rounded-2xl shadow-xs overflow-hidden transition-all"
          >
            <div
              className="px-6 py-4 flex items-center justify-between cursor-pointer"
              onClick={() => setSelectedSlip(selectedSlip?.id === p.id ? null : p)}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-accent-light text-accent-foreground flex items-center justify-center font-bold">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Slip Gaji {namaBulan[bulan]} {tahun}</p>
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    {p.is_locked ? <span className="badge badge-success">✓ Final</span> : <span className="badge badge-warning">Draft</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-lg font-extrabold text-emerald-600">{fmt(p.gaji_net)}</p>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Gaji Bersih</p>
                </div>
                {selectedSlip?.id === p.id ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
              </div>
            </div>

            {selectedSlip?.id === p.id && (
              <div className="border-t border-border px-6 py-6 space-y-6 bg-muted/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pendapatan */}
                  <div className="bg-card border border-border p-4 rounded-xl space-y-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">PENDAPATAN</h4>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-muted-foreground"><span>Gaji Pokok</span><span className="font-semibold text-foreground">{fmt(p.gaji_pokok)}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Tunjangan Jabatan (Tanggung Jawab & Struktural)</span><span className="font-semibold text-foreground">{fmt(p.tunjangan_jabatan)}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Uang Makan</span><span className="font-semibold text-foreground">{fmt(p.uang_makan)}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Tunjangan Lain</span><span className="font-semibold text-foreground">{fmt(p.tunjangan_lain)}</span></div>
                      <div className="flex justify-between text-muted-foreground"><span>Uang Lembur ({Number(p.total_jam_lembur || 0).toFixed(1)} jam)</span><span className="font-semibold text-foreground">{fmt(p.uang_lembur)}</span></div>
                      <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground">
                        <span>Total Pendapatan</span>
                        <span>{fmt(Number(p.total_pendapatan || (Number(p.gaji_pokok || 0) + Number(p.tunjangan_jabatan || 0) + Number(p.uang_makan || 0) + Number(p.tunjangan_lain || 0) + Number(p.uang_lembur || 0))))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Potongan */}
                  <div className="bg-card border border-border p-4 rounded-xl space-y-3">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">POTONGAN</h4>
                    <div className="space-y-2 text-xs">
                      {p.detail_potongan && typeof p.detail_potongan === 'object' ? Object.entries(p.detail_potongan as Record<string, number>).map(([key, val]) => {
                        const isPph21 = key.toLowerCase().includes('pph 21') || key.toLowerCase().includes('pajak')
                        const labelText = isPph21 ? `${key} (Status PTKP: ${p.status_ptkp || 'TK/0'})` : key
                        return (
                          <div key={key} className="flex justify-between text-muted-foreground">
                            <span>{labelText}</span>
                            <span className="font-semibold text-danger">{fmt(val)}</span>
                          </div>
                        )
                      }) : null}
                      <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground"><span>Total Potongan</span><span className="text-danger">{fmt(p.total_potongan)}</span></div>
                    </div>
                  </div>
                </div>

                {/* Net Total Summary Box */}
                <div className="bg-[#0f172a] text-white rounded-xl p-5 flex items-center justify-between shadow-xs">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Penerimaan Bersih</p>
                    <p className="text-2xl font-extrabold text-white mt-0.5">{fmt(p.gaji_net)}</p>
                  </div>
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
                  >
                    <Download size={14} /> Cetak Slip PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
