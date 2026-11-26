import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <section
      aria-label="Peringatan Akuntabilitas"
      className="bg-amber-50/70 border border-amber-200 rounded-xl px-4 py-3.5 flex items-start gap-3 text-slate-800"
    >
      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-xs sm:text-sm leading-relaxed">
        <span className="font-semibold text-slate-900">Catatan Verifikasi Manusia: </span>
        Seluruh hasil pengelompokan, tingkat urgensi, draf respons, dan ringkasan laporan periodik
        dihasilkan oleh sistem AI sebagai alat bantu kerja (status draf). Keputusan akhir,
        konfirmasi teknis, dan pengiriman balasan resmi tetap berada di bawah tanggung jawab staf
        Balai Pengelola Kereta Api Ringan Sumatera Selatan.
      </p>
    </section>
  );
};
