import { useEffect, useState, useMemo } from 'react';
import { UserPlus, Search, MessageCircle, MapPin, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User } from '@/lib/types';
import { CITIES, USER_STATUS, formatDate } from '@/lib/constants';
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
  name: string;
  whatsapp: string;
  email: string;
  patient_name: string;
  patient_contact: string;
  address: string;
  city: string;
  notes: string;
  status: string;
}

const emptyForm: FormData = {
  name: '', whatsapp: '', email: '', patient_name: '', patient_contact: '',
  address: '', city: 'Solo', notes: '', status: 'Aktif',
};

export default function UserPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchUsers(); }, []);

  async function fetchUsers() {
    setLoading(true);
    const { data } = await supabase.from('users').select('*').eq('archived', false).order('created_at', { ascending: false });
    if (data) setUsers(data as User[]);
    setLoading(false);
  }

  const filtered = useMemo(() => users.filter(u => {
    const ms = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.whatsapp.includes(search) || (u.patient_name || '').toLowerCase().includes(search.toLowerCase());
    const mc = !filterCity || u.city === filterCity;
    const mst = !filterStatus || u.status === filterStatus;
    return ms && mc && mst;
  }), [users, search, filterCity, filterStatus]);

  function openAdd() { setForm(emptyForm); setEditId(null); setModalOpen(true); }
  function openEdit(u: User) {
    setForm({ name: u.name, whatsapp: u.whatsapp, email: u.email, patient_name: u.patient_name, patient_contact: u.patient_contact, address: u.address, city: u.city, notes: u.notes, status: u.status });
    setEditId(u.id); setModalOpen(true);
  }
  function openDetail(u: User) { setDetailUser(u); setDetailOpen(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) { await supabase.from('users').update(form).eq('id', editId); }
    else { await supabase.from('users').insert(form); }
    setSaving(false); setModalOpen(false); fetchUsers();
  }

  function handleDelete(u: User) {
    confirm(`Yakin ingin mengarsipkan user "${u.name}"?`, async () => {
      await supabase.from('users').update({ archived: true }).eq('id', u.id);
      fetchUsers();
    });
  }

  return (
    <div>
      <PageHeader title="User" subtitle="Kelola data user Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors">
          <UserPlus size={18} /> Tambah User
        </button>
      } />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, WhatsApp, pasien..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterCity} onChange={setFilterCity} options={CITIES as readonly string[]} placeholder="Semua Kota" />
        <Select value={filterStatus} onChange={setFilterStatus} options={USER_STATUS as readonly string[]} placeholder="Semua Status" />
      </div>

      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState title="Belum ada user" message="Tambahkan user baru dengan tombol Tambah User." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
              <th className="px-4 py-3">Nama User</th><th className="px-4 py-3">WhatsApp</th><th className="px-4 py-3">Pasien</th><th className="px-4 py-3">Kota</th><th className="px-4 py-3">Terdaftar</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
            </tr></thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3">{u.whatsapp ? <a href={`https://wa.me/${u.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 hover:underline"><MessageCircle size={14} />{u.whatsapp}</a> : '-'}</td>
                  <td className="px-4 py-3 text-gray-600">{u.patient_name || '-'}</td>
                  <td className="px-4 py-3 text-gray-600"><span className="inline-flex items-center gap-1"><MapPin size={14} className="text-gray-400" />{u.city}</span></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(u.created_at.slice(0,10))}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3"><div className="flex justify-end gap-1">
                    <button onClick={() => openDetail(u)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-500 transition-colors" title="Detail"><Eye size={16} /></button>
                    <RowActions onEdit={() => openEdit(u)} onDelete={() => handleDelete(u)} />
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title={editId ? 'Edit User' : 'Tambah User'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Nama User" required><Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Nama lengkap" /></Field>
          <Field label="Nomor WhatsApp"><Input value={form.whatsapp} onChange={v => setForm({ ...form, whatsapp: v })} placeholder="08xx atau 62xx" /></Field>
          <Field label="Email"><Input value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="email@example.com" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nama Pasien"><Input value={form.patient_name} onChange={v => setForm({ ...form, patient_name: v })} placeholder="Nama pasien" /></Field>
            <Field label="Kontak Pasien / Keluarga"><Input value={form.patient_contact} onChange={v => setForm({ ...form, patient_contact: v })} placeholder="08xx" /></Field>
          </div>
          <Field label="Alamat"><Input value={form.address} onChange={v => setForm({ ...form, address: v })} placeholder="Alamat lengkap" /></Field>
          <Field label="Kota" required><Select value={form.city} onChange={v => setForm({ ...form, city: v })} options={CITIES as readonly string[]} className="w-full" /></Field>
          <Field label="Catatan"><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Catatan tambahan" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <Field label="Status"><Select value={form.status} onChange={v => setForm({ ...form, status: v })} options={USER_STATUS as readonly string[]} className="w-full" /></Field>
        </div>
      </Modal>

      <Modal open={detailOpen} title="Detail User" onClose={() => setDetailOpen(false)} footer={<button onClick={() => setDetailOpen(false)} className="w-full rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors">Tutup</button>}>
        {detailUser && (
          <div className="space-y-4">
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Profile</h4><div className="space-y-1 text-sm"><p><span className="text-gray-500">Nama:</span> <span className="font-medium text-gray-900">{detailUser.name}</span></p><p><span className="text-gray-500">WhatsApp:</span> {detailUser.whatsapp || '-'}</p><p><span className="text-gray-500">Email:</span> {detailUser.email || '-'}</p><p><span className="text-gray-500">Alamat:</span> {detailUser.address || '-'}</p><p><span className="text-gray-500">Kota:</span> {detailUser.city}</p></div></div>
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Informasi Pasien</h4><div className="space-y-1 text-sm"><p><span className="text-gray-500">Nama Pasien:</span> {detailUser.patient_name || '-'}</p><p><span className="text-gray-500">Kontak Pasien:</span> {detailUser.patient_contact || '-'}</p></div></div>
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Catatan</h4><p className="text-sm text-gray-600">{detailUser.notes || '-'}</p></div>
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Status</h4><StatusBadge status={detailUser.status} /></div>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} confirmLabel="Ya, Arsipkan" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
