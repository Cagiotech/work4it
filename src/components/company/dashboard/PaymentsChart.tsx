import { useMemo, useState } from "react";
import { 
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart as PieIcon } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface PaymentsChartProps {
  transactions: Transaction[];
}

type ChartType = "pie" | "bar";

const STATUS_COLORS = {
  paid: '#22c55e',
  pending: '#f59e0b', 
  overdue: '#ef4444',
  cancelled: '#6b7280',
};

const STATUS_LABELS: Record<string, string> = {
  paid: 'Pago',
  pending: 'Pendente',
  overdue: 'Atrasado',
  cancelled: 'Cancelado',
};

export function PaymentsChart({ transactions }: PaymentsChartProps) {
  const [chartType, setChartType] = useState<ChartType>("pie");

  const chartData = useMemo(() => {
    const statusCounts: Record<string, { count: number; amount: number }> = {};
    
    transactions.forEach(t => {
      if (!statusCounts[t.status]) {
        statusCounts[t.status] = { count: 0, amount: 0 };
      }
      statusCounts[t.status].count++;
      statusCounts[t.status].amount += Number(t.amount);
    });

    return Object.entries(statusCounts).map(([status, data]) => ({
      name: STATUS_LABELS[status] || status,
      status,
      quantidade: data.count,
      valor: data.amount,
      fill: STATUS_COLORS[status as keyof typeof STATUS_COLORS] || '#6b7280',
    }));
  }, [transactions]);

  const renderChart = () => {
    if (chartType === "bar") {
      return (
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="name" 
            className="text-xs" 
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
            formatter={(value: number, name: string) => {
              if (name === 'valor') return [`€${value.toFixed(2)}`, 'Valor'];
              return [value, 'Quantidade'];
            }}
          />
          <Legend />
          <Bar dataKey="quantidade" name="Quantidade" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      );
    }

    return (
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          dataKey="valor"
          nameKey="name"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
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
        <Legend />
      </PieChart>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        Sem dados de pagamentos
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 justify-end">
        <Button
          variant={chartType === "pie" ? "default" : "outline"}
          size="sm"
          onClick={() => setChartType("pie")}
          className="h-8 px-3"
        >
          <PieIcon className="h-4 w-4" />
        </Button>
        <Button
          variant={chartType === "bar" ? "default" : "outline"}
          size="sm"
          onClick={() => setChartType("bar")}
          className="h-8 px-3"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
