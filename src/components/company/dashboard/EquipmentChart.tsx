import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface EquipmentChartProps {
  operationalCount: number;
  maintenanceCount: number;
  brokenCount: number;
}

export function EquipmentChart({ operationalCount, maintenanceCount, brokenCount }: EquipmentChartProps) {
  const data = useMemo(() => [
    { name: 'Operacional', value: operationalCount, color: '#22c55e' },
    { name: 'Manutenção', value: maintenanceCount, color: '#f59e0b' },
    { name: 'Avariado', value: brokenCount, color: '#ef4444' },
  ].filter(item => item.value > 0), [operationalCount, maintenanceCount, brokenCount]);

  if (data.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-muted-foreground">
        Sem dados de equipamentos
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
