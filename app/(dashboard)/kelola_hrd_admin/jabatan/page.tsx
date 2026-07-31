'use client';

import { useState, useEffect } from 'react';
import { Briefcase, Plus, Edit3, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';

export default function JabatanPage() {
  const [jabatanList, setJabatanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [nama, setNama] = useState('');
  const [gajiPokok, setGajiPokok] = useState('');
  const [uangMakan, setUangMakan] = useState('');
  const [tunjanganJabatan, setTunjanganJabatan] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchJabatan = async () => {
    try {
      const res = await fetch('/api/crud_jabatan');
      const data = await res.json();
      if (res.ok) setJabatanList(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJabatan();
  }, []);

  const handleOpenModal = (item?: any) => {
    if (item) {
      setEditingItem(item);
      setNama(item.nama);
      setGajiPokok(String(item.gaji_pokok));
      setUangMakan(String(item.uang_makan));
      setTunjanganJabatan(String(item.tunjangan_jabatan));
    } else {
      setEditingItem(null);
      setNama(''); setGajiPokok(''); setUangMakan(''); setTunjanganJabatan('');
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const method = editingItem ? 'PATCH' : 'POST';
    const url = editingItem ? `/api/crud_jabatan/${editingItem.id}` : '/api/crud_jabatan';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          gaji_pokok: gajiPokok,
          uang_makan: uangMakan,
          tunjangan_jabatan: tunjanganJabatan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan jabatan');

      setMessage({
        type: 'success',
        text: editingItem
          ? 'Jabatan diperbarui! Perubahan ini dicatat ke Audit Log (Maker-Checker)'
          : 'Jabatan baru berhasil ditambahkan!',
      });

      setModalOpen(false);
      fetchJabatan();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const formatRp = (val: number) => `Rp ${Math.round(val).toLocaleString('id-ID')}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Master Data Jabatan</h1>
          <p className="text-slate-500 text-sm mt-1">Atur Gaji Pokok, Uang Makan Harian, dan Tunjangan Jabatan</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Buat Jabatan Baru
        </button>
      </div>

      {/* Maker-Checker Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">Pola Maker-Checker Aktif</h4>
          <p className="mt-0.5">
            HRD memiliki kewenangan penuh me-manage Jabatan (Maker). Setiap perubahan finansial (Gaji Pokok/Tunjangan) otomatis dicatat ke <strong>Audit Log</strong> dengan perbandingan nilai lama & baru untuk diawasi Admin/Owner (Checker).
          </p>
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

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat jabatan...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Nama Jabatan</th>
                  <th className="p-3">Gaji Pokok</th>
                  <th className="p-3">Uang Makan / Hari</th>
                  <th className="p-3">Tunjangan Jabatan</th>
                  <th className="p-3 text-right">Aksi HRD (Maker)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jabatanList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600" />
                      {item.nama}
                    </td>
                    <td className="p-3 font-mono font-semibold text-slate-800">{formatRp(Number(item.gaji_pokok))}</td>
                    <td className="p-3 font-mono text-slate-700">{formatRp(Number(item.uang_makan))}</td>
                    <td className="p-3 font-mono text-slate-700">{formatRp(Number(item.tunjangan_jabatan))}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleOpenModal(item)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Ubah Finansial
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingItem ? 'Edit Jabatan (Audit Logged)' : 'Tambah Jabatan Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Jabatan</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Misal: Senior Developer"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Gaji Pokok (Rp)</label>
                <input
                  type="number"
                  required
                  value={gajiPokok}
                  onChange={(e) => setGajiPokok(e.target.value)}
                  placeholder="10000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Uang Makan Per Hari (Rp)</label>
                <input
                  type="number"
                  required
                  value={uangMakan}
                  onChange={(e) => setUangMakan(e.target.value)}
                  placeholder="50000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tunjangan Jabatan (Rp)</label>
                <input
                  type="number"
                  required
                  value={tunjanganJabatan}
                  onChange={(e) => setTunjanganJabatan(e.target.value)}
                  placeholder="2000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold"
                >
                  Simpan & Catat Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
