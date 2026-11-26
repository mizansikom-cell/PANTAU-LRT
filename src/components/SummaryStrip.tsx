import React from 'react';
import type { TriagedEmail } from '../types/lrt';

interface SummaryStripProps {
  emails: TriagedEmail[];
  processingMs: number | null;
}

export const SummaryStrip: React.FC<SummaryStripProps> = ({ emails, processingMs }) => {
  const total = emails.length;
  const highCount = emails.filter((e) => e.urgensi === 'Tinggi').length;
  const confirmCount = emails.filter((e) => e.perlu_konfirmasi).length;
  const readyDraftCount = emails.filter((e) => !e.perlu_konfirmasi).length;

  const categoryCounts = emails.reduce<Record<string, number>>((acc, item) => {
    acc[item.kategori] = (acc[item.kategori] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  return (
    <section aria-label="Ringkasan Metrik Triase" className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Total Email Diproses</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {total}
            </span>
            {processingMs !== null && (
              <span className="text-xs text-slate-500 font-mono tabular-nums">
                {(processingMs / 1000).toFixed(1)} dtk
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Urgensi Tinggi</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-red-700 font-mono tabular-nums">
              {highCount}
            </span>
            <span className="text-xs font-medium text-red-700">Prioritas Segera</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Perlu Konfirmasi Unit</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {confirmCount}
            </span>
            <span className="text-xs font-medium text-amber-700">Verifikasi Teknis</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Draf Siap Tinjau Humas</p>
          <div className="mt-2 flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {readyDraftCount}
            </span>
            <span className="text-xs font-medium text-emerald-700">Sesuai SOP Umum</span>
          </div>
        </div>
      </div>

      {sortedCategories.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600">
          <span className="font-semibold text-slate-800">Distribusi Kelompok:</span>
          {sortedCategories.map(([cat, count], idx) => (
            <React.Fragment key={cat}>
              {idx > 0 && (
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
              )}
              <span>
                {cat}{' '}
                <strong className="font-mono tabular-nums text-slate-900">({count})</strong>
              </span>
            </React.Fragment>
          ))}
        </div>
      )}
    </section>
  );
};
