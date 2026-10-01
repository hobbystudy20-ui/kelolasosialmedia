import { useEffect, useState, useMemo } from 'react';
import { Download, Users, Eye, Heart, MessageCircle, Share2, Bookmark, MousePointerClick, Inbox, CalendarCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SosmedMetric } from '@/lib/types';
import { PeriodKey, SOSMED_PLATFORMS, getPeriodRange } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import PeriodSelector from '@/components/PeriodSelector';
import StatCard from '@/components/StatCard';
import BarChart from '@/components/BarChart';
import Select from '@/components/Select';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';

function exportCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function LaporanSosmedPage() {
  const [metrics, setMetrics] = useState<SosmedMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');

  useEffect(() => { fetchMetrics(); }, []);
  async function fetchMetrics() {
    setLoading(true);
    const { data } = await supabase.from('sosmed_metrics').select('*').order('date', { ascending: false });
    if (data) setMetrics(data as SosmedMetric[]);
    setLoading(false);
  }

  const range = getPeriodRange(period, customStart, customEnd);
  const filtered = useMemo(() => metrics.filter(m => {
    const md = m.date >= range.start && m.date <= range.end;
    const mp = !filterPlatform || m.platform === filterPlatform;
    return md && mp;
  }), [metrics, range, filterPlatform]);

  const sums = useMemo(() => {
    const s = { followers: 0, followers_growth: 0, reach: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, profile_visits: 0, dm: 0, inquiries: 0, bookings: 0, content: 0 };
    for (const m of filtered) {
      s.followers = Math.max(s.followers, m.followers); s.followers_growth += m.followers_growth;
      s.reach += m.reach; s.views += m.views; s.likes += m.likes; s.comments += m.comments;
      s.shares += m.shares; s.saves += m.saves; s.profile_visits += m.profile_visits;
      s.dm += m.dm_inquiries; s.inquiries += m.service_inquiries; s.bookings += m.bookings_generated; s.content += 1;
    }
    return s;
  }, [filtered]);

  const trendData = useMemo(() => {
    const dates = [...new Set(filtered.map(m => m.date))].sort().slice(-7);
    return dates.map(d => {
      const dayItems = filtered.filter(m => m.date === d);
      const dt = new Date(d + 'T00:00:00');
      return { label: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][dt.getDay()], value: dayItems.reduce((s, m) => s + m.reach, 0) };
    });
  }, [filtered]);

  function handleExport() {
    const rows: string[][] = [['Dampingcare - Laporan Sosmed', '', '']];
    rows.push(['Periode', `${range.start} s/d ${range.end}`]);
    rows.push([]);
    rows.push(['Total Content', String(sums.content), 'Followers', String(sums.followers), 'Growth', String(sums.followers_growth)]);
    rows.push(['Reach', String(sums.reach), 'Views', String(sums.views), 'Likes', String(sums.likes)]);
    rows.push(['Comments', String(sums.comments), 'Shares', String(sums.shares), 'Saves', String(sums.saves)]);
    rows.push(['Profile Visits', String(sums.profile_visits), 'DM', String(sums.dm), 'Inquiries', String(sums.inquiries)]);
    rows.push(['Bookings', String(sums.bookings)]);
    rows.push([]);
    rows.push(['Content', 'Platform', 'Tanggal', 'Views', 'Reach', 'Likes', 'Comments', 'Shares', 'Saves', 'DM', 'Bookings']);
    filtered.forEach(m => rows.push([m.content_title, m.platform, m.date, String(m.views), String(m.reach), String(m.likes), String(m.comments), String(m.shares), String(m.saves), String(m.dm_inquiries), String(m.bookings_generated)]));
    exportCSV(`laporan-sosmed-${range.start}-${range.end}.csv`, rows);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Laporan Sosmed" subtitle="Laporan performa media sosial" action={
        <button onClick={handleExport} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"><Download size={18} /> Export CSV</button>
      } />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
        <Select value={filterPlatform} onChange={setFilterPlatform} options={SOSMED_PLATFORMS as readonly string[]} placeholder="Semua Platform" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada data" message="Belum ada data sosmed untuk periode ini." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Content Posted" value={sums.content} icon={CalendarCheck} color="pink" />
            <StatCard label="Followers" value={sums.followers.toLocaleString('id-ID')} icon={Users} color="blue" subtitle={`+${sums.followers_growth}`} />
            <StatCard label="Reach" value={sums.reach.toLocaleString('id-ID')} icon={Eye} color="teal" />
            <StatCard label="Views" value={sums.views.toLocaleString('id-ID')} icon={Eye} color="blue" />
            <StatCard label="Likes" value={sums.likes} icon={Heart} color="red" />
            <StatCard label="Comments" value={sums.comments} icon={MessageCircle} color="blue" />
            <StatCard label="Shares" value={sums.shares} icon={Share2} color="teal" />
            <StatCard label="Saves" value={sums.saves} icon={Bookmark} color="amber" />
            <StatCard label="Profile Visits" value={sums.profile_visits} icon={MousePointerClick} color="pink" />
            <StatCard label="DM Inquiries" value={sums.dm} icon={Inbox} color="amber" />
            <StatCard label="Service Inquiries" value={sums.inquiries} icon={Inbox} color="teal" />
            <StatCard label="Bookings" value={sums.bookings} icon={CalendarCheck} color="green" />
          </div>
          {trendData.length > 0 && (
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Reach Trend</h3>
              <BarChart data={trendData} color="#3b82f6" />
            </div>
          )}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Content</th><th className="px-4 py-3">Platform</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Views</th><th className="px-4 py-3">Reach</th><th className="px-4 py-3">Likes</th><th className="px-4 py-3">Engagement</th><th className="px-4 py-3">DM</th><th className="px-4 py-3">Booking</th>
              </tr></thead>
              <tbody>
                {filtered.map(m => (
                  <tr key={m.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-[200px]">{m.content_title || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{m.platform}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{m.date}</td>
                    <td className="px-4 py-3 text-gray-700">{m.views.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-gray-700">{m.reach.toLocaleString('id-ID')}</td>
                    <td className="px-4 py-3 text-gray-700">{m.likes}</td>
                    <td className="px-4 py-3 text-gray-700">{m.likes + m.comments + m.shares + m.saves}</td>
                    <td className="px-4 py-3 text-gray-700">{m.dm_inquiries}</td>
                    <td className="px-4 py-3 text-gray-700">{m.bookings_generated}</td>
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
