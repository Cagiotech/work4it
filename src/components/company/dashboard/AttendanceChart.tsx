import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface AttendanceChartProps {
  enrollments: any[];
  dateRange: { from: Date; to: Date };
}

export function AttendanceChart({ enrollments, dateRange }: AttendanceChartProps) {
  const chartData = useMemo(() => {
    const filtered = enrollments.filter(e => {
      if (!e.enrolled_at) return false;
      const date = new Date(e.enrolled_at);
      return date >= dateRange.from && date <= dateRange.to;
    });

    const attended = filtered.filter(e => e.attended_at).length;
    const notAttended = filtered.filter(e => !e.attended_at && e.status !== 'cancelled').length;
    const cancelled = filtered.filter(e => e.status === 'cancelled').length;

    return [
      { name: 'Presentes', value: attended, color: '#22c55e' },
      { name: 'Ausentes', value: notAttended, color: '#ef4444' },
      { name: 'Cancelados', value: cancelled, color: '#6b7280' },
    ].filter(item => item.value > 0);
  }, [enrollments, dateRange]);

  if (chartData.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Sem dados de presença
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 60, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis type="category" dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [value, 'Total']}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
