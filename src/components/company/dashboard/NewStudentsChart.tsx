import { useMemo } from "react";
import { format, eachDayOfInterval, eachWeekOfInterval, isSameDay, isSameWeek, startOfWeek } from "date-fns";
import { pt } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface NewStudentsChartProps {
  students: any[];
  dateRange: { from: Date; to: Date };
}

export function NewStudentsChart({ students, dateRange }: NewStudentsChartProps) {
  const chartData = useMemo(() => {
    const daysDiff = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
    
    let intervals: Date[];
    let formatStr: string;
    let compareFn: (date1: Date, date2: Date) => boolean;

    if (daysDiff <= 14) {
      intervals = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      formatStr = "dd/MM";
      compareFn = isSameDay;
    } else {
      intervals = eachWeekOfInterval({ start: dateRange.from, end: dateRange.to });
      formatStr = "'Sem' w";
      compareFn = (date1, date2) => isSameWeek(date1, date2, { weekStartsOn: 1 });
    }

    return intervals.map(interval => {
      const count = students.filter(s => {
        const createdAt = new Date(s.created_at);
        return compareFn(createdAt, interval);
      }).length;

      return {
        name: format(interval, formatStr, { locale: pt }),
        novos: count,
      };
    });
  }, [students, dateRange]);

  if (chartData.every(d => d.novos === 0)) {
    return (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Sem novos alunos no período
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
        <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          formatter={(value: number) => [value, 'Novos Alunos']}
        />
        <Bar dataKey="novos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
