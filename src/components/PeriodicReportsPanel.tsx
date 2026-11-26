import React, { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import type { PeriodicReports, TriagedEmail } from '../types/lrt';

interface PeriodicReportsPanelProps {
  reports: PeriodicReports | null;
  emails: TriagedEmail[];
  isLoading: boolean;
}

type PeriodTab = 'semua' | 'mingguan' | 'bulanan' | 'tahunan';

export const PeriodicReportsPanel: React.FC<PeriodicReportsPanelProps> = ({
  reports,
  emails,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<PeriodTab>('semua');

  const handleDownloadReportTxt = () => {
    if (!reports) return;
    const content = `LAPORAN PERIODIK PEMANTAUAN EMAIL LAYANAN LRT SUMSEL
Unit Kerja: Balai Pengelola Kereta Api Ringan Sumatera Selatan
Catatan: Dokumen ini adalah draf ringkasan bantu AI untuk tinjauan staf dan pimpinan.

======================================================================
1. LAPORAN MINGGUAN (${reports.mingguan.periode})
Total Pesan      : ${reports.mingguan.total_pesan}
Kategori Dominan : ${reports.mingguan.top_kategori}
Ringkasan Eksekutif:
${reports.mingguan.ringkasan_eksekutif}

Rekomendasi Tindak Lanjut:
${reports.mingguan.rekomendasi_tindak_lanjut}

======================================================================
2. LAPORAN BULANAN (${reports.bulanan.periode})
Total Pesan      : ${reports.bulanan.total_pesan}
Kategori Dominan : ${reports.bulanan.top_kategori}
Ringkasan Eksekutif:
${reports.bulanan.ringkasan_eksekutif}

Rekomendasi Tindak Lanjut:
${reports.bulanan.rekomendasi_tindak_lanjut}

======================================================================
3. LAPORAN TAHUNAN (${reports.tahunan.periode})
Total Pesan      : ${reports.tahunan.total_pesan}
Kategori Dominan : ${reports.tahunan.top_kategori}
Ringkasan Eksekutif:
${reports.tahunan.ringkasan_eksekutif}

Rekomendasi Tindak Lanjut:
${reports.tahunan.rekomendasi_tindak_lanjut}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-periodik-pantau-lrt-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = () => {
    if (emails.length === 0) return;
    const escapeCsv = (val: string | number | boolean) => {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const header = [
      'ID Pesan',
      'Tanggal Masuk',
      'Subjek Ringkas',
      'Kategori',
      'Urgensi',
      'Skor Prioritas',
      'Perlu Konfirmasi',
      'Ringkasan Aman',
      'Draf Respons',
    ].join(',');
    const rows = emails.map((e) =>
      [
        e.id_pesan,
        e.tanggal_masuk,
        e.subjek_ringkas,
        e.kategori,
        e.urgensi,
        e.skor_prioritas,
        e.perlu_konfirmasi ? 'Ya' : 'Tidak',
        e.ringkasan_aman,
        e.draf_respons,
      ]
        .map(escapeCsv)
        .join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `triase-email-pantau-lrt-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const visibleCards = reports
    ? ([
        { key: 'mingguan', title: 'Laporan Mingguan', data: reports.mingguan },
        { key: 'bulanan', title: 'Laporan Bulanan', data: reports.bulanan },
        { key: 'tahunan', title: 'Laporan Tahunan', data: reports.tahunan },
      ] as const).filter((c) => activeTab === 'semua' || activeTab === c.key)
    : [];

  return (
    <section
      id="laporan-periodik"
      aria-labelledby="laporan-periodik-heading"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 id="laporan-periodik-heading" className="text-lg font-semibold text-slate-900">
            03. Laporan Mingguan, Bulanan &amp; Tahunan
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Rekapitulasi tren pengaduan, kategori dominan, dan rekomendasi tindak lanjut untuk
            pimpinan Balai Pengelola Kereta Api Ringan Sumatera Selatan.
          </p>
        </div>

        {reports && (
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="flex items-center p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'semua', label: 'Semua' },
                  { id: 'mingguan', label: 'Mingguan' },
                  { id: 'bulanan', label: 'Bulanan' },
                  { id: 'tahunan', label: 'Tahunan' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleDownloadReportTxt}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              Unduh Laporan (.TXT)
            </button>

            <button
              type="button"
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
              Ekspor CSV
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-xl border border-slate-200/70" />
          ))}
        </div>
      ) : !reports ? (
        <p className="mt-5 text-sm text-slate-600">
          Ringkasan laporan mingguan, bulanan, dan tahunan akan otomatis terbentuk setelah email
          masuk diproses.
        </p>
      ) : (
        <div
          className={`mt-5 grid gap-5 ${
            activeTab === 'semua' ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'
          }`}
        >
          {visibleCards.map((card) => (
            <article
              key={card.key}
              className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between bg-slate-50/40"
            >
              <div>
                <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-slate-200">
                  <h3 className="text-base font-semibold text-slate-900">{card.title}</h3>
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {card.data.periode}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span>
                    Volume:{' '}
                    <strong className="font-mono tabular-nums text-slate-900">
                      {card.data.total_pesan} pesan
                    </strong>
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span>
                    Dominan: <strong className="text-slate-900">{card.data.top_kategori}</strong>
                  </span>
                </div>

                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-slate-700">Ringkasan Eksekutif</h4>
                  <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                    {card.data.ringkasan_eksekutif}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200">
                <h4 className="text-xs font-semibold text-slate-700">Rekomendasi Tindak Lanjut</h4>
                <p className="mt-1 text-sm text-slate-700 leading-relaxed">
                  {card.data.rekomendasi_tindak_lanjut}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
