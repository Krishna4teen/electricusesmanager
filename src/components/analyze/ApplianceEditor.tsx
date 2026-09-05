import { Check, ChevronsUpDown, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  APPLIANCE_CATEGORIES,
  APPLIANCE_PRESETS,
  CURRENCIES,
  currencySymbol,
  newAppliance,
  PRESET_NOTE,
  validateAppliance,
  type Appliance,
} from "@/lib/eco";
import type { Draft } from "@/lib/draft";

type Props = {
  draft: Draft;
  onChange: (update: (prev: Draft) => Draft) => void;
};

export function AppliancePicker({ onPick }: { onPick: (a: Appliance) => void }) {
  const [open, setOpen] = useState(false);

  const grouped = useMemo(
    () =>
      APPLIANCE_CATEGORIES.map((category) => ({
        category,
        items: APPLIANCE_PRESETS.filter((p) => p.category === category),
      })).filter((g) => g.items.length > 0),
    [],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Search the appliance list and add one"
          className="w-full justify-between sm:w-96"
        >
          Search appliances to add…
          <ChevronsUpDown className="size-4 opacity-60" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[min(24rem,90vw)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Type a name, e.g. fridge, fan, oven…" />
          <CommandList className="max-h-72">
            <CommandEmpty>
              <div className="space-y-2 p-2 text-sm">
                <p>No match in the list.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    onPick(newAppliance({ name: "", watts: 100, hoursPerDay: 1 }));
                    setOpen(false);
                  }}
                >
                  Add a custom appliance instead
                </Button>
              </div>
            </CommandEmpty>
            {grouped.map((group) => (
              <CommandGroup key={group.category} heading={group.category}>
                {group.items.map((p) => (
                  <CommandItem
                    key={p.name}
                    value={`${p.name} ${p.category}`}
                    onSelect={() => {
                      onPick(
                        newAppliance({
                          name: p.name,
                          watts: p.watts,
                          hoursPerDay: p.typicalHours,
                        }),
                      );
                      setOpen(false);
                    }}
                  >
                    <Check className="size-4 opacity-0" aria-hidden="true" />
                    <span className="flex-1">{p.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {p.watts} W · {p.typicalHours} h
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function ApplianceEditor({ draft, onChange }: Props) {
  const update = (id: string, patch: Partial<Appliance>) =>
    onChange((prev) => ({
      ...prev,
      appliances: prev.appliances.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

  const remove = (id: string) =>
    onChange((prev) => ({ ...prev, appliances: prev.appliances.filter((a) => a.id !== id) }));

  const add = (appliance?: Appliance) =>
    onChange((prev) => ({
      ...prev,
      appliances: [...prev.appliances, appliance ?? newAppliance()],
    }));

  return (
    <div className="space-y-6">

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="analysis-name">Analysis name</Label>
          <Input
            id="analysis-name"
            value={draft.name}
            onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Summer 2026"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tariff">Electricity rate (per kWh)</Label>
          <Input
            id="tariff"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={draft.rate}
            onChange={(e) => onChange((p) => ({ ...p, rate: Math.max(0, Number(e.target.value)) }))}
            aria-describedby="tariff-help"
          />
          <p id="tariff-help" className="text-xs text-muted-foreground">
            Check your latest bill for the unit price.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={draft.currency}
            onValueChange={(v) => onChange((p) => ({ ...p, currency: v }))}
          >
            <SelectTrigger id="currency">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.code} ({c.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        {draft.appliances.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No appliances yet. Add one below, or pick from the Appliances page.
          </p>
        )}

        {draft.appliances.map((a, index) => {
          const errors = validateAppliance(a);
          return (
            <fieldset
              key={a.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <legend className="px-1 text-sm font-medium text-muted-foreground">
                Appliance {index + 1}
              </legend>
              <div className="grid gap-3 md:grid-cols-12">
                <div className="space-y-1.5 md:col-span-4">
                  <Label htmlFor={`name-${a.id}`}>Name</Label>
                  <Input
                    id={`name-${a.id}`}
                    value={a.name}
                    placeholder="Air Conditioner"
                    aria-invalid={!!errors.name}
                    onChange={(e) => update(a.id, { name: e.target.value })}
                  />
                  <FieldError message={errors.name} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor={`watts-${a.id}`}>Watts</Label>
                  <Input
                    id={`watts-${a.id}`}
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={a.watts}
                    aria-invalid={!!errors.watts}
                    onChange={(e) => update(a.id, { watts: Number(e.target.value) })}
                  />
                  <FieldError message={errors.watts} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor={`hours-${a.id}`}>Hours / day</Label>
                  <Input
                    id={`hours-${a.id}`}
                    type="number"
                    min={0}
                    max={24}
                    step="0.5"
                    inputMode="decimal"
                    value={a.hoursPerDay}
                    aria-invalid={!!errors.hoursPerDay}
                    onChange={(e) => update(a.id, { hoursPerDay: Number(e.target.value) })}
                  />
                  <FieldError message={errors.hoursPerDay} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor={`qty-${a.id}`}>Units</Label>
                  <Input
                    id={`qty-${a.id}`}
                    type="number"
                    min={1}
                    max={100}
                    inputMode="numeric"
                    value={a.quantity}
                    aria-invalid={!!errors.quantity}
                    onChange={(e) => update(a.id, { quantity: Number(e.target.value) })}
                  />
                  <FieldError message={errors.quantity} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <Label htmlFor={`days-${a.id}`}>Days / week</Label>
                  <Input
                    id={`days-${a.id}`}
                    type="number"
                    min={1}
                    max={7}
                    inputMode="numeric"
                    value={a.daysPerWeek}
                    aria-invalid={!!errors.daysPerWeek}
                    onChange={(e) => update(a.id, { daysPerWeek: Number(e.target.value) })}
                  />
                  <FieldError message={errors.daysPerWeek} />
                </div>
              </div>
              <div className="mt-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(a.id)}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove {a.name || `appliance ${index + 1}`}
                </Button>
              </div>
            </fieldset>
          );
        })}
      </div>

      <Button type="button" variant="secondary" onClick={add}>
        <Plus className="size-4" aria-hidden="true" />
        Add appliance
      </Button>
    </div>
  );
}

function FieldError({ message }: { message?: string | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs font-medium text-destructive">
      {message}
    </p>
  );
}
