import { LucideIcon } from 'lucide-react';

export type PageKey = 'tim' | 'planner' | 'schedule' | 'caption';

export interface NavItem {
  key: PageKey;
  label: string;
  icon: LucideIcon;
}

interface SidebarProps {
  items: NavItem[];
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}

export default function Sidebar({ items, active, onNavigate }: SidebarProps) {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r border-gray-200 bg-white">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-200">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FB5EA8] text-white font-bold text-sm">
          DC
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-gray-900">Dampingcare</p>
          <p className="text-xs text-gray-500">Sosmed Manager</p>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex items-center gap-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#FB5EA8] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
      <div className="px-5 py-4 border-t border-gray-200">
        <p className="text-xs text-gray-400">Kelola Sosmed Dampingcare</p>
      </div>
    </aside>
  );
}
