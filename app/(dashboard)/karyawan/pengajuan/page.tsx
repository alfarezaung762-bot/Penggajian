'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import { Calendar, Plus, Clock, FileText, CheckCircle2, XCircle, AlertCircle, Upload, ShieldAlert, Eye, Info } from 'lucide-react'

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
  account?: { name: string } | null
}

export default function PengajuanKaryawanPage() {
  const { showToast } = useToast()
  const [pengajuanList, setPengajuanList] = useState<PengajuanItem[]>([])
  const [saldoCuti, setSaldoCuti] = useState<{ kuota: number; terpakai: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [jenis, setJenis] = useState<'cuti' | 'sakit' | 'lembur'>('cuti')
  const [submitting, setSubmitting] = useState(false)
  const [selectedDetail, setSelectedDetail] = useState<PengajuanItem | null>(null)

  // Helper untuk mendapatkan string YYYY-MM-DD dengan offset H+n
  const getDateStr = (offsetDays: number = 0) => {
    const d = new Date()
    d.setDate(d.getDate() + offsetDays)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const hPlus2Str = getDateStr(2)
  const todayStr = getDateStr(0)

  const [form, setForm] = useState<Record<string, string>>({
    tanggal_mulai_cuti: hPlus2Str,
    tanggal_selesai_cuti: hPlus2Str,
    tanggal_sakit: todayStr,
    tanggal_lembur: hPlus2Str,
    jam_mulai_lembur: '17:00',
    jam_selesai_lembur: '20:00',
  })

  const fetchData = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/pengajuan'),
        fetch('/api/saldo-cuti'),
      ])
      const pData = await pRes.json()
      const sData = await sRes.json()
      if (pData.data?.pengajuan) setPengajuanList(pData.data.pengajuan)
      if (sData.data?.[0]) setSaldoCuti(sData.data[0])
    } catch { /* */ }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const sisaSaldo = saldoCuti ? Math.max(0, saldoCuti.kuota - saldoCuti.terpakai) : 0

  // Hitung tanggal selesai cuti maksimal berdasarkan sisa saldo cuti
  const getMaxSelesaiCutiStr = (startStr: string) => {
    if (!startStr || sisaSaldo <= 0) return startStr
    const d = new Date(startStr)
    d.setDate(d.getDate() + (sisaSaldo - 1))
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }

  const maxSelesaiCuti = getMaxSelesaiCutiStr(form.tanggal_mulai_cuti || hPlus2Str)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validasi Durasi Cuti vs Sisa Saldo di Client Side
    if (jenis === 'cuti') {
      if (sisaSaldo <= 0) {
        showToast('Sisa saldo cuti Anda telah habis (0 hari)', 'warning')
        return
      }
      const start = new Date(form.tanggal_mulai_cuti)
      const end = new Date(form.tanggal_selesai_cuti)
      const durasiHari = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

      if (durasiHari > sisaSaldo) {
        showToast(`Durasi pengajuan (${durasiHari} hari) melebihi sisa saldo cuti Anda (${sisaSaldo} hari)`, 'warning')
        return
      }
    }

    setSubmitting(true)
    try {
      const body: Record<string, unknown> = { jenis }
      if (jenis === 'cuti') {
        body.tanggal_mulai_cuti = form.tanggal_mulai_cuti
        body.tanggal_selesai_cuti = form.tanggal_selesai_cuti
        body.alasan_cuti = form.alasan_cuti
      } else if (jenis === 'sakit') {
        body.tanggal_sakit = form.tanggal_sakit
        body.foto_bukti = form.foto_bukti || 'placeholder'
      } else {
        body.tanggal_lembur = form.tanggal_lembur || hPlus2Str
        body.jam_mulai_lembur = form.jam_mulai_lembur || '17:00'
        body.jam_selesai_lembur = form.jam_selesai_lembur || '20:00'
        body.foto_bukti = form.foto_bukti
      }

      const res = await fetch('/api/pengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error || 'Gagal mengirim pengajuan', 'error')
        setSubmitting(false)
        return
      }

      showToast('Pengajuan berhasil dikirim!', 'success')
      window.dispatchEvent(new CustomEvent('pengajuan-updated'))
      setForm({
        tanggal_mulai_cuti: hPlus2Str,
        tanggal_selesai_cuti: hPlus2Str,
        tanggal_sakit: todayStr,
        tanggal_lembur: hPlus2Str,
      })
      fetchData()
    } catch {
      showToast('Terjadi kesalahan saat mengirim pengajuan', 'error')
    }
    setSubmitting(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setForm((prev) => ({ ...prev, foto_bukti: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const formatHHMM = (val: string | null | undefined) => {
    if (!val) return '--:--'
    if (val.includes('T')) {
      const d = new Date(val)
      return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
    }
    return val.substring(0, 5)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Portal Pengajuan Karyawan</h1>
        <p className="text-xs text-slate-500 mt-0.5">Kelola permohonan Cuti Tahunan, Izin Sakit, dan Kerja Lembur.</p>
      </div>

      {/* Overview Card Sisa Saldo Cuti */}
      {saldoCuti && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Sisa Saldo Cuti Tahunan</p>
              <p className="text-2xl font-black text-slate-900">
                {sisaSaldo} <span className="text-xs font-normal text-slate-500">/ {saldoCuti.kuota} Hari</span>
              </p>
            </div>
          </div>
          <div className="flex-1 max-w-xs">
            <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
              <span>Terpakai: {saldoCuti.terpakai} Hari</span>
              <span>Sisa: {sisaSaldo} Hari</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all ${sisaSaldo > 3 ? 'bg-blue-600' : 'bg-amber-500'}`}
                style={{ width: `${Math.max(0, Math.min(100, (sisaSaldo / saldoCuti.kuota) * 100))}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Grid Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Pengajuan Baru */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" /> Buat Form Pengajuan
          </h3>

          {/* Banner Informasi Aturan & Pembatasan */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 space-y-1">
            <p className="font-bold flex items-center gap-1 text-slate-900">
              <Info size={13} className="text-blue-600" /> Aturan Pengajuan Sesuai Kebijakan:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
              <li>Pengajuan <b>Cuti & Lembur</b> wajib diajukan minimal <b>2 hari (H-2)</b> sebelum tanggal pelaksanaan.</li>
              <li>Sisa saldo cuti Anda saat ini: <b>{sisaSaldo} Hari</b>. Tanggal selesai dibatasi otomatis.</li>
              <li>Pengajuan yang tidak disetujui HRD hingga tanggalnya lewat akan <b>otomatis ditolak sistem</b>.</li>
            </ul>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Tab Jenis Selector */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
              {(['cuti', 'sakit', 'lembur'] as const).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => {
                    setJenis(j)
                    setForm((prev) => ({
                      ...prev,
                      tanggal_mulai_cuti: hPlus2Str,
                      tanggal_selesai_cuti: hPlus2Str,
                      tanggal_sakit: todayStr,
                      tanggal_lembur: hPlus2Str,
                      jam_mulai_lembur: prev.jam_mulai_lembur || '17:00',
                      jam_selesai_lembur: prev.jam_selesai_lembur || '20:00',
                    }))
                  }}
                  className={`py-2 text-xs font-bold rounded-lg transition-all capitalize ${
                    jenis === j ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>

            {/* Form Cuti */}
            {jenis === 'cuti' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Mulai Cuti (Min H-2) *</label>
                  <input
                    type="date"
                    required
                    min={hPlus2Str}
                    value={form.tanggal_mulai_cuti || hPlus2Str}
                    onChange={(e) => {
                      const start = e.target.value
                      setForm((p) => ({
                        ...p,
                        tanggal_mulai_cuti: start,
                        tanggal_selesai_cuti: start,
                      }))
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tanggal Selesai Cuti (Maks {sisaSaldo} Hari) *
                  </label>
                  <input
                    type="date"
                    required
                    min={form.tanggal_mulai_cuti || hPlus2Str}
                    max={maxSelesaiCuti}
                    value={form.tanggal_selesai_cuti || form.tanggal_mulai_cuti || hPlus2Str}
                    onChange={(e) => setForm((p) => ({ ...p, tanggal_selesai_cuti: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-slate-900 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Tanggal selesai dikunci otomatis maksimal {sisaSaldo} hari sesuai sisa saldo cuti Anda.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Alasan Cuti Tahunan *</label>
                  <textarea
                    required
                    rows={3}
                    value={form.alasan_cuti || ''}
                    onChange={(e) => setForm((p) => ({ ...p, alasan_cuti: e.target.value }))}
                    placeholder="Jelaskan keperluan cuti Anda secara rinci..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-slate-900 focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Form Sakit */}
            {jenis === 'sakit' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Sakit *</label>
                  <input
                    type="date"
                    required
                    value={form.tanggal_sakit || todayStr}
                    onChange={(e) => setForm((p) => ({ ...p, tanggal_sakit: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Upload Surat Dokter / Bukti Foto *</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-slate-50 text-slate-800 text-xs"
                  />
                </div>
              </>
            )}

            {/* Form Lembur */}
            {jenis === 'lembur' && (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tanggal Lembur (Min H-2) *</label>
                  <input
                    type="date"
                    required
                    min={hPlus2Str}
                    value={form.tanggal_lembur || hPlus2Str}
                    onChange={(e) => setForm((p) => ({ ...p, tanggal_lembur: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-slate-900 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jam Mulai *</label>
                    <input
                      type="time"
                      required
                      value={form.jam_mulai_lembur || '17:00'}
                      onChange={(e) => setForm((p) => ({ ...p, jam_mulai_lembur: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Jam Selesai *</label>
                    <input
                      type="time"
                      required
                      value={form.jam_selesai_lembur || '20:00'}
                      onChange={(e) => setForm((p) => ({ ...p, jam_selesai_lembur: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl border border-gray-300 bg-white font-semibold text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Upload Bukti Foto Surat Perintah Lembur *</label>
                  <input
                    type="file"
                    required
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-slate-50 text-slate-800 text-xs"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={submitting || (jenis === 'cuti' && sisaSaldo <= 0)}
              className="w-full py-3 px-4 rounded-xl bg-[#0f172a] text-white hover:bg-[#1e293b] font-bold text-xs transition-all disabled:opacity-50 shadow-xs"
            >
              {submitting ? 'Mengirim Request...' : 'Kirim Form Pengajuan'}
            </button>
          </form>
        </div>

        {/* Tabel Riwayat Pengajuan Rinci */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Riwayat Detail Pengajuan Permohonan
            </h3>
            <span className="text-xs text-slate-500 font-semibold">{pengajuanList.length} Total Ajuan</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="text-left px-6 py-3.5">Tgl Diajukan</th>
                  <th className="text-left px-6 py-3.5">Jenis</th>
                  <th className="text-left px-6 py-3.5">Detail Executif / Rentang</th>
                  <th className="text-center px-6 py-3.5">Status</th>
                  <th className="text-right px-6 py-3.5">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pengajuanList.map((p) => {
                  let totalHari = 0
                  if (p.jenis === 'cuti' && p.tanggal_mulai_cuti && p.tanggal_selesai_cuti) {
                    const start = new Date(p.tanggal_mulai_cuti)
                    const end = new Date(p.tanggal_selesai_cuti)
                    totalHari = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {new Date(p.diajukan_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge uppercase font-bold ${p.jenis === 'cuti' ? 'badge-info' : p.jenis === 'sakit' ? 'badge-warning' : 'badge-success'}`}>
                          {p.jenis}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {p.jenis === 'cuti' && p.tanggal_mulai_cuti && p.tanggal_selesai_cuti && (
                          <div>
                            <p className="font-bold text-slate-900">
                              {new Date(p.tanggal_mulai_cuti).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - {new Date(p.tanggal_selesai_cuti).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-blue-600 font-bold">Durasi: {totalHari} Hari Cuti</p>
                          </div>
                        )}
                        {p.jenis === 'sakit' && p.tanggal_sakit && (
                          <div>
                            <p className="font-bold text-slate-900">
                              Tgl Sakit: {new Date(p.tanggal_sakit).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-slate-500 italic">Dokumen Surat Dokter Lampir</p>
                          </div>
                        )}
                        {p.jenis === 'lembur' && p.tanggal_lembur && (
                          <div>
                            <p className="font-bold text-slate-900">
                              Tgl Lembur: {new Date(p.tanggal_lembur).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </p>
                            <p className="text-[10px] text-emerald-600 font-bold">
                              Jam: {formatHHMM(p.jam_mulai_lembur)} - {formatHHMM(p.jam_selesai_lembur)} ({p.total_menit_lembur ? Math.round(p.total_menit_lembur / 60) : 0} Jam)
                            </p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`badge capitalize ${p.status === 'disetujui' ? 'badge-success' : p.status === 'ditolak' ? 'badge-danger' : 'badge-warning'}`}>
                          {p.status}
                        </span>
                        {p.status === 'ditolak' && p.catatan_penolakan?.includes('Otomatis Ditolak') && (
                          <p className="text-[9px] font-bold text-red-600 mt-1 flex items-center justify-center gap-0.5">
                            <ShieldAlert size={10} /> Auto-Reject
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedDetail(p)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#0f172a] hover:text-white text-slate-800 font-semibold text-xs transition-all inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Rincian
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {pengajuanList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">Belum ada riwayat pengajuan permohonan</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Detail Rincian Pengajuan */}
      {selectedDetail && (
        <div className="modal-overlay" onClick={() => setSelectedDetail(null)}>
          <div className="modal-content max-w-md p-0 overflow-hidden bg-white text-slate-900 border border-slate-200 shadow-2xl rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div>
                <h3 className="text-sm font-bold text-slate-900 capitalize">Rincian Pengajuan {selectedDetail.jenis}</h3>
                <p className="text-[11px] text-slate-500">ID Ajuan: #{selectedDetail.id}</p>
              </div>
              <button onClick={() => setSelectedDetail(null)} className="p-1 hover:bg-slate-200 rounded-lg text-slate-500 font-bold">✕</button>
            </div>
            <div className="p-6 space-y-4 text-xs bg-white">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Diajukan Pada</p>
                  <p className="font-bold text-slate-900">{new Date(selectedDetail.diajukan_pada).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status Permohonan</p>
                  <span className={`badge capitalize font-bold ${selectedDetail.status === 'disetujui' ? 'badge-success' : selectedDetail.status === 'ditolak' ? 'badge-danger' : 'badge-warning'}`}>
                    {selectedDetail.status}
                  </span>
                </div>
              </div>

              {selectedDetail.jenis === 'cuti' && (
                <div className="space-y-2">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Rentang Tanggal Cuti</p>
                    <p className="font-bold text-slate-900">
                      {selectedDetail.tanggal_mulai_cuti && new Date(selectedDetail.tanggal_mulai_cuti).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} s/d {selectedDetail.tanggal_selesai_cuti && new Date(selectedDetail.tanggal_selesai_cuti).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400">Alasan Kebutuhan Cuti</p>
                    <p className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium">{selectedDetail.alasan_cuti || '-'}</p>
                  </div>
                </div>
              )}

              {selectedDetail.foto_bukti_url && (
                <div>
                  <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Foto Dokumen Bukti</p>
                  <div className="h-40 rounded-xl overflow-hidden border border-slate-300">
                    <img src={selectedDetail.foto_bukti_url} alt="Bukti Foto" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              {selectedDetail.status === 'ditolak' && selectedDetail.catatan_penolakan && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <p className="text-[10px] uppercase font-bold text-rose-700 flex items-center gap-1">
                    <AlertCircle size={12} /> Alasan Penolakan:
                  </p>
                  <p className="text-slate-800 font-bold">{selectedDetail.catatan_penolakan}</p>
                </div>
              )}

              {selectedDetail.status === 'disetujui' && selectedDetail.account && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900">
                  <p className="text-[10px] uppercase font-bold text-emerald-700">Disetujui Oleh HRD</p>
                  <p className="font-bold">{selectedDetail.account.name}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button onClick={() => setSelectedDetail(null)} className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
