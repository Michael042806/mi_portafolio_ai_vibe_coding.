import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, TrendingUp, Target, Calendar, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { SavingsGoal } from "@/types";
import { calculateRecommendedMonthlySaving } from "@/lib/calculations";
import { motion, AnimatePresence } from "framer-motion";

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  onAddGoal: (name: string, amount: string, date: string) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateGoal: (id: string, name: string, amount: string, date: string) => void;
  onAddContribution: (savingsGoalId: string, amount: number, date: string) => void;
  onDeleteContribution: (id: string, goalId: string) => void;
  onUpdateContribution: (id: string, amount: number, date: string, savingsGoalId: string) => void;
}

export function SavingsGoals({ goals, onAddGoal, onDeleteGoal, onUpdateGoal, onAddContribution, onDeleteContribution, onUpdateContribution }: SavingsGoalsProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [progressAmount, setProgressAmount] = useState("");
  const [contributionDate, setContributionDate] = useState(new Date().toISOString().split('T')[0]);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [activeGoalId, setActiveGoalId] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [editingContributionId, setEditingContributionId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDate, setEditDate] = useState("");

  const handleCreateGoal = () => {
    if (!name || !amount || !date) return;
    onAddGoal(name, amount, date);
    setName("");
    setAmount("");
    setDate("");
    setIsAddGoalOpen(false);
  };

  const handleUpdateGoal = () => {
    if (!editingGoal || !name || !amount || !date) return;
    onUpdateGoal(editingGoal.id, name, amount, date);
    setName("");
    setAmount("");
    setDate("");
    setEditingGoal(null);
  };

  const handleAddContribution = (id: string) => {
    if (!progressAmount || !contributionDate) return;
    onAddContribution(id, parseFloat(progressAmount), contributionDate);
    setProgressAmount("");
    setContributionDate(new Date().toISOString().split('T')[0]);
    setActiveGoalId(null);
  };

  const startEditingContribution = (c: any) => {
    setEditingContributionId(c.id);
    setEditAmount(c.amount.toString());
    setEditDate(new Date(c.date).toISOString().split('T')[0]);
  };

  const handleUpdateContribution = (savingsGoalId: string) => {
    if (!editingContributionId || !editAmount || !editDate) return;
    onUpdateContribution(editingContributionId, parseFloat(editAmount), editDate, savingsGoalId);
    setEditingContributionId(null);
    setEditAmount("");
    setEditDate("");
  };

  const openEditDialog = (goal: SavingsGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setAmount(goal.targetAmount.toString());
    // Format date to YYYY-MM-DD for input type="date"
    const goalDate = new Date(goal.targetDate);
    const formattedDate = goalDate.toISOString().split('T')[0];
    setDate(formattedDate);
  };

  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="w-5 h-5 text-emerald-500" />
            Metas de Ahorro
          </CardTitle>
          <CardDescription>Visualiza tu camino al éxito</CardDescription>
        </div>
        <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
          <DialogTrigger render={
            <Button variant="outline" size="icon" className="h-9 w-9 rounded-xl border-emerald-100 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700">
              <Plus className="w-5 h-5" />
            </Button>
          } />
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nueva Meta de Ahorro</DialogTitle>
              <CardDescription>Define qué quieres lograr y para cuándo.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre de la meta</Label>
                <Input placeholder="Ej. Fondo de Emergencia" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Monto Objetivo</Label>
                  <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fecha Límite</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200" onClick={handleCreateGoal}>
                Crear Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="popLayout">
          {goals.length ? goals.map((goal, idx) => {
            const recommended = calculateRecommendedMonthlySaving(goal.targetAmount, goal.currentAmount, goal.targetDate);
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            
            return (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.05 }}
                className="group relative space-y-3 p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 transition-all duration-300"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">{goal.name}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      PARA EL {new Date(goal.targetDate).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Dialog open={!!editingGoal && editingGoal.id === goal.id} onOpenChange={(open) => !open && setEditingGoal(null)}>
                      <DialogTrigger render={
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                          onClick={() => openEditDialog(goal)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      } />
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Editar Meta de Ahorro</DialogTitle>
                          <CardDescription>Actualiza los detalles de tu meta.</CardDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Nombre de la meta</Label>
                            <Input placeholder="Ej. Fondo de Emergencia" value={name} onChange={(e) => setName(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Monto Objetivo</Label>
                              <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                              <Label>Fecha Límite</Label>
                              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                          </div>
                          <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" onClick={handleUpdateGoal}>
                            Guardar Cambios
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={activeGoalId === goal.id} onOpenChange={(open) => setActiveGoalId(open ? goal.id : null)}>
                      <DialogTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg" title="Añadir ahorro">
                          <TrendingUp className="w-4 h-4" />
                        </Button>
                      } />
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Registrar Ahorro</DialogTitle>
                          <CardDescription>Ingresa el monto y la fecha de tu aporte para "{goal.name}".</CardDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Monto</Label>
                              <Input type="number" placeholder="0.00" value={progressAmount} onChange={(e) => setProgressAmount(e.target.value)} autoFocus />
                            </div>
                            <div className="space-y-2">
                              <Label>Fecha</Label>
                              <Input type="date" value={contributionDate} onChange={(e) => setContributionDate(e.target.value)} />
                            </div>
                          </div>
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAddContribution(goal.id)}>
                            Confirmar Ahorro
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Dialog open={viewingHistoryId === goal.id} onOpenChange={(open) => setViewingHistoryId(open ? goal.id : null)}>
                      <DialogTrigger render={
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg" title="Ver historial">
                          <Calendar className="w-4 h-4" />
                        </Button>
                      } />
                      <DialogContent className="sm:max-w-[450px]">
                        <DialogHeader>
                          <DialogTitle>Historial de Ahorros</DialogTitle>
                          <CardDescription>Aportes realizados para "{goal.name}"</CardDescription>
                        </DialogHeader>
                        <div className="space-y-3 pt-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                          {goal.contributions && goal.contributions.length > 0 ? (
                            goal.contributions.map((c) => (
                              <div key={c.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                                {editingContributionId === c.id ? (
                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Monto</Label>
                                        <Input 
                                          type="number" 
                                          value={editAmount} 
                                          onChange={(e) => setEditAmount(e.target.value)}
                                          className="h-8 text-xs rounded-lg"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-[10px] uppercase font-bold text-slate-400">Fecha</Label>
                                        <Input 
                                          type="date" 
                                          value={editDate} 
                                          onChange={(e) => setEditDate(e.target.value)}
                                          className="h-8 text-xs rounded-lg"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button 
                                        size="sm" 
                                        className="h-8 flex-1 bg-blue-600 hover:bg-blue-700 text-xs rounded-lg"
                                        onClick={() => handleUpdateContribution(goal.id)}
                                      >
                                        Guardar
                                      </Button>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 flex-1 text-xs rounded-lg"
                                        onClick={() => setEditingContributionId(null)}
                                      >
                                        Cancelar
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                      <p className="text-sm font-bold text-slate-700">${c.amount.toLocaleString()}</p>
                                      <p className="text-[10px] font-medium text-slate-400 uppercase">
                                        {new Date(c.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-blue-300 hover:text-blue-600 hover:bg-blue-50"
                                        onClick={() => startEditingContribution(c)}
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50"
                                        onClick={() => onDeleteContribution(c.id, goal.id)}
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-slate-400">
                              <p className="text-sm">No hay aportes registrados</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all" onClick={() => onDeleteGoal(goal.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Progreso</span>
                      <p className="text-lg font-black text-emerald-600 leading-none">
                        ${goal.currentAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right space-y-0.5">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Objetivo</span>
                      <p className="text-sm font-bold text-slate-600 leading-none">
                        ${goal.targetAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="relative h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className={`h-full rounded-full ${progress >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-emerald-400 to-emerald-500'}`}
                    />
                  </div>
                </div>

                {recommended > 0 && progress < 100 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50/80 backdrop-blur-sm p-2.5 rounded-xl text-[11px] text-emerald-700 flex items-center gap-2 border border-emerald-100/50"
                  >
                    <div className="bg-white p-1 rounded-md shadow-sm">
                      <TrendingUp className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span>Ahorro mensual sugerido: <span className="font-bold text-emerald-800">${recommended.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></span>
                  </motion.div>
                )}
                
                {progress >= 100 && (
                  <div className="bg-emerald-500 text-white p-2 rounded-xl text-[11px] font-bold text-center shadow-lg shadow-emerald-200">
                    ¡META ALCANZADA! 🎉
                  </div>
                )}
              </motion.div>
            );
          }) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-4 rounded-3xl border-2 border-dashed border-slate-100"
            >
              <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-bold">Sin metas activas</h3>
              <p className="text-slate-500 text-sm max-w-[200px] mx-auto mt-1">
                Define tu primer objetivo de ahorro para empezar a construir tu futuro.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
