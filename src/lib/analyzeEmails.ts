import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AnalysisResult,
  EmailCategory,
  PeriodicReportItem,
  TriagedEmail,
  UrgencyLevel,
} from '../types/lrt';

const VALID_CATEGORIES: ReadonlySet<EmailCategory> = new Set([
  'Keluhan Operasional',
  'Fasilitas & Stasiun',
  'Informasi & Tarif',
  'Keselamatan & Keamanan',
  'Apresiasi & Saran',
  'Rumor & Klarifikasi',
]);

const VALID_URGENCIES: ReadonlySet<UrgencyLevel> = new Set([
  'Tinggi',
  'Sedang',
  'Rendah',
]);

export class EmailAnalysisError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.name = 'EmailAnalysisError';
    this.statusCode = statusCode;
  }
}

/**
 * Defense-in-depth PII scrubber to guarantee no raw email addresses,
 * phone numbers, or 16-digit ID numbers leak into display or draft outputs.
 */
function scrubPII(text: string): string {
  if (!text) return '';
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[email-disamarkan]')
    .replace(/(?:\+62|62|0)8[1-9][0-9\-\s]{6,13}[0-9]/g, '[kontak-disamarkan]')
    .replace(/\b\d{16}\b/g, '[identitas-disamarkan]');
}

function normalizeUrgency(value: unknown): UrgencyLevel {
  if (typeof value === 'string' && VALID_URGENCIES.has(value as UrgencyLevel)) {
    return value as UrgencyLevel;
  }
  return 'Sedang';
}

function normalizeCategory(value: unknown): EmailCategory {
  if (typeof value === 'string' && VALID_CATEGORIES.has(value as EmailCategory)) {
    return value as EmailCategory;
  }
  return 'Keluhan Operasional';
}

function normalizeReportItem(
  raw: unknown,
  fallbackPeriod: string,
  fallbackCount: number
): PeriodicReportItem {
  const obj = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    periode:
      typeof obj.periode === 'string' && obj.periode.trim()
        ? scrubPII(obj.periode.trim())
        : fallbackPeriod,
    total_pesan:
      typeof obj.total_pesan === 'number' && Number.isFinite(obj.total_pesan)
        ? Math.max(0, Math.round(obj.total_pesan))
        : fallbackCount,
    top_kategori:
      typeof obj.top_kategori === 'string' && obj.top_kategori.trim()
        ? scrubPII(obj.top_kategori.trim())
        : 'Keluhan Operasional',
    ringkasan_eksekutif:
      typeof obj.ringkasan_eksekutif === 'string' && obj.ringkasan_eksekutif.trim()
        ? scrubPII(obj.ringkasan_eksekutif.trim())
        : 'Belum ada ringkasan eksekutif untuk periode ini.',
    rekomendasi_tindak_lanjut:
      typeof obj.rekomendasi_tindak_lanjut === 'string' && obj.rekomendasi_tindak_lanjut.trim()
        ? scrubPII(obj.rekomendasi_tindak_lanjut.trim())
        : 'Lakukan pemantauan rutin pada unit layanan terkait.',
  };
}

function validateAndNormalizeResult(parsed: unknown): AnalysisResult {
  if (!parsed || typeof parsed !== 'object') {
    throw new EmailAnalysisError(
      'Format respons AI tidak sesuai skema JSON yang diharapkan.',
      502
    );
  }

  const root = parsed as Record<string, unknown>;
  if (!Array.isArray(root.daftar_pesan) || root.daftar_pesan.length === 0) {
    throw new EmailAnalysisError(
      'AI tidak mengembalikan daftar pesan yang terklasifikasi.',
      502
    );
  }

  const daftar_pesan: TriagedEmail[] = root.daftar_pesan.map((item, idx) => {
    const row = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>;
    const urgensi = normalizeUrgency(row.urgensi);
    let skor =
      typeof row.skor_prioritas === 'number' && Number.isFinite(row.skor_prioritas)
        ? Math.min(100, Math.max(1, Math.round(row.skor_prioritas)))
        : urgensi === 'Tinggi'
          ? 85
          : urgensi === 'Sedang'
            ? 55
            : 25;

    if (urgensi === 'Tinggi' && skor < 75) skor = 75;
    if (urgensi === 'Sedang' && (skor < 40 || skor >= 75)) skor = 55;
    if (urgensi === 'Rendah' && skor >= 40) skor = 25;

    return {
      id_pesan:
        typeof row.id_pesan === 'string' && row.id_pesan.trim()
          ? scrubPII(row.id_pesan.trim())
          : `EML-${String(idx + 1).padStart(3, '0')}`,
      tanggal_masuk:
        typeof row.tanggal_masuk === 'string' && row.tanggal_masuk.trim()
          ? row.tanggal_masuk.trim()
          : new Date().toISOString().slice(0, 10),
      subjek_ringkas:
        typeof row.subjek_ringkas === 'string' && row.subjek_ringkas.trim()
          ? scrubPII(row.subjek_ringkas.trim())
          : 'Pesan masuk layanan LRT Sumsel',
      kategori: normalizeCategory(row.kategori),
      urgensi,
      skor_prioritas: skor,
      perlu_konfirmasi: Boolean(row.perlu_konfirmasi),
      ringkasan_aman:
        typeof row.ringkasan_aman === 'string' && row.ringkasan_aman.trim()
          ? scrubPII(row.ringkasan_aman.trim())
          : 'Ringkasan pesan tidak tersedia.',
      alasan_klasifikasi:
        typeof row.alasan_klasifikasi === 'string' && row.alasan_klasifikasi.trim()
          ? scrubPII(row.alasan_klasifikasi.trim())
          : 'Diklasifikasikan berdasarkan isi pesan masuk.',
      draf_respons:
        typeof row.draf_respons === 'string' && row.draf_respons.trim()
          ? scrubPII(row.draf_respons.trim())
          : '[DRAF UNTUK TINJAUAN STAF] Terima kasih telah menghubungi Balai Pengelola Kereta Api Ringan Sumatera Selatan (LRT Sumsel). Pesan Anda telah kami terima untuk ditindaklanjuti sesuai prosedur.',
    };
  });

  const rawReports = (
    root.laporan_periodik && typeof root.laporan_periodik === 'object'
      ? root.laporan_periodik
      : {}
  ) as Record<string, unknown>;

  return {
    daftar_pesan,
    laporan_periodik: {
      mingguan: normalizeReportItem(
        rawReports.mingguan,
        'Ringkasan Mingguan (7 Hari Terakhir)',
        daftar_pesan.length
      ),
      bulanan: normalizeReportItem(
        rawReports.bulanan,
        'Ringkasan Bulanan (Bulan Berjalan)',
        daftar_pesan.length
      ),
      tahunan: normalizeReportItem(
        rawReports.tahunan,
        'Ringkasan Tahunan (Rekapitulasi Tahunan)',
        daftar_pesan.length
      ),
    },
  };
}

const SYSTEM_INSTRUCTION = `Anda adalah sistem asisten triase email resmi untuk Balai Pengelola Kereta Api Ringan Sumatera Selatan (BPKARSS) yang mengelola Layanan LRT Sumsel.
Tugas Anda adalah menganalisis semua pesan email masuk yang diberikan pengguna, mengelompokkannya, menentukan tingkat urgensi, menyusun draf respons resmi, dan menyusun rekap laporan mingguan, bulanan, serta tahunan dalam format JSON terstruktur.

WAJIB PATUHI ATURAN BISNIS BERIKUT SECARA KETAT:
1. ATURAN PRIVASI: Samarkan seluruh nama pengirim/warga, alamat email, nomor telepon/HP, dan NIK/nomor identitas yang muncul di seluruh field output (subjek_ringkas, ringkasan_aman, alasan_klasifikasi, draf_respons, laporan_periodik). Ganti nama warga dengan "[warga]", email dengan "[email-disamarkan]", nomor kontak dengan "[kontak-disamarkan]", dan NIK dengan "[identitas-disamarkan]". Pastikan 0 data pribadi asli muncul di output.
2. ATURAN PENANDAAN KONFIRMASI (perlu_konfirmasi): Tetapkan perlu_konfirmasi = true apabila pesan mengandung isu keselamatan/keamanan operasi, tuduhan atau rumor/hoaks gangguan layanan yang belum terverifikasi, permohonan data resmi/PPID, atau keluhan berulang yang memerlukan verifikasi unit teknis/pimpinan sebelum dibalas. Tetapkan false untuk apresiasi atau informasi umum rutin yang sudah jelas SOP-nya.
3. ATURAN PRIORITAS URGENSI (urgensi & skor_prioritas):
   - "Tinggi" (skor 75-100): Otomatis berlaku jika pesan menyebut insiden keselamatan penumpang/kereta, keterlambatan/gangguan perjalanan lebih dari 15 menit, kerusakan fasilitas kritis stasiun/kereta (pintu kereta, eskalator/lift, sistem tiket), keluhan belum ditangani lebih dari 1 hari (24 jam), atau laporan kehilangan barang berharga/penumpang terpisah.
   - "Sedang" (skor 40-74): Pertanyaan jadwal/tarif rombongan/keberangkatan, keluhan kenyamanan ringan (AC, antrean loket), permohonan data resmi PPID/riset, atau klarifikasi rumor non-darurat.
   - "Rendah" (skor 1-39): Apresiasi/pujian, saran pengembangan jangka panjang, atau informasi umum tidak mendesak.
4. ATURAN GAYA KELUARAN & LAPORAN PERIODIK:
   - Semua draf_respons wajib berbahasa Indonesia baku, sopan, empatik atas nama Humas Balai Pengelola Kereta Api Ringan Sumatera Selatan (LRT Sumsel), diawali teks "[DRAF UNTUK TINJAUAN STAF]", dan DILARANG menjanjikan kompensasi finansial, sanksi, atau keputusan teknis di luar kewenangan Humas.
   - Buat juga "laporan_periodik" yang merangkum pola tren untuk periode mingguan, bulanan, dan tahunan berdasarkan tanggal masuk serta isi seluruh email yang diproses.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    daftar_pesan: {
      type: Type.ARRAY,
      description: 'Daftar semua pesan email masuk yang telah dikelompokkan dan dianalisis.',
      items: {
        type: Type.OBJECT,
        properties: {
          id_pesan: { type: Type.STRING, description: 'ID pesan seperti EML-001' },
          tanggal_masuk: { type: Type.STRING, description: 'Tanggal masuk format YYYY-MM-DD' },
          subjek_ringkas: {
            type: Type.STRING,
            description: 'Ringkasan subjek maksimal 12 kata tanpa data pribadi warga',
          },
          kategori: {
            type: Type.STRING,
            description:
              'Salah satu dari: Keluhan Operasional, Fasilitas & Stasiun, Informasi & Tarif, Keselamatan & Keamanan, Apresiasi & Saran, Rumor & Klarifikasi',
          },
          urgensi: {
            type: Type.STRING,
            description: 'Salah satu dari: Tinggi, Sedang, Rendah',
          },
          skor_prioritas: {
            type: Type.INTEGER,
            description: 'Skor numerik 1-100 (Tinggi >= 75, Sedang 40-74, Rendah < 40)',
          },
          perlu_konfirmasi: {
            type: Type.BOOLEAN,
            description: 'True jika butuh konfirmasi unit teknis/pejabat sebelum dikirim',
          },
          ringkasan_aman: {
            type: Type.STRING,
            description: 'Ringkasan isi email dengan seluruh data pribadi tersamar',
          },
          alasan_klasifikasi: {
            type: Type.STRING,
            description: 'Penjelasan singkat alasan kategori, urgensi, dan status konfirmasi',
          },
          draf_respons: {
            type: Type.STRING,
            description: 'Draf balasan email resmi berbahasa Indonesia sopan diawali [DRAF UNTUK TINJAUAN STAF]',
          },
        },
        required: [
          'id_pesan',
          'tanggal_masuk',
          'subjek_ringkas',
          'kategori',
          'urgensi',
          'skor_prioritas',
          'perlu_konfirmasi',
          'ringkasan_aman',
          'alasan_klasifikasi',
          'draf_respons',
        ],
      },
    },
    laporan_periodik: {
      type: Type.OBJECT,
      properties: {
        mingguan: {
          type: Type.OBJECT,
          properties: {
            periode: { type: Type.STRING },
            total_pesan: { type: Type.INTEGER },
            top_kategori: { type: Type.STRING },
            ringkasan_eksekutif: { type: Type.STRING },
            rekomendasi_tindak_lanjut: { type: Type.STRING },
          },
          required: [
            'periode',
            'total_pesan',
            'top_kategori',
            'ringkasan_eksekutif',
            'rekomendasi_tindak_lanjut',
          ],
        },
        bulanan: {
          type: Type.OBJECT,
          properties: {
            periode: { type: Type.STRING },
            total_pesan: { type: Type.INTEGER },
            top_kategori: { type: Type.STRING },
            ringkasan_eksekutif: { type: Type.STRING },
            rekomendasi_tindak_lanjut: { type: Type.STRING },
          },
          required: [
            'periode',
            'total_pesan',
            'top_kategori',
            'ringkasan_eksekutif',
            'rekomendasi_tindak_lanjut',
          ],
        },
        tahunan: {
          type: Type.OBJECT,
          properties: {
            periode: { type: Type.STRING },
            total_pesan: { type: Type.INTEGER },
            top_kategori: { type: Type.STRING },
            ringkasan_eksekutif: { type: Type.STRING },
            rekomendasi_tindak_lanjut: { type: Type.STRING },
          },
          required: [
            'periode',
            'total_pesan',
            'top_kategori',
            'ringkasan_eksekutif',
            'rekomendasi_tindak_lanjut',
          ],
        },
      },
      required: ['mingguan', 'bulanan', 'tahunan'],
    },
  },
  required: ['daftar_pesan', 'laporan_periodik'],
};

export async function analyzeIncomingEmails(rawEmailsText: string): Promise<AnalysisResult> {
  const trimmed = rawEmailsText.trim();
  if (!trimmed) {
    throw new EmailAnalysisError(
      'Mohon masukkan minimal satu pesan email masuk atau klik "Muat Contoh Data" sebelum memproses.',
      400
    );
  }

  if (trimmed.length > 50000) {
    throw new EmailAnalysisError(
      'Ukuran teks email melebihi batas maksimal 50.000 karakter per sesi pemrosesan.',
      400
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('[PANTAU-LRT] GEMINI_API_KEY is not configured in environment secrets.');
    throw new EmailAnalysisError(
      'Layanan AI belum siap karena kunci akses server belum tersedia. Periksa pengaturan Secrets di panel AI Studio.',
      503
    );
  }

  const model = process.env.GEMINI_MODEL?.trim() || 'gemini-4-hydrogen';

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const supportsThinking =
    model.startsWith('gemini-4-') || model.startsWith('gemini-3');

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Analisis seluruh pesan email masuk berikut untuk Layanan LRT Sumsel. Pastikan jumlah item pada "daftar_pesan" sama persis dengan seluruh email yang masuk, dan samarkan semua data pribadi.\n\nDAFTAR EMAIL MASUK:\n${trimmed}`,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        ...(supportsThinking
          ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
          : {}),
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) {
      console.error('[PANTAU-LRT] Empty response.text from Gemini API.');
      throw new EmailAnalysisError(
        'Layanan AI mengembalikan respons kosong. Silakan coba lagi.',
        502
      );
    }

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawText);
    } catch (parseErr) {
      console.error('[PANTAU-LRT] Failed to parse Gemini JSON output:', parseErr, rawText);
      throw new EmailAnalysisError(
        'Format keluaran AI tidak valid. Silakan klik "Coba lagi".',
        502
      );
    }

    return validateAndNormalizeResult(parsedJson);
  } catch (err: unknown) {
    if (err instanceof EmailAnalysisError) {
      throw err;
    }

    const errorObj = err as { status?: number; code?: number; message?: string };
    const statusCode =
      typeof errorObj?.status === 'number'
        ? errorObj.status
        : typeof errorObj?.code === 'number'
          ? errorObj.code
          : 500;
    const rawMessage =
      errorObj?.message || (err instanceof Error ? err.message : String(err));

    console.error(
      `[PANTAU-LRT] Gemini API Error | status=${statusCode} | model=${model} | message=${rawMessage}`
    );

    if (statusCode === 400 || statusCode === 403) {
      throw new EmailAnalysisError(
        'Permintaan ke layanan AI ditolak atau kunci API tidak valid. Periksa pengaturan Secrets dan model yang digunakan.',
        statusCode
      );
    }
    if (statusCode === 429) {
      throw new EmailAnalysisError(
        'Layanan AI sedang menerima banyak permintaan (batas kuota tercapai). Mohon tunggu sejenak lalu klik "Coba lagi".',
        429
      );
    }
    if (statusCode === 404) {
      throw new EmailAnalysisError(
        `Model AI "${model}" tidak ditemukan. Periksa variabel GEMINI_MODEL pada server.`,
        404
      );
    }

    throw new EmailAnalysisError(
      'Terjadi kendala saat menghubungi layanan AI. Silakan klik "Coba lagi" beberapa saat lagi.',
      statusCode >= 400 && statusCode < 600 ? statusCode : 502
    );
  }
}
