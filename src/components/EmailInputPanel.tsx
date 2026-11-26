import React, { useRef, useState } from 'react';
import { FileUp, Loader2, Plus, RotateCcw, Send, AlertCircle } from 'lucide-react';

interface EmailInputPanelProps {
  emailsText: string;
  onChangeEmailsText: (value: string) => void;
  onLoadSample: () => void;
  onClear: () => void;
  onProcess: () => void;
  isLoading: boolean;
  validationError: string | null;
}

export const EmailInputPanel: React.FC<EmailInputPanelProps> = ({
  emailsText,
  onChangeEmailsText,
  onLoadSample,
  onClear,
  onProcess,
  isLoading,
  validationError,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickDate, setQuickDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [quickSender, setQuickSender] = useState('');
  const [quickSubject, setQuickSubject] = useState('');
  const [quickBody, setQuickBody] = useState('');
  const [quickAddError, setQuickAddError] = useState<string | null>(null);

  const estimatedCount = emailsText.trim()
    ? emailsText
        .split(/\n-{3,}\n/)
        .map((s) => s.trim())
        .filter(Boolean).length
    : 0;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      if (content.trim()) {
        onChangeEmailsText(
          emailsText.trim() ? `${emailsText.trim()}\n---\n${content.trim()}` : content.trim()
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAppendSingleEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSubject.trim() || !quickBody.trim()) {
      setQuickAddError('Subjek dan isi email wajib diisi.');
      return;
    }
    setQuickAddError(null);
    const nextNum = estimatedCount + 1;
    const formatted = `ID: EML-${String(nextNum).padStart(3, '0')}
Tanggal: ${quickDate || new Date().toISOString().slice(0, 10)}
Pengirim: ${quickSender.trim() || 'Warga (data dummy)'}
Subjek: ${quickSubject.trim()}
Isi: ${quickBody.trim()}`;

    onChangeEmailsText(
      emailsText.trim() ? `${emailsText.trim()}\n---\n${formatted}` : formatted
    );
    setQuickSender('');
    setQuickSubject('');
    setQuickBody('');
    setShowQuickAdd(false);
  };

  return (
    <section
      id="input-email"
      aria-labelledby="input-email-heading"
      className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 id="input-email-heading" className="text-lg font-semibold text-slate-900">
            01. Kotak Masuk Email Layanan LRT Sumsel
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Tempelkan satu atau beberapa pesan email masuk (pisahkan tiap email dengan baris{' '}
            <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">
              ---
            </code>
            ). Gunakan data dummy selama sesi pelatihan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowQuickAdd((prev) => !prev)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Tambah 1 Email
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <FileUp className="w-3.5 h-3.5" aria-hidden="true" />
            Impor .TXT / .CSV
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.eml"
            onChange={handleFileUpload}
            className="hidden"
            aria-label="Impor berkas teks email"
          />

          <button
            type="button"
            onClick={onLoadSample}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-medium text-[#0B3B60] bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            Muat Contoh Data (8 Email)
          </button>

          {emailsText.trim().length > 0 && (
            <button
              type="button"
              onClick={onClear}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Kosongkan
            </button>
          )}
        </div>
      </div>

      {showQuickAdd && (
        <form
          onSubmit={handleAppendSingleEmail}
          className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">
              Tambah Pesan Email Baru (Dummy)
            </h3>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Tutup
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tanggal Masuk
              </label>
              <input
                type="date"
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B3B60]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Pengirim (Data Dummy untuk Uji Penyamaran Privasi)
              </label>
              <input
                type="text"
                value={quickSender}
                onChange={(e) => setQuickSender(e.target.value)}
                placeholder="Contoh: Adi Nugroho (adi.dummy@contoh.id | 0812-0000-1234)"
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B3B60]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Subjek Email
            </label>
            <input
              type="text"
              value={quickSubject}
              onChange={(e) => setQuickSubject(e.target.value)}
              placeholder="Contoh: Keterlambatan kereta di Stasiun Cinde lebih dari 20 menit"
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B3B60]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Isi Pesan Email
            </label>
            <textarea
              rows={3}
              value={quickBody}
              onChange={(e) => setQuickBody(e.target.value)}
              placeholder="Tuliskan isi pesan email masuk..."
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-[#0B3B60]"
            />
          </div>
          {quickAddError && (
            <p className="text-xs text-red-700 font-medium">{quickAddError}</p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-[#0B3B60] hover:bg-[#082c48] rounded-lg transition-colors cursor-pointer"
            >
              Sisipkan ke Daftar Input
            </button>
          </div>
        </form>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span>
            Format anjuran: <span className="font-mono">ID / Tanggal / Pengirim / Subjek / Isi</span>
          </span>
          <span className="font-mono tabular-nums">
            {estimatedCount} blok email · {emailsText.length.toLocaleString('id-ID')} karakter
          </span>
        </div>

        <label htmlFor="emails-textarea" className="sr-only">
          Daftar pesan email masuk
        </label>
        <textarea
          id="emails-textarea"
          rows={9}
          value={emailsText}
          onChange={(e) => onChangeEmailsText(e.target.value)}
          disabled={isLoading}
          placeholder={`Contoh format:\nID: EML-001\nTanggal: 2026-11-24\nPengirim: Budi Pratama (budi.dummy@contoh.id | 0812-0000-1122)\nSubjek: Pintu kereta macet di Stasiun Ampera\nIsi: Kereta tertahan lebih dari 20 menit...\n---\n(atau klik "Muat Contoh Data" di atas)`}
          className="w-full p-3.5 text-sm font-mono leading-relaxed text-slate-800 bg-slate-50/60 border border-slate-300 rounded-lg focus:outline-none focus:bg-white focus:border-[#0B3B60] focus:ring-2 focus:ring-[#0B3B60]/15 disabled:opacity-60"
        />
      </div>

      {validationError && (
        <div
          role="alert"
          className="mt-3 flex items-center gap-2 px-3.5 py-2.5 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      )}

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Tanpa login &amp; tanpa penyimpanan basis data. Seluruh data hanya diproses di sesi aktif
          dan hilang saat halaman dimuat ulang.
        </p>

        <button
          type="button"
          onClick={onProcess}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#0B3B60] hover:bg-[#082c48] disabled:bg-slate-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B3B60]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Memproses Email dengan AI...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" aria-hidden="true" />
              Proses &amp; Kelompokkan Email
            </>
          )}
        </button>
      </div>
    </section>
  );
};
