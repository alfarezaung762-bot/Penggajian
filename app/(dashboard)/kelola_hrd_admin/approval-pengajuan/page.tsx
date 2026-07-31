'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, Clock, AlertCircle, CheckCircle, ExternalLink, Filter } from 'lucide-react';

export default function ApprovalPengajuanPage() {
  const [pengajuanList, setPengajuanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterJenis, setFilterJenis] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('menunggu');

  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [catatanPenolakan, setCatatanPenolakan] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      let url = `/api/pengajuan?status=${filterStatus}`;
      if (filterJenis) url += `&jenis=${filterJenis}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setPengajuanList(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterJenis, filterStatus]);

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`/api/pengajuan/${id}/proses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disetujui' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyetujui pengajuan');

      setMessage({ type: 'success', text: 'Pengajuan telah disetujui!' });
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;

    try {
      const res = await fetch(`/api/pengajuan/${selectedId}/proses`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ditolak', catatan_penolakan: catatanPenolakan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menolak pengajuan');

      setMessage({ type: 'success', text: 'Pengajuan telah ditolak dengan alasan' });
      setRejectModalOpen(false);
      setCatatanPenolakan('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Approval Pengajuan Karyawan</h1>
        <p className="text-slate-500 text-sm mt-1">Persetujuan atau penolakan pengajuan Cuti, Sakit, dan Lembur karyawan</p>
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

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-slate-900">Filter Pengajuan:</span>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
          >
            <option value="menunggu">Status: Menunggu Approval</option>
            <option value="disetujui">Status: Disetujui</option>
            <option value="ditolak">Status: Ditolak</option>
          </select>

          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
          >
            <option value="">Semua Jenis (Cuti/Sakit/Lembur)</option>
            <option value="cuti">Cuti Hari</option>
            <option value="sakit">Sakit Dokter</option>
            <option value="lembur">Lembur Kerja</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat pengajuan...</p>
        ) : pengajuanList.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada pengajuan ditemukan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Karyawan</th>
                  <th className="p-3">Jenis</th>
                  <th className="p-3">Detail & Tanggal</th>
                  <th className="p-3">Bukti Foto</th>
                  <th className="p-3">Diajukan Pada</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Aksi HRD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pengajuanList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{item.employee?.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">NIK: {item.employee?.nik}</p>
                    </td>
                    <td className="p-3 font-bold uppercase text-xs text-blue-600">{item.jenis}</td>
                    <td className="p-3 text-xs text-slate-700">
                      {item.jenis === 'cuti' && (
                        <>
                          <p className="font-medium">{item.tanggal_mulai_cuti?.split('T')[0]} s.d {item.tanggal_selesai_cuti?.split('T')[0]}</p>
                          <p className="text-slate-500 italic">Alasan: {item.alasan_cuti}</p>
                        </>
                      )}
                      {item.jenis === 'sakit' && <p>Tgl Sakit: {item.tanggal_sakit?.split('T')[0]}</p>}
                      {item.jenis === 'lembur' && (
                        <p>Tgl Lembur: {item.tanggal_lembur?.split('T')[0]} ({item.total_menit_lembur} menit)</p>
                      )}
                    </td>
                    <td className="p-3 text-xs">
                      {item.foto_bukti_url ? (
                        <a
                          href={item.foto_bukti_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 flex items-center gap-1 hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Bukti Foto
                        </a>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {new Date(item.diajukan_pada).toLocaleDateString('id-ID')}
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
                    <td className="p-3 text-right">
                      {item.status === 'menunggu' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(item.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => { setSelectedId(item.id); setRejectModalOpen(true); }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 shadow-xs"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Selesai</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Reject Catatan */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tolak Pengajuan</h3>
            <p className="text-xs text-slate-500 mb-4">Masukkan catatan alasan penolakan pengajuan ini</p>
            <form onSubmit={handleReject} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Catatan Penolakan (Wajib)</label>
                <textarea
                  rows={3}
                  required
                  value={catatanPenolakan}
                  onChange={(e) => setCatatanPenolakan(e.target.value)}
                  placeholder="Alasan ditolak..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-semibold"
                >
                  Tolak Pengajuan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
