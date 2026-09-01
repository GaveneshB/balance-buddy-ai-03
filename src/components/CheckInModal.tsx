import { X, Check } from "lucide-react";
import { useState } from "react";
import { useAppState, type VectorKey, type VectorState } from "@/lib/app-state";
import { cn } from "@/lib/utils";

const vectorLabels: { key: VectorKey; label: string; desc: string }[] = [
  { key: "mental", label: "Mental Load", desc: "Exams, homework, focus strain" },
  { key: "time", label: "Time Pressure", desc: "Deadlines, tight schedules" },
  { key: "physical", label: "Physical Fatigue", desc: "Sleep debt, body energy" },
  { key: "social", label: "Social Commitments", desc: "Events, group chats, meetings" },
  { key: "errands", label: "Errands & Tasks", desc: "Groceries, chores, admin work" },
];

export function CheckInModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { vectors, setAllVectors } = useAppState();
  const [localVectors, setLocalVectors] = useState<VectorState>({ ...vectors });
  const [done, setDone] = useState(false);

  if (!open) return null;

  function handleSave() {
    setAllVectors(localVectors);
    setDone(true);
    setTimeout(() => {
      setDone(false);
      onClose();
    }, 800);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="5-second energy check-in"
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-[oklch(0_0_0/50%)] backdrop-blur-sm"
      />
      <div className="glass-card relative m-0 w-full max-w-md space-y-4 rounded-b-none p-5 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded-full bg-accent/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-foreground">
              5-Second Check-In
            </span>
            <h2 className="mt-1 text-lg font-bold">How are you feeling right now?</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 pt-1">
          {vectorLabels.map(({ key, label, desc }) => {
            const val = localVectors[key];
            const color =
              val >= 85 ? "var(--danger)" : val >= 65 ? "var(--warn)" : "var(--safe)";
            return (
              <div key={key} className="glass-panel p-3">
                <div className="flex items-baseline justify-between text-xs font-semibold">
                  <span>{label}</span>
                  <span style={{ color }}>{val}%</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) =>
                    setLocalVectors((prev) => ({
                      ...prev,
                      [key]: Number(e.target.value),
                    }))
                  }
                  aria-label={`${label} percentage slider`}
                  className="mt-2.5 h-2 w-full cursor-pointer appearance-none rounded-full"
                  style={{
                    backgroundColor: "var(--muted)",
                    accentColor: color,
                  }}
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          className={cn(
            "glow-accent flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-accent)] text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98]",
          )}
        >
          {done ? (
            <>
              <Check className="h-4 w-4" /> Vectors Updated!
            </>
          ) : (
            "Save Check-In"
          )}
        </button>
      </div>
    </div>
  );
}
