import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Car } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Transportation } from '@/lib/types';
import { TRANSPORT_TYPES, formatCurrency, formatDate, generateId, todayISO } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';

interface FormData {
  transport_id: string; date: string; transport_type: string; origin: string;
  destination: string; cost: string; person: string; notes: string;
}
const emptyForm: FormData = { transport_id: '', date: todayISO(), transport_type: 'Motor', origin: '', destination: '', cost: '', person: '', notes: '' };

export default function TransportasiPage() {
  const [items, setItems] = useState<Transportation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchItems(); }, []);
  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase.from('transportation').select('*').order('date', { ascending: false });
    if (data) setItems(data as Transportation[]);
    setLoading(false);
  }

  const filtered = useMemo(() => items.filter(t => {
    const ms = !search || t.origin.toLowerCase().includes(search.toLowerCase()) || t.destination.toLowerCase().includes(search.toLowerCase()) || t.transport_id.toLowerCase().includes(search.toLowerCase());
    const mt = !filterType || t.transport_type === filterType;
    return ms && mt;
  }), [items, search, filterType]);

  function openAdd() { setForm({ ...emptyForm, transport_id: generateId('TRP') }); setEditId(null); setModalOpen(true); }
  function openEdit(t: Transportation) {
    setForm({ transport_id: t.transport_id, date: t.date, transport_type: t.transport_type, origin: t.origin, destination: t.destination, cost: String(t.cost), person: '', notes: t.notes });
    setEditId(t.id); setModalOpen(true);
  }
  async function handleSave() {
    setSaving(true);
    const payload = { ...form, cost: parseFloat(form.cost) || 0 };
    if (editId) { await supabase.from('transportation').update(payload).eq('id', editId); }
    else { await supabase.from('transportation').insert(payload); }
    setSaving(false); setModalOpen(false); fetchItems();
  }
  function handleDelete(t: Transportation) {
    confirm('Yakin ingin menghapus data ini?', async () => { await supabase.from('transportation').delete().eq('id', t.id); fetchItems(); });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <PageHeader title="Transportasi" subtitle="Kelola data transportasi" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Transportasi</button>
      } />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari asal, tujuan, ID..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterType} onChange={setFilterType} options={TRANSPORT_TYPES as readonly string[]} placeholder="Semua Tipe" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada data" message="Tambahkan data transportasi baru." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">ID</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Tipe</th><th className="px-4 py-3">Asal</th><th className="px-4 py-3">Tujuan</th><th className="px-4 py-3">Biaya</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.transport_id || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(t.date)}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-gray-700"><Car size={14} className="text-gray-400" />{t.transport_type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{t.origin || '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{t.destination || '-'}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(t.cost)}</td>
                  <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(t)} onDelete={() => handleDelete(t)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Transportasi' : 'Tambah Transportasi'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Transport ID</span><p className="font-mono text-sm font-bold text-gray-900">{form.transport_id}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal" required><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></Field>
            <Field label="Tipe Transport"><Select value={form.transport_type} onChange={v => setForm({ ...form, transport_type: v })} options={TRANSPORT_TYPES as readonly string[]} className="w-full" /></Field>
          </div>
          <Field label="Asal"><Input value={form.origin} onChange={v => setForm({ ...form, origin: v })} placeholder="Lokasi asal" /></Field>
          <Field label="Tujuan"><Input value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="Lokasi tujuan" /></Field>
          <Field label="Biaya"><Input type="number" value={form.cost} onChange={v => setForm({ ...form, cost: v })} placeholder="0" /></Field>
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
