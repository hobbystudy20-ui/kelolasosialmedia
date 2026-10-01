import { LucideIcon } from 'lucide-react';

export type PageKey =
  | 'dashboard'
  | 'tim'
  | 'booking'
  | 'user'
  | 'layanan'
  | 'area'
  | 'planner'
  | 'schedule'
  | 'caption'
  | 'evaluasi-sosmed'
  | 'pendapatan'
  | 'biaya-operasional'
  | 'pembayaran'
  | 'laporan-keuangan'
  | 'transportasi'
  | 'inventaris'
  | 'dokumen'
  | 'evaluasi-layanan'
  | 'evaluasi-kepuasan'
  | 'laporan-booking'
  | 'laporan-sosmed'
  | 'laporan-layanan'
  | 'kas';

export interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  groups: NavGroup[];
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}

export default function Sidebar({ groups, active, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FB5EA8] text-white font-bold text-sm">
          DC
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-gray-900">Dampingcare</p>
          <p className="text-xs text-gray-500">Management System</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-3">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">{group.title}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => onNavigate(item.key)}
                    className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#FB5EA8] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={16} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="px-5 py-3 border-t border-gray-200 flex-shrink-0">
        <p className="text-xs text-gray-400">Dampingcare Internal</p>
      </div>
    </aside>
  );
}
