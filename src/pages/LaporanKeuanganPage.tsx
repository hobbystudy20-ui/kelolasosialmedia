import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Revenue, OperationalExpense, Payment, KasBulanan } from '@/lib/types';
import { PeriodKey, getPeriodRange, formatCurrency, formatDate, todayISO } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import PeriodSelector from '@/components/PeriodSelector';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { TrendingUp, TrendingDown, Wallet, FileBarChart, Download, PiggyBank } from 'lucide-react';

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanKeuanganPage() {
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [kas, setKas] = useState<KasBulanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    setLoading(true);
    const [r, e, p, k] = await Promise.all([
      supabase.from('revenue').select('*'),
      supabase.from('operational_expenses').select('*'),
      supabase.from('payments').select('*'),
      supabase.from('kas_bulanan').select('*'),
    ]);
    if (r.data) setRevenue(r.data as Revenue[]);
    if (e.data) setExpenses(e.data as OperationalExpense[]);
    if (p.data) setPayments(p.data as Payment[]);
    if (k.data) setKas(k.data as KasBulanan[]);
    setLoading(false);
  }

  const range = getPeriodRange(period, customStart, customEnd);
  const filteredRev = useMemo(() => revenue.filter(r => r.date >= range.start && r.date <= range.end), [revenue, range]);
  const filteredExp = useMemo(() => expenses.filter(e => e.date >= range.start && e.date <= range.end), [expenses, range]);

  const filteredKas = useMemo(() => kas.filter(k => k.date >= range.start && k.date <= range.end), [kas, range]);
  const kasMasuk = filteredKas.filter(k => k.type === 'Masuk').reduce((s, k) => s + k.amount, 0);
  const kasKeluar = filteredKas.filter(k => k.type === 'Keluar').reduce((s, k) => s + k.amount, 0);
  const saldoKas = kasMasuk - kasKeluar;

  const totalRev = filteredRev.reduce((s, r) => s + (r.total || 0), 0);
  const totalExp = filteredExp.reduce((s, e) => s + (e.amount || 0), 0);
  const netIncome = totalRev - totalExp;
  const outstanding = payments.filter(p => p.payment_status !== 'Lunas').reduce((s, p) => s + p.remaining_balance, 0);

  const monthlyData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const ym = d.toISOString().slice(0, 7);
      const rev = revenue.filter(r => r.date.startsWith(ym)).reduce((s, r) => s + r.total, 0);
      months.push({ label: d.toLocaleDateString('id-ID', { month: 'short' }), value: rev });
    }
    return months;
  }, [revenue]);

  const expMonthlyData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      const ym = d.toISOString().slice(0, 7);
      const exp = expenses.filter(e => e.date.startsWith(ym)).reduce((s, e) => s + e.amount, 0);
      months.push({ label: d.toLocaleDateString('id-ID', { month: 'short' }), value: exp });
    }
    return months;
  }, [expenses]);

  function handleExport() {
    const rows: string[][] = [['Dampingcare - Laporan Keuangan', '', '']];
    rows.push(['Periode', `${range.start} s/d ${range.end}`, '']);
    rows.push(['Generated', todayISO(), '']);
    rows.push([]);
    rows.push(['Ringkasan']);
    rows.push(['Total Pendapatan', formatCurrency(totalRev)]);
    rows.push(['Total Biaya Operasional', formatCurrency(totalExp)]);
    rows.push(['Pendapatan Bersih', formatCurrency(netIncome)]);
    rows.push(['Outstanding Payments', formatCurrency(outstanding)]);
    rows.push(['Jumlah Transaksi', String(filteredRev.length)]);
    rows.push([]);
    rows.push(['Detail Pendapatan']);
    rows.push(['ID', 'Tanggal', 'Layanan', 'Total', 'Status']);
    filteredRev.forEach(r => rows.push([r.transaction_id, r.date, r.service, formatCurrency(r.total), r.payment_status]));
    rows.push([]);
    rows.push(['Detail Biaya Operasional']);
    rows.push(['ID', 'Tanggal', 'Kategori', 'Deskripsi', 'Jumlah']);
    filteredExp.forEach(e => rows.push([e.expense_id, e.date, e.category, e.description, formatCurrency(e.amount)]));
    exportCSV(`laporan-keuangan-${range.start}-${range.end}.csv`, rows);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Keuangan" subtitle="Laporan keuangan Dampingcare" action={
        <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"><Download size={18} /> Export CSV</button>
      } />
      <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Pendapatan" value={formatCurrency(totalRev)} icon={TrendingUp} color="green" />
        <StatCard label="Total Biaya" value={formatCurrency(totalExp)} icon={TrendingDown} color="red" />
        <StatCard label="Pendapatan Bersih" value={formatCurrency(netIncome)} icon={Wallet} color={netIncome >= 0 ? 'green' : 'red'} />
        <StatCard label="Outstanding" value={formatCurrency(outstanding)} icon={FileBarChart} color="amber" />
        <StatCard label="Kas Masuk" value={formatCurrency(kasMasuk)} icon={PiggyBank} color="teal" />
        <StatCard label="Saldo Kas" value={formatCurrency(saldoKas)} icon={Wallet} color={saldoKas >= 0 ? 'teal' : 'red'} />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Pendapatan per Bulan</h3>
          {monthlyData.some(d => d.value > 0) ? <BarChart data={monthlyData} color="#22c55e" /> : <EmptyState title="Belum ada data" message="Data pendapatan belum tersedia." />}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Biaya Operasional per Bulan</h3>
          {expMonthlyData.some(d => d.value > 0) ? <BarChart data={expMonthlyData} color="#f59e0b" /> : <EmptyState title="Belum ada data" message="Data biaya belum tersedia." />}
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Kas Bulanan</h3>
          {filteredKas.length > 0 ? (
            <div className="space-y-2">
              {filteredKas.map(k => (
                <div key={k.id} className="flex items-center justify-between border-b border-gray-50 pb-2 last:border-0">
                  <div>
                    <p className="text-sm text-gray-700">{k.description || '-'} ({k.person || '-'})</p>
                    <p className="text-xs text-gray-400">{formatDate(k.date)} • {k.month}</p>
                  </div>
                  <span className={`text-sm font-medium ${k.type === 'Masuk' ? 'text-green-600' : 'text-red-600'}`}>{k.type === 'Masuk' ? '+' : '-'}{formatCurrency(k.amount)}</span>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 py-8 text-center">Belum ada data kas</p>}
        </div>
      </div>
      {filteredRev.length === 0 && filteredExp.length === 0 && filteredKas.length === 0 ? (
        <EmptyState title="Belum ada data" message="Belum ada data untuk periode ini." />
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Detail Transaksi</h3>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Tipe</th><th className="px-3 py-2">Deskripsi</th><th className="px-3 py-2 text-right">Jumlah</th>
              </tr></thead>
              <tbody>
                {filteredRev.map(r => <tr key={`r${r.id}`} className="border-b border-gray-50"><td className="px-3 py-2.5 text-gray-600">{formatDate(r.date)}</td><td className="px-3 py-2.5"><span className="rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Pendapatan</span></td><td className="px-3 py-2.5 text-gray-700">{r.service}</td><td className="px-3 py-2.5 text-right font-medium text-green-600">{formatCurrency(r.total)}</td></tr>)}
                {filteredExp.map(e => <tr key={`e${e.id}`} className="border-b border-gray-50"><td className="px-3 py-2.5 text-gray-600">{formatDate(e.date)}</td><td className="px-3 py-2.5"><span className="rounded-md bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">Biaya</span></td><td className="px-3 py-2.5 text-gray-700">{e.category} - {e.description}</td><td className="px-3 py-2.5 text-right font-medium text-red-600">{formatCurrency(e.amount)}</td></tr>)}
                {filteredKas.map(k => <tr key={`k${k.id}`} className="border-b border-gray-50"><td className="px-3 py-2.5 text-gray-600">{formatDate(k.date)}</td><td className="px-3 py-2.5"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${k.type === 'Masuk' ? 'bg-teal-50 text-teal-700' : 'bg-orange-50 text-orange-700'}`}>Kas {k.type}</span></td><td className="px-3 py-2.5 text-gray-700">{k.description || '-'} ({k.person || '-'})</td><td className="px-3 py-2.5 text-right font-medium text-gray-900">{k.type === 'Masuk' ? '+' : '-'}{formatCurrency(k.amount)}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
