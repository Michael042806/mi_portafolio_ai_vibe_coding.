import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Trash2, History, ArrowUpRight, ArrowDownLeft, Edit2, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Income, Expense, Category } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface HistoryListProps {
  incomes: Income[];
  expenses: Expense[];
  categories: Category[];
  onDeleteIncome: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onUpdateIncome: (id: string, amount: number, description: string, type: string, date: string) => void;
  onUpdateExpense: (id: string, amount: number, description: string, categoryId: string, date: string, isPaid?: boolean, paidAmount?: number) => void;
}

export function HistoryList({ incomes, expenses, categories, onDeleteIncome, onDeleteExpense, onUpdateIncome, onUpdateExpense }: HistoryListProps) {
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editType, setEditType] = useState("");
  const [editIsPaid, setEditIsPaid] = useState(false);
  const [editPaidAmount, setEditPaidAmount] = useState("");

  const allTransactions = [
    ...incomes.map(inc => ({ ...inc, type: 'income' as const })),
    ...expenses.map(exp => ({ ...exp, type: 'expense' as const }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setEditAmount(item.amount.toString());
    setEditDesc(item.description);
    setEditDate(new Date(item.date).toISOString().split('T')[0]);
    if (item.type === 'expense') {
      setEditCategory(item.categoryId.toString());
      setEditIsPaid(item.isPaid || false);
      setEditPaidAmount((item.paidAmount || 0).toString());
    } else {
      setEditType(item.type_income || 'monthly');
    }
  };

  const handleSave = () => {
    if (!editingItem) return;
    if (editingItem.type === 'expense') {
      onUpdateExpense(
        editingItem.id, 
        parseFloat(editAmount), 
        editDesc, 
        editCategory, 
        editDate, 
        editIsPaid, 
        parseFloat(editPaidAmount) || 0
      );
    } else {
      onUpdateIncome(editingItem.id, parseFloat(editAmount), editDesc, editType, editDate);
    }
    setEditingItem(null);
  };

  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-2 rounded-xl">
            <History className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">Movimientos Recientes</CardTitle>
            <CardDescription>Tus últimos gastos e ingresos</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {allTransactions.length > 0 ? allTransactions.map((item, idx) => (
              <motion.div 
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className="flex items-center justify-between p-3 rounded-2xl hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-100 transition-all group"
              >
                <div className="flex items-center gap-4">
                  {item.type === 'expense' && (
                    <Checkbox 
                      checked={item.isPaid} 
                      onCheckedChange={() => onUpdateExpense(
                        item.id, 
                        item.amount, 
                        item.description, 
                        item.categoryId, 
                        item.date, 
                        !item.isPaid, 
                        !item.isPaid ? item.amount : 0
                      )}
                      className="h-5 w-5 rounded-md border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                    />
                  )}
                  <div className={`p-2.5 rounded-xl ${
                    item.type === 'expense' 
                      ? (item.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')
                      : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {item.type === 'expense' ? (
                      item.isPaid ? <CheckCircle2 className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${item.type === 'expense' && item.isPaid ? 'text-emerald-900 opacity-60 line-through' : 'text-slate-900'}`}>
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      <span>{new Date(item.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                      {item.type === 'expense' && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-slate-200" />
                          <span className={item.isPaid ? 'text-emerald-500' : 'text-rose-400'}>
                            {categories.find(c => c.id === item.categoryId)?.name || 'Sin categoría'} {item.isPaid ? '(Pagado)' : ''}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className={`text-sm block font-black ${
                      item.type === 'expense' ? (item.isPaid ? 'text-emerald-600' : 'text-rose-600') : 'text-emerald-600'
                    }`}>
                      {item.type === 'expense' ? '-' : '+'}${item.amount.toLocaleString()}
                    </span>
                    {item.type === 'expense' && !item.isPaid && item.paidAmount > 0 && (
                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        Pagado: ${item.paidAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => item.type === 'expense' ? onDeleteExpense(item.id) : onDeleteIncome(item.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-100"
              >
                <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <History className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold">Sin movimientos</h3>
                <p className="text-slate-500 text-sm max-w-[200px] mx-auto mt-1">
                  Tus transacciones aparecerán aquí una vez que las registres.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Single Edit Dialog */}
        <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
          <DialogContent className="rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Editar {editingItem?.type === 'expense' ? 'Gasto' : 'Ingreso'}</DialogTitle>
              <CardDescription className="font-medium">Modifica los detalles de la transacción.</CardDescription>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Descripción</Label>
                <Input className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Monto</Label>
                  <Input type="number" className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Fecha</Label>
                  <Input type="date" className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
              </div>
              {editingItem?.type === 'expense' ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Categoría</Label>
                    <Select value={editCategory} onValueChange={setEditCategory}>
                      <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500">
                        <SelectValue placeholder="Selecciona categoría" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl">
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="bg-slate-50 p-6 rounded-[2rem] space-y-4 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-sm font-bold text-slate-800">¿Está pagado?</Label>
                        <p className="text-xs text-slate-500 font-medium">Marca si ya realizaste este pago.</p>
                      </div>
                      <Checkbox 
                        checked={editIsPaid} 
                        onCheckedChange={(checked) => {
                          setEditIsPaid(!!checked);
                          if (checked) setEditPaidAmount(editAmount);
                        }} 
                        className="h-6 w-6 rounded-md border-slate-300 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                      />
                    </div>
                    
                    {!editIsPaid && (
                      <div className="space-y-2 pt-2 border-t border-slate-200/50">
                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Monto Pagado (Parcial)</Label>
                        <Input 
                          type="number" 
                          className="h-11 rounded-xl bg-white border-transparent focus:border-blue-500" 
                          value={editPaidAmount} 
                          onChange={(e) => setEditPaidAmount(e.target.value)} 
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-400 ml-1">Tipo de Ingreso</Label>
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-transparent focus:bg-white focus:border-blue-500">
                      <SelectValue placeholder="Selecciona tipo" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="monthly">Mensual</SelectItem>
                      <SelectItem value="extra">Extra</SelectItem>
                      <SelectItem value="bonus">Bono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button className="w-full bg-blue-600 hover:bg-blue-700 h-14 rounded-2xl text-lg font-bold shadow-lg shadow-blue-100 mt-4" onClick={handleSave}>
                Guardar Cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
