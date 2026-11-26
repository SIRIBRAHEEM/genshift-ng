import { describe, it, expect } from "vitest";
import { fuelCost, co2FromFuel, applianceKwh, monthlyCost, shiftSavings, paybackMonths, summariseLogs, formatNaira, treesEquivalent } from "./calc.js";

describe("GenShift calculations", () => {
  it("fuel cost multiplies litres by price", () => {
    expect(fuelCost(10, 1100)).toBe(11000);
  });
  it("fuel cost handles zero and bad input", () => {
    expect(fuelCost(0)).toBe(0);
    expect(fuelCost(-5)).toBe(0);
  });
  it("co2 uses 2.31 kg per litre", () => {
    expect(co2FromFuel(10)).toBeCloseTo(23.1);
  });
  it("appliance kwh converts watts and hours", () => {
    expect(applianceKwh(100, 5)).toBeCloseTo(0.5);
    expect(applianceKwh(60, 10, 2)).toBeCloseTo(1.2);
  });
  it("monthly cost scales daily kwh by 30 days", () => {
    expect(monthlyCost(2, 210)).toBe(12600);
  });
  it("shift savings computes monthly fuel and naira saved", () => {
    const s = shiftSavings({ cutHoursPerDay: 3, litresPerHour: 0.8, fuelPrice: 1100 });
    expect(s.litresSavedPerMonth).toBeCloseTo(72);
    expect(s.nairaSavedPerMonth).toBeCloseTo(79200);
    expect(s.co2SavedPerMonth).toBeCloseTo(166.32);
  });
  it("payback divides system cost by monthly saving", () => {
    expect(paybackMonths(600000, 60000)).toBe(10);
    expect(paybackMonths(600000, 0)).toBe(Infinity);
  });
  it("summarise logs totals fuel, hours, cost and co2", () => {
    const s = summariseLogs([
      { fuelLitres: 4, genHours: 5, nepaHours: 6 },
      { fuelLitres: 6, genHours: 7, nepaHours: 4 },
    ], 1000);
    expect(s.days).toBe(2);
    expect(s.totalFuel).toBe(10);
    expect(s.fuelCost).toBe(10000);
    expect(s.avgGenHoursPerDay).toBe(6);
  });
  it("formatNaira adds separators", () => {
    expect(formatNaira(123456)).toBe("NGN 123,456");
  });
  it("trees equivalent uses 21 kg per tree year", () => {
    expect(treesEquivalent(42)).toBe(2);
  });
});
