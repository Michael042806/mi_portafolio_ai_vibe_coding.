import { User, Category, Income, Expense, SavingsGoal, Debt, DebtPayment, SavingsContribution } from '../types';
import { MOCK_USER, MOCK_CATEGORIES, MOCK_INCOMES, MOCK_EXPENSES, MOCK_SAVINGS, MOCK_DEBTS } from './mockData';

// Helper to manage localStorage
const STORAGE_KEY = 'finanzas_demo_data';

interface DemoData {
  categories: Category[];
  incomes: Income[];
  expenses: Expense[];
  savingsGoals: SavingsGoal[];
  debts: Debt[];
}

const getStoredData = (): DemoData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  const initialData = {
    categories: MOCK_CATEGORIES,
    incomes: MOCK_INCOMES,
    expenses: MOCK_EXPENSES,
    savingsGoals: MOCK_SAVINGS,
    debts: MOCK_DEBTS
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
  return initialData;
};

const saveStoredData = (data: DemoData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Mock Listeners
type ListenerCallback<T> = (data: T) => void;
const listeners: { [key: string]: ListenerCallback<any>[] } = {};

const notifyListeners = (key: string, data: any) => {
  if (listeners[key]) {
    listeners[key].forEach(cb => cb(data));
  }
};

// User Profile
export const getUser = async (userId: string): Promise<User | null> => {
  return MOCK_USER;
};

export const createUser = async (user: User): Promise<void> => {
  // No-op for demo
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  // No-op for demo
};

// Categories
export const getCategories = (userId: string, callback: (categories: Category[]) => void) => {
  const data = getStoredData();
  callback(data.categories);
  const key = `categories-${userId}`;
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  };
};

export const addCategory = async (userId: string, category: Omit<Category, 'id'>): Promise<string> => {
  const data = getStoredData();
  const id = Math.random().toString(36).substr(2, 9);
  const newCategory = { ...category, id };
  data.categories.push(newCategory);
  saveStoredData(data);
  notifyListeners(`categories-${userId}`, data.categories);
  return id;
};

export const updateCategory = async (userId: string, categoryId: string, data: Partial<Category>): Promise<void> => {
  const storageData = getStoredData();
  const index = storageData.categories.findIndex(c => c.id === categoryId);
  if (index !== -1) {
    storageData.categories[index] = { ...storageData.categories[index], ...data };
    saveStoredData(storageData);
    notifyListeners(`categories-${userId}`, storageData.categories);
  }
};

export const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
  const storageData = getStoredData();
  storageData.categories = storageData.categories.filter(c => c.id !== categoryId);
  saveStoredData(storageData);
  notifyListeners(`categories-${userId}`, storageData.categories);
};

// Incomes
export const getIncomes = (userId: string, month: number, year: number, callback: (incomes: Income[]) => void) => {
  const filterIncomes = (allIncomes: Income[]) => {
    return allIncomes.filter(inc => {
      const date = new Date(inc.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  const data = getStoredData();
  callback(filterIncomes(data.incomes));
  
  const key = `incomes-${userId}-${month}-${year}`;
  const wrapper = (allIncomes: Income[]) => callback(filterIncomes(allIncomes));
  
  if (!listeners[`incomes-${userId}`]) listeners[`incomes-${userId}`] = [];
  listeners[`incomes-${userId}`].push(wrapper);
  
  return () => {
    listeners[`incomes-${userId}`] = listeners[`incomes-${userId}`].filter(cb => cb !== wrapper);
  };
};

export const addIncome = async (userId: string, income: Omit<Income, 'id' | 'userId'>): Promise<string> => {
  const data = getStoredData();
  const id = Math.random().toString(36).substr(2, 9);
  const newIncome = { ...income, id, userId };
  data.incomes.push(newIncome);
  saveStoredData(data);
  notifyListeners(`incomes-${userId}`, data.incomes);
  return id;
};

export const updateIncome = async (userId: string, incomeId: string, data: Partial<Income>): Promise<void> => {
  const storageData = getStoredData();
  const index = storageData.incomes.findIndex(i => i.id === incomeId);
  if (index !== -1) {
    storageData.incomes[index] = { ...storageData.incomes[index], ...data };
    saveStoredData(storageData);
    notifyListeners(`incomes-${userId}`, storageData.incomes);
  }
};

export const deleteIncome = async (userId: string, incomeId: string): Promise<void> => {
  const storageData = getStoredData();
  storageData.incomes = storageData.incomes.filter(i => i.id !== incomeId);
  saveStoredData(storageData);
  notifyListeners(`incomes-${userId}`, storageData.incomes);
};

// Expenses
export const getExpenses = (userId: string, month: number, year: number, callback: (expenses: Expense[]) => void) => {
  const filterExpenses = (allExpenses: Expense[]) => {
    return allExpenses.filter(exp => {
      const date = new Date(exp.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  const data = getStoredData();
  callback(filterExpenses(data.expenses));
  
  const wrapper = (allExpenses: Expense[]) => callback(filterExpenses(allExpenses));
  
  if (!listeners[`expenses-${userId}`]) listeners[`expenses-${userId}`] = [];
  listeners[`expenses-${userId}`].push(wrapper);
  
  return () => {
    listeners[`expenses-${userId}`] = listeners[`expenses-${userId}`].filter(cb => cb !== wrapper);
  };
};

export const addExpense = async (userId: string, expense: Omit<Expense, 'id' | 'userId' | 'category'>): Promise<string> => {
  const data = getStoredData();
  const id = Math.random().toString(36).substr(2, 9);
  const newExpense = { ...expense, id, userId };
  data.expenses.push(newExpense);
  saveStoredData(data);
  notifyListeners(`expenses-${userId}`, data.expenses);
  return id;
};

export const updateExpense = async (userId: string, expenseId: string, data: Partial<Expense>): Promise<void> => {
  const storageData = getStoredData();
  const index = storageData.expenses.findIndex(e => e.id === expenseId);
  if (index !== -1) {
    storageData.expenses[index] = { ...storageData.expenses[index], ...data };
    saveStoredData(storageData);
    notifyListeners(`expenses-${userId}`, storageData.expenses);
  }
};

export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
  const storageData = getStoredData();
  storageData.expenses = storageData.expenses.filter(e => e.id !== expenseId);
  saveStoredData(storageData);
  notifyListeners(`expenses-${userId}`, storageData.expenses);
};

// Savings Goals
export const getSavingsGoals = (userId: string, callback: (goals: SavingsGoal[]) => void) => {
  const data = getStoredData();
  callback(data.savingsGoals);
  const key = `savings-${userId}`;
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  };
};

export const addSavingsGoal = async (userId: string, goal: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'contributions'>): Promise<string> => {
  const data = getStoredData();
  const id = Math.random().toString(36).substr(2, 9);
  const newGoal = { ...goal, id, userId, currentAmount: 0, contributions: [] };
  data.savingsGoals.push(newGoal);
  saveStoredData(data);
  notifyListeners(`savings-${userId}`, data.savingsGoals);
  return id;
};

export const updateSavingsGoal = async (userId: string, goalId: string, data: Partial<SavingsGoal>): Promise<void> => {
  const storageData = getStoredData();
  const index = storageData.savingsGoals.findIndex(g => g.id === goalId);
  if (index !== -1) {
    storageData.savingsGoals[index] = { ...storageData.savingsGoals[index], ...data };
    saveStoredData(storageData);
    notifyListeners(`savings-${userId}`, storageData.savingsGoals);
  }
};

export const deleteSavingsGoal = async (userId: string, goalId: string): Promise<void> => {
  const storageData = getStoredData();
  storageData.savingsGoals = storageData.savingsGoals.filter(g => g.id !== goalId);
  saveStoredData(storageData);
  notifyListeners(`savings-${userId}`, storageData.savingsGoals);
};

export const addSavingsContribution = async (userId: string, goalId: string, contribution: Omit<SavingsContribution, 'id' | 'savingsGoalId'>): Promise<void> => {
  const storageData = getStoredData();
  const goalIndex = storageData.savingsGoals.findIndex(g => g.id === goalId);
  if (goalIndex !== -1) {
    const id = Math.random().toString(36).substr(2, 9);
    const newContribution = { ...contribution, id, savingsGoalId: goalId };
    storageData.savingsGoals[goalIndex].contributions.push(newContribution);
    storageData.savingsGoals[goalIndex].currentAmount += contribution.amount;
    saveStoredData(storageData);
    notifyListeners(`savings-${userId}`, storageData.savingsGoals);
  }
};

export const deleteSavingsContribution = async (userId: string, goalId: string, contributionId: string): Promise<void> => {
  const storageData = getStoredData();
  const goalIndex = storageData.savingsGoals.findIndex(g => g.id === goalId);
  if (goalIndex !== -1) {
    const contribution = storageData.savingsGoals[goalIndex].contributions.find(c => c.id === contributionId);
    if (contribution) {
      storageData.savingsGoals[goalIndex].currentAmount -= contribution.amount;
      storageData.savingsGoals[goalIndex].contributions = storageData.savingsGoals[goalIndex].contributions.filter(c => c.id !== contributionId);
      saveStoredData(storageData);
      notifyListeners(`savings-${userId}`, storageData.savingsGoals);
    }
  }
};

export const updateSavingsContribution = async (userId: string, goalId: string, contributionId: string, data: Partial<SavingsContribution>): Promise<void> => {
  const storageData = getStoredData();
  const goalIndex = storageData.savingsGoals.findIndex(g => g.id === goalId);
  if (goalIndex !== -1) {
    const contributions = storageData.savingsGoals[goalIndex].contributions;
    const index = contributions.findIndex(c => c.id === contributionId);
    if (index !== -1) {
      const oldAmount = contributions[index].amount;
      contributions[index] = { ...contributions[index], ...data };
      const newAmount = contributions[index].amount;
      storageData.savingsGoals[goalIndex].currentAmount = storageData.savingsGoals[goalIndex].currentAmount - oldAmount + newAmount;
      saveStoredData(storageData);
      notifyListeners(`savings-${userId}`, storageData.savingsGoals);
    }
  }
};

// Debts
export const getDebts = (userId: string, callback: (debts: Debt[]) => void) => {
  const data = getStoredData();
  callback(data.debts);
  const key = `debts-${userId}`;
  if (!listeners[key]) listeners[key] = [];
  listeners[key].push(callback);
  return () => {
    listeners[key] = listeners[key].filter(cb => cb !== callback);
  };
};

export const addDebt = async (userId: string, debt: Omit<Debt, 'id' | 'userId' | 'currentBalance' | 'payments'>): Promise<string> => {
  const data = getStoredData();
  const id = Math.random().toString(36).substr(2, 9);
  const newDebt = { ...debt, id, userId, currentBalance: debt.initialAmount, payments: [] };
  data.debts.push(newDebt);
  saveStoredData(data);
  notifyListeners(`debts-${userId}`, data.debts);
  return id;
};

export const deleteDebt = async (userId: string, debtId: string): Promise<void> => {
  const storageData = getStoredData();
  storageData.debts = storageData.debts.filter(d => d.id !== debtId);
  saveStoredData(storageData);
  notifyListeners(`debts-${userId}`, storageData.debts);
};

export const updateDebt = async (userId: string, debtId: string, data: Partial<Debt>): Promise<void> => {
  const storageData = getStoredData();
  const index = storageData.debts.findIndex(d => d.id === debtId);
  if (index !== -1) {
    storageData.debts[index] = { ...storageData.debts[index], ...data };
    saveStoredData(storageData);
    notifyListeners(`debts-${userId}`, storageData.debts);
  }
};

export const addDebtPayment = async (userId: string, debtId: string, payment: Omit<DebtPayment, 'id' | 'debtId'>): Promise<void> => {
  const storageData = getStoredData();
  const debtIndex = storageData.debts.findIndex(d => d.id === debtId);
  if (debtIndex !== -1) {
    const id = Math.random().toString(36).substr(2, 9);
    const newPayment = { ...payment, id, debtId };
    storageData.debts[debtIndex].payments.push(newPayment);
    storageData.debts[debtIndex].currentBalance -= payment.amount;
    saveStoredData(storageData);
    notifyListeners(`debts-${userId}`, storageData.debts);
  }
};

export const deleteDebtPayment = async (userId: string, debtId: string, paymentId: string): Promise<void> => {
  const storageData = getStoredData();
  const debtIndex = storageData.debts.findIndex(d => d.id === debtId);
  if (debtIndex !== -1) {
    const payment = storageData.debts[debtIndex].payments.find(p => p.id === paymentId);
    if (payment) {
      storageData.debts[debtIndex].currentBalance += payment.amount;
      storageData.debts[debtIndex].payments = storageData.debts[debtIndex].payments.filter(p => p.id !== paymentId);
      saveStoredData(storageData);
      notifyListeners(`debts-${userId}`, storageData.debts);
    }
  }
};

export const updateDebtPayment = async (userId: string, debtId: string, paymentId: string, data: Partial<DebtPayment>): Promise<void> => {
  const storageData = getStoredData();
  const debtIndex = storageData.debts.findIndex(d => d.id === debtId);
  if (debtIndex !== -1) {
    const payments = storageData.debts[debtIndex].payments;
    const index = payments.findIndex(p => p.id === paymentId);
    if (index !== -1) {
      const oldAmount = payments[index].amount;
      payments[index] = { ...payments[index], ...data };
      const newAmount = payments[index].amount;
      storageData.debts[debtIndex].currentBalance = storageData.debts[debtIndex].currentBalance + oldAmount - newAmount;
      saveStoredData(storageData);
      notifyListeners(`debts-${userId}`, storageData.debts);
    }
  }
};
