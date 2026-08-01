'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Clock, Save, Info } from 'lucide-react'

export default function TarifLemburPage() {
  const { showToast } = useToast()
  const [tarifList, setTarifList] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [kerjaMultiplier, setKerjaMultiplier] = useState('1.5')
  const [liburMultiplier, setLiburMultiplier] = useState('2.0')

  const fetchTarif = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/tarif-lembur')
      const data = await res.json()
      if (data.data) {
        setTarifList(data.data)
        const kerja = (data.data as Record<string, unknown>[]).find(t => t.tipe_hari === 'kerja')
        const libur = (data.data as Record<string, unknown>[]).find(t => t.tipe_hari === 'libur')
        if (kerja) setKerjaMultiplier(String(kerja.multiplier))
        if (libur) setLiburMultiplier(String(libur.multiplier))
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => { fetchTarif() }, [fetchTarif])

  const handleSave = async (tipe_hari: 'kerja' | 'libur', mult: string) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/tarif-lembur', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipe_hari, multiplier: Number(mult) }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Gagal', 'error'); setSubmitting(false); return }
      showToast(`Tarif lembur hari ${tipe_hari} berhasil diperbarui!`, 'success')
      fetchTarif()
    } catch { showToast('Gagal menyimpan', 'error') }
    setSubmitting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-accent/30 border-t-accent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tarif Multiplier Lembur</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Pengaturan faktor pengali upah lembur per jam sesuai Kepmenaker No. 102/2004.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hari Kerja Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-light text-accent-foreground flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Lembur Hari Kerja</h3>
              <p className="text-[11px] text-muted-foreground">Multiplier untuk lembur pada hari kerja biasa.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">Multiplier Factor</label>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="10.0"
              value={kerjaMultiplier}
              onChange={e => setKerjaMultiplier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none"
            />
          </div>

          <button
            onClick={() => handleSave('kerja', kerjaMultiplier)}
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={14} /> Update Multiplier Hari Kerja
          </button>
        </div>

        {/* Hari Libur Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-light text-warning-foreground flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Lembur Hari Libur</h3>
              <p className="text-[11px] text-muted-foreground">Multiplier untuk lembur pada hari libur / akhir pekan.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">Multiplier Factor</label>
            <input
              type="number"
              step="0.1"
              min="1.0"
              max="10.0"
              value={liburMultiplier}
              onChange={e => setLiburMultiplier(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs font-mono font-bold text-foreground focus:outline-none"
            />
          </div>

          <button
            onClick={() => handleSave('libur', liburMultiplier)}
            disabled={submitting}
            className="w-full py-2.5 px-4 bg-[#0f172a] text-white hover:bg-[#1e293b] rounded-xl font-bold text-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Save size={14} /> Update Multiplier Hari Libur
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-card border border-border shadow-xs text-xs space-y-2">
        <h4 className="font-bold text-foreground flex items-center gap-2">
          <Info size={16} className="text-accent" /> Formula Upah Lembur Per Jam
        </h4>
        <p className="text-muted-foreground leading-relaxed">
          Upah Lembur Per Jam = (Gaji Pokok / 173) × Multiplier × Total Jam Lembur.
        </p>
      </div>
    </div>
  )
}
