'use client';

import { useState, useEffect, useRef } from 'react';
import { Camera, Clock, CheckCircle, AlertTriangle, Calendar, UserCheck, Lock, RefreshCw, AlertCircle } from 'lucide-react';

export default function AbsensiKaryawanPage() {
  const [loading, setLoading] = useState(true);
  const [absensiList, setAbsensiList] = useState<any[]>([]);
  const [pengaturan, setPengaturan] = useState<{ toleransi_telat_menit: number }>({ toleransi_telat_menit: 15 });
  const [jadwalToday, setJadwalToday] = useState<{ jam_masuk: string | null; jam_pulang: string | null; hari: string }>({
    jam_masuk: '08:00',
    jam_pulang: '17:00',
    hari: 'senin',
  });

  // Photo upload & capture states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const todayDateObj = new Date();
  const todayStr = todayDateObj.toISOString().split('T')[0];

  const dayEnumMap = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];

  const formatTimeString = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return null;
    }
  };

  const fetchData = async () => {
    try {
      const [resAbs, resPeng, resJadwal] = await Promise.all([
        fetch('/api/absensi'),
        fetch('/api/crud_pengaturan-umum'),
        fetch('/api/jadwal-kerja'),
      ]);

      const dataAbs = await resAbs.json();
      const dataPeng = await resPeng.json();
      const dataJadwal = await resJadwal.json();

      if (resAbs.ok) setAbsensiList(dataAbs.data || []);
      if (resPeng.ok && dataPeng.data) {
        setPengaturan({ toleransi_telat_menit: dataPeng.data.toleransi_telat_menit || 15 });
      }

      if (resJadwal.ok && dataJadwal.data) {
        const todayDayEnum = dayEnumMap[todayDateObj.getDay()];
        const todaySchedule = dataJadwal.data.find((j: any) => j.hari === todayDayEnum);
        if (todaySchedule) {
          setJadwalToday({
            hari: todayDayEnum,
            jam_masuk: formatTimeString(todaySchedule.jam_masuk) || (todaySchedule.jam_masuk ? '08:00' : null),
            jam_pulang: formatTimeString(todaySchedule.jam_pulang) || (todaySchedule.jam_pulang ? '17:00' : null),
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const todayAbsensi = absensiList.find((a) => a.tanggal.split('T')[0] === todayStr);

  // Check if past late tolerance
  const checkIsPastTolerance = () => {
    if (!jadwalToday.jam_masuk) return false; // If no shift / holiday

    const now = new Date();
    const [h, m] = jadwalToday.jam_masuk.split(':').map(Number);
    const cutoffTime = new Date();
    cutoffTime.setHours(h, m + pengaturan.toleransi_telat_menit, 0, 0);

    return now > cutoffTime;
  };

  const isPastTolerance = checkIsPastTolerance();
  const isHoliday = !jadwalToday.jam_masuk;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadPhotoToCloudinary = async (): Promise<string> => {
    if (!photoPreview) {
      throw new Error('Silakan ambil atau pilih foto bukti presensi terlebih dahulu');
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('file', photoPreview);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah foto ke Cloudinary');
      return data.url;
    } finally {
      setUploading(false);
    }
  };

  const handlePresensiHadir = async () => {
    setMessage(null);
    setSubmitting(true);

    try {
      if (isPastTolerance) {
        throw new Error(`Waktu presensi telah melebihi toleransi keterlambatan (${pengaturan.toleransi_telat_menit} menit). Batas presensi adalah ${jadwalToday.jam_masuk} + ${pengaturan.toleransi_telat_menit}m.`);
      }

      const photoUrl = await uploadPhotoToCloudinary();

      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_masuk_url: photoUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal presensi hadir');

      setMessage({ type: 'success', text: 'Presensi Hadir berhasil dicatat!' });
      setPhotoPreview(''); setSelectedFile(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePresensiPulang = async () => {
    setMessage(null);
    setSubmitting(true);

    try {
      const photoUrl = await uploadPhotoToCloudinary();

      const res = await fetch('/api/absensi/clock-out', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ foto_pulang_url: photoUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal presensi pulang');

      setMessage({ type: 'success', text: 'Presensi Pulang berhasil dicatat!' });
      setPhotoPreview(''); setSelectedFile(null);
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Absensi Saya</h1>
        <p className="text-slate-500 text-sm mt-1">Presensi kehadiran harian dengan bukti foto kamera (Cloudinary Secured)</p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Main Presensi Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal Hari Ini</span>
            <h3 className="text-xl font-bold text-slate-900">{todayStr} ({jadwalToday.hari.toUpperCase()})</h3>
          </div>
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-2xl text-xs text-slate-700 font-medium">
            <Clock className="w-4 h-4 text-blue-600" />
            {isHoliday ? (
              <span className="text-amber-600 font-bold">Hari Libur / Non-Kerja</span>
            ) : (
              <>
                <span>Shift Kerja: <strong>{jadwalToday.jam_masuk} - {jadwalToday.jam_pulang} WIB</strong></span>
                <span className="text-slate-400">|</span>
                <span>Toleransi: <strong>{pengaturan.toleransi_telat_menit} Menit</strong></span>
              </>
            )}
          </div>
        </div>

        {/* Warning Banner if past late tolerance */}
        {isPastTolerance && !todayAbsensi?.jam_masuk && !isHoliday && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800 text-xs font-medium">
            <Lock className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <div>
              <p className="font-bold text-red-900 text-sm">Tombol Hadir Tidak Dapat Dipencet (Toleransi Terlewati)</p>
              <p className="mt-1">
                Waktu saat ini telah melebihi batas keterlambatan yang ditetapkan perusahaan (Jam Masuk: {jadwalToday.jam_masuk} + Toleransi {pengaturan.toleransi_telat_menit}m).
              </p>
            </div>
          </div>
        )}

        {/* Photo Upload Box */}
        {!isHoliday && (!todayAbsensi?.jam_masuk || (todayAbsensi?.jam_masuk && !todayAbsensi?.jam_pulang)) && (
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Foto Bukti Presensi (Kamera / Ambil Gambar)
            </label>

            <input
              type="file"
              accept="image/*"
              capture="user"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-5 py-3 rounded-2xl border border-slate-200 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <Camera className="w-4 h-4 text-blue-600" />
                {photoPreview ? 'Ganti Foto' : 'Ambil Foto / Pilih Gambar'}
              </button>

              {photoPreview && (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-xs">
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button Area */}
        <div className="pt-2">
          {isHoliday ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-center text-sm font-medium">
              Hari ini adalah hari libur rutin / non-operasional. Presensi tidak diperlukan.
            </div>
          ) : !todayAbsensi?.jam_masuk ? (
            <button
              type="button"
              onClick={handlePresensiHadir}
              disabled={submitting || uploading || isPastTolerance}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/25 active:scale-[0.99] transition-all disabled:opacity-50 text-base flex items-center justify-center gap-2"
            >
              {submitting || uploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Mengunggah Foto ke Cloudinary & Mencatat Hadir...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Hadir (Presensi Masuk)
                </>
              )}
            </button>
          ) : !todayAbsensi?.jam_pulang ? (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-sm flex items-center justify-between">
                <div>
                  <p className="font-bold">Presensi Masuk Ter-registrasi</p>
                  <p className="text-xs text-slate-600">Jam Masuk: {new Date(todayAbsensi.jam_masuk).toLocaleTimeString('id-ID')} WIB | Status: {todayAbsensi.status.toUpperCase()}</p>
                </div>
                <span className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-bold">Hadir</span>
              </div>

              <button
                type="button"
                onClick={handlePresensiPulang}
                disabled={submitting || uploading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/25 active:scale-[0.99] transition-all disabled:opacity-50 text-base flex items-center justify-center gap-2"
              >
                {submitting || uploading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Mengunggah Foto & Presensi Pulang...
                  </>
                ) : (
                  <>
                    <UserCheck className="w-5 h-5" />
                    Pulang (Presensi Selesai)
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 text-slate-800 p-5 rounded-2xl text-center space-y-1">
              <p className="font-bold text-base text-emerald-600">Presensi Hari Ini Selesai</p>
              <p className="text-xs text-slate-500">
                Masuk: {new Date(todayAbsensi.jam_masuk).toLocaleTimeString('id-ID')} | Pulang: {new Date(todayAbsensi.jam_pulang).toLocaleTimeString('id-ID')} WIB
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Table History */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Riwayat Presensi Saya
        </h3>

        {loading ? (
          <p className="text-sm text-slate-500">Memuat riwayat...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Jam Masuk</th>
                  <th className="p-3">Jam Pulang</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Koreksi HRD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {absensiList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 text-slate-900 font-semibold">{item.tanggal.split('T')[0]}</td>
                    <td className="p-3 text-slate-600 font-mono">{item.jam_masuk ? new Date(item.jam_masuk).toLocaleTimeString('id-ID') : '-'}</td>
                    <td className="p-3 text-slate-600 font-mono">{item.jam_pulang ? new Date(item.jam_pulang).toLocaleTimeString('id-ID') : '-'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                        item.status === 'hadir' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.status === 'telat' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {item.dikoreksi_hrd ? (
                        <span className="text-amber-600 font-semibold" title={item.catatan_alasan}>
                          Dikoreksi ({item.catatan_alasan})
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
