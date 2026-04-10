import { Decimal } from "decimal.js";

/**
 * Calcula el ahorro mensual recomendado para llegar a una meta.
 * Fórmula: (Monto Objetivo - Monto Actual) / Meses Restantes
 */
export function calculateRecommendedMonthlySaving(targetAmount: number, currentAmount: number, targetDate: string): number {
  const target = new Date(targetDate);
  const now = new Date();
  
  // Diferencia en meses
  let months = (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());
  
  // Si la fecha ya pasó o es este mes, al menos 1 mes para evitar división por cero
  if (months <= 0) months = 1;
  
  const remaining = new Decimal(targetAmount).minus(currentAmount);
  if (remaining.lte(0)) return 0;
  
  return remaining.dividedBy(months).toNumber();
}

/**
 * Calcula el porcentaje del ingreso que representa un gasto o ahorro.
 */
export function calculatePercentage(amount: number, totalIncome: number): number {
  if (totalIncome <= 0) return 0;
  return new Decimal(amount).dividedBy(totalIncome).times(100).toNumber();
}

/**
 * Calcula el nuevo saldo de una deuda después de un pago, asegurando que no sea menor a cero.
 */
export function calculateNewDebtBalance(currentBalance: number, paymentAmount: number): number {
  const newBalance = new Decimal(currentBalance).minus(paymentAmount);
  return newBalance.lt(0) ? 0 : newBalance.toNumber();
}

/**
 * Calcula el ahorro basado en un porcentaje del ingreso total.
 */
export function calculateSavingsByPercentage(totalIncome: number, percentage: number): number {
  if (totalIncome <= 0 || percentage <= 0) return 0;
  return new Decimal(totalIncome).times(percentage).dividedBy(100).toNumber();
}

/**
 * Calcula el presupuesto disponible después de gastos y ahorros.
 */
export function calculateAvailableBudget(totalIncome: number, totalExpenses: number, totalSavings: number): number {
  const available = new Decimal(totalIncome).minus(totalExpenses).minus(totalSavings);
  return available.toNumber();
}
