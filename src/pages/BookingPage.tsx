import { useEffect, useState, useMemo } from 'react';
import { CalendarPlus, Search, MessageCircle, MapPin, Clock, Car, User, Eye } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Booking, TeamMember, User as DampingcareUser } from '@/lib/types';
import { CITIES, SERVICE_TYPES, BOOKING_STATUS, PAYMENT_STATUS, PAYMENT_METHODS, getDayName, formatDate, formatCurrency, generateBookingId, todayISO } from '@/lib/constants';
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
  booking_id_code: string;
  customer_name: string;
  whatsapp: string;
  service_type: string;
  date: string;
  time: string;
  start_time: string;
  end_time: string;
  pickup_location: string;
  destination: string;
  city: string;
  notes: string;
  user_notes: string;
  internal_notes: string;
  status: string;
  payment_status: string;
  payment_method: string;
  user_id: string;
  team_member_id: string;
  service_fee: string;
  transport_fee: string;
  additional_fee: string;
  discount: string;
  dp_amount: string;
  paid_amount: string;
}

const emptyForm: FormData = {
  booking_id_code: '', customer_name: '', whatsapp: '', service_type: 'Pendampingan Pasien di RS',
  date: todayISO(), time: '', start_time: '', end_time: '', pickup_location: '', destination: '',
  city: 'Solo', notes: '', user_notes: '', internal_notes: '', status: 'Menunggu Konfirmasi',
  payment_status: 'Belum Bayar', payment_method: '', user_id: '', team_member_id: '',
  service_fee: '', transport_fee: '', additional_fee: '', discount: '', dp_amount: '', paid_amount: '',
};

export default function BookingPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [users, setUsers] = useState<DampingcareUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterService, setFilterService] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { state: confirmState, confirm, close: closeConfirm } = useConfirm();

  useEffect(() => { fetchAll(); }, []);
  async function fetchAll() {
    setLoading(true);
    const [b, t, u] = await Promise.all([
      supabase.from('bookings').select('*').order('date', { ascending: true }),
      supabase.from('teams').select('*'),
      supabase.from('users').select('*'),
    ]);
    if (b.data) setBookings(b.data as Booking[]);
    if (t.data) setTeam(t.data as TeamMember[]);
    if (u.data) setUsers(u.data as DampingcareUser[]);
    setLoading(false);
  }

  const filtered = useMemo(() => bookings.filter(b => {
    const ms = !search || b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      b.whatsapp.includes(search) || b.booking_id_code.toLowerCase().includes(search.toLowerCase()) ||
      b.pickup_location.toLowerCase().includes(search.toLowerCase());
    const mSv = !filterService || b.service_type === filterService;
    const mSt = !filterStatus || b.status === filterStatus;
    const mP = !filterPayment || b.payment_status === filterPayment;
    return ms && mSv && mSt && mP;
  }), [bookings, search, filterService, filterStatus, filterPayment]);

  const grouped = useMemo(() => {
    const map: Record<string, Booking[]> = {};
    for (const b of filtered) { if (!map[b.date]) map[b.date] = []; map[b.date].push(b); }
    return Object.keys(map).sort().reduce((r, k) => { r[k] = map[k]; return r; }, {} as Record<string, Booking[]>);
  }, [filtered]);

  const teamName = (id: string | null) => team.find(t => t.id === id)?.name || '-';
  const userName = (id: string | null) => users.find(u => u.id === id)?.name || '';

  function calcTotal(): number {
    const sf = parseFloat(form.service_fee) || 0;
    const tf = parseFloat(form.transport_fee) || 0;
    const af = parseFloat(form.additional_fee) || 0;
    const dc = parseFloat(form.discount) || 0;
    return sf + tf + af - dc;
  }

  function openAdd() {
    setForm({ ...emptyForm, booking_id_code: generateBookingId() });
    setEditId(null); setModalOpen(true);
  }
  function openEdit(b: Booking) {
    setForm({
      booking_id_code: b.booking_id_code || '', customer_name: b.customer_name, whatsapp: b.whatsapp,
      service_type: b.service_type, date: b.date, time: b.time, start_time: b.start_time || '', end_time: b.end_time || '',
      pickup_location: b.pickup_location, destination: b.destination, city: b.city, notes: b.notes,
      user_notes: b.user_notes || '', internal_notes: b.internal_notes || '', status: b.status,
      payment_status: b.payment_status || 'Belum Bayar', payment_method: b.payment_method || '',
      user_id: b.user_id || '', team_member_id: b.team_member_id || '',
      service_fee: String(b.service_fee || ''), transport_fee: String(b.transport_fee || ''),
      additional_fee: String(b.additional_fee || ''), discount: String(b.discount || ''),
      dp_amount: String(b.dp_amount || ''), paid_amount: String(b.paid_amount || ''),
    });
    setEditId(b.id); setModalOpen(true);
  }
  function openDetail(b: Booking) { setDetailBooking(b); setDetailOpen(true); }

  async function handleSave() {
    if (!form.customer_name.trim() || !form.date.trim()) return;
    setSaving(true);
    const total = calcTotal();
    const paid = parseFloat(form.paid_amount) || 0;
    const dp = parseFloat(form.dp_amount) || 0;
    const remaining = total - paid;
    const payload = {
      ...form, user_id: form.user_id || null, team_member_id: form.team_member_id || null,
      service_fee: parseFloat(form.service_fee) || 0, transport_fee: parseFloat(form.transport_fee) || 0,
      additional_fee: parseFloat(form.additional_fee) || 0, discount: parseFloat(form.discount) || 0,
      dp_amount: dp, paid_amount: paid, total_amount: total, remaining_balance: remaining,
    };
    if (editId) { await supabase.from('bookings').update(payload).eq('id', editId); }
    else { await supabase.from('bookings').insert(payload); }
    setSaving(false); setModalOpen(false); fetchAll();
  }
  function handleDelete(b: Booking) {
    confirm(`Yakin ingin menghapus booking "${b.customer_name}"? Data yang dihapus tidak dapat dikembalikan.`, async () => {
      await supabase.from('bookings').delete().eq('id', b.id);
      fetchAll();
    });
  }

  return (
    <div>
      <PageHeader title="Booking" subtitle="Kelola jadwal booking layanan Dampingcare" action={
        <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors"><CalendarPlus size={18} /> Tambah Booking</button>
      } />
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, WhatsApp, Booking ID..." className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" />
        </div>
        <Select value={filterService} onChange={setFilterService} options={SERVICE_TYPES as readonly string[]} placeholder="Semua Layanan" />
        <Select value={filterStatus} onChange={setFilterStatus} options={BOOKING_STATUS as readonly string[]} placeholder="Semua Status" />
        <Select value={filterPayment} onChange={setFilterPayment} options={PAYMENT_STATUS as readonly string[]} placeholder="Pembayaran" />
      </div>
      {loading ? <LoadingSpinner /> : filtered.length === 0 ? (
        <EmptyState title="Belum ada booking" message="Tambahkan booking baru dengan tombol Tambah Booking." />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, list]) => (
            <div key={date} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3">
                <CalendarPlus size={16} className="text-[#FB5EA8]" />
                <h3 className="text-sm font-bold text-gray-800">{getDayName(date)}, {formatDate(date)}</h3>
                <span className="ml-auto rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">{list.length} booking</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-sm">
                  <thead><tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                    <th className="px-4 py-3">Booking ID</th><th className="px-4 py-3">User</th><th className="px-4 py-3">Layanan</th><th className="px-4 py-3">Pendamping</th><th className="px-4 py-3">Waktu</th><th className="px-4 py-3">Lokasi</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Pembayaran</th><th className="px-4 py-3 text-right">Aksi</th>
                  </tr></thead>
                  <tbody>
                    {list.map(b => (
                      <tr key={b.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-mono text-xs text-gray-700">{b.booking_id_code || '-'}</td>
                        <td className="px-4 py-3"><p className="font-medium text-gray-900">{b.customer_name}</p>{b.whatsapp && <a href={`https://wa.me/${b.whatsapp.replace(/[^0-9]/g,'')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"><MessageCircle size={12} />{b.whatsapp}</a>}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{b.service_type}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{teamName(b.team_member_id)}</td>
                        <td className="px-4 py-3 text-gray-600">{b.time ? <span className="inline-flex items-center gap-1"><Clock size={14} className="text-gray-400" />{b.time}</span> : '-'}</td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{(b.pickup_location || b.destination) ? <span className="inline-flex items-center gap-1"><MapPin size={14} className="text-gray-400" />{[b.pickup_location, b.destination].filter(Boolean).join(' → ')}</span> : '-'}</td>
                        <td className="px-4 py-3"><StatusBadge status={b.status} /></td>
                        <td className="px-4 py-3"><StatusBadge status={b.payment_status} /></td>
                        <td className="px-4 py-3"><div className="flex justify-end gap-1">
                          <button onClick={() => openDetail(b)} className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-500 transition-colors" title="Detail"><Eye size={16} /></button>
                          <RowActions onEdit={() => openEdit(b)} onDelete={() => handleDelete(b)} />
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} title={editId ? 'Edit Booking' : 'Tambah Booking'} onClose={() => setModalOpen(false)} footer={
        <>
          <button onClick={() => setModalOpen(false)} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Batal</button>
          <button onClick={handleSave} disabled={saving || !form.customer_name.trim() || !form.date.trim()} className="flex-1 rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>
      }>
        <div className="space-y-4">
          <div className="rounded-lg bg-gray-50 px-3 py-2"><span className="text-xs text-gray-500">Booking ID</span><p className="font-mono text-sm font-bold text-gray-900">{form.booking_id_code}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nama User" required><Input value={form.customer_name} onChange={v => setForm({ ...form, customer_name: v })} placeholder="Nama lengkap" /></Field>
            <Field label="Pilih User"><select value={form.user_id} onChange={e => { const u = users.find(x => x.id === e.target.value); setForm({ ...form, user_id: e.target.value, customer_name: u?.name || form.customer_name, whatsapp: u?.whatsapp || form.whatsapp }); }} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"><option value="">- Pilih User -</option>{users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></Field>
          </div>
          <Field label="Nomor WhatsApp"><Input value={form.whatsapp} onChange={v => setForm({ ...form, whatsapp: v })} placeholder="08xx" /></Field>
          <Field label="Jenis Layanan" required><Select value={form.service_type} onChange={v => setForm({ ...form, service_type: v })} options={SERVICE_TYPES as readonly string[]} className="w-full" /></Field>
          <Field label="Pendamping"><select value={form.team_member_id} onChange={e => setForm({ ...form, team_member_id: e.target.value })} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"><option value="">- Belum Ditugaskan -</option>{team.map(t => <option key={t.id} value={t.id}>{t.name} ({t.role})</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tanggal" required><Input type="date" value={form.date} onChange={v => setForm({ ...form, date: v })} /></Field>
            <Field label="Waktu"><Input type="time" value={form.time} onChange={v => setForm({ ...form, time: v })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Waktu Mulai"><Input type="time" value={form.start_time} onChange={v => setForm({ ...form, start_time: v })} /></Field>
            <Field label="Waktu Selesai"><Input type="time" value={form.end_time} onChange={v => setForm({ ...form, end_time: v })} /></Field>
          </div>
          <Field label="Lokasi Penjemputan"><Input value={form.pickup_location} onChange={v => setForm({ ...form, pickup_location: v })} placeholder="Alamat penjemputan" /></Field>
          <Field label="Tujuan"><Input value={form.destination} onChange={v => setForm({ ...form, destination: v })} placeholder="Alamat tujuan / nama RS" /></Field>
          <Field label="Kota" required><Select value={form.city} onChange={v => setForm({ ...form, city: v })} options={CITIES as readonly string[]} className="w-full" /></Field>
          <div className="rounded-lg border border-gray-200 p-3 space-y-3">
            <p className="text-xs font-bold uppercase text-gray-400">Financial</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Service Fee"><Input type="number" value={form.service_fee} onChange={v => setForm({ ...form, service_fee: v })} placeholder="0" /></Field>
              <Field label="Transport Fee"><Input type="number" value={form.transport_fee} onChange={v => setForm({ ...form, transport_fee: v })} placeholder="0" /></Field>
              <Field label="Additional Fee"><Input type="number" value={form.additional_fee} onChange={v => setForm({ ...form, additional_fee: v })} placeholder="0" /></Field>
              <Field label="Discount"><Input type="number" value={form.discount} onChange={v => setForm({ ...form, discount: v })} placeholder="0" /></Field>
              <Field label="DP"><Input type="number" value={form.dp_amount} onChange={v => setForm({ ...form, dp_amount: v })} placeholder="0" /></Field>
              <Field label="Sudah Dibayar"><Input type="number" value={form.paid_amount} onChange={v => setForm({ ...form, paid_amount: v })} placeholder="0" /></Field>
            </div>
            <div className="flex justify-between border-t border-gray-100 pt-2 text-sm"><span className="text-gray-500">Total:</span><span className="font-bold text-gray-900">{formatCurrency(calcTotal())}</span></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Status Booking"><Select value={form.status} onChange={v => setForm({ ...form, status: v })} options={BOOKING_STATUS as readonly string[]} className="w-full" /></Field>
            <Field label="Status Pembayaran"><Select value={form.payment_status} onChange={v => setForm({ ...form, payment_status: v })} options={PAYMENT_STATUS as readonly string[]} className="w-full" /></Field>
          </div>
          <Field label="Metode Pembayaran"><Select value={form.payment_method} onChange={v => setForm({ ...form, payment_method: v })} options={PAYMENT_METHODS as readonly string[]} placeholder="- Pilih -" className="w-full" /></Field>
          <Field label="Catatan User"><textarea value={form.user_notes} onChange={e => setForm({ ...form, user_notes: e.target.value })} rows={2} placeholder="Catatan dari user" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
          <Field label="Catatan Internal"><textarea value={form.internal_notes} onChange={e => setForm({ ...form, internal_notes: e.target.value })} rows={2} placeholder="Catatan internal" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]" /></Field>
        </div>
      </Modal>

      <Modal open={detailOpen} title="Detail Booking" onClose={() => setDetailOpen(false)} footer={<button onClick={() => setDetailOpen(false)} className="w-full rounded-lg bg-[#FB5EA8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e54d97] transition-colors">Tutup</button>}>
        {detailBooking && (
          <div className="space-y-4">
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Booking</h4><div className="space-y-1 text-sm"><p><span className="text-gray-500">ID:</span> <span className="font-mono font-medium text-gray-900">{detailBooking.booking_id_code || '-'}</span></p><p><span className="text-gray-500">Tanggal:</span> {formatDate(detailBooking.date)} {detailBooking.time && `• ${detailBooking.time}`}</p><p><span className="text-gray-500">Status:</span> <StatusBadge status={detailBooking.status} /></p></div></div>
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">User</h4><div className="space-y-1 text-sm"><p><span className="text-gray-500">Nama:</span> <span className="font-medium text-gray-900">{detailBooking.customer_name}</span></p><p><span className="text-gray-500">WhatsApp:</span> {detailBooking.whatsapp || '-'}</p></div></div>
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Layanan</h4><div className="space-y-1 text-sm"><p><span className="text-gray-500">Layanan:</span> {detailBooking.service_type}</p><p><span className="text-gray-500">Pendamping:</span> {teamName(detailBooking.team_member_id)}</p></div></div>
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Lokasi</h4><div className="space-y-1 text-sm"><p><span className="text-gray-500">Penjemputan:</span> {detailBooking.pickup_location || '-'}</p><p><span className="text-gray-500">Tujuan:</span> {detailBooking.destination || '-'}</p><p><span className="text-gray-500">Kota:</span> {detailBooking.city}</p></div></div>
            <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Financial</h4><div className="space-y-1 text-sm"><p><span className="text-gray-500">Service Fee:</span> {formatCurrency(detailBooking.service_fee)}</p><p><span className="text-gray-500">Transport Fee:</span> {formatCurrency(detailBooking.transport_fee)}</p><p><span className="text-gray-500">Total:</span> <span className="font-bold text-gray-900">{formatCurrency(detailBooking.total_amount)}</span></p><p><span className="text-gray-500">Dibayar:</span> {formatCurrency(detailBooking.paid_amount)}</p><p><span className="text-gray-500">Sisa:</span> {formatCurrency(detailBooking.remaining_balance)}</p><p><span className="text-gray-500">Pembayaran:</span> <StatusBadge status={detailBooking.payment_status} /></p></div></div>
            {(detailBooking.user_notes || detailBooking.internal_notes) && <div><h4 className="text-xs font-bold uppercase text-gray-400 mb-2">Catatan</h4>{detailBooking.user_notes && <p className="text-sm text-gray-600 mb-1"><span className="text-gray-500">User:</span> {detailBooking.user_notes}</p>}{detailBooking.internal_notes && <p className="text-sm text-gray-600"><span className="text-gray-500">Internal:</span> {detailBooking.internal_notes}</p>}</div>}
          </div>
        )}
      </Modal>

      <ConfirmDialog open={confirmState.open} message={confirmState.message} onConfirm={() => { confirmState.onConfirm(); closeConfirm(); }} onCancel={closeConfirm} confirmLabel="Ya, Hapus" />
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-sm font-medium text-gray-700">{label}{required && <span className="text-[#FB5EA8]"> *</span>}</label>{children}</div>;
}
