import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface CategoryBreakdownChartProps {
  categoryBreakdown: Record<string, number>;
  totalIncome: number;
}

const COLORS = ['#aeca12', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

export function CategoryBreakdownChart({ categoryBreakdown, totalIncome }: CategoryBreakdownChartProps) {
  const chartData = useMemo(() => {
    return Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .map(([category, amount], index) => ({
        name: category,
        value: amount,
        percentage: totalIncome > 0 ? ((amount / totalIncome) * 100).toFixed(1) : 0,
        color: COLORS[index % COLORS.length],
      }));
  }, [categoryBreakdown, totalIncome]);

  if (chartData.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        Sem dados de categorias
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
          label={({ name, percentage }) => `${name} (${percentage}%)`}
          labelLine={true}
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
          formatter={(value: number) => [`€${value.toFixed(2)}`, 'Valor']}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
