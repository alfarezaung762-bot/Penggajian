'use client';

import { useState, useEffect } from 'react';
import { Lock, Play, RefreshCw, CheckCircle, AlertCircle, FileText } from 'lucide-react';

export default function PayrollProcessPage() {
  const [periodeList, setPeriodeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedPeriode, setSelectedPeriode] = useState<any>(null);

  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1));
  const [tahun, setTahun] = useState(String(new Date().getFullYear()));
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPeriode = async () => {
    try {
      const res = await fetch('/api/call_payroll');
      const data = await res.json();
      if (res.ok) setPeriodeList(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriode();
  }, []);

  const handleGeneratePayroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setMessage(null);

    try {
      const res = await fetch('/api/call_payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bulan, tahun }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal kalkulasi payroll');

      setMessage({ type: 'success', text: `Payroll periode Bulan ${bulan} Tahun ${tahun} berhasil di-generate!` });
      fetchPeriode();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handleLockPayroll = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin mengunci periode payroll ini? Setelah dikunci, nominal slip gaji tidak dapat diubah lagi.')) return;

    try {
      const res = await fetch(`/api/call_payroll/${id}/kunci`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunci payroll');

      setMessage({ type: 'success', text: 'Periode payroll berhasil dikunci (TERKUNCI) dan slip gaji sekarang dapat diakses/diunduh oleh karyawan!' });
      fetchPeriode();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const viewPeriodeDetail = async (id: number) => {
    try {
      const res = await fetch(`/api/call_payroll/${id}`);
      const data = await res.json();
      if (res.ok) setSelectedPeriode(data.data);
    } catch (e) {
      console.error(e);
    }
  };

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kalkulasi & Payroll Locking</h1>
        <p className="text-slate-500 text-sm mt-1">Generate slip gaji bulanan seluruh karyawan & kunci periode finansial (Khusus Admin/Owner)</p>
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

      {/* Action Card: Generate */}
      <form onSubmit={handleGeneratePayroll} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base">Memicu Kalkulasi Payroll Bulanan</h3>
        <p className="text-xs text-slate-500">
          Proses ini akan mengkalkulasi Gaji Pokok, Tunjangan, Lembur, Potongan BPJS, PPh 21, dan Potongan Alpha untuk seluruh karyawan aktif.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              className="bg-slate-50 text-slate-900 text-sm px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:border-blue-600"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                <option key={m} value={m}>{monthNames[m - 1]}</option>
              ))}
            </select>

            <select
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="bg-slate-50 text-slate-900 text-sm px-4 py-2.5 rounded-xl border border-slate-200 font-medium focus:border-blue-600"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={processing}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {processing ? 'Mengkalkulasi...' : 'Jalankan Generate Payroll'}
          </button>
        </div>
      </form>

      {/* History Periods Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-900 text-base mb-4">Daftar Batch Periode Payroll</h3>
        {loading ? (
          <p className="text-sm text-slate-500">Memuat periode...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Periode (Bulan - Tahun)</th>
                  <th className="p-3">Status Lock</th>
                  <th className="p-3">Dikunci Pada</th>
                  <th className="p-3 text-right">Aksi Locking</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {periodeList.map((p) => {
                  const isLocked = p.status === 'terkunci';
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="p-3 font-bold text-slate-900">
                        {monthNames[p.bulan - 1]} {p.tahun}
                      </td>
                      <td className="p-3 text-xs">
                        <span
                          className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            isLocked
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="p-3 text-xs text-slate-500 font-mono">
                        {p.dikunci_pada ? new Date(p.dikunci_pada).toLocaleString('id-ID') : '-'}
                      </td>
                      <td className="p-3 text-right space-x-2">
                        <button
                          onClick={() => viewPeriodeDetail(p.id)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
                        >
                          Lihat Slip
                        </button>
                        {!isLocked && (
                          <button
                            onClick={() => handleLockPayroll(p.id)}
                            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs ml-auto inline-flex"
                          >
                            <Lock className="w-3.5 h-3.5" /> Kunci Periode (Lock)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal View Detail Slips */}
      {selectedPeriode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Rincian Slip: Periode {monthNames[selectedPeriode.bulan - 1]} {selectedPeriode.tahun}
                </h3>
                <p className="text-xs text-slate-500">Status: {selectedPeriode.status}</p>
              </div>
              <button
                onClick={() => setSelectedPeriode(null)}
                className="px-3 py-1 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg text-xs"
              >
                Tutup
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="p-2.5">Karyawan</th>
                    <th className="p-2.5">Gaji Pokok</th>
                    <th className="p-2.5">Tunj. Jabatan</th>
                    <th className="p-2.5">Uang Makan</th>
                    <th className="p-2.5">Lembur</th>
                    <th className="p-2.5">Potongan</th>
                    <th className="p-2.5 text-right">Gaji Bersih</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedPeriode.slip_gaji?.map((s: any) => (
                    <tr key={s.id}>
                      <td className="p-2.5 font-bold text-slate-900">{s.employee?.name}</td>
                      <td className="p-2.5 font-mono">Rp {Math.round(Number(s.gaji_pokok)).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 font-mono">Rp {Math.round(Number(s.tunjangan_jabatan)).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 font-mono">Rp {Math.round(Number(s.uang_makan)).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 font-mono text-emerald-600 font-semibold">+Rp {Math.round(Number(s.total_lembur)).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 font-mono text-red-600 font-semibold">-Rp {Math.round(Number(s.total_potongan)).toLocaleString('id-ID')}</td>
                      <td className="p-2.5 font-mono font-bold text-blue-600 text-right">
                        Rp {Math.round(Number(s.gaji_bersih)).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
