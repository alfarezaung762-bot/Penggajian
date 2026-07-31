'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function PengaturanUmumPage() {
  const [kuotaCuti, setKuotaCuti] = useState('12');
  const [toleransiTelat, setToleransiTelat] = useState('15');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetch('/api/crud_pengaturan-umum')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) {
          setKuotaCuti(String(data.data.kuota_cuti_tahunan));
          setToleransiTelat(String(data.data.toleransi_telat_menit));
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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

      setMessage({ type: 'success', text: 'Pengaturan umum perusahaan berhasil diperbarui!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Umum Kebijakan Perusahaan</h1>
        <p className="text-slate-500 text-sm mt-1">Kuota cuti tahunan default & toleransi menit keterlambatan (Khusus Admin/Owner)</p>
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

      <form onSubmit={handleSave} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5 text-sm">
        {loading ? (
          <p className="text-slate-500">Memuat pengaturan...</p>
        ) : (
          <>
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
              <p className="text-[11px] text-slate-500 mt-1">Presensi di atas toleransi menit ini otomatis ditandai status TELAT</p>
            </div>

            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm transition-all"
            >
              <Save className="w-4 h-4" />
              Simpan Kebijakan Perusahaan
            </button>
          </>
        )}
      </form>
    </div>
  );
}
