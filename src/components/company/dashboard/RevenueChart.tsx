import { useMemo, useState } from "react";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { DateRange, FilterPreset } from "./DateRangeFilter";
import { Button } from "@/components/ui/button";
import { AreaChart as AreaIcon, BarChart3, LineChart as LineIcon } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  created_at: string;
  status: string;
}

interface RevenueChartProps {
  transactions: Transaction[];
  dateRange: DateRange;
  preset: FilterPreset;
}

type ChartType = "area" | "bar" | "line";

export function RevenueChart({ transactions, dateRange, preset }: RevenueChartProps) {
  const [chartType, setChartType] = useState<ChartType>("area");

  const chartData = useMemo(() => {
    const paidTransactions = transactions.filter(t => t.status === 'paid');
    
    // Determine grouping based on date range
    let intervals: Date[];
    let formatStr: string;
    let compareFn: (date1: Date, date2: Date) => boolean;

    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 7) {
      intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      formatStr = "EEE";
      compareFn = isSameDay;
    } else if (daysDiff <= 31) {
      intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      formatStr = "dd/MM";
      compareFn = isSameDay;
    } else if (daysDiff <= 90) {
      intervals = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });
      formatStr = "'Sem' w";
      compareFn = isSameWeek;
    } else {
      intervals = eachMonthOfInterval({ start: dateRange.from, end: dateRange.to });
      formatStr = "MMM";
      compareFn = isSameMonth;
    }

    return intervals.map(interval => {
      const income = paidTransactions
        .filter(t => t.type === 'income' && compareFn(new Date(t.created_at), interval))
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      const expenses = paidTransactions
        .filter(t => t.type === 'expense' && compareFn(new Date(t.created_at), interval))
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        name: format(interval, formatStr, { locale: pt }),
        receita: income,
        despesas: expenses,
        lucro: income - expenses,
      };
    });
  }, [transactions, dateRange, preset]);

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
      formatter: (value: number) => [`€${value.toFixed(2)}`, '']
    };

    switch (chartType) {
      case "bar":
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
      
      case "line":
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
              activeDot={{ r: 6 }}
              name="Receita" 
            />
            <Line 
              type="monotone" 
              dataKey="despesas" 
              stroke="#ef4444" 
              strokeWidth={3}
              dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6 }}
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
      
      default: // area
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#aeca12" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#aeca12" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(value) => `€${value}`} />
            <Tooltip {...tooltipStyle} />
            <Legend />
            <Area type="monotone" dataKey="receita" stroke="#aeca12" fillOpacity={1} fill="url(#colorReceita)" name="Receita" />
            <Area type="monotone" dataKey="despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesas)" name="Despesas" />
          </AreaChart>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex gap-1 justify-end">
        <Button
          variant={chartType === "area" ? "default" : "outline"}
          size="sm"
          onClick={() => setChartType("area")}
          className="h-8 px-3"
        >
          <AreaIcon className="h-4 w-4" />
        </Button>
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
      
      {/* Chart */}
      <ResponsiveContainer width="100%" height={300}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
