import { useCallback, useSyncExternalStore } from "react";

import { newAppliance, type Appliance } from "./eco";

export type Draft = {
  name: string;
  rate: number;
  currency: string;
  appliances: Appliance[];
};

const STORAGE_KEY = "eco-watt-draft-v1";

function defaultDraft(): Draft {
  return {
    name: "My household",
    rate: 0.15,
    currency: "USD",
    appliances: [
      newAppliance({ name: "Air Conditioner (1.5 ton)", watts: 1500, hoursPerDay: 8 }),
      newAppliance({ name: "Refrigerator", watts: 150, hoursPerDay: 24 }),
      newAppliance({ name: "Ceiling Fan", watts: 75, hoursPerDay: 12, quantity: 2 }),
      newAppliance({ name: "LED Bulb", watts: 9, hoursPerDay: 6, quantity: 8 }),
    ],
  };
}

let state: Draft = defaultDraft();
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Draft;
      if (parsed && Array.isArray(parsed.appliances)) {
        state = { ...defaultDraft(), ...parsed };
        emit();
      }
    }
  } catch {
    /* ignore malformed storage */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage may be unavailable */
  }
}

export function setDraft(update: Draft | ((prev: Draft) => Draft)) {
  state = typeof update === "function" ? (update as (p: Draft) => Draft)(state) : update;
  persist();
  emit();
}

export function addApplianceToDraft(appliance: Appliance) {
  setDraft((prev) => ({ ...prev, appliances: [...prev.appliances, appliance] }));
}

function subscribe(listener: () => void) {
  hydrate();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverSnapshot = defaultDraft();

export function useDraft(): [Draft, typeof setDraft] {
  const get = useCallback(() => state, []);
  const draft = useSyncExternalStore(subscribe, get, () => serverSnapshot);
  return [draft, setDraft];
}
