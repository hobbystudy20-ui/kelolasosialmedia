import { useEffect, useState, useMemo } from 'react';
import { UserPlus, Search, MessageCircle, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { TeamMember } from '@/lib/types';
import { CITIES, TEAM_STATUS } from '@/lib/constants';
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
  city: string;
  role: string;
  status: string;
}

const emptyForm: FormData = {
  name: '',
  whatsapp: '',
  city: 'Solo',
  role: '',
  status: 'Aktif',
};

export default function TimPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => {
    fetchMembers();
  }, []);

  async function fetchMembers() {
    setLoading(true);
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setMembers(data as TeamMember[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch =
        !search ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.role.toLowerCase().includes(search.toLowerCase()) ||
        m.whatsapp.includes(search);
      const matchCity = !filterCity || m.city === filterCity;
      const matchStatus = !filterStatus || m.status === filterStatus;
      return matchSearch && matchCity && matchStatus;
    });
  }, [members, search, filterCity, filterStatus]);

  const grouped = useMemo(() => {
    const map: Record<string, TeamMember[]> = {};
    for (const m of filtered) {
      if (!map[m.city]) map[m.city] = [];
      map[m.city].push(m);
    }
    return map;
  }, [filtered]);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setModalOpen(true);
  }

  function openEdit(m: TeamMember) {
    setForm({
      name: m.name,
      whatsapp: m.whatsapp,
      city: m.city,
      role: m.role,
      status: m.status,
    });
    setEditId(m.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    if (editId) {
      await supabase.from('teams').update(form).eq('id', editId);
    } else {
      await supabase.from('teams').insert(form);
    }
    setSaving(false);
    setModalOpen(false);
    fetchMembers();
  }

  function handleDelete(m: TeamMember) {
    confirm(`Yakin ingin menghapus data ini?`, async () => {
      await supabase.from('teams').delete().eq('id', m.id);
      fetchMembers();
    });
  }

  return (
    <div>
      <PageHeader
        title="Daftar Tim Dampingcare"
        subtitle="Kelola anggota tim berdasarkan kota"
        action={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"
          >
            <UserPlus size={18} />
            Tambah Tim
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, peran, atau WhatsApp..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
          />
        </div>
        <Select
          value={filterCity}
          onChange={setFilterCity}
          options={CITIES as readonly string[]}
          placeholder="Semua Kota"
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          options={TEAM_STATUS as readonly string[]}
          placeholder="Semua Status"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Belum ada anggota tim"
          message="Tambahkan anggota tim baru dengan tombol Tambah Tim."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([city, list]) => (
            <div key={city} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <MapPin size={16} className="text-[#FB5EA8]" />
                <h3 className="text-sm font-bold text-gray-800">{city}</h3>
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {list.length} anggota
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Jabatan/Peran</th>
                      <th className="px-4 py-3">WhatsApp</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m) => (
                      <tr key={m.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-medium text-gray-900">{m.name}</td>
                        <td className="px-4 py-3 text-gray-600">{m.role || '-'}</td>
                        <td className="px-4 py-3 text-gray-600">
                          {m.whatsapp ? (
                            <a
                              href={`https://wa.me/${m.whatsapp.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-green-600 hover:underline"
                            >
                              <MessageCircle size={14} />
                              {m.whatsapp}
                            </a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={m.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end">
                            <RowActions
                              onEdit={() => openEdit(m)}
                              onDelete={() => handleDelete(m)}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editId ? 'Edit Anggota' : 'Tambah Anggota Tim'}
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
              disabled={saving || !form.name.trim()}
              className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nama" required>
            <Input value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Nama lengkap" />
          </Field>
          <Field label="Nomor WhatsApp">
            <Input value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="08xx atau 62xx" />
          </Field>
          <Field label="Kota" required>
            <Select
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              options={CITIES as readonly string[]}
              className="w-full"
            />
          </Field>
          <Field label="Jabatan/Peran">
            <Input value={form.role} onChange={(v) => setForm({ ...form, role: v })} placeholder="Contoh: Admin Sosmed" />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={TEAM_STATUS as readonly string[]}
              className="w-full"
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
