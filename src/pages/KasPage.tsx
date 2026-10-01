import { useEffect, useState, useMemo } from 'react';
import { Plus, PiggyBank, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { KasBulanan } from '@/lib/types';
import { PAYMENT_METHODS, formatCurrency, formatDate, todayISO, generateId } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';

const KAS_TYPES = ['Masuk', 'Keluar'] as const;

interface FormData {
  kas_id: string; month: string; date: string; type: string;
  amount: string; description: string; payment_method: string;
  person: string; notes: string;
}

const emptyForm: FormData = {
  kas_id: '', month: todayISO().slice(0, 7), date: todayISO(), type: 'Masuk',
  amount: '', description: '', payment_method: 'Cash', person: '', notes: '',
};

export default function KasPage() {
  const [items, setItems] = useState<KasBulanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState('');
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchItems(); }, []);
  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from('kas_bulanan').select('*').order('date', { ascending: false });
    if (data) setItems(data as KasBulanan[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    if (!filterMonth) return items;
    return items.filter(i => i.month === filterMonth);
  }, [items, filterMonth]);

  const totals = useMemo(() => {
    const masuk = filtered.filter(i => i.type === 'Masuk').reduce((s, i) => s + i.amount, 0);
    const keluar = filtered.filter(i => i.type === 'Keluar').reduce((s, i) => s + i.amount, 0);
    return { masuk, keluar, saldo: masuk - keluar };
  }, [filtered]);

  const allTimeSaldo = useMemo(() => {
    const masuk = items.filter(i => i.type === 'Masuk').reduce((s, i) => s + i.amount, 0);
    const keluar = items.filter(i => i.type === 'Keluar').reduce((s, i) => s + i.amount, 0);
    return masuk - keluar;
  }, [items]);

  function openAdd() { setForm({ ...emptyForm, kas_id: generateId('KAS'), month: todayISO().slice(0, 7) }); setEditId(null); setModalOpen(true); }
  function openEdit(k: KasBulanan) {
    setForm({ kas_id: k.kas_id, month: k.month, date: k.date, type: k.type, amount: String(k.amount), description: k.description, payment_method: k.payment_method, person: k.person, notes: k.notes });
    setEditId(k.id); setModalOpen(true);
  }
  async function handleSave() {
    if (!form.date.trim() || !form.amount.trim()) return;
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount) || 0 };
    if (editId) { await supabase.from('kas_bulanan').update(payload).eq('id', editId); }
    else { await supabase.from('kas_bulanan').insert(payload); }
    setSaving(false); setModalOpen(false); fetchItems();
  }
  function handleDelete(k: KasBulanan) {
    confirm('Yakin ingin menghapus data kas ini? Data yang dihapus tidak dapat dikembalikan.', async () => {
      await supabase.from('kas_bulanan').delete().eq('id', k.id);
      fetchItems();
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Kas Bulanan" subtitle="Kelola uang kas tim Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Kas</button>
      } />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total Kas Masuk" value={formatCurrency(totals.masuk)} icon={TrendingUp} color="green" />
        <StatCard label="Total Kas Keluar" value={formatCurrency(totals.keluar)} icon={TrendingDown} color="red" />
        <StatCard label="Saldo Kas" value={formatCurrency(totals.saldo)} icon={Wallet} color={totals.saldo >= 0 ? 'green' : 'red'} />
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Filter Bulan:</label>
        <input type="month" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        {filterMonth && <button onClick={() => setFilterMonth('')} className="text-sm text-gray-500 hover:text-gray-700">Reset</button>}
        <span className="ml-auto text-sm text-gray-500">Saldo keseluruhan: <span className="font-bold text-gray-900">{formatCurrency(allTimeSaldo)}</span></span>
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada data kas" message="Tambahkan data kas masuk atau keluar dengan tombol Tambah Kas." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Bulan</th><th className="px-4 py-3">Tipe</th><th className="px-4 py-3">Deskripsi</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Metode</th><th className="px-4 py-3">Dari / Untuk Siapa</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(k => (
                <tr key={k.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{k.kas_id || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(k.date)}</td>
                  <td className="px-4 py-3 text-gray-600">{k.month}</td>
                  <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${k.type === 'Masuk' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{k.type}</span></td>
                  <td className="px-4 py-3 text-gray-700">{k.description || '-'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{k.type === 'Masuk' ? '+' : '-'}{formatCurrency(k.amount)}</td>
                  <td className="px-4 py-3 text-gray-600">{k.payment_method || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{k.person || '-'}</td>
                  <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(k)} onDelete={() => handleDelete(k)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Kas' : 'Tambah Kas'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.date.trim() || !form.amount.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Kas ID</span><p className="font-mono text-sm font-bold text-gray-900">{form.kas_id}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal" required><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v, month: v.slice(0, 7) })} /></Field>
            <Field label="Bulan" required><input type="month" value={form.month} onChange={e => setForm({ ...form, month: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipe" required><Select value={form.type} onChange={v => setForm({ ...form, type: v })} options={KAS_TYPES as readonly string[]} className="w-full" /></Field>
            <Field label="Jumlah" required><Input type="number" value={form.amount} onChange={v => setForm({ ...form, amount: v })} placeholder="0" /></Field>
          </div>
          <Field label="Deskripsi"><Input value={form.description} onChange={v => setForm({ ...form, description: v })} placeholder="Untuk apa kas ini?" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Metode Pembayaran"><Select value={form.payment_method} onChange={v => setForm({ ...form, payment_method: v })} options={PAYMENT_METHODS as readonly string[]} className="w-full" /></Field>
            <Field label="Dari / Untuk Siapa"><Input value={form.person} onChange={v => setForm({ ...form, person: v })} placeholder="Nama orang yang kas atau menerima kas" /></Field>
          </div>
          <Field label="Catatan"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Catatan tambahan..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8] resize-none" /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} confirmLabel="Ya, Hapus" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
