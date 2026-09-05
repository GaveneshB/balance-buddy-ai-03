import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { useState, useEffect } from "react";
import { getChartData, type WeekRecord } from "@/lib/metrics-db";

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

function Insights() {
  const [chartData, setChartData] = useState<WeekRecord[]>([]);

  useEffect(() => {
    // Initial fetch from our DB
    setChartData([...getChartData()]);

    // Live update when score changes on the dashboard
    const handleUpdate = () => {
      setChartData([...getChartData()]);
    };

    window.addEventListener("balance_ai_db_updated", handleUpdate);

    return () => {
      window.removeEventListener("balance_ai_db_updated", handleUpdate);
    };
  }, []);

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
        <div className="flex h-40 items-end justify-between gap-2 pt-4">
          {/* ✅ Now mapping over live chartData instead of static week */}
          {chartData.map((w) => {
            const val = w.v ?? 0;
            return (
              <div
                key={w.d}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="flex h-full w-full items-end justify-center">
                  <div
                    className="w-full rounded-t-xl transition-all duration-500"
                    style={{
                      height: val > 0 ? `${Math.min(100, Math.max(6, val))}%` : "4px",
                      background:
                        val === 0
                          ? "var(--muted)"
                          : val >= 85
                            ? "var(--danger)"
                            : val >= 65
                              ? "var(--warn)"
                              : "var(--safe)",
                    }}
                    aria-hidden
                  />
                </div>
                <span className="text-[11px] text-muted-foreground">{w.d}</span>
                <span className="sr-only">
                  {w.d}: {val}% load
                </span>
              </div>
            );
          })}
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
