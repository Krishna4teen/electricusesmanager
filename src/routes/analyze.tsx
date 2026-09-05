import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  Info,
  Loader2,
  Printer,
  Save,
  Sparkles,
  TrendingDown,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { StageConnector, StageHeading, StageShell } from "@/components/StageHeading";
import { ApplianceEditor } from "@/components/analyze/ApplianceEditor";
import {
  ConsumptionBarChart,
  ConsumptionPieChart,
  HorizonChart,
} from "@/components/analyze/ResultsCharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { saveAnalysis } from "@/lib/analyses";
import { useDraft } from "@/lib/draft";
import {
  buildRecommendations,
  buildReductionPlan,
  computeResults,
  formatKwh,
  formatMoney,
  isValid,
  statusFor,
  STATUS_BANDS,
  validateAppliance,
} from "@/lib/eco";

export const Route = createFileRoute("/analyze")({
  head: () => ({
    meta: [
      { title: "Analyze Your Electricity Use | ECO-WATT" },
      {
        name: "description",
        content:
          "Enter your appliances and usage hours to get daily, monthly and yearly electricity consumption, costs, a consumption status and a personalised reduction plan.",
      },
      { property: "og:title", content: "Analyze Your Electricity Use | ECO-WATT" },
      {
        property: "og:description",
        content:
          "Appliance-by-appliance electricity analysis with charts, status rating, eco tips and a printable report.",
      },
    ],
  }),
  component: AnalyzePage,
});

const toneClasses = {
  good: "bg-success/15 text-success border-success/30",
  ok: "bg-primary/15 text-primary border-primary/30",
  warn: "bg-warning/20 text-warning-foreground border-warning/40",
  bad: "bg-danger/15 text-danger border-danger/30",
} as const;

function AnalyzePage() {
  const [draft, setDraft] = useDraft();
  const [saving, setSaving] = useState(false);

  const validAppliances = useMemo(
    () => draft.appliances.filter((a) => isValid(validateAppliance(a))),
    [draft.appliances],
  );
  const invalidCount = draft.appliances.length - validAppliances.length;

  const { rows, totals } = useMemo(
    () => computeResults(validAppliances, draft.rate),
    [validAppliances, draft.rate],
  );
  const status = statusFor(totals.monthlyKwh);
  const recommendations = useMemo(() => buildRecommendations(rows), [rows]);
  const plan = useMemo(
    () => buildReductionPlan(recommendations, totals, draft.rate),
    [recommendations, totals, draft.rate],
  );
  const top = rows[0];
  const hasData = rows.length > 0 && totals.monthlyKwh > 0;
  const isEfficient = status.key === "low";

  const handleSave = async () => {
    if (!hasData) {
      toast.error("Add at least one valid appliance before saving.");
      return;
    }
    setSaving(true);
    try {
      await saveAnalysis({
        name: draft.name.trim() || "Untitled analysis",
        currency: draft.currency,
        tariffRate: draft.rate,
        status: status.label,
        totals,
        appliances: validAppliances,
      });
      toast.success("Analysis saved to your history.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the analysis.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <header className="no-print mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Analyze your consumption</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Everything below updates as you type. Follow the six numbered stages from raw appliance
          data through to a printable report.
        </p>
        <ol className="mt-5 flex flex-wrap gap-2 text-xs font-medium">
          {[
            "Enter data",
            "Automatic calculation",
            "Consumption status",
            isEfficient ? "Appreciation" : "Personalised tips",
            "Reduction plan",
            "Final report",
          ].map((label, i) => (
            <li
              key={label}
              className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-secondary-foreground"
            >
              {i + 1}. {label}
            </li>
          ))}
        </ol>
      </header>

      {/* ---------------------------------------------------------- stage 1 */}
      <StageShell>
        <div className="no-print">
          <StageHeading
            step={1}
            id="stage-input"
            title="Enter your appliance and usage data"
            description="Name, wattage, hours per day, how many units and how many days a week each one runs."
          />
          <Card>
            <CardContent className="pt-6">
              <ApplianceEditor draft={draft} onChange={setDraft} />
              {invalidCount > 0 && (
                <p role="status" className="mt-4 text-sm font-medium text-destructive">
                  {invalidCount} appliance{invalidCount > 1 ? "s are" : " is"} incomplete and{" "}
                  {invalidCount > 1 ? "are" : "is"} excluded from the results below.
                </p>
              )}
              <p className="mt-4 text-sm text-muted-foreground">
                Not sure about wattage?{" "}
                <Link to="/appliances" className="font-medium text-primary underline">
                  Browse typical appliance ratings
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </div>
      </StageShell>

      <StageConnector label="Calculating automatically" />

      {/* ---------------------------------------------------------- stage 2 */}
      <StageShell>
        <StageHeading
          step={2}
          id="stage-results"
          title="Automatic calculation"
          description="Daily, monthly and yearly units and cost, appliance-by-appliance usage, and your highest consumer."
        />

        {!hasData ? (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              Add at least one complete appliance above to see your results.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Daily" kwh={totals.dailyKwh} cost={totals.dailyCost} currency={draft.currency} />
              <StatCard label="Monthly" kwh={totals.monthlyKwh} cost={totals.monthlyCost} currency={draft.currency} highlight />
              <StatCard label="Yearly" kwh={totals.yearlyKwh} cost={totals.yearlyCost} currency={draft.currency} />
              <Card className="print-break">
                <CardHeader className="pb-2">
                  <CardDescription>Highest consumer</CardDescription>
                  <CardTitle className="text-lg">{top?.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {formatKwh(top?.monthlyKwh ?? 0)} per month —{" "}
                    <strong className="text-foreground">
                      {((top?.share ?? 0) * 100).toFixed(0)}%
                    </strong>{" "}
                    of your total.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="print-break">
                <CardHeader>
                  <CardTitle className="text-base">Monthly use by appliance</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConsumptionBarChart rows={rows} currency={draft.currency} rate={draft.rate} />
                </CardContent>
              </Card>
              <Card className="print-break">
                <CardHeader>
                  <CardTitle className="text-base">Share of total consumption</CardTitle>
                </CardHeader>
                <CardContent>
                  <ConsumptionPieChart rows={rows} currency={draft.currency} rate={draft.rate} />
                </CardContent>
              </Card>
            </div>

            <Card className="print-break">
              <CardHeader>
                <CardTitle className="text-base">Consumption across time horizons</CardTitle>
              </CardHeader>
              <CardContent>
                <HorizonChart daily={totals.dailyKwh} monthly={totals.monthlyKwh} yearly={totals.yearlyKwh} currency={draft.currency} rate={draft.rate} />
              </CardContent>
            </Card>

            <Card className="print-break">
              <CardHeader>
                <CardTitle className="text-base">Appliance-wise breakdown</CardTitle>
                <CardDescription>Ranked from the largest monthly consumer down.</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead scope="col">Appliance</TableHead>
                      <TableHead scope="col" className="text-right">Watts</TableHead>
                      <TableHead scope="col" className="text-right">h/day</TableHead>
                      <TableHead scope="col" className="text-right">Units</TableHead>
                      <TableHead scope="col" className="text-right">kWh/day</TableHead>
                      <TableHead scope="col" className="text-right">kWh/month</TableHead>
                      <TableHead scope="col" className="text-right">Cost/month</TableHead>
                      <TableHead scope="col" className="text-right">Share</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-right">{r.watts}</TableCell>
                        <TableCell className="text-right">{r.hoursPerDay}</TableCell>
                        <TableCell className="text-right">{r.quantity}</TableCell>
                        <TableCell className="text-right">{r.dailyKwh.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{r.monthlyKwh.toFixed(2)}</TableCell>
                        <TableCell className="text-right">{formatMoney(r.monthlyCost, draft.currency)}</TableCell>
                        <TableCell className="text-right">{(r.share * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </StageShell>

      {hasData && (
        <>
          <StageConnector label="Comparing against the status criteria" />

          {/* ------------------------------------------------------ stage 3 */}
          <StageShell>
            <StageHeading
              step={3}
              id="stage-status"
              title="Your consumption status"
              description="Your monthly total is placed into one of four bands."
            />
            <Card className="print-break">
              <CardContent className="space-y-5 pt-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge className={`border px-3 py-1 text-sm ${toneClasses[status.tone]}`}>
                    {status.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatKwh(totals.monthlyKwh)} per month
                  </span>
                </div>
                <p className="max-w-3xl text-sm">{status.summary}</p>

                <div>
                  <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Info className="size-4 text-primary" aria-hidden="true" />
                    How the status is decided
                  </h3>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {STATUS_BANDS.map((band) => (
                      <li
                        key={band.key}
                        className={`rounded-lg border p-3 text-sm ${
                          band.key === status.key
                            ? toneClasses[band.tone]
                            : "border-border bg-muted/40 text-muted-foreground"
                        }`}
                      >
                        <strong>{band.label}</strong> —{" "}
                        {band.max === null
                          ? `${band.min} kWh/month and above`
                          : `${band.min}–${band.max} kWh/month`}
                        {band.key === status.key && " (your band)"}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Bands are based on typical household ranges. A larger home or more occupants
                    naturally sits higher — compare your own analyses over time for the most
                    meaningful signal.
                  </p>
                </div>
              </CardContent>
            </Card>
          </StageShell>

          <StageConnector
            label={isEfficient ? "Result is efficient — showing appreciation" : "Result is above target — showing personalised tips"}
          />

          {/* ------------------------------------------------------ stage 4 */}
          <StageShell>
            <StageHeading
              step={4}
              id="stage-branch"
              title={isEfficient ? "Well done — your home is efficient" : "Personalised eco tips"}
              description={
                isEfficient
                  ? "Your consumption sits in the efficient band, so this stage celebrates it and shows how to hold the line."
                  : "Because your consumption is above the efficient band, these tips are generated from your own appliance data, ranked by how much they save."
              }
            />

            {isEfficient ? (
              <Card className="border-success/40 bg-success/10 print-break">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-3">
                    <BadgeCheck className="size-8 text-success" aria-hidden="true" />
                    <div>
                      <p className="text-lg font-semibold">Excellent — {formatKwh(totals.monthlyKwh)} a month.</p>
                      <p className="text-sm text-muted-foreground">
                        That is below the typical household range. You are spending about{" "}
                        {formatMoney(totals.monthlyCost, draft.currency)} a month on the appliances
                        listed.
                      </p>
                    </div>
                  </div>
                  <ul className="grid gap-2 text-sm sm:grid-cols-2">
                    <li className="rounded-lg border border-border bg-card p-3">
                      Keep your biggest item, the {top?.name}, well maintained so it stays efficient.
                    </li>
                    <li className="rounded-lg border border-border bg-card p-3">
                      Save this analysis and re-run it each season to catch any drift early.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {recommendations.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      No specific rules matched your appliances. Focus on the highest consumer above.
                    </CardContent>
                  </Card>
                ) : (
                  recommendations.map((rec, i) => (
                    <Card key={rec.id} className="print-break">
                      <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {i + 1}
                          </span>
                          <div>
                            <h3 className="font-semibold">{rec.title}</h3>
                            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{rec.detail}</p>
                          </div>
                        </div>
                        <div className="shrink-0 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-right">
                          <p className="text-xs text-muted-foreground">Saves about</p>
                          <p className="font-semibold text-success">
                            {formatKwh(rec.monthlyKwhSaved)}/mo
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(rec.monthlyKwhSaved * draft.rate, draft.currency)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}
          </StageShell>

          <StageConnector label="Turning tips into a reduction plan" />

          {/* ------------------------------------------------------ stage 5 */}
          <StageShell>
            <StageHeading
              step={5}
              id="stage-plan"
              title="Your reduction plan"
              description="The highest-impact actions in order, with the savings that build up as you complete them."
            />
            <Card className="print-break">
              <CardContent className="space-y-5 pt-6">
                {plan.steps.length === 0 ? (
                  <p className="text-muted-foreground">
                    Nothing to trim right now — your appliances are already used sparingly.
                  </p>
                ) : (
                  <>
                    <ol className="space-y-3">
                      {plan.steps.map((step, i) => (
                        <li
                          key={step.id}
                          className="flex flex-col gap-2 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                              {i + 1}
                            </span>
                            <div>
                              <p className="font-medium">{step.title}</p>
                              <p className="text-xs text-muted-foreground">{step.appliance}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Running total:{" "}
                            <strong className="text-foreground">{formatKwh(step.cumulativeKwh)}</strong> /
                            month · {formatMoney(step.cumulativeCost, draft.currency)}
                          </p>
                        </li>
                      ))}
                    </ol>

                    <Separator />

                    <div className="grid gap-4 sm:grid-cols-3">
                      <PlanStat
                        icon={<TrendingDown className="size-4" aria-hidden="true" />}
                        label="Monthly savings"
                        value={formatKwh(plan.totalKwhSaved)}
                        sub={formatMoney(plan.totalCostSaved, draft.currency)}
                      />
                      <PlanStat
                        icon={<Zap className="size-4" aria-hidden="true" />}
                        label="New monthly total"
                        value={formatKwh(plan.projectedMonthlyKwh)}
                        sub={`Status would be ${plan.projectedStatus.label}`}
                      />
                      <PlanStat
                        icon={<Sparkles className="size-4" aria-hidden="true" />}
                        label="Yearly savings"
                        value={formatKwh(plan.totalKwhSaved * 12)}
                        sub={formatMoney(plan.totalCostSaved * 12, draft.currency)}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </StageShell>

          <StageConnector label="Producing the final report" />

          {/* ------------------------------------------------------ stage 6 */}
          <StageShell>
            <StageHeading
              step={6}
              id="stage-report"
              title="Final report"
              description="A complete summary you can save to your history or print."
            />

            <div className="no-print mb-4 flex flex-wrap gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-4" aria-hidden="true" />
                )}
                Save to history
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="size-4" aria-hidden="true" />
                Print report
              </Button>
              <Button variant="ghost" asChild>
                <Link to="/history">View history &amp; trends</Link>
              </Button>
            </div>

            <Card className="print-area print-break">
              <CardHeader>
                <CardTitle>{draft.name || "Untitled analysis"} — ECO-WATT report</CardTitle>
                <CardDescription>
                  Generated {new Date().toLocaleDateString()} · rate{" "}
                  {formatMoney(draft.rate, draft.currency)} per kWh
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5 text-sm">
                <section>
                  <h3 className="mb-1 font-semibold">1. Totals</h3>
                  <p>
                    Daily {formatKwh(totals.dailyKwh)} ({formatMoney(totals.dailyCost, draft.currency)}) ·
                    Monthly {formatKwh(totals.monthlyKwh)} ({formatMoney(totals.monthlyCost, draft.currency)}) ·
                    Yearly {formatKwh(totals.yearlyKwh)} ({formatMoney(totals.yearlyCost, draft.currency)})
                  </p>
                </section>
                <section>
                  <h3 className="mb-1 font-semibold">2. Appliances</h3>
                  <ul className="list-inside list-disc space-y-1">
                    {rows.map((r) => (
                      <li key={r.id}>
                        {r.name} — {r.quantity} × {r.watts}W for {r.hoursPerDay}h/day,{" "}
                        {r.daysPerWeek} day(s)/week → {formatKwh(r.monthlyKwh)}/month (
                        {(r.share * 100).toFixed(1)}%)
                      </li>
                    ))}
                  </ul>
                </section>
                <section>
                  <h3 className="mb-1 font-semibold">3. Status</h3>
                  <p>
                    <strong>{status.label}</strong> — {status.summary}
                  </p>
                  <p className="mt-1 flex items-center gap-2">
                    {isEfficient ? (
                      <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="size-4 text-warning" aria-hidden="true" />
                    )}
                    Highest consumer: {top?.name} ({((top?.share ?? 0) * 100).toFixed(0)}% of total).
                  </p>
                </section>
                <section>
                  <h3 className="mb-1 font-semibold">
                    4. {isEfficient ? "Appreciation" : "Recommendations"}
                  </h3>
                  {isEfficient ? (
                    <p>
                      Consumption is in the efficient band. Maintain current habits and re-check each
                      season.
                    </p>
                  ) : (
                    <ol className="list-inside list-decimal space-y-1">
                      {recommendations.slice(0, 8).map((rec) => (
                        <li key={rec.id}>
                          {rec.title} — saves about {formatKwh(rec.monthlyKwhSaved)}/month
                        </li>
                      ))}
                    </ol>
                  )}
                </section>
                <section>
                  <h3 className="mb-1 font-semibold">5. Reduction plan outcome</h3>
                  <p>
                    Completing the plan saves {formatKwh(plan.totalKwhSaved)} per month (
                    {formatMoney(plan.totalCostSaved, draft.currency)}), bringing you to{" "}
                    {formatKwh(plan.projectedMonthlyKwh)} — status {plan.projectedStatus.label}.
                  </p>
                </section>
              </CardContent>
            </Card>
          </StageShell>
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  kwh,
  cost,
  currency,
  highlight,
}: {
  label: string;
  kwh: number;
  cost: number;
  currency: string;
  highlight?: boolean;
}) {
  return (
    <Card className={`print-break ${highlight ? "border-primary/40 bg-primary/5" : ""}`}>
      <CardHeader className="pb-2">
        <CardDescription>{label} consumption</CardDescription>
        <CardTitle className="text-2xl">{formatKwh(kwh)}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{formatMoney(cost, currency)} estimated cost</p>
      </CardContent>
    </Card>
  );
}

function PlanStat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
