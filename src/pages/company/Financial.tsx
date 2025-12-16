import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Receipt, Download, Plus, Trash2, Pencil, Tag, Loader2, RefreshCw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DateRangeFilter, DateRange, FilterPreset } from "@/components/company/dashboard/DateRangeFilter";
import { CategoryDialog } from "@/components/company/financial/CategoryDialog";
import { TransactionDialog } from "@/components/company/financial/TransactionDialog";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  type: string;
  color: string;
  is_active: boolean;
}

interface Transaction {
  id: string;
  type: string;
  category_id: string | null;
  student_id: string | null;
  staff_id: string | null;
  subscription_id: string | null;
  description: string;
  amount: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  category?: { id: string; name: string; type: string; color: string } | null;
  student?: { full_name: string } | null;
  staff?: { full_name: string } | null;
}

export default function Financial() {
  const { t } = useTranslation();
  const { company } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [preset, setPreset] = useState<FilterPreset>("month");
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<{ id: string; full_name: string }[]>([]);
  const [staff, setStaff] = useState<{ id: string; full_name: string }[]>([]);
  
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'category' | 'transaction'; id: string } | null>(null);

  useEffect(() => {
    if (company?.id) {
      fetchData();
    }
  }, [company?.id]);

  const fetchData = async () => {
    if (!company?.id) return;
    setLoading(true);

    try {
      const [categoriesRes, transactionsRes, studentsRes, staffRes] = await Promise.all([
        supabase
          .from('financial_categories')
          .select('*')
          .eq('company_id', company.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('financial_transactions')
          .select(`
            *,
            category:financial_categories(id, name, type, color),
            student:students(full_name),
            staff:staff(full_name)
          `)
          .eq('company_id', company.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('students')
          .select('id, full_name')
          .eq('company_id', company.id)
          .eq('status', 'active'),
        supabase
          .from('staff')
          .select('id, full_name')
          .eq('company_id', company.id)
          .eq('is_active', true),
      ]);

      setCategories(categoriesRes.data || []);
      setTransactions(transactionsRes.data || []);
      setStudents(studentsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const txDate = new Date(t.created_at);
      return isWithinInterval(txDate, { start: dateRange.from, end: dateRange.to });
    });
  }, [transactions, dateRange]);

  // Calculate stats
  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.type === 'income' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense' && t.status === 'paid')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const pending = filteredTransactions
      .filter(t => t.status === 'pending' || t.status === 'overdue')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { income, expenses, profit: income - expenses, pending };
  }, [filteredTransactions]);

  // Sync student subscriptions as income
  const handleSyncSubscriptions = async () => {
    if (!company?.id) return;
    setSyncing(true);

    try {
      // Get active subscriptions
      const { data: subscriptions } = await supabase
        .from('student_subscriptions')
        .select(`
          id, student_id, start_date, end_date, payment_status,
          plan:subscription_plans(name, price),
          student:students(full_name, company_id)
        `)
        .eq('status', 'active');

      // Filter by company
      const companySubscriptions = (subscriptions || []).filter(
        (s: any) => s.student?.company_id === company.id
      );

      // Check which are not yet registered as transactions
      const { data: existingTx } = await supabase
        .from('financial_transactions')
        .select('subscription_id')
        .eq('company_id', company.id)
        .not('subscription_id', 'is', null);

      const existingSubIds = new Set((existingTx || []).map(t => t.subscription_id));

      const newTransactions = companySubscriptions
        .filter((s: any) => !existingSubIds.has(s.id))
        .map((s: any) => ({
          company_id: company.id,
          subscription_id: s.id,
          student_id: s.student_id,
          type: 'income',
          description: `Mensalidade - ${s.student?.full_name} (${s.plan?.name})`,
          amount: s.plan?.price || 0,
          status: s.payment_status === 'paid' ? 'paid' : 'pending',
          due_date: s.start_date,
        }));

      if (newTransactions.length > 0) {
        const { error } = await supabase
          .from('financial_transactions')
          .insert(newTransactions);

        if (error) throw error;
        toast.success(`${newTransactions.length} transações sincronizadas`);
        fetchData();
      } else {
        toast.info("Todas as subscrições já estão sincronizadas");
      }
    } catch (error: any) {
      console.error('Error syncing subscriptions:', error);
      toast.error(error.message || "Erro ao sincronizar");
    } finally {
      setSyncing(false);
    }
  };

  // Category handlers
  const handleSaveCategory = async (data: { name: string; type: string; color: string }) => {
    if (!company?.id) return;

    try {
      if (selectedCategory) {
        const { error } = await supabase
          .from('financial_categories')
          .update(data)
          .eq('id', selectedCategory.id);
        if (error) throw error;
        toast.success("Categoria atualizada");
      } else {
        const { error } = await supabase
          .from('financial_categories')
          .insert([{ ...data, company_id: company.id }]);
        if (error) throw error;
        toast.success("Categoria criada");
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar categoria");
      throw error;
    }
  };

  // Transaction handlers
  const handleSaveTransaction = async (data: Partial<Transaction>) => {
    if (!company?.id) return;
    if (!data.description || !data.type) return;

    try {
      if (selectedTransaction) {
        const { error } = await supabase
          .from('financial_transactions')
          .update({
            type: data.type,
            category_id: data.category_id || null,
            student_id: data.student_id || null,
            staff_id: data.staff_id || null,
            description: data.description,
            amount: data.amount || 0,
            status: data.status || 'pending',
            due_date: data.due_date || null,
            notes: data.notes || null,
            paid_at: data.status === 'paid' ? new Date().toISOString() : null,
          })
          .eq('id', selectedTransaction.id);
        if (error) throw error;
        toast.success("Transação atualizada");
      } else {
        const { error } = await supabase
          .from('financial_transactions')
          .insert([{
            company_id: company.id,
            type: data.type,
            category_id: data.category_id || null,
            student_id: data.student_id || null,
            staff_id: data.staff_id || null,
            description: data.description,
            amount: data.amount || 0,
            status: data.status || 'pending',
            due_date: data.due_date || null,
            notes: data.notes || null,
            paid_at: data.status === 'paid' ? new Date().toISOString() : null,
          }]);
        if (error) throw error;
        toast.success("Transação criada");
      }
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao guardar transação");
      throw error;
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const table = itemToDelete.type === 'category' ? 'financial_categories' : 'financial_transactions';
      const { error } = await supabase.from(table).delete().eq('id', itemToDelete.id);
      if (error) throw error;
      toast.success(itemToDelete.type === 'category' ? "Categoria eliminada" : "Transação eliminada");
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erro ao eliminar");
    } finally {
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: "border-green-500 text-green-600 bg-green-500/10",
      pending: "border-yellow-500 text-yellow-600 bg-yellow-500/10",
      overdue: "border-red-500 text-red-600 bg-red-500/10",
      cancelled: "border-gray-500 text-gray-600 bg-gray-500/10",
    };
    const labels: Record<string, string> = {
      paid: "Pago",
      pending: "Pendente",
      overdue: "Atrasado",
      cancelled: "Cancelado",
    };
    return <Badge variant="outline" className={styles[status]}>{labels[status]}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-semibold">Financeiro</h2>
        <DateRangeFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          preset={preset}
          onPresetChange={setPreset}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita" 
          value={`€${stats.income.toFixed(2)}`} 
          icon={TrendingUp} 
          className="border-l-4 border-l-green-500" 
        />
        <StatCard 
          title="Despesas" 
          value={`€${stats.expenses.toFixed(2)}`} 
          icon={TrendingDown} 
          className="border-l-4 border-l-red-500" 
        />
        <StatCard 
          title="Lucro Líquido" 
          value={`€${stats.profit.toFixed(2)}`} 
          icon={DollarSign} 
          trend={stats.profit >= 0 ? "up" : "down"}
        />
        <StatCard 
          title="Pagamentos Pendentes" 
          value={`€${stats.pending.toFixed(2)}`} 
          icon={CreditCard} 
          className="border-l-4 border-l-yellow-500" 
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="w-full">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <TabsList>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleSyncSubscriptions} disabled={syncing}>
              {syncing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
              Sincronizar Planos
            </Button>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <TabsContent value="transactions" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setSelectedTransaction(null); setTransactionDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Transações ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem transações no período selecionado</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[100px]">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{tx.description}</p>
                              {tx.student && <p className="text-xs text-muted-foreground">{tx.student.full_name}</p>}
                              {tx.staff && <p className="text-xs text-muted-foreground">{tx.staff.full_name}</p>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tx.category ? (
                              <Badge variant="outline" style={{ borderColor: tx.category.color, color: tx.category.color }}>
                                {tx.category.name}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>{format(new Date(tx.created_at), "dd/MM/yyyy", { locale: pt })}</TableCell>
                          <TableCell>
                            <span className={tx.type === 'income' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                              {tx.type === 'income' ? '+' : '-'}€{Number(tx.amount).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(tx.status)}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => { setSelectedTransaction(tx); setTransactionDialogOpen(true); }}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => { setItemToDelete({ type: 'transaction', id: tx.id }); setDeleteDialogOpen(true); }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="mt-6 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setSelectedCategory(null); setCategoryDialogOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Categorias de Receita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.filter(c => c.type === 'income').length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Sem categorias</p>
                ) : (
                  categories.filter(c => c.type === 'income').map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedCategory(cat); setCategoryDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => { setItemToDelete({ type: 'category', id: cat.id }); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Expense Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Categorias de Despesa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.filter(c => c.type === 'expense').length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Sem categorias</p>
                ) : (
                  categories.filter(c => c.type === 'expense').map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                        <span className="font-medium">{cat.name}</span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => { setSelectedCategory(cat); setCategoryDialogOpen(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => { setItemToDelete({ type: 'category', id: cat.id }); setDeleteDialogOpen(true); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        category={selectedCategory}
        onSave={handleSaveCategory}
      />

      <TransactionDialog
        open={transactionDialogOpen}
        onOpenChange={setTransactionDialogOpen}
        transaction={selectedTransaction}
        categories={categories}
        students={students}
        staff={staff}
        onSave={handleSaveTransaction}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja eliminar {itemToDelete?.type === 'category' ? 'esta categoria' : 'esta transação'}? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
