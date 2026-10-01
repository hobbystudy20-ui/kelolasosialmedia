import { useEffect, useState, useMemo } from 'react';
import { Download, Users, Clock, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Booking, Revenue, OperationalExpense } from '@/lib/types';
import { PeriodKey, SERVICE_TYPES, getPeriodRange, formatCurrency, formatDate } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import PeriodSelector from '@/components/PeriodSelector';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanLayananPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    setLoading(true);
    const [b, r, e] = await Promise.all([
      supabase.from('bookings').select('*'),
      supabase.from('revenue').select('*'),
      supabase.from('operational_expenses').select('*'),
    ]);
    if (b.data) setBookings(b.data as Booking[]);
    if (r.data) setRevenue(r.data as Revenue[]);
    if (e.data) setExpenses(e.data as OperationalExpense[]);
    setLoading(false);
  }

  const range = getPeriodRange(period, customStart, customEnd);
  const filteredBookings = useMemo(() => bookings.filter(b => b.date >= range.start && b.date <= range.end), [bookings, range]);
  const filteredRev = useMemo(() => revenue.filter(r => r.date >= range.start && r.date <= range.end), [revenue, range]);
  const filteredExp = useMemo(() => expenses.filter(e => e.date >= range.start && e.date <= range.end), [expenses, range]);

  const stats = useMemo(() => {
    const total = filteredBookings.length;
    const completed = filteredBookings.filter(b => b.status === 'Selesai').length;
    const cancelled = filteredBookings.filter(b => b.status === 'Dibatalkan').length;
    const active = filteredBookings.filter(b => b.status === 'Sedang Berlangsung' || b.status === 'Dikonfirmasi' || b.status === 'Ditugaskan').length;
    const uniqueUsers = new Set(filteredBookings.map(b => b.user_id).filter(Boolean)).size;
    const totalRev = filteredRev.reduce((s, r) => s + r.total, 0);
    const totalExp = filteredExp.reduce((s, e) => s + e.amount, 0);
    return { total, completed, cancelled, active, uniqueUsers, totalRev, totalExp, net: totalRev - totalExp };
  }, [filteredBookings, filteredRev, filteredExp]);

  const byService = useMemo(() => SERVICE_TYPES.map(s => ({ label: s.slice(0, 8), value: filteredBookings.filter(b => b.service_type === s).length })).filter(d => d.value > 0), [filteredBookings]);

  function handleExport() {
    const rows: string[][] = [['Dampingcare - Laporan Layanan', '', '']];
    rows.push(['Periode', `${range.start} s/d ${range.end}`]);
    rows.push([]);
    rows.push(['Total Booking', String(stats.total), 'Completed', String(stats.completed), 'Cancelled', String(stats.cancelled), 'Active', String(stats.active)]);
    rows.push(['Users Served', String(stats.uniqueUsers), 'Revenue', formatCurrency(stats.totalRev), 'Expenses', formatCurrency(stats.totalExp), 'Net', formatCurrency(stats.net)]);
    rows.push([]);
    rows.push(['Booking ID', 'User', 'Layanan', 'Tanggal', 'Status', 'Total', 'Pembayaran']);
    filteredBookings.forEach(b => rows.push([b.booking_id_code, b.customer_name, b.service_type, b.date, b.status, formatCurrency(b.total_amount), b.payment_status]));
    exportCSV(`laporan-layanan-${range.start}-${range.end}.csv`, rows);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Layanan" subtitle="Laporan layanan Dampingcare" action={
        <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"><Download size={18} /> Export CSV</button>
      } />
      <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
      {filteredBookings.length === 0 && filteredRev.length === 0 ? (
        <EmptyState title="Belum ada data" message="Belum ada data untuk periode ini." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total Booking" value={stats.total} icon={Clock} color="pink" />
            <StatCard label="Completed" value={stats.completed} icon={Clock} color="green" />
            <StatCard label="Active" value={stats.active} icon={Clock} color="blue" />
            <StatCard label="Cancelled" value={stats.cancelled} icon={Clock} color="red" />
            <StatCard label="Users Served" value={stats.uniqueUsers} icon={Users} color="teal" />
            <StatCard label="Revenue" value={formatCurrency(stats.totalRev)} icon={TrendingUp} color="green" />
            <StatCard label="Expenses" value={formatCurrency(stats.totalExp)} icon={TrendingDown} color="amber" />
            <StatCard label="Net Income" value={formatCurrency(stats.net)} icon={Wallet} color={stats.net >= 0 ? 'green' : 'red'} />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Booking per Layanan</h3>
            {byService.length > 0 ? <BarChart data={byService} /> : <p className="text-sm text-gray-400 py-8 text-center">Belum ada data</p>}
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Booking ID</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Total</th>
              </tr></thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{b.booking_id_code || '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{b.customer_name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{b.service_type}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(b.date)}</td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${b.status === 'Selesai' ? 'bg-green-50 text-green-700' : b.status === 'Dibatalkan' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{b.status}</span></td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(b.total_amount)}</td>
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
