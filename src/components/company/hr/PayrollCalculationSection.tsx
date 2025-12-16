import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, Download, FileText, Loader2, DollarSign, Users, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";

interface Staff {
  id: string;
  full_name: string;
  position: string | null;
}

interface PaymentConfig {
  staff_id: string;
  payment_type: string;
  base_salary: number | null;
  hourly_rate: number | null;
  daily_rate: number | null;
  per_class_rate: number | null;
  commission_percentage: number | null;
}

interface PayrollItem {
  staffId: string;
  staffName: string;
  position: string;
  paymentType: string;
  baseSalary: number;
  classesCount: number;
  classesValue: number;
  hoursWorked: number;
  hoursValue: number;
  commission: number;
  total: number;
}

export function PayrollCalculationSection() {
  const { company } = useAuth();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [payrollItems, setPayrollItems] = useState<PayrollItem[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("__all__");
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchData();
  }, [company?.id]);

  const fetchData = async () => {
    if (!company?.id) return;
    setLoading(true);
    try {
      const [staffRes, configsRes] = await Promise.all([
        supabase.from('staff').select('id, full_name, position').eq('company_id', company.id).eq('is_active', true).order('full_name'),
        supabase.from('staff_payment_config').select('*')
      ]);

      if (staffRes.data) setStaff(staffRes.data);
      if (configsRes.data) setPaymentConfigs(configsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePayroll = async () => {
    if (!company?.id) return;
    setCalculating(true);

    try {
      // Filter staff based on selection
      const targetStaff = selectedStaffId === "__all__" 
        ? staff 
        : staff.filter(s => s.id === selectedStaffId);

      // Fetch time records for the period
      const { data: timeRecords } = await supabase
        .from('staff_time_records')
        .select('staff_id, total_hours')
        .eq('company_id', company.id)
        .gte('clock_in', dateRange.start)
        .lte('clock_in', dateRange.end + 'T23:59:59')
        .eq('status', 'completed');

      // Fetch class schedules for the period (for instructors)
      const { data: classSchedules } = await supabase
        .from('class_schedules')
        .select('instructor_id')
        .gte('scheduled_date', dateRange.start)
        .lte('scheduled_date', dateRange.end)
        .eq('status', 'completed');

      const payroll: PayrollItem[] = targetStaff.map((s) => {
        const config = paymentConfigs.find(c => c.staff_id === s.id);
        
        // Calculate hours worked
        const staffTimeRecords = timeRecords?.filter(r => r.staff_id === s.id) || [];
        const hoursWorked = staffTimeRecords.reduce((acc, r) => acc + (r.total_hours || 0), 0);
        
        // Calculate classes count
        const classesCount = classSchedules?.filter(c => c.instructor_id === s.id).length || 0;

        let baseSalary = 0;
        let classesValue = 0;
        let hoursValue = 0;
        let commission = 0;

        if (config) {
          switch (config.payment_type) {
            case 'monthly':
              baseSalary = config.base_salary || 0;
              break;
            case 'hourly':
              hoursValue = hoursWorked * (config.hourly_rate || 0);
              break;
            case 'daily':
              // Assume 8 hours = 1 day
              const daysWorked = Math.ceil(hoursWorked / 8);
              hoursValue = daysWorked * (config.daily_rate || 0);
              break;
            case 'per_class':
              classesValue = classesCount * (config.per_class_rate || 0);
              break;
            case 'commission':
              // Commission would need revenue data - simplified here
              commission = 0;
              break;
          }
        }

        // Add per_class_rate bonus for monthly/hourly workers who give classes
        if (config?.payment_type !== 'per_class' && classesCount > 0 && config?.per_class_rate) {
          classesValue = classesCount * config.per_class_rate;
        }

        return {
          staffId: s.id,
          staffName: s.full_name,
          position: s.position || '-',
          paymentType: config?.payment_type || 'monthly',
          baseSalary,
          classesCount,
          classesValue,
          hoursWorked: Math.round(hoursWorked * 10) / 10,
          hoursValue,
          commission,
          total: baseSalary + classesValue + hoursValue + commission,
        };
      });

      setPayrollItems(payroll);
      toast.success('Folha de pagamento calculada!');
    } catch (error) {
      console.error('Error calculating payroll:', error);
      toast.error('Erro ao calcular folha de pagamento');
    } finally {
      setCalculating(false);
    }
  };

  const createPayrollTransactions = async () => {
    if (!company?.id || payrollItems.length === 0) return;

    try {
      const transactions = payrollItems
        .filter(item => item.total > 0)
        .map(item => ({
          company_id: company.id,
          type: 'expense',
          description: `Salário - ${item.staffName} (${format(new Date(dateRange.start), "MMMM yyyy", { locale: pt })})`,
          amount: item.total,
          staff_id: item.staffId,
          status: 'pending',
          due_date: dateRange.end,
        }));

      const { error } = await supabase.from('financial_transactions').insert(transactions);
      if (error) throw error;

      toast.success('Transações de folha de pagamento criadas!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao criar transações');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const getPaymentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      monthly: 'Mensal',
      hourly: 'Por Hora',
      daily: 'Diário',
      per_class: 'Por Aula',
      commission: 'Comissão',
    };
    return labels[type] || type;
  };

  const totalPayroll = payrollItems.reduce((acc, item) => acc + item.total, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range and Calculate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Calcular Folha de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label>Colaborador</Label>
              <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Selecionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Todos os Colaboradores
                    </span>
                  </SelectItem>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {s.full_name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              />
            </div>
            <Button onClick={calculatePayroll} disabled={calculating} className="gap-2">
              {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
              Calcular
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {payrollItems.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Colaboradores</p>
                  <p className="text-2xl font-bold">{payrollItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Folha</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalPayroll)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Período</p>
                  <p className="text-lg font-medium">
                    {format(new Date(dateRange.start), "dd/MM")} - {format(new Date(dateRange.end), "dd/MM/yyyy")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Table */}
      {payrollItems.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Detalhamento da Folha</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exportar PDF
              </Button>
              <Button size="sm" onClick={createPayrollTransactions} className="gap-2">
                <DollarSign className="h-4 w-4" />
                Criar Transações
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Aulas</TableHead>
                  <TableHead className="text-right">Horas</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollItems.map((item) => (
                  <TableRow key={item.staffId}>
                    <TableCell className="font-medium">{item.staffName}</TableCell>
                    <TableCell>{item.position}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getPaymentTypeLabel(item.paymentType)}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {item.baseSalary > 0 ? formatCurrency(item.baseSalary) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.classesCount > 0 ? (
                        <span>{item.classesCount}x = {formatCurrency(item.classesValue)}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.hoursWorked > 0 ? (
                        <span>{item.hoursWorked}h = {formatCurrency(item.hoursValue)}</span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(item.total)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={6} className="text-right font-bold">Total</TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {formatCurrency(totalPayroll)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {payrollItems.length === 0 && !calculating && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione o período e clique em "Calcular" para gerar a folha de pagamento.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
