import { createFileRoute } from "@tanstack/react-router";
import {
  Eraser,
  Mic,
  Send,
  Sparkles,
  Plus,
  Zap,
  MessageSquareOff,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import companion from "@/assets/companion.png";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard } from "@/components/Glass";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "AI Command Chat | BalanceAI" },
      {
        name: "description",
        content:
          "Talk to your BalanceAI companion: log assignments by voice or text, watch your 5-vector capacity update live and approve a one-tap rebalance.",
      },
      { property: "og:title", content: "AI Command Chat | BalanceAI" },
      {
        property: "og:description",
        content:
          "Log tasks conversationally and let BalanceAI offload non-urgent errands before you burn out.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ChatScreen,
});

const gauge = [
  { label: "Mental", from: 82, to: 91 },
  { label: "Time", from: 78, to: 85 },
  { label: "Physical", from: 40, to: 40 },
  { label: "Social", from: 75, to: 75 },
  { label: "Errands", from: 30, to: 22 },
];

const priorities = [
  { title: "CS301 ML Assignment", meta: "Due Thu · 6h", tone: "var(--danger)", isNew: true },
  { title: "MATH210 Problem Set", meta: "Due Fri · 3h", tone: "var(--warn)" },
  { title: "Lab report draft", meta: "Due Sun · 2h", tone: "var(--safe)" },
  { title: "Reading: Ch. 7–8", meta: "No deadline · 1h", tone: "var(--safe)" },
];

const chips = [
  { icon: Plus, label: "Add Assignment" },
  { icon: Zap, label: "Rebalance Week" },
  { icon: Sparkles, label: "Draft Decline Text" },
];

function toneFor(v: number) {
  if (v >= 85) return "var(--danger)";
  if (v >= 65) return "var(--warn)";
  return "var(--safe)";
}

function ChatScreen() {
  const [cleared, setCleared] = useState(false);
  const [approved, setApproved] = useState(false);
  const [draft, setDraft] = useState("");

  return (
    <AppShell
      header={
        <header className="sticky top-0 z-30 px-4 pt-5 pb-3">
          <div className="glass-panel flex items-center gap-3 px-3 py-2.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              style={{
                background: "color-mix(in oklab, var(--violet) 18%, transparent)",
                boxShadow: "inset 0 0 20px -6px var(--glow)",
              }}
            >
              <img
                src={companion}
                alt="BalanceAI companion avatar"
                width={768}
                height={768}
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold tracking-tight">BalanceAI</h1>
              <span
                className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  borderColor: "var(--danger)",
                  color: "var(--danger)",
                  backgroundColor: "color-mix(in oklab, var(--danger) 12%, transparent)",
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: "var(--danger)" }}
                />
                Capacity: 88% · High Load
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCleared(true)}
              aria-label="Clear chat"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border text-muted-foreground transition-transform active:scale-95"
            >
              <Eraser className="h-4.5 w-4.5" />
            </button>
            <ThemeToggle />
          </div>
        </header>
      }
    >
      {cleared ? (
        <GlassCard className="flex flex-col items-center gap-3 py-10 text-center">
          <MessageSquareOff className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Chat cleared. Your capacity data is still saved.
          </p>
          <button
            type="button"
            onClick={() => setCleared(false)}
            className="min-h-[44px] rounded-2xl border border-border px-4 text-sm font-medium"
          >
            Restore conversation
          </button>
        </GlassCard>
      ) : (
        <div className="space-y-4 pb-3">
          <div className="flex justify-end">
            <div className="max-w-[86%] rounded-[22px] rounded-br-md bg-[image:var(--gradient-accent)] px-4 py-3 text-sm leading-relaxed text-primary-foreground shadow-[0_12px_34px_-18px_var(--glow)]">
              I just got a CS301 Machine Learning Assignment due this Thursday. It’s high
              priority and takes about 6 hours.
            </div>
          </div>

          <GlassCard className="space-y-4 p-4">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full"
                style={{ background: "color-mix(in oklab, var(--safe) 18%, transparent)" }}
              >
                <CheckCircle2 className="h-4 w-4" style={{ color: "var(--safe)" }} />
              </div>
              <span className="text-sm font-semibold text-foreground">
                Clocked in: CS301 ML Assignment (Due Thu, 6hrs)
              </span>
            </div>

            <div className="space-y-3 rounded-2xl bg-[color:var(--glass-bg)]/90 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Live capacity update
              </p>
              <ul className="space-y-3">
                {gauge.map((g) => (
                  <li key={g.label}>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-foreground">{g.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {g.from}% → <span style={{ color: toneFor(g.to) }} className="font-semibold">{g.to}%</span>
                      </span>
                    </div>
                    <div
                      className="h-2.5 w-full overflow-hidden rounded-full"
                      role="meter"
                      aria-valuenow={g.to}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${g.label} load now ${g.to} percent`}
                      style={{ backgroundColor: "var(--muted)" }}
                    >
                      <div
                        className="h-full rounded-full transition-[width] duration-700"
                        style={{ width: `${g.to}%`, backgroundColor: toneFor(g.to) }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Re-prioritised queue
              </p>
              <ol className="space-y-2">
                {priorities.map((p, i) => (
                  <li
                    key={p.title}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border border-border/70 bg-[color:var(--glass-bg)]/70 px-3 py-2.5",
                      p.isNew && "border-[var(--violet)]/60",
                    )}
                    style={p.isNew ? { boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--violet) 24%, transparent)" } : undefined}
                  >
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        backgroundColor: `color-mix(in oklab, ${p.tone} 18%, transparent)`,
                        color: p.tone,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{p.title}</span>
                      <span className="block text-xs text-muted-foreground">{p.meta}</span>
                    </span>
                    {p.isNew && (
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                        style={{
                          backgroundColor: "color-mix(in oklab, var(--violet) 18%, transparent)",
                          color: "var(--violet)",
                        }}
                      >
                        New
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "color-mix(in oklab, var(--danger) 38%, var(--border))",
                backgroundColor: "color-mix(in oklab, var(--danger) 8%, var(--glass-bg))",
              }}
            >
              <p className="text-sm leading-relaxed text-foreground">
                Your load is now at <strong>91%</strong>. I’ve automatically grouped 2
                non-urgent errands and suggested deferring them to <strong>Saturday</strong>.
              </p>
              <button
                type="button"
                onClick={() => setApproved(true)}
                disabled={approved}
                className={cn(
                  "mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]",
                  approved ? "opacity-80" : "bg-[image:var(--gradient-accent)]",
                )}
                style={approved ? { backgroundColor: "var(--safe)" } : undefined}
              >
                {approved ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Rebalanced · load down to 79%
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Approve Rebalance (1-Tap)
                  </>
                )}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      <div className="sticky bottom-0 z-20 mt-2 rounded-[22px] border border-border/70 bg-[color:var(--glass-bg)]/90 p-2 shadow-[0_-10px_25px_-20px_var(--glow)] backdrop-blur-xl">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {chips.map(({ icon: Icon, label }) => (
            <button
              key={label}
              type="button"
              onClick={() => setDraft(label)}
              className="glass-panel flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-foreground"
            >
              <Icon className="h-3.5 w-3.5" style={{ color: "var(--violet)" }} />
              {label}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDraft("");
          }}
          className="glass-panel flex items-center gap-2 px-2 py-2"
        >
          <label htmlFor="chat-input" className="sr-only">
            Message BalanceAI
          </label>
          <input
            id="chat-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Tell me what’s on your mind or type a new task..."
            className="min-h-[40px] min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            aria-label="Voice input"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border text-muted-foreground"
          >
            <Mic className="h-4.5 w-4.5" />
          </button>
          <button
            type="submit"
            aria-label="Send message"
            className="glow-accent flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-accent)] text-primary-foreground"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </AppShell>
  );
}
