import { useEffect, useState, useMemo } from 'react';
import { Star, Plus, Search, ImageIcon, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Feedback } from '@/lib/types';
import { PeriodKey, FEEDBACK_TYPES, getPeriodRange, formatDate, todayISO, generateId } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import PeriodSelector from '@/components/PeriodSelector';
import StatCard from '@/components/StatCard';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';
import { MessageSquare, ThumbsUp, Lightbulb, AlertTriangle } from 'lucide-react';

interface FormData {
  feedback_id: string; user_name: string; service: string; team_member_name: string;
  rating: string; what_went_well: string; what_could_improve: string;
  suggestion: string; complaint: string; feedback_type: string; date: string;
  photo_url: string;
}
const emptyForm: FormData = {
  feedback_id: '', user_name: '', service: '', team_member_name: '', rating: '5',
  what_went_well: '', what_could_improve: '', suggestion: '', complaint: '',
  feedback_type: 'Positif', date: todayISO(), photo_url: '',
};

export default function EvaluasiKepuasanPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchFeedback(); }, []);
  async function fetchFeedback() {
    setLoading(true);
    const { data } = await supabase.from('feedback').select('*').order('date', { ascending: false });
    if (data) setFeedback(data as Feedback[]);
    setLoading(false);
  }

  const range = getPeriodRange(period, customStart, customEnd);
  const filtered = useMemo(() => feedback.filter(f => {
    const md = f.date >= range.start && f.date <= range.end;
    const ms = !search || f.user_name.toLowerCase().includes(search.toLowerCase()) || f.service.toLowerCase().includes(search.toLowerCase());
    return md && ms;
  }), [feedback, range, search]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const avgRating = total ? filtered.reduce((s, f) => s + f.rating, 0) / total : 0;
    const positive = filtered.filter(f => f.feedback_type === 'Positif').length;
    const suggestions = filtered.filter(f => f.feedback_type === 'Saran').length;
    const complaints = filtered.filter(f => f.feedback_type === 'Komplain').length;
    return { total, avgRating, positive, suggestions, complaints };
  }, [filtered]);

  const ratingDist = useMemo(() => {
    const dist: { label: string; value: number }[] = [];
    for (let r = 5; r >= 1; r--) {
      dist.push({ label: `${r}★`, value: filtered.filter(f => f.rating === r).length });
    }
    return dist;
  }, [filtered]);

  function openAdd() { setForm({ ...emptyForm, feedback_id: generateId('FB') }); setEditId(null); setModalOpen(true); }
  function openEdit(f: Feedback) {
    setForm({ feedback_id: f.feedback_id, user_name: f.user_name, service: f.service, team_member_name: f.team_member_name, rating: String(f.rating), what_went_well: f.what_went_well, what_could_improve: f.what_could_improve, suggestion: f.suggestion, complaint: f.complaint, feedback_type: f.feedback_type, date: f.date, photo_url: f.photo_url || '' });
    setEditId(f.id); setModalOpen(true);
  }
  async function handlePhotoUpload(file: File) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `feedback/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('feedback-photos').upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('feedback-photos').getPublicUrl(fileName);
      setForm(prev => ({ ...prev, photo_url: urlData.publicUrl }));
    }
    setUploading(false);
  }
  function removePhoto() { setForm(prev => ({ ...prev, photo_url: '' })); }
  async function handleSave() {
    if (!form.user_name.trim()) return;
    setSaving(true);
    const payload = { ...form, rating: parseInt(form.rating) || 5 };
    if (editId) { await supabase.from('feedback').update(payload).eq('id', editId); }
    else { await supabase.from('feedback').insert(payload); }
    setSaving(false); setModalOpen(false); fetchFeedback();
  }
  function handleDelete(f: Feedback) {
    confirm('Yakin ingin menghapus feedback ini?', async () => { await supabase.from('feedback').delete().eq('id', f.id); fetchFeedback(); });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Evaluasi Kepuasan User" subtitle="Analisis feedback dan kepuasan user" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Feedback</button>
      } />
      <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada data untuk periode ini" message="Pilih periode lain atau tambahkan feedback." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Total Feedback" value={stats.total} icon={MessageSquare} color="pink" />
            <StatCard label="Avg Rating" value={`${stats.avgRating.toFixed(1)} ★`} icon={Star} color="amber" />
            <StatCard label="Positif" value={stats.positive} icon={ThumbsUp} color="green" />
            <StatCard label="Saran" value={stats.suggestions} icon={Lightbulb} color="blue" />
            <StatCard label="Komplain" value={stats.complaints} icon={AlertTriangle} color="red" />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Distribusi Rating</h3>
              <div className="space-y-2">
                {ratingDist.map(r => (
                  <div key={r.label} className="flex items-center gap-3">
                    <span className="w-10 text-sm font-medium text-gray-600">{r.label}</span>
                    <div className="flex-1 h-6 rounded-lg bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-lg bg-amber-400" style={{ width: `${stats.total ? (r.value / stats.total) * 100 : 0}%` }} />
                    </div>
                    <span className="w-8 text-right text-sm text-gray-600">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-gray-800 mb-4">Recent Feedback</h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {filtered.slice(0, 5).map(f => (
                  <div key={f.id} className="border-b border-gray-50 pb-3 last:border-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{f.user_name}</span>
                      <span className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < f.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{f.service} • {formatDate(f.date)}</p>
                    {f.what_went_well && <p className="text-xs text-gray-600 mt-1">{f.what_went_well}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative mb-4">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama user, layanan..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">ID</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Pendamping</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Tipe</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Foto</th><th className="px-4 py-3 text-right">Aksi</th>
              </tr></thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{f.feedback_id || '-'}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{f.user_name}</td>
                    <td className="px-4 py-3 text-gray-600">{f.service}</td>
                    <td className="px-4 py-3 text-gray-600">{f.team_member_name || '-'}</td>
                    <td className="px-4 py-3"><span className="inline-flex items-center gap-0.5">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={12} className={i < f.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />)}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${f.feedback_type === 'Positif' ? 'bg-green-50 text-green-700' : f.feedback_type === 'Saran' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{f.feedback_type}</span></td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(f.date)}</td>
                    <td className="px-4 py-3">{f.photo_url ? <a href={f.photo_url} target="_blank" rel="noopener noreferrer"><img src={f.photo_url} alt="foto" className="h-10 w-10 rounded-lg object-cover" /></a> : <span className="text-gray-300">-</span>}</td>
                    <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(f)} onDelete={() => handleDelete(f)} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Feedback' : 'Tambah Feedback'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.user_name.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Feedback ID</span><p className="font-mono text-sm font-bold text-gray-900">{form.feedback_id}</p></div>
          <Field label="Nama User" required><Input value={form.user_name} onChange={v => setForm({ ...form, user_name: v })} placeholder="Nama user" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Layanan"><Input value={form.service} onChange={v => setForm({ ...form, service: v })} placeholder="Layanan" /></Field>
            <Field label="Pendamping"><Input value={form.team_member_name} onChange={v => setForm({ ...form, team_member_name: v })} placeholder="Nama pendamping" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Rating"><Select value={form.rating} onChange={v => setForm({ ...form, rating: v })} options={['1','2','3','4','5'] as readonly string[]} className="w-full" /></Field>
            <Field label="Tipe Feedback"><Select value={form.feedback_type} onChange={v => setForm({ ...form, feedback_type: v })} options={FEEDBACK_TYPES as readonly string[]} className="w-full" /></Field>
          </div>
          <Field label="Tanggal"><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></Field>
          <Field label="What went well?"><textarea value={form.what_went_well} onChange={e => setForm({ ...form, what_went_well: e.target.value })} rows={2} placeholder="Hal yang baik..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <Field label="What could be improved?"><textarea value={form.what_could_improve} onChange={e => setForm({ ...form, what_could_improve: e.target.value })} rows={2} placeholder="Hal yang perlu diperbaiki..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <Field label="Saran"><Input value={form.suggestion} onChange={v => setForm({ ...form, suggestion: v })} placeholder="Saran" /></Field>
          <Field label="Komplain"><Input value={form.complaint} onChange={v => setForm({ ...form, complaint: v })} placeholder="Komplain (jika ada)" /></Field>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Foto Bukti / Dokumentasi</label>
            {form.photo_url ? (
              <div className="relative inline-block">
                <img src={form.photo_url} alt="foto" className="h-24 w-24 rounded-lg border border-gray-200 object-cover" />
                <button onClick={removePhoto} className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600 transition-colors"><X size={12} /></button>
              </div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 py-6 hover:border-[#FB5EA8] transition-colors">
                <Upload size={20} className="text-gray-400 mb-1" />
                <span className="text-xs text-gray-500">{uploading ? 'Mengupload...' : 'Klik untuk upload foto'}</span>
                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file); }} />
              </label>
            )}
          </div>
        </div>
      </Modal>
      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
