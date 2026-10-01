import { useEffect, useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Service } from '@/lib/types';
import { SERVICE_CATEGORIES, SERVICE_STATUS, formatCurrency } from '@/lib/constants';
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
  name: string; category: string; description: string; price: string;
  price_unit: string; duration: string; status: string; notes: string;
}
const emptyForm: FormData = { name: '', category: 'Pendampingan Pasien', description: '', price: '', price_unit: 'per layanan', duration: '', status: 'Aktif', notes: '' };

export default function ServicePage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchServices(); }, []);
  async function fetchServices() {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').eq('archived', false).order('created_at', { ascending: true });
    if (data) setServices(data as Service[]);
    setLoading(false);
  }

  const filtered = useMemo(() => services.filter(s => {
    const ms = !search || s.name.toLowerCase().includes(search.toLowerCase());
    const mc = !filterCat || s.category === filterCat;
    return ms && mc;
  }), [services, search, filterCat]);

  function openAdd() { setForm(emptyForm); setEditId(null); setModalOpen(true); }
  function openEdit(s: Service) {
    setForm({ name: s.name, category: s.category, description: s.description, price: String(s.price), price_unit: s.price_unit, duration: s.duration, status: s.status, notes: s.notes });
    setEditId(s.id); setModalOpen(true);
  }
  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    const payload = { ...form, price: parseFloat(form.price) || 0 };
    if (editId) { await supabase.from('services').update(payload).eq('id', editId); }
    else { await supabase.from('services').insert(payload); }
    setSaving(false); setModalOpen(false); fetchServices();
  }
  function handleDelete(s: Service) {
    confirm(`Yakin ingin mengarsipkan layanan "${s.name}"?`, async () => {
      await supabase.from('services').update({ archived: true }).eq('id', s.id);
      fetchServices();
    });
  }

  return (
    <div>
      <PageHeader title="Daftar Layanan" subtitle="Kelola katalog layanan Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Layanan</button>
      } />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari layanan..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterCat} onChange={setFilterCat} options={SERVICE_CATEGORIES as readonly string[]} placeholder="Semua Kategori" />
      </div>
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState title="Belum ada layanan" message="Tambahkan layanan baru dengan tombol Tambah Layanan." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">Nama Layanan</th><th className="px-4 py-3">Kategori</th><th className="px-4 py-3">Tarif</th><th className="px-4 py-3">Durasi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3"><p className="font-medium text-gray-900">{s.name}</p><p className="text-xs text-gray-400">{s.description}</p></td>
                  <td className="px-4 py-3 text-gray-600">{s.category}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(s.price)} <span className="text-xs text-gray-400">{s.price_unit}</span></td>
                  <td className="px-4 py-3 text-gray-600">{s.duration || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(s)} onDelete={() => handleDelete(s)} /></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Layanan' : 'Tambah Layanan'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Nama Layanan" required><Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Nama layanan" /></Field>
          <Field label="Kategori" required><Select value={form.category} onChange={v => setForm({ ...form, category: v })} options={SERVICE_CATEGORIES as readonly string[]} className="w-full" /></Field>
          <Field label="Deskripsi"><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Deskripsi layanan" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tarif"><Input type="number" value={form.price} onChange={v => setForm({ ...form, price: v })} placeholder="0" /></Field>
            <Field label="Satuan Tarif"><Input value={form.price_unit} onChange={v => setForm({ ...form, price_unit: v })} placeholder="per layanan" /></Field>
          </div>
          <Field label="Durasi"><Input value={form.duration} onChange={v => setForm({ ...form, duration: v })} placeholder="Contoh: 8 jam" /></Field>
          <Field label="Status"><Select value={form.status} onChange={v => setForm({ ...form, status: v })} options={SERVICE_STATUS as readonly string[]} className="w-full" /></Field>
          <Field label="Catatan"><Input value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Catatan" /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} confirmLabel="Ya, Arsipkan" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
