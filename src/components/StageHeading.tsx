import { ArrowDown } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Numbered stage marker used on the Analyze page so the journey
 * (input -> calculation -> status -> tips/appreciation -> plan -> report)
 * is visible rather than implied.
 */
export function StageHeading({
  step,
  title,
  description,
  id,
}: {
  step: number;
  title: string;
  description: string;
  id?: string;
}) {
  return (
    <div className="mb-4 flex items-start gap-3" {...(id ? { id } : {})}>
      <span
        className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-sm font-semibold text-primary"
        aria-hidden="true"
      >
        {step}
      </span>
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          <span className="sr-only">Step {step}: </span>
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function StageConnector({ label }: { label: string }) {
  return (
    <div className="no-print flex flex-col items-center gap-1 py-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <ArrowDown className="size-4 text-primary" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function StageShell({ children }: { children: ReactNode }) {
  return <section className="scroll-mt-24">{children}</section>;
}
