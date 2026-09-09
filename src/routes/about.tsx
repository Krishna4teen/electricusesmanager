import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  FileText,
  Gauge,
  History,
  Home,
  Leaf,
  Lightbulb,
  ListChecks,
  MonitorSmartphone,
  PackageSearch,
  PieChart,
  Printer,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  Zap,
  type LucideIcon,
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
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
          "A clear guide to ECO-WATT's household electricity calculations, results, recommendations and saved history.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AboutPage,
});

type GuideItem = {
  title: string;
  icon: LucideIcon;
  use: string;
  works: string;
  needed: string;
  benefit: string;
};

const JOURNEY = [
  ["Household input", "Name the analysis and choose your electricity rate and display currency."],
  ["Appliance details", "Add each appliance, its watts, daily hours, quantity and days used each week."],
  ["Automatic calculation", "ECO-WATT converts every line into daily, monthly and yearly kWh and cost."],
  ["Results dashboard", "Totals, appliance shares, charts and the highest consumer make the pattern visible."],
  ["Consumption status", "Your recorded monthly total is placed in one of the app’s four reference bands."],
  ["Personalized recommendations", "Rules match appliance names and usage; custom items receive responsible general guidance."],
  ["Reduction plan", "The highest-impact relevant actions are ranked using your recorded consumption."],
  ["Report and history", "Review or print the full report, then save a snapshot for later trend comparison."],
] as const;

const GUIDE: GuideItem[] = [
  { title: "Home", icon: Home, use: "Introduces the purpose and the five-stage project flow.", works: "It links directly to analysis and previews the calculation journey with tested examples.", needed: "A clear starting point helps first-time users understand what information they will need.", benefit: "You can begin confidently without learning a technical system first." },
  { title: "Analyze and household inputs", icon: Calculator, use: "Creates a complete electricity estimate for one household or scenario.", works: "You enter a name, tariff, currency and as many appliance rows as needed; results update from those entries.", needed: "Households use different devices for different lengths of time, so a useful estimate must start with personal inputs.", benefit: "The output reflects your recorded routine rather than a fixed sample household." },
  { title: "Appliance search, presets and custom items", icon: Search, use: "Adds appliances quickly while keeping every value editable.", works: "Search 90+ grouped presets, choose one to fill example values, or add a custom appliance and enter its details yourself.", needed: "Presets reduce typing, while custom entries ensure unusual or local appliances are not excluded.", benefit: "Every selected or custom item is included in totals, charts, recommendations, plans and saved reports." },
  { title: "Results dashboard", icon: Gauge, use: "Summarizes daily, monthly and yearly energy and cost.", works: "It adds the calculated appliance rows and identifies the one with the greatest monthly kWh.", needed: "A single bill total does not show which devices created it.", benefit: "You see both the overall scale and the main contributor at a glance." },
  { title: "Charts and appliance breakdown", icon: PieChart, use: "Turns the result table into comparisons that are easier to scan.", works: "Bar and share charts use each appliance’s calculated monthly kWh; time-horizon charts compare daily, monthly and yearly figures.", needed: "Visual proportions reveal patterns that can be missed in a list of numbers.", benefit: "You can focus attention on the appliances that matter most." },
  { title: "Consumption status and criteria", icon: BarChart3, use: "Provides a simple reference label for the recorded monthly total.", works: "The total is compared with ECO-WATT’s Low, Moderate, High and Very High bands, and the matching criterion is shown.", needed: "A number is easier to discuss when its meaning is explained consistently.", benefit: "You get context for the estimate without treating the band as a universal judgment." },
  { title: "Personalized recommendations", icon: Lightbulb, use: "Connects appliance-level results with practical next steps.", works: "Rule-based advice matches relevant appliance types and usage patterns, then ranks suggestions by estimated kWh impact. Custom names receive general guidance.", needed: "Advice is more useful when it responds to what is actually using energy.", benefit: "You receive a prioritized list instead of unrelated generic tips." },
  { title: "Reduction plan", icon: ListChecks, use: "Organizes the highest-priority suggestions into a manageable sequence.", works: "It takes the leading recommendations, shows cumulative potential kWh and cost changes, and recalculates a projected status.", needed: "A short ordered plan is easier to act on than a long list.", benefit: "You can compare possible actions before deciding what is realistic for your household." },
  { title: "Full report and print", icon: Printer, use: "Combines inputs, results, status, recommendations and the plan in one record.", works: "The final stage formats the complete analysis for on-screen review or browser printing.", needed: "A consolidated record is useful for assignments, household discussion and later comparison.", benefit: "You can keep or share a readable summary without copying figures by hand." },
  { title: "History and trends", icon: History, use: "Keeps completed snapshots and compares change over time.", works: "Saved analyses remain in persistent storage; History can load or delete them and chart monthly kWh across records.", needed: "One estimate is a starting point, while repeated snapshots can show direction.", benefit: "You can monitor whether recorded consumption rises or falls between analyses." },
  { title: "Appliances library", icon: PackageSearch, use: "Provides a searchable reference for common household equipment.", works: "Presets are grouped by category with example watts, usage notes and one-click addition to the current draft.", needed: "Users may not know a reasonable starting wattage for every device.", benefit: "You can build an analysis faster, then replace examples with the rating printed on your model." },
  { title: "Tips", icon: BookOpen, use: "Offers practical guidance beyond the personalized result list.", works: "Advice is grouped by lighting, cooling, refrigeration, cooking, laundry, water heating, entertainment, standby power and general habits.", needed: "Some useful habits apply broadly even when they are not selected for a reduction plan.", benefit: "You can explore cautious, easy-to-scan ideas at your own pace." },
  { title: "Electricity rate and currency", icon: CircleDollarSign, use: "Translates energy into a familiar estimated cost.", works: "Choose a display currency and enter the amount charged per kWh; the choice is retained with saved analyses.", needed: "Tariffs and currencies differ by location, and energy use alone does not show financial scale.", benefit: "Current and historic reports keep the cost format you selected." },
];

const ECO_HELP = [
  ["See usage clearly", "Daily, monthly and yearly views turn appliance habits into comparable kWh figures.", Zap],
  ["Find key contributors", "Appliance shares and the highest-consumer result show where focused attention may matter most.", Target],
  ["Choose realistic actions", "Ranked recommendations translate the recorded pattern into practical options, not promises.", ListChecks],
  ["Plan potential savings", "Projected reductions help compare possible kWh and cost changes before taking action.", TrendingDown],
  ["Monitor progress", "Saved snapshots and trend charts let you compare later analyses with earlier ones.", History],
] as const;

function AboutPage() {
  return (
    <div className="about-ambient">
      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:py-16">
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-semibold text-secondary-foreground">
            <Leaf className="size-4" aria-hidden="true" /> About the project
          </span>
          <h1 className="mt-6 font-heading text-4xl font-extrabold sm:text-5xl lg:text-6xl">
            Understand electricity. Make better-informed choices.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            ECO-WATT is an educational household electricity analyzer. It turns the appliance details
            you provide into clear energy and cost estimates, then helps you identify practical ways
            to use electricity more thoughtfully.
          </p>
        </header>

        <div className="mt-12 grid gap-5 lg:grid-cols-12">
          <article className="glass-panel rounded-lg border border-border p-6 sm:p-8 lg:col-span-7">
            <div className="flex items-start gap-4">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Sparkles className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-heading text-2xl font-bold">What ECO-WATT is for</h2>
                <p className="mt-3 leading-7 text-muted-foreground">
                  Its objective is to make household electricity visible and understandable. By
                  showing where energy goes, ECO-WATT supports informed efficiency choices that may
                  reduce avoidable use, costs and associated environmental impact.
                </p>
              </div>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg bg-secondary p-4">
                <h3 className="font-heading font-semibold">Clarity before action</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Compare appliances using the same units and time periods.</p>
              </div>
              <div className="rounded-lg bg-accent p-4">
                <h3 className="font-heading font-semibold">Guidance, not guarantees</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">Recommendations and projected savings are planning estimates, not promised outcomes.</p>
              </div>
            </div>
          </article>

          <aside className="rounded-lg bg-primary p-6 text-primary-foreground sm:p-8 lg:col-span-5">
            <ShieldCheck className="size-8" aria-hidden="true" />
            <h2 className="mt-5 font-heading text-2xl font-bold">Built for honest comparison</h2>
            <p className="mt-3 text-sm leading-6 text-primary-foreground/85">
              ECO-WATT uses the values you enter. It does not connect to a smart meter or claim to
              measure live electricity. Results are estimates for learning, planning and comparison.
            </p>
            <Button asChild variant="secondary" className="mt-6">
              <Link to="/analyze">Start an analysis</Link>
            </Button>
          </aside>
        </div>
      </section>

      <section className="border-y border-border bg-background/70 py-14" aria-labelledby="journey-title">
        <div className="mx-auto w-full max-w-6xl px-4">
          <p className="text-sm font-bold text-primary">FROM INPUT TO ACTION</p>
          <h2 id="journey-title" className="mt-2 font-heading text-3xl font-bold">How the app works</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">One continuous journey, with each stage built from the information entered before it.</p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {JOURNEY.map(([title, description], index) => (
              <li key={title} className="relative rounded-lg border border-border bg-card p-5 shadow-sm">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary font-heading text-sm font-bold text-secondary-foreground" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-heading text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14" aria-labelledby="guide-title">
        <div className="text-center">
          <p className="text-sm font-bold text-primary">PAGE-BY-PAGE GUIDE</p>
          <h2 id="guide-title" className="mt-2 font-heading text-3xl font-bold">What every section does for you</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">Open any topic for its purpose, operation, reason and practical benefit.</p>
        </div>
        <Accordion type="single" collapsible className="mt-8 space-y-3">
          {GUIDE.map((item, index) => {
            const Icon = item.icon;
            return (
              <AccordionItem key={item.title} value={`guide-${index}`} className="glass-panel rounded-lg border border-border px-5">
                <AccordionTrigger className="gap-4 py-5 text-base hover:no-underline">
                  <span className="flex items-center gap-3 text-left font-heading font-semibold">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary"><Icon className="size-4" aria-hidden="true" /></span>
                    {item.title}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="grid gap-4 pb-5 sm:grid-cols-2">
                  {[["Use", item.use], ["How it works", item.works], ["Why it is needed", item.needed], ["Practical benefit", item.benefit]].map(([label, text]) => (
                    <div key={label} className="rounded-lg bg-muted p-4">
                      <h3 className="text-xs font-bold uppercase text-primary">{label}</h3>
                      <p className="mt-1.5 leading-6 text-muted-foreground">{text}</p>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </section>

      <section className="border-y border-border bg-background/75 py-14" aria-labelledby="method-title">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 lg:grid-cols-2">
          <article>
            <p className="text-sm font-bold text-primary">METHOD AND UNITS</p>
            <h2 id="method-title" className="mt-2 font-heading text-3xl font-bold">How the calculation is made</h2>
            <dl className="mt-7 space-y-4">
              <div className="rounded-lg border border-border bg-card p-5"><dt className="font-heading font-semibold">W — watts</dt><dd className="mt-1 text-sm leading-6 text-muted-foreground">The appliance’s power rating. Use the label on your own model where possible.</dd></div>
              <div className="rounded-lg border border-border bg-card p-5"><dt className="font-heading font-semibold">kWh — kilowatt-hours</dt><dd className="mt-1 text-sm leading-6 text-muted-foreground">The unit of energy: power multiplied by time, with watts divided by 1,000.</dd></div>
              <div className="rounded-lg border border-border bg-card p-5"><dt className="font-heading font-semibold">Rate and currency</dt><dd className="mt-1 text-sm leading-6 text-muted-foreground">Your price for one kWh and the currency used to display estimated cost.</dd></div>
            </dl>
          </article>
          <article className="rounded-lg bg-foreground p-6 text-background sm:p-8">
            <Calculator className="size-7 text-primary-glow" aria-hidden="true" />
            <h3 className="mt-5 font-heading text-2xl font-bold">Formula sequence</h3>
            <div className="mt-5 space-y-3 text-sm">
              <p className="rounded-lg bg-background/10 p-4 font-mono">Daily kWh = W × hours × quantity ÷ 1000 × days per week ÷ 7</p>
              <p className="rounded-lg bg-background/10 p-4 font-mono">Monthly kWh = daily kWh × 30</p>
              <p className="rounded-lg bg-background/10 p-4 font-mono">Yearly kWh = daily kWh × 365</p>
              <p className="rounded-lg bg-background/10 p-4 font-mono">Estimated cost = kWh × rate per kWh</p>
            </div>
            <p className="mt-5 text-sm leading-6 text-background/75">Example: one 1,500 W air conditioner used for 8 hours daily equals 12 kWh/day, 360 kWh/month and 4,380 kWh/year before cost is applied.</p>
          </article>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14" aria-labelledby="criteria-title">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <p className="text-sm font-bold text-primary">CONTEXT, NOT A VERDICT</p>
            <h2 id="criteria-title" className="mt-2 font-heading text-3xl font-bold">Consumption criteria</h2>
            <p className="mt-3 leading-7 text-muted-foreground">These are ECO-WATT’s project reference bands for comparing the entered monthly total. They are not universal standards: household size, climate, appliance access and local conditions vary.</p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-3">
            {STATUS_BANDS.map((band) => (
              <li key={band.key} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3"><strong className="font-heading">{band.label}</strong><span className="text-xs font-semibold text-primary">{band.max === null ? `${band.min}+` : `${band.min}–${band.max}`} kWh/mo</span></div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{band.summary}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-primary py-14 text-primary-foreground" aria-labelledby="eco-title">
        <div className="mx-auto w-full max-w-6xl px-4">
          <div className="max-w-3xl">
            <p className="text-sm font-bold text-primary-foreground/75">FROM AWARENESS TO HABIT</p>
            <h2 id="eco-title" className="mt-2 font-heading text-3xl font-bold">How ECO-WATT helps users become more eco-friendly electricity consumers</h2>
            <p className="mt-3 leading-7 text-primary-foreground/85">The app supports a repeatable learning cycle: understand, prioritize, plan and compare.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ECO_HELP.map(([title, text, Icon]) => (
              <article key={title} className="rounded-lg border border-primary-foreground/20 bg-primary-foreground/10 p-5 backdrop-blur-sm">
                <Icon className="size-6" aria-hidden="true" />
                <h3 className="mt-4 font-heading font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-primary-foreground/80">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-14">
        <div className="grid gap-5 md:grid-cols-2">
          <article className="rounded-lg border border-border bg-card p-6">
            <div className="flex items-center gap-3"><ClipboardCheck className="size-5 text-primary" aria-hidden="true" /><h2 className="font-heading text-xl font-bold">Validation and data</h2></div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
              <li className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />Entries are checked for missing names and invalid wattage, hours, quantity or weekly usage before saving.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />The current draft stays on your device; saved snapshots use persistent app storage and survive a refresh.</li>
              <li className="flex gap-2"><CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />Saved records retain their appliance data, totals, status, rate and currency for history and reports.</li>
            </ul>
          </article>
          <article className="rounded-lg border border-warning/40 bg-warning/10 p-6">
            <div className="flex items-center gap-3"><MonitorSmartphone className="size-5 text-warning-foreground" aria-hidden="true" /><h2 className="font-heading text-xl font-bold">Important limits</h2></div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">Preset wattages are editable examples. Real ratings vary by model, size and age, while tariffs vary by provider and location. Compressors and thermostats may cycle, and the app does not model standing charges, taxes, tariff tiers or time-of-use pricing.</p>
            <p className="mt-3 text-sm font-medium">Use ECO-WATT for informed estimates and comparison—not as a replacement for a meter or electricity bill.</p>
          </article>
        </div>
        <div className="mt-10 rounded-lg border border-border bg-card p-7 text-center shadow-sm">
          <FileText className="mx-auto size-7 text-primary" aria-hidden="true" />
          <h2 className="mt-3 font-heading text-2xl font-bold">Ready to understand your household?</h2>
          <p className="mx-auto mt-2 max-w-xl text-muted-foreground">Build an estimate, inspect the appliance breakdown and save a baseline you can compare later.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild><Link to="/analyze">Analyze electricity use</Link></Button>
            <Button asChild variant="outline"><Link to="/tips">Browse practical tips</Link></Button>
          </div>
        </div>
      </section>
    </div>
  );
}
