import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface StaffChartProps {
  activeCount: number;
  inactiveCount: number;
}

const COLORS = ['#22c55e', '#6b7280'];

export function StaffChart({ activeCount, inactiveCount }: StaffChartProps) {
  const data = useMemo(() => [
    { name: 'Ativos', value: activeCount, color: '#22c55e' },
    { name: 'Inativos', value: inactiveCount, color: '#6b7280' },
  ].filter(item => item.value > 0), [activeCount, inactiveCount]);

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
        Sem dados de equipa
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={35}
          outerRadius={65}
          paddingAngle={5}
          dataKey="value"
        >
          {data.map((entry, index) => (
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
