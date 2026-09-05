import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, Download, Minus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { TrendChart } from "@/components/analyze/ResultsCharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteAnalysis, listAnalyses, type SavedAnalysis } from "@/lib/analyses";
import { setDraft } from "@/lib/draft";
import { formatKwh, formatMoney } from "@/lib/eco";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Saved Analyses & Trends | ECO-WATT" },
      {
        name: "description",
        content:
          "Review every electricity analysis you have saved, compare consumption and cost over time, reload an old analysis or delete it.",
      },
      { property: "og:title", content: "Saved Analyses & Trends | ECO-WATT" },
      {
        property: "og:description",
        content:
          "Compare your household electricity consumption across saved analyses and see whether your usage is trending up or down.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["analyses"],
    queryFn: listAnalyses,
    enabled: ready,
  });

  const remove = useMutation({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      toast.success("Analysis deleted.");
      void queryClient.invalidateQueries({ queryKey: ["analyses"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const analyses = data ?? [];
  const chronological = [...analyses].reverse();
  const trend = chronological.map((a) => ({
    label: new Date(a.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    monthlyKwh: Number(a.totals.monthlyKwh.toFixed(1)),
    monthlyCost: Number(a.totals.monthlyCost.toFixed(2)),
  }));

  const latest = analyses[0];
  const previous = analyses[1];
  const delta =
    latest && previous ? latest.totals.monthlyKwh - previous.totals.monthlyKwh : undefined;

  const load = (a: SavedAnalysis) => {
    setDraft({
      name: a.name,
      rate: a.tariffRate,
      currency: a.currency,
      appliances: a.appliances,
    });
    toast.success(`“${a.name}” loaded into the analyzer.`);
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">History &amp; trends</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Every analysis you save is stored, so you can compare seasons and check whether your
          changes actually worked.
        </p>
      </header>

      {!ready || isLoading ? (
        <p className="text-muted-foreground">Loading your saved analyses…</p>
      ) : error ? (
        <p role="alert" className="text-destructive">
          Could not load your history: {(error as Error).message}
        </p>
      ) : analyses.length === 0 ? (
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <p className="text-muted-foreground">You have not saved an analysis yet.</p>
            <Button asChild>
              <Link to="/analyze">Run your first analysis</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Latest monthly use</CardDescription>
                <CardTitle className="text-2xl">{formatKwh(latest!.totals.monthlyKwh)}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {formatMoney(latest!.totals.monthlyCost, latest!.currency)} · status{" "}
                  {latest!.status}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Change vs previous</CardDescription>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  {delta === undefined ? (
                    <>
                      <Minus className="size-5 text-muted-foreground" aria-hidden="true" />
                      <span className="text-base font-normal text-muted-foreground">
                        Save another to compare
                      </span>
                    </>
                  ) : delta <= 0 ? (
                    <>
                      <ArrowDownRight className="size-6 text-success" aria-hidden="true" />
                      <span className="text-success">{formatKwh(Math.abs(delta))} lower</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="size-6 text-danger" aria-hidden="true" />
                      <span className="text-danger">{formatKwh(delta)} higher</span>
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {previous ? `Compared with “${previous.name}”.` : "Only one analysis saved."}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Analyses saved</CardDescription>
                <CardTitle className="text-2xl">{analyses.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Oldest {new Date(chronological[0]!.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {trend.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Consumption trend</CardTitle>
                <CardDescription>Monthly kWh and cost across your saved analyses.</CardDescription>
              </CardHeader>
              <CardContent>
                <TrendChart data={trend} currency={latest!.currency} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Saved analyses</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead scope="col">Name</TableHead>
                    <TableHead scope="col">Saved</TableHead>
                    <TableHead scope="col">Status</TableHead>
                    <TableHead scope="col" className="text-right">kWh / month</TableHead>
                    <TableHead scope="col" className="text-right">Cost / month</TableHead>
                    <TableHead scope="col" className="text-right">Appliances</TableHead>
                    <TableHead scope="col" className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.name}</TableCell>
                      <TableCell>{new Date(a.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{a.totals.monthlyKwh.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(a.totals.monthlyCost, a.currency)}
                      </TableCell>
                      <TableCell className="text-right">{a.appliances.length}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => load(a)}>
                            <Download className="size-4" aria-hidden="true" />
                            Load
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            disabled={remove.isPending}
                            onClick={() => remove.mutate(a.id)}
                            aria-label={`Delete ${a.name}`}
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
