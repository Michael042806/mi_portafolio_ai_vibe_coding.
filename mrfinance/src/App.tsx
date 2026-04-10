import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button as ShadcnButton } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  LogOut, 
  Wallet, 
  PieChart as PieChartIcon,
  History,
  LayoutDashboard,
  Settings,
  User as UserIcon,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { User, DashboardData, Category } from "./types";
import { SummaryCards } from "./components/dashboard/SummaryCards";
import { SavingsGoals } from "./components/savings/SavingsGoals";
import { ExpenseDistribution } from "./components/budget/ExpenseDistribution";
import { DebtsList } from "./components/debts/DebtsList";
import { HistoryList } from "./components/history/HistoryList";
import { ProfileView } from "./components/profile/ProfileView";
import { SettingsView } from "./components/settings/SettingsView";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

import { useAuth } from "./contexts/MockAuthContext";
import * as firestoreService from "./services/mockService";

export default function App() {
  const { user, loginWithGoogle, logout, loading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDesc, setIncomeDesc] = useState("");
  const [incomeType, setIncomeType] = useState("monthly");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expensePaidAmount, setExpensePaidAmount] = useState("");
  const [expenseIsPaid, setExpenseIsPaid] = useState(false);
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);

  const parseAmount = (val: string) => {
    return parseFloat(val.replace(',', '.')) || 0;
  };

  const resetMovementForm = () => {
    setIncomeAmount("");
    setIncomeDesc("");
    setIncomeType("monthly");
    setExpenseAmount("");
    setExpenseDesc("");
    setExpenseCategory("");
    setExpensePaidAmount("");
    setExpenseIsPaid(false);
    setMovementDate(new Date().toISOString().split('T')[0]);
    setMovementError(null);
  };

  useEffect(() => {
    if (user) {
      const unsubCategories = firestoreService.getCategories(user.id, setCategories);
      
      const unsubIncomes = firestoreService.getIncomes(user.id, selectedMonth, selectedYear, (incomes) => {
        setData(prev => {
          const newData = prev || {
            totalIncome: 0,
            totalExpenses: 0,
            totalPaidExpenses: 0,
            remainingIncome: 0,
            totalSavings: 0,
            totalDebt: 0,
            incomes: [],
            expenses: [],
            savingsGoals: [],
            debts: []
          };
          return { ...newData, incomes };
        });
      });

      const unsubExpenses = firestoreService.getExpenses(user.id, selectedMonth, selectedYear, (expenses) => {
        setData(prev => {
          const newData = prev || {
            totalIncome: 0,
            totalExpenses: 0,
            totalPaidExpenses: 0,
            remainingIncome: 0,
            totalSavings: 0,
            totalDebt: 0,
            incomes: [],
            expenses: [],
            savingsGoals: [],
            debts: []
          };
          return { ...newData, expenses };
        });
      });

      const unsubGoals = firestoreService.getSavingsGoals(user.id, (savingsGoals) => {
        setData(prev => {
          const newData = prev || {
            totalIncome: 0,
            totalExpenses: 0,
            totalPaidExpenses: 0,
            remainingIncome: 0,
            totalSavings: 0,
            totalDebt: 0,
            incomes: [],
            expenses: [],
            savingsGoals: [],
            debts: []
          };
          return { ...newData, savingsGoals };
        });
      });

      const unsubDebts = firestoreService.getDebts(user.id, (debts) => {
        setData(prev => {
          const newData = prev || {
            totalIncome: 0,
            totalExpenses: 0,
            totalPaidExpenses: 0,
            remainingIncome: 0,
            totalSavings: 0,
            totalDebt: 0,
            incomes: [],
            expenses: [],
            savingsGoals: [],
            debts: []
          };
          return { ...newData, debts };
        });
      });

      return () => {
        unsubCategories();
        unsubIncomes();
        unsubExpenses();
        unsubGoals();
        unsubDebts();
      };
    }
  }, [user, selectedMonth, selectedYear]);

  // Recalculate totals when data changes
  useEffect(() => {
    if (data) {
      const totalIncome = data.incomes.reduce((sum, inc) => sum + inc.amount, 0);
      const totalExpenses = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalPaidExpenses = data.expenses.reduce((sum, exp) => sum + (exp.paidAmount || 0), 0);
      const totalSavings = data.savingsGoals.reduce((sum, goal) => sum + goal.currentAmount, 0);
      const totalDebt = data.debts.reduce((sum, debt) => sum + debt.currentBalance, 0);

      const monthlySavings = data.savingsGoals.reduce((sum, goal) => {
        return sum + (goal.contributions || [])
          .filter(c => {
            const date = new Date(c.date);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
          })
          .reduce((s, c) => s + c.amount, 0);
      }, 0);

      const monthlyDebtPayments = data.debts.reduce((sum, debt) => {
        return sum + (debt.payments || [])
          .filter(p => {
            const date = new Date(p.date);
            return date.getMonth() === selectedMonth && date.getFullYear() === selectedYear;
          })
          .reduce((s, p) => s + p.amount, 0);
      }, 0);

      const remainingIncome = totalIncome - totalPaidExpenses - monthlySavings - monthlyDebtPayments;

      setData(prev => prev ? {
        ...prev,
        totalIncome,
        totalExpenses,
        totalPaidExpenses,
        totalSavings,
        totalDebt,
        monthlySavings,
        monthlyDebtPayments,
        remainingIncome
      } : null);
    }
  }, [data?.incomes, data?.expenses, data?.savingsGoals, data?.debts, selectedMonth, selectedYear]);

  const handleUpdateCategory = async (id: string, name: string, budget: number) => {
    if (!user) return;
    await firestoreService.updateCategory(user.id, id, { name, budget });
  };

  const handleAddCategory = async (name: string, budget: number) => {
    if (!user) return;
    await firestoreService.addCategory(user.id, { name, budget });
  };

  const handleDeleteCategory = async (id: string) => {
    if (!user) return;
    await firestoreService.deleteCategory(user.id, id);
  };

  const handleAddSavingsContribution = async (savingsGoalId: string, amount: number, date: string) => {
    if (!user) return;
    await firestoreService.addSavingsContribution(user.id, savingsGoalId, { amount, date });
  };

  const handleAddIncome = async () => {
    setMovementError(null);
    if (!user) return;

    if (!incomeAmount || !incomeDesc) {
      setMovementError("Por favor, completa todos los campos (Monto y Descripción).");
      return;
    }

    setIsSaving(true);
    try {
      await firestoreService.addIncome(user.id, {
        amount: parseAmount(incomeAmount),
        description: incomeDesc,
        type: incomeType,
        date: new Date(movementDate).toISOString()
      });
      resetMovementForm();
      setIsMovementDialogOpen(false);
    } catch (err: any) {
      setMovementError(err.message || "Error al guardar el ingreso");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddExpense = async () => {
    setMovementError(null);
    if (!user) return;

    if (!expenseAmount || !expenseDesc || !expenseCategory) {
      setMovementError("Por favor, completa todos los campos (Monto, Descripción y Categoría).");
      return;
    }

    setIsSaving(true);
    try {
      const amount = parseAmount(expenseAmount);
      await firestoreService.addExpense(user.id, {
        amount,
        description: expenseDesc,
        categoryId: expenseCategory,
        date: new Date(movementDate).toISOString(),
        isPaid: expenseIsPaid,
        paidAmount: expenseIsPaid ? amount : parseAmount(expensePaidAmount)
      });
      resetMovementForm();
      setIsMovementDialogOpen(false);
    } catch (err: any) {
      setMovementError(err.message || "Error al guardar el gasto");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGoal = async (name: string, amount: string, date: string) => {
    if (!user) return;
    await firestoreService.addSavingsGoal(user.id, {
      name,
      targetAmount: parseFloat(amount),
      targetDate: date
    });
  };

  const handleAddDebt = async (name: string, amount: string) => {
    if (!user) return;
    await firestoreService.addDebt(user.id, {
      name,
      initialAmount: parseFloat(amount)
    });
  };

  const handleAddPayment = async (debtId: string, amount: string) => {
    if (!user) return;
    await firestoreService.addDebtPayment(user.id, debtId, {
      amount: parseFloat(amount),
      date: new Date().toISOString()
    });
  };

  const handleUpdateDebtPayment = async (id: string, amount: number, date: string, debtId: string) => {
    if (!user) return;
    await firestoreService.updateDebtPayment(user.id, debtId, id, { amount, date });
  };

  const handleDeleteDebtPayment = async (id: string, debtId: string) => {
    if (!user) return;
    await firestoreService.deleteDebtPayment(user.id, debtId, id);
  };

  const handleDeleteIncome = async (id: string) => {
    if (!user) return;
    await firestoreService.deleteIncome(user.id, id);
  };

  const handleUpdateIncome = async (id: string, amount: number, description: string, type: string, date: string) => {
    if (!user) return;
    await firestoreService.updateIncome(user.id, id, { amount, description, type, date });
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    await firestoreService.deleteExpense(user.id, id);
  };

  const handleUpdateExpense = async (id: string, amount: number, description: string, categoryId: string, date: string, isPaid?: boolean, paidAmount?: number) => {
    if (!user) return;
    await firestoreService.updateExpense(user.id, id, { amount, description, categoryId, date, isPaid, paidAmount });
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user) return;
    await firestoreService.deleteSavingsGoal(user.id, id);
  };

  const handleUpdateGoal = async (id: string, name: string, amount: string, date: string) => {
    if (!user) return;
    await firestoreService.updateSavingsGoal(user.id, id, { name, targetAmount: parseFloat(amount), targetDate: date });
  };

  const handleDeleteDebt = async (id: string) => {
    if (!user) return;
    await firestoreService.deleteDebt(user.id, id);
  };

  const handleUpdateDebt = async (id: string, name: string, amount: string) => {
    if (!user) return;
    await firestoreService.updateDebt(user.id, id, { 
      name, 
      initialAmount: parseFloat(amount) 
    });
  };

  const handleUpdateUser = async (name: string) => {
    if (!user) return;
    await firestoreService.updateUser(user.id, { name });
  };

  const handleDeleteSavingsContribution = async (id: string, goalId: string) => {
    if (!user) return;
    await firestoreService.deleteSavingsContribution(user.id, goalId, id);
  };

  const handleUpdateSavingsContribution = async (id: string, amount: number, date: string, goalId: string) => {
    if (!user) return;
    await firestoreService.updateSavingsContribution(user.id, goalId, id, { amount, date });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md z-10"
        >
          <Card className="border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-xl rounded-[2rem]">
            <CardHeader className="space-y-2 text-center pt-10">
              <div className="flex justify-center mb-4">
                <motion.div 
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  className="bg-gradient-to-br from-blue-600 to-blue-700 p-4 rounded-3xl shadow-xl shadow-blue-200"
                >
                  <Wallet className="w-10 h-10 text-white" />
                </motion.div>
              </div>
              <CardTitle className="text-4xl font-black tracking-tight text-slate-900">MRFinance</CardTitle>
              <CardDescription className="text-slate-500 font-medium">Gestiona tus finanzas con inteligencia artificial</CardDescription>
            </CardHeader>
            <CardContent className="pb-10 px-8">
              <div className="space-y-6">
                <p className="text-center text-slate-500 font-medium">
                  Usa tu cuenta de Google para acceder de forma segura y permanente.
                </p>
                <ShadcnButton 
                  onClick={loginWithGoogle} 
                  className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-200 transition-all active:scale-[0.98]" 
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Cargando...
                    </div>
                  ) : "Iniciar con Google"}
                </ShadcnButton>
                
                <ShadcnButton 
                  type="button"
                  variant="outline"
                  className="w-full h-12 border-slate-200 hover:bg-slate-50 gap-3 rounded-2xl font-bold transition-all active:scale-95 text-slate-600"
                  onClick={() => window.open(window.location.href, '_blank')}
                >
                  <ExternalLink className="w-5 h-5" />
                  <span>Abrir en nueva pestaña</span>
                </ShadcnButton>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const expenseData = data?.expenses.reduce((acc: any[], exp) => {
    const categoryName = categories.find(c => c.id === exp.categoryId)?.name || 'Sin categoría';
    const existing = acc.find(a => a.name === categoryName);
    if (existing) {
      existing.value += exp.amount;
    } else {
      acc.push({ name: categoryName, value: exp.amount });
    }
    return acc;
  }, []) || [];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24 md:pb-0 md:pl-72">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-slate-100 fixed inset-y-0 left-0 z-50 shadow-[1px_0_0_rgba(0,0,0,0.02)]">
        <div className="p-8 flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-2xl shadow-lg shadow-blue-100">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-900">MRFinance</span>
        </div>
        
        <div className="flex-1 px-4 space-y-8 mt-4">
          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Principal</p>
            <ShadcnButton 
              variant="ghost" 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full justify-start gap-4 h-12 rounded-2xl px-4 transition-all ${
                activeTab === "dashboard" 
                  ? "bg-blue-50 text-blue-700 font-bold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${activeTab === "dashboard" ? "text-blue-600" : "text-slate-400"}`} /> 
              Dashboard
            </ShadcnButton>
            <ShadcnButton 
              variant="ghost" 
              onClick={() => setActiveTab("history")}
              className={`w-full justify-start gap-4 h-12 rounded-2xl px-4 transition-all ${
                activeTab === "history" 
                  ? "bg-blue-50 text-blue-700 font-bold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <History className={`w-5 h-5 ${activeTab === "history" ? "text-blue-600" : "text-slate-400"}`} /> 
              Historial
            </ShadcnButton>
          </div>

          <div className="space-y-1">
            <p className="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Preferencias</p>
            <ShadcnButton 
              variant="ghost" 
              onClick={() => setActiveTab("profile")}
              className={`w-full justify-start gap-4 h-12 rounded-2xl px-4 transition-all ${
                activeTab === "profile" 
                  ? "bg-blue-50 text-blue-700 font-bold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <UserIcon className={`w-5 h-5 ${activeTab === "profile" ? "text-blue-600" : "text-slate-400"}`} /> 
              Perfil
            </ShadcnButton>
            <ShadcnButton 
              variant="ghost" 
              onClick={() => setActiveTab("settings")}
              className={`w-full justify-start gap-4 h-12 rounded-2xl px-4 transition-all ${
                activeTab === "settings" 
                  ? "bg-blue-50 text-blue-700 font-bold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Settings className={`w-5 h-5 ${activeTab === "settings" ? "text-blue-600" : "text-slate-400"}`} /> 
              Ajustes
            </ShadcnButton>
          </div>
        </div>

        <div className="p-6 border-t border-slate-50">
          <div className="bg-slate-50/50 p-4 rounded-[1.5rem] border border-slate-100/50 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-black shadow-sm">
                {user.name?.[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{user.email}</p>
              </div>
            </div>
          </div>
          <ShadcnButton 
            variant="ghost" 
            className="w-full h-12 rounded-2xl gap-3 text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-all font-bold" 
            onClick={logout}
          >
            <LogOut className="w-4 h-4" /> Salir de la cuenta
          </ShadcnButton>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Hola, {user.name.split(' ')[0]}! 👋</h1>
            <p className="text-slate-500 font-medium">Aquí tienes el resumen de tu salud financiera hoy.</p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
              <Select 
                value={selectedMonth.toString()} 
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
              >
                <SelectTrigger className="h-9 border-none bg-transparent focus:ring-0 w-[130px] font-bold text-slate-700 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                    <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-800" />
              <Select 
                value={selectedYear.toString()} 
                onValueChange={(v) => setSelectedYear(parseInt(v))}
              >
                <SelectTrigger className="h-9 border-none bg-transparent focus:ring-0 w-[90px] font-bold text-slate-700 dark:text-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {[2024, 2025, 2026, 2027].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isMovementDialogOpen} onOpenChange={(open) => {
              setIsMovementDialogOpen(open);
              if (!open) setMovementError(null);
            }}>
              <DialogTrigger render={
                <ShadcnButton className="h-12 px-6 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200 gap-3 rounded-2xl font-bold transition-all active:scale-95">
                  <Plus className="w-5 h-5" /> 
                  <span>Nuevo Movimiento</span>
                </ShadcnButton>
              } />
              <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white">
                  <DialogTitle className="text-2xl font-black">Registrar Movimiento</DialogTitle>
                  <CardDescription className="text-blue-100 font-medium mt-1">Mantén tus cuentas al día con un par de clics.</CardDescription>
                </div>
                <div className="p-8">
                  {movementError && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold animate-in fade-in zoom-in duration-300">
                      {movementError}
                    </div>
                  )}
                  <Tabs defaultValue="expense" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-slate-100 p-1 rounded-2xl h-12 mb-8">
                      <TabsTrigger value="expense" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-rose-600 data-[state=active]:shadow-sm font-bold">Gasto</TabsTrigger>
                      <TabsTrigger value="income" className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-emerald-600 data-[state=active]:shadow-sm font-bold">Ingreso</TabsTrigger>
                    </TabsList>
                    <TabsContent value="expense" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Monto</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <Input type="text" placeholder="0.00" className="h-12 pl-8 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-rose-500" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Fecha</Label>
                          <Input type="date" className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-rose-500" value={movementDate} onChange={(e) => setMovementDate(e.target.value)} />
                        </div>
                      </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Categoría</Label>
                          <Select 
                            onValueChange={(val) => {
                              console.log("Category selected:", val);
                              setExpenseCategory(val);
                            }} 
                            value={expenseCategory}
                          >
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-rose-500">
                              <SelectValue placeholder="Elegir categoría..." />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              {categories.length === 0 ? (
                                <SelectItem value="none" disabled className="text-slate-500 italic">
                                  No hay categorías. Créalas en "Distribución de Gastos".
                                </SelectItem>
                              ) : (
                                categories.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Descripción</Label>
                        <Input placeholder="Ej. Cena con amigos" className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-rose-500" value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} />
                      </div>

                      <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold text-slate-800">¿Está pagado?</Label>
                            <p className="text-xs text-slate-500 font-medium">Marca si ya realizaste este pago.</p>
                          </div>
                          <Checkbox 
                            checked={expenseIsPaid} 
                            onCheckedChange={(checked) => {
                              setExpenseIsPaid(!!checked);
                              if (checked) setExpensePaidAmount(expenseAmount);
                            }} 
                            className="h-6 w-6 rounded-md border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                          />
                        </div>
                        
                        {!expenseIsPaid && (
                          <div className="space-y-2 pt-2 border-t border-slate-200/50">
                            <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Monto Pagado (Parcial)</Label>
                            <Input 
                              type="number" 
                              className="h-11 rounded-xl bg-white border-transparent focus:border-rose-500" 
                              value={expensePaidAmount} 
                              onChange={(e) => setExpensePaidAmount(e.target.value)} 
                              placeholder="0.00"
                            />
                          </div>
                        )}
                      </div>

                      {movementError && (
                        <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl text-sm font-medium border border-rose-100 animate-in fade-in slide-in-from-top-1 duration-200">
                          {movementError}
                        </div>
                      )}

                      <ShadcnButton 
                        disabled={isSaving}
                        className="w-full bg-rose-600 hover:bg-rose-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-rose-100 mt-4" 
                        onClick={handleAddExpense}
                      >
                        {isSaving ? "Guardando..." : "Confirmar Gasto"}
                      </ShadcnButton>
                    </TabsContent>
                    <TabsContent value="income" className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Monto</Label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                            <Input type="text" placeholder="0.00" className="h-12 pl-8 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Fecha</Label>
                          <Input type="date" className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500" value={movementDate} onChange={(e) => setMovementDate(e.target.value)} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Frecuencia</Label>
                          <Select onValueChange={setIncomeType} value={incomeType}>
                            <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl">
                              <SelectItem value="monthly">Mensual</SelectItem>
                              <SelectItem value="weekly">Semanal</SelectItem>
                              <SelectItem value="unique">Único</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Descripción</Label>
                        <Input placeholder="Ej. Salario Freelance" className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500" value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} />
                      </div>
                      <ShadcnButton 
                        disabled={isSaving}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-100 mt-4" 
                        onClick={handleAddIncome}
                      >
                        {isSaving ? "Guardando..." : "Confirmar Ingreso"}
                      </ShadcnButton>
                    </TabsContent>
                  </Tabs>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              {/* Stats Grid */}
              <SummaryCards 
                totalIncome={data?.totalIncome || 0}
                totalExpenses={data?.totalExpenses || 0}
                totalPaidExpenses={data?.totalPaidExpenses || 0}
                remainingIncome={data?.remainingIncome || 0}
                totalSavings={data?.monthlySavings || 0}
                totalDebt={data?.monthlyDebtPayments || 0}
                isMonthlyView={true}
              />

              {/* Charts and Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Expenses Chart */}
                <ExpenseDistribution 
                  expenseData={expenseData}
                  categories={categories}
                  expenses={data?.expenses || []}
                  onUpdateCategory={handleUpdateCategory}
                  onAddCategory={handleAddCategory}
                  onDeleteCategory={handleDeleteCategory}
                  onDeleteExpense={handleDeleteExpense}
                  onUpdateExpense={handleUpdateExpense}
                />

                {/* Savings Goals */}
                <SavingsGoals 
                  goals={data?.savingsGoals || []}
                  onAddGoal={handleAddGoal}
                  onDeleteGoal={handleDeleteGoal}
                  onUpdateGoal={handleUpdateGoal}
                  onAddContribution={handleAddSavingsContribution}
                  onDeleteContribution={handleDeleteSavingsContribution}
                  onUpdateContribution={handleUpdateSavingsContribution}
                />
              </div>

              {/* Debts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <DebtsList 
                  debts={data?.debts || []}
                  onAddDebt={handleAddDebt}
                  onDeleteDebt={handleDeleteDebt}
                  onUpdateDebt={handleUpdateDebt}
                  onAddPayment={handleAddPayment}
                  onUpdatePayment={handleUpdateDebtPayment}
                  onDeletePayment={handleDeleteDebtPayment}
                />

                {/* Recent Transactions Preview */}
                <HistoryList 
                  incomes={data?.incomes.slice(0, 6) || []}
                  expenses={data?.expenses.slice(0, 6) || []}
                  categories={categories}
                  onDeleteIncome={handleDeleteIncome}
                  onDeleteExpense={handleDeleteExpense}
                  onUpdateIncome={handleUpdateIncome}
                  onUpdateExpense={handleUpdateExpense}
                />
              </div>
            </motion.div>
          )}

          {activeTab === "history" && (
            <motion.div 
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <HistoryList 
                incomes={data?.incomes || []}
                expenses={data?.expenses || []}
                categories={categories}
                onDeleteIncome={handleDeleteIncome}
                onDeleteExpense={handleDeleteExpense}
                onUpdateIncome={handleUpdateIncome}
                onUpdateExpense={handleUpdateExpense}
              />
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ProfileView user={user} onUpdateUser={handleUpdateUser} />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <SettingsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 backdrop-blur-xl border border-slate-100 flex justify-around p-2 z-50 rounded-[2rem] shadow-2xl shadow-blue-500/10">
        <ShadcnButton 
          variant="ghost" 
          onClick={() => setActiveTab("dashboard")}
          className={`flex-col gap-1 h-14 w-20 rounded-2xl transition-all ${
            activeTab === "dashboard" ? "text-blue-600 bg-blue-50/50 font-bold" : "text-slate-400"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Inicio</span>
        </ShadcnButton>
        <ShadcnButton 
          variant="ghost" 
          onClick={() => setActiveTab("history")}
          className={`flex-col gap-1 h-14 w-20 rounded-2xl transition-all ${
            activeTab === "history" ? "text-blue-600 bg-blue-50/50 font-bold" : "text-slate-400"
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Historial</span>
        </ShadcnButton>
        <ShadcnButton 
          variant="ghost" 
          onClick={() => setActiveTab("profile")}
          className={`flex-col gap-1 h-14 w-20 rounded-2xl transition-all ${
            activeTab === "profile" ? "text-blue-600 bg-blue-50/50 font-bold" : "text-slate-400"
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Perfil</span>
        </ShadcnButton>
        <ShadcnButton 
          variant="ghost" 
          onClick={logout}
          className="flex-col gap-1 h-14 w-20 rounded-2xl text-rose-400"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-bold uppercase tracking-tight">Salir</span>
        </ShadcnButton>
      </nav>
    </div>
  );
}
