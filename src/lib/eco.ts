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
    match: has("air condition", "air-condition", "a/c", "aircon", "split unit"),
    applies: (r) => r.hoursPerDay > 3,
    savingFraction: 0.2,
    title: (r) => `Raise the ${r.name} setpoint by about 2°C`,
    detail: (r) =>
      `Your ${r.name} runs ${r.hoursPerDay}h a day. Each degree of extra cooling typically costs several percent more energy, so a slightly higher setpoint plus a clean filter often reduces its use noticeably.`,
  },
  {
    id: "ac-hours",
    match: has("air condition", "air-condition", "aircon", "a/c", "split unit"),
    applies: (r) => r.hoursPerDay >= 8,
    savingFraction: 0.15,
    title: (r) => `Put the ${r.name} on a timer or sleep mode`,
    detail: (r) =>
      `Running ${r.hoursPerDay}h daily usually includes time when the room is empty or everyone is asleep. Trimming roughly an hour and a half a day cuts its share of the bill.`,
  },
  {
    id: "air-cooler",
    match: has("air cooler", "evaporative"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Use the ${r.name} instead of AC on mild days`,
    detail: () =>
      `Evaporative coolers draw a small fraction of an air conditioner's power. Keep the pads clean and a window slightly open so the air can circulate.`,
  },
  {
    id: "dehumidifier",
    match: has("dehumidif"),
    applies: () => true,
    savingFraction: 0.2,
    title: (r) => `Let the ${r.name} run on a humidity setting`,
    detail: () =>
      `Set a target humidity rather than running continuously, keep doors closed in the room being dried, and empty the tank so it does not restart needlessly.`,
  },
  {
    id: "purifier",
    match: has("purifier"),
    applies: (r) => r.hoursPerDay >= 8,
    savingFraction: 0.15,
    title: (r) => `Run the ${r.name} on a lower fan speed`,
    detail: () =>
      `Fan speed drives most of the power draw. Auto or low mode in occupied rooms, plus a clean filter, keeps the same benefit for less energy.`,
  },
  {
    id: "heater",
    match: has("heater", "geyser", "boiler", "water heat", "immersion", "radiator", "underfloor"),
    applies: () => true,
    savingFraction: 0.25,
    title: (r) => `Insulate and time the ${r.name}`,
    detail: (r) =>
      `Water and space heating are mostly resistive loads. A tank jacket, a moderate thermostat setting (around 60°C for water) and heating only shortly before use commonly removes a large share of the ${r.name}'s consumption.`,
  },
  {
    id: "heat-pump",
    match: has("heat pump"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Let the ${r.name} hold a steady temperature`,
    detail: () =>
      `Heat pumps are most efficient running gently at a stable setpoint rather than in short, hot bursts. Keep the outdoor unit clear and the filters clean.`,
  },
  {
    id: "electric-blanket",
    match: has("blanket"),
    applies: () => true,
    savingFraction: 0.3,
    title: (r) => `Preheat with the ${r.name}, then switch it off`,
    detail: () =>
      `Warming the bed for a short while before sleeping usually gives the same comfort as leaving it on all night, at a fraction of the energy.`,
  },
  {
    id: "fridge",
    match: has("fridge", "refriger", "freezer"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Service the ${r.name}`,
    detail: () =>
      `A fridge or freezer runs continuously, so small inefficiencies compound. Clean the condenser coils, check the door seal, leave a gap behind it and keep it out of direct sun.`,
  },
  {
    id: "lighting",
    match: has("bulb", "light", "lamp", "tube", "incandescent", "halogen", "cfl", "downlight"),
    applies: (r) => r.watts >= 15,
    savingFraction: 0.7,
    title: (r) => `Switch the ${r.name} to LED`,
    detail: (r) =>
      `At ${r.watts}W each, these sit well above LED equivalents. LED replacements give similar brightness for a small share of the power and last for years.`,
  },
  {
    id: "lighting-hours",
    match: has("bulb", "light", "lamp", "tube", "downlight"),
    applies: (r) => r.hoursPerDay >= 6,
    savingFraction: 0.15,
    title: (r) => `Use daylight and switch off the ${r.name} in empty rooms`,
    detail: (r) =>
      `${r.hoursPerDay}h a day is a long lit period. Open curtains where practical, light the task rather than the whole room, and add a timer or sensor for outdoor fittings.`,
  },
  {
    id: "kettle",
    match: has("kettle"),
    applies: () => true,
    savingFraction: 0.2,
    title: (r) => `Boil only what you need in the ${r.name}`,
    detail: () =>
      `A kettle's cost is set by how much water it heats. Filling it to the number of cups you will actually use, and descaling it regularly, keeps the runtime short.`,
  },
  {
    id: "oven",
    match: has("oven", "cooker", "hotplate", "induction", "air fryer", "toaster", "griller"),
    applies: () => true,
    savingFraction: 0.2,
    title: (r) => `Batch and right-size your ${r.name} use`,
    detail: () =>
      `High-wattage cooking appliances are cheapest used in one full session rather than several short ones. Match the pan to the ring, keep lids on, and pick the smallest appliance that will do the job.`,
  },
  {
    id: "microwave",
    match: has("microwave"),
    applies: () => true,
    savingFraction: 0.1,
    title: (r) => `Prefer the ${r.name} for small portions`,
    detail: () =>
      `A microwave heats food directly and usually finishes far sooner than a full oven, so it is generally the cheaper option for reheating and small meals.`,
  },
  {
    id: "rice-cooker",
    match: has("rice cooker", "pressure cooker", "coffee"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Switch off keep-warm on the ${r.name}`,
    detail: () =>
      `Keep-warm and warming plates can run for hours after cooking finishes. Turning the appliance off at the socket once you are done removes that tail.`,
  },
  {
    id: "washer",
    match: has("washing", "washer", "dishwash"),
    applies: () => true,
    savingFraction: 0.3,
    title: (r) => `Run the ${r.name} full and on a cooler cycle`,
    detail: (r) =>
      `Most of a cycle's energy heats water. Full loads on a cold or eco programme typically cut a large part of the ${r.name}'s consumption, and the clean is usually just as good.`,
  },
  {
    id: "dryer",
    match: has("dryer"),
    applies: () => true,
    savingFraction: 0.4,
    title: (r) => `Line dry instead of using the ${r.name} where you can`,
    detail: () =>
      `Tumble drying is one of the most expensive household loads. Spinning clothes at a higher speed first, and air drying when the weather allows, avoids most of it.`,
  },
  {
    id: "iron",
    match: has("iron", "steamer"),
    applies: () => true,
    savingFraction: 0.2,
    title: (r) => `Iron in one batch with the ${r.name}`,
    detail: () =>
      `Most of the energy goes into heating up. Doing several garments in one session, and switching off a little before you finish to use the residual heat, keeps the total down.`,
  },
  {
    id: "vacuum",
    match: has("vacuum", "pressure washer"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Keep the ${r.name} maintained`,
    detail: () =>
      `Empty the bag or bin and clean the filters — a blocked machine works harder for longer. A lower power setting is usually enough for hard floors.`,
  },
  {
    id: "standby",
    match: has("tv", "television", "console", "decoder", "set-top", "soundbar", "home theatre", "speaker", "projector", "radio", "music system", "streaming"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Cut standby time on the ${r.name}`,
    detail: (r) =>
      `${r.hoursPerDay}h a day usually includes idle and standby time. A switched power strip for the whole setup, plus a lower screen brightness, reduces it with no real change to how you use it.`,
  },
  {
    id: "computing",
    match: has("computer", "pc ", "desktop", "laptop", "monitor", "printer", "workstation"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Set sleep and shutdown on the ${r.name}`,
    detail: () =>
      `Sleep after about 10 minutes idle, switch the display off rather than using a screensaver, and shut down overnight. Printers and monitors on the same strip go off together.`,
  },
  {
    id: "always-on",
    match: has("router", "modem", "ups", "inverter", "cctv", "camera", "doorbell", "dispenser", "aquarium"),
    applies: () => true,
    savingFraction: 0.1,
    title: (r) => `Review the always-on ${r.name}`,
    detail: (r) =>
      `The ${r.name} draws power around the clock, so even a small wattage becomes a steady monthly figure. Check whether every unit is needed, and put non-essential ones on a timer.`,
  },
  {
    id: "charger",
    match: has("charger", "charging"),
    applies: () => true,
    savingFraction: 0.1,
    title: (r) => `Unplug the ${r.name} once charging finishes`,
    detail: () =>
      `Chargers keep drawing a trickle while plugged in. Charging during the day when you can see it is done, then unplugging, removes that idle draw.`,
  },
  {
    id: "ev",
    match: has("vehicle charger", "ev charger"),
    applies: () => true,
    savingFraction: 0.1,
    title: (r) => `Schedule the ${r.name} for off-peak hours`,
    detail: () =>
      `Home vehicle charging is often the largest new load in a house. If your tariff has cheaper off-peak periods, scheduling charging into them lowers the cost of the same energy.`,
  },
  {
    id: "fan",
    match: has("fan"),
    applies: (r) => r.hoursPerDay >= 8,
    savingFraction: 0.2,
    title: (r) => `Run the ${r.name} on a lower speed`,
    detail: (r) =>
      `Fans are cheap to run, but ${r.hoursPerDay}h a day adds up across ${r.quantity} unit${r.quantity > 1 ? "s" : ""}. A lower speed and switching off in empty rooms trims it; efficient BLDC fans use far less for the same airflow.`,
  },
  {
    id: "pump",
    match: has("pump"),
    applies: () => true,
    savingFraction: 0.15,
    title: (r) => `Avoid needless running of the ${r.name}`,
    detail: () =>
      `Fix leaks and dripping taps first, then add a float switch or timer so the pump stops as soon as the tank is full.`,
  },
  {
    id: "hair-dryer",
    match: has("hair dryer", "shaver", "trimmer", "sewing", "power tool", "mower", "drill"),
    applies: () => true,
    savingFraction: 0.1,
    title: (r) => `Keep ${r.name} sessions short`,
    detail: () =>
      `These are high-wattage but short-use items. Using them for less time, or on a lower setting where one exists, is the only real lever.`,
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
    } else {
      // No specific rule matched (typically a custom appliance name):
      // fall back to general, non-guaranteed household guidance.
      recs.push({
        id: `${row.id}-generic`,
        title: `Review how long the ${row.name} runs`,
        detail: `The ${row.name} accounts for ${(row.share * 100).toFixed(0)}% of your recorded monthly consumption (${row.monthlyKwh.toFixed(1)} kWh). Switch it off when nobody is using it, trim roughly an hour of daily runtime where practical, keep it maintained, and check the rating label before replacing it with a more efficient model.`,
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

export const APPLIANCE_CATEGORIES = [
  "Lighting",
  "Cooling",
  "Heating",
  "Kitchen",
  "Entertainment",
  "Computing & Office",
  "Cleaning & Laundry",
  "Other household",
] as const;

export const PRESET_NOTE =
  "Example rating only — real wattage varies by model, size and age. Check the label on your own appliance and edit the value.";

export const APPLIANCE_PRESETS: PresetAppliance[] = [
  // ------------------------------------------------------------- Lighting
  { name: "LED Bulb (9W)", watts: 9, typicalHours: 6, category: "Lighting", note: "The efficient baseline for lighting." },
  { name: "LED Bulb (12W)", watts: 12, typicalHours: 6, category: "Lighting", note: "Brighter LED for living rooms." },
  { name: "CFL Bulb", watts: 20, typicalHours: 6, category: "Lighting", note: "Older energy saver; LED is better still." },
  { name: "Incandescent Bulb", watts: 60, typicalHours: 6, category: "Lighting", note: "Replace with LED for about 80% savings." },
  { name: "Halogen Lamp", watts: 100, typicalHours: 3, category: "Lighting", note: "Runs hot and wastes most energy as heat." },
  { name: "Fluorescent Tube Light", watts: 36, typicalHours: 6, category: "Lighting", note: "LED tubes are a direct upgrade." },
  { name: "LED Tube Light", watts: 18, typicalHours: 6, category: "Lighting", note: "Common replacement for tube fittings." },
  { name: "LED Panel / Downlight", watts: 15, typicalHours: 5, category: "Lighting", note: "Often installed in groups — set the unit count." },
  { name: "Outdoor Security Light", watts: 30, typicalHours: 10, category: "Lighting", note: "A sensor cuts most of the runtime." },
  { name: "Decorative String Lights", watts: 25, typicalHours: 4, category: "Lighting", note: "Small load, easy to forget switched on." },
  { name: "Study / Desk Lamp", watts: 11, typicalHours: 4, category: "Lighting", note: "Task lighting beats lighting a whole room." },

  // -------------------------------------------------------------- Cooling
  { name: "Air Conditioner (1 ton)", watts: 1000, typicalHours: 8, category: "Cooling", note: "Sized for a small bedroom." },
  { name: "Air Conditioner (1.5 ton)", watts: 1500, typicalHours: 8, category: "Cooling", note: "Largest single load in most homes." },
  { name: "Air Conditioner (2 ton)", watts: 2000, typicalHours: 8, category: "Cooling", note: "For large or open-plan rooms." },
  { name: "Inverter Air Conditioner (1.5 ton)", watts: 1100, typicalHours: 8, category: "Cooling", note: "Modulates output, so it averages lower." },
  { name: "Window Air Conditioner", watts: 1400, typicalHours: 6, category: "Cooling", note: "Seal the gaps around the frame." },
  { name: "Air Cooler (evaporative)", watts: 200, typicalHours: 8, category: "Cooling", note: "Far cheaper than AC in dry climates." },
  { name: "Ceiling Fan", watts: 75, typicalHours: 12, category: "Cooling", note: "Cheap comfort — a fraction of AC cost." },
  { name: "BLDC Ceiling Fan", watts: 30, typicalHours: 12, category: "Cooling", note: "Efficient motor; pays back over a season." },
  { name: "Standing / Pedestal Fan", watts: 55, typicalHours: 10, category: "Cooling", note: "Good first choice on mild days." },
  { name: "Table Fan", watts: 40, typicalHours: 8, category: "Cooling", note: "Point it at people, not the room." },
  { name: "Exhaust Fan", watts: 35, typicalHours: 3, category: "Cooling", note: "Run only while cooking or showering." },
  { name: "Dehumidifier", watts: 300, typicalHours: 6, category: "Cooling", note: "Use a humidistat instead of running non-stop." },
  { name: "Air Purifier", watts: 45, typicalHours: 10, category: "Cooling", note: "Lower fan speeds use much less power." },

  // -------------------------------------------------------------- Heating
  { name: "Space Heater", watts: 2000, typicalHours: 4, category: "Heating", note: "Resistive heating; very expensive per hour." },
  { name: "Oil-Filled Radiator", watts: 1500, typicalHours: 5, category: "Heating", note: "Holds heat, so a thermostat helps a lot." },
  { name: "Halogen / Radiant Heater", watts: 1200, typicalHours: 3, category: "Heating", note: "Heats people quickly, rooms poorly." },
  { name: "Electric Blanket", watts: 100, typicalHours: 6, category: "Heating", note: "A cheap alternative to heating a bedroom." },
  { name: "Storage Water Heater (geyser)", watts: 3000, typicalHours: 2, category: "Heating", note: "Insulate the tank and lower the thermostat." },
  { name: "Instant Water Heater", watts: 4500, typicalHours: 0.5, category: "Heating", note: "Huge draw, but only while water runs." },
  { name: "Immersion Rod", watts: 1500, typicalHours: 0.5, category: "Heating", note: "Never leave it unattended." },
  { name: "Underfloor Heating (room)", watts: 800, typicalHours: 6, category: "Heating", note: "Zone it so unused rooms stay off." },
  { name: "Heat Pump (small)", watts: 900, typicalHours: 8, category: "Heating", note: "Several times more efficient than resistive heat." },

  // --------------------------------------------------------------- Kitchen
  { name: "Refrigerator (single door)", watts: 120, typicalHours: 24, category: "Kitchen", note: "Runs continuously but cycles its compressor." },
  { name: "Refrigerator (double door)", watts: 200, typicalHours: 24, category: "Kitchen", note: "Keep coils clean and seals tight." },
  { name: "Chest Freezer", watts: 200, typicalHours: 24, category: "Kitchen", note: "Keep it full and defrosted." },
  { name: "Electric Kettle", watts: 2000, typicalHours: 0.3, category: "Kitchen", note: "Huge wattage, very short runtime." },
  { name: "Microwave Oven", watts: 1200, typicalHours: 0.5, category: "Kitchen", note: "More efficient than a full oven." },
  { name: "Electric Oven", watts: 2400, typicalHours: 1, category: "Kitchen", note: "Preheat only when the recipe needs it." },
  { name: "Induction Cooktop", watts: 1800, typicalHours: 1, category: "Kitchen", note: "Efficient, but still a heavy load." },
  { name: "Electric Hotplate", watts: 1500, typicalHours: 1, category: "Kitchen", note: "Match pan size to the plate." },
  { name: "Rice Cooker", watts: 700, typicalHours: 0.75, category: "Kitchen", note: "Switch off keep-warm when done." },
  { name: "Toaster", watts: 900, typicalHours: 0.2, category: "Kitchen", note: "Small contributor overall." },
  { name: "Sandwich Maker / Griller", watts: 800, typicalHours: 0.3, category: "Kitchen", note: "Quick cooking, low daily total." },
  { name: "Air Fryer", watts: 1500, typicalHours: 0.5, category: "Kitchen", note: "Usually beats the oven for small meals." },
  { name: "Blender / Mixer Grinder", watts: 500, typicalHours: 0.3, category: "Kitchen", note: "Short bursts only." },
  { name: "Food Processor", watts: 700, typicalHours: 0.2, category: "Kitchen", note: "Minor part of the monthly bill." },
  { name: "Coffee Machine", watts: 1000, typicalHours: 0.4, category: "Kitchen", note: "Turn off the warming plate." },
  { name: "Electric Pressure Cooker", watts: 1000, typicalHours: 0.6, category: "Kitchen", note: "Faster cooking means less energy." },
  { name: "Dishwasher", watts: 1500, typicalHours: 1, category: "Kitchen", note: "Full loads on eco mode cost far less." },
  { name: "Range Hood / Chimney", watts: 200, typicalHours: 1.5, category: "Kitchen", note: "Run it only while cooking." },
  { name: "Water Dispenser / Purifier", watts: 100, typicalHours: 12, category: "Kitchen", note: "Cooling and heating modes add up." },

  // --------------------------------------------------------- Entertainment
  { name: "LED Television (32\")", watts: 60, typicalHours: 5, category: "Entertainment", note: "Watch out for standby draw." },
  { name: "LED Television (43\")", watts: 100, typicalHours: 5, category: "Entertainment", note: "Lower the backlight to save power." },
  { name: "LED Television (55\" 4K)", watts: 150, typicalHours: 5, category: "Entertainment", note: "Bigger and brighter means more watts." },
  { name: "Smart TV Streaming Stick", watts: 5, typicalHours: 5, category: "Entertainment", note: "Tiny, but often left plugged in." },
  { name: "Set-Top Box / Decoder", watts: 25, typicalHours: 24, category: "Entertainment", note: "Rarely switched off — a classic standby load." },
  { name: "Home Theatre / Soundbar", watts: 90, typicalHours: 3, category: "Entertainment", note: "Use a switched strip with the TV." },
  { name: "Gaming Console", watts: 150, typicalHours: 3, category: "Entertainment", note: "Enable rest mode power saving." },
  { name: "Bluetooth Speaker (charging)", watts: 15, typicalHours: 3, category: "Entertainment", note: "Unplug once charged." },
  { name: "Radio / Music System", watts: 40, typicalHours: 3, category: "Entertainment", note: "Modest but steady." },
  { name: "Projector", watts: 250, typicalHours: 2, category: "Entertainment", note: "Lamp models draw far more than LED ones." },

  // ----------------------------------------------------- Computing & Office
  { name: "Desktop Computer", watts: 200, typicalHours: 6, category: "Computing & Office", note: "Enable sleep after 10 minutes idle." },
  { name: "Gaming Desktop", watts: 450, typicalHours: 4, category: "Computing & Office", note: "Graphics cards dominate the draw." },
  { name: "Computer Monitor", watts: 30, typicalHours: 6, category: "Computing & Office", note: "Switch off rather than screensaver." },
  { name: "Laptop", watts: 60, typicalHours: 6, category: "Computing & Office", note: "Far cheaper to run than a desktop." },
  { name: "Tablet (charging)", watts: 12, typicalHours: 2, category: "Computing & Office", note: "Small, frequent charge cycles." },
  { name: "Mobile Phone Charger", watts: 10, typicalHours: 3, category: "Computing & Office", note: "Unplug when not charging." },
  { name: "Wi-Fi Router", watts: 10, typicalHours: 24, category: "Computing & Office", note: "Small, but never switched off." },
  { name: "Inkjet Printer", watts: 30, typicalHours: 0.5, category: "Computing & Office", note: "Idle draw matters more than printing." },
  { name: "Laser Printer", watts: 500, typicalHours: 0.3, category: "Computing & Office", note: "Spikes hard while the fuser heats." },
  { name: "UPS / Inverter (standby)", watts: 50, typicalHours: 24, category: "Computing & Office", note: "Charging losses run all day." },

  // ------------------------------------------------------ Cleaning & Laundry
  { name: "Washing Machine (top load)", watts: 500, typicalHours: 1, category: "Cleaning & Laundry", note: "Most energy goes to heating water." },
  { name: "Washing Machine (front load)", watts: 800, typicalHours: 1, category: "Cleaning & Laundry", note: "Cold or eco cycles cut it sharply." },
  { name: "Clothes Dryer", watts: 3000, typicalHours: 1, category: "Cleaning & Laundry", note: "Line drying saves nearly all of this." },
  { name: "Electric Iron", watts: 1100, typicalHours: 0.5, category: "Cleaning & Laundry", note: "Iron in batches while hot." },
  { name: "Steam Iron / Garment Steamer", watts: 1500, typicalHours: 0.3, category: "Cleaning & Laundry", note: "Short sessions, high wattage." },
  { name: "Vacuum Cleaner", watts: 1200, typicalHours: 0.5, category: "Cleaning & Laundry", note: "Empty the bag to keep suction efficient." },
  { name: "Robot Vacuum (docked)", watts: 40, typicalHours: 4, category: "Cleaning & Laundry", note: "Mostly charging, not cleaning." },
  { name: "Pressure Washer", watts: 1600, typicalHours: 0.3, category: "Cleaning & Laundry", note: "Occasional use only." },

  // -------------------------------------------------------- Other household
  { name: "Water Pump (0.5 HP)", watts: 400, typicalHours: 1, category: "Other household", note: "Fix leaks before increasing pump time." },
  { name: "Water Pump (1 HP)", watts: 750, typicalHours: 1, category: "Other household", note: "A float switch stops needless running." },
  { name: "Hair Dryer", watts: 1400, typicalHours: 0.2, category: "Other household", note: "High watts, very short use." },
  { name: "Electric Shaver / Trimmer", watts: 15, typicalHours: 0.2, category: "Other household", note: "Negligible on the bill." },
  { name: "Sewing Machine", watts: 100, typicalHours: 1, category: "Other household", note: "Depends entirely on hobby hours." },
  { name: "Doorbell / Intercom", watts: 5, typicalHours: 24, category: "Other household", note: "Always on, but tiny." },
  { name: "CCTV Camera", watts: 8, typicalHours: 24, category: "Other household", note: "Count every camera as a unit." },
  { name: "Electric Vehicle Charger (home)", watts: 3300, typicalHours: 3, category: "Other household", note: "Often the single biggest new load." },
  { name: "Aquarium Pump & Light", watts: 40, typicalHours: 12, category: "Other household", note: "Timer the light, keep the pump running." },
  { name: "Garden / Lawn Mower (electric)", watts: 1200, typicalHours: 0.5, category: "Other household", note: "Seasonal — set the days per week." },
  { name: "Power Tools (drill, saw)", watts: 800, typicalHours: 0.3, category: "Other household", note: "Occasional bursts of use." },
  { name: "Other / Custom appliance", watts: 100, typicalHours: 1, category: "Other household", note: "Start here and enter your own name and rating." },
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
