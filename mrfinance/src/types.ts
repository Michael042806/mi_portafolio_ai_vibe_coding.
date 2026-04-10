export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  budget: number;
}

export interface Income {
  id: string;
  amount: number;
  description: string;
  type: string;
  date: string;
  userId: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  isPaid: boolean;
  paidAmount: number;
  categoryId: string;
  category?: Category;
  userId: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  userId: string;
  contributions: SavingsContribution[];
}

export interface SavingsContribution {
  id: string;
  amount: number;
  date: string;
  savingsGoalId: string;
}

export interface Debt {
  id: string;
  name: string;
  initialAmount: number;
  currentBalance: number;
  dueDate?: string;
  notes?: string;
  userId: string;
  payments: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  debtId: string;
}

export interface DashboardData {
  totalIncome: number;
  totalExpenses: number;
  totalPaidExpenses: number;
  remainingIncome: number;
  totalSavings: number;
  totalDebt: number;
  monthlySavings?: number;
  monthlyDebtPayments?: number;
  incomes: Income[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
}
