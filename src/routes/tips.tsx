import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AirVent,
  Flame,
  Home,
  Laptop,
  Lightbulb,
  Refrigerator,
  ShowerHead,
  Tv,
  Utensils,
  WashingMachine,
} from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/tips")({
  head: () => ({
    meta: [
      { title: "Energy Saving Tips | ECO-WATT" },
      {
        name: "description",
        content:
          "Practical energy saving guidance for lighting, cooling, refrigeration, cooking, laundry, water heating, entertainment, computing and everyday household habits.",
      },
      { property: "og:title", content: "Energy Saving Tips | ECO-WATT" },
      {
        property: "og:description",
        content:
          "Room-by-room advice on cutting household electricity use, with the reason each habit helps — no exaggerated savings claims.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TipsPage,
});

type Group = {
  icon: typeof Lightbulb;
  title: string;
  intro: string;
  tips: string[];
};

const GROUPS: Group[] = [
  {
    icon: Lightbulb,
    title: "Lighting",
    intro: "Small individual loads, but they run every evening in every room.",
    tips: [
      "LED bulbs give similar brightness to incandescent or halogen for a small share of the power, and last for years.",
      "Use natural daylight where it is practical — open curtains and blinds before reaching for a switch.",
      "Light the task rather than the whole room: a desk lamp beats a ceiling fitting for reading or study.",
      "Switch lights off in empty rooms; the cheapest light is the one that is never on.",
      "Put outdoor and security lighting on a timer or motion sensor instead of leaving it on all night.",
      "Dust bulbs, shades and fittings occasionally — grime noticeably reduces the light you get for the same watts.",
    ],
  },
  {
    icon: AirVent,
    title: "Cooling & fans",
    intro: "Usually the single largest load in a warm-climate home.",
    tips: [
      "Every extra degree of cooling costs meaningfully more energy; a setting around 24–26 °C stays comfortable for most people.",
      "Clean or replace air-conditioner filters regularly — a clogged filter makes the compressor run longer for the same comfort.",
      "Close doors and windows in the cooled room, and shade windows that get direct sun.",
      "Run a ceiling fan alongside the air conditioner so a higher thermostat setting still feels cool.",
      "Use fans alone on mild days; they draw a small fraction of an air conditioner's power.",
      "Use timers or sleep mode overnight rather than cooling an empty or sleeping house at full output.",
      "Check the label before buying: inverter and higher-rated units use less for the same cooling.",
    ],
  },
  {
    icon: Refrigerator,
    title: "Refrigeration",
    intro: "Runs continuously, so steady habits matter more than one-off effort.",
    tips: [
      "Keep the fridge around 3–5 °C and the freezer near −18 °C; colder settings use more energy without helping.",
      "Clean the condenser coils and check the door seal a couple of times a year.",
      "Let hot food cool before putting it in, and avoid holding the door open while you decide.",
      "Leave a gap around the appliance for airflow, and keep it away from ovens and direct sunlight.",
      "Keep a freezer reasonably full and defrosted — thick ice makes it work harder.",
      "An old second fridge kept for occasional drinks is often the quietest waste in a house.",
    ],
  },
  {
    icon: Utensils,
    title: "Kitchen & cooking",
    intro: "High wattage, short runtimes — the lever is how you use them.",
    tips: [
      "Boil only the water you actually need in the kettle, and descale it now and then.",
      "Use the smallest appliance that does the job: microwave, air fryer or pressure cooker instead of a full oven for small portions.",
      "Keep lids on pans and match the pan to the hob ring so heat is not lost around the edges.",
      "Skip preheating unless the recipe genuinely needs it, and avoid opening the oven door repeatedly.",
      "Switch off keep-warm modes and warming plates once cooking is finished.",
      "Run the dishwasher on a full load and use its eco programme where one is available.",
    ],
  },
  {
    icon: WashingMachine,
    title: "Laundry & cleaning",
    intro: "Most of the energy goes into heating water and drying, not moving the drum.",
    tips: [
      "Wash full loads where practical — two half loads use more than one full one.",
      "Cold or eco cycles cut a large part of a wash's energy and clean most everyday laundry well.",
      "Spin at a higher speed before drying so clothes leave the machine with less water in them.",
      "Line dry when the weather allows; tumble drying is among the most expensive things in a home.",
      "Iron in one batch while the iron is hot, and switch it off a little before you finish.",
      "Empty vacuum bags and clean filters — a blocked machine runs longer for the same result.",
    ],
  },
  {
    icon: ShowerHead,
    title: "Water heating",
    intro: "A steady, often invisible cost that responds well to timing and insulation.",
    tips: [
      "Set the water heater thermostat to about 60 °C; hotter wastes energy and raises the scald risk.",
      "Insulate the tank and the first stretch of hot pipe.",
      "Heat water on a timer around when you actually shower rather than around the clock.",
      "Shorter showers and a low-flow showerhead reduce hot water use directly.",
      "Fix dripping hot taps — a slow leak on the hot side is paid for twice.",
      "Instant heaters draw a very large current but only while water flows; keep sessions short.",
    ],
  },
  {
    icon: Tv,
    title: "Entertainment",
    intro: "Moderate loads with a lot of idle time attached.",
    tips: [
      "Put the TV, soundbar, console and set-top box on one switched power strip and turn it off together.",
      "Lower screen brightness and enable the energy-saving picture mode; the difference is easy to live with.",
      "Set consoles to a low-power rest mode, or off entirely, instead of full standby.",
      "Turn the TV off when it is only background noise — a radio or speaker uses far less.",
      "Set-top boxes and decoders often run at full power all day; check whether yours has a standby schedule.",
    ],
  },
  {
    icon: Laptop,
    title: "Computing & standby power",
    intro: "Individually small, but many devices are on all day.",
    tips: [
      "Enable sleep after around 10 minutes idle, and shut down overnight rather than leaving machines awake.",
      "Switch the monitor off instead of relying on a screensaver — a screensaver saves nothing.",
      "A laptop typically uses much less than a desktop for the same everyday work.",
      "Unplug phone, tablet and tool chargers once the device is full.",
      "Group printer, monitor and speakers on one strip so nothing sits idle overnight.",
      "Routers, cameras and dispensers run 24/7; check that every unit you are paying for is still needed.",
    ],
  },
  {
    icon: Home,
    title: "General household habits",
    intro: "The habits that quietly decide your monthly total.",
    tips: [
      "Switch off anything nobody is using, room by room, as part of an evening routine.",
      "Reduce unnecessary running hours before spending money on new appliances.",
      "Check the rating label and energy label on appliances you own and any you plan to buy.",
      "Maintain what you have: clean filters, clear vents, good seals and serviced motors all use less.",
      "Count every unit — eight bulbs or three fans behave very differently from one.",
      "If your tariff has off-peak periods, shift heavy loads such as laundry or vehicle charging into them.",
      "Re-run your analysis after making changes so you can see the effect in your own numbers.",
    ],
  },
  {
    icon: Flame,
    title: "Heating",
    intro: "Resistive heating is expensive per hour, so control matters most.",
    tips: [
      "Heat the room you are in rather than the whole home, and close the door while you do.",
      "Use a thermostat or timer instead of running a heater continuously.",
      "Block draughts around doors and windows before turning the heat up.",
      "Preheat a bed with an electric blanket, then switch it off rather than leaving it on all night.",
      "Heat pumps work best held at a steady, moderate setting rather than in short hot bursts.",
    ],
  },
];

function TipsPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Energy saving tips</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          General guidance that applies to most homes, grouped so you can scan straight to the part
          you need. For advice built from your own appliances and ranked by the kWh they actually
          use,{" "}
          <Link to="/analyze" className="font-medium text-primary underline">
            run an analysis
          </Link>
          .
        </p>
        <p className="mt-3 max-w-2xl text-xs text-muted-foreground">
          Actual results depend on your appliances, climate, tariff and habits, so treat these as
          sensible practices rather than guaranteed savings.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {GROUPS.map((group) => (
          <Card key={group.title} className="h-full">
            <CardHeader className="flex-row items-start gap-3 space-y-0">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <group.icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle className="text-lg">{group.title}</CardTitle>
                <CardDescription>{group.intro}</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {group.tips.map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <span
                      className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                      aria-hidden="true"
                    />
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
