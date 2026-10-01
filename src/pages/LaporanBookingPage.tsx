import { useEffect, useState, useMemo } from 'react';
import { Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/lib/types';
import { PeriodKey, BOOKING_STATUS, SERVICE_TYPES, getPeriodRange, formatDate } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import PeriodSelector from '@/components/PeriodSelector';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { CalendarCheck, CalendarX, Clock, PlayCircle } from 'lucide-react';

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanBookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => { fetchBookings(); }, []);
  async function fetchBookings() {
    setLoading(true);
    const { data } = await supabase.from('bookings').select('*').eq('archived', false);
    if (data) setBookings(data as Booking[]);
    setLoading(false);
  }

  const range = getPeriodRange(period, customStart, customEnd);
  const filtered = useMemo(() => bookings.filter(b => b.date >= range.start && b.date <= range.end), [bookings, range]);

  const stats = useMemo(() => ({
    total: filtered.length,
    completed: filtered.filter(b => b.status === 'Selesai').length,
    cancelled: filtered.filter(b => b.status === 'Dibatalkan').length,
    pending: filtered.filter(b => b.status === 'Menunggu Konfirmasi').length,
    ongoing: filtered.filter(b => b.status === 'Sedang Berlangsung').length,
  }), [filtered]);

  const byService = useMemo(() => SERVICE_TYPES.map(s => ({ label: s.slice(0, 8), value: filtered.filter(b => b.service_type === s).length })).filter(d => d.value > 0), [filtered]);
  const byStatus = useMemo(() => BOOKING_STATUS.map(s => ({ label: s.slice(0, 8), value: filtered.filter(b => b.status === s).length })), [filtered]);

  function handleExport() {
    const rows: string[][] = [['Dampingcare - Laporan Booking', '', '']];
    rows.push(['Periode', `${range.start} s/d ${range.end}`]);
    rows.push([]);
    rows.push(['Total', String(stats.total), 'Completed', String(stats.completed), 'Cancelled', String(stats.cancelled), 'Pending', String(stats.pending), 'Ongoing', String(stats.ongoing)]);
    rows.push([]);
    rows.push(['Booking ID', 'User', 'Layanan', 'Tanggal', 'Waktu', 'Status', 'Pembayaran']);
    filtered.forEach(b => rows.push([b.booking_id_code, b.customer_name, b.service_type, b.date, b.time, b.status, b.payment_status]));
    exportCSV(`laporan-booking-${range.start}-${range.end}.csv`, rows);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Booking" subtitle="Laporan booking Dampingcare" action={
        <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"><Download size={18} /> Export CSV</button>
      } />
      <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada data" message="Belum ada booking untuk periode ini." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <StatCard label="Total" value={stats.total} icon={CalendarCheck} color="pink" />
            <StatCard label="Selesai" value={stats.completed} icon={CalendarCheck} color="green" />
            <StatCard label="Berlangsung" value={stats.ongoing} icon={PlayCircle} color="amber" />
            <StatCard label="Pending" value={stats.pending} icon={Clock} color="blue" />
            <StatCard label="Dibatalkan" value={stats.cancelled} icon={CalendarX} color="red" />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-bold text-gray-800 mb-4">Booking per Layanan</h3>{byService.length > 0 ? <BarChart data={byService} /> : <p className="text-sm text-gray-400 py-8 text-center">Belum ada data</p>}</div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"><h3 className="text-sm font-bold text-gray-800 mb-4">Booking per Status</h3><BarChart data={byStatus} color="#3b82f6" /></div>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Booking ID</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pembayaran</th>
              </tr></thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.booking_id_code || '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{b.service_type}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.date)}</td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${b.status === 'Selesai' ? 'bg-green-50 text-green-700' : b.status === 'Dibatalkan' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{b.status}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${b.payment_status === 'Lunas' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{b.payment_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
