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
  'Foto',
  'Video',
  'Reels',
  'TikTok Video',
  'Story',
  'Carousel',
  'Text',
  'Lainnya',
] as const;

export const PLANNER_STATUS = [
  'Ide',
  'Draft',
  'Revisi',
  'Siap Posting',
  'Terjadwal',
  'Sudah Posting',
  'Ditunda',
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
  'Edukasi',
  'Promosi Layanan',
  'Informasi Layanan',
  'Branding',
  'Testimoni',
  'Recruitment',
  'Tips',
  'Hari Besar',
  'Informasi Dampingcare',
  'Konten Kota',
  'Engagement',
  'Lainnya',
] as const;

export const TEAM_STATUS = ['Aktif', 'Tidak Aktif'] as const;

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
