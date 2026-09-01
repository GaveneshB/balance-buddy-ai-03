import { createFileRoute } from "@tanstack/react-router";
import { Check, Calendar } from "lucide-react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { useAppState, type VectorKey } from "@/lib/app-state";
import { usePrefs, type InterfaceMode } from "@/lib/prefs";
import { cn } from "@/lib/utils";

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

const baselineList: { key: VectorKey; label: string }[] = [
  { key: "mental", label: "Mental" },
  { key: "time", label: "Time" },
  { key: "physical", label: "Physical" },
  { key: "social", label: "Social" },
  { key: "errands", label: "Errands" },
];

export function Profile() {
  const { mode, setMode, theme, toggleTheme } = usePrefs();
  const { userProfile, calendarSynced, toggleCalendarSync, baselines, setBaseline, focusPoints } = useAppState();

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

      {/* Capacity Baselines */}
      <GlassCard>
        <SectionTitle>Personal Capacity Baselines</SectionTitle>
        <p className="text-xs text-muted-foreground mb-4">
          Adjust your personal tolerance threshold for each energy vector.
        </p>
        <div className="space-y-4">
          {baselineList.map(({ key, label }) => {
            const val = baselines[key];
            return (
              <div key={key}>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span>{label} Tolerance</span>
                  <span className="tabular-nums text-muted-foreground">{val}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) => setBaseline(key, Number(e.target.value))}
                  aria-label={`${label} baseline slider`}
                  className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--violet)]"
                  style={{ backgroundColor: "var(--muted)" }}
                />
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* App Preferences */}
      <GlassCard>
        <SectionTitle>App Preferences</SectionTitle>
        <div className="flex items-center justify-between border-b border-border py-3.5">
          <div>
            <p className="text-sm font-medium">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Deep slate glassmorphism palette.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === "dark"}
            aria-label="Dark mode toggle"
            onClick={toggleTheme}
            className={cn(
              "relative h-7 w-12 shrink-0 rounded-full transition-colors",
              theme === "dark" ? "bg-[image:var(--gradient-accent)]" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full bg-background transition-all",
                theme === "dark" ? "left-6" : "left-1",
              )}
            />
          </button>
        </div>

        <div className="flex items-center justify-between py-3.5">
          <div>
            <p className="text-sm font-medium">Proactive Recovery Interventions</p>
            <p className="text-xs text-muted-foreground">Auto-trigger Capacity Shield at 85%+ capacity.</p>
          </div>
          <span className="text-xs font-bold text-[var(--safe)]">Enabled</span>
        </div>
      </GlassCard>
    </AppShell>
  );
}
