import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ScheduleStatusChartProps {
  schedules: any[];
  dateRange: { from: Date; to: Date };
}

export function ScheduleStatusChart({ schedules, dateRange }: ScheduleStatusChartProps) {
  const chartData = useMemo(() => {
    const filtered = schedules.filter(s => {
      const date = new Date(s.scheduled_date);
      return date >= dateRange.from && date <= dateRange.to;
    });

    const scheduled = filtered.filter(s => s.status === 'scheduled' || !s.status).length;
    const completed = filtered.filter(s => s.status === 'completed').length;
    const cancelled = filtered.filter(s => s.status === 'cancelled').length;

    return [
      { name: 'Agendadas', value: scheduled, color: '#3b82f6' },
      { name: 'Concluídas', value: completed, color: '#22c55e' },
      { name: 'Canceladas', value: cancelled, color: '#ef4444' },
    ].filter(item => item.value > 0);
  }, [schedules, dateRange]);

  if (chartData.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
        Sem aulas no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={35}
          outerRadius={65}
          paddingAngle={5}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number, name: string) => [value, name]}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
