import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  addDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User, Category, Income, Expense, SavingsGoal, Debt, DebtPayment, SavingsContribution } from '../types';

// Helper to handle Firestore errors
const handleFirestoreError = (error: any, operation: string, path: string) => {
  console.error(`Firestore Error [${operation}] at ${path}:`, error);
  throw error;
};

// User Profile
export const getUser = async (userId: string): Promise<User | null> => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? (docSnap.data() as User) : null;
  } catch (error) {
    return handleFirestoreError(error, 'GET', `users/${userId}`);
  }
};

export const createUser = async (user: User): Promise<void> => {
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, 'CREATE', `users/${user.id}`);
  }
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId), data);
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `users/${userId}`);
  }
};

// Categories
export const getCategories = (userId: string, callback: (categories: Category[]) => void) => {
  const q = query(collection(db, 'users', userId, 'categories'));
  return onSnapshot(q, (snapshot) => {
    const categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
    callback(categories);
  });
};

export const addCategory = async (userId: string, category: Omit<Category, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'categories'), category);
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'ADD', `users/${userId}/categories`);
  }
};

export const updateCategory = async (userId: string, categoryId: string, data: Partial<Category>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId, 'categories', categoryId), data);
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `users/${userId}/categories/${categoryId}`);
  }
};

export const deleteCategory = async (userId: string, categoryId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'categories', categoryId));
  } catch (error) {
    handleFirestoreError(error, 'DELETE', `users/${userId}/categories/${categoryId}`);
  }
};

// Incomes
export const getIncomes = (userId: string, month: number, year: number, callback: (incomes: Income[]) => void) => {
  const q = query(collection(db, 'users', userId, 'incomes'));
  return onSnapshot(q, (snapshot) => {
    const incomes = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Income))
      .filter(inc => {
        const date = new Date(inc.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });
    callback(incomes);
  });
};

export const addIncome = async (userId: string, income: Omit<Income, 'id' | 'userId'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'incomes'), { ...income, userId });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'ADD', `users/${userId}/incomes`);
  }
};

export const updateIncome = async (userId: string, incomeId: string, data: Partial<Income>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId, 'incomes', incomeId), data);
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `users/${userId}/incomes/${incomeId}`);
  }
};

export const deleteIncome = async (userId: string, incomeId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'incomes', incomeId));
  } catch (error) {
    handleFirestoreError(error, 'DELETE', `users/${userId}/incomes/${incomeId}`);
  }
};

// Expenses
export const getExpenses = (userId: string, month: number, year: number, callback: (expenses: Expense[]) => void) => {
  const q = query(collection(db, 'users', userId, 'expenses'));
  return onSnapshot(q, (snapshot) => {
    const expenses = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Expense))
      .filter(exp => {
        const date = new Date(exp.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });
    callback(expenses);
  });
};

export const addExpense = async (userId: string, expense: Omit<Expense, 'id' | 'userId' | 'category'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'expenses'), { ...expense, userId });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'ADD', `users/${userId}/expenses`);
  }
};

export const updateExpense = async (userId: string, expenseId: string, data: Partial<Expense>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId, 'expenses', expenseId), data);
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `users/${userId}/expenses/${expenseId}`);
  }
};

export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'expenses', expenseId));
  } catch (error) {
    handleFirestoreError(error, 'DELETE', `users/${userId}/expenses/${expenseId}`);
  }
};

// Savings Goals
export const getSavingsGoals = (userId: string, callback: (goals: SavingsGoal[]) => void) => {
  const q = query(collection(db, 'users', userId, 'savingsGoals'));
  return onSnapshot(q, (snapshot) => {
    const goals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SavingsGoal));
    callback(goals);
  });
};

export const addSavingsGoal = async (userId: string, goal: Omit<SavingsGoal, 'id' | 'userId' | 'currentAmount' | 'contributions'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'savingsGoals'), { 
      ...goal, 
      userId, 
      currentAmount: 0, 
      contributions: [] 
    });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'ADD', `users/${userId}/savingsGoals`);
  }
};

export const updateSavingsGoal = async (userId: string, goalId: string, data: Partial<SavingsGoal>): Promise<void> => {
  try {
    await updateDoc(doc(db, 'users', userId, 'savingsGoals', goalId), data);
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `users/${userId}/savingsGoals/${goalId}`);
  }
};

export const deleteSavingsGoal = async (userId: string, goalId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'savingsGoals', goalId));
  } catch (error) {
    handleFirestoreError(error, 'DELETE', `users/${userId}/savingsGoals/${goalId}`);
  }
};

export const addSavingsContribution = async (userId: string, goalId: string, contribution: Omit<SavingsContribution, 'id' | 'savingsGoalId'>): Promise<void> => {
  try {
    const id = Math.random().toString(36).substr(2, 9);
    const newContribution = { ...contribution, id, savingsGoalId: goalId };
    const goalRef = doc(db, 'users', userId, 'savingsGoals', goalId);
    const goalSnap = await getDoc(goalRef);
    if (goalSnap.exists()) {
      const currentAmount = (goalSnap.data().currentAmount || 0) + contribution.amount;
      await updateDoc(goalRef, {
        contributions: arrayUnion(newContribution),
        currentAmount
      });
    }
  } catch (error) {
    handleFirestoreError(error, 'ADD_CONTRIBUTION', `users/${userId}/savingsGoals/${goalId}`);
  }
};

export const deleteSavingsContribution = async (userId: string, goalId: string, contributionId: string): Promise<void> => {
  try {
    const goalRef = doc(db, 'users', userId, 'savingsGoals', goalId);
    const goalSnap = await getDoc(goalRef);
    if (goalSnap.exists()) {
      const data = goalSnap.data();
      const contribution = data.contributions.find((c: any) => c.id === contributionId);
      if (contribution) {
        const currentAmount = (data.currentAmount || 0) - contribution.amount;
        await updateDoc(goalRef, {
          contributions: arrayRemove(contribution),
          currentAmount
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, 'DELETE_CONTRIBUTION', `users/${userId}/savingsGoals/${goalId}`);
  }
};

export const updateSavingsContribution = async (userId: string, goalId: string, contributionId: string, data: Partial<SavingsContribution>): Promise<void> => {
  try {
    const goalRef = doc(db, 'users', userId, 'savingsGoals', goalId);
    const goalSnap = await getDoc(goalRef);
    if (goalSnap.exists()) {
      const goalData = goalSnap.data();
      const contributions = [...(goalData.contributions || [])];
      const index = contributions.findIndex((c: any) => c.id === contributionId);
      if (index !== -1) {
        const oldAmount = contributions[index].amount;
        contributions[index] = { ...contributions[index], ...data };
        const newAmount = contributions[index].amount;
        const currentAmount = (goalData.currentAmount || 0) - oldAmount + newAmount;
        await updateDoc(goalRef, {
          contributions,
          currentAmount
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, 'UPDATE_CONTRIBUTION', `users/${userId}/savingsGoals/${goalId}`);
  }
};

// Debts
export const getDebts = (userId: string, callback: (debts: Debt[]) => void) => {
  const q = query(collection(db, 'users', userId, 'debts'));
  return onSnapshot(q, (snapshot) => {
    const debts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Debt));
    callback(debts);
  });
};

export const addDebt = async (userId: string, debt: Omit<Debt, 'id' | 'userId' | 'currentBalance' | 'payments'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'debts'), { 
      ...debt, 
      userId, 
      currentBalance: debt.initialAmount, 
      payments: [] 
    });
    return docRef.id;
  } catch (error) {
    return handleFirestoreError(error, 'ADD', `users/${userId}/debts`);
  }
};

export const deleteDebt = async (userId: string, debtId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId, 'debts', debtId));
  } catch (error) {
    handleFirestoreError(error, 'DELETE', `users/${userId}/debts/${debtId}`);
  }
};

export const updateDebt = async (userId: string, debtId: string, data: Partial<Debt>): Promise<void> => {
  try {
    const debtRef = doc(db, 'users', userId, 'debts', debtId);
    await updateDoc(debtRef, data);
  } catch (error) {
    handleFirestoreError(error, 'UPDATE', `users/${userId}/debts/${debtId}`);
  }
};

export const addDebtPayment = async (userId: string, debtId: string, payment: Omit<DebtPayment, 'id' | 'debtId'>): Promise<void> => {
  try {
    const id = Math.random().toString(36).substr(2, 9);
    const newPayment = { ...payment, id, debtId };
    const debtRef = doc(db, 'users', userId, 'debts', debtId);
    const debtSnap = await getDoc(debtRef);
    if (debtSnap.exists()) {
      const currentBalance = (debtSnap.data().currentBalance || 0) - payment.amount;
      await updateDoc(debtRef, {
        payments: arrayUnion(newPayment),
        currentBalance
      });
    }
  } catch (error) {
    handleFirestoreError(error, 'ADD_PAYMENT', `users/${userId}/debts/${debtId}`);
  }
};

export const deleteDebtPayment = async (userId: string, debtId: string, paymentId: string): Promise<void> => {
  try {
    const debtRef = doc(db, 'users', userId, 'debts', debtId);
    const debtSnap = await getDoc(debtRef);
    if (debtSnap.exists()) {
      const data = debtSnap.data();
      const payment = data.payments.find((p: any) => p.id === paymentId);
      if (payment) {
        const currentBalance = (data.currentBalance || 0) + payment.amount;
        await updateDoc(debtRef, {
          payments: arrayRemove(payment),
          currentBalance
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, 'DELETE_PAYMENT', `users/${userId}/debts/${debtId}`);
  }
};

export const updateDebtPayment = async (userId: string, debtId: string, paymentId: string, data: Partial<DebtPayment>): Promise<void> => {
  try {
    const debtRef = doc(db, 'users', userId, 'debts', debtId);
    const debtSnap = await getDoc(debtRef);
    if (debtSnap.exists()) {
      const debtData = debtSnap.data();
      const payments = [...(debtData.payments || [])];
      const index = payments.findIndex((p: any) => p.id === paymentId);
      if (index !== -1) {
        const oldAmount = payments[index].amount;
        payments[index] = { ...payments[index], ...data };
        const newAmount = payments[index].amount;
        const currentBalance = (debtData.currentBalance || 0) + oldAmount - newAmount;
        await updateDoc(debtRef, {
          payments,
          currentBalance
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, 'UPDATE_PAYMENT', `users/${userId}/debts/${debtId}`);
  }
};
