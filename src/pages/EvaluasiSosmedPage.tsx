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
import { Users, Eye, Heart, MessageCircle, Share2, Bookmark, MousePointerClick, Inbox, CalendarCheck, TrendingUp, BarChart3, Plus, Trash2 } from 'lucide-react';
import Modal from '@/components/Modal';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';
import { todayISO } from '@/lib/constants';

interface FormData {
  date: string;
  platform: string;
  content_title: string;
  content_type: string;
  followers: string;
  followers_growth: string;
  reach: string;
  impressions: string;
  views: string;
  likes: string;
  comments: string;
  shares: string;
  saves: string;
  profile_visits: string;
  link_clicks: string;
  dm_inquiries: string;
  service_inquiries: string;
  bookings_generated: string;
  notes: string;
}

const emptyForm: FormData = {
  date: todayISO(), platform: 'Instagram', content_title: '', content_type: 'Feed',
  followers: '', followers_growth: '', reach: '', impressions: '', views: '',
  likes: '', comments: '', shares: '', saves: '', profile_visits: '',
  link_clicks: '', dm_inquiries: '', service_inquiries: '', bookings_generated: '', notes: '',
};

export default function EvaluasiSosmedPage() {
  const [metrics, setMetrics] = useState<SosmedMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchMetrics(); }, []);
  async function fetchMetrics() {
    setLoading(true);
    const { data } = await supabase.from('sosmed_metrics').select('*').order('date', { ascending: false });
    if (data) setMetrics(data as SosmedMetric[]);
    setLoading(false);
  }

  function openAdd() { setForm(emptyForm); setModalOpen(true); }

  async function handleSave() {
    if (!form.date.trim() || !form.content_title.trim()) return;
    setSaving(true);
    const payload = {
      ...form,
      followers: parseInt(form.followers) || 0,
      followers_growth: parseInt(form.followers_growth) || 0,
      reach: parseInt(form.reach) || 0,
      impressions: parseInt(form.impressions) || 0,
      views: parseInt(form.views) || 0,
      likes: parseInt(form.likes) || 0,
      comments: parseInt(form.comments) || 0,
      shares: parseInt(form.shares) || 0,
      saves: parseInt(form.saves) || 0,
      profile_visits: parseInt(form.profile_visits) || 0,
      link_clicks: parseInt(form.link_clicks) || 0,
      dm_inquiries: parseInt(form.dm_inquiries) || 0,
      service_inquiries: parseInt(form.service_inquiries) || 0,
      bookings_generated: parseInt(form.bookings_generated) || 0,
    };
    await supabase.from('sosmed_metrics').insert(payload);
    setSaving(false); setModalOpen(false); fetchMetrics();
  }

  function handleDelete(m: SosmedMetric) {
    confirm(`Yakin ingin menghapus data metrik "${m.content_title}"? Data yang dihapus tidak dapat dikembalikan.`, async () => {
      await supabase.from('sosmed_metrics').delete().eq('id', m.id);
      fetchMetrics();
    });
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
      <PageHeader title="Evaluasi Sosmed" subtitle="Analisis performa media sosial Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Data</button>
      } />
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
                  <th className="px-3 py-2">Content</th><th className="px-3 py-2">Platform</th><th className="px-3 py-2">Tanggal</th><th className="px-3 py-2">Views</th><th className="px-3 py-2">Reach</th><th className="px-3 py-2">Likes</th><th className="px-3 py-2">Engagement</th><th className="px-3 py-2">DM</th><th className="px-3 py-2">Booking</th><th className="px-3 py-2 text-right">Aksi</th>
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
                      <td className="px-3 py-2.5"><div className="flex justify-end"><button onClick={() => handleDelete(m)} className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors" title="Hapus"><Trash2 size={16} /></button></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal open={modalOpen} title="Tambah Data Metrik Sosmed" onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.date.trim() || !form.content_title.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal" required><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Platform" required><Select value={form.platform} onChange={v => setForm({ ...form, platform: v })} options={SOSMED_PLATFORMS as readonly string[]} className="w-full" /></Field>
          </div>
          <Field label="Judul Konten" required><input value={form.content_title} onChange={e => setForm({ ...form, content_title: e.target.value })} placeholder="Judul konten..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <Field label="Jenis Konten"><input value={form.content_type} onChange={e => setForm({ ...form, content_type: e.target.value })} placeholder="Feed, Reels, Story..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Followers"><input type="number" value={form.followers} onChange={e => setForm({ ...form, followers: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Growth"><input type="number" value={form.followers_growth} onChange={e => setForm({ ...form, followers_growth: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Reach"><input type="number" value={form.reach} onChange={e => setForm({ ...form, reach: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Impressions"><input type="number" value={form.impressions} onChange={e => setForm({ ...form, impressions: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Views"><input type="number" value={form.views} onChange={e => setForm({ ...form, views: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Likes"><input type="number" value={form.likes} onChange={e => setForm({ ...form, likes: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Comments"><input type="number" value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Shares"><input type="number" value={form.shares} onChange={e => setForm({ ...form, shares: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Saves"><input type="number" value={form.saves} onChange={e => setForm({ ...form, saves: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Visits"><input type="number" value={form.profile_visits} onChange={e => setForm({ ...form, profile_visits: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Link Clicks"><input type="number" value={form.link_clicks} onChange={e => setForm({ ...form, link_clicks: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="DM"><input type="number" value={form.dm_inquiries} onChange={e => setForm({ ...form, dm_inquiries: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Inquiries"><input type="number" value={form.service_inquiries} onChange={e => setForm({ ...form, service_inquiries: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Bookings"><input type="number" value={form.bookings_generated} onChange={e => setForm({ ...form, bookings_generated: e.target.value })} placeholder="0" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          </div>
          <Field label="Catatan"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Catatan..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8] resize-none" /></Field>
        </div>
      </Modal>

      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} confirmLabel="Ya, Hapus" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
