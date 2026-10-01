import { useState } from 'react';
import {
  LayoutDashboard, Users, CalendarPlus, UserCircle, Package, MapPin,
  CalendarRange, Clock, FileText, BarChart3,
  TrendingUp, TrendingDown, Wallet, FileBarChart,
  Car, PackageCheck, FileStack,
  ClipboardCheck, Star,
  FileSpreadsheet, Share2, ClipboardList,
} from 'lucide-react';
import Sidebar, { PageKey, NavGroup } from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import DashboardPage from '@/pages/DashboardPage';
import TimPage from '@/pages/TimPage';
import BookingPage from '@/pages/BookingPage';
import UserPage from '@/pages/UserPage';
import ServicePage from '@/pages/ServicePage';
import AreaPage from '@/pages/AreaPage';
import PlannerPage from '@/pages/PlannerPage';
import SchedulePage from '@/pages/SchedulePage';
import CaptionPage from '@/pages/CaptionPage';
import EvaluasiSosmedPage from '@/pages/EvaluasiSosmedPage';
import PendapatanPage from '@/pages/PendapatanPage';
import BiayaOperasionalPage from '@/pages/BiayaOperasionalPage';
import PembayaranPage from '@/pages/PembayaranPage';
import LaporanKeuanganPage from '@/pages/LaporanKeuanganPage';
import TransportasiPage from '@/pages/TransportasiPage';
import InventarisPage from '@/pages/InventarisPage';
import DokumenPage from '@/pages/DokumenPage';
import EvaluasiLayananPage from '@/pages/EvaluasiLayananPage';
import EvaluasiKepuasanPage from '@/pages/EvaluasiKepuasanPage';
import LaporanBookingPage from '@/pages/LaporanBookingPage';
import LaporanSosmedPage from '@/pages/LaporanSosmedPage';
import LaporanLayananPage from '@/pages/LaporanLayananPage';

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'DASHBOARD',
    items: [{ key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'TIM & LAYANAN',
    items: [
      { key: 'tim', label: 'Daftar Tim', icon: Users },
      { key: 'booking', label: 'Booking', icon: CalendarPlus },
      { key: 'user', label: 'User', icon: UserCircle },
      { key: 'layanan', label: 'Daftar Layanan', icon: Package },
      { key: 'area', label: 'Area Layanan', icon: MapPin },
    ],
  },
  {
    title: 'SOSMED',
    items: [
      { key: 'planner', label: 'Content Planner', icon: CalendarRange },
      { key: 'schedule', label: 'Content Schedule', icon: Clock },
      { key: 'caption', label: 'Bank Caption', icon: FileText },
      { key: 'evaluasi-sosmed', label: 'Evaluasi Sosmed', icon: BarChart3 },
    ],
  },
  {
    title: 'KEUANGAN',
    items: [
      { key: 'pendapatan', label: 'Pendapatan', icon: TrendingUp },
      { key: 'biaya-operasional', label: 'Biaya Operasional', icon: TrendingDown },
      { key: 'pembayaran', label: 'Pembayaran', icon: Wallet },
      { key: 'laporan-keuangan', label: 'Laporan Keuangan', icon: FileBarChart },
    ],
  },
  {
    title: 'OPERASIONAL',
    items: [
      { key: 'transportasi', label: 'Transportasi', icon: Car },
      { key: 'inventaris', label: 'Inventaris', icon: PackageCheck },
      { key: 'dokumen', label: 'Dokumen & SOP', icon: FileStack },
    ],
  },
  {
    title: 'EVALUASI',
    items: [
      { key: 'evaluasi-layanan', label: 'Evaluasi Layanan', icon: ClipboardCheck },
      { key: 'evaluasi-kepuasan', label: 'Evaluasi Kepuasan User', icon: Star },
    ],
  },
  {
    title: 'LAPORAN',
    items: [
      { key: 'laporan-booking', label: 'Laporan Booking', icon: FileSpreadsheet },
      { key: 'laporan-sosmed', label: 'Laporan Sosmed', icon: Share2 },
      { key: 'laporan-keuangan', label: 'Laporan Keuangan', icon: FileBarChart },
      { key: 'laporan-layanan', label: 'Laporan Layanan', icon: ClipboardList },
    ],
  },
];

const MOBILE_ITEMS = NAV_GROUPS.flatMap(g => g.items).slice(0, 5);

function App() {
  const [active, setActive] = useState<PageKey>('dashboard');

  const pageMap: Record<PageKey, React.ReactNode> = {
    'dashboard': <DashboardPage />,
    'tim': <TimPage />,
    'booking': <BookingPage />,
    'user': <UserPage />,
    'layanan': <ServicePage />,
    'area': <AreaPage />,
    'planner': <PlannerPage />,
    'schedule': <SchedulePage />,
    'caption': <CaptionPage />,
    'evaluasi-sosmed': <EvaluasiSosmedPage />,
    'pendapatan': <PendapatanPage />,
    'biaya-operasional': <BiayaOperasionalPage />,
    'pembayaran': <PembayaranPage />,
    'laporan-keuangan': <LaporanKeuanganPage />,
    'transportasi': <TransportasiPage />,
    'inventaris': <InventarisPage />,
    'dokumen': <DokumenPage />,
    'evaluasi-layanan': <EvaluasiLayananPage />,
    'evaluasi-kepuasan': <EvaluasiKepuasanPage />,
    'laporan-booking': <LaporanBookingPage />,
    'laporan-sosmed': <LaporanSosmedPage />,
    'laporan-layanan': <LaporanLayananPage />,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar groups={NAV_GROUPS} active={active} onNavigate={setActive} />
      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <h1 className="text-base font-bold text-gray-900 md:text-lg">Dampingcare Management System</h1>
        </header>
        <main className="px-4 py-5 pb-24 md:px-6 md:pb-6">
          {pageMap[active]}
        </main>
      </div>
      <BottomNav items={MOBILE_ITEMS} active={active} onNavigate={setActive} />
    </div>
  );
}

export default App;
