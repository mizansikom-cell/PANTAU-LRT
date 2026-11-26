export type UrgencyLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export type EmailCategory =
  | 'Keluhan Operasional'
  | 'Fasilitas & Stasiun'
  | 'Informasi & Tarif'
  | 'Keselamatan & Keamanan'
  | 'Apresiasi & Saran'
  | 'Rumor & Klarifikasi';

export interface TriagedEmail {
  id_pesan: string;
  tanggal_masuk: string;
  subjek_ringkas: string;
  kategori: EmailCategory;
  urgensi: UrgencyLevel;
  skor_prioritas: number;
  perlu_konfirmasi: boolean;
  ringkasan_aman: string;
  alasan_klasifikasi: string;
  draf_respons: string;
}

export interface PeriodicReportItem {
  periode: string;
  total_pesan: number;
  top_kategori: string;
  ringkasan_eksekutif: string;
  rekomendasi_tindak_lanjut: string;
}

export interface PeriodicReports {
  mingguan: PeriodicReportItem;
  bulanan: PeriodicReportItem;
  tahunan: PeriodicReportItem;
}

export interface AnalysisResult {
  daftar_pesan: TriagedEmail[];
  laporan_periodik: PeriodicReports;
}
