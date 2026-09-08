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

const SCALE_LEVELS = [
  { value: 1, label: "Minimal", color: "#3dcd00" },
  { value: 2, label: "Light", color: "var(--safe)" },
  { value: 3, label: "Moderate", color: "#eab308" },
  { value: 4, label: "Heavy", color: "#ff863a" },
  { value: 5, label: "Critical", color: "var(--danger)" },
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
            <h2 className="mt-1 text-lg font-bold">Quick Rating (1 - 5)</h2>
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
            const rawVal = localVectors[key];
            // Normalize current value into 1-5 scale
            const currentLevel = rawVal <= 5 ? rawVal : Math.min(5, Math.max(1, Math.ceil(rawVal / 20)));
            const activeScale = SCALE_LEVELS.find((s) => s.value === currentLevel) ?? SCALE_LEVELS[0]!;

            return (
              <div key={key} className="glass-panel p-3">
                <div className="flex items-baseline justify-between text-xs font-semibold">
                  <span>{label}</span>
                  <span style={{ color: activeScale.color }}>
                    {activeScale.value}/5 · {activeScale.label}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{desc}</p>

                {/* 1 - 5 Linear Scale Buttons */}
                <div className="mt-3 grid grid-cols-5 gap-1.5">
                  {SCALE_LEVELS.map((level) => {
                    const isSelected = currentLevel === level.value;
                    return (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() =>
                          setLocalVectors((prev) => ({
                            ...prev,
                            // Saves 1-5 mapped to 20-100 percentage so everything stays compatible
                            [key]: level.value * 20,
                          }))
                        }
                        className={cn(
                          "flex flex-col items-center justify-center py-2 rounded-xl text-xs font-bold border transition-all active:scale-95",
                          isSelected
                            ? "border-transparent text-white shadow-sm"
                            : "border-border bg-card/40 text-muted-foreground hover:border-accent"
                        )}
                        style={
                          isSelected
                            ? { backgroundColor: level.color }
                            : undefined
                        }
                      >
                        <span>{level.value}</span>
                        <span className="text-[9px] font-normal opacity-85">
                          {level.label.slice(0, 3)}
                        </span>
                      </button>
                    );
                  })}
                </div>
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