import { useEffect, useState, useMemo } from 'react';
import {
  CalendarDays, CalendarRange, CalendarClock, PlayCircle, Clock,
  Users, TrendingUp, TrendingDown, Wallet, AlertCircle, Activity, PiggyBank
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Booking, Revenue, OperationalExpense, ActivityLog, KasBulanan } from '@/lib/types';
import { todayISO, getWeekStart, getWeekEnd, getMonthStart, getMonthEnd, formatCurrency, getDayName } from '@/lib/constants';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function DashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [kas, setKas] = useState<KasBulanan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [b, r, e, a, k] = await Promise.all([
      supabase.from('bookings').select('*'),
      supabase.from('revenue').select('*'),
      supabase.from('operational_expenses').select('*'),
      supabase.from('activity_log').select('*').order('created_at', { ascending: false }).limit(10),
      supabase.from('kas_bulanan').select('*'),
    ]);
    if (b.data) setBookings(b.data as Booking[]);
    if (r.data) setRevenue(r.data as Revenue[]);
    if (e.data) setExpenses(e.data as OperationalExpense[]);
    if (a.data) setActivities(a.data as ActivityLog[]);
    if (k.data) setKas(k.data as KasBulanan[]);
    setLoading(false);
  }

  const stats = useMemo(() => {
    const today = todayISO();
    const wStart = getWeekStart();
    const wEnd = getWeekEnd();
    const mStart = getMonthStart();
    const mEnd = getMonthEnd();

    const todayBookings = bookings.filter(b => b.date === today);
    const weekBookings = bookings.filter(b => b.date >= wStart && b.date <= wEnd);
    const monthBookings = bookings.filter(b => b.date >= mStart && b.date <= mEnd);
    const ongoing = bookings.filter(b => b.status === 'Sedang Berlangsung');
    const pending = bookings.filter(b => b.status === 'Menunggu Konfirmasi');

    const totalRevenue = revenue.reduce((s, r) => s + (r.total || 0), 0);
    const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    const kasMasuk = kas.filter(k => k.type === 'Masuk').reduce((s, k) => s + k.amount, 0);
    const kasKeluar = kas.filter(k => k.type === 'Keluar').reduce((s, k) => s + k.amount, 0);
    const saldoKas = kasMasuk - kasKeluar;
    const uniqueUsers = new Set(bookings.map(b => b.user_id).filter(Boolean)).size;

    return {
      todayCount: todayBookings.length,
      weekCount: weekBookings.length,
      monthCount: monthBookings.length,
      ongoingCount: ongoing.length,
      pendingCount: pending.length,
      uniqueUsers,
      totalRevenue,
      totalExpenses,
      netIncome,
      saldoKas,
    };
  }, [bookings, revenue, expenses, kas]);

  const alerts = useMemo(() => {
    const items: { text: string; icon: typeof AlertCircle }[] = [];
    const pending = bookings.filter(b => b.status === 'Menunggu Konfirmasi');
    if (pending.length > 0) items.push({ text: `${pending.length} booking belum dikonfirmasi`, icon: AlertCircle });
    const noTeam = bookings.filter(b => b.status === 'Dikonfirmasi' && !b.team_member_id);
    if (noTeam.length > 0) items.push({ text: `${noTeam.length} booking belum memiliki pendamping`, icon: AlertCircle });
    const unpaid = bookings.filter(b => b.payment_status === 'Belum Bayar' && b.status !== 'Dibatalkan');
    if (unpaid.length > 0) items.push({ text: `${unpaid.length} pembayaran belum lunas`, icon: AlertCircle });
    const upcoming = bookings.filter(b => b.date === todayISO() && b.status === 'Ditugaskan');
    if (upcoming.length > 0) items.push({ text: `${upcoming.length} jadwal akan dimulai hari ini`, icon: AlertCircle });
    return items;
  }, [bookings]);

  const chartData = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0, 10);
      const count = bookings.filter(b => b.date === iso).length;
      days.push({ label: ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'][d.getDay()], value: count });
    }
    return days;
  }, [bookings]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 md:text-2xl">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan operasional Dampingcare</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-3">
        <StatCard label="Booking Hari Ini" value={stats.todayCount} icon={CalendarDays} color="pink" />
        <StatCard label="Booking Minggu Ini" value={stats.weekCount} icon={CalendarRange} color="blue" />
        <StatCard label="Booking Bulan Ini" value={stats.monthCount} icon={CalendarClock} color="teal" />
        <StatCard label="Sedang Berlangsung" value={stats.ongoingCount} icon={PlayCircle} color="amber" />
        <StatCard label="Menunggu Konfirmasi" value={stats.pendingCount} icon={Clock} color="red" />
        <StatCard label="Total User Dilayani" value={stats.uniqueUsers} icon={Users} color="blue" />
        <StatCard label="Total Pendapatan" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} color="green" />
        <StatCard label="Total Biaya Operasional" value={formatCurrency(stats.totalExpenses)} icon={TrendingDown} color="amber" />
        <StatCard label="Pendapatan Bersih" value={formatCurrency(stats.netIncome)} icon={Wallet} color={stats.netIncome >= 0 ? 'green' : 'red'} />
        <StatCard label="Saldo Kas" value={formatCurrency(stats.saldoKas)} icon={PiggyBank} color={stats.saldoKas >= 0 ? 'teal' : 'red'} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Booking 7 Hari Terakhir</h3>
          <BarChart data={chartData} />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
            <AlertCircle size={16} className="text-amber-500" />
            Perlu Ditindaklanjuti
          </h3>
          {alerts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">Tidak ada peringatan. Semua aman!</p>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-lg bg-amber-50 px-3 py-2.5">
                    <Icon size={16} className="flex-shrink-0 text-amber-500" />
                    <span className="text-sm text-gray-700">{a.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Activity size={16} className="text-[#FB5EA8]" />
          Aktivitas Terbaru
        </h3>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Belum ada aktivitas tercatat.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#FB5EA8]" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-700">{a.activity}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {getDayName(a.date)}, {a.date} {a.time && `• ${a.time}`} • {a.actor}
                  </p>
                </div>
                <span className="flex-shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                  {a.module}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
