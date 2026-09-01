import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, ShieldAlert, SlidersHorizontal, Play, Pause, RotateCcw, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { CheckInModal } from "@/components/CheckInModal";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { SymbioticAvatar, getMascotMood } from "@/components/SymbioticAvatar";
import { useAppState, type VectorKey } from "@/lib/app-state";
import { usePrefs } from "@/lib/prefs";

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

function toneFor(v: number) {
  if (v >= 85) return { color: "var(--danger)", text: "Overloaded" };
  if (v >= 65) return { color: "var(--warn)", text: "Warning" };
  return { color: "var(--safe)", text: "Safe" };
}

function Dashboard() {
  const { mode } = usePrefs();
  const {
    vectors,
    overallCapacity,
    recoveryModeActive,
    userProfile,
    contextInfo,
    earnFocusPoints,
    focusPoints,
  } = useAppState();

  const [checkInOpen, setCheckInOpen] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes reset timer
  const [completedReset, setCompletedReset] = useState(false);

  useEffect(() => {
    let interval: any;
    if (timerActive && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0) {
      setTimerActive(false);
      setCompletedReset(true);
    }
    return () => clearInterval(interval);
  }, [timerActive, secondsLeft]);

  const timerMin = Math.floor(secondsLeft / 60);
  const timerSec = secondsLeft % 60;

  return (
    <AppShell
      header={
        <header className="flex items-start justify-between gap-3 px-4 pt-6">
          <div>
            <p className="text-xs font-semibold text-muted-foreground">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
            <h1 className="mt-0.5 text-2xl font-bold tracking-tight">Hey, {userProfile.name.split(" ")[0]} 👋</h1>
            <span
              className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors"
              style={{
                borderColor: overallCapacity >= 85 ? "var(--danger)" : "var(--safe)",
                color: overallCapacity >= 85 ? "var(--danger)" : "var(--safe)",
                backgroundColor: `color-mix(in oklab, ${overallCapacity >= 85 ? "var(--danger)" : "var(--safe)"} 12%, transparent)`,
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: overallCapacity >= 85 ? "var(--danger)" : "var(--safe)" }}
              />
              {overallCapacity}% Capacity · {overallCapacity >= 85 ? "High Load Detected" : "Balanced"}
            </span>
          </div>
          <ThemeToggle />
        </header>
      }
    >
      {/* Symbiotic Companion Card */}
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

      {/* Single Action Directive (Recovery Mode) */}
      <GlassCard
        as="div"
        className={recoveryModeActive ? "border-2 border-[var(--danger)]/50 bg-[color:var(--glass-bg)]" : ""}
      >
        <div className="flex items-center justify-between gap-3">
          <SectionTitle>Single Action Directive</SectionTitle>
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]"
            style={{
              backgroundColor: recoveryModeActive
                ? "color-mix(in oklab, var(--danger) 16%, transparent)"
                : "color-mix(in oklab, var(--safe) 16%, transparent)",
              color: recoveryModeActive ? "var(--danger)" : "var(--safe)",
            }}
          >
            {recoveryModeActive ? "Recovery Lock Active" : "Ready"}
          </span>
        </div>

        <p className="text-base font-semibold leading-relaxed text-foreground">
          {contextInfo.directive}
        </p>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Weather: {contextInfo.weather}</span>
          <span>GPS: {contextInfo.gps}</span>
        </div>

        {/* 10-Minute Reset Interactive Timer */}
        <div className="glass-panel mt-4 flex items-center justify-between p-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Recovery Timer
            </p>
            <p className="text-lg font-bold tabular-nums">
              {String(timerMin).padStart(2, "0")}:{String(timerSec).padStart(2, "0")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!completedReset ? (
              <button
                type="button"
                onClick={() => setTimerActive((a) => !a)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-warm)] text-white shadow-sm active:scale-95"
              >
                {timerActive ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-[var(--safe)]">
                <Check className="h-4 w-4" /> Reset Complete!
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setTimerActive(false);
                setSecondsLeft(600);
                setCompletedReset(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* ADHD Micro-action Card */}
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

      {/* 5-Vector Capacity Gauge */}
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
            const val = vectors[key];
            const tone = toneFor(val);
            return (
              <li key={key}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {val}% · <span style={{ color: tone.color }}>{tone.text}</span>
                  </span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full"
                  role="meter"
                  aria-valuenow={val}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${label} capacity level ${val} percent, ${tone.text}`}
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${val}%`, backgroundColor: tone.color }}
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
