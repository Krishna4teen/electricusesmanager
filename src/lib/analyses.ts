import { supabase } from "@/integrations/supabase/client";

import type { Appliance, AnalysisTotals } from "./eco";

const DEVICE_KEY_STORAGE = "eco-watt-device-key";

export function deviceKey(): string {
  if (typeof window === "undefined") return "server";
  let key = window.localStorage.getItem(DEVICE_KEY_STORAGE);
  if (!key) {
    key =
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(DEVICE_KEY_STORAGE, key);
  }
  return key;
}

export type SavedAnalysis = {
  id: string;
  name: string;
  currency: string;
  tariffRate: number;
  status: string;
  totals: AnalysisTotals;
  appliances: Appliance[];
  createdAt: string;
};

type Row = {
  id: string;
  name: string;
  currency: string;
  tariff_rate: number | string;
  status: string;
  daily_kwh: number | string;
  monthly_kwh: number | string;
  yearly_kwh: number | string;
  daily_cost: number | string;
  monthly_cost: number | string;
  yearly_cost: number | string;
  appliances: unknown;
  created_at: string;
};

const n = (v: number | string) => (typeof v === "number" ? v : Number(v));

function toSaved(row: Row): SavedAnalysis {
  return {
    id: row.id,
    name: row.name,
    currency: row.currency,
    tariffRate: n(row.tariff_rate),
    status: row.status,
    totals: {
      dailyKwh: n(row.daily_kwh),
      monthlyKwh: n(row.monthly_kwh),
      yearlyKwh: n(row.yearly_kwh),
      dailyCost: n(row.daily_cost),
      monthlyCost: n(row.monthly_cost),
      yearlyCost: n(row.yearly_cost),
    },
    appliances: Array.isArray(row.appliances) ? (row.appliances as Appliance[]) : [],
    createdAt: row.created_at,
  };
}

export async function listAnalyses(): Promise<SavedAnalysis[]> {
  const { data, error } = await supabase
    .from("analyses")
    .select("*")
    .eq("device_key", deviceKey())
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as unknown as Row[]).map(toSaved);
}

export async function saveAnalysis(input: {
  name: string;
  currency: string;
  tariffRate: number;
  status: string;
  totals: AnalysisTotals;
  appliances: Appliance[];
}): Promise<SavedAnalysis> {
  const { data, error } = await supabase
    .from("analyses")
    .insert({
      device_key: deviceKey(),
      name: input.name,
      currency: input.currency,
      tariff_rate: input.tariffRate,
      status: input.status,
      daily_kwh: input.totals.dailyKwh,
      monthly_kwh: input.totals.monthlyKwh,
      yearly_kwh: input.totals.yearlyKwh,
      daily_cost: input.totals.dailyCost,
      monthly_cost: input.totals.monthlyCost,
      yearly_cost: input.totals.yearlyCost,
      appliances: input.appliances as unknown as never,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return toSaved(data as unknown as Row);
}

export async function deleteAnalysis(id: string): Promise<void> {
  const { error } = await supabase
    .from("analyses")
    .delete()
    .eq("id", id)
    .eq("device_key", deviceKey());
  if (error) throw new Error(error.message);
}

export async function renameAnalysis(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from("analyses")
    .update({ name })
    .eq("id", id)
    .eq("device_key", deviceKey());
  if (error) throw new Error(error.message);
}
