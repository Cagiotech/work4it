import { useMemo, useState } from "react";
import { 
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Button } from "@/components/ui/button";
import { BarChart3, PieChart as PieIcon } from "lucide-react";

interface ClassData {
  id: string;
  name: string;
  enrollments_count?: number;
  capacity?: number;
  is_active?: boolean;
}

interface ClassesChartProps {
  classes: ClassData[];
  schedules: any[];
}

type ChartType = "bar" | "pie";

const COLORS = ['#aeca12', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'];

export function ClassesChart({ classes, schedules }: ClassesChartProps) {
  const [chartType, setChartType] = useState<ChartType>("bar");

  const chartData = useMemo(() => {
    // Count schedules per class
    const classScheduleCounts: Record<string, number> = {};
    schedules.forEach(s => {
      const classId = s.class_id || s.class?.id;
      if (classId) {
        classScheduleCounts[classId] = (classScheduleCounts[classId] || 0) + 1;
      }
    });

    return classes
      .filter(c => c.is_active !== false)
      .map((c, index) => ({
        name: c.name.length > 15 ? c.name.slice(0, 15) + '...' : c.name,
        fullName: c.name,
        agendamentos: classScheduleCounts[c.id] || 0,
        capacidade: c.capacity || 0,
        fill: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.agendamentos - a.agendamentos)
      .slice(0, 8);
  }, [classes, schedules]);

  const renderChart = () => {
    if (chartType === "pie") {
      return (
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={40}
            outerRadius={80}
            dataKey="agendamentos"
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
            formatter={(value: number, name: string, props: any) => [value, props.payload.fullName]}
          />
        </PieChart>
      );
    }

    return (
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="name" 
          className="text-xs" 
          tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: number, name: string, props: any) => [value, props.payload.fullName]}
        />
        <Legend />
        <Bar dataKey="agendamentos" fill="#aeca12" name="Agendamentos" radius={[4, 4, 0, 0]} />
      </BarChart>
    );
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        Sem dados de aulas
      </div>
    );
  }

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
          variant={chartType === "pie" ? "default" : "outline"}
          size="sm"
          onClick={() => setChartType("pie")}
          className="h-8 px-3"
        >
          <PieIcon className="h-4 w-4" />
        </Button>
      </div>
      
      <ResponsiveContainer width="100%" height={250}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
