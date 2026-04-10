import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Trash2, CreditCard, Info, Edit2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Debt } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

interface DebtsListProps {
  debts: Debt[];
  onAddDebt: (name: string, amount: string) => void;
  onDeleteDebt: (id: string) => void;
  onUpdateDebt: (id: string, name: string, amount: string) => void;
  onAddPayment: (debtId: string, amount: string) => void;
  onUpdatePayment: (id: string, amount: number, date: string, debtId: string) => void;
  onDeletePayment: (id: string, debtId: string) => void;
}

export function DebtsList({ debts, onAddDebt, onDeleteDebt, onUpdateDebt, onAddPayment, onUpdatePayment, onDeletePayment }: DebtsListProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedDebt, setSelectedDebt] = useState("");
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [debtToDelete, setDebtToDelete] = useState<string | null>(null);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [isEditDebtOpen, setIsEditDebtOpen] = useState(false);
  const [viewingHistoryId, setViewingHistoryId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPaymentAmount, setEditPaymentAmount] = useState("");
  const [editPaymentDate, setEditPaymentDate] = useState("");

  const handleAddDebt = () => {
    if (!name || !amount) return;
    onAddDebt(name, amount);
    setName("");
    setAmount("");
    setIsAddDebtOpen(false);
  };

  const handleUpdateDebt = () => {
    if (!editingDebt || !name || !amount) return;
    onUpdateDebt(editingDebt.id, name, amount);
    setName("");
    setAmount("");
    setEditingDebt(null);
    setIsEditDebtOpen(false);
  };

  const openEditDialog = (debt: Debt) => {
    setEditingDebt(debt);
    setName(debt.name);
    setAmount(debt.initialAmount.toString());
    setIsEditDebtOpen(true);
  };

  const handleAddPayment = () => {
    if (!selectedDebt || !paymentAmount) return;
    onAddPayment(selectedDebt, paymentAmount);
    setPaymentAmount("");
    setSelectedDebt("");
    setIsAddPaymentOpen(false);
  };

  const startEditingPayment = (p: any) => {
    setEditingPaymentId(p.id);
    setEditPaymentAmount(p.amount.toString());
    setEditPaymentDate(new Date(p.date).toISOString().split('T')[0]);
  };

  const handleUpdatePayment = (debtId: string) => {
    if (!editingPaymentId || !editPaymentAmount || !editPaymentDate) return;
    onUpdatePayment(editingPaymentId, parseFloat(editPaymentAmount), editPaymentDate, debtId);
    setEditingPaymentId(null);
    setEditPaymentAmount("");
    setEditPaymentDate("");
  };

  const confirmDelete = (id: string) => {
    setDebtToDelete(id);
    setIsDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (debtToDelete !== null) {
      onDeleteDebt(debtToDelete);
      setDebtToDelete(null);
      setIsDeleteConfirmOpen(false);
    }
  };

  return (
    <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-rose-500" />
            Deudas
          </CardTitle>
          <CardDescription>Seguimiento de tus compromisos</CardDescription>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddDebtOpen} onOpenChange={setIsAddDebtOpen}>
            <DialogTrigger render={
              <Button variant="outline" size="sm" className="h-9 gap-2 border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl">
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Nueva</span>
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Deuda</DialogTitle>
                <CardDescription>Registra el monto total que debes pagar.</CardDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Nombre de la deuda</Label>
                  <Input placeholder="Ej. Tarjeta de Crédito Visa" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Monto Inicial</Label>
                  <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <Button className="w-full bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200" onClick={handleAddDebt}>
                  Guardar Deuda
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
            <DialogTrigger render={
              <Button size="sm" className="h-9 bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 gap-2 rounded-xl">
                <ArrowRight className="w-4 h-4" /> Pagar
              </Button>
            } />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Registrar un Pago</DialogTitle>
                <CardDescription>Selecciona la deuda y el monto que has pagado.</CardDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Seleccionar Deuda</Label>
                  <Select onValueChange={setSelectedDebt} value={selectedDebt}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Elige una deuda" />
                    </SelectTrigger>
                    <SelectContent>
                      {debts.map(d => (
                        <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Monto del Pago</Label>
                  <Input type="number" placeholder="0.00" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
                </div>
                <Button className="w-full bg-rose-600 hover:bg-rose-700" onClick={handleAddPayment}>
                  Confirmar Pago
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-2xl border border-slate-100 overflow-hidden bg-white">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-6">Deuda</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Saldo Pendiente</TableHead>
                <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Progreso de Pago</TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {debts.map((debt, idx) => {
                  const paidAmount = debt.initialAmount - debt.currentBalance;
                  const progress = (paidAmount / debt.initialAmount) * 100;
                  
                  return (
                    <motion.tr
                      key={debt.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group hover:bg-slate-50/50 transition-colors border-slate-100"
                    >
                      <TableCell className="pl-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{debt.name}</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tight">Total: ${debt.initialAmount.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="font-black text-rose-600">${debt.currentBalance.toLocaleString()}</span>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex flex-col gap-1.5 min-w-[120px]">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                            <span className="text-emerald-600">PAGADO: ${paidAmount.toLocaleString()}</span>
                            <span className="text-slate-400">{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(progress, 100)}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full"
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="pr-6 py-4">
                        <div className="flex items-center gap-1">
                          <Dialog open={viewingHistoryId === debt.id} onOpenChange={(open) => setViewingHistoryId(open ? debt.id : null)}>
                            <DialogTrigger render={
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all" title="Ver historial de pagos">
                                <Info className="w-4 h-4" />
                              </Button>
                            } />
                            <DialogContent className="sm:max-w-[450px]">
                              <DialogHeader>
                                <DialogTitle>Historial de Pagos</DialogTitle>
                                <CardDescription>Pagos realizados para "{debt.name}"</CardDescription>
                              </DialogHeader>
                              <div className="space-y-3 pt-4 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                                {debt.payments && debt.payments.length > 0 ? (
                                  debt.payments.map((p) => (
                                    <div key={p.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                                      {editingPaymentId === p.id ? (
                                        <div className="space-y-3">
                                          <div className="grid grid-cols-2 gap-2">
                                            <div className="space-y-1">
                                              <Label className="text-[10px] uppercase font-bold text-slate-400">Monto</Label>
                                              <Input 
                                                type="number" 
                                                value={editPaymentAmount} 
                                                onChange={(e) => setEditPaymentAmount(e.target.value)}
                                                className="h-8 text-xs rounded-lg"
                                              />
                                            </div>
                                            <div className="space-y-1">
                                              <Label className="text-[10px] uppercase font-bold text-slate-400">Fecha</Label>
                                              <Input 
                                                type="date" 
                                                value={editPaymentDate} 
                                                onChange={(e) => setEditPaymentDate(e.target.value)}
                                                className="h-8 text-xs rounded-lg"
                                              />
                                            </div>
                                          </div>
                                          <div className="flex gap-2">
                                            <Button 
                                              size="sm" 
                                              className="h-8 flex-1 bg-blue-600 hover:bg-blue-700 text-xs rounded-lg"
                                              onClick={() => handleUpdatePayment(debt.id)}
                                            >
                                              Guardar
                                            </Button>
                                            <Button 
                                              variant="outline" 
                                              size="sm" 
                                              className="h-8 flex-1 text-xs rounded-lg"
                                              onClick={() => setEditingPaymentId(null)}
                                            >
                                              Cancelar
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-between">
                                          <div className="space-y-0.5">
                                            <p className="text-sm font-bold text-slate-700">${p.amount.toLocaleString()}</p>
                                            <p className="text-[10px] font-medium text-slate-400 uppercase">
                                              {new Date(p.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                            </p>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-8 w-8 text-blue-300 hover:text-blue-600 hover:bg-blue-50"
                                              onClick={() => startEditingPayment(p)}
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50"
                                              onClick={() => onDeletePayment(p.id, debt.id)}
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
                                    <p className="text-sm">No hay pagos registrados</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                            onClick={() => openEditDialog(debt)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" 
                            onClick={() => confirmDelete(debt.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {(!debts || debts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <div className="bg-slate-50 p-3 rounded-2xl">
                        <Info className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium">Sin deudas registradas</p>
                      <p className="text-xs">¡Buen trabajo manteniendo tus finanzas limpias!</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isEditDebtOpen} onOpenChange={setIsEditDebtOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Deuda</DialogTitle>
              <CardDescription>Actualiza los detalles de tu compromiso financiero.</CardDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Nombre de la deuda</Label>
                <Input placeholder="Ej. Tarjeta de Crédito Visa" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Monto Inicial</Label>
                <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200" onClick={handleUpdateDebt}>
                Guardar Cambios
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-[2rem]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900">¿Eliminar deuda?</DialogTitle>
              <CardDescription className="text-slate-500 font-medium pt-2">
                Esta acción no se puede deshacer. Se eliminarán todos los registros asociados a esta deuda.
              </CardDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-6">
              <Button 
                variant="outline" 
                className="flex-1 rounded-2xl h-12 font-bold border-slate-200"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 rounded-2xl h-12 font-bold bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-100"
                onClick={handleDelete}
              >
                Eliminar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
