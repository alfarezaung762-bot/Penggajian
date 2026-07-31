'use client';

import { useState, useEffect } from 'react';
import { Users, Plus, Search, Key, Trash2, CheckCircle, AlertCircle } from 'lucide-react';

export default function DataKaryawanPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [jabatanList, setJabatanList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);

  // Form states
  const [nik, setNik] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [jabatanId, setJabatanId] = useState('');
  const [statusKepegawaian, setStatusKepegawaian] = useState<'tetap' | 'kontrak'>('tetap');
  const [statusPernikahan, setStatusPernikahan] = useState<string>('TK/0');
  const [bankAccount, setBankAccount] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      const [resEmp, resJab] = await Promise.all([
        fetch('/api/crud_employee'),
        fetch('/api/crud_jabatan'),
      ]);
      const dataEmp = await resEmp.json();
      const dataJab = await resJab.json();
      if (resEmp.ok) setEmployees(dataEmp.data || []);
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
      const res = await fetch('/api/crud_employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nik, name, username, password,
          jabatan_id: parseInt(jabatanId, 10),
          status_kepegawaian: statusKepegawaian,
          status_pernikahan: statusPernikahan,
          bank_account_number: bankAccount,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambah karyawan');

      setMessage({ type: 'success', text: `Karyawan ${name} berhasil ditambahkan!` });
      setModalOpen(false);
      setNik(''); setName(''); setUsername(''); setPassword(''); setBankAccount('');
      fetchData();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId) return;

    try {
      const res = await fetch(`/api/crud_employee/${selectedEmpId}/reset-password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal reset password');

      setMessage({ type: 'success', text: 'Password karyawan berhasil diperbarui!' });
      setResetModalOpen(false);
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    }
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.nik.includes(search) ||
      e.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Karyawan</h1>
          <p className="text-slate-500 text-sm mt-1">Kelola data profil, jabatan, PTKP, dan password akun karyawan</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-2 text-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Tambah Karyawan Baru
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

      {/* Search Filter */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan NIK, Nama, atau Username..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Memuat data karyawan...</p>
        ) : filteredEmployees.length === 0 ? (
          <p className="text-sm text-slate-500">Tidak ada karyawan ditemukan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold">
                <tr>
                  <th className="p-3">NIK & Nama</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Jabatan</th>
                  <th className="p-3">Status Kerja</th>
                  <th className="p-3">PTKP (Pajak)</th>
                  <th className="p-3">No. Rekening</th>
                  <th className="p-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60">
                    <td className="p-3">
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-500 font-mono">NIK: {emp.nik}</p>
                    </td>
                    <td className="p-3 font-mono text-slate-700">@{emp.username}</td>
                    <td className="p-3 text-slate-800 font-medium">{emp.jabatan?.nama}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        emp.status_kepegawaian === 'tetap'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {emp.status_kepegawaian}
                      </span>
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{emp.status_pernikahan}</td>
                    <td className="p-3 font-mono text-slate-600 text-xs">{emp.bank_account_number}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => { setSelectedEmpId(emp.id); setResetModalOpen(true); }}
                        className="px-3 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Key className="w-3.5 h-3.5" /> Reset Pass
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Create Employee */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-lg w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Tambah Karyawan Baru</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">NIK Karyawan</label>
                  <input type="text" required value={nik} onChange={(e) => setNik(e.target.value)} placeholder="317101..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Username Login</label>
                  <input type="text" required value={username} onChange={(e) => setUsername(e.target.value)} placeholder="username" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                  <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jabatan</label>
                <select required value={jabatanId} onChange={(e) => setJabatanId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900">
                  <option value="">Pilih Jabatan</option>
                  {jabatanList.map((j) => (
                    <option key={j.id} value={j.id}>{j.nama}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Kepegawaian</label>
                  <select value={statusKepegawaian} onChange={(e) => setStatusKepegawaian(e.target.value as any)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900">
                    <option value="tetap">Tetap</option>
                    <option value="kontrak">Kontrak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status PTKP (Pajak)</label>
                  <select value={statusPernikahan} onChange={(e) => setStatusPernikahan(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900">
                    <option value="TK/0">TK/0 (Tidak Kawin, 0 Tanggungan)</option>
                    <option value="K/0">K/0 (Kawin, 0 Tanggungan)</option>
                    <option value="K/1">K/1 (Kawin, 1 Tanggungan)</option>
                    <option value="K/2">K/2 (Kawin, 2 Tanggungan)</option>
                    <option value="K/3">K/3 (Kawin, 3 Tanggungan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">No. Rekening BNI</label>
                <input type="text" required value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} placeholder="0123456789" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold">
                  Simpan Karyawan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Reset Password */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Reset Password Karyawan</h3>
            <form onSubmit={handleResetPassword} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password Baru</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-900"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setResetModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700 font-semibold">
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
