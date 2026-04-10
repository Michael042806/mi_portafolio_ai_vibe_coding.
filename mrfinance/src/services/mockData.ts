import { Category, Income, Expense, SavingsGoal, Debt, User } from '../types';

export const MOCK_USER: User = {
  id: 'demo-user',
  email: 'demo@example.com',
  name: 'Usuario Demo'
};

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Vivienda', budget: 1500, icon: 'home' },
  { id: 'cat2', name: 'Alimentación', budget: 600, icon: 'shopping-cart' },
  { id: 'cat3', name: 'Transporte', budget: 300, icon: 'car' },
  { id: 'cat4', name: 'Entretenimiento', budget: 200, icon: 'film' },
  { id: 'cat5', name: 'Salud', budget: 150, icon: 'heart' },
  { id: 'cat6', name: 'Otros', budget: 100, icon: 'more-horizontal' },
];

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

export const MOCK_INCOMES: Income[] = [
  { 
    id: 'inc1', 
    amount: 3500, 
    description: 'Salario Mensual', 
    type: 'monthly', 
    date: new Date(currentYear, currentMonth, 1).toISOString(),
    userId: 'demo-user'
  },
  { 
    id: 'inc2', 
    amount: 500, 
    description: 'Bono por Proyecto', 
    type: 'bonus', 
    date: new Date(currentYear, currentMonth, 15).toISOString(),
    userId: 'demo-user'
  },
];

export const MOCK_EXPENSES: Expense[] = [
  {
    id: 'exp1',
    amount: 1200,
    description: 'Alquiler Departamento',
    date: new Date(currentYear, currentMonth, 5).toISOString(),
    isPaid: true,
    paidAmount: 1200,
    categoryId: 'cat1',
    userId: 'demo-user'
  },
  {
    id: 'exp2',
    amount: 450,
    description: 'Supermercado Mensual',
    date: new Date(currentYear, currentMonth, 10).toISOString(),
    isPaid: true,
    paidAmount: 450,
    categoryId: 'cat2',
    userId: 'demo-user'
  },
  {
    id: 'exp3',
    amount: 80,
    description: 'Gimnasio',
    date: new Date(currentYear, currentMonth, 12).toISOString(),
    isPaid: false,
    paidAmount: 0,
    categoryId: 'cat5',
    userId: 'demo-user'
  },
  {
    id: 'exp4',
    amount: 150,
    description: 'Cena con Amigos',
    date: new Date(currentYear, currentMonth, 18).toISOString(),
    isPaid: true,
    paidAmount: 150,
    categoryId: 'cat4',
    userId: 'demo-user'
  },
];

export const MOCK_SAVINGS: SavingsGoal[] = [
  {
    id: 'sav1',
    name: 'Fondo de Emergencia',
    targetAmount: 10000,
    currentAmount: 2500,
    targetDate: new Date(currentYear + 1, 11, 31).toISOString(),
    userId: 'demo-user',
    contributions: [
      { id: 'con1', amount: 1000, date: new Date(currentYear, currentMonth - 2, 1).toISOString(), savingsGoalId: 'sav1' },
      { id: 'con2', amount: 1000, date: new Date(currentYear, currentMonth - 1, 1).toISOString(), savingsGoalId: 'sav1' },
      { id: 'con3', amount: 500, date: new Date(currentYear, currentMonth, 1).toISOString(), savingsGoalId: 'sav1' },
    ]
  },
  {
    id: 'sav2',
    name: 'Viaje a Japón',
    targetAmount: 5000,
    currentAmount: 1200,
    targetDate: new Date(currentYear + 1, 5, 15).toISOString(),
    userId: 'demo-user',
    contributions: [
      { id: 'con4', amount: 600, date: new Date(currentYear, currentMonth - 1, 10).toISOString(), savingsGoalId: 'sav2' },
      { id: 'con5', amount: 600, date: new Date(currentYear, currentMonth, 10).toISOString(), savingsGoalId: 'sav2' },
    ]
  }
];

export const MOCK_DEBTS: Debt[] = [
  {
    id: 'debt1',
    name: 'Tarjeta de Crédito Visa',
    initialAmount: 2000,
    currentBalance: 1200,
    userId: 'demo-user',
    payments: [
      { id: 'pay1', amount: 400, date: new Date(currentYear, currentMonth - 1, 20).toISOString(), debtId: 'debt1' },
      { id: 'pay2', amount: 400, date: new Date(currentYear, currentMonth, 20).toISOString(), debtId: 'debt1' },
    ]
  },
  {
    id: 'debt2',
    name: 'Préstamo Personal',
    initialAmount: 5000,
    currentBalance: 4500,
    userId: 'demo-user',
    payments: [
      { id: 'pay3', amount: 500, date: new Date(currentYear, currentMonth, 25).toISOString(), debtId: 'debt2' },
    ]
  }
];
