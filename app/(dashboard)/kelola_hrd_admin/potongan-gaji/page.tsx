'use client';

import { useState, useEffect } from 'react';
import { Percent, Plus, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';

export default function PotonganGajiPage() {
  const [potonganList, setPotonganList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<'persen' | 'nominal'>('persen');
  const [nilai, setNilai] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPotongan = async () => {
    try {
      const res = await fetch('/api/crud_pengaturan-payroll/jenis-potongan');
      const data = await res.json();
      if (res.ok) setPotonganList(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPotongan();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const res = await fetch('/api/crud_pengaturan-payroll/jenis-potongan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nama, tipe, nilai }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah potongan');

      setMessage({ type: 'success', text: `Potongan ${nama} berhasil ditambahkan (Logged to Audit Trail)!` });
      setModalOpen(false);
      setNama(''); setNilai('');
      fetchPotongan();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleToggleActive = async (item: any) => {
    try {
      const res = await fetch(`/api/crud_pengaturan-payroll/jenis-potongan/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: `Status potongan ${item.nama} diubah!` });
        fetchPotongan();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Jenis Potongan Gaji</h1>
          <p className="text-slate-500 text-sm mt-1">Konfigurasi BPJS Kesehatan, BPJS Ketenagakerjaan, dan potongan rutin (Maker-Checker)</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Buat Potongan Baru
        </button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800 text-xs">
        <ShieldAlert className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <h4 className="font-bold text-amber-900">Pola Maker-Checker HRD & Admin</h4>
          <p className="mt-0.5">
            HRD dapat mengelola potongan gaji secara langsung. Seluruh penambahan/perubahan jenis potongan otomatis dicatat ke <strong>Audit Log</strong> dengan perbandingan nilai lama vs baru untuk diawasi Admin/Owner.
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
          <p className="text-sm text-slate-500">Memuat jenis potongan...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Nama Potongan</th>
                  <th className="p-3">Tipe</th>
                  <th className="p-3">Nilai Potongan</th>
                  <th className="p-3">Status Active</th>
                  <th className="p-3 text-right">Aksi HRD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {potonganList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-blue-600" />
                      {item.nama}
                    </td>
                    <td className="p-3 font-semibold uppercase text-xs text-blue-600">{item.tipe}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {item.tipe === 'persen' ? `${Number(item.nilai)}% (dari Gaji Pokok)` : `Rp ${Math.round(Number(item.nilai)).toLocaleString('id-ID')}`}
                    </td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        item.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                          item.is_active
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {item.is_active ? 'Nonaktifkan' : 'Aktifkan'}
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
            <h3 className="text-lg font-bold text-slate-900 mb-4">Buat Potongan Gaji Baru</h3>
            <form onSubmit={handleCreate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Potongan</label>
                <input
                  type="text"
                  required
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Misal: BPJS Kesehatan Karyawan"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Tipe Kalkulasi</label>
                <select
                  value={tipe}
                  onChange={(e) => setTipe(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900"
                >
                  <option value="persen">Persentase (%) dari Gaji Pokok</option>
                  <option value="nominal">Nominal Tetap (Rp)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nilai Potongan {tipe === 'persen' ? '(%)' : '(Rp)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={nilai}
                  onChange={(e) => setNilai(e.target.value)}
                  placeholder={tipe === 'persen' ? '1.0' : '50000'}
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
