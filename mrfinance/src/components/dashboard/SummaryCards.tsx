import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PiggyBank, CreditCard, ArrowUpRight, ArrowDownRight, Wallet } from "lucide-react";
import * as React from "react";
import { motion } from "framer-motion";

interface SummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  totalPaidExpenses: number;
  remainingIncome: number;
  totalSavings: number;
  totalDebt: number;
  isMonthlyView?: boolean;
}

export function SummaryCards({ 
  totalIncome, 
  totalExpenses, 
  totalPaidExpenses, 
  remainingIncome, 
  totalSavings, 
  totalDebt,
  isMonthlyView = false
}: SummaryCardsProps) {
  const cards = [
    {
      title: isMonthlyView ? "Ingresos del Mes" : "Ingresos Totales",
      amount: totalIncome,
      icon: TrendingUp,
      trend: "Bruto",
      trendIcon: ArrowUpRight,
      color: "from-blue-500/10 to-blue-500/5",
      border: "border-blue-100",
      iconBg: "bg-blue-500",
      iconColor: "text-white",
      amountColor: "text-blue-950"
    },
    {
      title: isMonthlyView ? "Ingresos Disponibles" : "Ingresos Disponibles",
      amount: remainingIncome,
      icon: Wallet,
      trend: "Neto (menos gastos, ahorro y deudas)",
      trendIcon: ArrowUpRight,
      color: "from-emerald-500/10 to-emerald-500/5",
      border: "border-emerald-100",
      iconBg: "bg-emerald-500",
      iconColor: "text-white",
      amountColor: "text-emerald-950"
    },
    {
      title: isMonthlyView ? "Gastos del Mes" : "Gastos Totales",
      amount: totalExpenses,
      icon: TrendingDown,
      trend: `Pagado: $${totalPaidExpenses.toLocaleString()}`,
      trendIcon: ArrowDownRight,
      color: "from-orange-500/10 to-orange-500/5",
      border: "border-orange-100",
      iconBg: "bg-orange-500",
      iconColor: "text-white",
      amountColor: "text-orange-950"
    },
    {
      title: isMonthlyView ? "Ahorro del Mes" : "Ahorro",
      amount: totalSavings,
      icon: PiggyBank,
      trend: isMonthlyView ? "Aportado este mes" : "Total acumulado",
      trendIcon: ArrowUpRight,
      color: "from-indigo-500/10 to-indigo-500/5",
      border: "border-indigo-100",
      iconBg: "bg-indigo-500",
      iconColor: "text-white",
      amountColor: "text-indigo-950"
    },
    {
      title: isMonthlyView ? "Pagos de Deuda" : "Deuda Pendiente",
      amount: totalDebt,
      icon: CreditCard,
      trend: isMonthlyView ? "Pagado este mes" : "Por pagar",
      trendIcon: ArrowDownRight,
      color: "from-rose-500/10 to-rose-500/5",
      border: "border-rose-100",
      iconBg: "bg-rose-500",
      iconColor: "text-white",
      amountColor: "text-rose-950"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {cards.map((card, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.1 }}
        >
          <Card className={`relative overflow-hidden border ${card.border} bg-gradient-to-br ${card.color} shadow-sm hover:shadow-md transition-all duration-300 group`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{card.title}</p>
                  <h3 className={`text-3xl font-bold ${card.amountColor} tracking-tight`}>
                    ${card.amount.toLocaleString()}
                  </h3>
                  <div className="flex items-center gap-1.5 pt-1">
                    <card.trendIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-tight">{card.trend}</span>
                  </div>
                </div>
                <div className={`${card.iconBg} p-3 rounded-2xl shadow-lg shadow-current/10 group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              
              {/* Decorative background element */}
              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
