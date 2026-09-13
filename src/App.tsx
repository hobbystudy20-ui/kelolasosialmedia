import { useState } from 'react';
import { Users, CalendarRange, Clock, FileText, CalendarPlus } from 'lucide-react';
import Sidebar, { PageKey, NavItem } from '@/components/Sidebar';
import BottomNav from '@/components/BottomNav';
import TimPage from '@/pages/TimPage';
import PlannerPage from '@/pages/PlannerPage';
import SchedulePage from '@/pages/SchedulePage';
import CaptionPage from '@/pages/CaptionPage';
import BookingPage from '@/pages/BookingPage';

const NAV_ITEMS: NavItem[] = [
  { key: 'tim', label: 'Daftar Tim', icon: Users },
  { key: 'planner', label: 'Content Planner', icon: CalendarRange },
  { key: 'schedule', label: 'Content Schedule', icon: Clock },
  { key: 'caption', label: 'Bank Caption', icon: FileText },
  { key: 'booking', label: 'Booking', icon: CalendarPlus },
];

function App() {
  const [active, setActive] = useState<PageKey>('tim');

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={NAV_ITEMS} active={active} onNavigate={setActive} />

      <div className="md:pl-60">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/95 px-4 backdrop-blur md:px-6">
          <h1 className="text-base font-bold text-gray-900 md:text-lg">
            Kelola Sosmed Dampingcare
          </h1>
        </header>

        <main className="px-4 py-5 pb-24 md:px-6 md:pb-6">
          {active === 'tim' && <TimPage />}
          {active === 'planner' && <PlannerPage />}
          {active === 'schedule' && <SchedulePage />}
          {active === 'caption' && <CaptionPage />}
          {active === 'booking' && <BookingPage />}
        </main>
      </div>

      <BottomNav items={NAV_ITEMS} active={active} onNavigate={setActive} />
    </div>
  );
}

export default App;
