'use client';

import { useState, useEffect } from 'react';
import { Calendar, FilePlus, AlertCircle, CheckCircle, Clock, FileText, Upload } from 'lucide-react';

export default function PengajuanKaryawanPage() {
  const [jenis, setJenis] = useState<'cuti' | 'sakit' | 'lembur'>('cuti');
  const [saldoCuti, setSaldoCuti] = useState<any>(null);
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [tglMulaiCuti, setTglMulaiCuti] = useState('');
  const [tglSelesaiCuti, setTglSelesaiCuti] = useState('');
  const [alasanCuti, setAlasanCuti] = useState('');

  const [tglSakit, setTglSakit] = useState('');
  const [fotoSakit, setFotoSakit] = useState('');

  const [tglLembur, setTglLembur] = useState('');
  const [jamMulaiLembur, setJamMulaiLembur] = useState('17:00');
  const [jamSelesaiLembur, setJamSelesaiLembur] = useState('20:00');
  const [fotoLembur, setFotoLembur] = useState('');

  const fetchData = async () => {
    try {
      const [resSaldo, resHist] = await Promise.all([
        fetch('/api/saldo-cuti'),
        fetch('/api/pengajuan'),
      ]);

      const dataSaldo = await resSaldo.json();
      const dataHist = await resHist.json();

      if (resSaldo.ok) setSaldoCuti(dataSaldo.data);
      if (resHist.ok) setPengajuanList(dataHist.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload: any = { jenis };

    if (jenis === 'cuti') {
      payload.tanggal_mulai_cuti = tglMulaiCuti;
      payload.tanggal_selesai_cuti = tglSelesaiCuti;
      payload.alasan_cuti = alasanCuti;
    } else if (jenis === 'sakit') {
      payload.tanggal_sakit = tglSakit;
      payload.foto_bukti_url = fotoSakit || 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=300';
    } else if (jenis === 'lembur') {
      payload.tanggal_lembur = tglLembur;
      payload.jam_mulai_lembur = jamMulaiLembur;
      payload.jam_selesai_lembur = jamSelesaiLembur;
      payload.foto_bukti_url = fotoLembur || 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=300';
    }

    try {
      const res = await fetch('/api/pengajuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat pengajuan');

      setMessage({ type: 'success', text: `Pengajuan ${jenis.toUpperCase()} berhasil dikirim!` });
      // Reset forms
      setTglMulaiCuti(''); setTglSelesaiCuti(''); setAlasanCuti('');
      setTglSakit(''); setFotoSakit('');
      setTglLembur(''); setFotoLembur('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Form & Riwayat Pengajuan</h1>
        <p className="text-slate-500 text-sm mt-1">Ajukan Cuti, Sakit, atau Lembur dalam satu portal terpadu</p>
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

      {/* Form Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Buat Pengajuan Baru</h3>
              <p className="text-xs text-slate-500">Pilih jenis pengajuan di bawah ini</p>
            </div>
          </div>

          {/* Kuota Cuti Badge */}
          {saldoCuti && (
            <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-200 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <div className="text-xs">
                <span className="text-slate-500">Sisa Kuota Cuti ({saldoCuti.tahun}): </span>
                <span className="font-bold text-emerald-600 text-sm">{saldoCuti.sisa} Hari</span>
              </div>
            </div>
          )}
        </div>

        {/* Jenis Switcher */}
        <div className="grid grid-cols-3 gap-3 mb-6 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          {(['cuti', 'sakit', 'lembur'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setJenis(item); setMessage(null); }}
              className={`py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                jenis === item
                  ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Dynamic Fields for Cuti */}
          {jenis === 'cuti' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-2xl">
                ⚠️ Catatan: Pengajuan Cuti wajib dilakukan minimal <strong>H-4</strong> sebelum tanggal mulai cuti.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Mulai Cuti</label>
                  <input
                    type="date"
                    required
                    value={tglMulaiCuti}
                    onChange={(e) => setTglMulaiCuti(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Selesai Cuti</label>
                  <input
                    type="date"
                    required
                    value={tglSelesaiCuti}
                    onChange={(e) => setTglSelesaiCuti(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alasan Cuti</label>
                <textarea
                  rows={3}
                  required
                  value={alasanCuti}
                  onChange={(e) => setAlasanCuti(e.target.value)}
                  placeholder="Jelaskan alasan cuti..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {/* Dynamic Fields for Sakit */}
          {jenis === 'sakit' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3.5 rounded-2xl">
                ℹ️ Sakit dengan surat dokter tidak memotong gaji dan dapat diajukan di hari yang sama.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Sakit</label>
                <input
                  type="date"
                  required
                  value={tglSakit}
                  onChange={(e) => setTglSakit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Upload / URL Foto Surat Dokter (Wajib)</label>
                <input
                  type="text"
                  required
                  value={fotoSakit}
                  onChange={(e) => setFotoSakit(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          {/* Dynamic Fields for Lembur */}
          {jenis === 'lembur' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3.5 rounded-2xl">
                ⚠️ Catatan: Pengajuan Lembur wajib dilakukan minimal <strong>H-4</strong>.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Lembur</label>
                <input
                  type="date"
                  required
                  value={tglLembur}
                  onChange={(e) => setTglLembur(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai Lembur</label>
                  <input
                    type="time"
                    required
                    value={jamMulaiLembur}
                    onChange={(e) => setJamMulaiLembur(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai Lembur</label>
                  <input
                    type="time"
                    required
                    value={jamSelesaiLembur}
                    onChange={(e) => setJamSelesaiLembur(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">URL Foto Bukti Pekerjaan Lembur</label>
                <input
                  type="text"
                  value={fotoLembur}
                  onChange={(e) => setFotoLembur(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-md shadow-blue-600/20 active:scale-[0.99] transition-all disabled:opacity-50 mt-4"
          >
            {submitting ? 'Kirim Pengajuan...' : `Kirim Pengajuan ${jenis.toUpperCase()}`}
          </button>
        </form>
      </div>

      {/* Riwayat Pengajuan Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          Riwayat Seluruh Pengajuan Saya
        </h3>

        {loading ? (
          <p className="text-sm text-slate-500">Memuat riwayat...</p>
        ) : pengajuanList.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada pengajuan yang diajukan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Tanggal Pengajuan</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3">Detail Tanggal / Jam</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Catatan HRD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pengajuanList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 text-slate-500 text-xs font-mono">
                      {new Date(item.diajukan_pada).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3 font-bold uppercase text-blue-600 text-xs">{item.jenis}</td>
                    <td className="p-3 text-slate-700 text-xs">
                      {item.jenis === 'cuti' && `${item.tanggal_mulai_cuti?.split('T')[0]} s.d ${item.tanggal_selesai_cuti?.split('T')[0]}`}
                      {item.jenis === 'sakit' && item.tanggal_sakit?.split('T')[0]}
                      {item.jenis === 'lembur' && `${item.tanggal_lembur?.split('T')[0]} (${item.total_menit_lembur || 0} menit)`}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                          item.status === 'disetujui'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'ditolak'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-slate-500">{item.catatan_penolakan || '-'}</td>
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
