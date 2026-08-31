import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { usePrefs, type InterfaceMode } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Neurodiversity Settings | BalanceAI" },
      {
        name: "description",
        content:
          "Switch between Normal, ADHD and Mild Autism interface modes, set capacity baselines and manage nudges.",
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

const modes: { id: InterfaceMode; label: string; copy: string }[] = [
  {
    id: "normal",
    label: "Normal",
    copy: "Balanced visuals, ambient motion and full feedback.",
  },
  {
    id: "adhd",
    label: "ADHD Mode",
    copy: "Reduces task paralysis with micro-actions, high-contrast triggers and dopamine rewards.",
  },
  {
    id: "autism",
    label: "Mild Autism Mode",
    copy: "Muted colours, zero animation, predictable layouts and clear text labels.",
  },
];

const baselines = [
  { label: "Mental", v: 70 },
  { label: "Time", v: 65 },
  { label: "Physical", v: 50 },
  { label: "Social", v: 60 },
  { label: "Errands", v: 45 },
];

function Profile() {
  const { mode, setMode, theme, toggleTheme } = usePrefs();
  const [limits, setLimits] = useState(baselines);
  const [nudges, setNudges] = useState(true);

  return (
    <AppShell
      header={
        <header className="flex items-start justify-between gap-3 px-4 pt-6">
          <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
          <ThemeToggle />
        </header>
      }
    >
      <GlassCard className="flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-primary-foreground"
          style={{ background: "var(--gradient-accent)" }}
          aria-hidden
        >
          DK
        </div>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">Dhanesh Kumar</p>
          <p className="text-sm text-muted-foreground">Tech University · Year 3 CS</p>
          <p className="truncate text-xs text-muted-foreground">
            dhanesh.k@techuni.edu
          </p>
          <p className="mt-1 text-xs font-semibold" style={{ color: "var(--safe)" }}>
            🟢 Google Calendar Synced
          </p>
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle>Interface mode</SectionTitle>
        <div role="radiogroup" aria-label="Interface mode" className="space-y-3">
          {modes.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-colors",
                mode === m.id
                  ? "border-transparent bg-[image:var(--gradient-accent)] text-primary-foreground"
                  : "border-border",
              )}
            >
              <span className="text-sm font-bold">{m.label}</span>
              <span
                className={cn(
                  "mt-1 block text-xs leading-relaxed",
                  mode === m.id ? "opacity-90" : "text-muted-foreground",
                )}
              >
                {m.copy}
              </span>
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle>Capacity baselines</SectionTitle>
        <div className="space-y-5">
          {limits.map((b, i) => (
            <div key={b.label}>
              <label
                htmlFor={`limit-${b.label}`}
                className="mb-2 flex items-center justify-between text-sm font-medium"
              >
                {b.label} tolerance
                <span className="tabular-nums text-muted-foreground">{b.v}%</span>
              </label>
              <input
                id={`limit-${b.label}`}
                type="range"
                min={0}
                max={100}
                value={b.v}
                onChange={(e) =>
                  setLimits((prev) =>
                    prev.map((p, pi) =>
                      pi === i ? { ...p, v: Number(e.target.value) } : p,
                    ),
                  )
                }
                className="h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--violet)]"
                style={{ backgroundColor: "var(--muted)" }}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard>
        <SectionTitle>App preferences</SectionTitle>
        <Row
          label="Dark mode"
          hint="Deep slate background with soft glows."
          checked={theme === "dark"}
          onChange={toggleTheme}
        />
        <Row
          label="Allow proactive recovery nudges"
          hint="Gentle reminders when load climbs past your baseline."
          checked={nudges}
          onChange={() => setNudges((n) => !n)}
        />
      </GlassCard>
    </AppShell>
  );
}

function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-4 last:border-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={onChange}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          checked ? "bg-[image:var(--gradient-accent)]" : "bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-background transition-all",
            checked ? "left-6" : "left-1",
          )}
        />
      </button>
    </div>
  );
}
