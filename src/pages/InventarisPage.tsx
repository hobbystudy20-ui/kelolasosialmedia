import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Inventory } from '@/lib/types';
import { INVENTORY_CONDITIONS, formatCurrency, formatDate, generateId, todayISO } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';

interface FormData {
  item_id: string; item: string; category: string; quantity: string; condition: string;
  location: string; responsible_person: string; purchase_date: string; purchase_price: string; notes: string;
}
const emptyForm: FormData = { item_id: '', item: '', category: '', quantity: '1', condition: 'Baik', location: '', responsible_person: '', purchase_date: todayISO(), purchase_price: '', notes: '' };

export default function InventarisPage() {
  const [items, setItems] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCondition, setFilterCondition] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchItems(); }, []);
  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (data) setItems(data as Inventory[]);
    setLoading(false);
  }

  const filtered = useMemo(() => items.filter(i => {
    const ms = !search || i.item.toLowerCase().includes(search.toLowerCase()) || i.category.toLowerCase().includes(search.toLowerCase());
    const mc = !filterCondition || i.condition === filterCondition;
    return ms && mc;
  }), [items, search, filterCondition]);

  function openAdd() { setForm({ ...emptyForm, item_id: generateId('INV') }); setEditId(null); setModalOpen(true); }
  function openEdit(i: Inventory) {
    setForm({ item_id: i.item_id, item: i.item, category: i.category, quantity: String(i.quantity), condition: i.condition, location: i.location, responsible_person: i.responsible_person, purchase_date: i.purchase_date || todayISO(), purchase_price: String(i.purchase_price), notes: i.notes });
    setEditId(i.id); setModalOpen(true);
  }
  async function handleSave() {
    if (!form.item.trim()) return;
    setSaving(true);
    const payload = { ...form, quantity: parseInt(form.quantity) || 1, purchase_price: parseFloat(form.purchase_price) || 0 };
    if (editId) { await supabase.from('inventory').update(payload).eq('id', editId); }
    else { await supabase.from('inventory').insert(payload); }
    setSaving(false); setModalOpen(false); fetchItems();
  }
  function handleDelete(i: Inventory) {
    confirm(`Yakin ingin menghapus "${i.item}"?`, async () => { await supabase.from('inventory').delete().eq('id', i.id); fetchItems(); });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Inventaris" subtitle="Kelola inventaris Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Item</button>
      } />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari item, kategori..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterCondition} onChange={setFilterCondition} options={INVENTORY_CONDITIONS as readonly string[]} placeholder="Semua Kondisi" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada inventaris" message="Tambahkan item inventaris baru." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[800px] text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Item</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Qty</th><th className="px-4 py-3">Kondisi</th><th className="px-4 py-3">Lokasi</th><th className="px-4 py-3">Harga Beli</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(i => (
                <tr key={i.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{i.item_id || '-'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900"><span className="inline-flex items-center gap-1.5"><Package size={14} className="text-gray-400" />{i.item}</span></td>
                  <td className="px-4 py-3 text-gray-600">{i.category || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{i.quantity}</td>
                  <td className="px-4 py-3"><StatusBadge status={i.condition} /></td>
                  <td className="px-4 py-3 text-gray-600">{i.location || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{formatCurrency(i.purchase_price)}</td>
                  <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(i)} onDelete={() => handleDelete(i)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Item' : 'Tambah Item'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.item.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Item ID</span><p className="font-mono text-sm font-bold text-gray-900">{form.item_id}</p></div>
          <Field label="Nama Item" required><Input value={form.item} onChange={v => setForm({ ...form, item: v })} placeholder="Nama item" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kategori"><Input value={form.category} onChange={v => setForm({ ...form, category: v })} placeholder="Kategori" /></Field>
            <Field label="Jumlah"><Input type="number" value={form.quantity} onChange={v => setForm({ ...form, quantity: v })} placeholder="1" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kondisi"><Select value={form.condition} onChange={v => setForm({ ...form, condition: v })} options={INVENTORY_CONDITIONS as readonly string[]} className="w-full" /></Field>
            <Field label="Lokasi"><Input value={form.location} onChange={v => setForm({ ...form, location: v })} placeholder="Lokasi penyimpanan" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal Beli"><Input type="date" value={form.purchase_date} onChange={v => setForm({ ...form, purchase_date: v })} /></Field>
            <Field label="Harga Beli"><Input type="number" value={form.purchase_price} onChange={v => setForm({ ...form, purchase_price: v })} placeholder="0" /></Field>
          </div>
          <Field label="Penanggung Jawab"><Input value={form.responsible_person} onChange={v => setForm({ ...form, responsible_person: v })} placeholder="Nama" /></Field>
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
