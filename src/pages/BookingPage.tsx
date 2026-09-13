import { useEffect, useState, useMemo } from 'react';
import { CalendarPlus, Search, MessageCircle, MapPin, Clock, Car, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Booking } from '@/lib/types';
import { CITIES, SERVICE_TYPES, BOOKING_STATUS, getDayName, formatDate } from '@/lib/constants';
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
  customer_name: string;
  whatsapp: string;
  service_type: string;
  date: string;
  time: string;
  pickup_location: string;
  destination: string;
  city: string;
  notes: string;
  status: string;
}

const emptyForm: FormData = {
  customer_name: '',
  whatsapp: '',
  service_type: 'Pendampingan Pasien di RS',
  date: '',
  time: '',
  pickup_location: '',
  destination: '',
  city: 'Solo',
  notes: '',
  status: 'Menunggu Konfirmasi',
};

const SERVICE_ICONS: Record<string, typeof Car> = {
  'Pendampingan Pasien di RS': User,
  'Pendampingan Non Pasien': User,
  'Antar Jemput Motor': Car,
  'Antar Jemput Mobil': Car,
  'Jastip Mobil': Car,
  'Jastip Motor': Car,
};

export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    setLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .order('date', { ascending: true });
    if (!error && data) setBookings(data as Booking[]);
    setLoading(false);
  }

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchSearch =
        !search ||
        b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
        b.whatsapp.includes(search) ||
        b.pickup_location.toLowerCase().includes(search.toLowerCase()) ||
        b.destination.toLowerCase().includes(search.toLowerCase());
      const matchService = !filterService || b.service_type === filterService;
      const matchStatus = !filterStatus || b.status === filterStatus;
      return matchSearch && matchService && matchStatus;
    });
  }, [bookings, search, filterService, filterStatus]);

  const grouped = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of filtered) {
      if (!map[b.date]) map[b.date] = [];
      map[b.date].push(b);
    }
    const sortedDates = Object.keys(map).sort();
    const result: Record<string, Booking[]> = {};
    for (const d of sortedDates) result[d] = map[d];
    return result;
  }, [filtered]);

  function openAdd() {
    setForm(emptyForm);
    setEditId(null);
    setModalOpen(true);
  }

  function openEdit(b: Booking) {
    setForm({
      customer_name: b.customer_name,
      whatsapp: b.whatsapp,
      service_type: b.service_type,
      date: b.date,
      time: b.time,
      pickup_location: b.pickup_location,
      destination: b.destination,
      city: b.city,
      notes: b.notes,
      status: b.status,
    });
    setEditId(b.id);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.customer_name.trim() || !form.date.trim()) return;
    setSaving(true);
    const payload = { ...form };
    if (editId) {
      await supabase.from('bookings').update(payload).eq('id', editId);
    } else {
      await supabase.from('bookings').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    fetchBookings();
  }

  function handleDelete(b: Booking) {
    confirm(`Yakin ingin menghapus booking "${b.customer_name}"?`, async () => {
      await supabase.from('bookings').delete().eq('id', b.id);
      fetchBookings();
    });
  }

  return (
    <div>
      <PageHeader
        title="Booking Jadwal Dampingcare"
        subtitle="Kelola jadwal booking layanan dampingcare"
        action={
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"
          >
            <CalendarPlus size={18} />
            Tambah Booking
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, WhatsApp, lokasi..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
          />
        </div>
        <Select
          value={filterService}
          onChange={setFilterService}
          options={SERVICE_TYPES as readonly string[]}
          placeholder="Semua Layanan"
        />
        <Select
          value={filterStatus}
          onChange={setFilterStatus}
          options={BOOKING_STATUS as readonly string[]}
          placeholder="Semua Status"
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Belum ada booking"
          message="Tambahkan booking baru dengan tombol Tambah Booking."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, list]) => (
            <div key={date} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <CalendarPlus size={16} className="text-[#FB5EA8]" />
                <h3 className="text-sm font-bold text-gray-800">
                  {getDayName(date)}, {formatDate(date)}
                </h3>
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {list.length} booking
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                      <th className="px-4 py-3">Nama</th>
                      <th className="px-4 py-3">Layanan</th>
                      <th className="px-4 py-3">Waktu</th>
                      <th className="px-4 py-3">Rute / Lokasi</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((b) => {
                      const ServiceIcon = SERVICE_ICONS[b.service_type] || Car;
                      return (
                        <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-900">{b.customer_name}</p>
                            {b.whatsapp && (
                              <a
                                href={`https://wa.me/${b.whatsapp.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                              >
                                <MessageCircle size={12} />
                                {b.whatsapp}
                              </a>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1.5 text-gray-700">
                              <ServiceIcon size={14} className="text-gray-400" />
                              {b.service_type}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {b.time ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock size={14} className="text-gray-400" />
                                {b.time}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            {b.pickup_location || b.destination ? (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={14} className="text-gray-400" />
                                {[b.pickup_location, b.destination].filter(Boolean).join(' → ')}
                              </span>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={b.status} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end">
                              <RowActions
                                onEdit={() => openEdit(b)}
                                onDelete={() => handleDelete(b)}
                              />
                            </div>
                          </td>
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

      <Modal
        open={modalOpen}
        title={editId ? 'Edit Booking' : 'Tambah Booking'}
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
              disabled={saving || !form.customer_name.trim() || !form.date.trim()}
              className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nama Pelanggan" required>
            <Input value={form.customer_name} onChange={(v) => setForm({ ...form, customer_name: v })} placeholder="Nama lengkap" />
          </Field>
          <Field label="Nomor WhatsApp">
            <Input value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} placeholder="08xx atau 62xx" />
          </Field>
          <Field label="Jenis Layanan" required>
            <Select
              value={form.service_type}
              onChange={(v) => setForm({ ...form, service_type: v })}
              options={SERVICE_TYPES as readonly string[]}
              className="w-full"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal" required>
              <Input type="date" value={form.date} onChange={(v) => setForm({ ...form, date: v })} />
            </Field>
            <Field label="Waktu">
              <Input type="time" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
            </Field>
          </div>
          <Field label="Lokasi Penjemputan">
            <Input value={form.pickup_location} onChange={(v) => setForm({ ...form, pickup_location: v })} placeholder="Alamat penjemputan" />
          </Field>
          <Field label="Tujuan">
            <Input value={form.destination} onChange={(v) => setForm({ ...form, destination: v })} placeholder="Alamat tujuan / nama RS" />
          </Field>
          <Field label="Kota" required>
            <Select
              value={form.city}
              onChange={(v) => setForm({ ...form, city: v })}
              options={CITIES as readonly string[]}
              className="w-full"
            />
          </Field>
          <Field label="Catatan">
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Catatan tambahan"
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(v) => setForm({ ...form, status: v })}
              options={BOOKING_STATUS as readonly string[]}
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
