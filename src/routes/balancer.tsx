import { createFileRoute } from "@tanstack/react-router";
import { ShieldCheck, CalendarClock, MessageSquareQuote, Pencil, CheckCircle2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { useAppState } from "@/lib/app-state";

export const Route = createFileRoute("/balancer")({
  head: () => ({
    meta: [
      { title: "Capacity Shield — Autonomous Workload Balancer | BalanceAI" },
      {
        name: "description",
        content:
          "At 85%+ load BalanceAI defers non-urgent tasks and drafts polite declines so you can recover in one tap.",
      },
      { property: "og:title", content: "Capacity Shield | BalanceAI" },
      {
        property: "og:description",
        content: "Auto-defer tasks and send polite declines when your week is overloaded.",
      },
    ],
  }),
  component: Balancer,
});

export function Balancer() {
  const {
    overallCapacity,
    offloadedTasks,
    autoDeclineDraft,
    updateDeclineDraft,
    approveRebalance,
    rebalanced,
    undoDeferral,
  } = useAppState();

  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftInput, setDraftInput] = useState(autoDeclineDraft.text);

  const isHighLoad = overallCapacity >= 85;

  function handleSaveDraft() {
    updateDeclineDraft(draftInput);
    setIsEditingDraft(false);
  }

  return (
    <AppShell
      header={
        <header className="flex items-start justify-between gap-3 px-4 pt-6">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `color-mix(in oklab, ${isHighLoad ? "var(--danger)" : "var(--safe)"} 14%, transparent)`,
                color: isHighLoad ? "var(--danger)" : "var(--safe)",
              }}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {overallCapacity}% Load {isHighLoad ? "Intervention Triggered" : "Normal"}
            </span>
            <h1 className="mt-2 text-2xl font-bold leading-tight tracking-tight">
              Autonomous Workload Balancer
            </h1>
          </div>
          <ThemeToggle />
        </header>
      }
    >
      {/* Offloaded & Deferred Tasks */}
      <GlassCard>
        <SectionTitle>Auto-Grouped / Offloaded Tasks</SectionTitle>
        {offloadedTasks.length > 0 ? (
          <ul className="space-y-3">
            {offloadedTasks.map((o) => (
              <li key={o.id} className="glass-panel flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3 min-w-0">
                  <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-accent-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.course} · {o.hours}</p>
                    <p className="mt-1 text-xs font-semibold text-[var(--safe)]">
                      {o.due}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => undoDeferral(o.id)}
                  aria-label={`Undo deferral of ${o.title}`}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tasks deferred currently. Your schedule is optimized.
          </p>
        )}
      </GlassCard>

      {/* Auto-Decline Draft Template */}
      <GlassCard>
        <div className="flex items-center justify-between">
          <SectionTitle>Auto-decline draft template</SectionTitle>
          <button
            type="button"
            onClick={() => setIsEditingDraft((e) => !e)}
            className="flex items-center gap-1 text-xs font-semibold text-accent-foreground"
          >
            <Pencil className="h-3.5 w-3.5" /> {isEditingDraft ? "Cancel" : "Edit"}
          </button>
        </div>

        <div className="glass-panel mt-3 p-4">
          <MessageSquareQuote className="h-5 w-5 text-accent-foreground" />
          {isEditingDraft ? (
            <div className="mt-2 space-y-3">
              <textarea
                value={draftInput}
                onChange={(e) => setDraftInput(e.target.value)}
                className="w-full min-h-[90px] rounded-xl border border-border bg-transparent p-2.5 text-sm outline-none"
              />
              <button
                type="button"
                onClick={handleSaveDraft}
                className="min-h-[36px] rounded-xl bg-[image:var(--gradient-accent)] px-3 text-xs font-bold text-primary-foreground"
              >
                Save Template
              </button>
            </div>
          ) : (
            <p className="mt-2 text-sm italic leading-relaxed">
              “{autoDeclineDraft.text}”
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Recipient: {autoDeclineDraft.to}
          </p>
        </div>
      </GlassCard>

      {/* 1-Tap Execution */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => approveRebalance()}
          disabled={rebalanced && !isHighLoad}
          className="glow-accent min-h-[52px] w-full rounded-2xl bg-[image:var(--gradient-accent)] text-base font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:opacity-75"
        >
          {rebalanced ? (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Rebalanced ✓ Load now {overallCapacity}%
            </span>
          ) : (
            "Approve & Rebalance (1-Tap)"
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground" aria-live="polite">
          {rebalanced
            ? "Tasks deferred and decline message queued. Recovery window active."
            : "Nothing is changed until you approve."}
        </p>
      </div>
    </AppShell>
  );
}
