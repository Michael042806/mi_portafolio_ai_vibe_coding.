import { z } from "zod";

export const IncomeSchema = z.object({
  amount: z.number().positive("El monto debe ser mayor a cero"),
  description: z.string().min(1, "La descripción es requerida"),
  type: z.enum(["monthly", "weekly", "biweekly", "daily", "unique", "extra", "bonus"], {
    message: "Tipo de ingreso inválido",
  }),
  userId: z.number(),
  date: z.string().optional(),
});

export const ExpenseSchema = z.object({
  amount: z.number().positive("El monto debe ser mayor a cero"),
  description: z.string().min(1, "La descripción es requerida"),
  categoryId: z.number(),
  userId: z.number(),
  date: z.string().optional(),
  isPaid: z.boolean().optional().default(false),
  paidAmount: z.number().nonnegative().optional().default(0),
});

export const SavingsGoalSchema = z.object({
  name: z.string().min(1, "El nombre de la meta es requerido"),
  targetAmount: z.number().positive("El monto objetivo debe ser mayor a cero"),
  targetDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Fecha inválida",
  }),
  userId: z.number(),
});

export const SavingsContributionSchema = z.object({
  amount: z.number().positive("El monto del ahorro debe ser mayor a cero"),
  date: z.string().optional(),
  savingsGoalId: z.number(),
});

export const DebtSchema = z.object({
  name: z.string().min(1, "El nombre de la deuda es requerido"),
  initialAmount: z.number().positive("El monto inicial debe ser mayor a cero"),
  userId: z.number(),
});

export const DebtPaymentSchema = z.object({
  amount: z.number().positive("El monto del pago debe ser mayor a cero"),
  debtId: z.number(),
});

export const CategorySchema = z.object({
  name: z.string().min(1, "El nombre de la categoría es requerido"),
  budget: z.number().nonnegative("El presupuesto debe ser mayor o igual a cero").optional(),
});
