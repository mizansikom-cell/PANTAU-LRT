import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  RefreshCw,
  Search,
  ShieldAlert,
  Inbox,
} from 'lucide-react';
import type { EmailCategory, TriagedEmail, UrgencyLevel } from '../types/lrt';

interface TriageResultsProps {
  emails: TriagedEmail[];
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  onLoadSample: () => void;
  onUpdateDraft: (idPesan: string, newDraft: string) => void;
  onToggleConfirmation: (idPesan: string) => void;
}

const CATEGORIES: Array<'Semua' | EmailCategory> = [
  'Semua',
  'Keluhan Operasional',
  'Fasilitas & Stasiun',
  'Keselamatan & Keamanan',
  'Rumor & Klarifikasi',
  'Informasi & Tarif',
  'Apresiasi & Saran',
];

function UrgencyMarker({ urgensi }: { urgensi: UrgencyLevel }) {
  if (urgensi === 'Tinggi') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 whitespace-nowrap">
        <AlertOctagon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Tinggi
      </span>
    );
  }
  if (urgensi === 'Sedang') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
        Sedang
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      Rendah
    </span>
  );
}

export const TriageResults: React.FC<TriageResultsProps> = ({
  emails,
  isLoading,
  errorMessage,
  onRetry,
  onLoadSample,
  onUpdateDraft,
  onToggleConfirmation,
}) => {
  const [urgencyFilter, setUrgencyFilter] = useState<'Semua' | UrgencyLevel>('Semua');
  const [categoryFilter, setCategoryFilter] = useState<'Semua' | EmailCategory>('Semua');
  const [onlyNeedsConfirm, setOnlyNeedsConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredEmails = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return emails
      .filter((item) => {
        if (urgencyFilter !== 'Semua' && item.urgensi !== urgencyFilter) return false;
        if (categoryFilter !== 'Semua' && item.kategori !== categoryFilter) return false;
        if (onlyNeedsConfirm && !item.perlu_konfirmasi) return false;
        if (q) {
          const haystack =
            `${item.id_pesan} ${item.subjek_ringkas} ${item.kategori} ${item.ringkasan_aman}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.skor_prioritas - a.skor_prioritas);
  }, [emails, urgencyFilter, categoryFilter, onlyNeedsConfirm, searchQuery]);

  const activeEmail = useMemo(() => {
    if (filteredEmails.length === 0) return null;
    return (
      filteredEmails.find((e) => e.id_pesan === selectedId) || filteredEmails[0]
    );
  }, [filteredEmails, selectedId]);

  const handleCopyDraft = async (item: TriagedEmail) => {
    try {
      await navigator.clipboard.writeText(item.draf_respons);
      setCopiedId(item.id_pesan);
      setTimeout(() => {
        setCopiedId((current) => (current === item.id_pesan ? null : current));
      }, 2000);
    } catch {
      // Clipboard fallback ignored silently if blocked by iframe policy
    }
  };

  return (
    <section
      id="hasil-triase"
      aria-labelledby="hasil-triase-heading"
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 id="hasil-triase-heading" className="text-lg font-semibold text-slate-900">
            02. Hasil Pengelompokan, Urgensi &amp; Draf Respons
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Pilih baris pesan untuk memeriksa ringkasan tersamar, alasan aturan bisnis, dan menyalin
            atau menyunting draf balasan resmi.
          </p>
        </div>

        {emails.length > 0 && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center p-1 bg-slate-100 rounded-lg">
              {(['Semua', 'Tinggi', 'Sedang', 'Rendah'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setUrgencyFilter(lvl)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    urgencyFilter === lvl
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <select
              aria-label="Filter kategori email"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as 'Semua' | EmailCategory)}
              className="px-3 py-2 text-xs font-medium bg-white border border-slate-300 rounded-lg text-slate-700 focus:outline-none focus:border-[#0B3B60]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'Semua' ? 'Semua Kategori' : cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {emails.length > 0 && (
        <div className="px-5 sm:px-6 py-3 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID pesan, subjek, stasiun, atau kata kunci..."
              aria-label="Cari hasil triase"
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B3B60]"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={onlyNeedsConfirm}
              onChange={(e) => setOnlyNeedsConfirm(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-[#0B3B60] focus:ring-[#0B3B60]"
            />
            Hanya tampilkan yang perlu konfirmasi ({emails.filter((e) => e.perlu_konfirmasi).length})
          </label>
        </div>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="m-5 sm:m-6 p-4 bg-red-50 border border-red-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="text-sm font-semibold text-red-900">
                Pemrosesan AI Belum Berhasil
              </h3>
              <p className="mt-1 text-sm text-red-800">{errorMessage}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-700 hover:bg-red-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            Coba lagi
          </button>
        </div>
      )}

      {isLoading && (
        <div className="p-5 sm:p-6 space-y-3" aria-busy="true" aria-label="Memuat hasil analisis AI">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600 pb-2">
            <span>Sedang mengelompokkan pesan, menilai urgensi, dan menyusun draf respons...</span>
            <span className="font-mono text-slate-500">Memproses di server</span>
          </div>
          {[1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="h-11 bg-slate-100 rounded-lg border border-slate-200/70"
            />
          ))}
        </div>
      )}

      {!isLoading && !errorMessage && emails.length === 0 && (
        <div className="px-6 py-14 text-center max-w-lg mx-auto">
          <Inbox className="w-9 h-9 text-slate-400 mx-auto" aria-hidden="true" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">
            Belum Ada Hasil Triase Email
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            Masukkan pesan email pada panel kotak masuk di atas atau muat 8 contoh data dummy
            Layanan LRT Sumsel untuk melihat hasil pengelompokan, urgensi, dan draf respons.
          </p>
          <button
            type="button"
            onClick={onLoadSample}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-[#0B3B60] hover:bg-[#082c48] rounded-lg transition-colors cursor-pointer"
          >
            Muat Contoh Data Sekarang
          </button>
        </div>
      )}

      {!isLoading && emails.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-12 divide-y xl:divide-y-0 xl:divide-x divide-slate-200">
          {/* Left: High-density triage table */}
          <div className="xl:col-span-7 overflow-x-auto">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-600">
                Tidak ada pesan yang sesuai dengan filter pencarian saat ini.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 whitespace-nowrap">ID &amp; Tanggal</th>
                    <th className="py-3 px-4">Subjek &amp; Kategori</th>
                    <th className="py-3 px-4 whitespace-nowrap">Urgensi</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Skor</th>
                    <th className="py-3 px-4 whitespace-nowrap">Konfirmasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-sm">
                  {filteredEmails.map((item) => {
                    const isSelected = activeEmail?.id_pesan === item.id_pesan;
                    return (
                      <tr
                        key={item.id_pesan}
                        onClick={() => setSelectedId(item.id_pesan)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedId(item.id_pesan);
                          }
                        }}
                        aria-selected={isSelected}
                        className={`cursor-pointer transition-colors focus:outline-none ${
                          isSelected
                            ? 'bg-sky-50/80'
                            : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          <div className="font-mono text-xs font-semibold text-slate-900 tabular-nums">
                            {item.id_pesan}
                          </div>
                          <div className="font-mono text-xs text-slate-500 tabular-nums mt-0.5">
                            {item.tanggal_masuk}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top">
                          <div className="font-medium text-slate-900 leading-snug">
                            {item.subjek_ringkas}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {item.kategori}
                          </div>
                        </td>
                        <td className="py-3 px-4 align-top whitespace-nowrap">
                          <UrgencyMarker urgensi={item.urgensi} />
                        </td>
                        <td className="py-3 px-4 align-top text-right font-mono text-xs font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                          {item.skor_prioritas}
                        </td>
                        <td className="py-3 px-4 align-top whitespace-nowrap text-xs">
                          {item.perlu_konfirmasi ? (
                            <span className="font-medium text-amber-800">
                              Perlu Konfirmasi
                            </span>
                          ) : (
                            <span className="text-slate-500">Siap Tinjau</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Right: Detail & Editable Draft Inspector */}
          <div className="xl:col-span-5 p-5 sm:p-6 bg-slate-50/40">
            {activeEmail ? (
              <div className="space-y-5">
                <div className="pb-4 border-b border-slate-200">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-mono tabular-nums">
                    <span className="font-semibold text-slate-800">{activeEmail.id_pesan}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeEmail.tanggal_masuk}</span>
                    <span aria-hidden="true">·</span>
                    <span>Skor {activeEmail.skor_prioritas}/100</span>
                  </div>
                  <h3 className="mt-1.5 text-base font-semibold text-slate-900 leading-snug">
                    {activeEmail.subjek_ringkas}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-700 font-medium">{activeEmail.kategori}</span>
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <UrgencyMarker urgensi={activeEmail.urgensi} />
                    <span aria-hidden="true" className="text-slate-300">
                      ·
                    </span>
                    <button
                      type="button"
                      onClick={() => onToggleConfirmation(activeEmail.id_pesan)}
                      className="text-xs font-medium text-[#0B3B60] hover:underline cursor-pointer"
                    >
                      {activeEmail.perlu_konfirmasi
                        ? 'Tandai Sudah Dikonfirmasi'
                        : 'Tandai Perlu Konfirmasi'}
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700">
                    Ringkasan Isi (Data Pribadi Disamarkan)
                  </h4>
                  <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
                    {activeEmail.ringkasan_aman}
                  </p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-700">
                    Alasan Klasifikasi &amp; Prioritas
                  </h4>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
                    {activeEmail.alasan_klasifikasi}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label
                      htmlFor={`draft-${activeEmail.id_pesan}`}
                      className="text-xs font-semibold text-slate-800"
                    >
                      Draf Respons Resmi (Dapat Disunting Sebelum Disalin)
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopyDraft(activeEmail)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#0B3B60] bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {copiedId === activeEmail.id_pesan ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                          Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                          Salin Draf
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    id={`draft-${activeEmail.id_pesan}`}
                    rows={7}
                    value={activeEmail.draf_respons}
                    onChange={(e) => onUpdateDraft(activeEmail.id_pesan, e.target.value)}
                    className="w-full p-3 text-sm leading-relaxed text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/15"
                  />
                  {activeEmail.perlu_konfirmasi && (
                    <p className="mt-2 text-xs text-amber-800 font-medium">
                      Perhatian: Pesan ini ditandai Perlu Konfirmasi unit teknis/pejabat terkait
                      sebelum balasan dikirim kepada pengirim.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Pilih satu pesan pada tabel untuk melihat detail dan draf respons.
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
