import { describe, it, expect } from "vitest";
import { 
  calculateRecommendedMonthlySaving, 
  calculatePercentage, 
  calculateNewDebtBalance, 
  calculateSavingsByPercentage,
  calculateAvailableBudget
} from "./calculations";

describe("Financial Calculations", () => {
  describe("calculateRecommendedMonthlySaving", () => {
    it("should calculate correct monthly saving", () => {
      // Target: 1000, Current: 0, Date: 10 months from now
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 10);
      const result = calculateRecommendedMonthlySaving(1000, 0, targetDate.toISOString());
      expect(result).toBe(100);
    });

    it("should return 0 if goal is already reached", () => {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + 10);
      const result = calculateRecommendedMonthlySaving(1000, 1200, targetDate.toISOString());
      expect(result).toBe(0);
    });

    it("should handle same month or past date by using 1 month", () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      const result = calculateRecommendedMonthlySaving(1000, 0, pastDate.toISOString());
      expect(result).toBe(1000);
    });
  });

  describe("calculatePercentage", () => {
    it("should calculate correct percentage", () => {
      expect(calculatePercentage(50, 200)).toBe(25);
    });

    it("should return 0 if total income is 0", () => {
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });

  describe("calculateNewDebtBalance", () => {
    it("should subtract payment from balance", () => {
      expect(calculateNewDebtBalance(1000, 200)).toBe(800);
    });

    it("should not go below zero (edge case: partial payment exceeding balance)", () => {
      expect(calculateNewDebtBalance(100, 150)).toBe(0);
    });

    it("should handle full payment", () => {
      expect(calculateNewDebtBalance(500, 500)).toBe(0);
    });
  });

  describe("calculateSavingsByPercentage", () => {
    it("should calculate savings based on percentage", () => {
      expect(calculateSavingsByPercentage(2000, 10)).toBe(200);
    });

    it("should return 0 if income or percentage is 0", () => {
      expect(calculateSavingsByPercentage(0, 10)).toBe(0);
      expect(calculateSavingsByPercentage(2000, 0)).toBe(0);
    });
  });

  describe("calculateAvailableBudget", () => {
    it("should calculate remaining budget correctly", () => {
      expect(calculateAvailableBudget(5000, 2000, 500)).toBe(2500);
    });

    it("should handle negative budget (overspending)", () => {
      expect(calculateAvailableBudget(1000, 1200, 0)).toBe(-200);
    });

    it("should reflect income changes immediately", () => {
      const initialBudget = calculateAvailableBudget(3000, 1000, 500);
      expect(initialBudget).toBe(1500);
      
      const updatedBudget = calculateAvailableBudget(4000, 1000, 500);
      expect(updatedBudget).toBe(2500);
    });
  });

  describe("Complex Scenarios", () => {
    it("should handle mixed fixed and percentage savings", () => {
      const income = 5000;
      const fixedSaving = 500;
      const percentageSaving = calculateSavingsByPercentage(income, 10); // 500
      
      const totalSavings = fixedSaving + percentageSaving;
      expect(totalSavings).toBe(1000);
      
      const expenses = 2000;
      const available = calculateAvailableBudget(income, expenses, totalSavings);
      expect(available).toBe(2000);
    });
  });
});
