'use client'

import { Settings, ShieldCheck, Building, HelpCircle } from 'lucide-react'

export default function PengaturanUmumPage() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Pengaturan Umum & Perusahaan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Konstanta sistem, profil badan usaha, dan aturan kerja default PT SANTOSO MAKMUR JAYA.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-4 border-b border-border pb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#0f172a] text-white flex items-center justify-center font-bold">
            <Building size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">PT SANTOSO MAKMUR JAYA</h3>
            <p className="text-xs text-muted-foreground">Sistem Informasi Penggajian & Manajemen SDM v1.0</p>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-muted-foreground">Default Payroll Bank</span>
            <span className="font-bold text-foreground">BNI (Bank Negara Indonesia)</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-muted-foreground">Kuota Cuti Tahunan</span>
            <span className="font-bold text-foreground">12 Hari / Tahun</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-muted-foreground">Formula Upah Lembur Per Jam</span>
            <span className="font-bold text-foreground">Gaji Pokok / 173 Jam</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-muted-foreground">Format Akurasi Keuangan</span>
            <span className="font-bold text-foreground font-mono">Decimal(15,2)</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-border">
            <span className="text-muted-foreground">Masa Berlaku Sesi JWT</span>
            <span className="font-bold text-foreground">1 Jam (HTTP-Only Secure Cookie)</span>
          </div>
          <div className="flex justify-between py-2.5">
            <span className="text-muted-foreground">Validasi NIK & Rekening</span>
            <span className="font-bold text-foreground">NIK 16 Digit, Rek BNI 10 Digit</span>
          </div>
        </div>
      </div>
    </div>
  )
}
