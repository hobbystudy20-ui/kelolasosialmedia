import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Revenue, Booking } from '@/lib/types';
import { PeriodKey, PAYMENT_STATUS, PAYMENT_METHODS, getPeriodRange, formatCurrency, formatDate, generateId, todayISO } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import PeriodSelector from '@/components/PeriodSelector';
import StatCard from '@/components/StatCard';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';

interface FormData {
  transaction_id: string; date: string; service: string; service_fee: string;
  transport_fee: string; additional_fee: string; discount: string;
  payment_status: string; payment_method: string; notes: string;
}
const emptyForm: FormData = {
  transaction_id: '', date: todayISO(), service: '', service_fee: '', transport_fee: '',
  additional_fee: '', discount: '', payment_status: 'Belum Bayar', payment_method: '', notes: '',
};

export default function PendapatanPage() {
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchRevenue(); }, []);
  async function fetchRevenue() {
    setLoading(true);
    const { data } = await supabase.from('revenue').select('*').order('date', { ascending: false });
    if (data) setRevenue(data as Revenue[]);
    setLoading(false);
  }

  const range = getPeriodRange(period, customStart, customEnd);
  const filtered = useMemo(() => revenue.filter(r => {
    const md = r.date >= range.start && r.date <= range.end;
    const ms = !search || r.service.toLowerCase().includes(search.toLowerCase()) || r.transaction_id.toLowerCase().includes(search.toLowerCase());
    return md && ms;
  }), [revenue, range, search]);

  const totalRevenue = filtered.reduce((s, r) => s + (r.total || 0), 0);
  const todayTotal = revenue.filter(r => r.date === todayISO()).reduce((s, r) => s + (r.total || 0), 0);
  const rangeLabel = period === 'today' ? 'Hari Ini' : period === 'week' ? 'Minggu Ini' : period === 'month' ? 'Bulan Ini' : 'Custom';

  function calcTotal(): number {
    return (parseFloat(form.service_fee) || 0) + (parseFloat(form.transport_fee) || 0) + (parseFloat(form.additional_fee) || 0) - (parseFloat(form.discount) || 0);
  }
  function openAdd() { setForm({ ...emptyForm, transaction_id: generateId('REV') }); setEditId(null); setModalOpen(true); }
  function openEdit(r: Revenue) {
    setForm({ transaction_id: r.transaction_id, date: r.date, service: r.service, service_fee: String(r.service_fee), transport_fee: String(r.transport_fee), additional_fee: String(r.additional_fee), discount: String(r.discount), payment_status: r.payment_status, payment_method: r.payment_method, notes: r.notes });
    setEditId(r.id); setModalOpen(true);
  }
  async function handleSave() {
    setSaving(true);
    const payload = { ...form, service_fee: parseFloat(form.service_fee) || 0, transport_fee: parseFloat(form.transport_fee) || 0, additional_fee: parseFloat(form.additional_fee) || 0, discount: parseFloat(form.discount) || 0, total: calcTotal() };
    if (editId) { await supabase.from('revenue').update(payload).eq('id', editId); }
    else { await supabase.from('revenue').insert(payload); }
    setSaving(false); setModalOpen(false); fetchRevenue();
  }
  function handleDelete(r: Revenue) {
    confirm('Yakin ingin menghapus data ini?', async () => { await supabase.from('revenue').delete().eq('id', r.id); fetchRevenue(); });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Pendapatan" subtitle="Kelola data pendapatan Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Pendapatan</button>
      } />
      <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Hari Ini" value={formatCurrency(todayTotal)} icon={TrendingUp} color="green" />
        <StatCard label={rangeLabel} value={formatCurrency(totalRevenue)} icon={TrendingUp} color="pink" />
        <StatCard label="Total Transaksi" value={filtered.length} icon={TrendingUp} color="blue" />
        <StatCard label="Rata-rata" value={formatCurrency(filtered.length ? totalRevenue / filtered.length : 0)} icon={TrendingUp} color="teal" />
      </div>
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari layanan, ID transaksi..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada data pendapatan" message="Belum ada data untuk periode ini." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Total</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3">Metode</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{r.transaction_id || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(r.date)}</td>
                  <td className="px-4 py-3 text-gray-700">{r.service || '-'}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(r.total)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.payment_status} /></td>
                  <td className="px-4 py-3 text-gray-500">{r.payment_method || '-'}</td>
                  <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(r)} onDelete={() => handleDelete(r)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Pendapatan' : 'Tambah Pendapatan'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Transaction ID</span><p className="font-mono text-sm font-bold text-gray-900">{form.transaction_id}</p></div>
          <Field label="Tanggal" required><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></Field>
          <Field label="Layanan"><Input value={form.service} onChange={v => setForm({ ...form, service: v })} placeholder="Nama layanan" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Service Fee"><Input type="number" value={form.service_fee} onChange={v => setForm({ ...form, service_fee: v })} placeholder="0" /></Field>
            <Field label="Transport Fee"><Input type="number" value={form.transport_fee} onChange={v => setForm({ ...form, transport_fee: v })} placeholder="0" /></Field>
            <Field label="Additional Fee"><Input type="number" value={form.additional_fee} onChange={v => setForm({ ...form, additional_fee: v })} placeholder="0" /></Field>
            <Field label="Discount"><Input type="number" value={form.discount} onChange={v => setForm({ ...form, discount: v })} placeholder="0" /></Field>
          </div>
          <div className="flex justify-between border-t border-gray-100 pt-2 text-sm"><span className="text-gray-500">Total:</span><span className="font-bold text-gray-900">{formatCurrency(calcTotal())}</span></div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status Pembayaran"><Select value={form.payment_status} onChange={v => setForm({ ...form, payment_status: v })} options={PAYMENT_STATUS as readonly string[]} className="w-full" /></Field>
            <Field label="Metode"><Select value={form.payment_method} onChange={v => setForm({ ...form, payment_method: v })} options={PAYMENT_METHODS as readonly string[]} placeholder="- Pilih -" className="w-full" /></Field>
          </div>
          <Field label="Catatan"><Input value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Catatan" /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
