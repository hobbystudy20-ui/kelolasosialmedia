import { LucideIcon } from 'lucide-react';
import { PageKey, NavItem } from './Sidebar';

interface BottomNavProps {
  items: NavItem[];
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}

export default function BottomNav({ items, active, onNavigate }: BottomNavProps) {
  const displayItems = items.slice(0, 5);
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-gray-200 bg-white">
      <div className="flex">
        {displayItems.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#FB5EA8]' : 'text-gray-400'
              }`}
            >
              <Icon size={18} />
              <span className="truncate max-w-full">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export type { PageKey, NavItem };
