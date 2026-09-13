import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, Copy, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Caption } from '@/lib/types';
import { PLATFORMS, CAPTION_CATEGORIES } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';
import Toast from '@/components/Toast';
import { useToast } from '@/components/useToast';

interface FormData {
  title: string;
  platform: string;
  category: string;
  content: string;
  keywords: string;
}

const emptyForm: FormData = {
  title: '',
  platform: 'Instagram',
  category: 'Edukasi',
  content: '',
  keywords: '',
};

export default function CaptionPage() {
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [previewCaption, setPreviewCaption] = useState<Caption | null>(null);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();
  const { toast, showToast } = useToast();

  useEffect(() => {
    fetchCaptions();
  }, []);

  async function fetchCaptions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('captions')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setCaptions(data as Caption[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return captions.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.content.toLowerCase().includes(search.toLowerCase()) ||
        c.keywords.toLowerCase().includes(search.toLowerCase());
      const matchPlatform = activeTab === 'all' || c.platform === activeTab;
      const matchCategory = !filterCategory || c.category === filterCategory;
      return matchSearch && matchPlatform && matchCategory;
    });
  }, [captions, search, activeTab, filterCategory]);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setModalOpen(true);
  }

  function openEdit(c: Caption) {
    setForm({
      title: c.title,
      platform: c.platform,
      category: c.category,
      content: c.content,
      keywords: c.keywords,
    });
    setEditId(c.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from('captions').update(form).eq('id', editId);
    } else {
      await supabase.from('captions').insert(form);
    }
    setSaving(false);
    setModalOpen(false);
    fetchCaptions();
  }

  async function handleCopy(c: Caption) {
    try {
      await navigator.clipboard.writeText(c.content);
      showToast('Caption berhasil disalin.');
    } catch {
      showToast('Gagal menyalin caption.');
    }
  }

  function handleDelete(c: Caption) {
    confirm('Yakin ingin menghapus data ini?', async () => {
      await supabase.from('captions').delete().eq('id', c.id);
      fetchCaptions();
    });
  }

  const tabOptions = ['all', ...PLATFORMS] as readonly string[];

  return (
    <div>
      <PageHeader
        title="Bank Caption"
        subtitle="Database caption permanen untuk semua platform"
        action={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"
          >
            <Plus size={18} />
            Tambah Caption
          </button>
        }
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {tabOptions.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-[#FB5EA8] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {tab === 'all' ? 'Semua' : tab}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, isi caption, keyword..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
          />
        </div>
        <Select
          value={filterCategory}
          onChange={setFilterCategory}
          options={CAPTION_CATEGORIES as readonly string[]}
          placeholder="Semua Kategori"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Belum ada caption"
          message="Tambahkan caption baru dengan tombol Tambah Caption."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{c.title}</h3>
                <span className="flex-shrink-0 rounded-full bg-[#FB5EA8]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FB5EA8]">
                  {c.platform}
                </span>
              </div>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {c.category && (
                  <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                    {c.category}
                  </span>
                )}
                {c.keywords &&
                  c.keywords.split(',').map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
                    >
                      #{kw.trim()}
                    </span>
                  ))}
              </div>
              <p className="mb-3 flex-1 text-sm text-gray-600 line-clamp-4 whitespace-pre-wrap">
                {c.content}
              </p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                <span className="text-xs text-gray-400">
                  {new Date(c.created_at).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewCaption(c)}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="Lihat"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => handleCopy(c)}
                    className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#FB5EA8] transition-colors"
                    title="Salin Caption"
                  >
                    <Copy size={16} />
                  </button>
                  <RowActions
                    onEdit={() => openEdit(c)}
                    onDelete={() => handleDelete(c)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editId ? 'Edit Caption' : 'Tambah Caption'}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim() || !form.content.trim()}
              className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Judul Caption" required>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Judul caption..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Platform" required>
              <Select value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} options={PLATFORMS as readonly string[]} className="w-full" />
            </Field>
            <Field label="Kategori">
              <Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CAPTION_CATEGORIES as readonly string[]} className="w-full" />
            </Field>
          </div>
          <Field label="Isi Caption" required>
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Tulis caption di sini..."
              rows={8}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8] resize-y"
            />
          </Field>
          <Field label="Tag/Keyword">
            <input
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="Pisahkan dengan koma: edukasi, tips, kesehatan"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={!!previewCaption}
        title={previewCaption?.title || ''}
        onClose={() => setPreviewCaption(null)}
        footer={
          <>
            <button
              onClick={() => setPreviewCaption(null)}
              className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Tutup
            </button>
            {previewCaption && (
              <button
                onClick={() => {
                  handleCopy(previewCaption);
                  setPreviewCaption(null);
                }}
                className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"
              >
                Salin Caption
              </button>
            )}
          </>
        }
      >
        {previewCaption && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1.5">
              <span className="rounded-full bg-[#FB5EA8]/10 px-2.5 py-0.5 text-xs font-semibold text-[#FB5EA8]">
                {previewCaption.platform}
              </span>
              {previewCaption.category && (
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                  {previewCaption.category}
                </span>
              )}
            </div>
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap max-h-[300px] overflow-y-auto">
              {previewCaption.content}
            </div>
            {previewCaption.keywords && (
              <div className="flex flex-wrap gap-1.5">
                {previewCaption.keywords.split(',').map((kw, i) => (
                  <span key={i} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                    #{kw.trim()}
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400">
              Dibuat: {new Date(previewCaption.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmState.open}
        message={confirmState.message}
        onConfirm={() => {
          confirmState.onConfirm();
          closeConfirm();
        }}
        onCancel={closeConfirm}
      />

      <Toast message={toast} />
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-[#FB5EA8]"> *</span>}
      </label>
      {children}
    </div>
  );
}
