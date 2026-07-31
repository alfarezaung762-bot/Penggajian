'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function TunjanganLainPage() {
  const [tunjanganList, setTunjanganList] = useState<any[]>([]);
  const [jabatanList, setJabatanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  // Form states
  const [nama, setNama] = useState('');
  const [nominal, setNominal] = useState('');
  const [tglPencairan, setTglPencairan] = useState('');
  const [jabatanTargetId, setJabatanTargetId] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [resTunj, resJab] = await Promise.all([
        fetch('/api/crud_pengaturan-payroll/tunjangan-lain'),
        fetch('/api/crud_jabatan'),
      ]);
      const dataTunj = await resTunj.json();
      const dataJab = await resJab.json();
      if (resTunj.ok) setTunjanganList(dataTunj.data || []);
      if (resJab.ok) setJabatanList(dataJab.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('/api/crud_pengaturan-payroll/tunjangan-lain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          nominal,
          tanggal_pencairan: tglPencairan,
          jabatan_target_id: jabatanTargetId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat tunjangan');

      setMessage({ type: 'success', text: `Tunjangan ${nama} berhasil dibuat!` });
      setModalOpen(false);
      setNama(''); setNominal(''); setTglPencairan(''); setJabatanTargetId('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Hapus tunjangan ini?')) return;
    try {
      const res = await fetch(`/api/crud_pengaturan-payroll/tunjangan-lain/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Tunjangan dihapus' });
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const formatRp = (val: number) => `Rp ${Math.round(val).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tunjangan Lainnya / Insidental (misal THR)</h1>
          <p className="text-slate-500 text-sm mt-1">Otomatis ditambahkan ke slip gaji saat tanggal pencairan tiba (Khusus Admin/Owner)</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Buat Tunjangan Insidental
        </button>
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

      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat tunjangan...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Nama Tunjangan</th>
                  <th className="p-3">Nominal (Rp)</th>
                  <th className="p-3">Tanggal Pencairan</th>
                  <th className="p-3">Jabatan Target</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tunjanganList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      {item.nama}
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-600">{formatRp(Number(item.nominal))}</td>
                    <td className="p-3 text-slate-700">{item.tanggal_pencairan?.split('T')[0]}</td>
                    <td className="p-3 text-xs">
                      {item.jabatan ? (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-semibold">
                          {item.jabatan.nama}
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold">
                          Semua Jabatan
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(item.id)}
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
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Buat Tunjangan Insidental</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Tunjangan</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Misal: THR Idul Fitri 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Tunjangan (Rp)</label>
                <input
                  type="number"
                  required
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  placeholder="5000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tanggal Pencairan</label>
                <input
                  type="date"
                  required
                  value={tglPencairan}
                  onChange={(e) => setTglPencairan(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jabatan Target (Opsional)</label>
                <select
                  value={jabatanTargetId}
                  onChange={(e) => setJabatanTargetId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium"
                >
                  <option value="">Semua Jabatan (Berlaku Semua)</option>
                  {jabatanList.map((j) => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700"
                >
                  Simpan Tunjangan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
