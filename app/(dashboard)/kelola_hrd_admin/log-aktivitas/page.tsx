'use client';

import { useState, useEffect } from 'react';
import { History, Filter, Search, Zap, UserCheck, Table, Calendar } from 'lucide-react';

export default function LogAktivitasPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterUser, setFilterUser] = useState('');
  const [filterAksi, setFilterAksi] = useState('');
  const [filterTabel, setFilterTabel] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [presetActive, setPresetActive] = useState(false);

  const fetchLogs = async (preset = false) => {
    setLoading(true);
    try {
      let url = '/api/log-aktivitas?';
      if (preset) {
        url += 'preset=perubahan_gaji_jabatan';
      } else {
        if (filterUser) url += `&account_id=${filterUser}`;
        if (filterAksi) url += `&aksi=${filterAksi}`;
        if (filterTabel) url += `&tabel_target=${filterTabel}`;
        if (startDate) url += `&start_date=${startDate}`;
        if (endDate) url += `&end_date=${endDate}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) setLogs(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/auth/crud_account');
      const data = await res.json();
      if (res.ok) setAccounts(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchLogs();
  }, []);

  const handleApplyPreset = () => {
    setPresetActive(true);
    setFilterUser('');
    setFilterAksi('');
    setFilterTabel('');
    setStartDate('');
    setEndDate('');
    fetchLogs(true);
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setPresetActive(false);
    fetchLogs(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Log Aktivitas System (Audit Trail)</h1>
          <p className="text-slate-500 text-sm mt-1">Jejak rekaman perubahan data sensitif finansial & administratif (Khusus Admin/Owner)</p>
        </div>

        {/* Preset Quick Filter Button */}
        <button
          onClick={handleApplyPreset}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border ${
            presetActive
              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20'
              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
          }`}
        >
          <Zap className="w-4 h-4 text-purple-600" />
          Preset Cepat: Perubahan Gaji & Jabatan (Maker-Checker HRD)
        </button>
      </div>

      {/* Filter Toolbar */}
      <form onSubmit={handleApplyFilter} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filter Log Kustom:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Pelaku (Account)</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
            >
              <option value="">Semua Pelaku</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.name} (@{a.username})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Jenis Aksi</label>
            <select
              value={filterAksi}
              onChange={(e) => setFilterAksi(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
            >
              <option value="">Semua Aksi</option>
              <option value="buat">Buat (Create)</option>
              <option value="ubah">Ubah (Update)</option>
              <option value="hapus">Hapus (Delete)</option>
              <option value="setujui">Setujui (Approve)</option>
              <option value="tolak">Tolak (Reject)</option>
              <option value="kunci">Kunci (Lock)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tabel Target</label>
            <input
              type="text"
              value={filterTabel}
              onChange={(e) => setFilterTabel(e.target.value)}
              placeholder="misal: jabatan, jenis_potongan"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">S/D Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs"
          >
            Terapkan Filter
          </button>
        </div>
      </form>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat log aktivitas...</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada log aktivitas ditemukan untuk filter ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Pelaku Aksi</th>
                  <th className="p-3">Aksi</th>
                  <th className="p-3">Tabel Target & ID</th>
                  <th className="p-3">Perbandingan Ringkas (Lama vs Baru)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-mono text-slate-500">
                      {new Date(item.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{item.account?.name}</p>
                      <p className="text-[10px] text-slate-500 font-semibold uppercase">Role: {item.account?.role}</p>
                    </td>
                    <td className="p-3 font-bold uppercase">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        item.aksi === 'buat' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        item.aksi === 'ubah' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        item.aksi === 'hapus' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {item.aksi}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-slate-800 font-semibold">
                      {item.tabel_target} <span className="text-slate-500 font-normal">(ID: {item.id_target})</span>
                    </td>
                    <td className="p-3 text-slate-800">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 font-mono text-[11px]">
                        {item.nilai_lama && (
                          <p className="text-red-600">
                            <span className="text-slate-500 font-bold">[LAMA]:</span> {JSON.stringify(item.nilai_lama)}
                          </p>
                        )}
                        {item.nilai_baru && (
                          <p className="text-emerald-600">
                            <span className="text-slate-500 font-bold">[BARU]:</span> {JSON.stringify(item.nilai_baru)}
                          </p>
                        )}
                      </div>
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
