import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AirVent,
  Lightbulb,
  Plug,
  Refrigerator,
  ShowerHead,
  Utensils,
  WashingMachine,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/tips")({
  head: () => ({
    meta: [
      { title: "Energy Saving Tips | ECO-WATT" },
      {
        name: "description",
        content:
          "Practical, room-by-room energy saving tips for lighting, cooling, refrigeration, laundry, cooking and standby power — with the reason each one works.",
      },
      { property: "og:title", content: "Energy Saving Tips | ECO-WATT" },
      {
        property: "og:description",
        content:
          "Cut your household electricity bill with practical tips for cooling, lighting, refrigeration, laundry and standby loads.",
      },
    ],
  }),
  component: TipsPage,
});

const GROUPS = [
  {
    icon: AirVent,
    title: "Cooling & heating",
    tips: [
      "Each degree of extra cooling costs roughly 6–10% more energy — 24–26 °C is comfortable and far cheaper.",
      "Clean or replace filters monthly; a clogged filter forces the compressor to run longer.",
      "Close doors and windows in the cooled room, and shade windows facing the sun.",
      "Run a fan alongside the air conditioner so you can set a higher temperature.",
    ],
  },
  {
    icon: Lightbulb,
    title: "Lighting",
    tips: [
      "LED bulbs use about 80% less power than incandescent for the same brightness.",
      "Use daylight where you can and light the task, not the whole room.",
      "Switch off lights in empty rooms — the biggest saving is the light you never turn on.",
    ],
  },
  {
    icon: Refrigerator,
    title: "Refrigeration",
    tips: [
      "Keep the fridge at 3–5 °C and the freezer at −18 °C; colder than that wastes energy.",
      "Clean the condenser coils and check the door seal twice a year.",
      "Let hot food cool before putting it in, and keep the appliance out of direct sunlight.",
    ],
  },
  {
    icon: WashingMachine,
    title: "Laundry",
    tips: [
      "Most of a wash cycle's energy heats water — cold or eco cycles cut a large share of it.",
      "Run full loads; two half loads use noticeably more than one full one.",
      "Line dry when you can. A tumble dryer is one of the most expensive appliances in a home.",
    ],
  },
  {
    icon: Utensils,
    title: "Kitchen",
    tips: [
      "Boil only the water you need in the kettle.",
      "Use a microwave or a lid on the pan instead of a full oven for small portions.",
      "Match pan size to the hob ring so heat is not wasted around the edges.",
    ],
  },
  {
    icon: ShowerHead,
    title: "Water heating",
    tips: [
      "Set the water heater thermostat to about 60 °C — hotter is a burn risk and wastes energy.",
      "Insulate the tank and the first metre of hot pipe.",
      "Heat water on a timer around when you actually shower.",
    ],
  },
  {
    icon: Plug,
    title: "Standby power",
    tips: [
      "TVs, decoders, chargers and consoles draw power while idle — a switched power strip removes it.",
      "Enable sleep mode on computers after 10 minutes idle.",
      "Unplug chargers once the device is full.",
    ],
  },
];

function TipsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Energy saving tips</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          General guidance that applies to most homes. For tips built from your own appliance data
          and ranked by how much they save,{" "}
          <Link to="/analyze" className="font-medium text-primary underline">
            run an analysis
          </Link>
          .
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {GROUPS.map((group) => (
          <Card key={group.title}>
            <CardHeader className="flex-row items-center gap-3 space-y-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <group.icon className="size-5" aria-hidden="true" />
              </span>
              <CardTitle className="text-lg">{group.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {group.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
