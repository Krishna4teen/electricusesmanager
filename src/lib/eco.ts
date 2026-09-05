// ECO-WATT calculation engine.
// All energy math lives here so it can be unit-tested independently of the UI.

export type Appliance = {
  id: string;
  name: string;
  watts: number;
  hoursPerDay: number;
  quantity: number;
  daysPerWeek: number;
};

export type ApplianceResult = Appliance & {
  dailyKwh: number;
  monthlyKwh: number;
  yearlyKwh: number;
  dailyCost: number;
  monthlyCost: number;
  yearlyCost: number;
  share: number; // 0..1 of total monthly kWh
};

export type AnalysisTotals = {
  dailyKwh: number;
  monthlyKwh: number;
  yearlyKwh: number;
  dailyCost: number;
  monthlyCost: number;
  yearlyCost: number;
};

export const DAYS_PER_MONTH = 30;
export const DAYS_PER_YEAR = 365;

export const CURRENCIES = [
  { code: "INR", symbol: "₹", label: "Indian Rupee" },
  { code: "USD", symbol: "$", label: "US Dollar" },
  { code: "EUR", symbol: "€", label: "Euro" },
  { code: "GBP", symbol: "£", label: "British Pound" },
  { code: "BDT", symbol: "৳", label: "Bangladeshi Taka" },
  { code: "AED", symbol: "د.إ ", label: "UAE Dirham" },
  { code: "NGN", symbol: "₦", label: "Nigerian Naira" },
  { code: "KES", symbol: "KSh ", label: "Kenyan Shilling" },
  { code: "ZAR", symbol: "R", label: "South African Rand" },
  { code: "ETB", symbol: "Br ", label: "Ethiopian Birr" },
] as const;

export const DEFAULT_CURRENCY = "INR";

export function currencySymbol(code: string): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? code + " ";
}


export function formatMoney(value: number, code: string): string {
  return `${currencySymbol(code)}${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatKwh(value: number): string {
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} kWh`;
}

/**
 * Energy used by one appliance line in a day.
 *
 * kWh/day = (watts x hours/day x quantity / 1000) x (daysPerWeek / 7)
 *
 * The days-per-week factor averages part-time appliances across the week so
 * monthly and yearly figures stay consistent.
 */
export function dailyKwhFor(a: Appliance): number {
  const perRunDay = (a.watts * a.hoursPerDay * a.quantity) / 1000;
  return perRunDay * (a.daysPerWeek / 7);
}

export function computeResults(
  appliances: Appliance[],
  rate: number,
): { rows: ApplianceResult[]; totals: AnalysisTotals } {
  const base = appliances.map((a) => {
    const dailyKwh = dailyKwhFor(a);
    const monthlyKwh = dailyKwh * DAYS_PER_MONTH;
    const yearlyKwh = dailyKwh * DAYS_PER_YEAR;
    return {
      ...a,
      dailyKwh,
      monthlyKwh,
      yearlyKwh,
      dailyCost: dailyKwh * rate,
      monthlyCost: monthlyKwh * rate,
      yearlyCost: yearlyKwh * rate,
      share: 0,
    };
  });

  const totals: AnalysisTotals = {
    dailyKwh: sum(base.map((r) => r.dailyKwh)),
    monthlyKwh: sum(base.map((r) => r.monthlyKwh)),
    yearlyKwh: sum(base.map((r) => r.yearlyKwh)),
    dailyCost: sum(base.map((r) => r.dailyCost)),
    monthlyCost: sum(base.map((r) => r.monthlyCost)),
    yearlyCost: sum(base.map((r) => r.yearlyCost)),
  };

  const rows = base
    .map((r) => ({
      ...r,
      share: totals.monthlyKwh > 0 ? r.monthlyKwh / totals.monthlyKwh : 0,
    }))
    .sort((a, b) => b.monthlyKwh - a.monthlyKwh);

  return { rows, totals };
}

function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + v, 0);
}

/* ---------------------------------------------------------------- status */

export type StatusKey = "low" | "moderate" | "high" | "very-high";

export type StatusBand = {
  key: StatusKey;
  label: string;
  min: number; // monthly kWh, inclusive
  max: number | null; // exclusive; null = open ended
  summary: string;
  tone: "good" | "ok" | "warn" | "bad";
};

export const STATUS_BANDS: StatusBand[] = [
  {
    key: "low",
    label: "Low",
    min: 0,
    max: 150,
    tone: "good",
    summary:
      "Well below the typical household average. Your home runs lean — mostly efficient or lightly used appliances.",
  },
  {
    key: "moderate",
    label: "Moderate",
    min: 150,
    max: 350,
    tone: "ok",
    summary:
      "Around the typical household range. There is still room to trim standby loads and heavy-use appliances.",
  },
  {
    key: "high",
    label: "High",
    min: 350,
    max: 700,
    tone: "warn",
    summary:
      "Above the typical household range. One or two large appliances are likely driving most of the bill.",
  },
  {
    key: "very-high",
    label: "Very High",
    min: 700,
    max: null,
    tone: "bad",
    summary:
      "Far above the typical household range. Heating, cooling or continuously running equipment needs attention.",
  },
];

export function statusFor(monthlyKwh: number): StatusBand {
  return (
    STATUS_BANDS.find((b) => monthlyKwh >= b.min && (b.max === null || monthlyKwh < b.max)) ??
    STATUS_BANDS[0]!
  );
}

/* ------------------------------------------------------- recommendations */

export type Recommendation = {
  id: string;
  title: string;
  detail: string;
  appliance: string;
  monthlyKwhSaved: number;
  priority: number; // higher = more impactful
};

type Rule = {
  id: string;
  match: (name: string) => boolean;
  applies: (r: ApplianceResult) => boolean;
  savingFraction: number;
  title: (r: ApplianceResult) => string;
  detail: (r: ApplianceResult) => string;
};

const has = (...words: string[]) => (name: string) =>
  words.some((w) => name.toLowerCase().includes(w));

const RULES: Rule[] = [
  {
    id: "ac-thermostat",
    match: has("air condition", "air-condition", "a/c", "ac ", "aircon", "split unit"),
    applies: (r) => r.hoursPerDay > 3,
    savingFraction: 0.2,
    title: (r) => `Raise the ${r.name} setpoint by 2°C`,
    detail: (r) =>
      `Your ${r.name} runs ${r.hoursPerDay}h a day. Each degree of cooling costs roughly 6–10% more energy, so a 2°C higher setpoint plus a clean filter typically cuts about 20% of its use.`,
  },
  {
    id: "ac-hours",
    match: has("air condition", "air-condition", "aircon", "a/c", "split unit"),
    applies: (r) => r.hoursPerDay >= 8,
    savingFraction: 0.15,
    title: (r) => `Put the ${r.name} on a timer`,
    detail: (r) =>
      `Running ${r.hoursPerDay}h daily means it cools an empty or sleeping house for part of that time. A timer or sleep mode that shaves ~1.5h a day saves around 15%.`,
  },
  {
    id: "heater",
    match: has("heater", "geyser", "boiler", "water heat", "immersion"),
    applies: () => true,
    savingFraction: 0.25,
    title: (r) => `Insulate and time the ${r.name}`,
    detail: (r) =>
      `Water and space heating are pure resistive loads. A tank jacket, a lower thermostat (60°C) and heating only before use commonly removes a quarter of the ${r.name}'s consumption.`,
  },
  {
    id: "fridge",
    match: has("fridge", "refriger", "freezer"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Service the ${r.name}`,
    detail: (r) =>
      `A fridge runs 24/7, so small inefficiencies compound. Clean condenser coils, check the door seal and keep it out of direct sun to recover roughly 15%.`,
  },
  {
    id: "lighting",
    match: has("bulb", "light", "lamp", "tube", "incandescent", "halogen"),
    applies: () => true,
    savingFraction: 0.8,
    title: (r) => `Switch ${r.name} to LED`,
    detail: (r) =>
      `At ${r.watts}W each, these are far above LED equivalents. LED replacements use roughly 80% less power for the same brightness and last several years.`,
  },
  {
    id: "iron-dryer",
    match: has("iron", "dryer", "kettle", "microwave", "oven", "cooker", "toaster"),
    applies: () => true,
    savingFraction: 0.2,
    title: (r) => `Batch your ${r.name} use`,
    detail: (r) =>
      `High-wattage kitchen and laundry appliances are cheapest when used in one full batch instead of several short runs — about 20% less energy for the same result.`,
  },
  {
    id: "washer",
    match: has("washing", "washer", "dishwash"),
    applies: () => true,
    savingFraction: 0.3,
    title: (r) => `Run the ${r.name} full and cold`,
    detail: (r) =>
      `Most of a wash cycle's energy heats water. Full loads on a cold or eco cycle typically cut about 30% of the ${r.name}'s consumption.`,
  },
  {
    id: "standby",
    match: has("tv", "television", "console", "decoder", "set-top", "router", "computer", "pc", "desktop"),
    applies: (r) => r.hoursPerDay >= 6,
    savingFraction: 0.15,
    title: (r) => `Cut standby time on the ${r.name}`,
    detail: (r) =>
      `${r.hoursPerDay}h a day usually includes idle time. A switched power strip and sleep settings remove roughly 15% with no change to how you use it.`,
  },
  {
    id: "fan",
    match: has("fan"),
    applies: (r) => r.hoursPerDay >= 10,
    savingFraction: 0.2,
    title: (r) => `Run the ${r.name} on a lower speed`,
    detail: (r) =>
      `Fans are cheap to run but ${r.hoursPerDay}h a day adds up. A lower speed setting and switching off in empty rooms saves about 20%.`,
  },
];

const GENERIC_FRACTION = 0.1;

export function buildRecommendations(rows: ApplianceResult[]): Recommendation[] {
  const recs: Recommendation[] = [];

  for (const row of rows) {
    if (row.monthlyKwh <= 0) continue;
    const matched = RULES.filter((rule) => rule.match(row.name) && rule.applies(row));

    if (matched.length > 0) {
      for (const rule of matched) {
        recs.push({
          id: `${row.id}-${rule.id}`,
          title: rule.title(row),
          detail: rule.detail(row),
          appliance: row.name,
          monthlyKwhSaved: row.monthlyKwh * rule.savingFraction,
          priority: row.monthlyKwh * rule.savingFraction,
        });
      }
    } else if (row.share >= 0.1) {
      recs.push({
        id: `${row.id}-generic`,
        title: `Reduce daily use of the ${row.name}`,
        detail: `The ${row.name} accounts for ${(row.share * 100).toFixed(0)}% of your monthly consumption. Trimming about an hour of daily use, or replacing it with a higher-efficiency model, removes roughly 10%.`,
        appliance: row.name,
        monthlyKwhSaved: row.monthlyKwh * GENERIC_FRACTION,
        priority: row.monthlyKwh * GENERIC_FRACTION,
      });
    }
  }

  return recs.sort((a, b) => b.priority - a.priority);
}

export type ReductionPlan = {
  steps: (Recommendation & { cumulativeKwh: number; cumulativeCost: number })[];
  totalKwhSaved: number;
  totalCostSaved: number;
  projectedMonthlyKwh: number;
  projectedStatus: StatusBand;
};

export function buildReductionPlan(
  recs: Recommendation[],
  totals: AnalysisTotals,
  rate: number,
  maxSteps = 5,
): ReductionPlan {
  const steps: ReductionPlan["steps"] = [];
  let cumulativeKwh = 0;

  for (const rec of recs.slice(0, maxSteps)) {
    cumulativeKwh += rec.monthlyKwhSaved;
    steps.push({
      ...rec,
      cumulativeKwh,
      cumulativeCost: cumulativeKwh * rate,
    });
  }

  const capped = Math.min(cumulativeKwh, totals.monthlyKwh);
  const projectedMonthlyKwh = Math.max(totals.monthlyKwh - capped, 0);

  return {
    steps,
    totalKwhSaved: capped,
    totalCostSaved: capped * rate,
    projectedMonthlyKwh,
    projectedStatus: statusFor(projectedMonthlyKwh),
  };
}

/* --------------------------------------------------------------- presets */

export type PresetAppliance = {
  name: string;
  watts: number;
  typicalHours: number;
  category: string;
  note: string;
};

export const APPLIANCE_PRESETS: PresetAppliance[] = [
  { name: "Air Conditioner (1.5 ton)", watts: 1500, typicalHours: 8, category: "Cooling & Heating", note: "Largest single load in most homes." },
  { name: "Space Heater", watts: 2000, typicalHours: 4, category: "Cooling & Heating", note: "Resistive heating; very expensive per hour." },
  { name: "Ceiling Fan", watts: 75, typicalHours: 12, category: "Cooling & Heating", note: "Cheap comfort — a fraction of AC cost." },
  { name: "Standing Fan", watts: 55, typicalHours: 10, category: "Cooling & Heating", note: "Good first choice on mild days." },
  { name: "Refrigerator", watts: 150, typicalHours: 24, category: "Kitchen", note: "Runs continuously but cycles its compressor." },
  { name: "Chest Freezer", watts: 200, typicalHours: 24, category: "Kitchen", note: "Keep it full and defrosted." },
  { name: "Electric Kettle", watts: 2000, typicalHours: 0.3, category: "Kitchen", note: "Huge wattage, very short runtime." },
  { name: "Microwave Oven", watts: 1200, typicalHours: 0.5, category: "Kitchen", note: "More efficient than a full oven." },
  { name: "Electric Oven", watts: 2400, typicalHours: 1, category: "Kitchen", note: "Preheat only when the recipe needs it." },
  { name: "Toaster", watts: 900, typicalHours: 0.2, category: "Kitchen", note: "Small contributor overall." },
  { name: "Washing Machine", watts: 500, typicalHours: 1, category: "Laundry", note: "Most energy goes to heating water." },
  { name: "Clothes Dryer", watts: 3000, typicalHours: 1, category: "Laundry", note: "Line drying saves nearly all of this." },
  { name: "Electric Iron", watts: 1100, typicalHours: 0.5, category: "Laundry", note: "Iron in batches while hot." },
  { name: "Water Heater (geyser)", watts: 3000, typicalHours: 2, category: "Water", note: "Insulate the tank and lower the thermostat." },
  { name: "LED Bulb", watts: 9, typicalHours: 6, category: "Lighting", note: "The efficient baseline for lighting." },
  { name: "Incandescent Bulb", watts: 60, typicalHours: 6, category: "Lighting", note: "Replace with LED for ~80% savings." },
  { name: "Fluorescent Tube", watts: 36, typicalHours: 6, category: "Lighting", note: "LED tubes are a direct upgrade." },
  { name: "LED Television", watts: 100, typicalHours: 5, category: "Electronics", note: "Watch out for standby draw." },
  { name: "Desktop Computer", watts: 200, typicalHours: 6, category: "Electronics", note: "Enable sleep after 10 minutes idle." },
  { name: "Laptop", watts: 60, typicalHours: 6, category: "Electronics", note: "Far cheaper than a desktop." },
  { name: "Wi-Fi Router", watts: 10, typicalHours: 24, category: "Electronics", note: "Small, but never switched off." },
  { name: "Water Pump", watts: 750, typicalHours: 1, category: "Utility", note: "Fix leaks before increasing pump time." },
];

export function newAppliance(preset?: Partial<Appliance>): Appliance {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: "",
    watts: 0,
    hoursPerDay: 1,
    quantity: 1,
    daysPerWeek: 7,
    ...preset,
  };
}

/* ------------------------------------------------------------ validation */

export type FieldErrors = Partial<Record<"name" | "watts" | "hoursPerDay" | "quantity" | "daysPerWeek", string>>;

export function validateAppliance(a: Appliance): FieldErrors {
  const errors: FieldErrors = {};
  if (!a.name.trim()) errors.name = "Give the appliance a name.";
  if (!Number.isFinite(a.watts) || a.watts <= 0) errors.watts = "Wattage must be greater than 0.";
  else if (a.watts > 20000) errors.watts = "That looks too high for a household appliance.";
  if (!Number.isFinite(a.hoursPerDay) || a.hoursPerDay <= 0) errors.hoursPerDay = "Enter hours above 0.";
  else if (a.hoursPerDay > 24) errors.hoursPerDay = "A day only has 24 hours.";
  if (!Number.isInteger(a.quantity) || a.quantity < 1) errors.quantity = "At least 1 unit.";
  else if (a.quantity > 100) errors.quantity = "Maximum 100 units.";
  if (!Number.isFinite(a.daysPerWeek) || a.daysPerWeek < 1 || a.daysPerWeek > 7)
    errors.daysPerWeek = "Between 1 and 7 days.";
  return errors;
}

export function isValid(errors: FieldErrors): boolean {
  return Object.keys(errors).length === 0;
}
