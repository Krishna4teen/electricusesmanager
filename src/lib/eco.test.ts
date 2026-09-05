import { describe, expect, it } from "vitest";

import {
  buildRecommendations,
  buildReductionPlan,
  computeResults,
  dailyKwhFor,
  newAppliance,
  statusFor,
  validateAppliance,
} from "./eco";

const ac = newAppliance({
  name: "Air Conditioner (1.5 ton)",
  watts: 1500,
  hoursPerDay: 8,
  quantity: 1,
  daysPerWeek: 7,
});

const fan = newAppliance({
  name: "Ceiling Fan",
  watts: 75,
  hoursPerDay: 12,
  quantity: 2,
  daysPerWeek: 7,
});

describe("known worked examples", () => {
  it("AC 1500W x 8h = 12 kWh/day, 360/month, 4380/year", () => {
    expect(dailyKwhFor(ac)).toBeCloseTo(12, 6);
    const { totals } = computeResults([ac], 0.15);
    expect(totals.dailyKwh).toBeCloseTo(12, 6);
    expect(totals.monthlyKwh).toBeCloseTo(360, 6);
    expect(totals.yearlyKwh).toBeCloseTo(4380, 6);
    expect(totals.monthlyCost).toBeCloseTo(54, 6);
    expect(totals.dailyCost).toBeCloseTo(1.8, 6);
  });

  it("2 fans 75W x 12h = 1.8 kWh/day, 54/month", () => {
    expect(dailyKwhFor(fan)).toBeCloseTo(1.8, 6);
    const { totals } = computeResults([fan], 0.15);
    expect(totals.monthlyKwh).toBeCloseTo(54, 6);
    expect(totals.yearlyKwh).toBeCloseTo(657, 6);
  });

  it("part-time use is averaged over the week", () => {
    const iron = newAppliance({ name: "Electric Iron", watts: 1000, hoursPerDay: 1, quantity: 1, daysPerWeek: 1 });
    expect(dailyKwhFor(iron)).toBeCloseTo(1 / 7, 6);
  });

  it("combines appliances and ranks by monthly use", () => {
    const { rows, totals } = computeResults([fan, ac], 0.2);
    expect(rows[0]!.name).toContain("Air Conditioner");
    expect(totals.dailyKwh).toBeCloseTo(13.8, 6);
    expect(totals.monthlyKwh).toBeCloseTo(414, 6);
    expect(rows[0]!.share).toBeCloseTo(360 / 414, 6);
    expect(totals.yearlyCost).toBeCloseTo(13.8 * 365 * 0.2, 6);
  });
});

describe("status bands", () => {
  it("classifies by monthly kWh", () => {
    expect(statusFor(80).key).toBe("low");
    expect(statusFor(200).key).toBe("moderate");
    expect(statusFor(414).key).toBe("high");
    expect(statusFor(900).key).toBe("very-high");
  });
});

describe("recommendations and plan", () => {
  it("ranks the biggest consumer first and projects savings", () => {
    const { rows, totals } = computeResults([fan, ac], 0.15);
    const recs = buildRecommendations(rows);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0]!.appliance).toContain("Air Conditioner");
    const plan = buildReductionPlan(recs, totals, 0.15);
    expect(plan.totalKwhSaved).toBeGreaterThan(0);
    expect(plan.projectedMonthlyKwh).toBeLessThan(totals.monthlyKwh);
    expect(plan.totalCostSaved).toBeCloseTo(plan.totalKwhSaved * 0.15, 6);
  });
});

describe("validation", () => {
  it("rejects bad input", () => {
    const bad = newAppliance({ name: "", watts: 0, hoursPerDay: 30, quantity: 0, daysPerWeek: 9 });
    const errors = validateAppliance(bad);
    expect(errors.name).toBeDefined();
    expect(errors.watts).toBeDefined();
    expect(errors.hoursPerDay).toBeDefined();
    expect(errors.quantity).toBeDefined();
    expect(errors.daysPerWeek).toBeDefined();
  });

  it("accepts good input", () => {
    expect(validateAppliance(ac)).toEqual({});
  });
});

describe("presets, currencies and fallback advice", () => {
  it("offers 50+ presets across every category", () => {
    expect(APPLIANCE_PRESETS.length).toBeGreaterThanOrEqual(50);
    for (const category of APPLIANCE_CATEGORIES) {
      expect(APPLIANCE_PRESETS.some((p) => p.category === category)).toBe(true);
    }
    for (const p of APPLIANCE_PRESETS) {
      expect(p.watts).toBeGreaterThan(0);
      expect(p.typicalHours).toBeGreaterThan(0);
    }
  });

  it("defaults to INR and supports the practical currency options", () => {
    expect(DEFAULT_CURRENCY).toBe("INR");
    for (const code of ["INR", "USD", "EUR", "GBP", "BDT", "AED"]) {
      expect(CURRENCIES.some((c) => c.code === code)).toBe(true);
    }
    expect(formatMoney(100, "INR")).toContain("₹");
  });

  it("gives general advice for an unmatched custom appliance", () => {
    const rows = calculateAppliances([
      newAppliance({ name: "Zorblax widget", watts: 500, hoursPerDay: 4, quantity: 1 }),
    ]);
    const recs = buildRecommendations(rows);
    expect(recs.length).toBeGreaterThan(0);
    expect(recs[0].appliance).toBe("Zorblax widget");
    expect(recs[0].monthlyKwhSaved).toBeGreaterThan(0);
  });

  it("ranks recommendations by recorded consumption", () => {
    const rows = calculateAppliances([
      newAppliance({ name: "Ceiling fan", watts: 75, hoursPerDay: 6, quantity: 1 }),
      newAppliance({ name: "Air conditioner", watts: 1500, hoursPerDay: 8, quantity: 1 }),
    ]);
    const recs = buildRecommendations(rows);
    expect(recs[0].appliance).toBe("Air conditioner");
  });
});
