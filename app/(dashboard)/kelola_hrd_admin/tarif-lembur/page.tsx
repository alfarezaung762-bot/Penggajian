'use client';

import { useState, useEffect } from 'react';
import { Clock, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function TarifLemburPage() {
  const [tarifList, setTarifList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTarif = async () => {
    try {
      const res = await fetch('/api/crud_pengaturan-payroll/tarif-lembur');
      const data = await res.json();
      if (res.ok) setTarifList(data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTarif();
  }, []);

  const handleUpdate = async (id: number, multiplier: string) => {
    try {
      const res = await fetch('/api/crud_pengaturan-payroll/tarif-lembur', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, multiplier }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Multiplier tarif lembur diperbarui!' });
        fetchTarif();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan Multiplier Tarif Lembur</h1>
        <p className="text-slate-500 text-sm mt-1">Atur pengali tarif lembur per jam untuk Hari Kerja vs Hari Libur (Khusus Admin/Owner)</p>
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

      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-4">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat tarif lembur...</p>
        ) : (
          <div className="space-y-4">
            {tarifList.map((item) => (
              <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="font-bold text-slate-900 capitalize">Hari {item.tipe_hari}</h3>
                    <p className="text-xs text-slate-500">
                      {item.tipe_hari === 'kerja' ? 'Hari kerja biasa (Senin - Jumat)' : 'Weekend / Libur Nasional / Cuti Bersama'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    defaultValue={Number(item.multiplier)}
                    id={`mult-${item.id}`}
                    className="w-24 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 font-mono font-bold text-center"
                  />
                  <span className="text-slate-600 text-sm font-semibold">x Upah/Jam</span>

                  <button
                    type="button"
                    onClick={() => {
                      const val = (document.getElementById(`mult-${item.id}`) as HTMLInputElement)?.value;
                      handleUpdate(item.id, val);
                    }}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                  >
                    <Save className="w-3.5 h-3.5" /> Simpan
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
