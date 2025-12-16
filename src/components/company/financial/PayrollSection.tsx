import { useState, useEffect, useMemo } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { Users, Download, RefreshCw, Loader2, Calculator, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { DateRangeFilter, DateRange, FilterPreset } from "@/components/company/dashboard/DateRangeFilter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { exportPayrollReport } from "@/lib/pdfExport";

interface StaffPayroll {
  id: string;
  full_name: string;
  position: string | null;
  base_salary: number;
  commission_per_class: number;
  classes_count: number;
  commission: number;
  total: number;
}

interface PayrollSectionProps {
  companyId: string;
}

export function PayrollSection({ companyId }: PayrollSectionProps) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [staff, setStaff] = useState<StaffPayroll[]>([]);
  const [preset, setPreset] = useState<FilterPreset>("month");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Configurable rates
  const [baseSalary, setBaseSalary] = useState(800);
  const [commissionPerClass, setCommissionPerClass] = useState(15);

  useEffect(() => {
    fetchPayrollData();
  }, [companyId, dateRange]);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      // Fetch staff
      const { data: staffData } = await supabase
        .from('staff')
        .select('id, full_name, position')
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Fetch class schedules for each staff member in the date range
      const { data: schedules } = await supabase
        .from('class_schedules')
        .select(`
          id, instructor_id, scheduled_date,
          classes!inner(company_id)
        `)
        .eq('classes.company_id', companyId)
        .gte('scheduled_date', dateRange.from.toISOString().split('T')[0])
        .lte('scheduled_date', dateRange.to.toISOString().split('T')[0])
        .eq('status', 'completed');

      // Calculate classes per instructor
      const classesPerInstructor: Record<string, number> = {};
      (schedules || []).forEach((s: any) => {
        if (s.instructor_id) {
          classesPerInstructor[s.instructor_id] = (classesPerInstructor[s.instructor_id] || 0) + 1;
        }
      });

      // Build payroll data
      const payrollData: StaffPayroll[] = (staffData || []).map(s => {
        const classesCount = classesPerInstructor[s.id] || 0;
        const commission = classesCount * commissionPerClass;
        const total = baseSalary + commission;

        return {
          id: s.id,
          full_name: s.full_name,
          position: s.position,
          base_salary: baseSalary,
          commission_per_class: commissionPerClass,
          classes_count: classesCount,
          commission,
          total,
        };
      });

      setStaff(payrollData);
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalSalaries = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.total, 0);
  }, [staff]);

  const totalCommissions = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.commission, 0);
  }, [staff]);

  const totalClasses = useMemo(() => {
    return staff.reduce((sum, s) => sum + s.classes_count, 0);
  }, [staff]);

  const handleGeneratePayroll = async () => {
    setGenerating(true);
    try {
      // Create expense transactions for each staff member
      const transactions = staff
        .filter(s => s.total > 0)
        .map(s => ({
          company_id: companyId,
          type: 'expense',
          staff_id: s.id,
          description: `Salário - ${s.full_name} (${format(dateRange.from, 'MMM yyyy', { locale: pt })})`,
          amount: s.total,
          status: 'pending',
          due_date: endOfMonth(dateRange.from).toISOString().split('T')[0],
          notes: `Base: €${s.base_salary.toFixed(2)} | Comissões: €${s.commission.toFixed(2)} (${s.classes_count} aulas)`,
        }));

      if (transactions.length > 0) {
        const { error } = await supabase
          .from('financial_transactions')
          .insert(transactions);

        if (error) throw error;
        toast.success(`${transactions.length} transações de salário criadas`);
      } else {
        toast.info("Nenhum salário a gerar");
      }
    } catch (error: any) {
      console.error('Error generating payroll:', error);
      toast.error(error.message || "Erro ao gerar folha salarial");
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    await exportPayrollReport(staff, totalSalaries, dateRange);
    toast.success("PDF exportado com sucesso");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold">Folha Salarial</h3>
          <p className="text-sm text-muted-foreground">Calcule e gere os salários da equipa</p>
        </div>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          preset={preset}
          onPresetChange={setPreset}
        />
      </div>

      {/* Configuration */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            Configuração de Salários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseSalary">Salário Base (€)</Label>
              <Input
                id="baseSalary"
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(Number(e.target.value))}
                placeholder="800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="commissionPerClass">Comissão por Aula (€)</Label>
              <Input
                id="commissionPerClass"
                type="number"
                value={commissionPerClass}
                onChange={(e) => setCommissionPerClass(Number(e.target.value))}
                placeholder="15"
              />
            </div>
          </div>
          <Button className="mt-4" variant="outline" onClick={fetchPayrollData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Recalcular
          </Button>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Salários</p>
                <p className="text-xl font-bold">€{totalSalaries.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Calculator className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Comissões</p>
                <p className="text-xl font-bold text-green-600">€{totalCommissions.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Aulas</p>
                <p className="text-xl font-bold text-blue-600">{totalClasses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Funcionários ({staff.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <Download className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={handleGeneratePayroll} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wallet className="h-4 w-4 mr-2" />}
                Gerar Despesas
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum funcionário ativo</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead className="text-center">Aulas</TableHead>
                    <TableHead className="text-right">Base</TableHead>
                    <TableHead className="text-right">Comissões</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>
                        {s.position ? (
                          <Badge variant="outline">{s.position}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{s.classes_count}</Badge>
                      </TableCell>
                      <TableCell className="text-right">€{s.base_salary.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">€{s.commission.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">€{s.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
