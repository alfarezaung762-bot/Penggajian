'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Lock } from 'lucide-react';

export default function SlipGajiKaryawanPage() {
  const [slips, setSlips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/slip-gaji')
      .then((res) => res.json())
      .then((data) => {
        if (data.data) setSlips(data.data);
        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        setLoading(false);
      });
  }, []);

  const formatRp = (val: number) => `Rp ${Math.round(val).toLocaleString('id-ID')}`;

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Slip Gaji Saya</h1>
        <p className="text-slate-500 text-sm mt-1">Histori slip gaji bulanan yang telah difinalisasi dan siap diunduh PDF</p>
      </div>

      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-8 text-center text-slate-500">
          Memuat slip gaji...
        </div>
      ) : slips.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-500 flex flex-col items-center gap-3 shadow-sm">
          <Lock className="w-10 h-10 text-slate-400" />
          <p className="font-bold text-slate-800">Belum Ada Slip Gaji Yang Difinalisasi</p>
          <p className="text-xs text-slate-500 max-w-md">
            Slip gaji bulanan hanya akan tampil setelah HRD/Admin memproses dan mengunci periode payroll bulanan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {slips.map((item) => {
            const bulanStr = monthNames[item.periode_penggajian.bulan - 1];
            const periodeStr = `${bulanStr} ${item.periode_penggajian.tahun}`;

            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-4 hover:border-blue-500/40 hover:shadow-md transition-all group"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600 font-bold">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{periodeStr}</h3>
                        <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Terkunci (Final)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gaji Pokok:</span>
                      <span className="font-mono font-semibold">{formatRp(Number(item.gaji_pokok))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tunjangan Jabatan:</span>
                      <span className="font-mono font-semibold">{formatRp(Number(item.tunjangan_jabatan))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Uang Makan:</span>
                      <span className="font-mono font-semibold">{formatRp(Number(item.uang_makan))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Lembur:</span>
                      <span className="font-mono font-bold text-emerald-600">+{formatRp(Number(item.total_lembur))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Potongan:</span>
                      <span className="font-mono font-bold text-red-600">-{formatRp(Number(item.total_potongan))}</span>
                    </div>

                    <div className="border-t border-slate-200 pt-2.5 flex justify-between items-center mt-2">
                      <span className="font-bold text-slate-900 text-base">Gaji Bersih (THP):</span>
                      <span className="font-mono font-bold text-blue-600 text-lg">{formatRp(Number(item.gaji_bersih))}</span>
                    </div>
                  </div>
                </div>

                <a
                  href={`/api/slip-gaji/${item.id}?format=pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all text-sm"
                >
                  <Download className="w-4 h-4" />
                  Unduh Slip Gaji (PDF)
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
