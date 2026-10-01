import { useEffect, useState } from 'react';
import { Plus, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ServiceArea } from '@/lib/types';
import { CITIES, AREA_STATUS } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';

interface FormData { city: string; district: string; status: string; notes: string; }
const emptyForm: FormData = { city: 'Solo', district: '', status: 'Aktif', notes: '' };

export default function AreaPage() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchAreas(); }, []);
  async function fetchAreas() {
    setLoading(true);
    const { data } = await supabase.from('service_areas').select('*').order('city', { ascending: true });
    if (data) setAreas(data as ServiceArea[]);
    setLoading(false);
  }
  function openAdd() { setForm(emptyForm); setEditId(null); setModalOpen(true); }
  function openEdit(a: ServiceArea) { setForm({ city: a.city, district: a.district, status: a.status, notes: a.notes }); setEditId(a.id); setModalOpen(true); }
  async function handleSave() {
    if (!form.district.trim()) return;
    setSaving(true);
    if (editId) { await supabase.from('service_areas').update(form).eq('id', editId); }
    else { await supabase.from('service_areas').insert(form); }
    setSaving(false); setModalOpen(false); fetchAreas();
  }
  function handleDelete(a: ServiceArea) {
    confirm(`Yakin ingin menghapus area "${a.district}, ${a.city}"?`, async () => {
      await supabase.from('service_areas').delete().eq('id', a.id);
      fetchAreas();
    });
  }

  const grouped = areas.reduce((acc, a) => {
    if (!acc[a.city]) acc[a.city] = [];
    acc[a.city].push(a);
    return acc;
  }, {} as Record<string, ServiceArea[]>);

  return (
    <div>
      <PageHeader title="Area Layanan" subtitle="Kelola area cakupan layanan" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Area</button>
      } />
      {loading ? <LoadingSpinner /> : areas.length === 0 ? (
        <EmptyState title="Belum ada area" message="Tambahkan area layanan baru." />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([city, list]) => (
            <div key={city} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <MapPin size={16} className="text-[#FB5EA8]" /><h3 className="text-sm font-bold text-gray-800">{city}</h3>
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">{list.length} area</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px] text-sm">
                  <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                    <th className="px-4 py-3">Kecamatan / Area</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Catatan</th><th className="px-4 py-3 text-right">Aksi</th>
                  </tr></thead>
                  <tbody>
                    {list.map(a => (
                      <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{a.district}</td>
                        <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                        <td className="px-4 py-3 text-gray-500">{a.notes || '-'}</td>
                        <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(a)} onDelete={() => handleDelete(a)} /></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Area' : 'Tambah Area'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.district.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Kota<span className="text-[#FB5EA8]"> *</span></label><Select value={form.city} onChange={v => setForm({ ...form, city: v })} options={CITIES as readonly string[]} className="w-full" /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Kecamatan / Area<span className="text-[#FB5EA8]"> *</span></label><Input value={form.district} onChange={v => setForm({ ...form, district: v })} placeholder="Nama kecamatan/area" /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Status</label><Select value={form.status} onChange={v => setForm({ ...form, status: v })} options={AREA_STATUS as readonly string[]} className="w-full" /></div>
          <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Catatan</label><Input value={form.notes} onChange={v => setForm({ ...form, notes: v })} placeholder="Catatan" /></div>
        </div>
      </Modal>
      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} />
    </div>
  );
}
