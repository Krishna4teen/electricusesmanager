import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  ClipboardList,
  FileText,
  Gauge,
  History,
  Leaf,
  Lightbulb,
  PiggyBank,
  Smartphone,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ECO-WATT — Household Electricity Consumption Analyzer" },
      {
        name: "description",
        content:
          "Track, analyze and reduce your household electricity use. Enter your appliances and get instant daily, monthly and yearly costs, a consumption status and a personalised reduction plan.",
      },
      { property: "og:title", content: "ECO-WATT — Household Electricity Consumption Analyzer" },
      {
        property: "og:description",
        content:
          "Measure, understand and cut your home electricity use with charts, eco tips and a printable report.",
      },
    ],
  }),
  component: HomePage,
});

const FLOW = [
  {
    icon: ClipboardList,
    title: "Input data",
    points: ["Household appliances", "Wattage and usage hours", "Your electricity rate"],
  },
  {
    icon: Gauge,
    title: "Automatic calculation",
    points: ["Daily / monthly / yearly", "Cost estimation", "Appliance-wise usage"],
  },
  {
    icon: BarChart3,
    title: "Analysis",
    points: ["Highest consumer", "Consumption status", "Charts and breakdown"],
  },
  {
    icon: Leaf,
    title: "Recommendations",
    points: ["Appliance-specific tips", "Ranked by savings", "Reduction plan"],
  },
  {
    icon: FileText,
    title: "Final report",
    points: ["Complete summary", "Print or save", "Kept in your history"],
  },
];

const FEATURES = [
  { icon: ClipboardList, text: "Editable multi-appliance input with validation" },
  { icon: Gauge, text: "Accurate daily, monthly and yearly calculations" },
  { icon: BarChart3, text: "Dynamic charts and appliance-wise breakdown" },
  { icon: Sparkles, text: "Consumption status with the criteria explained" },
  { icon: Lightbulb, text: "Data-driven tips ranked by how much they save" },
  { icon: PiggyBank, text: "Reduction plan with projected savings" },
  { icon: History, text: "Saved history and trend comparison" },
  { icon: Smartphone, text: "Responsive, accessible and printable" },
];

function HomePage() {
  return (
    <>
      <section className="border-b border-border bg-secondary/40">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <Leaf className="size-3.5" aria-hidden="true" />
              Track · Analyze · Reduce · Save
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
              Household Electricity Consumption Analyzer
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted-foreground">
              Measure what your appliances actually cost you, see which one dominates your bill, and
              get a step-by-step plan to bring it down.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/analyze">Start analysis</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/appliances">Browse appliance ratings</Link>
              </Button>
            </div>
          </div>

          <div
            className="rounded-2xl border border-primary/20 p-6 text-primary-foreground shadow-lg"
            style={{ background: "var(--gradient-eco)", boxShadow: "var(--shadow-eco)" }}
          >
            <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90">
              Worked example
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl bg-background/15 p-4 backdrop-blur">
                <dt className="font-semibold">Air conditioner — 1500 W, 8 h/day</dt>
                <dd className="opacity-90">1500 × 8 ÷ 1000 = 12 kWh a day → 360 kWh a month</dd>
              </div>
              <div className="rounded-xl bg-background/15 p-4 backdrop-blur">
                <dt className="font-semibold">Ceiling fan — 75 W, 12 h/day, 2 units</dt>
                <dd className="opacity-90">75 × 12 × 2 ÷ 1000 = 1.8 kWh a day → 54 kWh a month</dd>
              </div>
            </dl>
            <p className="mt-4 text-sm opacity-90">
              ECO-WATT does this for every appliance in your home, then tells you what to do about
              it.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="text-2xl font-bold tracking-tight">How the analysis flows</h2>
        <p className="mt-2 text-muted-foreground">
          Five stages, all on one page, updating live as you type.
        </p>
        <ol className="mt-8 grid gap-4 md:grid-cols-3 lg:grid-cols-5">
          {FLOW.map((stage, i) => (
            <li key={stage.title}>
              <Card className="h-full">
                <CardHeader>
                  <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <stage.icon className="size-5" aria-hidden="true" />
                  </span>
                  <CardTitle className="text-base">
                    {i + 1}. {stage.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {stage.points.map((p) => (
                      <li key={p}>• {p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border bg-secondary/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-16">
          <h2 className="text-2xl font-bold tracking-tight">What you get</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <li
                key={f.text}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
              >
                <f.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <span className="text-sm">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
        <h2 className="text-2xl font-bold tracking-tight">Ready to see your numbers?</h2>
        <p className="mt-2 text-muted-foreground">
          It takes about two minutes. Your saved analyses stay available so you can compare seasons.
        </p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/analyze">Start your analysis</Link>
        </Button>
      </section>
    </>
  );
}
