'use client';

import { useState, useEffect } from 'react';
import { FileText, Printer, Search, DollarSign, Users, TrendingUp } from 'lucide-react';

export default function LaporanGajiPage() {
  const [laporan, setLaporan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [search, setSearch] = useState('');

  const fetchLaporan = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan-gaji?month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok) setLaporan(data.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, [month, year]);

  const handlePrint = () => {
    window.print();
  };

  const formatRp = (val: number) => `Rp ${Math.round(val).toLocaleString('id-ID')}`;

  const slips = laporan?.slips || [];
  const summary = laporan?.summary || {};

  const filteredSlips = slips.filter((s: any) =>
    s.employee.name.toLowerCase().includes(search.toLowerCase()) ||
    s.employee.nik.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Rekapitulasi Gaji</h1>
          <p className="text-slate-500 text-sm mt-1">Laporan finansial penggajian karyawan per periode (Read-only)</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-slate-200/80 p-1.5 rounded-2xl shadow-xs">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-slate-50 text-slate-900 text-xs px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>Bulan {m}</option>
              ))}
            </select>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-slate-50 text-slate-900 text-xs px-3 py-1.5 rounded-xl border border-slate-200 font-medium"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 text-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-3">
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Karyawan Diproses</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total_karyawan || 0} Orgs</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Pengeluaran Gaji Bersih</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{formatRp(summary.total_gaji_bersih || 0)}</p>
        </div>
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Potongan Karyawan</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatRp(summary.total_potongan || 0)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm print:hidden">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari karyawan di laporan..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat laporan gaji...</p>
        ) : filteredSlips.length === 0 ? (
          <p className="text-sm text-slate-500">Belum ada slip gaji tercatat di periode bulan/tahun ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">NIK / Karyawan</th>
                  <th className="p-3">Jabatan</th>
                  <th className="p-3">Gaji Pokok</th>
                  <th className="p-3">Tunj. Jabatan</th>
                  <th className="p-3">Uang Makan</th>
                  <th className="p-3">Lembur</th>
                  <th className="p-3">Potongan</th>
                  <th className="p-3 text-right">Gaji Bersih (THP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlips.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{s.employee.name}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{s.employee.nik}</p>
                    </td>
                    <td className="p-3 text-slate-700 font-medium">{s.employee.jabatan?.nama}</td>
                    <td className="p-3 font-mono">{formatRp(Number(s.gaji_pokok))}</td>
                    <td className="p-3 font-mono">{formatRp(Number(s.tunjangan_jabatan))}</td>
                    <td className="p-3 font-mono">{formatRp(Number(s.uang_makan))}</td>
                    <td className="p-3 font-mono text-emerald-600 font-semibold">+{formatRp(Number(s.total_lembur))}</td>
                    <td className="p-3 font-mono text-red-600 font-semibold">-{formatRp(Number(s.total_potongan))}</td>
                    <td className="p-3 font-mono font-bold text-blue-600 text-right text-sm">
                      {formatRp(Number(s.gaji_bersih))}
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
