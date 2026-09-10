import { createFileRoute } from "@tanstack/react-router";
import { Check, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { useAppState } from "@/lib/app-state";
import { usePrefs, type InterfaceMode } from "@/lib/prefs";
import { cn } from "@/lib/utils";
import { getChartData, type WeekRecord } from "@/lib/metrics-db";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Accessibility | BalanceAI" },
      {
        name: "description",
        content:
          "Switch between Normal, ADHD and Mild Autism interface modes, set capacity baselines and manage sync.",
      },
      { property: "og:title", content: "Profile & Accessibility | BalanceAI" },
      {
        property: "og:description",
        content: "Adapt BalanceAI to how your brain works: ADHD and Mild Autism modes.",
      },
    ],
  }),
  component: Profile,
});

const modes: { id: InterfaceMode; label: string; badge: string; copy: string }[] = [
  {
    id: "normal",
    label: "Normal",
    badge: "Default",
    copy: "Balanced visuals, ambient motion, floating companion glow, and standard layout.",
  },
  {
    id: "adhd",
    label: "ADHD Mode",
    badge: "Focus & Reward",
    copy: "Micro-action breakdowns, high-contrast action triggers, dopamine reward points, and reduced visual clutter.",
  },
  {
    id: "autism",
    label: "Mild Autism Mode",
    badge: "Low Stim",
    copy: "Muted pastel palette, zero sudden animations, structured grid layouts, and clear predictable labels.",
  },
];


export function Profile() {
  const { mode, setMode } = usePrefs();
  const { userProfile, calendarSynced, toggleCalendarSync, focusPoints } = useAppState();

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
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Profile &amp; Accessibility</h1>
            <p className="mt-1 text-xs text-muted-foreground">Tailor BalanceAI to how your brain works</p>
          </div>
          <ThemeToggle />
        </header>
      }
    >
      {/* User Information Card */}
      <GlassCard className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-primary-foreground shadow-md"
          style={{ background: "var(--gradient-accent)" }}
          aria-hidden
        >
          {userProfile.name.split(" ").map((n) => n[0]).join("")}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold">{userProfile.name}</p>
          <p className="text-sm text-muted-foreground">{userProfile.university} · Year 3 CS</p>
          <p className="truncate text-xs text-muted-foreground">{userProfile.email}</p>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={toggleCalendarSync}
              className="inline-flex items-center gap-1.5 text-xs font-semibold"
              style={{ color: calendarSynced ? "var(--safe)" : "var(--warn)" }}
            >
              <Calendar className="h-3.5 w-3.5" />
              {calendarSynced ? "🟢 Google Calendar Synced" : "🟡 Calendar Sync Paused"}
            </button>
            {mode === "adhd" && (
              <span className="rounded-full bg-[var(--violet)]/20 px-2 py-0.5 text-xs font-bold text-[var(--violet)]">
                ⚡ {focusPoints} Points
              </span>
            )}
          </div>
        </div>
      </GlassCard>

      {/* Neurodiversity & Accessibility Mode Switcher */}
      <GlassCard>
        <SectionTitle>UI Adaptation Selector (Neurodiversity Mode)</SectionTitle>
        <div role="radiogroup" aria-label="Interface mode selector" className="space-y-3 mt-3">
          {modes.map((m) => {
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setMode(m.id)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left transition-colors relative",
                  isSelected
                    ? "border-transparent bg-[image:var(--gradient-accent)] text-primary-foreground shadow-md"
                    : "border-border hover:border-accent",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold flex items-center gap-2">
                    {m.label}
                    {isSelected && <Check className="h-4 w-4" />}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {m.badge}
                  </span>
                </div>
                <p
                  className={cn(
                    "mt-2 text-xs leading-relaxed",
                    isSelected ? "opacity-95" : "text-muted-foreground",
                  )}
                >
                  {m.copy}
                </p>
              </button>
            );
          })}
        </div>
      </GlassCard>



      {/* Insights */}
      <GlassCard>
        <SectionTitle>Load this week</SectionTitle>
        <div className="flex h-40 items-end justify-between gap-2 pt-4">
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
