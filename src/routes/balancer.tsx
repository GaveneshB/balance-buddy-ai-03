import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, CalendarClock, MessageSquareQuote, Pencil } from "lucide-react";
import { useState } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";

export const Route = createFileRoute("/balancer")({
  head: () => ({
    meta: [
      { title: "Capacity Shield — Autonomous Workload Balancer | BalanceAI" },
      {
        name: "description",
        content:
          "At 85%+ load BalanceAI defers non-urgent tasks and drafts polite declines so you can recover in one tap.",
      },
      { property: "og:title", content: "Capacity Shield | BalanceAI" },
      {
        property: "og:description",
        content: "Auto-defer tasks and send polite declines when your week is overloaded.",
      },
    ],
  }),
  component: Balancer,
});

const offloaded = [
  { task: "Grocery Shopping", why: "Non-urgent errand", when: "Deferred to Saturday" },
  { task: "Club Prep Deck", why: "No hard deadline", when: "Deferred to Sunday 2pm" },
  { task: "Gym — leg day", why: "Physical load low priority", when: "Moved to Friday" },
];

function Balancer() {
  const [approved, setApproved] = useState(false);

  return (
    <AppShell
      header={
        <header className="flex items-start justify-between gap-3 px-4 pt-6">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: "color-mix(in oklab, var(--danger) 14%, transparent)",
                color: "var(--danger)",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" /> 88% Load Detected
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight">
              Capacity Shield Activated
            </h1>
          </div>
          <ThemeToggle />
        </header>
      }
    >
      <GlassCard>
        <SectionTitle>Offloaded tasks</SectionTitle>
        <ul className="space-y-3">
          {offloaded.map((o) => (
            <li key={o.task} className="glass-panel flex items-start gap-3 p-4">
              <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
              <div>
                <p className="text-sm font-semibold">{o.task}</p>
                <p className="text-xs text-muted-foreground">{o.why}</p>
                <p
                  className="mt-1 text-xs font-semibold"
                  style={{ color: "var(--safe)" }}
                >
                  {o.when}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>

      <GlassCard>
        <SectionTitle>Auto-decline draft</SectionTitle>
        <div className="glass-panel p-4">
          <MessageSquareQuote className="h-5 w-5 text-accent-foreground" />
          <p className="mt-2 text-sm italic leading-relaxed">
            “Hey! I’m completely at capacity with exams this week, so I won’t be able to
            make it to tonight’s dinner. Let’s reconnect next week!”
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            To: Study group · Dinner tonight, 8:00 PM
          </p>
        </div>
      </GlassCard>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setApproved(true)}
          className="glow-accent min-h-[52px] w-full rounded-2xl bg-[image:var(--gradient-accent)] text-base font-bold text-primary-foreground transition-transform active:scale-[0.98]"
        >
          {approved ? "Rebalanced ✓ Load now 61%" : "Approve & Rebalance (1-Tap)"}
        </button>
        <button
          type="button"
          className="inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-border text-sm font-semibold"
        >
          <Pencil className="h-4 w-4" /> Customize
        </button>
        <p className="text-center text-xs text-muted-foreground" aria-live="polite">
          {approved
            ? "3 tasks deferred and 1 decline sent. Recovery window booked 7–9pm."
            : "Nothing is sent until you approve."}
        </p>
      </div>
    </AppShell>
  );
}
