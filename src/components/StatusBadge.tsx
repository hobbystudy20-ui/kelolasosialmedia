interface StatusBadgeProps {
  status: string;
}

const STATUS_COLORS: Record<string, string> = {
  // Team
  'Aktif': 'bg-green-100 text-green-700',
  'Tidak Aktif': 'bg-gray-100 text-gray-600',
  // Planner
  'Ide': 'bg-blue-100 text-blue-700',
  'Draft': 'bg-amber-100 text-amber-700',
  'Revisi': 'bg-orange-100 text-orange-700',
  'Siap Posting': 'bg-teal-100 text-teal-700',
  'Terjadwal': 'bg-purple-100 text-purple-700',
  'Sudah Posting': 'bg-green-100 text-green-700',
  'Ditunda': 'bg-gray-100 text-gray-600',
  // Schedule
  'Belum Dibuat': 'bg-gray-100 text-gray-600',
  'Sudah Dibuat': 'bg-blue-100 text-blue-700',
  'Dijadwalkan': 'bg-purple-100 text-purple-700',
  'Batal': 'bg-red-100 text-red-700',
  // Booking
  'Menunggu Konfirmasi': 'bg-amber-100 text-amber-700',
  'Dikonfirmasi': 'bg-blue-100 text-blue-700',
  'Selesai': 'bg-green-100 text-green-700',
  'Dibatalkan': 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = STATUS_COLORS[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${color}`}>
      {status}
    </span>
  );
}
