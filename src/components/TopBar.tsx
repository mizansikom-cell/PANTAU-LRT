import React from 'react';

interface TopBarProps {
  onLoadSample: () => void;
  isLoading: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ onLoadSample, isLoading }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-bold tracking-tight text-[#0B3B60] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#0B3B60]"
        >
          PANTAU-LRT
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600"
        >
          <a
            href="#input-email"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Input Email
          </a>
          <a
            href="#hasil-triase"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Hasil Triase
          </a>
          <a
            href="#laporan-periodik"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Laporan Periodik
          </a>
          <a
            href="#aturan-evaluasi"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Aturan &amp; Uji
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={onLoadSample}
            disabled={isLoading}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0B3B60] rounded-lg hover:bg-[#082c48] disabled:opacity-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3B60]"
          >
            Muat Contoh Data
          </button>
        </div>
      </div>
    </header>
  );
};
