import { describe, it, expect } from "vitest";
import { 
  IncomeSchema, 
  ExpenseSchema, 
  SavingsGoalSchema, 
  DebtSchema, 
  DebtPaymentSchema 
} from "./schemas";

describe("Form Validation Schemas", () => {
  describe("IncomeSchema", () => {
    it("should validate correct income data", () => {
      const data = { amount: 1000, description: "Salario", type: "monthly", userId: 1 };
      expect(IncomeSchema.safeParse(data).success).toBe(true);
    });

    it("should fail if amount is negative", () => {
      const data = { amount: -100, description: "Salario", type: "monthly", userId: 1 };
      const result = IncomeSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const hasError = result.error.issues.some(e => e.message === "El monto debe ser mayor a cero");
        expect(hasError).toBe(true);
      }
    });

    it("should fail if description is empty", () => {
      const data = { amount: 1000, description: "", type: "monthly", userId: 1 };
      const result = IncomeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("DebtPaymentSchema", () => {
    it("should validate correct payment", () => {
      const data = { amount: 500, debtId: 1 };
      expect(DebtPaymentSchema.safeParse(data).success).toBe(true);
    });

    it("should fail if amount is zero or negative", () => {
      expect(DebtPaymentSchema.safeParse({ amount: 0, debtId: 1 }).success).toBe(false);
      expect(DebtPaymentSchema.safeParse({ amount: -10, debtId: 1 }).success).toBe(false);
    });
  });

  describe("SavingsGoalSchema", () => {
    it("should validate correct goal", () => {
      const data = { name: "Viaje", targetAmount: 5000, targetDate: "2026-12-31", userId: 1 };
      expect(SavingsGoalSchema.safeParse(data).success).toBe(true);
    });

    it("should fail with invalid date", () => {
      const data = { name: "Viaje", targetAmount: 5000, targetDate: "not-a-date", userId: 1 };
      expect(SavingsGoalSchema.safeParse(data).success).toBe(false);
    });
  });
});
