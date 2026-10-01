import { useEffect, useState, useMemo } from 'react';
import { UserPlus, Search, MessageCircle, MapPin, Wallet, Plus, TrendingUp, Upload, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TeamMember, TeamSalary } from '@/lib/types';
import { CITIES, TEAM_STATUS, TEAM_ROLES, PAYMENT_METHODS, formatCurrency, formatDate, todayISO, generateId } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';

interface FormData {
  name: string; whatsapp: string; city: string; role: string; status: string;
  photo: string; education_background: string; services_can_handle: string; team_notes: string;
}
const emptyForm: FormData = {
  name: '', whatsapp: '', city: 'Solo', role: 'Pendamping', status: 'Aktif',
  photo: '', education_background: '', services_can_handle: '', team_notes: '',
};

interface SalaryFormData {
  salary_id: string; team_member_id: string; team_member_name: string;
  month: string; date: string; amount: string; payment_method: string;
  status: string; notes: string;
}
const emptySalaryForm: SalaryFormData = {
  salary_id: '', team_member_id: '', team_member_name: '', month: todayISO().slice(0, 7),
  date: todayISO(), amount: '', payment_method: 'Cash', status: 'Dibayar', notes: '',
};

const SALARY_STATUS = ['Dibayar', 'Belum Dibayar'] as const;

export default function TimPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [salaries, setSalaries] = useState<TeamSalary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);
  const [salaryEditId, setSalaryEditId] = useState<string | null>(null);
  const [salaryForm, setSalaryForm] = useState<SalaryFormData>(emptySalaryForm);
  const [savingSalary, setSavingSalary] = useState(false);
  const [salaryFilterMonth, setSalaryFilterMonth] = useState('');
  const [showSalarySection, setShowSalarySection] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    setLoading(true);
    const [t, s] = await Promise.all([
      supabase.from('teams').select('*').order('created_at', { ascending: true }),
      supabase.from('team_salaries').select('*').order('date', { ascending: false }),
    ]);
    if (t.data) setMembers(t.data as TeamMember[]);
    if (s.data) setSalaries(s.data as TeamSalary[]);
    setLoading(false);
  }

  const filtered = useMemo(() => members.filter(m => {
    const ms = !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.role.toLowerCase().includes(search.toLowerCase()) || m.whatsapp.includes(search);
    const mc = !filterCity || m.city === filterCity;
    const mst = !filterStatus || m.status === filterStatus;
    return ms && mc && mst;
  }), [members, search, filterCity, filterStatus]);

  const grouped = useMemo(() => {
    const map: Record<string, TeamMember[]> = {};
    for (const m of filtered) { if (!map[m.city]) map[m.city] = []; map[m.city].push(m); }
    return map;
  }, [filtered]);

  const filteredSalaries = useMemo(() => {
    if (!salaryFilterMonth) return salaries;
    return salaries.filter(s => s.month === salaryFilterMonth);
  }, [salaries, salaryFilterMonth]);

  const salaryStats = useMemo(() => {
    const total = filteredSalaries.reduce((s, sal) => s + sal.amount, 0);
    const dibayar = filteredSalaries.filter(s => s.status === 'Dibayar').reduce((s, sal) => s + sal.amount, 0);
    const belum = filteredSalaries.filter(s => s.status === 'Belum Dibayar').reduce((s, sal) => s + sal.amount, 0);
    return { total, dibayar, belum };
  }, [filteredSalaries]);

  function getMemberSalary(memberId: string, month: string): TeamSalary | undefined {
    return salaries.find(s => s.team_member_id === memberId && s.month === month);
  }

  function openAdd() { setForm(emptyForm); setEditId(null); setModalOpen(true); }
  function openEdit(m: TeamMember) {
    setForm({ name: m.name, whatsapp: m.whatsapp, city: m.city, role: m.role, status: m.status, photo: m.photo || '', education_background: m.education_background || '', services_can_handle: m.services_can_handle || '', team_notes: m.team_notes || '' });
    setEditId(m.id); setModalOpen(true);
  }
  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) { await supabase.from('teams').update(form).eq('id', editId); }
    else { await supabase.from('teams').insert(form); }
    setSaving(false); setModalOpen(false); fetchAll();
  }
  function handleDelete(m: TeamMember) {
    confirm(`Yakin ingin menghapus "${m.name}"? Data yang dihapus tidak dapat dikembalikan.`, async () => {
      await supabase.from('teams').delete().eq('id', m.id);
      fetchAll();
    });
  }

  async function handlePhotoUpload(file: File, memberId?: string) {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `team/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('team-photos').upload(fileName, file);
    if (!error) {
      const { data: urlData } = supabase.storage.from('team-photos').getPublicUrl(fileName);
      if (memberId) {
        await supabase.from('teams').update({ photo: urlData.publicUrl }).eq('id', memberId);
        fetchAll();
      } else {
        setForm(prev => ({ ...prev, photo: urlData.publicUrl }));
      }
    }
    setUploading(false);
  }
  function removePhoto() { setForm(prev => ({ ...prev, photo: '' })); }
  function openAddSalary(memberId?: string, memberName?: string) {
    setSalaryForm({ ...emptySalaryForm, salary_id: generateId('GJI'), team_member_id: memberId || '', team_member_name: memberName || '', month: todayISO().slice(0, 7) });
    setSalaryEditId(null); setSalaryModalOpen(true);
  }
  function openEditSalary(s: TeamSalary) {
    setSalaryForm({ salary_id: s.salary_id, team_member_id: s.team_member_id || '', team_member_name: s.team_member_name, month: s.month, date: s.date, amount: String(s.amount), payment_method: s.payment_method, status: s.status, notes: s.notes });
    setSalaryEditId(s.id); setSalaryModalOpen(true);
  }
  async function handleSaveSalary() {
    if (!salaryForm.team_member_name.trim() || !salaryForm.amount.trim()) return;
    setSavingSalary(true);
    const payload = { ...salaryForm, amount: parseFloat(salaryForm.amount) || 0 };
    if (salaryEditId) { await supabase.from('team_salaries').update(payload).eq('id', salaryEditId); }
    else { await supabase.from('team_salaries').insert(payload); }
    setSavingSalary(false); setSalaryModalOpen(false); fetchAll();
  }
  function handleDeleteSalary(s: TeamSalary) {
    confirm('Yakin ingin menghapus data gaji ini?', async () => {
      await supabase.from('team_salaries').delete().eq('id', s.id);
      fetchAll();
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Daftar Tim" subtitle="Kelola anggota tim berdasarkan kota" action={
        <div className="flex gap-2">
          <button onClick={() => setShowSalarySection(!showSalarySection)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"><Wallet size={18} /> Gaji</button>
          <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><UserPlus size={18} /> Tambah Tim</button>
        </div>
      } />

      {showSalarySection && (
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatCard label="Total Gaji (Periode)" value={formatCurrency(salaryStats.total)} icon={Wallet} color="blue" />
            <StatCard label="Sudah Dibayar" value={formatCurrency(salaryStats.dibayar)} icon={TrendingUp} color="green" />
            <StatCard label="Belum Dibayar" value={formatCurrency(salaryStats.belum)} icon={Wallet} color="red" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter Bulan:</label>
            <input type="month" value={salaryFilterMonth} onChange={e => setSalaryFilterMonth(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
            {salaryFilterMonth && <button onClick={() => setSalaryFilterMonth('')} className="text-sm text-gray-500 hover:text-gray-700">Reset</button>}
            <button onClick={() => openAddSalary()} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-3 py-2 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={16} /> Catat Gaji</button>
          </div>
          {filteredSalaries.length === 0 ? (
            <EmptyState title="Belum ada data gaji" message="Catat gaji anggota tim untuk bulan tertentu." />
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                  <th className="px-4 py-3">ID</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Bulan</th><th className="px-4 py-3">Tanggal</th><th className="px-4 py-3">Jumlah</th><th className="px-4 py-3">Metode</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Aksi</th>
                </tr></thead>
                <tbody>
                  {filteredSalaries.map(s => (
                    <tr key={s.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.salary_id || '-'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{s.team_member_name || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.month}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(s.date)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatCurrency(s.amount)}</td>
                      <td className="px-4 py-3 text-gray-600">{s.payment_method || '-'}</td>
                      <td className="px-4 py-3"><span className={`rounded-md px-2 py-0.5 text-xs font-medium ${s.status === 'Dibayar' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{s.status}</span></td>
                      <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEditSalary(s)} onDelete={() => handleDeleteSalary(s)} /></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, peran, atau WhatsApp..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterCity} onChange={setFilterCity} options={CITIES as readonly string[]} placeholder="Semua Kota" />
        <Select value={filterStatus} onChange={setFilterStatus} options={TEAM_STATUS as readonly string[]} placeholder="Semua Status" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada anggota tim" message="Tambahkan anggota tim baru dengan tombol Tambah Tim." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([city, list]) => (
            <div key={city} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <MapPin size={16} className="text-[#FB5EA8]" /><h3 className="text-sm font-bold text-gray-800">{city}</h3>
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">{list.length} anggota</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                    <th className="px-4 py-3">Foto</th><th className="px-4 py-3">Nama</th><th className="px-4 py-3">Peran</th><th className="px-4 py-3">Pendidikan</th><th className="px-4 py-3">WhatsApp</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Gaji Bulan Ini</th><th className="px-4 py-3 text-right">Aksi</th>
                  </tr></thead>
                  <tbody>
                    {list.map(m => {
                      const currentMonth = todayISO().slice(0, 7);
                      const salary = getMemberSalary(m.id, currentMonth);
                      return (
                        <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <div className="group relative h-10 w-10">
                              {m.photo ? (
                                <img src={m.photo} alt={m.name} className="h-10 w-10 rounded-full object-cover border border-gray-200" />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-400">{m.name.charAt(0)}</div>
                              )}
                              <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                                <Upload size={14} className="text-white" />
                                <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={e => { const file = e.target.files?.[0]; if (file) handlePhotoUpload(file, m.id); }} />
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                          <td className="px-4 py-3 text-gray-600">{m.role || '-'}</td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{m.education_background || '-'}</td>
                          <td className="px-4 py-3">{m.whatsapp ? <a href={`https://wa.me/${m.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-green-600 hover:underline"><MessageCircle size={14} />{m.whatsapp}</a> : '-'}</td>
                          <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                          <td className="px-4 py-3">
                            {salary ? (
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-gray-900">{formatCurrency(salary.amount)}</span>
                                <span className={`rounded-md px-2 py-0.5 text-xs font-medium w-fit ${salary.status === 'Dibayar' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{salary.status}</span>
                              </div>
                            ) : (
                              <button onClick={() => openAddSalary(m.id, m.name)} className="text-xs text-[#FB5EA8] hover:underline">+ Catat gaji</button>
                            )}
                          </td>
                          <td className="px-4 py-3"><div className="flex justify-end"><RowActions onEdit={() => openEdit(m)} onDelete={() => handleDelete(m)} /></div></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Anggota' : 'Tambah Anggota Tim'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Foto Anggota</label>
            {form.photo ? (
              <div className="relative inline-block">
                <img src={form.photo} alt="foto" className="h-24 w-24 rounded-full border border-gray-200 object-cover" />
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
          <Field label="Nama" required><Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Nama lengkap" /></Field>
          <Field label="Nomor WhatsApp"><Input value={form.whatsapp} onChange={v => setForm({ ...form, whatsapp: v })} placeholder="08xx atau 62xx" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kota" required><Select value={form.city} onChange={v => setForm({ ...form, city: v })} options={CITIES as readonly string[]} className="w-full" /></Field>
            <Field label="Jabatan / Peran"><Select value={form.role} onChange={v => setForm({ ...form, role: v })} options={TEAM_ROLES as readonly string[]} className="w-full" /></Field>
          </div>
          <Field label="Background Pendidikan"><Input value={form.education_background} onChange={v => setForm({ ...form, education_background: v })} placeholder="Contoh: S1 Keperawatan" /></Field>
          <Field label="Layanan yang dapat ditangani"><Input value={form.services_can_handle} onChange={v => setForm({ ...form, services_can_handle: v })} placeholder="Contoh: Pendampingan Pasien, Anjem" /></Field>
          <Field label="Catatan"><textarea value={form.team_notes} onChange={e => setForm({ ...form, team_notes: e.target.value })} rows={2} placeholder="Catatan tambahan" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <Field label="Status"><Select value={form.status} onChange={v => setForm({ ...form, status: v })} options={TEAM_STATUS as readonly string[]} className="w-full" /></Field>
        </div>
      </Modal>
      <Modal open={salaryModalOpen} title={salaryEditId ? 'Edit Gaji' : 'Catat Gaji'} onClose={() => setSalaryModalOpen(false)} footer={
        <>
          <button onClick={() => setSalaryModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSaveSalary} disabled={savingSalary || !salaryForm.team_member_name.trim() || !salaryForm.amount.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{savingSalary ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Gaji ID</span><p className="font-mono text-sm font-bold text-gray-900">{salaryForm.salary_id}</p></div>
          <Field label="Nama Anggota Tim" required>
            <select value={salaryForm.team_member_id} onChange={e => { const m = members.find(mm => mm.id === e.target.value); setSalaryForm({ ...salaryForm, team_member_id: e.target.value, team_member_name: m?.name || '' }); }} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]">
              <option value="">Pilih anggota...</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.city})</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Bulan" required><input type="month" value={salaryForm.month} onChange={e => setSalaryForm({ ...salaryForm, month: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
            <Field label="Tanggal Dibayar" required><Input type="date" value={salaryForm.date} onChange={v => setSalaryForm({ ...salaryForm, date: v })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Jumlah Gaji" required><Input type="number" value={salaryForm.amount} onChange={v => setSalaryForm({ ...salaryForm, amount: v })} placeholder="0" /></Field>
            <Field label="Metode Pembayaran"><Select value={salaryForm.payment_method} onChange={v => setSalaryForm({ ...salaryForm, payment_method: v })} options={PAYMENT_METHODS as readonly string[]} className="w-full" /></Field>
          </div>
          <Field label="Status"><Select value={salaryForm.status} onChange={v => setSalaryForm({ ...salaryForm, status: v })} options={SALARY_STATUS as readonly string[]} className="w-full" /></Field>
          <Field label="Catatan"><textarea value={salaryForm.notes} onChange={e => setSalaryForm({ ...salaryForm, notes: e.target.value })} rows={2} placeholder="Catatan tambahan..." className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8] resize-none" /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} confirmLabel="Ya, Hapus" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
