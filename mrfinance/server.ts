import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import { z } from "zod";
import { Decimal } from "decimal.js";

import { 
  IncomeSchema, 
  ExpenseSchema, 
  SavingsGoalSchema, 
  DebtSchema, 
  DebtPaymentSchema,
  CategorySchema,
  SavingsContributionSchema
} from "./src/lib/schemas";

const prisma = new PrismaClient();
console.log("Prisma Client initialized");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// --- API Routes ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Auth (Simple Mock)
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for: ${email}`);
  try {
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log(`Creating new user: ${email}`);
      user = await prisma.user.create({
        data: { email, password, name: email.split("@")[0] }
      });
    }
    res.json({ user });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ 
      error: "Error en el servidor de autenticación",
      details: err.message || String(err)
    });
  }
});

app.put("/api/users/:id", async (req, res) => {
  const { name } = req.body;
  const id = parseInt(req.params.id);
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { name }
    });
    res.json({ user: updatedUser });
  } catch (err: any) {
    console.error("Update user error:", err);
    res.status(400).json({ error: "Error al actualizar perfil" });
  }
});

// Dashboard Data
app.get("/api/dashboard/:userId", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const month = req.query.month ? parseInt(req.query.month as string) : null;
  const year = req.query.year ? parseInt(req.query.year as string) : null;

  console.log(`Dashboard request for user ${userId}, month: ${month}, year: ${year}`);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "ID de usuario inválido" });
  }

  try {
    let dateFilter: any = {};
    if (month !== null && year !== null) {
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      dateFilter = {
        date: {
          gte: startDate,
          lte: endDate
        }
      };
      console.log(`Applying date filter: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    }

    const incomes = await prisma.income.findMany({ 
      where: { userId, ...dateFilter }, 
      orderBy: { date: 'desc' } 
    });
    const expenses = await prisma.expense.findMany({ 
      where: { userId, ...dateFilter }, 
      include: { category: true },
      orderBy: { date: 'desc' }
    });
    const savingsGoals = await prisma.savingsGoal.findMany({ 
      where: { userId },
      include: { 
        contributions: { 
          where: dateFilter,
          orderBy: { date: 'desc' } 
        } 
      }
    });
    const debts = await prisma.debt.findMany({ 
      where: { userId }, 
      include: { 
        payments: {
          where: dateFilter,
          orderBy: { date: 'desc' }
        } 
      } 
    });

    const totalIncome = incomes.reduce((sum, inc) => new Decimal(sum).plus(inc.amount).toNumber(), 0);
    const totalExpenses = expenses.reduce((sum, exp) => new Decimal(sum).plus(exp.amount).toNumber(), 0);
    const totalPaidExpenses = expenses.reduce((sum, exp) => new Decimal(sum).plus(exp.paidAmount || 0).toNumber(), 0);
    
    // Calculate monthly activity
    const monthlySavings = savingsGoals.reduce((sum, goal) => {
      const goalMonthly = goal.contributions.reduce((s, c) => new Decimal(s).plus(c.amount).toNumber(), 0);
      return new Decimal(sum).plus(goalMonthly).toNumber();
    }, 0);
    
    const monthlyDebtPayments = debts.reduce((sum, debt) => {
      const debtMonthly = debt.payments.reduce((s, p) => new Decimal(s).plus(p.amount).toNumber(), 0);
      return new Decimal(sum).plus(debtMonthly).toNumber();
    }, 0);

    // Remaining income is what's left after paid expenses, savings and debt payments
    const remainingIncome = new Decimal(totalIncome)
      .minus(totalPaidExpenses)
      .minus(monthlySavings)
      .minus(monthlyDebtPayments)
      .toNumber();

    // Current state totals
    const totalSavings = savingsGoals.reduce((sum, goal) => new Decimal(sum).plus(goal.currentAmount).toNumber(), 0);
    const totalDebt = debts.reduce((sum, debt) => new Decimal(sum).plus(debt.currentBalance).toNumber(), 0);

    res.json({
      totalIncome,
      totalExpenses,
      totalPaidExpenses,
      remainingIncome,
      totalSavings,
      totalDebt,
      monthlySavings,
      monthlyDebtPayments,
      incomes,
      expenses,
      savingsGoals,
      debts
    });
  } catch (err: any) {
    console.error("Dashboard error:", err);
    res.status(500).json({ error: "Error al cargar datos del dashboard", details: err.message });
  }
});

// --- Incomes CRUD ---
app.post("/api/incomes", async (req, res) => {
  try {
    const data = IncomeSchema.parse(req.body);
    const income = await prisma.income.create({ data });
    res.json(income);
  } catch (err: any) {
    console.error("Income create error:", err);
    res.status(400).json({ error: err.message || "Error al crear ingreso" });
  }
});

app.delete("/api/incomes/:id", async (req, res) => {
  try {
    await prisma.income.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: "Error al eliminar ingreso" });
  }
});

app.put("/api/incomes/:id", async (req, res) => {
  try {
    const data = IncomeSchema.parse(req.body);
    const income = await prisma.income.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(income);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Error al actualizar ingreso" });
  }
});

// --- Expenses CRUD ---
app.post("/api/expenses", async (req, res) => {
  try {
    const data = ExpenseSchema.parse(req.body);
    const expense = await prisma.expense.create({ data });
    res.json(expense);
  } catch (err: any) {
    console.error("Expense create error:", err);
    res.status(400).json({ error: err.message || "Error al crear gasto" });
  }
});

app.delete("/api/expenses/:id", async (req, res) => {
  try {
    await prisma.expense.delete({ where: { id: parseInt(req.params.id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(400).json({ error: "Error al eliminar gasto" });
  }
});

app.put("/api/expenses/:id", async (req, res) => {
  try {
    const data = ExpenseSchema.parse(req.body);
    const expense = await prisma.expense.update({
      where: { id: parseInt(req.params.id) },
      data
    });
    res.json(expense);
  } catch (err: any) {
    res.status(400).json({ error: err.message || "Error al actualizar gasto" });
  }
});

// --- Savings Goals CRUD ---
app.post("/api/savings-goals", async (req, res) => {
  console.log("POST /api/savings-goals", req.body);
  try {
    const validatedData = SavingsGoalSchema.parse(req.body);
    const goal = await prisma.savingsGoal.create({
      data: {
        name: validatedData.name,
        targetAmount: validatedData.targetAmount,
        targetDate: new Date(validatedData.targetDate),
        user: { connect: { id: validatedData.userId } }
      }
    });
    console.log("Goal created:", goal);
    res.json(goal);
  } catch (err) {
    console.error("Error creating goal:", err);
    res.status(400).json({ error: err });
  }
});

app.patch("/api/savings-goals/:id/add", async (req, res) => {
  const { amount } = req.body;
  console.log(`PATCH /api/savings-goals/${req.params.id}/add`, req.body);
  
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: "El monto debe ser un número positivo" });
  }

  try {
    const goal = await prisma.savingsGoal.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!goal) return res.status(404).json({ error: "Goal not found" });
    
    const updated = await prisma.savingsGoal.update({
      where: { id: goal.id },
      data: { currentAmount: new Decimal(goal.currentAmount).plus(amount).toNumber() }
    });
    console.log("Goal updated:", updated);
    res.json(updated);
  } catch (err) {
    console.error("Error updating goal:", err);
    res.status(400).json({ error: "Update error" });
  }
});

app.post("/api/savings-contributions", async (req, res) => {
  try {
    const data = SavingsContributionSchema.parse(req.body);
    const goal = await prisma.savingsGoal.findUnique({ where: { id: data.savingsGoalId } });
    if (!goal) return res.status(404).json({ error: "Meta de ahorro no encontrada" });

    const contribution = await prisma.savingsContribution.create({
      data: {
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        savingsGoalId: data.savingsGoalId
      }
    });

    await prisma.savingsGoal.update({
      where: { id: goal.id },
      data: { currentAmount: new Decimal(goal.currentAmount).plus(data.amount).toNumber() }
    });

    res.json(contribution);
  } catch (err: any) {
    console.error("Error creating contribution:", err);
    res.status(400).json({ error: err.message || "Error al crear aporte" });
  }
});

app.delete("/api/savings-contributions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const contribution = await prisma.savingsContribution.findUnique({ where: { id } });
    if (!contribution) return res.status(404).json({ error: "Aporte no encontrado" });

    await prisma.savingsGoal.update({
      where: { id: contribution.savingsGoalId },
      data: { currentAmount: { decrement: contribution.amount } }
    });

    await prisma.savingsContribution.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Error al eliminar aporte" });
  }
});

app.put("/api/savings-contributions/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { amount, date } = SavingsContributionSchema.parse(req.body);
    
    const oldContribution = await prisma.savingsContribution.findUnique({ where: { id } });
    if (!oldContribution) return res.status(404).json({ error: "Aporte no encontrado" });

    const updatedContribution = await prisma.savingsContribution.update({
      where: { id },
      data: {
        amount,
        date: date ? new Date(date) : oldContribution.date
      }
    });

    // Update goal currentAmount: subtract old, add new
    const goal = await prisma.savingsGoal.findUnique({ where: { id: oldContribution.savingsGoalId } });
    if (goal) {
      await prisma.savingsGoal.update({
        where: { id: goal.id },
        data: { 
          currentAmount: new Decimal(goal.currentAmount)
            .minus(oldContribution.amount)
            .plus(amount)
            .toNumber() 
        }
      });
    }

    res.json(updatedContribution);
  } catch (err: any) {
    console.error("Error updating contribution:", err);
    res.status(400).json({ error: err.message || "Error al actualizar aporte" });
  }
});

app.delete("/api/savings-goals/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Delete contributions first
    await prisma.savingsContribution.deleteMany({ where: { savingsGoalId: id } });
    await prisma.savingsGoal.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: "Delete error" });
  }
});

app.put("/api/savings-goals/:id", async (req, res) => {
  try {
    const { name, targetAmount, targetDate } = req.body;
    const updated = await prisma.savingsGoal.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        targetAmount: parseFloat(targetAmount),
        targetDate: new Date(targetDate)
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Update error" });
  }
});

// --- Debts CRUD ---
app.post("/api/debts", async (req, res) => {
  try {
    const data = DebtSchema.parse(req.body);
    const debt = await prisma.debt.create({
      data: { ...data, currentBalance: data.initialAmount }
    });
    res.json(debt);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

app.delete("/api/debts/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Delete payments first
    await prisma.debtPayment.deleteMany({ where: { debtId: id } });
    await prisma.debt.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting debt:", err);
    res.status(400).json({ error: "Error al eliminar la deuda" });
  }
});

app.post("/api/debt-payments", async (req, res) => {
  try {
    const data = DebtPaymentSchema.parse(req.body);
    
    const debt = await prisma.debt.findUnique({ where: { id: data.debtId } });
    if (!debt) return res.status(404).json({ error: "Deuda no encontrada" });

    // Asegurar que el pago no exceda el saldo actual
    const paymentAmount = Math.min(data.amount, debt.currentBalance);
    
    if (paymentAmount <= 0) {
      return res.status(400).json({ error: "La deuda ya está pagada o el monto es inválido" });
    }

    const payment = await prisma.debtPayment.create({ 
      data: { ...data, amount: paymentAmount } 
    });
    
    await prisma.debt.update({
      where: { id: data.debtId },
      data: { currentBalance: new Decimal(debt.currentBalance).minus(paymentAmount).toNumber() }
    });

    res.json(payment);
  } catch (err) {
    res.status(400).json({ error: err });
  }
});

// --- Categories ---
app.get("/api/categories", async (req, res) => {
  let categories = await prisma.category.findMany();
  if (categories.length === 0) {
    const defaults = ["Alimentación", "Transporte", "Vivienda", "Entretenimiento", "Salud", "Otros"];
    await prisma.category.createMany({
      data: defaults.map(name => ({ name }))
    });
    categories = await prisma.category.findMany();
  }
  res.json(categories);
});

app.post("/api/categories", async (req, res) => {
  try {
    const data = CategorySchema.parse(req.body);
    const category = await prisma.category.create({ data });
    res.json(category);
  } catch (err: any) {
    console.error("Category create error:", err);
    res.status(400).json({ error: err.message || "Error al crear categoría" });
  }
});

app.delete("/api/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    // Check if category has expenses
    const expensesCount = await prisma.expense.count({ where: { categoryId: id } });
    if (expensesCount > 0) {
      return res.status(400).json({ error: "No se puede eliminar una categoría que tiene gastos asociados" });
    }
    await prisma.category.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error("Category delete error:", err);
    res.status(400).json({ error: "Error al eliminar categoría" });
  }
});

app.put("/api/categories/:id", async (req, res) => {
  const { name, budget } = req.body;
  const id = parseInt(req.params.id);
  console.log(`PUT /api/categories/${id}`, { name, budget });
  try {
    const updated = await prisma.category.update({
      where: { id },
      data: { 
        name: name !== undefined ? name : undefined,
        budget: budget !== undefined ? parseFloat(budget) : undefined 
      }
    });
    console.log("Category updated:", updated);
    res.json(updated);
  } catch (err) {
    console.error("Category update error:", err);
    res.status(400).json({ error: "Update error" });
  }
});

// --- 404 Handler for API ---
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
