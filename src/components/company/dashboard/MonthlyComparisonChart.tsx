import { useMemo, useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, LineChart as LineIcon } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  created_at: string;
}

interface MonthlyComparisonChartProps {
  transactions: Transaction[];
}

type ChartType = "bar" | "line";

export function MonthlyComparisonChart({ transactions }: MonthlyComparisonChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const chartData = useMemo(() => {
    const months: Date[] = [];
    for (let i = 5; i >= 0; i--) {
      months.push(subMonths(new Date(), i));
    }

    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthTransactions = transactions.filter(t => {
        const txDate = new Date(t.created_at);
        return isWithinInterval(txDate, { start: monthStart, end: monthEnd }) && t.status === 'paid';
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenses = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        name: format(month, 'MMM', { locale: pt }),
        fullMonth: format(month, 'MMMM yyyy', { locale: pt }),
        receita: income,
        despesas: expenses,
        lucro: income - expenses,
      };
    });
  }, [transactions]);

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    const tooltipStyle = {
      contentStyle: { 
        backgroundColor: 'hsl(var(--card))', 
        border: '1px solid hsl(var(--border))',
        borderRadius: '8px',
      },
      labelStyle: { color: 'hsl(var(--foreground))' },
      formatter: (value: number) => [`€${value.toFixed(2)}`, ''],
      labelFormatter: (label: string, payload: any[]) => payload[0]?.payload?.fullMonth || label,
    };

    if (chartType === "line") {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
          <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `€${value}`} />
          <Tooltip {...tooltipStyle} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="receita" 
            stroke="#aeca12" 
            strokeWidth={3}
            dot={{ fill: '#aeca12', strokeWidth: 2, r: 4 }}
            name="Receita" 
          />
          <Line 
            type="monotone" 
            dataKey="despesas" 
            stroke="#ef4444" 
            strokeWidth={3}
            dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
            name="Despesas" 
          />
          <Line 
            type="monotone" 
            dataKey="lucro" 
            stroke="#3b82f6" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
            name="Lucro" 
          />
        </LineChart>
      );
    }

    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `€${value}`} />
        <Tooltip {...tooltipStyle} />
        <Legend />
        <Bar dataKey="receita" fill="#aeca12" name="Receita" radius={[4, 4, 0, 0]} />
        <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 justify-end">
        <Button
          variant={chartType === "bar" ? "default" : "outline"}
          size="sm"
          onClick={() => setChartType("bar")}
          className="h-8 px-3"
        >
          <BarChart3 className="h-4 w-4" />
        </Button>
        <Button
          variant={chartType === "line" ? "default" : "outline"}
          size="sm"
          onClick={() => setChartType("line")}
          className="h-8 px-3"
        >
          <LineIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
