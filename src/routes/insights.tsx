import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights & Recovery Metrics | BalanceAI" },
      {
        name: "description",
        content:
          "Weekly burnout trends, recovery streaks and capacity history across your five load vectors.",
      },
      { property: "og:title", content: "Insights & Recovery Metrics | BalanceAI" },
      {
        property: "og:description",
        content: "See how your weekly load and recovery streaks trend over time.",
      },
    ],
  }),
  component: Insights,
});

const week = [
  { d: "Mon", v: 88 },
  { d: "Tue", v: 74 },
  { d: "Wed", v: 61 },
  { d: "Thu", v: 80 },
  { d: "Fri", v: 55 },
  { d: "Sat", v: 40 },
  { d: "Sun", v: 34 },
];

function Insights() {
  return (
    <AppShell
      header={
        <header className="flex items-start justify-between gap-3 px-4 pt-6">
          <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
          <ThemeToggle />
        </header>
      }
    >
      <GlassCard>
        <SectionTitle>Load this week</SectionTitle>
        <div className="flex h-40 items-end justify-between gap-2">
          {week.map((w) => (
            <div key={w.d} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-xl"
                style={{
                  height: `${w.v}%`,
                  background:
                    w.v >= 85
                      ? "var(--danger)"
                      : w.v >= 65
                        ? "var(--warn)"
                        : "var(--safe)",
                }}
                aria-hidden
              />
              <span className="text-[11px] text-muted-foreground">{w.d}</span>
              <span className="sr-only">
                {w.d}: {w.v}% load
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle>Recovery</SectionTitle>
        <p className="text-3xl font-bold">4-day streak</p>
        <p className="mt-1 text-sm text-muted-foreground">
          You protected an evening recovery window 4 days in a row.
        </p>
      </GlassCard>
    </AppShell>
  );
}
