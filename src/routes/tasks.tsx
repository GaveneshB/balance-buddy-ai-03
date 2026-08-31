import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus, Undo2, Clock, Brain, X, CalendarDays, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Workload & Tasks | BalanceAI" },
      {
        name: "description",
        content:
          "A capacity-aware task board: urgent assignments, AI-offloaded errands, and a live impact meter that shows what a new task costs you.",
      },
      { property: "og:title", content: "Workload & Tasks | BalanceAI" },
      {
        property: "og:description",
        content:
          "See urgent academic work, AI-deferred errands and the real-time capacity cost of every new task.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TasksScreen,
});

type Filter = "all" | "academic" | "errands" | "deferred";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All Tasks" },
  { id: "academic", label: "Academic" },
  { id: "errands", label: "Errands" },
  { id: "deferred", label: "Deferred / Offloaded" },
];

type Task = {
  title: string;
  course: string;
  due: string;
  hours: string;
  weight: number;
  cat: Exclude<Filter, "all" | "deferred">;
  tone: string;
};

const urgent: Task[] = [
  {
    title: "Machine Learning Assignment",
    course: "CS301",
    due: "2d 4h",
    hours: "6h",
    weight: 34,
    cat: "academic",
    tone: "var(--danger)",
  },
  {
    title: "Problem Set 5",
    course: "MATH210",
    due: "3d 9h",
    hours: "3h",
    weight: 18,
    cat: "academic",
    tone: "var(--warn)",
  },
  {
    title: "Renew student pass",
    course: "Errand",
    due: "1d 2h",
    hours: "30m",
    weight: 6,
    cat: "errands",
    tone: "var(--warn)",
  },
];

const offloaded: Task[] = [
  {
    title: "Grocery run",
    course: "Errand",
    due: "Sat",
    hours: "1h",
    weight: 5,
    cat: "errands",
    tone: "var(--muted-foreground)",
  },
  {
    title: "Club prep materials",
    course: "Social",
    due: "Sat",
    hours: "1h 30m",
    weight: 8,
    cat: "errands",
    tone: "var(--muted-foreground)",
  },
];

const categories = [
  { id: "mental", label: "Mental / Study", impact: 12 },
  { id: "physical", label: "Physical", impact: 6 },
  { id: "social", label: "Social", impact: 7 },
  { id: "errands", label: "Errands", impact: 4 },
] as const;

function TaskCard({ task, muted, onUndo }: { task: Task; muted?: boolean; onUndo?: () => void }) {
  return (
    <li
      className={cn("glass-panel flex items-start gap-3 p-4", muted && "opacity-70")}
      style={{ borderLeft: `3px solid ${task.tone}` }}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {task.course}
          </span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: `color-mix(in oklab, ${task.tone} 16%, transparent)`,
              color: task.tone,
            }}
          >
            {muted ? `Deferred → ${task.due}` : `Due in ${task.due}`}
          </span>
        </div>
        <p className={cn("mt-1 text-sm font-semibold", muted && "line-through decoration-1")}>
          {task.title}
        </p>
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {task.hours}
          </span>
          <span className="inline-flex items-center gap-1">
            <Brain className="h-3.5 w-3.5" /> {task.weight}% mental
          </span>
        </div>
      </div>
      {onUndo && (
        <button
          type="button"
          onClick={onUndo}
          aria-label={`Undo deferral of ${task.title}`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground transition-transform active:scale-95"
        >
          <Undo2 className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}

function TasksScreen() {
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState(false);
  const [restored, setRestored] = useState<string[]>([]);
  const [cat, setCat] = useState<(typeof categories)[number]["id"]>("mental");
  const [hours, setHours] = useState(4);
  const [now, setNow] = useState(Date.now());
  const [recoveryLockUntil] = useState(Date.now() + 15 * 60 * 1000);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const isRecoveryLocked = now < recoveryLockUntil;
  const recoveryMinutesLeft = Math.max(0, Math.ceil((recoveryLockUntil - now) / 60000));

  const impact = Math.round(
    (categories.find((c) => c.id === cat)?.impact ?? 8) * (hours / 4) * 10,
  ) / 10;

  const active = [...urgent, ...offloaded.filter((t) => restored.includes(t.title))];
  const visibleUrgent = active.filter(
    (t) => filter === "all" || (filter !== "deferred" && t.cat === filter),
  );
  const visibleOffloaded = offloaded.filter(
    (t) =>
      !restored.includes(t.title) &&
      (filter === "all" || filter === "deferred" || t.cat === filter),
  );

  return (
    <AppShell
      header={
        <header className="px-4 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workload &amp; Tasks</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {visibleUrgent.length} active · {visibleOffloaded.length} offloaded by AI
              </p>
            </div>
            <ThemeToggle />
          </div>

          <div className="glass-panel mt-4 grid grid-cols-2 gap-1 p-1">
            <Link
              to="/chat"
              className="min-h-[40px] rounded-[16px] px-3 text-center text-xs font-semibold leading-10 text-muted-foreground"
            >
              Chat Assistant View
            </Link>
            <span className="min-h-[40px] rounded-[16px] bg-[image:var(--gradient-accent)] px-3 text-center text-xs font-bold leading-10 text-primary-foreground">
              Visual Task Board
            </span>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition-colors",
                  filter === f.id
                    ? "border-transparent bg-[image:var(--gradient-accent)] text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>
      }
    >
      {isRecoveryLocked && (
        <GlassCard as="div" className="border border-[var(--danger)]/40">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-[var(--danger)]" />
            <div>
              <p className="text-sm font-semibold">Recovery mode is active</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add Task is locked for {recoveryMinutesLeft} minutes to lower decision fatigue.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {filter !== "deferred" && (
        <GlassCard>
          <SectionTitle>Urgent &amp; high impact</SectionTitle>
          {visibleUrgent.length ? (
            <ul className="space-y-3">
              {visibleUrgent.map((t) => (
                <TaskCard key={t.title} task={t} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nothing here in this filter.</p>
          )}
        </GlassCard>
      )}

      <GlassCard>
        <SectionTitle>Auto-grouped / offloaded by AI</SectionTitle>
        {visibleOffloaded.length ? (
          <ul className="space-y-3">
            {visibleOffloaded.map((t) => (
              <TaskCard
                key={t.title}
                task={t}
                muted
                onUndo={() => setRestored((r) => [...r, t.title])}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing deferred right now — your week is clear of pushed-back work.
          </p>
        )}
      </GlassCard>

      <button
        type="button"
        aria-label="Add a task"
        disabled={isRecoveryLocked}
        onClick={() => !isRecoveryLocked && setOpen(true)}
        className={cn(
          "glow-accent fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] text-primary-foreground transition-transform active:scale-95",
          isRecoveryLocked && "cursor-not-allowed opacity-50",
        )}
      >
        <Plus className="h-6 w-6" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Add a new task"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-[oklch(0_0_0/45%)] backdrop-blur-sm"
          />
          <div className="glass-card relative m-0 w-full max-w-md space-y-5 rounded-b-none p-5 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New task</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close drawer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label htmlFor="task-title" className="text-xs font-semibold text-muted-foreground">
                Task / assignment title
              </label>
              <input
                id="task-title"
                placeholder="e.g. CS301 ML Assignment"
                className="glass-panel mt-1.5 min-h-[44px] w-full px-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground">Category</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCat(c.id)}
                    aria-pressed={cat === c.id}
                    className={cn(
                      "min-h-[40px] rounded-full border px-3 text-xs font-semibold",
                      cat === c.id
                        ? "border-transparent bg-[image:var(--gradient-accent)] text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="task-due" className="text-xs font-semibold text-muted-foreground">
                  Deadline
                </label>
                <div className="glass-panel mt-1.5 flex min-h-[44px] items-center gap-2 px-3">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  <input
                    id="task-due"
                    type="date"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="task-hours" className="text-xs font-semibold text-muted-foreground">
                  Estimate: {hours}h
                </label>
                <input
                  id="task-hours"
                  type="range"
                  min={1}
                  max={12}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                  className="mt-4 w-full accent-[var(--violet)]"
                />
              </div>
            </div>

            <div
              className="glass-panel p-4"
              style={{
                backgroundColor: `color-mix(in oklab, ${impact > 10 ? "var(--danger)" : "var(--warn)"} 10%, var(--glass-bg))`,
              }}
            >
              <p className="text-sm font-medium">
                Adding this task will increase your Time &amp; Mental load by{" "}
                <strong style={{ color: impact > 10 ? "var(--danger)" : "var(--warn)" }}>
                  +{impact}%
                </strong>
                .
              </p>
              <div
                className="mt-2 h-2.5 w-full overflow-hidden rounded-full"
                role="meter"
                aria-valuenow={Math.min(100, 88 + impact)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Projected capacity after adding this task"
                style={{ backgroundColor: "var(--muted)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${Math.min(100, 88 + impact)}%`,
                    background: "var(--gradient-warm)",
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                disabled={isRecoveryLocked}
                onClick={() => setOpen(false)}
                className={cn(
                  "glow-accent min-h-[48px] w-full rounded-2xl bg-[image:var(--gradient-accent)] text-sm font-bold text-primary-foreground",
                  isRecoveryLocked && "cursor-not-allowed opacity-60",
                )}
              >
                {isRecoveryLocked ? "Recovery lock active" : "Save Task"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="glass-panel min-h-[48px] w-full text-sm font-semibold text-foreground"
              >
                Ask AI to Auto-Schedule Instead
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
