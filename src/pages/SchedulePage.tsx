import { useEffect, useState, useMemo } from 'react';
import { Plus, Search, ArrowUpDown, CalendarClock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { ContentScheduleItem } from '@/lib/types';
import {
  CITIES,
  PLATFORMS,
  SCHEDULE_STATUS,
  getDayName,
  formatDate,
  todayISO,
} from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import Select from '@/components/Select';
import Modal from '@/components/Modal';
import LoadingSpinner from '@/components/LoadingSpinner';
import EmptyState from '@/components/EmptyState';
import StatusBadge from '@/components/StatusBadge';
import RowActions from '@/components/RowActions';
import ConfirmDialog, { useConfirm } from '@/components/ConfirmDialog';

interface FormData {
  date: string;
  time: string;
  platform: string;
  content: string;
  city: string;
  pic: string;
  status: string;
  reference: string;
  notes: string;
}

const emptyForm: FormData = {
  date: todayISO(),
  time: '09:00',
  platform: 'Instagram',
  content: '',
  city: 'Solo',
  pic: '',
  status: 'Belum Dibuat',
  reference: '',
  notes: '',
};

export default function SchedulePage() {
  const [items, setItems] = useState<ContentScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortAsc, setSortAsc] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    const { data, error } = await supabase
      .from('content_schedule')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setItems(data as ContentScheduleItem[]);
    setLoading(false);
  }

  const today = todayISO();

  const todayItems = useMemo(() => {
    return items
      .filter((i) => i.date === today)
      .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }, [items, today]);

  const filtered = useMemo(() => {
    let result = items.filter((item) => {
      const matchSearch =
        !search ||
        item.content.toLowerCase().includes(search.toLowerCase()) ||
        item.pic.toLowerCase().includes(search.toLowerCase()) ||
        item.reference.toLowerCase().includes(search.toLowerCase()) ||
        item.notes.toLowerCase().includes(search.toLowerCase());
      const matchPlatform = !filterPlatform || item.platform === filterPlatform;
      const matchCity = !filterCity || item.city === filterCity;
      const matchStatus = !filterStatus || item.status === filterStatus;
      const matchDate = !filterDate || item.date === filterDate;
      return matchSearch && matchPlatform && matchCity && matchStatus && matchDate;
    });
    result = [...result].sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return sortAsc ? dateCmp : -dateCmp;
      return (a.time || '').localeCompare(b.time || '');
    });
    return result;
  }, [items, search, filterPlatform, filterCity, filterStatus, filterDate, sortAsc]);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setModalOpen(true);
  }

  function openEdit(item: ContentScheduleItem) {
    setForm({
      date: item.date,
      time: item.time,
      platform: item.platform,
      content: item.content,
      city: item.city,
      pic: item.pic,
      status: item.status,
      reference: item.reference,
      notes: item.notes,
    });
    setEditId(item.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.date.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from('content_schedule').update(form).eq('id', editId);
    } else {
      await supabase.from('content_schedule').insert(form);
    }
    setSaving(false);
    setModalOpen(false);
    fetchItems();
  }

  async function handleDuplicate(item: ContentScheduleItem) {
    const { id, created_at, ...rest } = item;
    await supabase.from('content_schedule').insert({ ...rest, content: `${item.content} (Copy)` });
    fetchItems();
  }

  function handleDelete(item: ContentScheduleItem) {
    confirm('Yakin ingin menghapus data ini?', async () => {
      await supabase.from('content_schedule').delete().eq('id', item.id);
      fetchItems();
    });
  }

  return (
    <div>
      <PageHeader
        title="Content Schedule"
        subtitle="Jadwal konten untuk diposting"
        action={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"
          >
            <Plus size={18} />
            Tambah Schedule
          </button>
        }
      />

      {todayItems.length > 0 && (
        <div className="mb-5 overflow-hidden rounded-xl border border-[#FB5EA8]/30 bg-[#FB5EA8]/5">
          <div className="flex items-center gap-2 border-b border-[#FB5EA8]/20 px-4 py-3">
            <CalendarClock size={18} className="text-[#FB5EA8]" />
            <h3 className="text-sm font-bold text-gray-800">Jadwal Hari Ini</h3>
            <span className="ml-auto rounded-full bg-[#FB5EA8] px-2 py-0.5 text-xs font-medium text-white">
              {todayItems.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-[#FB5EA8]/10 text-left text-xs font-semibold text-gray-500">
                  <th className="px-4 py-2">Jam</th>
                  <th className="px-4 py-2">Platform</th>
                  <th className="px-4 py-2">Konten</th>
                  <th className="px-4 py-2">PIC</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {todayItems.map((item) => (
                  <tr key={item.id} className="border-b border-[#FB5EA8]/10 last:border-0">
                    <td className="px-4 py-2.5 font-semibold text-gray-900 whitespace-nowrap">{item.time || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{item.platform}</td>
                    <td className="px-4 py-2.5 text-gray-700 max-w-[250px] truncate" title={item.content}>{item.content || '-'}</td>
                    <td className="px-4 py-2.5 text-gray-600">{item.pic || '-'}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={item.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari konten, PIC, referensi..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
          />
        </div>
        <Select value={filterPlatform} onChange={setFilterPlatform} options={PLATFORMS as readonly string[]} placeholder="Platform" />
        <Select value={filterCity} onChange={setFilterCity} options={CITIES as readonly string[]} placeholder="Kota" />
        <Select value={filterStatus} onChange={setFilterStatus} options={SCHEDULE_STATUS as readonly string[]} placeholder="Status" />
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
        />
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <ArrowUpDown size={16} />
          {sortAsc ? 'Terlama' : 'Terbaru'}
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Belum ada jadwal"
          message="Tambahkan jadwal konten baru dengan tombol Tambah Schedule."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500">
                  <th className="px-3 py-3 w-10">No</th>
                  <th className="px-3 py-3">Tanggal</th>
                  <th className="px-3 py-3">Hari</th>
                  <th className="px-3 py-3">Jam</th>
                  <th className="px-3 py-3">Platform</th>
                  <th className="px-3 py-3">Konten</th>
                  <th className="px-3 py-3">Kota</th>
                  <th className="px-3 py-3">PIC</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Link/Referensi</th>
                  <th className="px-3 py-3">Catatan</th>
                  <th className="px-3 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                    <td className="px-3 py-3 text-gray-400">{idx + 1}</td>
                    <td className="px-3 py-3 whitespace-nowrap font-medium text-gray-900">{formatDate(item.date)}</td>
                    <td className="px-3 py-3 text-gray-600">{getDayName(item.date)}</td>
                    <td className="px-3 py-3 text-gray-600 whitespace-nowrap">{item.time || '-'}</td>
                    <td className="px-3 py-3 text-gray-600">{item.platform}</td>
                    <td className="px-3 py-3 text-gray-700 max-w-[200px] truncate" title={item.content}>{item.content || '-'}</td>
                    <td className="px-3 py-3 text-gray-600">{item.city || '-'}</td>
                    <td className="px-3 py-3 text-gray-600">{item.pic || '-'}</td>
                    <td className="px-3 py-3"><StatusBadge status={item.status} /></td>
                    <td className="px-3 py-3 text-gray-500 max-w-[150px] truncate" title={item.reference}>
                      {item.reference ? (
                        <a href={item.reference} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate">
                          {item.reference}
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-3 py-3 text-gray-500 max-w-[150px] truncate" title={item.notes}>{item.notes || '-'}</td>
                    <td className="px-3 py-3">
                      <div className="flex justify-end">
                        <RowActions
                          onEdit={() => openEdit(item)}
                          onDelete={() => handleDelete(item)}
                          onDuplicate={() => handleDuplicate(item)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editId ? 'Edit Schedule' : 'Tambah Schedule'}
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
              disabled={saving || !form.date.trim()}
              className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal" required>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
              />
            </Field>
            <Field label="Jam">
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Platform" required>
              <Select value={form.platform} onChange={(v) => setForm({ ...form, platform: v })} options={PLATFORMS as readonly string[]} className="w-full" />
            </Field>
            <Field label="Kota">
              <Select value={form.city} onChange={(v) => setForm({ ...form, city: v })} options={CITIES as readonly string[]} className="w-full" />
            </Field>
          </div>
          <Field label="Konten">
            <input
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Deskripsi konten..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="PIC">
              <input
                value={form.pic}
                onChange={(e) => setForm({ ...form, pic: e.target.value })}
                placeholder="Nama PIC..."
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
              />
            </Field>
            <Field label="Status">
              <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={SCHEDULE_STATUS as readonly string[]} className="w-full" />
            </Field>
          </div>
          <Field label="Link/Referensi">
            <input
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
            />
          </Field>
          <Field label="Catatan">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan tambahan..."
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8] resize-none"
            />
          </Field>
        </div>
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
