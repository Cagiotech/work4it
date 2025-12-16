import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface StudentsChartProps {
  activeCount: number;
  inactiveCount: number;
  pendingCount: number;
}

const COLORS = ['#aeca12', '#6b7280', '#f59e0b'];

export function StudentsChart({ activeCount, inactiveCount, pendingCount }: StudentsChartProps) {
  const data = useMemo(() => [
    { name: 'Ativos', value: activeCount, color: '#aeca12' },
    { name: 'Inativos', value: inactiveCount, color: '#6b7280' },
    { name: 'Pendentes', value: pendingCount, color: '#f59e0b' },
  ].filter(item => item.value > 0), [activeCount, inactiveCount, pendingCount]);

  if (data.length === 0) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Sem dados de alunos
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
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
