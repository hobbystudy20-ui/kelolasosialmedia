import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Booking, Revenue, OperationalExpense } from '@/lib/types';
import { PeriodKey, BOOKING_STATUS, SERVICE_CATEGORIES, getPeriodRange, formatCurrency, formatDate } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import PeriodSelector from '@/components/PeriodSelector';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { CalendarCheck, PlayCircle, Clock, Users, Wallet, TrendingUp, TrendingDown, Activity } from 'lucide-react';

export default function EvaluasiLayananPage() {
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
    const ongoing = filteredBookings.filter(b => b.status === 'Sedang Berlangsung').length;
    const pending = filteredBookings.filter(b => b.status === 'Menunggu Konfirmasi').length;
    const cancelled = filteredBookings.filter(b => b.status === 'Dibatalkan').length;
    const uniqueUsers = new Set(filteredBookings.map(b => b.user_id).filter(Boolean)).size;
    const totalRev = filteredRev.reduce((s, r) => s + r.total, 0);
    const totalExp = filteredExp.reduce((s, e) => s + e.amount, 0);
    const net = totalRev - totalExp;
    return { total, completed, ongoing, pending, cancelled, uniqueUsers, totalRev, totalExp, net };
  }, [filteredBookings, filteredRev, filteredExp]);

  const serviceBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const b of filteredBookings) { const cat = b.service_type || 'Other'; map[cat] = (map[cat] || 0) + 1; }
    return Object.entries(map).map(([label, value]) => ({ label: label.length > 10 ? label.slice(0, 10) : label, value }));
  }, [filteredBookings]);

  const statusBreakdown = useMemo(() => BOOKING_STATUS.map(s => ({
    label: s, value: filteredBookings.filter(b => b.status === s).length,
  })), [filteredBookings]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Evaluasi Layanan" subtitle="Analisis performa layanan Dampingcare" />
      <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />

      {filteredBookings.length === 0 && filteredRev.length === 0 ? (
        <EmptyState title="Belum ada data untuk periode ini" message="Pilih periode lain untuk melihat data." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total Booking" value={stats.total} icon={CalendarCheck} color="pink" />
            <StatCard label="Selesai" value={stats.completed} icon={CalendarCheck} color="green" />
            <StatCard label="Berlangsung" value={stats.ongoing} icon={PlayCircle} color="amber" />
            <StatCard label="Menunggu" value={stats.pending} icon={Clock} color="blue" />
            <StatCard label="Dibatalkan" value={stats.cancelled} icon={Clock} color="red" />
            <StatCard label="User Dilayani" value={stats.uniqueUsers} icon={Users} color="teal" />
            <StatCard label="Pendapatan" value={formatCurrency(stats.totalRev)} icon={TrendingUp} color="green" />
            <StatCard label="Biaya" value={formatCurrency(stats.totalExp)} icon={TrendingDown} color="amber" />
            <StatCard label="Pendapatan Bersih" value={formatCurrency(stats.net)} icon={Wallet} color={stats.net >= 0 ? 'green' : 'red'} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><Activity size={16} className="text-[#FB5EA8]" />Booking per Layanan</h3>
              {serviceBreakdown.length > 0 ? <BarChart data={serviceBreakdown} /> : <p className="text-sm text-gray-400 py-8 text-center">Belum ada data</p>}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Booking per Status</h3>
              {statusBreakdown.length > 0 ? <BarChart data={statusBreakdown.map(s => ({ label: s.label.slice(0, 8), value: s.value }))} color="#3b82f6" /> : <p className="text-sm text-gray-400 py-8 text-center">Belum ada data</p>}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Service Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                  <th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Total Booking</th><th className="px-4 py-3">Selesai</th><th className="px-4 py-3">Berlangsung</th><th className="px-4 py-3">Dibatalkan</th>
                </tr></thead>
                <tbody>
                  {SERVICE_CATEGORIES.map(cat => {
                    const catBookings = filteredBookings.filter(b => b.service_type?.includes(cat) || b.service_type === cat);
                    if (catBookings.length === 0) return null;
                    return (
                      <tr key={cat} className="border-b border-gray-50 last:border-0">
                        <td className="px-4 py-3 font-medium text-gray-900">{cat}</td>
                        <td className="px-4 py-3 text-gray-700">{catBookings.length}</td>
                        <td className="px-4 py-3 text-green-600">{catBookings.filter(b => b.status === 'Selesai').length}</td>
                        <td className="px-4 py-3 text-amber-600">{catBookings.filter(b => b.status === 'Sedang Berlangsung').length}</td>
                        <td className="px-4 py-3 text-red-600">{catBookings.filter(b => b.status === 'Dibatalkan').length}</td>
                      </tr>
                    );
                  })}
                  {filteredBookings.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Belum ada data</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
