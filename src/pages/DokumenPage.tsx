import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, FileText, Download, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { DocumentItem } from '@/lib/types';
import { DOCUMENT_CATEGORIES, formatDate, todayISO } from '@/lib/constants';
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
  name: string; category: string; version: string; upload_date: string;
  updated_date: string; description: string; file_url: string; status: string;
}
const emptyForm: FormData = {
  name: '', category: 'SOP', version: '1.0', upload_date: todayISO(),
  updated_date: todayISO(), description: '', file_url: '', status: 'Aktif',
};

export default function DokumenPage() {
  const [docs, setDocs] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchDocs(); }, []);
  async function fetchDocs() {
    setLoading(true);
    const { data } = await supabase.from('documents').select('*').order('created_at', { ascending: false });
    if (data) setDocs(data as DocumentItem[]);
    setLoading(false);
  }

  const filtered = useMemo(() => docs.filter(d => {
    const ms = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.description.toLowerCase().includes(search.toLowerCase());
    const mc = !filterCat || d.category === filterCat;
    return ms && mc;
  }), [docs, search, filterCat]);

  function openAdd() { setForm(emptyForm); setEditId(null); setModalOpen(true); }
  function openEdit(d: DocumentItem) {
    setForm({ name: d.name, category: d.category, version: d.version, upload_date: d.upload_date || todayISO(), updated_date: d.updated_date || todayISO(), description: d.description, file_url: d.file_url, status: d.status });
    setEditId(d.id); setModalOpen(true);
  }
  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) { await supabase.from('documents').update({ ...form, updated_date: todayISO() }).eq('id', editId); }
    else { await supabase.from('documents').insert(form); }
    setSaving(false); setModalOpen(false); fetchDocs();
  }
  function handleDelete(d: DocumentItem) {
    confirm(`Yakin ingin menghapus "${d.name}"? Data yang dihapus tidak dapat dikembalikan.`, async () => {
      await supabase.from('documents').delete().eq('id', d.id);
      fetchDocs();
    });
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader title="Dokumen & SOP" subtitle="Kelola dokumen dan SOP Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><Plus size={18} /> Tambah Dokumen</button>
      } />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari dokumen..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterCat} onChange={setFilterCat} options={DOCUMENT_CATEGORIES as readonly string[]} placeholder="Semua Kategori" />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="Belum ada dokumen" message="Tambahkan dokumen baru dengan tombol Tambah Dokumen." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map(d => (
            <div key={d.id} className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2"><FileText size={18} className="text-[#FB5EA8]" /><h3 className="text-sm font-bold text-gray-900">{d.name}</h3></div>
                <StatusBadge status={d.status} />
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{d.category}</span>
                <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">v{d.version}</span>
              </div>
              <p className="mb-3 flex-1 text-sm text-gray-600 line-clamp-2">{d.description || '-'}</p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">Update: {d.updated_date ? formatDate(d.updated_date) : '-'}</span>
                <div className="flex items-center gap-1">
                  {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-500 transition-colors" title="Download"><Download size={16} /></a>}
                  <RowActions onEdit={() => openEdit(d)} onDelete={() => handleDelete(d)} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal open={modalOpen} title={editId ? 'Edit Dokumen' : 'Tambah Dokumen'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <Field label="Nama Dokumen" required><Input value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Nama dokumen" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Kategori"><Select value={form.category} onChange={v => setForm({ ...form, category: v })} options={DOCUMENT_CATEGORIES as readonly string[]} className="w-full" /></Field>
            <Field label="Versi"><Input value={form.version} onChange={v => setForm({ ...form, version: v })} placeholder="1.0" /></Field>
          </div>
          <Field label="Deskripsi"><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} placeholder="Deskripsi dokumen" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <Field label="URL File"><Input value={form.file_url} onChange={v => setForm({ ...form, file_url: v })} placeholder="https://..." /></Field>
          <Field label="Status"><Select value={form.status} onChange={v => setForm({ ...form, status: v })} options={['Aktif', 'Nonaktif'] as readonly string[]} className="w-full" /></Field>
        </div>
      </Modal>
      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} confirmLabel="Ya, Hapus" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
