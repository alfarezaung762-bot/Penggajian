'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, Calendar, Search, Edit3, CheckCircle, AlertCircle, Eye } from 'lucide-react';

export default function RekapAbsensiPage() {
  const [rekap, setRekap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));

  // Detail Modal & Koreksi
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [empAbsensiList, setEmpAbsensiList] = useState<any[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Koreksi modal
  const [koreksiModalOpen, setKoreksiModalOpen] = useState(false);
  const [selectedAbsensi, setSelectedAbsensi] = useState<any>(null);
  const [newStatus, setNewStatus] = useState<string>('alpha');
  const [catatanAlasan, setCatatanAlasan] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchRekap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/rekap-absensi?month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok) setRekap(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRekap();
  }, [month, year]);

  const openEmpDetail = async (emp: any) => {
    setSelectedEmp(emp);
    setDetailModalOpen(true);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/absensi?employee_id=${emp.id}&month=${month}&year=${year}`);
      const data = await res.json();
      if (res.ok) setEmpAbsensiList(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleKoreksi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAbsensi) return;

    try {
      const res = await fetch(`/api/absensi/${selectedAbsensi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          catatan_alasan: catatanAlasan,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal koreksi absensi');

      setMessage({ type: 'success', text: `Status absensi tanggal ${selectedAbsensi.tanggal.split('T')[0]} berhasil dikoreksi dan dicatat ke Audit Log!` });
      setKoreksiModalOpen(false);
      setCatatanAlasan('');
      if (selectedEmp) openEmpDetail(selectedEmp);
      fetchRekap();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Rekapitulasi Absensi Karyawan</h1>
          <p className="text-slate-500 text-sm mt-1">Ringkasan presensi bulanan dan modul koreksi status absensi HRD (Audit Logged)</p>
        </div>

        <div className="flex items-center gap-3 bg-white border border-slate-200/80 p-1.5 rounded-2xl shadow-xs">
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

      {/* Rekap Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat rekap absensi...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">Karyawan</th>
                  <th className="p-3">Hadir</th>
                  <th className="p-3">Telat</th>
                  <th className="p-3">Alpha</th>
                  <th className="p-3">Sakit</th>
                  <th className="p-3">Cuti</th>
                  <th className="p-3">Total Lembur</th>
                  <th className="p-3 text-right">Detail & Koreksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rekap.map((item) => (
                  <tr key={item.employee.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{item.employee.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{item.employee.jabatan?.nama}</p>
                    </td>
                    <td className="p-3 font-bold text-emerald-600">{item.total_hadir} hr</td>
                    <td className="p-3 font-bold text-amber-600">{item.total_telat} hr</td>
                    <td className="p-3 font-bold text-red-600">{item.total_alpha} hr</td>
                    <td className="p-3 text-blue-600 font-semibold">{item.total_sakit} hr</td>
                    <td className="p-3 text-slate-700 font-medium">{item.total_cuti} hr</td>
                    <td className="p-3 font-bold text-purple-600">{item.total_jam_lembur} Jam</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openEmpDetail(item.employee)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Detail Tanggal
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail Presensi Per Karyawan */}
      {detailModalOpen && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Detail Presensi: {selectedEmp.name}</h3>
                <p className="text-xs text-slate-500">Periode: Bulan {month} - Tahun {year}</p>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-3 py-1 bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg text-xs"
              >
                Tutup
              </button>
            </div>

            {loadingDetail ? (
              <p className="text-sm text-slate-500">Memuat rincian tanggal...</p>
            ) : empAbsensiList.length === 0 ? (
              <p className="text-sm text-slate-500">Tidak ada baris presensi tercatat di bulan ini.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="p-2.5">Tanggal</th>
                      <th className="p-2.5">Jam Masuk</th>
                      <th className="p-2.5">Jam Pulang</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5">Catatan Koreksi</th>
                      <th className="p-2.5 text-right">Koreksi HRD</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empAbsensiList.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5 font-mono text-slate-900 font-bold">{a.tanggal.split('T')[0]}</td>
                        <td className="p-2.5">{a.jam_masuk ? new Date(a.jam_masuk).toLocaleTimeString('id-ID') : '-'}</td>
                        <td className="p-2.5">{a.jam_pulang ? new Date(a.jam_pulang).toLocaleTimeString('id-ID') : '-'}</td>
                        <td className="p-2.5 font-bold uppercase text-slate-900">{a.status}</td>
                        <td className="p-2.5 text-slate-500">{a.catatan_alasan || '-'}</td>
                        <td className="p-2.5 text-right">
                          <button
                            onClick={() => { setSelectedAbsensi(a); setNewStatus(a.status); setKoreksiModalOpen(true); }}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg font-semibold text-[11px] flex items-center gap-1 ml-auto"
                          >
                            <Edit3 className="w-3 h-3" /> Koreksi
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Form Koreksi Status */}
      {koreksiModalOpen && selectedAbsensi && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Koreksi Status Absensi HRD</h3>
            <p className="text-xs text-slate-500 mb-4">
              Koreksi tanggal <strong>{selectedAbsensi.tanggal.split('T')[0]}</strong>. Aksi ini wajib menyertakan alasan dan otomatis dicatat ke <strong>Audit Log</strong>.
            </p>

            <form onSubmit={handleKoreksi} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Status Kehadiran Baru</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-medium"
                >
                  <option value="hadir">Hadir</option>
                  <option value="telat">Telat</option>
                  <option value="alpha">Alpha (Potong Gaji)</option>
                  <option value="sakit">Sakit</option>
                  <option value="cuti">Cuti</option>
                  <option value="libur">Libur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Alasan Koreksi (Wajib)</label>
                <textarea
                  rows={3}
                  required
                  value={catatanAlasan}
                  onChange={(e) => setCatatanAlasan(e.target.value)}
                  placeholder="Misal: Bukti foto presensi tidak valid / rekayasa AI..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setKoreksiModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-semibold"
                >
                  Simpan Koreksi & Catat Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
