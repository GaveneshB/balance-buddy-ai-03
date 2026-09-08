import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Plus, Undo2, Clock, Brain, X, CalendarDays, ShieldAlert, Sparkles, Radio } from "lucide-react";
import { useState } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { useAppState, type TaskItem, type TaskCategory } from "@/lib/app-state";
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
    ],
  }),
  component: TasksScreen,
});

type Filter = "all" | "mental" | "errands" | "offloaded";

const filters: { id: Filter; label: string }[] = [
  { id: "all", label: "All Tasks" },
  { id: "mental", label: "Academic" },
  { id: "errands", label: "Errands" },
  { id: "offloaded", label: "Deferred / Offloaded" },
];

const categoryImpacts: { id: TaskCategory; label: string; baseImpact: number }[] = [
  { id: "mental", label: "Mental / Academic", baseImpact: 12 },
  { id: "physical", label: "Physical", baseImpact: 6 },
  { id: "social", label: "Social", baseImpact: 7 },
  { id: "errands", label: "Errands", baseImpact: 4 },
];

function TaskCard({
  task,
  muted,
  onUndo,
  onSprint,
}: {
  task: TaskItem;
  muted?: boolean | undefined;
  onUndo?: (() => void) | undefined;
  onSprint?: (() => void) | undefined;
}) {
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
            {muted ? `Deferred → ${task.due}` : `Due: ${task.due}`}
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
            <Brain className="h-3.5 w-3.5" /> {task.weight}% load weight
          </span>
        </div>
      </div>
      {onSprint && !muted && (
        <button
          type="button"
          onClick={onSprint}
          title="Launch Micro-Sprint with Companion"
          className="flex h-10 items-center gap-1 shrink-0 rounded-xl bg-[image:var(--gradient-warm)] px-2.5 text-xs font-bold text-primary-foreground shadow-sm transition-transform active:scale-95"
        >
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span>Sprint</span>
        </button>
      )}
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

export function TasksScreen() {
  const router = useRouter();
  const {
    tasks,
    offloadedTasks,
    clockedInTask,
    setClockedInTask,
    overallCapacity,
    isRecoveryLocked,
    recoveryMinutesLeft,
    addTask,
    undoDeferral,
  } = useAppState();

  const [filter, setFilter] = useState<Filter>("all");
  const [openDrawer, setOpenDrawer] = useState(false);

  // New task drawer state
  const [newTitle, setNewTitle] = useState("");
  const [newCourse, setNewCourse] = useState("");
  const [newDue, setNewDue] = useState("In 2 days");
  const [newCat, setNewCat] = useState<TaskCategory>("mental");
  const [newHours, setNewHours] = useState(4);

  const selectedCategoryImpact = categoryImpacts.find((c) => c.id === newCat)?.baseImpact ?? 8;
  const impactScore = Math.round((selectedCategoryImpact * (newHours / 4)) * 10) / 10;
  const projectedCapacity = Math.min(100, Math.round(overallCapacity + impactScore));

  const visibleUrgent = tasks.filter(
    (t) => filter === "all" || (filter !== "offloaded" && t.cat === filter),
  );
  const visibleOffloaded = offloadedTasks.filter(
    (t) => filter === "all" || filter === "offloaded" || t.cat === filter,
  );

  function handleSaveTask() {
    if (!newTitle.trim() || isRecoveryLocked) return;

    addTask({
      title: newTitle.trim(),
      course: newCourse.trim() || undefined,
      due: newDue,
      hours: newHours,
      cat: newCat,
    });

    setNewTitle("");
    setNewCourse("");
    setOpenDrawer(false);
  }

  return (
    <AppShell
      header={
        <header className="px-4 pt-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Workload &amp; Tasks</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {tasks.length} active · {offloadedTasks.length} offloaded by AI
              </p>
            </div>
            <ThemeToggle />
          </div>

          {/* Dual View Interface Switcher */}
          <div className="glass-panel mt-4 grid grid-cols-2 gap-1 p-1">
            <Link
              to="/chat"
              className="min-h-[40px] rounded-[16px] px-3 text-center text-xs font-semibold leading-10 text-muted-foreground hover:text-foreground"
            >
              Chat Assistant View
            </Link>
            <span className="min-h-[40px] rounded-[16px] bg-[image:var(--gradient-accent)] px-3 text-center text-xs font-bold leading-10 text-primary-foreground shadow-sm">
              Visual Task Board
            </span>
          </div>

          {/* Clocked in Banner */}
          {clockedInTask && (
            <div className="glass-panel mt-3 flex items-center gap-3 px-3 py-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[color:var(--glass-bg)] text-accent-foreground">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Currently clocked in
                </p>
                <p className="truncate text-sm font-semibold text-foreground">
                  {clockedInTask.title} · Due {clockedInTask.due} · {clockedInTask.hours}
                </p>
              </div>
              <Link
                to="/sprint"
                className="glow-warm shrink-0 flex items-center gap-1 rounded-xl bg-[image:var(--gradient-warm)] px-2.5 py-1.5 text-xs font-bold text-primary-foreground shadow-sm active:scale-95"
              >
                <Radio className="h-3.5 w-3.5 animate-pulse" /> Focus Sprint
              </Link>
            </div>
          )}

          {/* Filter Pills */}
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
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
      {/* Forced Recovery Lock Banner */}
      {isRecoveryLocked && (
        <GlassCard as="div" className="border border-[var(--danger)]/50 bg-[color:var(--danger)]/10">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--danger)]" />
            <div>
              <p className="text-sm font-bold text-[var(--danger)]">Forced Recovery Window Active</p>
              <p className="mt-1 text-xs leading-relaxed text-foreground">
                Task creation is locked for {recoveryMinutesLeft} minute(s) to reduce decision fatigue. Step outside and let your mind rest.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Categorized Task Matrix: Urgent & High Impact */}
      {filter !== "offloaded" && (
        <GlassCard>
          <SectionTitle>Urgent &amp; High Impact</SectionTitle>
          {visibleUrgent.length ? (
            <ul className="space-y-3">
              {visibleUrgent.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onSprint={() => {
                    setClockedInTask(t);
                    router.navigate({ to: "/sprint" });
                  }}
                />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No urgent tasks in this filter.</p>
          )}
        </GlassCard>
      )}

      {/* Categorized Task Matrix: Auto-Grouped / Offloaded by AI */}
      <GlassCard>
        <SectionTitle>Auto-Grouped / Offloaded by AI</SectionTitle>
        {visibleOffloaded.length ? (
          <ul className="space-y-3">
            {visibleOffloaded.map((t) => (
              <TaskCard
                key={t.id}
                task={t}
                muted
                onUndo={() => undoDeferral(t.id)}
              />
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            Nothing offloaded right now — your week is balanced.
          </p>
        )}
      </GlassCard>

      {/* Floating Add Task Trigger */}
      <button
        type="button"
        aria-label="Add a task"
        disabled={isRecoveryLocked}
        onClick={() => !isRecoveryLocked && setOpenDrawer(true)}
        className={cn(
          "glow-accent fixed bottom-28 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] text-primary-foreground transition-transform active:scale-95",
          isRecoveryLocked && "cursor-not-allowed opacity-50",
        )}
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Manual Task Drawer with Real-Time Impact Indicator */}
      {openDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Add a new task"
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOpenDrawer(false)}
            className="absolute inset-0 bg-[oklch(0_0_0/50%)] backdrop-blur-sm"
          />
          <div className="glass-card relative m-0 w-full max-w-md space-y-4 rounded-b-none p-5 pb-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">New Task / Assignment</h2>
              <button
                type="button"
                onClick={() => setOpenDrawer(false)}
                aria-label="Close drawer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label htmlFor="task-title" className="text-xs font-semibold text-muted-foreground">
                Task / Assignment Title
              </label>
              <input
                id="task-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. CS301 Machine Learning Assignment"
                className="glass-panel mt-1.5 min-h-[44px] w-full px-3 text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="task-course" className="text-xs font-semibold text-muted-foreground">
                  Course Tag
                </label>
                <input
                  id="task-course"
                  value={newCourse}
                  onChange={(e) => setNewCourse(e.target.value)}
                  placeholder="CS301"
                  className="glass-panel mt-1.5 min-h-[44px] w-full px-3 text-sm outline-none"
                />
              </div>
              <div>
                <label htmlFor="task-due" className="text-xs font-semibold text-muted-foreground">
                  Deadline
                </label>
                <input
                  id="task-due"
                  value={newDue}
                  onChange={(e) => setNewDue(e.target.value)}
                  placeholder="Thursday 6pm"
                  className="glass-panel mt-1.5 min-h-[44px] w-full px-3 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground">Category</p>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {categoryImpacts.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setNewCat(c.id)}
                    aria-pressed={newCat === c.id}
                    className={cn(
                      "min-h-[38px] rounded-full border px-3 text-xs font-semibold transition-colors",
                      newCat === c.id
                        ? "border-transparent bg-[image:var(--gradient-accent)] text-primary-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                <span>Estimated Time</span>
                <span className="text-foreground font-bold">{newHours} Hours</span>
              </div>
              <input
                type="range"
                min={1}
                max={12}
                value={newHours}
                onChange={(e) => setNewHours(Number(e.target.value))}
                className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full accent-[var(--violet)]"
                style={{ backgroundColor: "var(--muted)" }}
              />
            </div>

            {/* Real-Time Impact Indicator Slider Bar */}
            <div
              className="glass-panel p-4"
              style={{
                backgroundColor: `color-mix(in oklab, ${projectedCapacity >= 85 ? "var(--danger)" : "var(--warn)"} 12%, var(--glass-bg))`,
              }}
            >
              <p className="text-sm font-medium">
                Adding this task increases Time &amp; Mental Load by{" "}
                <strong style={{ color: projectedCapacity >= 85 ? "var(--danger)" : "var(--warn)" }}>
                  +{impactScore}%
                </strong>
                .
              </p>
              <div
                className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full"
                role="meter"
                aria-valuenow={projectedCapacity}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Projected capacity after adding task: ${projectedCapacity} percent`}
                style={{ backgroundColor: "var(--muted)" }}
              >
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${projectedCapacity}%`,
                    background: projectedCapacity >= 85 ? "var(--danger)" : "var(--gradient-warm)",
                  }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Projected total capacity: {projectedCapacity}%
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSaveTask}
                disabled={isRecoveryLocked || !newTitle.trim()}
                className={cn(
                  "glow-accent min-h-[48px] w-full rounded-2xl bg-[image:var(--gradient-accent)] text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-60",
                )}
              >
                Save Task &amp; Clock In
              </button>

              <Link
                to="/chat"
                className="glass-panel flex min-h-[44px] items-center justify-center gap-1.5 text-xs font-semibold text-foreground"
              >
                <Sparkles className="h-4 w-4 text-[var(--violet)]" /> Ask AI to Auto-Schedule Instead
              </Link>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
