import { LucideIcon } from 'lucide-react';
import { PageKey, NavItem } from './Sidebar';

interface BottomNavProps {
  items: NavItem[];
  active: PageKey;
  onNavigate: (key: PageKey) => void;
}

export default function BottomNav({ items, active, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden border-t border-gray-200 bg-white">
      <div className="flex">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                isActive ? 'text-[#FB5EA8]' : 'text-gray-400'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export type { PageKey, NavItem };
