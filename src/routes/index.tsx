import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight } from "lucide-react";
import companion from "@/assets/companion.png";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

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

const vectors = [
  { label: "Mental", value: 90 },
  { label: "Time", value: 85 },
  { label: "Physical", value: 40 },
  { label: "Social", value: 75 },
  { label: "Errands", value: 30 },
];

function toneFor(v: number) {
  if (v >= 85) return { color: "var(--danger)", text: "Overloaded" };
  if (v >= 65) return { color: "var(--warn)", text: "Warning" };
  return { color: "var(--safe)", text: "Safe" };
}

function Dashboard() {
  const { mode } = usePrefs();
  const capacity = 88;

  return (
    <AppShell
      header={
        <header className="flex items-start justify-between gap-3 px-4 pt-6">
          <div>
            <p className="text-sm text-muted-foreground">Monday, 31 August</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight">Hey, Dhanesh 👋</h1>
            <span
              className="mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: "var(--danger)",
                color: "var(--danger)",
                backgroundColor: "color-mix(in oklab, var(--danger) 12%, transparent)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--danger)" }}
              />
              {capacity}% Capacity · High Load
            </span>
          </div>
          <ThemeToggle />
        </header>
      }
    >
      {/* Companion */}
      <GlassCard className="text-center">
        <div
          className="mx-auto flex h-44 w-44 items-center justify-center rounded-[24px]"
          style={{
            background: "color-mix(in oklab, var(--violet) 14%, transparent)",
            boxShadow: "inset 0 0 40px -10px var(--glow)",
          }}
        >
          <img
            src={companion}
            alt="Your BalanceAI companion, looking tired because your load is high"
            width={768}
            height={768}
            className={cn("h-36 w-36 object-contain", mode === "normal" && "float-soft")}
          />
        </div>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Companion state: Overwhelmed
        </p>
        <div className="glass-panel mt-4 rounded-[20px] p-4 text-left">
          <p className="text-sm leading-relaxed">
            “I noticed your workload is heavy today. Want me to rebalance your calendar?”
          </p>
          <div className="mt-3 flex gap-2">
            <Link
              to="/balancer"
              className="glow-accent inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-accent)] px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
            >
              <Sparkles className="h-4 w-4" /> Yes, rebalance
            </Link>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-border px-4 text-sm font-medium text-foreground"
            >
              Not now
            </button>
          </div>
        </div>
      </GlassCard>

      {mode === "adhd" && (
        <GlassCard className="border-2" as="div">
          <SectionTitle>One micro-step right now</SectionTitle>
          <p className="text-base font-semibold">Open your notes and write 2 lines.</p>
          <p className="mt-1 text-sm text-muted-foreground">That’s it. 3 minutes.</p>
          <button
            type="button"
            className="mt-4 min-h-[44px] w-full rounded-2xl bg-[image:var(--gradient-warm)] text-sm font-bold text-primary-foreground"
          >
            Start · earn +10 focus points 🎉
          </button>
        </GlassCard>
      )}

      {/* 5-vector */}
      <GlassCard>
        <SectionTitle>5-Vector Capacity</SectionTitle>
        <ul className="space-y-4">
          {vectors.map((v) => {
            const tone = toneFor(v.value);
            return (
              <li key={v.label}>
                <div className="mb-1.5 flex items-baseline justify-between text-sm">
                  <span className="font-medium">{v.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {v.value}% · <span style={{ color: tone.color }}>{tone.text}</span>
                  </span>
                </div>
                <div
                  className="h-2.5 w-full overflow-hidden rounded-full"
                  role="meter"
                  aria-valuenow={v.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${v.label} load ${v.value} percent, ${tone.text}`}
                  style={{ backgroundColor: "var(--muted)" }}
                >
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${v.value}%`, backgroundColor: tone.color }}
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
          Open Capacity Shield <ArrowRight className="h-4 w-4" />
        </Link>
      </GlassCard>
    </AppShell>
  );
}
