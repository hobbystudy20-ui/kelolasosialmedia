import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, TrendingDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { OperationalExpense } from '@/lib/types';
import { PeriodKey, EXPENSE_CATEGORIES, PAYMENT_METHODS, getPeriodRange, formatCurrency, formatDate, generateId, todayISO } from '@/lib/constants';
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
import BarChart from '@/components/BarChart';

interface FormData {
  expense_id: string; date: string; category: string; description: string;
  amount: string; payment_method: string; person: string; notes: string;
}
const emptyForm: FormData = {
  expense_id: '', date: todayISO(), category: 'BBM', description: '', amount: '', payment_method: '', person: '', notes: '',
};

export default function BiayaOperasionalPage() {
  const [expenses, setExpenses] = useState<OperationalExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodKey>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchExpenses(); }, []);
  async function fetchExpenses() {
    setLoading(true);
    const { data } = await supabase.from('operational_expenses').select('*').order('date', { ascending: false });
    if (data) setExpenses(data as OperationalExpense[]);
    setLoading(false);
  }

  const range = getPeriodRange(period, customStart, customEnd);
  const filtered = useMemo(() => expenses.filter(e => {
    const md = e.date >= range.start && e.date <= range.end;
    const ms = !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.category.toLowerCase().includes(search.toLowerCase());
    const mc = !filterCat || e.category === filterCat;
    return md && ms && mc;
  }), [expenses, range, search, filterCat]);

  const totalExpenses = filtered.reduce((s, e) => s + (e.amount || 0), 0);
  const todayTotal = expenses.filter(e => e.date === todayISO()).reduce((s, e) => s + (e.amount || 0), 0);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of filtered) { map[e.category] = (map[e.category] || 0) + e.amount; }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([label, value]) => ({ label: label.slice(0, 6), value }));
  }, [filtered]);

  function openAdd() { setForm({ ...emptyForm, expense_id: generateId('EXP') }); setEditId(null); setModalOpen(true); }
  function openEdit(e: OperationalExpense) {
    setForm({ expense_id: e.expense_id, date: e.date, category: e.category, description: e.description, amount: String(e.amount), payment_method: e.payment_method, person: e.person, notes: e.notes });
    setEditId(e.id); setModalOpen(true);
  }
  async function handleSave() {
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount) || 0 };
    if (editId) { await supabase.from('operational_expenses').update(payload).eq('id', editId); }
    else { await supabase.from('operational_expenses').insert(payload); }
    setSaving(false); setModalOpen(false); fetchExpenses();
  }
  function handleDelete(e: OperationalExpense) {
    confirm('Yakin ingin menghapus data ini?', async () => { await supabase.from('operational_expenses').delete().eq('id', e.id); fetchExpenses(); });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Biaya Operasional" subtitle="Kelola pengeluaran operasional Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Biaya</button>
      } />
      <PeriodSelector period={period} onChange={setPeriod} customStart={customStart} customEnd={customEnd} onCustomChange={(s, e) => { setCustomStart(s); setCustomEnd(e); }} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Hari Ini" value={formatCurrency(todayTotal)} icon={TrendingDown} color="amber" />
        <StatCard label="Total Biaya" value={formatCurrency(totalExpenses)} icon={TrendingDown} color="red" />
        <StatCard label="Jumlah Transaksi" value={filtered.length} icon={TrendingDown} color="gray" />
      </div>
      {categoryData.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Pengeluaran per Kategori</h3>
          <BarChart data={categoryData} color="#f59e0b" />
        </div>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari deskripsi, kategori..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterCat} onChange={setFilterCat} options={EXPENSE_CATEGORIES as readonly string[]} placeholder="Semua Kategori" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada data" message="Belum ada data untuk periode ini." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Deskripsi</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Orang</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{e.expense_id || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                  <td className="px-4 py-3"><span className="rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{e.category}</span></td>
                  <td className="px-4 py-3 text-gray-700">{e.description || '-'}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{formatCurrency(e.amount)}</td>
                  <td className="px-4 py-3 text-gray-500">{e.person || '-'}</td>
                  <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(e)} onDelete={() => handleDelete(e)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Biaya' : 'Tambah Biaya'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Expense ID</span><p className="font-mono text-sm font-bold text-gray-900">{form.expense_id}</p></div>
          <Field label="Tanggal" required><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></Field>
          <Field label="Kategori" required><Select value={form.category} onChange={v => setForm({ ...form, category: v })} options={EXPENSE_CATEGORIES as readonly string[]} className="w-full" /></Field>
          <Field label="Deskripsi"><Input value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Deskripsi pengeluaran" /></Field>
          <Field label="Jumlah" required><Input type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v })} placeholder="0" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Metode Pembayaran"><Select value={form.payment_method} onChange={v => setForm({ ...form, payment_method: v })} options={PAYMENT_METHODS as readonly string[]} placeholder="- Pilih -" className="w-full" /></Field>
            <Field label="Orang / Tim"><Input value={form.person} onChange={v => setForm({ ...form, person: v })} placeholder="Nama" /></Field>
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
