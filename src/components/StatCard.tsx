import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: string;
  subtitle?: string;
}

const COLOR_MAP: Record<string, string> = {
  pink: 'bg-pink-50 text-[#FB5EA8]',
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  gray: 'bg-gray-100 text-gray-600',
  red: 'bg-red-50 text-red-600',
  teal: 'bg-teal-50 text-teal-600',
};

export default function StatCard({ label, value, icon: Icon, color = 'pink', subtitle }: StatCardProps) {
  const colorClass = COLOR_MAP[color] || COLOR_MAP.pink;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-xl font-bold text-gray-900 truncate">{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
    </div>
  );
}
