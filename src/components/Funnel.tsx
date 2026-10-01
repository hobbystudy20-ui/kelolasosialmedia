import { LucideIcon } from 'lucide-react';

interface FunnelStep {
  label: string;
  value: number;
  icon?: LucideIcon;
}

interface FunnelProps {
  steps: FunnelStep[];
}

export default function Funnel({ steps }: FunnelProps) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const pct = (step.value / max) * 100;
        const conversion = i > 0 && steps[i - 1].value > 0
          ? ((step.value / steps[i - 1].value) * 100).toFixed(1)
          : null;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-28 flex-shrink-0 text-right">
              <span className="text-xs font-medium text-gray-600">{step.label}</span>
            </div>
            <div className="flex-1">
              <div className="relative h-8 rounded-lg bg-gray-100 overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-lg transition-all"
                  style={{ width: `${pct}%`, backgroundColor: '#FB5EA8', opacity: 0.85 }}
                />
                <div className="relative flex h-full items-center justify-between px-3">
                  <span className="text-xs font-bold text-gray-700">{step.value.toLocaleString('id-ID')}</span>
                  {conversion && (
                    <span className="text-[10px] text-gray-500">{conversion}%</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
