import { useMemo } from "react";
import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DateRange, FilterPreset } from "./DateRangeFilter";

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

export function RevenueChart({ transactions, dateRange, preset }: RevenueChartProps) {
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

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: number) => [`€${value.toFixed(2)}`, '']}
        />
        <Area type="monotone" dataKey="receita" stroke="#aeca12" fillOpacity={1} fill="url(#colorReceita)" name="Receita" />
        <Area type="monotone" dataKey="despesas" stroke="#ef4444" fillOpacity={1} fill="url(#colorDespesas)" name="Despesas" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
