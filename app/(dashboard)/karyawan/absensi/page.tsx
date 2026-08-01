'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/app/components/ToastProvider'
import {
  Camera,
  Clock,
  LogIn,
  LogOut,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Upload,
  CalendarOff,
  AlertTriangle,
  Calendar as CalendarIcon,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react'

interface AbsensiHariIni {
  id?: number
  jam_masuk?: string | null
  jam_pulang?: string | null
  foto_masuk_url?: string | null
  foto_pulang_url?: string | null
  status?: string
  catatan_alasan?: string | null
}

interface AbsensiItem {
  id: number
  tanggal: string
  jam_masuk: string | null
  jam_pulang: string | null
  foto_masuk_url?: string | null
  foto_pulang_url?: string | null
  status: string
  catatan_alasan?: string | null
}

interface PengajuanItem {
  id: number
  jenis: string
  status: string
  tanggal_mulai_cuti?: string | null
  tanggal_selesai_cuti?: string | null
  tanggal_sakit?: string | null
  tanggal_lembur?: string | null
  alasan_cuti?: string | null
}

interface HariLiburItem {
  id: number
  tanggal: string
  keterangan: string
}

interface Jadwal {
  id: number
  hari: string
  jam_masuk: string | null
  jam_pulang: string | null
  toleransi_telat_menit: number
}

const NAMA_BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const HARI_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']

export default function AbsensiKaryawanPage() {
  const { showToast } = useToast()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [absensiToday, setAbsensiToday] = useState<AbsensiHariIni | null>(null)
  const [jadwal, setJadwal] = useState<Jadwal | null>(null)
  const [seluruhJadwal, setSeluruhJadwal] = useState<Jadwal[]>([])
  const [isLibur, setIsLibur] = useState(false)
  const [hari, setHari] = useState('')
  const [joinDate, setJoinDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [mode, setMode] = useState<'masuk' | 'pulang'>('masuk')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showJadwalModal, setShowJadwalModal] = useState(false)
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null)

  // Monthly Calendar States
  const now = new Date()
  const [calMonth, setCalMonth] = useState(now.getMonth() + 1)
  const [calYear, setCalYear] = useState(now.getFullYear())
  const [monthlyAbsensi, setMonthlyAbsensi] = useState<AbsensiItem[]>([])
  const [monthlyPengajuan, setMonthlyPengajuan] = useState<PengajuanItem[]>([])
  const [monthlyLibur, setMonthlyLibur] = useState<HariLiburItem[]>([])
  const [monthlyJadwal, setMonthlyJadwal] = useState<Jadwal[]>([])
  const [calLoading, setCalLoading] = useState(false)
  const [calMinimized, setCalMinimized] = useState(false) // Toggle Minimize Kalender

  const [selectedDateDetail, setSelectedDateDetail] = useState<{
    dateStr: string
    dayName: string
    statusLabel: string
    statusType: string
    absensi?: AbsensiItem | null
    pengajuan?: PengajuanItem | null
    libur?: HariLiburItem | null
    isWeekend?: boolean
  } | null>(null)

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const extractHHMM = (val: string | null | undefined): string => {
    if (!val) return '--:--'
    if (val.includes('T')) {
      const d = new Date(val)
      const h = String(d.getUTCHours()).padStart(2, '0')
      const m = String(d.getUTCMinutes()).padStart(2, '0')
      return `${h}:${m}`
    }
    return val.substring(0, 5)
  }

  const fetchTodayStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/absensi?today=true')
      const data = await res.json()
      if (data.data) {
        setAbsensiToday(data.data.absensi_hari_ini || null)
        setJadwal(data.data.jadwal || null)
        setSeluruhJadwal(data.data.seluruh_jadwal || [])
        setIsLibur(data.data.is_libur)
        setHari(data.data.hari)
        if (data.data.join_date) setJoinDate(data.data.join_date)
        if (!data.data.absensi_hari_ini) {
          setCapturedPhoto(null)
        }
      }
    } catch { /* */ }
    setLoading(false)
  }, [])

  const fetchMonthlyCalendar = useCallback(async (m: number, y: number) => {
    setCalLoading(true)
    try {
      const res = await fetch(`/api/absensi?bulan=${m}&tahun=${y}`)
      const data = await res.json()
      if (data.data) {
        setMonthlyAbsensi(data.data.absensi || [])
        setMonthlyPengajuan(data.data.pengajuan || [])
        setMonthlyLibur(data.data.hari_libur || [])
        setMonthlyJadwal(data.data.jadwal_kerja || [])
        if (data.data.join_date) setJoinDate(data.data.join_date)
      }
    } catch { /* */ }
    setCalLoading(false)
  }, [])

  useEffect(() => {
    fetchTodayStatus()
  }, [fetchTodayStatus])

  useEffect(() => {
    fetchMonthlyCalendar(calMonth, calYear)
  }, [calMonth, calYear, fetchMonthlyCalendar])

  const handlePrevMonth = () => {
    if (calMonth === 1) {
      setCalMonth(12)
      setCalYear(y => y - 1)
    } else {
      setCalMonth(m => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (calMonth === 12) {
      setCalMonth(1)
      setCalYear(y => y + 1)
    } else {
      setCalMonth(m => m + 1)
    }
  }

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setCameraActive(true)
        setCapturedPhoto(null)
      }
    } catch {
      showToast('Gagal mengakses kamera. Gunakan opsi unggah foto file.', 'warning')
    }
  }

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(t => t.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const nowD = new Date()
    const dateStr = nowD.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    const timeStr = nowD.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const watermark = `PT SANTOSO MAKMUR JAYA | ${dateStr} ${timeStr}`

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, canvas.height - 36, canvas.width, 36)
    ctx.fillStyle = '#ffffff'
    ctx.font = '14px sans-serif'
    ctx.fillText(watermark, 12, canvas.height - 12)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
    setCapturedPhoto(dataUrl)
    stopCamera()
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('File harus berupa gambar (JPG/PNG)', 'error')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width || 640
        canvas.height = img.height || 480
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, 0, 0)
        const nowD = new Date()
        const dateStr = nowD.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        const timeStr = nowD.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        const watermark = `PT SANTOSO MAKMUR JAYA | ${dateStr} ${timeStr}`

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
        ctx.fillRect(0, canvas.height - 36, canvas.width, 36)
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px sans-serif'
        ctx.fillText(watermark, 12, canvas.height - 12)

        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.85))
        stopCamera()
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleSubmitAbsensi = async () => {
    if (!capturedPhoto) {
      showToast('Ambil foto dari kamera atau unggah file terlebih dahulu', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const endpoint = mode === 'masuk' ? '/api/absensi' : '/api/absensi/clock-out'
      const method = mode === 'masuk' ? 'POST' : 'PATCH'

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foto: capturedPhoto,
          foto_masuk: capturedPhoto,
          foto_pulang: capturedPhoto
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const err = data.error || 'Gagal melakukan absensi'
        setFormErrorMessage(err)
        showToast(err, 'error')
        setSubmitting(false)
        return
      }

      setFormErrorMessage(null)
      showToast(mode === 'masuk' ? 'Absensi Masuk Berhasil!' : 'Absensi Pulang Berhasil!', 'success')
      setCapturedPhoto(null)
      setCalMinimized(false) // Otomatis membuka / me-maximize kalender sebagai bukti status!
      fetchTodayStatus()
      fetchMonthlyCalendar(calMonth, calYear)
    } catch {
      setFormErrorMessage('Terjadi kesalahan koneksi server. Silakan coba lagi.')
      showToast('Terjadi kesalahan. Coba lagi.', 'error')
    }
    setSubmitting(false)
  }

  // Monthly Calendar Grid Generator
  const renderCalendarGrid = () => {
    const totalDays = new Date(calYear, calMonth, 0).getDate()
    const firstDayIndex = new Date(calYear, calMonth - 1, 1).getDay() // 0 = Minggu
    const todayDateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

    const cells = []

    // Padding empty cells for previous month
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 border border-slate-100 rounded-xl"></div>)
    }

    // Days 1..totalDays
    for (let day = 1; day <= totalDays; day++) {
      const dayStr = String(day).padStart(2, '0')
      const monthStr = String(calMonth).padStart(2, '0')
      const dateStr = `${calYear}-${monthStr}-${dayStr}`

      const dateObj = new Date(calYear, calMonth - 1, day)
      const dayIndex = dateObj.getDay()
      const dayName = HARI_NAMES[dayIndex]
      const isToday = dateStr === todayDateStr
      const isPast = dateObj < new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const isBeforeJoin = joinDate ? dateStr < joinDate : false

      // 1. Check Absensi
      const abs = monthlyAbsensi.find(a => {
        const dStr = (a.tanggal as string).split('T')[0]
        return dStr === dateStr
      })

      // 2. Check Pengajuan (Cuti/Sakit/Izin/Lembur)
      const peng = monthlyPengajuan.find(p => {
        if (p.jenis === 'lembur' && p.tanggal_lembur) {
          return (p.tanggal_lembur as string).split('T')[0] === dateStr
        }
        if (p.jenis === 'sakit' && p.tanggal_sakit) {
          return (p.tanggal_sakit as string).split('T')[0] === dateStr
        }
        if (p.tanggal_mulai_cuti && p.tanggal_selesai_cuti) {
          const start = (p.tanggal_mulai_cuti as string).split('T')[0]
          const end = (p.tanggal_selesai_cuti as string).split('T')[0]
          return dateStr >= start && dateStr <= end
        }
        return false
      })

      // 3. Check Hari Libur Nasional
      const lib = monthlyLibur.find(l => (l.tanggal as string).split('T')[0] === dateStr)

      // 4. Check Jadwal Libur Mingguan
      const hariMap: Record<number, string> = { 0: 'minggu', 1: 'senin', 2: 'selasa', 3: 'rabu', 4: 'kamis', 5: 'jumat', 6: 'sabtu' }
      const hariKode = hariMap[dayIndex]
      const jdw = monthlyJadwal.find(j => j.hari === hariKode)
      const isWeekend = !jdw || !jdw.jam_masuk

      // Determine Status & Styling
      let statusType = 'normal'
      let statusLabel = ''
      let badgeClass = ''
      let borderClass = 'border-slate-200'

      if (abs) {
        const st = abs.status.toLowerCase()
        if (st === 'hadir') {
          statusType = 'hadir'
          statusLabel = `Hadir ${extractHHMM(abs.jam_masuk)}`
          badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300'
        } else if (st.includes('telat')) {
          statusType = 'telat'
          statusLabel = `Telat ${extractHHMM(abs.jam_masuk)}`
          badgeClass = 'bg-amber-100 text-amber-800 border-amber-300'
        } else if (st === 'sakit') {
          statusType = 'sakit'
          statusLabel = 'Sakit'
          badgeClass = 'bg-blue-100 text-blue-800 border-blue-300'
        } else if (st === 'cuti') {
          statusType = 'cuti'
          statusLabel = 'Cuti'
          badgeClass = 'bg-purple-100 text-purple-800 border-purple-300'
        } else if (st === 'izin') {
          statusType = 'izin'
          statusLabel = 'Izin'
          badgeClass = 'bg-sky-100 text-sky-800 border-sky-300'
        } else if (st === 'alpha') {
          statusType = 'alpha'
          statusLabel = 'Alpha'
          badgeClass = 'bg-rose-100 text-rose-800 border-rose-300'
        } else {
          statusType = st
          statusLabel = st
          badgeClass = 'bg-slate-100 text-slate-800 border-slate-300'
        }
      } else if (peng) {
        const jns = peng.jenis.toLowerCase()
        if (jns === 'sakit') {
          statusType = 'sakit'
          statusLabel = 'Izin Sakit'
          badgeClass = 'bg-blue-100 text-blue-800 border-blue-300'
        } else if (jns === 'cuti') {
          statusType = 'cuti'
          statusLabel = 'Cuti Disetujui'
          badgeClass = 'bg-purple-100 text-purple-800 border-purple-300'
        } else if (jns === 'izin') {
          statusType = 'izin'
          statusLabel = 'Izin Disetujui'
          badgeClass = 'bg-sky-100 text-sky-800 border-sky-300'
        } else if (jns === 'lembur') {
          statusType = 'lembur'
          statusLabel = 'Lembur Disetujui'
          badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-300'
        }
      } else if (lib) {
        statusType = 'libur_nasional'
        statusLabel = lib.keterangan
        badgeClass = 'bg-slate-200 text-slate-700 border-slate-300 font-normal'
      } else if (isWeekend) {
        statusType = 'libur_mingguan'
        statusLabel = 'Libur Mingguan'
        badgeClass = 'bg-slate-100 text-slate-500 border-slate-200 font-normal'
      } else if (isBeforeJoin) {
        statusType = 'belum_bergabung'
        statusLabel = 'Belum Bergabung'
        badgeClass = 'bg-slate-100 text-slate-400 border-slate-200 font-normal italic'
      } else if (isPast) {
        statusType = 'alpha'
        statusLabel = 'Alpha'
        badgeClass = 'bg-rose-100 text-rose-800 border-rose-300'
      }

      if (isToday) {
        borderClass = 'border-2 border-blue-500 ring-2 ring-blue-100'
      }

      cells.push(
        <div
          key={day}
          onClick={() => setSelectedDateDetail({
            dateStr: `${day} ${NAMA_BULAN[calMonth - 1]} ${calYear}`,
            dayName,
            statusLabel: statusLabel || (isBeforeJoin ? 'Belum Bergabung' : isPast ? 'Alpha' : 'Mendatang'),
            statusType,
            absensi: abs,
            pengajuan: peng,
            libur: lib,
            isWeekend
          })}
          className={`h-24 p-2 bg-white border ${borderClass} rounded-xl hover:shadow-md transition-all cursor-pointer flex flex-col justify-between overflow-hidden relative group`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-extrabold ${isToday ? 'text-blue-600 font-black' : 'text-slate-700'}`}>
              {day}
            </span>
            {isToday && (
              <span className="text-[9px] font-extrabold bg-blue-600 text-white px-1.5 py-0.2 rounded-full uppercase">Hari Ini</span>
            )}
          </div>

          <div className="mt-1">
            {statusLabel ? (
              <span className={`block w-full px-1.5 py-1 rounded-lg text-[10px] font-extrabold truncate border ${badgeClass}`}>
                {statusLabel}
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium italic">--</span>
            )}
          </div>
        </div>
      )
    }

    return cells
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Judul & Tombol Lihat Jadwal */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Portal Absensi Mandiri</h1>
          <p className="text-xs text-slate-500">Verifikasi wajah, presensi harian, dan kalender kehadiran bulanan.</p>
        </div>
        <button
          onClick={() => setShowJadwalModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
        >
          <CalendarIcon size={15} /> Lihat Jadwal Kerja Saya
        </button>
      </div>

      {/* Warning Hari Libur / Belum Dibuat */}
      {isLibur && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 text-sm font-extrabold flex items-start gap-3.5 shadow-sm">
          <AlertTriangle size={22} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-black text-amber-950 text-sm">Jadwal Kerja Hari Ini Belum Dibuat / Libur Mingguan</p>
            <p className="text-xs text-amber-800 font-bold mt-0.5">
              Jadwal kerja untuk hari ({hari.toUpperCase()}) belum diatur oleh HRD atau sedang libur rutin. Silakan hubungi bagian HRD.
            </p>
          </div>
        </div>
      )}

      {/* Alert Banner untuk Kendala Absensi */}
      {formErrorMessage && (
        <div className="p-5 rounded-2xl bg-rose-50 border-2 border-rose-400 text-rose-950 text-sm font-extrabold flex items-start justify-between gap-3 shadow-md animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-3.5">
            <AlertTriangle size={22} className="text-rose-600 shrink-0 mt-0.5 animate-bounce" />
            <div>
              <p className="font-black text-rose-950 text-sm">Kendala / Informasi Absensi</p>
              <p className="text-xs font-black text-rose-800 mt-0.5">{formErrorMessage}</p>
            </div>
          </div>
          <button onClick={() => setFormErrorMessage(null)} className="p-1 hover:bg-rose-200/60 rounded-xl text-rose-800 transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Main Camera & Status Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Kamera / Upload Box (2 cols) */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Camera size={16} className="text-blue-600" /> Verifikasi Wajah / Foto Selfie
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">Auto Watermark Timestamp</span>
          </div>

          {/* Camera Viewport / Preview Box */}
          <div className="relative aspect-4/3 w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800">
            {capturedPhoto ? (
              <img src={capturedPhoto} alt="Captured Selfie" className="w-full h-full object-cover" />
            ) : cameraActive ? (
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover -scale-x-100" />
            ) : (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto">
                  <ShieldCheck size={28} className="text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-200">Posisikan Wajah Di Sini</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Gunakan kamera langsung atau unggah file foto selfie Anda.</p>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Camera Control Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {cameraActive ? (
              <>
                <button
                  onClick={capturePhoto}
                  className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Camera size={15} /> Ambil Foto Wajah
                </button>
                <button
                  onClick={stopCamera}
                  className="py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  Batal Kamera
                </button>
              </>
            ) : capturedPhoto ? (
              <>
                <button
                  onClick={startCamera}
                  className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <RefreshCw size={15} /> Foto Ulang
                </button>
                <button
                  onClick={() => setCapturedPhoto(null)}
                  className="py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                >
                  Hapus Foto
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startCamera}
                  className="col-span-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <Camera size={15} /> Buka Kamera Selfie
                </button>
              </>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMode('masuk')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'masuk'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <LogIn size={14} className="inline mr-1.5" /> Absen Masuk
              </button>
              <button
                type="button"
                onClick={() => setMode('pulang')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                  mode === 'pulang'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <LogOut size={14} className="inline mr-1.5" /> Absen Pulang
              </button>
            </div>

            <button
              onClick={handleSubmitAbsensi}
              disabled={submitting || !capturedPhoto}
              className="w-full py-3 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl text-xs font-extrabold transition-all disabled:opacity-40 shadow-xs flex items-center justify-center gap-2"
            >
              {submitting ? 'Mengirim Absensi...' : `Kirim Absen ${mode.toUpperCase()} Sekarang`}
            </button>

            <div className="mt-2 text-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-blue-600 hover:underline font-bold inline-flex items-center gap-1"
              >
                <Upload size={13} /> Atau Unggah Foto Dari HP/Laptop
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </div>
          </div>
        </div>

        {/* Right Column: Jam Realtime & Status Presensi Hari Ini */}
        <div className="space-y-6">
          {/* Jam Realtime Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-center space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waktu Realtime</p>
            <div className="text-3xl font-black text-slate-900 font-mono tracking-tight">
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <p className="text-xs font-semibold text-slate-600">
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Card Status Hari Ini */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              Aktivitas Kehadiran Hari Ini
            </h3>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl text-white ${absensiToday?.jam_masuk ? 'bg-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                  <LogIn size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Absen Masuk</p>
                  <p className="font-mono text-slate-500 font-bold">{extractHHMM(absensiToday?.jam_masuk)} WIB</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-xl text-white ${absensiToday?.jam_pulang ? 'bg-blue-600' : 'bg-slate-200 text-slate-400'}`}>
                  <LogOut size={16} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">Absen Pulang</p>
                  <p className="font-mono text-slate-500 font-bold">{extractHHMM(absensiToday?.jam_pulang)} WIB</p>
                </div>
              </div>

              {absensiToday?.status && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Hari Ini</span>
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300 inline-block">
                    {absensiToday.status}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* KALENDER KEHADIRAN BULANAN (Visual Color Coded & Minimizable Calendar) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-6">
        {/* Calendar Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <CalendarIcon size={18} className="text-blue-600" /> Kalender Kehadiran Bulanan
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Warna tanggal menunjukkan status absensi, permohonan izin/cuti disetujui, atau hari libur.</p>
          </div>

          {/* Month / Year Controls & Minimize Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            {!calMinimized && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-xs font-extrabold text-slate-900 font-mono min-w-[130px] text-center">
                  {NAMA_BULAN[calMonth - 1]} {calYear}
                </div>
                <button
                  onClick={handleNextMonth}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            <button
              onClick={() => setCalMinimized(p => !p)}
              className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              {calMinimized ? (
                <>
                  <ChevronDown size={15} /> Buka Kalender
                </>
              ) : (
                <>
                  <ChevronUp size={15} /> Minimize Kalender
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Body (Visible only when NOT minimized) */}
        {!calMinimized ? (
          <>
            {/* Color Legend Pills */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
              <span className="text-slate-400 mr-1">Legenda Status:</span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">🟢 Hadir</span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">🟡 Telat</span>
              <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-300">🔵 Sakit</span>
              <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-300">🟣 Cuti</span>
              <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-300">🩵 Izin</span>
              <span className="px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-300">🟣 Lembur</span>
              <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300">🔴 Alpha</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-300">⚪ Libur</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 border border-slate-200 italic font-normal">Belum Bergabung</span>
            </div>

            {/* Calendar Grid Container */}
            {calLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {/* Days Header */}
                <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-100">
                  <span className="text-rose-500">Min</span>
                  <span>Sen</span>
                  <span>Sel</span>
                  <span>Rab</span>
                  <span>Kam</span>
                  <span>Jum</span>
                  <span>Sab</span>
                </div>

                {/* Calendar Cells Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {renderCalendarGrid()}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500 font-medium">
            Kalender kehadiran di-minimize. Klik tombol <span className="font-bold text-slate-800">"Buka Kalender"</span> atau lakukan absensi untuk melihat rincian tanggal.
          </div>
        )}
      </div>

      {/* Modal Detail Presensi Tanggal */}
      {selectedDateDetail && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedDateDetail(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon size={16} className="text-blue-600" />
                Detail Presensi — {selectedDateDetail.dateStr}
              </h3>
              <button
                onClick={() => setSelectedDateDetail(null)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Hari & Tanggal</p>
                  <p className="font-extrabold text-slate-900 text-sm">{selectedDateDetail.dayName}, {selectedDateDetail.dateStr}</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                  {selectedDateDetail.statusLabel}
                </span>
              </div>

              {selectedDateDetail.absensi && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Jam Masuk</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {extractHHMM(selectedDateDetail.absensi.jam_masuk)} WIB
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Jam Pulang</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {extractHHMM(selectedDateDetail.absensi.jam_pulang)} WIB
                      </span>
                    </div>
                  </div>

                  {selectedDateDetail.absensi.foto_masuk_url && (
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Bukti Foto Selfie</span>
                      <img
                        src={selectedDateDetail.absensi.foto_masuk_url}
                        alt="Bukti Absen"
                        className="w-full h-44 object-cover rounded-xl border border-slate-200"
                      />
                    </div>
                  )}
                </div>
              )}

              {selectedDateDetail.pengajuan && (
                <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-1">
                  <p className="font-bold text-purple-900 uppercase text-[10px]">Permohonan {selectedDateDetail.pengajuan.jenis}</p>
                  <p className="text-purple-800 font-semibold">{selectedDateDetail.pengajuan.alasan_cuti || 'Permohonan disetujui HRD'}</p>
                </div>
              )}

              {selectedDateDetail.libur && (
                <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-800">
                  <p className="font-bold uppercase text-[10px] text-slate-500">Hari Libur Perusahaan / Nasional</p>
                  <p className="font-semibold">{selectedDateDetail.libur.keterangan}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDateDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Lihat Seluruh Jadwal Kerja */}
      {showJadwalModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowJadwalModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarIcon size={16} className="text-blue-600" /> Jadwal Kerja Perusahaan
              </h3>
              <button
                onClick={() => setShowJadwalModal(false)}
                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="text-left px-4 py-2.5">Hari</th>
                      <th className="text-left px-4 py-2.5">Jam Masuk</th>
                      <th className="text-left px-4 py-2.5">Jam Pulang</th>
                      <th className="text-center px-4 py-2.5">Toleransi Telat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {seluruhJadwal.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-100/50">
                        <td className="px-4 py-3 font-extrabold capitalize text-slate-900">{j.hari}</td>
                        <td className="px-4 py-3 font-mono">
                          {j.jam_masuk ? `${extractHHMM(j.jam_masuk)} WIB` : <span className="text-amber-700 font-bold">Libur</span>}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {j.jam_pulang ? `${extractHHMM(j.jam_pulang)} WIB` : <span className="text-amber-700 font-bold">Libur</span>}
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold">
                          {j.jam_masuk ? `${j.toleransi_telat_menit} m` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setShowJadwalModal(false)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
