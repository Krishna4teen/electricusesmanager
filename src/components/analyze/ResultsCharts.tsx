import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatKwh, type ApplianceResult } from "@/lib/eco";

const PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

export function ConsumptionBarChart({ rows }: { rows: ApplianceResult[] }) {
  const data = rows.map((r) => ({ name: r.name || "Unnamed", kwh: Number(r.monthlyKwh.toFixed(2)) }));
  return (
    <div className="h-72 w-full" role="img" aria-label="Monthly consumption per appliance">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            interval={0}
            angle={-18}
            textAnchor="end"
            height={62}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            label={{ value: "kWh / month", angle: -90, position: "insideLeft", fontSize: 11 }}
          />
          <Tooltip
            formatter={(v: number) => formatKwh(v)}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-card-foreground)",
            }}
          />
          <Bar dataKey="kwh" radius={[6, 6, 0, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ConsumptionPieChart({ rows }: { rows: ApplianceResult[] }) {
  const data = rows
    .filter((r) => r.monthlyKwh > 0)
    .map((r) => ({ name: r.name || "Unnamed", value: Number(r.monthlyKwh.toFixed(2)) }));
  return (
    <div className="h-72 w-full" role="img" aria-label="Share of monthly consumption per appliance">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip
            formatter={(v: number) => formatKwh(v)}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-card-foreground)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizonChart({
  daily,
  monthly,
  yearly,
}: {
  daily: number;
  monthly: number;
  yearly: number;
}) {
  const data = [
    { period: "Daily", kwh: Number(daily.toFixed(2)) },
    { period: "Monthly", kwh: Number(monthly.toFixed(2)) },
    { period: "Yearly", kwh: Number(yearly.toFixed(2)) },
  ];
  return (
    <div className="h-64 w-full" role="img" aria-label="Consumption by time horizon">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
          <YAxis
            type="category"
            dataKey="period"
            tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
            width={70}
          />
          <Tooltip
            formatter={(v: number) => formatKwh(v)}
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-card-foreground)",
            }}
          />
          <Bar dataKey="kwh" fill="var(--color-chart-1)" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendChart({
  data,
}: {
  data: { label: string; monthlyKwh: number; monthlyCost: number }[];
}) {
  return (
    <div className="h-72 w-full" role="img" aria-label="Monthly consumption trend across saved analyses">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} />
          <Tooltip
            contentStyle={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              borderRadius: 8,
              color: "var(--color-card-foreground)",
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="monthlyKwh"
            name="kWh / month"
            stroke="var(--color-chart-1)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
          <Line
            type="monotone"
            dataKey="monthlyCost"
            name="Cost / month"
            stroke="var(--color-chart-3)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
