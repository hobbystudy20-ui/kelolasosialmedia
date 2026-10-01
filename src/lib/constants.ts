export const CITIES = [
  'Solo',
  'Sukoharjo',
  'Karanganyar',
  'Boyolali',
  'Sragen',
  'Klaten',
  'Yogyakarta',
] as const;

export const PLATFORMS = [
  'Instagram',
  'TikTok',
  'Threads',
  'WhatsApp',
  'Facebook',
] as const;

export const CONTENT_TYPES = [
  'Feed',
  'Reels',
  'TikTok',
  'Story',
  'Carousel',
  'Educational',
  'Promotional',
  'Testimonial',
  'Informational',
] as const;

export const PLANNER_STATUS = [
  'Ide',
  'Draft',
  'Review',
  'Siap Posting',
  'Terjadwal',
  'Sudah Diposting',
  'Archived',
] as const;

export const SCHEDULE_STATUS = [
  'Belum Dibuat',
  'Sudah Dibuat',
  'Revisi',
  'Dijadwalkan',
  'Sudah Posting',
  'Batal',
] as const;

export const CAPTION_CATEGORIES = [
  'Promotional',
  'Educational',
  'Testimonial',
  'Service',
  'Recruitment',
  'Branding',
  'Informational',
  'Other',
] as const;

export const TEAM_STATUS = ['Aktif', 'Tidak Aktif'] as const;

export const TEAM_ROLES = [
  'Admin',
  'Sosmed Manager',
  'Perawat',
  'Ners',
  'Caregiver',
  'Pendamping',
  'Driver',
  'Jastip',
  'Anjem',
] as const;

export const SERVICE_TYPES = [
  'Pendampingan Pasien di RS',
  'Pendampingan Non-Pasien',
  'Antar Jemput Motor',
  'Antar Jemput Mobil',
  'Jastip Mobil',
  'Jastip Motor',
] as const;

export const SERVICE_CATEGORIES = [
  'Pendampingan Pasien',
  'Pendampingan Non-Pasien',
  'Jastip',
  'Anjem',
  'Pendampingan Kontrol',
  'Pendampingan Rawat Inap',
  'Pendampingan Rawat Jalan',
  'Pasca Rawat Inap',
  'Minimal Care',
  'Other',
] as const;

export const BOOKING_STATUS = [
  'Menunggu Konfirmasi',
  'Dikonfirmasi',
  'Ditugaskan',
  'Sedang Berlangsung',
  'Selesai',
  'Dibatalkan',
] as const;

export const PAYMENT_STATUS = [
  'Belum Bayar',
  'DP',
  'Lunas',
  'Refund',
] as const;

export const PAYMENT_METHODS = [
  'Cash',
  'Transfer',
  'QRIS',
  'E-wallet',
  'Other',
] as const;

export const EXPENSE_CATEGORIES = [
  'Transportasi',
  'BBM',
  'Parkir',
  'Tol',
  'Makan',
  'ATK',
  'Printing',
  'Internet',
  'Pulsa',
  'Advertising',
  'Social Media',
  'Website / Domain',
  'Software / Subscription',
  'Perlengkapan Caregiver',
  'Administrasi',
  'Kas Tim',
  'Inventaris',
  'Lainnya',
] as const;

export const TRANSPORT_TYPES = [
  'Motor',
  'Mobil',
  'Online Transport',
  'Public Transport',
  'Other',
] as const;

export const INVENTORY_CONDITIONS = [
  'Baik',
  'Perlu Perbaikan',
  'Rusak',
  'Hilang',
] as const;

export const DOCUMENT_CATEGORIES = [
  'SOP',
  'Consent',
  'Agreement',
  'Internal Documents',
  'Templates',
  'Operational Documents',
  'Other',
] as const;

export const USER_STATUS = ['Aktif', 'Tidak Aktif'] as const;

export const SERVICE_STATUS = ['Aktif', 'Nonaktif'] as const;

export const AREA_STATUS = ['Aktif', 'Nonaktif'] as const;

export const SOSMED_PLATFORMS = [
  'Instagram',
  'TikTok',
  'Facebook',
  'Other',
] as const;

export const FEEDBACK_TYPES = [
  'Positif',
  'Saran',
  'Komplain',
] as const;

export type PeriodKey = 'today' | 'week' | 'month' | 'custom';

export function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return '';
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

export function todayISO(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export function formatDate(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatCurrency(n: number): string {
  return 'Rp ' + Math.round(n || 0).toLocaleString('id-ID');
}

export function getWeekStart(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const off = monday.getTimezoneOffset();
  const local = new Date(monday.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export function getWeekEnd(): string {
  const start = new Date(getWeekStart() + 'T00:00:00');
  start.setDate(start.getDate() + 6);
  const off = start.getTimezoneOffset();
  const local = new Date(start.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}

export function getMonthStart(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 8) + '01';
}

export function getMonthEnd(): string {
  const d = new Date();
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 8) + String(lastDay).padStart(2, '0');
}

export function getPeriodRange(period: PeriodKey, customStart?: string, customEnd?: string): { start: string; end: string } {
  switch (period) {
    case 'today':
      return { start: todayISO(), end: todayISO() };
    case 'week':
      return { start: getWeekStart(), end: getWeekEnd() };
    case 'month':
      return { start: getMonthStart(), end: getMonthEnd() };
    case 'custom':
      return { start: customStart || todayISO(), end: customEnd || todayISO() };
  }
}

export function generateBookingId(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `DC-${ymd}-${seq}`;
}

export function generateId(prefix: string): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `${prefix}-${ymd}-${seq}`;
}
