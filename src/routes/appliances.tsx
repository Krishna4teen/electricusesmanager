import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addApplianceToDraft, useDraft } from "@/lib/draft";
import { APPLIANCE_PRESETS, formatKwh, newAppliance } from "@/lib/eco";

export const Route = createFileRoute("/appliances")({
  head: () => ({
    meta: [
      { title: "Typical Appliance Wattages | ECO-WATT" },
      {
        name: "description",
        content:
          "A reference list of common household appliances with typical power ratings and daily usage, ready to add straight into your ECO-WATT analysis.",
      },
      { property: "og:title", content: "Typical Appliance Wattages | ECO-WATT" },
      {
        property: "og:description",
        content:
          "Look up typical wattages for air conditioners, fridges, fans, lighting and more, then add them to your analysis in one click.",
      },
    ],
  }),
  component: AppliancesPage,
});

function AppliancesPage() {
  const [draft] = useDraft();
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const filtered = APPLIANCE_PRESETS.filter((p) =>
      `${p.name} ${p.category}`.toLowerCase().includes(query.trim().toLowerCase()),
    );
    const map = new Map<string, typeof APPLIANCE_PRESETS>();
    for (const p of filtered) {
      map.set(p.category, [...(map.get(p.category) ?? []), p]);
    }
    return [...map.entries()];
  }, [query]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Appliance library</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Typical power ratings for common household appliances. Add one to your analysis, then
          adjust the hours to match how you actually use it. Ratings vary by model — check the label
          on yours where you can.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Your analysis currently has{" "}
          <strong className="text-foreground">{draft.appliances.length}</strong> appliance
          {draft.appliances.length === 1 ? "" : "s"}.{" "}
          <Link to="/analyze" className="font-medium text-primary underline">
            Go to the analyzer
          </Link>
          .
        </p>
      </header>

      <div className="mb-8 max-w-sm space-y-1.5">
        <Label htmlFor="appliance-search">Search appliances</Label>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="appliance-search"
            className="pl-9"
            placeholder="Fridge, fan, heater…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {groups.length === 0 && (
        <p className="text-muted-foreground">No appliances match “{query}”.</p>
      )}

      <div className="space-y-10">
        {groups.map(([category, items]) => (
          <section key={category}>
            <h2 className="mb-4 text-xl font-semibold tracking-tight">{category}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((p) => {
                const daily = (p.watts * p.typicalHours) / 1000;
                return (
                  <Card key={p.name} className="flex h-full flex-col">
                    <CardHeader>
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription>
                        {p.watts} W · about {p.typicalHours} h/day
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="mt-auto space-y-3">
                      <p className="text-sm text-muted-foreground">{p.note}</p>
                      <p className="text-sm">
                        Typical use:{" "}
                        <strong>{formatKwh(daily)}</strong> a day ({formatKwh(daily * 30)} a month)
                      </p>
                      <Button
                        variant="secondary"
                        className="w-full"
                        onClick={() => {
                          addApplianceToDraft(
                            newAppliance({
                              name: p.name,
                              watts: p.watts,
                              hoursPerDay: p.typicalHours,
                            }),
                          );
                          toast.success(`${p.name} added to your analysis.`);
                        }}
                      >
                        <Plus className="size-4" aria-hidden="true" />
                        Add to my analysis
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
