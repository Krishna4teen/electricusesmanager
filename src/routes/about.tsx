import { createFileRoute, Link } from "@tanstack/react-router";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_BANDS } from "@/lib/eco";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About ECO-WATT & How the Maths Works" },
      {
        name: "description",
        content:
          "How ECO-WATT turns wattage and usage hours into kWh and cost, how the consumption status bands are set, and what the estimates do and do not cover.",
      },
      { property: "og:title", content: "About ECO-WATT & How the Maths Works" },
      {
        property: "og:description",
        content:
          "The formulas, assumptions and status criteria behind ECO-WATT's household electricity estimates.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">About ECO-WATT</h1>
      <p className="mt-3 text-muted-foreground">
        ECO-WATT is a household electricity consumption analyzer. You describe the appliances you
        own and how you use them; it works out what that costs in energy and money, tells you where
        the consumption is concentrated, and gives you a ranked plan to reduce it.
      </p>

      <div className="mt-10 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">The formulas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="rounded-lg bg-muted p-3 font-mono text-xs">
              kWh per day = watts × hours per day × units ÷ 1000 × (days per week ÷ 7)
            </p>
            <p className="rounded-lg bg-muted p-3 font-mono text-xs">
              kWh per month = kWh per day × 30 · kWh per year = kWh per day × 365
            </p>
            <p className="rounded-lg bg-muted p-3 font-mono text-xs">
              cost = kWh × your rate per kWh
            </p>
            <p className="text-muted-foreground">
              Worked example: an air conditioner rated 1500 W used 8 hours a day is 1500 × 8 ÷ 1000
              = 12 kWh a day, 360 kWh a month, 4,380 kWh a year. Two 75 W ceiling fans running 12
              hours a day are 1.8 kWh a day, 54 kWh a month.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How the status is decided</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {STATUS_BANDS.map((band) => (
                <li key={band.key}>
                  <strong>{band.label}</strong> —{" "}
                  {band.max === null
                    ? `${band.min} kWh/month and above`
                    : `${band.min}–${band.max} kWh/month`}
                  . {band.summary}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Where the recommendations come from</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Recommendations are rule-based, not guesswork. Each rule matches an appliance type and
              a usage pattern — an air conditioner running more than three hours a day, an
              incandescent bulb, a fridge, a tumble dryer — and applies a published typical saving
              fraction to that appliance&apos;s own consumption.
            </p>
            <p>
              Because the saving is a fraction of your real numbers, the list ranks itself: the tip
              that saves the most kWh for your household appears first, and the reduction plan takes
              the top actions in order.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What this does not cover</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              Estimates assume steady wattage. Appliances with compressors or thermostats (fridges,
              air conditioners) cycle on and off, so real consumption can differ. Standing charges,
              tiered tariffs, taxes and time-of-use pricing are not modelled — the estimate uses a
              single rate per kWh.
            </p>
            <p>
              Treat the figures as a well-grounded planning tool and a way to compare appliances
              against each other, not as a replacement for your meter reading.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Your data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              The analysis you are editing is kept on your device. When you save an analysis it is
              stored in the app&apos;s database so it survives a refresh and appears in your{" "}
              <Link to="/history" className="font-medium text-primary underline">
                history
              </Link>{" "}
              with trend comparison. No account or personal detail is required.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
