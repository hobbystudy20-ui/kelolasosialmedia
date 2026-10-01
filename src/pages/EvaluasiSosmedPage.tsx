import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { SosmedMetric } from '@/lib/types';
import { PeriodKey, SOSMED_PLATFORMS, getPeriodRange, formatCurrency } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import PeriodSelector from '@/components/PeriodSelector';
import StatCard from '@/components/StatCard';
import Funnel from '@/components/Funnel';
import BarChart from '@/components/BarChart';
import Select from '@/components/Select';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import { Users, Eye, Heart, MessageCircle, Share2, Bookmark, MousePointerClick, Inbox, CalendarCheck, TrendingUp, BarChart3 } from 'lucide-react';

export default function EvaluasiSosmedPage() {
  const [metrics, setMetrics] = useState<SosmedMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('today');
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
    const s = { followers: 0, followers_growth: 0, reach: 0, impressions: 0, views: 0, likes: 0, comments: 0, shares: 0, saves: 0, profile_visits: 0, link_clicks: 0, dm_inquiries: 0, service_inquiries: 0, bookings_generated: 0, content_count: 0 };
    for (const m of filtered) {
      s.followers = Math.max(s.followers, m.followers);
      s.followers_growth += m.followers_growth; s.reach += m.reach; s.impressions += m.impressions;
      s.views += m.views; s.likes += m.likes; s.comments += m.comments; s.shares += m.shares;
      s.saves += m.saves; s.profile_visits += m.profile_visits; s.link_clicks += m.link_clicks;
      s.dm_inquiries += m.dm_inquiries; s.service_inquiries += m.service_inquiries;
      s.bookings_generated += m.bookings_generated; s.content_count += 1;
    }
    return s;
  }, [filtered]);

  const funnelSteps = [
    { label: 'Content Posted', value: sums.content_count },
    { label: 'Views / Reach', value: sums.views + sums.reach },
    { label: 'Engagement', value: sums.likes + sums.comments + sums.shares + sums.saves },
    { label: 'Profile Visits', value: sums.profile_visits },
    { label: 'DM', value: sums.dm_inquiries },
    { label: 'Inquiry', value: sums.service_inquiries },
    { label: 'Booking', value: sums.bookings_generated },
  ];

  const trendData = useMemo(() => {
    const dates = [...new Set(filtered.map(m => m.date))].sort().slice(-7);
    return dates.map(d => {
      const dayItems = filtered.filter(m => m.date === d);
      const label = new Date(d + 'T00:00:00');
      return { label: ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][label.getDay()], value: dayItems.reduce((s, m) => s + m.reach, 0) };
    });
  }, [filtered]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Evaluasi Sosmed" subtitle="Analisis performa media sosial Dampingcare" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
        <Select value={filterPlatform} onChange={setFilterPlatform} options={SOSMED_PLATFORMS as readonly string[]} placeholder="Semua Platform" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Belum ada data untuk periode ini" message="Pilih periode lain atau tambahkan data metrics." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Followers" value={sums.followers.toLocaleString('id-ID')} icon={Users} color="pink" subtitle={`+${sums.followers_growth} growth`} />
            <StatCard label="Reach" value={sums.reach.toLocaleString('id-ID')} icon={Eye} color="blue" />
            <StatCard label="Views" value={sums.views.toLocaleString('id-ID')} icon={Eye} color="teal" />
            <StatCard label="Likes" value={sums.likes.toLocaleString('id-ID')} icon={Heart} color="red" />
            <StatCard label="Comments" value={sums.comments.toLocaleString('id-ID')} icon={MessageCircle} color="blue" />
            <StatCard label="Shares" value={sums.shares.toLocaleString('id-ID')} icon={Share2} color="teal" />
            <StatCard label="Saves" value={sums.saves.toLocaleString('id-ID')} icon={Bookmark} color="amber" />
            <StatCard label="Profile Visits" value={sums.profile_visits.toLocaleString('id-ID')} icon={MousePointerClick} color="pink" />
            <StatCard label="Link Clicks" value={sums.link_clicks.toLocaleString('id-ID')} icon={MousePointerClick} color="blue" />
            <StatCard label="DM Masuk" value={sums.dm_inquiries.toLocaleString('id-ID')} icon={Inbox} color="amber" />
            <StatCard label="Inquiry Layanan" value={sums.service_inquiries.toLocaleString('id-ID')} icon={Inbox} color="teal" />
            <StatCard label="Booking dari Sosmed" value={sums.bookings_generated.toLocaleString('id-ID')} icon={CalendarCheck} color="green" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#FB5EA8]" />Reach Trend</h3>
              {trendData.length > 0 ? <BarChart data={trendData} color="#3b82f6" /> : <p className="text-sm text-gray-400 py-8 text-center">Data tidak cukup</p>}
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-[#FB5EA8]" />Sosmed Funnel</h3>
              <Funnel steps={funnelSteps} />
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Top Performing Content</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-sm">
                <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                  <th className="px-3 py-2">Content</th><th className="px-3 py-2">Platform</th><th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Views</th><th className="px-3 py-2">Reach</th><th className="px-3 py-2">Likes</th><th className="px-3 py-2">Engagement</th><th className="px-3 py-2">DM</th><th className="px-3 py-2">Booking</th>
                </tr></thead>
                <tbody>
                  {[...filtered].sort((a, b) => (b.views + b.reach + b.likes) - (a.views + a.reach + a.likes)).slice(0, 10).map(m => (
                    <tr key={m.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-3 py-2.5 font-medium text-gray-900 truncate max-w-[200px]">{m.content_title || '-'}</td>
                      <td className="px-3 py-2.5 text-gray-600">{m.platform}</td>
                      <td className="px-3 py-2.5 text-gray-500 text-xs">{m.date}</td>
                      <td className="px-3 py-2.5 text-gray-700">{m.views.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2.5 text-gray-700">{m.reach.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-2.5 text-gray-700">{m.likes}</td>
                      <td className="px-3 py-2.5 text-gray-700">{m.likes + m.comments + m.shares + m.saves}</td>
                      <td className="px-3 py-2.5 text-gray-700">{m.dm_inquiries}</td>
                      <td className="px-3 py-2.5 text-gray-700">{m.bookings_generated}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
