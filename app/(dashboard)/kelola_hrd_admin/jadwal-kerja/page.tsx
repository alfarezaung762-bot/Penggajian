'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, Save, CheckCircle, AlertCircle, Settings } from 'lucide-react';

export default function JadwalKerjaPage() {
  const [activeTab, setActiveTab] = useState<'jadwal' | 'libur' | 'pengaturan'>('jadwal');
  const [jadwalList, setJadwalList] = useState<any[]>([]);
  const [liburList, setLiburList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pengaturan umum states
  const [kuotaCuti, setKuotaCuti] = useState('12');
  const [toleransiTelat, setToleransiTelat] = useState('15');
  const [loadingPengaturan, setLoadingPengaturan] = useState(false);

  // Libur form
  const [modalLiburOpen, setModalLiburOpen] = useState(false);
  const [tglLibur, setTglLibur] = useState('');
  const [keteranganLibur, setKeteranganLibur] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [resJadwal, resLibur, resPengaturan] = await Promise.all([
        fetch('/api/jadwal-kerja'),
        fetch('/api/jadwal-kerja/hari-libur'),
        fetch('/api/crud_pengaturan-umum'),
      ]);
      const dataJadwal = await resJadwal.json();
      const dataLibur = await resLibur.json();
      const dataPengaturan = await resPengaturan.json();

      if (resJadwal.ok) setJadwalList(dataJadwal.data || []);
      if (resLibur.ok) setLiburList(dataLibur.data || []);
      if (resPengaturan.ok && dataPengaturan.data) {
        setKuotaCuti(String(dataPengaturan.data.kuota_cuti_tahunan));
        setToleransiTelat(String(dataPengaturan.data.toleransi_telat_menit));
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

  const formatTimeString = (dateStr: string | null) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const hours = String(date.getUTCHours()).padStart(2, '0');
      const minutes = String(date.getUTCMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const handleUpdateJadwal = async (hari: string, jamMasuk: string, jamPulang: string, isLibur: boolean) => {
    try {
      const res = await fetch('/api/jadwal-kerja', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hari, jam_masuk: jamMasuk, jam_pulang: jamPulang, is_libur_rutin: isLibur }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Jadwal hari ${hari.toUpperCase()} berhasil diperbarui!` });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateLibur = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/jadwal-kerja/hari-libur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tanggal: tglLibur, keterangan: keteranganLibur }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Hari libur nasional ditambahkan!' });
        setModalLiburOpen(false);
        setTglLibur(''); setKeteranganLibur('');
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteLibur = async (id: number) => {
    try {
      const res = await fetch(`/api/jadwal-kerja/hari-libur/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Hari libur dihapus!' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePengaturan = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingPengaturan(true);
    setMessage(null);

    try {
      const res = await fetch('/api/crud_pengaturan-umum', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kuota_cuti_tahunan: kuotaCuti,
          toleransi_telat_menit: toleransiTelat,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengaturan');

      setMessage({ type: 'success', text: 'Pengaturan umum kebijakan perusahaan berhasil disimpan!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoadingPengaturan(false);
    }
  };

  const dayDisplayMap: Record<string, string> = {
    senin: 'Hari Senin',
    selasa: 'Hari Selasa',
    rabu: 'Hari Rabu',
    kamis: 'Hari Kamis',
    jumat: 'Hari Jumat',
    sabtu: 'Hari Sabtu (Weekend)',
    minggu: 'Hari Minggu (Weekend)',
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Jadwal Kerja & Kebijakan Perusahaan</h1>
          <p className="text-slate-500 text-sm mt-1">Konfigurasi jam kerja harian, hari libur nasional, dan toleransi keterlambatan</p>
        </div>

        {/* 3 Tab Navigation */}
        <div className="flex bg-slate-200 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('jadwal')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'jadwal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Jam Hari Kerja Harian
          </button>
          <button
            onClick={() => setActiveTab('libur')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'libur' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Libur Nasional
          </button>
          <button
            onClick={() => setActiveTab('pengaturan')}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'pengaturan' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
            }`}
          >
            Pengaturan Umum Kebijakan
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl text-sm font-medium flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" /> : <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tab 1: Jam Hari Kerja Harian */}
      {activeTab === 'jadwal' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-base">Jadwal Shift Kerja Mingguan (Senin - Minggu)</h3>
          {loading ? (
            <p className="text-sm text-slate-500">Memuat jadwal...</p>
          ) : (
            <div className="space-y-3">
              {jadwalList.map((item) => {
                const jamMasukVal = formatTimeString(item.jam_masuk) || '08:00';
                const jamPulangVal = formatTimeString(item.jam_pulang) || '17:00';
                const isLibur = !item.jam_masuk;

                return (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-bold text-slate-900">{dayDisplayMap[item.hari] || item.hari}</h4>
                        <p className="text-xs text-slate-500 capitalize">Shift Operasional</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          defaultChecked={isLibur}
                          id={`libur-${item.hari}`}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Libur Rutin
                      </label>

                      <input
                        type="time"
                        defaultValue={jamMasukVal}
                        id={`masuk-${item.hari}`}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                      />
                      <span className="text-slate-400 text-xs font-bold">s/d</span>
                      <input
                        type="time"
                        defaultValue={jamPulangVal}
                        id={`pulang-${item.hari}`}
                        className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const masuk = (document.getElementById(`masuk-${item.hari}`) as HTMLInputElement)?.value;
                          const pulang = (document.getElementById(`pulang-${item.hari}`) as HTMLInputElement)?.value;
                          const isLib = (document.getElementById(`libur-${item.hari}`) as HTMLInputElement)?.checked;
                          handleUpdateJadwal(item.hari, masuk, pulang, isLib);
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs"
                      >
                        <Save className="w-3.5 h-3.5" /> Simpan
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Libur Nasional */}
      {activeTab === 'libur' && (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-base">Daftar Hari Libur Nasional & Cuti Bersama</h3>
            <button
              onClick={() => setModalLiburOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Tambah Libur Nasional
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Tanggal Libur</th>
                  <th className="p-3">Keterangan</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {liburList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono font-bold text-slate-900">{item.tanggal.split('T')[0]}</td>
                    <td className="p-3 text-slate-700">{item.keterangan}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteLibur(item.id)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Pengaturan Umum Kebijakan Perusahaan */}
      {activeTab === 'pengaturan' && (
        <form onSubmit={handleSavePengaturan} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5 text-sm">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-base">Pengaturan Umum Kebijakan Perusahaan</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Kuota Cuti Tahunan Karyawan (Hari / Tahun)
            </label>
            <input
              type="number"
              required
              min="1"
              max="365"
              value={kuotaCuti}
              onChange={(e) => setKuotaCuti(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold"
            />
            <p className="text-[11px] text-slate-500 mt-1">Default 12 hari/tahun per individu karyawan</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Toleransi Keterlambatan Presensi (Menit)
            </label>
            <input
              type="number"
              required
              min="0"
              max="120"
              value={toleransiTelat}
              onChange={(e) => setToleransiTelat(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-semibold"
            />
            <p className="text-[11px] text-slate-500 mt-1">Presensi di atas toleransi menit ini otomatis ditandai status TELAT. Jika melewati batas toleransi, tombol presensi tidak dapat dipencet.</p>
          </div>

          <button
            type="submit"
            disabled={loadingPengaturan}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {loadingPengaturan ? 'Menyimpan...' : 'Simpan Kebijakan Perusahaan'}
          </button>
        </form>
      )}

      {/* Modal Libur */}
      {modalLiburOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Hari Libur Nasional</h3>
            <form onSubmit={handleCreateLibur} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal</label>
                <input
                  type="date"
                  required
                  value={tglLibur}
                  onChange={(e) => setTglLibur(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Keterangan Libur</label>
                <input
                  type="text"
                  required
                  value={keteranganLibur}
                  onChange={(e) => setKeteranganLibur(e.target.value)}
                  placeholder="Misal: Hari Raya Idul Fitri"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalLiburOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                >
                  Simpan Libur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
