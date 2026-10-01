import { PeriodKey } from '@/lib/constants';

interface PeriodSelectorProps {
  period: PeriodKey;
  onChange: (p: PeriodKey) => void;
  customStart?: string;
  customEnd?: string;
  onCustomChange?: (start: string, end: string) => void;
}

const PERIOD_LABELS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hari Ini' },
  { key: 'week', label: 'Minggu Ini' },
  { key: 'month', label: 'Bulan Ini' },
  { key: 'custom', label: 'Custom' },
];

export default function PeriodSelector({ period, onChange, customStart, customEnd, onCustomChange }: PeriodSelectorProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
        {PERIOD_LABELS.map((p) => (
          <button
            key={p.key}
            onClick={() => onChange(p.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              period === p.key
                ? 'bg-[#FB5EA8] text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {period === 'custom' && onCustomChange && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStart || ''}
            onChange={(e) => onCustomChange(e.target.value, customEnd || '')}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
          />
          <span className="text-sm text-gray-400">s/d</span>
          <input
            type="date"
            value={customEnd || ''}
            onChange={(e) => onCustomChange(customStart || '', e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-[#FB5EA8] focus:outline-none focus:ring-1 focus:ring-[#FB5EA8]"
          />
        </div>
      )}
    </div>
  );
}
