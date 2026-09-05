import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, SlidersHorizontal } from "lucide-react";
import { useState, useEffect } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { CheckInModal } from "@/components/CheckInModal";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { SymbioticAvatar, getMascotMood } from "@/components/SymbioticAvatar";
import { useAppState, type VectorKey } from "@/lib/app-state";
import { usePrefs } from "@/lib/prefs";
import { TaskOffloader } from "../components/TaskOffLoader";
import { upsertTodayScore } from "@/lib/metrics-db";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BalanceAI — Student Burnout & Workload Companion" },
      {
        name: "description",
        content:
          "BalanceAI tracks your mental, time, physical, social and errand capacity and rebalances your week before burnout hits.",
      },
      { property: "og:title", content: "BalanceAI — Student Burnout Companion" },
      {
        property: "og:description",
        content:
          "A symbiotic AI companion that watches your 5-vector capacity and protects your week from overload.",
      },
    ],
  }),
  component: Dashboard,
});

const vectorDetails: { key: VectorKey; label: string }[] = [
  { key: "mental", label: "Mental" },
  { key: "time", label: "Time" },
  { key: "physical", label: "Physical" },
  { key: "social", label: "Social" },
  { key: "errands", label: "Errands" },
];

function toneForLevel(level: number) {
  if (level >= 5) return { color: "var(--danger)", text: "Critical" };
  if (level === 4) return { color: "#ff863a", text: "Heavy" };
  if (level === 3) return { color: "#eab308", text: "Moderate" };
  if (level === 2) return { color: "var(--safe)", text: "Light" };
  return { color: "#3dcd00", text: "Minimal" };
}

// Universal Score 5-Tier Condition
function getCapacityStatus(score: number) {
  if (score >= 85) {
    return { label: "High Load, High Pressure", color: "var(--danger)" };
  } else if (score >= 70) {
    return { label: "Feeling The Stress", color: "#ff863a" };
  } else if (score >= 45) {
    return { label: "Focused", color: "#eab308" };
  } else if (score >= 30) {
    return { label: "Light Stress", color: "var(--safe)" };
  } else {
    return { label: "Minimal Stress", color: "#3dcd00" };
  }
}

function Dashboard() {
  const { mode } = usePrefs();
  const {
    vectors,
    overallCapacity,
    userProfile,
    earnFocusPoints,
    focusPoints,
  } = useAppState();

  const [checkInOpen, setCheckInOpen] = useState(false);

  useEffect(() => {
    upsertTodayScore(overallCapacity);
  }, [overallCapacity]);

  const status = getCapacityStatus(overallCapacity);

  return (
    <AppShell
      header={
        <header className="flex items-start justify-between gap-3 px-4 pt-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight">Hey, {userProfile.name.split(" ")[0]} 👋</h1>
            <span
              className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
              style={{
                borderColor: status.color,
                color: status.color,
                backgroundColor: `color-mix(in oklab, ${status.color} 12%, transparent)`,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: status.color }}
              />
              {overallCapacity}% Overall Stress · {status.label}
            </span>
          </div>
          <ThemeToggle />
        </header>
      }
    >
      {/* 1. Symbiotic Companion Card */}
      <GlassCard className="text-center">
        <SymbioticAvatar capacity={overallCapacity} size="md" className="mx-auto" />
        <div className="glass-panel mt-4 rounded-[20px] p-4 text-left">
          <p className="text-sm leading-relaxed">
            {getMascotMood(overallCapacity).quote}
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              to="/chat"
              className="glow-accent inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-accent)] px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" /> Open AI Chat
            </Link>
            <Link
              to="/balancer"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-border px-4 text-sm font-medium text-foreground"
            >
              Rebalance
            </Link>
          </div>
        </div>
      </GlassCard>

      {/* 2. Task Offloader */}
      <div className="pt-1">
        <TaskOffloader />
      </div>

      {/* 3. ADHD Micro-action Card */}
      {mode === "adhd" && (
        <GlassCard className="border-2 border-[var(--violet)]/40" as="div">
          <div className="flex items-center justify-between">
            <SectionTitle>ADHD Micro-Step</SectionTitle>
            <span className="rounded-full bg-[var(--violet)]/20 px-2 py-0.5 text-xs font-bold text-[var(--violet)]">
              ⚡ {focusPoints} Focus Points
            </span>
          </div>
          <p className="text-base font-semibold">Open your notes and write 2 lines.</p>
          <p className="mt-1 text-xs text-muted-foreground">That’s it. 3 minutes only.</p>
          <button
            type="button"
            onClick={() => earnFocusPoints(10)}
            className="mt-4 min-h-[44px] w-full rounded-2xl bg-[image:var(--gradient-warm)] text-sm font-bold text-primary-foreground active:scale-95 transition-transform"
          >
            Start micro-step · Earn +10 focus points 🎉
          </button>
        </GlassCard>
      )}

      {/* 4. 5-Vector Capacity Gauge (1-5 Scale) */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <SectionTitle>5-Vector Capacity Gauge</SectionTitle>
          <button
            type="button"
            onClick={() => setCheckInOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground transition-colors hover:border-accent"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" /> 5s Check-In
          </button>
        </div>

        <ul className="mt-4 space-y-4">
          {vectorDetails.map(({ key, label }) => {
            const rawVal = vectors[key];
            const level = rawVal <= 5 ? rawVal : Math.min(5, Math.max(1, Math.ceil(rawVal / 20)));
            const tone = toneForLevel(level);
            const percentage = (level / 5) * 100;

            return (
              <li key={key}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="tabular-nums text-muted-foreground text-xs">
                    <strong className="text-foreground">{level}/5</strong> ·{" "}
                    <span style={{ color: tone.color }}>{tone.text}</span>
                  </span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full"
                  role="meter"
                  aria-valuenow={level}
                  aria-valuemin={1}
                  aria-valuemax={5}
                  aria-label={`${label} capacity level ${level} out of 5, ${tone.text}`}
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${percentage}%`, backgroundColor: tone.color }}
                  />
                </div>
              </li>
            );
          })}
        </ul>

        <Link
          to="/balancer"
          className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-accent-foreground"
        >
          Open Autonomous Capacity Shield <ArrowRight className="h-4 w-4" />
        </Link>
      </GlassCard>

      <CheckInModal open={checkInOpen} onClose={() => setCheckInOpen(false)} />
    </AppShell>
  );
}