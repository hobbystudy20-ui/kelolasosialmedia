import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Payment } from '@/lib/types';
import { PAYMENT_STATUS, PAYMENT_METHODS, formatCurrency, formatDate, generateId, todayISO } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
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
  payment_id: string; total_bill: string; dp_amount: string; paid_amount: string;
  payment_status: string; payment_date: string; payment_method: string; notes: string;
}
const emptyForm: FormData = {
  payment_id: '', total_bill: '', dp_amount: '', paid_amount: '', payment_status: 'Belum Bayar', payment_date: todayISO(), payment_method: '', notes: '',
};

export default function PembayaranPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchPayments(); }, []);
  async function fetchPayments() {
    setLoading(true);
    const { data } = await supabase.from('payments').select('*').order('payment_date', { ascending: false });
    if (data) setPayments(data as Payment[]);
    setLoading(false);
  }

  const filtered = useMemo(() => payments.filter(p => {
    const ms = !search || p.payment_id.toLowerCase().includes(search.toLowerCase());
    const mst = !filterStatus || p.payment_status === filterStatus;
    return ms && mst;
  }), [payments, search, filterStatus]);

  const totalOutstanding = filtered.filter(p => p.payment_status !== 'Lunas').reduce((s, p) => s + p.remaining_balance, 0);
  const totalPaid = filtered.reduce((s, p) => s + p.paid_amount, 0);
  const totalDP = filtered.filter(p => p.payment_status === 'DP').reduce((s, p) => s + p.dp_amount, 0);
  const totalRefund = filtered.filter(p => p.payment_status === 'Refund').reduce((s, p) => s + p.paid_amount, 0);

  function openAdd() { setForm({ ...emptyForm, payment_id: generateId('PAY') }); setEditId(null); setModalOpen(true); }
  function openEdit(p: Payment) {
    setForm({ payment_id: p.payment_id, total_bill: String(p.total_bill), dp_amount: String(p.dp_amount), paid_amount: String(p.paid_amount), payment_status: p.payment_status, payment_date: p.payment_date || todayISO(), payment_method: p.payment_method, notes: p.notes });
    setEditId(p.id); setModalOpen(true);
  }
  async function handleSave() {
    setSaving(true);
    const total = parseFloat(form.total_bill) || 0;
    const paid = parseFloat(form.paid_amount) || 0;
    const payload = { ...form, total_bill: total, dp_amount: parseFloat(form.dp_amount) || 0, paid_amount: paid, remaining_balance: total - paid };
    if (editId) { await supabase.from('payments').update(payload).eq('id', editId); }
    else { await supabase.from('payments').insert(payload); }
    setSaving(false); setModalOpen(false); fetchPayments();
  }
  function handleDelete(p: Payment) {
    confirm('Yakin ingin menghapus data ini?', async () => { await supabase.from('payments').delete().eq('id', p.id); fetchPayments(); });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Pembayaran" subtitle="Kelola pembayaran booking" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Pembayaran</button>
      } />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Outstanding" value={formatCurrency(totalOutstanding)} icon={Wallet} color="red" />
        <StatCard label="Total Paid" value={formatCurrency(totalPaid)} icon={Wallet} color="green" />
        <StatCard label="Total DP" value={formatCurrency(totalDP)} icon={Wallet} color="amber" />
        <StatCard label="Total Refund" value={formatCurrency(totalRefund)} icon={Wallet} color="gray" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari Payment ID..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterStatus} onChange={setFilterStatus} options={PAYMENT_STATUS as readonly string[]} placeholder="Semua Status" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada pembayaran" message="Tambahkan data pembayaran baru." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">Payment ID</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Total Tagihan</th><th className="px-4 py-3">Dibayar</th><th className="px-4 py-3">Sisa</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.payment_id || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.payment_date)}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(p.total_bill)}</td>
                  <td className="px-4 py-3 font-medium text-green-600">{formatCurrency(p.paid_amount)}</td>
                  <td className="px-4 py-3 font-medium text-red-600">{formatCurrency(p.remaining_balance)}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.payment_status} /></td>
                  <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(p)} onDelete={() => handleDelete(p)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Pembayaran' : 'Tambah Pembayaran'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Payment ID</span><p className="font-mono text-sm font-bold text-gray-900">{form.payment_id}</p></div>
          <Field label="Total Tagihan" required><Input type="number" value={form.total_bill} onChange={v => setForm({ ...form, total_bill: v })} placeholder="0" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="DP"><Input type="number" value={form.dp_amount} onChange={v => setForm({ ...form, dp_amount: v })} placeholder="0" /></Field>
            <Field label="Sudah Dibayar"><Input type="number" value={form.paid_amount} onChange={v => setForm({ ...form, paid_amount: v })} placeholder="0" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal"><Input type="date" value={form.payment_date} onChange={v => setForm({ ...form, payment_date: v })} /></Field>
            <Field label="Status"><Select value={form.payment_status} onChange={v => setForm({ ...form, payment_status: v })} options={PAYMENT_STATUS as readonly string[]} className="w-full" /></Field>
          </div>
          <Field label="Metode"><Select value={form.payment_method} onChange={v => setForm({ ...form, payment_method: v })} options={PAYMENT_METHODS as readonly string[]} placeholder="- Pilih -" className="w-full" /></Field>
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
