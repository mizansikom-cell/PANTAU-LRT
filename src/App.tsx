import { useMemo, useState } from 'react';
import { TopBar } from './components/TopBar';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { EmailInputPanel } from './components/EmailInputPanel';
import { SummaryStrip } from './components/SummaryStrip';
import { TriageResults } from './components/TriageResults';
import { PeriodicReportsPanel } from './components/PeriodicReportsPanel';
import { RulesAndDocsPanel } from './components/RulesAndDocsPanel';
import { DUMMY_EMAILS_TEXT } from './data/dummyEmails';
import type { AnalysisResult, PeriodicReports, TriagedEmail } from './types/lrt';

export default function App() {
  const [emailsText, setEmailsText] = useState('');
  const [triagedEmails, setTriagedEmails] = useState<TriagedEmail[]>([]);
  const [periodicReports, setPeriodicReports] = useState<PeriodicReports | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [processingMs, setProcessingMs] = useState<number | null>(null);

  const inputBlockCount = useMemo(() => {
    if (!emailsText.trim()) return 0;
    return emailsText
      .split(/\n-{3,}\n/)
      .map((s) => s.trim())
      .filter(Boolean).length;
  }, [emailsText]);

  const handleLoadSample = () => {
    setEmailsText(DUMMY_EMAILS_TEXT);
    setValidationError(null);
    setApiError(null);
  };

  const handleClear = () => {
    setEmailsText('');
    setTriagedEmails([]);
    setPeriodicReports(null);
    setValidationError(null);
    setApiError(null);
    setProcessingMs(null);
  };

  const handleProcessEmails = async () => {
    if (!emailsText.trim()) {
      setValidationError(
        'Mohon masukkan minimal satu pesan email masuk atau klik "Muat Contoh Data" sebelum memproses.'
      );
      return;
    }

    setValidationError(null);
    setApiError(null);
    setIsLoading(true);
    const startTime = performance.now();

    try {
      const response = await fetch('/api/analyze-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailsText }),
      });

      const payload = (await response.json()) as Partial<AnalysisResult> & { error?: string };

      if (!response.ok) {
        setApiError(
          payload?.error ||
            'Gagal memproses pesan email dengan layanan AI. Silakan klik "Coba lagi".'
        );
        return;
      }

      if (!Array.isArray(payload.daftar_pesan) || !payload.laporan_periodik) {
        setApiError(
          'Format data yang diterima tidak lengkap. Silakan klik "Coba lagi".'
        );
        return;
      }

      setTriagedEmails(payload.daftar_pesan);
      setPeriodicReports(payload.laporan_periodik);
      setProcessingMs(Math.round(performance.now() - startTime));
    } catch {
      setApiError(
        'Tidak dapat terhubung ke server aplikasi. Periksa koneksi lalu klik "Coba lagi".'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateDraft = (idPesan: string, newDraft: string) => {
    setTriagedEmails((prev) =>
      prev.map((item) =>
        item.id_pesan === idPesan ? { ...item, draf_respons: newDraft } : item
      )
    );
  };

  const handleToggleConfirmation = (idPesan: string) => {
    setTriagedEmails((prev) =>
      prev.map((item) =>
        item.id_pesan === idPesan
          ? { ...item, perlu_konfirmasi: !item.perlu_konfirmasi }
          : item
      )
    );
  };

  return (
    <div id="top" className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <TopBar onLoadSample={handleLoadSample} isLoading={isLoading} />

      <main className="flex-1 max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Institutional Context Header */}
        <section className="space-y-3">
          <div>
            <p className="text-xs sm:text-sm font-medium text-slate-600">
              Balai Pengelola Kereta Api Ringan Sumatera Selatan · Layanan LRT Sumsel
            </p>
            <h1
              className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
              style={{ textWrap: 'balance' }}
            >
              Pemantauan Email Masuk, Urgensi &amp; Laporan Periodik
            </h1>
          </div>

          <DisclaimerBanner />
        </section>

        {/* Input Panel */}
        <EmailInputPanel
          emailsText={emailsText}
          onChangeEmailsText={(val) => {
            setEmailsText(val);
            if (validationError && val.trim()) setValidationError(null);
          }}
          onLoadSample={handleLoadSample}
          onClear={handleClear}
          onProcess={handleProcessEmails}
          isLoading={isLoading}
          validationError={validationError}
        />

        {/* KPI Summary Strip (shown when populated or loading) */}
        {(triagedEmails.length > 0 || isLoading) && (
          <SummaryStrip emails={triagedEmails} processingMs={processingMs} />
        )}

        {/* Triage Results Table & Draft Inspector */}
        <TriageResults
          emails={triagedEmails}
          isLoading={isLoading}
          errorMessage={apiError}
          onRetry={handleProcessEmails}
          onLoadSample={handleLoadSample}
          onUpdateDraft={handleUpdateDraft}
          onToggleConfirmation={handleToggleConfirmation}
        />

        {/* Periodic Reports (Weekly, Monthly, Annual) */}
        <PeriodicReportsPanel
          reports={periodicReports}
          emails={triagedEmails}
          isLoading={isLoading}
        />

        {/* Business Rules & Evaluation Checklist */}
        <RulesAndDocsPanel
          emails={triagedEmails}
          reports={periodicReports}
          inputBlockCount={inputBlockCount}
        />
      </main>

      <footer className="border-t border-slate-200 bg-white mt-8">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            PANTAU-LRT · Prototipe Pelatihan Balai Pengelola Kereta Api Ringan Sumatera Selatan
          </span>
          <span>Pemrosesan sesi tanpa database · Data dummy pelatihan</span>
        </div>
      </footer>
    </div>
  );
}
