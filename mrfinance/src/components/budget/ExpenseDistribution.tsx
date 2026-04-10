import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon, Edit2, Target, Plus, Trash2, AlertCircle, List, ChevronLeft, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Category, Expense } from "@/types";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

interface ExpenseDistributionProps {
  expenseData: { name: string; value: number }[];
  categories: Category[];
  expenses: Expense[];
  onUpdateCategory: (id: string, name: string, budget: number) => Promise<void>;
  onAddCategory: (name: string, budget: number) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
  onUpdateExpense: (id: string, amount: number, description: string, categoryId: string, date: string, isPaid?: boolean, paidAmount?: number) => Promise<void>;
}

export function ExpenseDistribution({ 
  expenseData, 
  categories, 
  expenses,
  onUpdateCategory,
  onAddCategory,
  onDeleteCategory,
  onDeleteExpense,
  onUpdateExpense
}: ExpenseDistributionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryBudget, setNewCategoryBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingExpensesFor, setViewingExpensesFor] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteExpenseId, setConfirmDeleteExpenseId] = useState<string | null>(null);

  // Sync local state when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setLocalCategories([...categories]);
      setNewCategoryName("");
      setNewCategoryBudget("");
      setError(null);
      setViewingExpensesFor(null);
      setConfirmDeleteId(null);
      setConfirmDeleteExpenseId(null);
    }
    setIsEditing(open);
  };

  const handleLocalUpdate = (id: string, field: 'name' | 'budget', value: string) => {
    setLocalCategories(prev => prev.map(cat => {
      if (cat.id === id) {
        return {
          ...cat,
          [field]: field === 'budget' ? (parseFloat(value) || 0) : value
        };
      }
      return cat;
    }));
  };

  const handleAddCategory = async () => {
    if (!newCategoryName) {
      setError("El nombre es requerido");
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await onAddCategory(newCategoryName, parseFloat(newCategoryBudget) || 0);
      setNewCategoryName("");
      setNewCategoryBudget("");
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Error al crear categoría");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = (id: string) => {
    const categoryExpenses = expenses.filter(e => e.categoryId === id);
    if (categoryExpenses.length > 0) {
      setError(`No se puede eliminar: esta categoría tiene ${categoryExpenses.length} gastos. Elimínalos primero.`);
      return;
    }
    setConfirmDeleteId(id);
    setError(null);
  };

  const executeDeleteCategory = async (id: string) => {
    setError(null);
    try {
      await onDeleteCategory(id);
      setLocalCategories(prev => prev.filter(c => c.id !== id));
      setConfirmDeleteId(null);
    } catch (err: any) {
      setError(err.message || "Error al eliminar categoría");
    }
  };

  const handleDeleteExpense = (id: string) => {
    setConfirmDeleteExpenseId(id);
  };

  const executeDeleteExpense = async (id: string) => {
    try {
      await onDeleteExpense(id);
      setConfirmDeleteExpenseId(null);
    } catch (err: any) {
      setError(err.message || "Error al eliminar gasto");
    }
  };

  const handleTogglePaid = async (expense: Expense) => {
    try {
      const newIsPaid = !expense.isPaid;
      const newPaidAmount = newIsPaid ? expense.amount : 0;
      await onUpdateExpense(
        expense.id, 
        expense.amount, 
        expense.description, 
        expense.categoryId, 
        expense.date, 
        newIsPaid, 
        newPaidAmount
      );
    } catch (err: any) {
      setError(err.message || "Error al actualizar estado de pago");
    }
  };

  const handleUpdatePaidAmount = async (expense: Expense, amount: string) => {
    const newPaidAmount = parseFloat(amount) || 0;
    const isPaid = newPaidAmount >= expense.amount;
    try {
      await onUpdateExpense(
        expense.id, 
        expense.amount, 
        expense.description, 
        expense.categoryId, 
        expense.date, 
        isPaid, 
        newPaidAmount
      );
    } catch (err: any) {
      setError(err.message || "Error al actualizar monto pagado");
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      for (const localCat of localCategories) {
        const originalCat = categories.find(c => c.id === localCat.id);
        if (originalCat && (originalCat.name !== localCat.name || originalCat.budget !== localCat.budget)) {
          await onUpdateCategory(localCat.id, localCat.name, localCat.budget);
        }
      }
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message || "Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="lg:col-span-2 border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white/50 backdrop-blur-sm rounded-[2rem]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-blue-500" />
            Distribución de Gastos
          </CardTitle>
          <CardDescription>Análisis visual y presupuestos por categorías</CardDescription>
        </div>
        <Dialog open={isEditing} onOpenChange={handleOpenChange}>
          <DialogTrigger render={
            <Button variant="outline" size="sm" className="rounded-xl border-blue-100 text-blue-600 hover:bg-blue-50">
              <Edit2 className="w-4 h-4 mr-2" />
              Gestionar Categorías
            </Button>
          } />
          <DialogContent className="sm:max-w-[650px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Gestionar Categorías</DialogTitle>
              <DialogDescription className="text-slate-500">
                Añade, edita o elimina categorías de gastos y sus presupuestos.
              </DialogDescription>
            </DialogHeader>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-6 pt-4">
              {viewingExpensesFor ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setViewingExpensesFor(null)}
                      className="rounded-xl h-9 px-2 text-slate-500 hover:text-blue-600"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Volver
                    </Button>
                    <h3 className="font-bold text-slate-700">
                      Gastos en: {categories.find(c => c.id === viewingExpensesFor)?.name}
                    </h3>
                  </div>

                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    {expenses.filter(e => e.categoryId === viewingExpensesFor).length > 0 ? (
                      expenses.filter(e => e.categoryId === viewingExpensesFor).map((exp) => {
                        const pending = exp.amount - (exp.paidAmount || 0);
                        return (
                          <div key={exp.id} className={`p-4 rounded-2xl border ${exp.isPaid ? 'border-emerald-100 bg-emerald-50/30' : 'border-slate-100 bg-white'} shadow-sm transition-all`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <Checkbox 
                                  checked={exp.isPaid} 
                                  onCheckedChange={() => handleTogglePaid(exp)}
                                  className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                />
                                <div className="space-y-0.5">
                                  <p className={`font-bold ${exp.isPaid ? 'text-emerald-900 line-through opacity-60' : 'text-slate-800'}`}>{exp.description}</p>
                                  <p className="text-[10px] font-medium text-slate-400 uppercase">
                                    {new Date(exp.date).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="text-right mr-2">
                                  <p className="font-black text-slate-900">${exp.amount.toLocaleString()}</p>
                                  {pending > 0 && !exp.isPaid && (
                                    <p className="text-[10px] font-bold text-rose-500 uppercase">Pendiente: ${pending.toLocaleString()}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  {confirmDeleteExpenseId === exp.id ? (
                                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                                      <Button 
                                        size="sm" 
                                        variant="destructive" 
                                        className="h-8 px-2 rounded-lg text-[10px] font-bold uppercase"
                                        onClick={() => executeDeleteExpense(exp.id)}
                                      >
                                        Sí
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-8 px-2 rounded-lg text-[10px] font-bold uppercase text-slate-500"
                                        onClick={() => setConfirmDeleteExpenseId(null)}
                                      >
                                        No
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button 
                                      variant="ghost" 
                                      size="icon"
                                      onClick={() => handleDeleteExpense(exp.id)}
                                      className="h-8 w-8 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {!exp.isPaid && (
                              <div className="flex items-center gap-4 pt-2 border-t border-slate-100 mt-2">
                                <div className="flex-1 space-y-1.5">
                                  <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pago Parcial</Label>
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      type="number" 
                                      placeholder="Monto pagado" 
                                      value={exp.paidAmount || ""}
                                      onChange={(e) => handleUpdatePaidAmount(exp, e.target.value)}
                                      className="h-9 rounded-xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500 text-sm"
                                    />
                                    <span className="text-xs font-bold text-slate-400">/ ${exp.amount}</span>
                                  </div>
                                </div>
                                <div className="w-24 pt-4">
                                  <Progress value={(exp.paidAmount / exp.amount) * 100} className="h-1.5 bg-slate-100" />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <p className="text-sm">No hay gastos en esta categoría</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Add New Category */}
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-3 border border-slate-100">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Nueva Categoría</Label>
                    <div className="flex gap-3">
                      <Input 
                        placeholder="Nombre" 
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="h-11 rounded-xl bg-white border-transparent focus:border-blue-500"
                      />
                      <Input 
                        type="number" 
                        placeholder="Presupuesto" 
                        value={newCategoryBudget}
                        onChange={(e) => setNewCategoryBudget(e.target.value)}
                        className="h-11 rounded-xl bg-white border-transparent focus:border-blue-500 w-32"
                      />
                      <Button 
                        onClick={handleAddCategory}
                        disabled={isSaving || !newCategoryName}
                        className="bg-blue-600 hover:bg-blue-700 h-11 w-11 rounded-xl p-0 shrink-0"
                      >
                        <Plus className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* List Categories */}
                  <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-[1fr_100px_80px] gap-4 px-3">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Categoría</Label>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Presupuesto</Label>
                      <div />
                    </div>
                    {localCategories.map((cat) => (
                      <div key={cat.id} className="grid grid-cols-[1fr_100px_80px] gap-4 items-center p-3 rounded-xl border border-slate-100 bg-white group hover:border-blue-200 transition-all shadow-sm">
                        <Input 
                          value={cat.name}
                          onChange={(e) => handleLocalUpdate(cat.id, 'name', e.target.value)}
                          className="h-9 rounded-lg border-transparent bg-slate-50 focus:bg-white focus:border-blue-500 font-medium"
                        />
                        <Input 
                          type="number" 
                          placeholder="0.00" 
                          value={cat.budget}
                          onChange={(e) => handleLocalUpdate(cat.id, 'budget', e.target.value)}
                          className="h-9 rounded-lg border-transparent bg-slate-50 focus:bg-white focus:border-blue-500"
                        />
                        <div className="flex items-center gap-1">
                          {confirmDeleteId === cat.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 px-2 rounded-lg text-[10px] font-bold uppercase"
                                onClick={() => executeDeleteCategory(cat.id)}
                              >
                                Confirmar
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 px-2 rounded-lg text-[10px] font-bold uppercase text-slate-500"
                                onClick={() => setConfirmDeleteId(null)}
                              >
                                No
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => setViewingExpensesFor(cat.id)}
                                className="h-9 w-9 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title="Ver gastos"
                              >
                                <List className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => handleDeleteCategory(cat.id)}
                                className="h-9 w-9 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Eliminar categoría"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-slate-100 mt-2">
              <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-xl h-11 px-6 font-bold text-slate-500">
                Cancelar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11 px-8 font-bold shadow-lg shadow-blue-100" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="h-auto min-h-[350px]">
        {expenseData.length > 0 ? (
          <div className="w-full flex flex-col md:flex-row items-center gap-8">
            <div className="w-full md:w-1/2 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {expenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-4 px-6">
              {expenseData.map((item, idx) => {
                const category = categories.find(c => c.name === item.name);
                const budget = category?.budget || 0;
                const percent = budget > 0 ? (item.value / budget) * 100 : 0;
                
                return (
                  <div key={idx} className="space-y-1.5 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-sm font-bold text-slate-600 group-hover:text-slate-900 transition-colors">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900">${item.value.toLocaleString()}</span>
                        {budget > 0 && (
                          <span className="text-[10px] block font-bold text-slate-400 uppercase">de ${budget.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    {budget > 0 && (
                      <div className="space-y-1">
                        <Progress value={Math.min(percent, 100)} className={`h-1.5 ${percent > 100 ? 'bg-rose-100' : 'bg-slate-100'}`} />
                        <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
                          <span className={percent > 100 ? 'text-rose-500' : 'text-blue-500'}>
                            {percent.toFixed(1)}% utilizado
                          </span>
                          {percent > 100 && <span className="text-rose-600">¡Excedido!</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-400 py-12">
            <div className="bg-slate-50 p-4 rounded-3xl">
              <PieChartIcon className="w-10 h-10 text-slate-200" />
            </div>
            <p className="text-sm font-medium">No hay gastos registrados aún</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
