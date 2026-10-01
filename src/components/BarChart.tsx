interface BarChartProps {
  data: { label: string; value: number }[];
  color?: string;
  height?: number;
}

export default function BarChart({ data, color = '#FB5EA8', height = 180 }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const h = (d.value / max) * (height - 30);
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-end justify-center" style={{ height: height - 25 }}>
              <div
                className="w-full max-w-[40px] rounded-t-md transition-all"
                style={{ height: Math.max(h, 2), backgroundColor: color, opacity: d.value > 0 ? 1 : 0.15 }}
                title={`${d.label}: ${d.value}`}
              />
            </div>
            <span className="text-[10px] font-medium text-gray-500 truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
