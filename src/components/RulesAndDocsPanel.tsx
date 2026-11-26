import React, { useMemo } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import type { PeriodicReports, TriagedEmail } from '../types/lrt';

interface RulesAndDocsPanelProps {
  emails: TriagedEmail[];
  reports: PeriodicReports | null;
  inputBlockCount: number;
}

export const RulesAndDocsPanel: React.FC<RulesAndDocsPanelProps> = ({
  emails,
  reports,
  inputBlockCount,
}) => {
  const checks = useMemo(() => {
    const hasResults = emails.length > 0;
    const countMatches = hasResults && emails.length === inputBlockCount;
    const hasConfirmFlag = emails.some((e) => e.perlu_konfirmasi);
    const hasHighUrgency = emails.some((e) => e.urgensi === 'Tinggi');

    const piiLeaked = emails.some((e) => {
      const combined = `${e.subjek_ringkas} ${e.ringkasan_aman} ${e.draf_respons}`;
      const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(combined);
      const hasPhone = /(?:\+62|62|0)8[1-9][0-9\-\s]{6,13}[0-9]/.test(combined);
      return hasEmail || hasPhone;
    });

    const hasAllReports = Boolean(
      reports?.mingguan?.ringkasan_eksekutif &&
        reports?.bulanan?.ringkasan_eksekutif &&
        reports?.tahunan?.ringkasan_eksekutif
    );

    return [
      {
        label: 'Semua pesan input masuk ke hasil dan jumlahnya cocok',
        passed: countMatches,
        detail: hasResults
          ? `${emails.length} hasil dari ${inputBlockCount} blok input`
          : 'Menunggu pemrosesan',
      },
      {
        label: 'Aturan 1 (Privasi): 0 email & nomor HP asli warga di hasil',
        passed: hasResults && !piiLeaked,
        detail: hasResults
          ? piiLeaked
            ? 'Terdeteksi pola kontak yang belum tersamar'
            : 'Data pribadi tersamar'
          : 'Menunggu pemrosesan',
      },
      {
        label: 'Aturan 2 (Konfirmasi): Kasus kritis/rumor/PPID ditandai perlu konfirmasi',
        passed: hasConfirmFlag,
        detail: hasResults
          ? `${emails.filter((e) => e.perlu_konfirmasi).length} pesan ditandai perlu konfirmasi`
          : 'Menunggu pemrosesan',
      },
      {
        label: 'Aturan 3 (Prioritas): Gangguan >15 menit, >1 hari, atau keselamatan = Tinggi',
        passed: hasHighUrgency,
        detail: hasResults
          ? `${emails.filter((e) => e.urgensi === 'Tinggi').length} pesan berurgensi Tinggi`
          : 'Menunggu pemrosesan',
      },
      {
        label: 'Keluaran Laporan Mingguan, Bulanan, dan Tahunan tersedia',
        passed: hasAllReports,
        detail: hasAllReports ? '3 periode laporan lengkap' : 'Menunggu pemrosesan',
      },
    ];
  }, [emails, reports, inputBlockCount]);

  return (
    <section
      id="aturan-evaluasi"
      aria-labelledby="aturan-evaluasi-heading"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
    >
      <div className="pb-4 border-b border-slate-200">
        <h2 id="aturan-evaluasi-heading" className="text-lg font-semibold text-slate-900">
          04. Aturan Bisnis &amp; Verifikasi Evaluasi Sesi
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Acuan standar triase yang diterapkan pada setiap pemrosesan email masuk Layanan LRT
          Sumsel.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Aturan Bisnis Tetap (1–4)
          </h3>
          <ol className="space-y-3 text-sm text-slate-700 leading-relaxed">
            <li>
              <span className="font-semibold text-slate-900">1. Privasi Data Warga: </span>
              Nama pengirim, alamat email, nomor HP, dan NIK pada keluaran disamarkan menjadi{' '}
              <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">[warga]</code>,{' '}
              <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
                [email-disamarkan]
              </code>
              , atau{' '}
              <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">
                [kontak-disamarkan]
              </code>
              .
            </li>
            <li>
              <span className="font-semibold text-slate-900">2. Penandaan Konfirmasi: </span>
              Isu keselamatan operasi, rumor gangguan layanan, permohonan data resmi/PPID, dan
              keluhan berulang wajib ditandai <em>Perlu Konfirmasi</em> sebelum dibalas.
            </li>
            <li>
              <span className="font-semibold text-slate-900">3. Prioritas Urgensi Tinggi: </span>
              Otomatis berstatus <em>Tinggi</em> jika menyebut insiden keselamatan, keterlambatan
              lebih dari 15 menit, kerusakan fasilitas kritis, kehilangan barang berharga, atau
              keluhan tertunda lebih dari 1 hari.
            </li>
            <li>
              <span className="font-semibold text-slate-900">4. Gaya Draf &amp; Kewenangan: </span>
              Draf respons berbahasa Indonesia resmi, sopan, berlabel draf tinjauan staf, serta
              tidak menjanjikan kompensasi atau keputusan di luar kewenangan Humas.
            </li>
          </ol>
        </div>

        <div className="lg:pl-6 lg:border-l lg:border-slate-200">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">
            Pemeriksaan Kriteria Evaluasi Otomatis
          </h3>
          <ul className="space-y-2.5">
            {checks.map((chk) => (
              <li
                key={chk.label}
                className="flex items-start gap-2.5 text-sm pb-2.5 border-b border-slate-100 last:border-b-0"
              >
                {chk.passed ? (
                  <CheckCircle2
                    className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    className="w-4 h-4 text-slate-300 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-800">{chk.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-mono">{chk.detail}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
