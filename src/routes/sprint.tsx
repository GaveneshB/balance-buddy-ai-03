import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Headphones,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
  Wand2,
  HelpCircle,
  Plus,
  Flame,
  Check,
  Zap,
  Coffee,
  CloudRain,
  Radio,
  X,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { SymbioticAvatar } from "@/components/SymbioticAvatar";
import { GlassCard, SectionTitle } from "@/components/Glass";
import { ThemeToggle } from "@/components/AppShell";
import { ambientAudio, type SoundscapeType } from "@/lib/ambient-audio";
import {
  deconstructTaskAI,
  downsizeStepAI,
  type MicroStep,
} from "@/lib/ai-chat";
import { useAppState, type TaskItem } from "@/lib/app-state";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sprint")({
  head: () => ({
    meta: [
      { title: "AI Body-Doubling & Micro-Sprint Room | BalanceAI" },
      {
        name: "description",
        content:
          "Work alongside your Symbiotic AI Companion with ambient focus soundscapes, AI-deconstructed micro-steps, and ADHD paralysis un-sticking tools.",
      },
    ],
  }),
  component: SprintRoomScreen,
});

export function SprintRoomScreen() {
  const router = useRouter();
  const { mode } = usePrefs();
  const {
    clockedInTask,
    tasks,
    setClockedInTask,
    completeTask,
    earnFocusPoints,
    focusPoints,
    overallCapacity,
  } = useAppState();

  // Active task for this sprint session
  const activeTask: TaskItem | null =
    clockedInTask ?? tasks[0] ?? null;

  const deconstructAI = useServerFn(deconstructTaskAI);
  const downsizeAI = useServerFn(downsizeStepAI);

  // Micro-steps state
  const [steps, setSteps] = useState<MicroStep[]>([
    {
      id: "step-1",
      title: activeTask
        ? `Open workspace & inspect required criteria for ${activeTask.title}`
        : "Open workspace and review assignment criteria",
      minutes: 10,
      completed: false,
    },
    {
      id: "step-2",
      title: "Set up project notes and draft a 3-point outline",
      minutes: 15,
      completed: false,
    },
    {
      id: "step-3",
      title: "Implement the primary core section or main problem",
      minutes: 20,
      completed: false,
    },
    {
      id: "step-4",
      title: "Verify test cases, format solution, and perform cleanup",
      minutes: 15,
      completed: false,
    },
  ]);

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isDeconstructing, setIsDeconstructing] = useState(false);
  const [newStepText, setNewStepText] = useState("");
  const [showAddStep, setShowAddStep] = useState(false);

  // Timer state
  const [selectedDuration, setSelectedDuration] = useState<number>(15 * 60); // 15 mins default
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Soundscape state
  const [activeSound, setActiveSound] = useState<SoundscapeType>("off");
  const [volume, setVolume] = useState<number>(0.5);
  const [isMuted, setIsMuted] = useState(false);

  // Panic / Un-stick modal state
  const [isRescueOpen, setIsRescueOpen] = useState(false);
  const [isDownsizing, setIsDownsizing] = useState(false);
  const [boxBreathingActive, setBoxBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  const [breathCount, setBreathCount] = useState(4);

  // Completion toast / banner
  const [celebrationMsg, setCelebrationMsg] = useState<string | null>(null);

  // Soundscape handler
  function handleSelectSoundscape(type: SoundscapeType) {
    setActiveSound(type);
    ambientAudio.playSoundscape(type);
  }

  function handleVolumeChange(newVol: number) {
    setVolume(newVol);
    ambientAudio.setVolume(newVol);
    if (isMuted && newVol > 0) {
      setIsMuted(false);
    }
  }

  function toggleMute() {
    if (isMuted) {
      ambientAudio.setVolume(volume);
      setIsMuted(false);
    } else {
      ambientAudio.setVolume(0);
      setIsMuted(true);
    }
  }

  // Timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            ambientAudio.playCelebrationChime();
            setCelebrationMsg("Micro-Sprint complete! Take a 2-min stretch.");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, timeLeft]);

  // Box Breathing cycle
  useEffect(() => {
    if (!boxBreathingActive) return;
    const phases: Array<"Inhale" | "Hold" | "Exhale" | "Rest"> = ["Inhale", "Hold", "Exhale", "Rest"];
    let phaseIdx = 0;
    let count = 4;

    const interval = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        phaseIdx = (phaseIdx + 1) % phases.length;
        setBreathPhase(phases[phaseIdx]!);
        count = 4;
      }
      setBreathCount(count);
    }, 1000);

    return () => clearInterval(interval);
  }, [boxBreathingActive]);

  // AI Task Deconstruction
  async function handleDeconstructWithAI() {
    if (!activeTask) return;
    setIsDeconstructing(true);
    try {
      const res = await deconstructAI({
        data: {
          taskTitle: activeTask.title,
          course: activeTask.course,
          hours: activeTask.hoursNum,
        },
      });
      if (res.steps && res.steps.length > 0) {
        setSteps(res.steps);
        setActiveStepIndex(0);
        const firstMinutes = res.steps[0]?.minutes ?? 15;
        setSelectedDuration(firstMinutes * 60);
        setTimeLeft(firstMinutes * 60);
        setIsTimerRunning(false);
        ambientAudio.playCelebrationChime();
        setCelebrationMsg("AI generated 4 frictionless micro-steps!");
      }
    } catch {
      setCelebrationMsg("Loaded smart offline micro-steps.");
    } finally {
      setIsDeconstructing(false);
    }
  }

  // Toggle micro-step completion
  function handleToggleStep(index: number) {
    const next = [...steps];
    const target = next[index];
    if (!target) return;

    const willBeCompleted = !target.completed;
    target.completed = willBeCompleted;
    setSteps(next);

    if (willBeCompleted) {
      ambientAudio.playCelebrationChime();
      earnFocusPoints(15);
      setCelebrationMsg(`Step checked off! +15 Focus Points 🎉`);

      // Advance to next uncompleted step
      const nextIncomplete = next.findIndex((s, i) => i > index && !s.completed);
      if (nextIncomplete !== -1) {
        setActiveStepIndex(nextIncomplete);
        const mins = next[nextIncomplete]?.minutes ?? 15;
        setSelectedDuration(mins * 60);
        setTimeLeft(mins * 60);
      } else {
        // All steps complete!
        if (activeTask) {
          completeTask(activeTask.id);
          setCelebrationMsg(`🏆 All micro-steps complete! ${activeTask.title} conquered!`);
        }
      }
    }
  }

  // Downsize step for ADHD paralysis
  async function handleDownsizeStep() {
    const currentStep = steps[activeStepIndex];
    if (!currentStep) return;

    setIsDownsizing(true);
    try {
      const res = await downsizeAI({
        data: { stepTitle: currentStep.title },
      });

      const next = [...steps];
      if (next[activeStepIndex]) {
        next[activeStepIndex] = {
          ...currentStep,
          title: `⚡ 2-min starter: ${res.downsizedTitle}`,
          minutes: 2,
        };
        setSteps(next);
        setSelectedDuration(2 * 60);
        setTimeLeft(2 * 60);
        setIsTimerRunning(true);
        setIsRescueOpen(false);
        setCelebrationMsg("Downsized to an effortless 2-minute starter! Timer started.");
      }
    } catch {
      const next = [...steps];
      if (next[activeStepIndex]) {
        next[activeStepIndex] = {
          ...currentStep,
          title: `⚡ 2-min starter: Open workspace and write just 1 sentence`,
          minutes: 2,
        };
        setSteps(next);
        setSelectedDuration(2 * 60);
        setTimeLeft(2 * 60);
        setIsTimerRunning(true);
        setIsRescueOpen(false);
      }
    } finally {
      setIsDownsizing(false);
    }
  }

  function handleAddCustomStep() {
    if (!newStepText.trim()) return;
    const newStep: MicroStep = {
      id: `custom-${Date.now()}`,
      title: newStepText.trim(),
      minutes: 15,
      completed: false,
    };
    setSteps((prev) => [...prev, newStep]);
    setNewStepText("");
    setShowAddStep(false);
  }

  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;
  const timerMin = Math.floor(timeLeft / 60);
  const timerSec = timeLeft % 60;
  const timerPercent = selectedDuration > 0 ? ((selectedDuration - timeLeft) / selectedDuration) * 100 : 0;

  // Mascot dynamic body-doubling speech
  const companionMessage = useMemo(() => {
    if (completedCount === steps.length && steps.length > 0) {
      return "“Incredible momentum! You deconstructed the mountain and conquered every single step!”";
    }
    if (isTimerRunning) {
      return `“I’m sitting right here with you, Dhanesh. Keep your momentum on step ${activeStepIndex + 1}.”`;
    }
    if (completedCount > 0) {
      return `“Awesome work! You already knocked out ${completedCount} micro-step${completedCount > 1 ? "s" : ""}. Ready for the next one?”`;
    }
    return "“Big assignments cause paralysis when tackled all at once. Let’s do just one 10-minute micro-step together.”";
  }, [completedCount, steps.length, isTimerRunning, activeStepIndex]);

  return (
    <div className="app-bg min-h-dvh">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden px-4 pb-12 pt-4">
        {/* Navigation Bar */}
        <header className="flex items-center justify-between gap-3 pb-3">
          <Link
            to="/"
            className="glass-panel flex h-10 w-10 items-center justify-center rounded-2xl text-foreground transition-transform active:scale-95"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5">
              <Radio className="h-3.5 w-3.5 animate-pulse text-[var(--teal)]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--teal)]">
                Body-Doubling Pod
              </span>
            </div>
            <h1 className="text-base font-bold text-foreground truncate max-w-[200px]">
              {activeTask ? activeTask.title : "Focus Sprint Room"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Celebration Toast */}
        {celebrationMsg && (
          <div className="glass-panel mb-3 flex items-center justify-between gap-2 border-[var(--teal)]/40 bg-[color:var(--teal)]/10 px-3.5 py-2 text-xs font-semibold text-foreground animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--teal)]" />
              <span>{celebrationMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setCelebrationMsg(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Section 1: Symbiotic Body-Double Pod */}
        <GlassCard className="relative overflow-hidden p-4 text-center">
          <div className="flex items-center justify-between pb-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-[var(--teal)]">
              <Radio className="h-3 w-3 animate-ping" /> Co-Presence Active
            </span>
            <span className="rounded-full bg-[var(--violet)]/15 px-2.5 py-0.5 text-[11px] font-bold text-[var(--violet)]">
              ⚡ {focusPoints} Focus Pts
            </span>
          </div>

          {/* Symbiotic Companion Avatar */}
          <div className="relative py-2">
            <SymbioticAvatar capacity={overallCapacity} size="md" className="mx-auto" />
            {isTimerRunning && mode !== "autism" && (
              <div className="absolute inset-x-0 bottom-1 flex justify-center">
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--glass-bg)] px-3 py-1 text-[11px] font-bold text-[var(--teal)] backdrop-blur-md border border-[var(--teal)]/30 shadow-sm animate-pulse">
                  <Flame className="h-3.5 w-3.5" /> Sprinting with you...
                </span>
              </div>
            )}
          </div>

          {/* Companion Speech Bubble */}
          <div className="glass-panel mt-2 rounded-[20px] p-3 text-left">
            <p className="text-xs font-medium leading-relaxed text-foreground italic">
              {companionMessage}
            </p>
          </div>
        </GlassCard>

        {/* Section 2: Sprint Timer & Micro-Cycles */}
        <GlassCard className="mt-3 p-4">
          <div className="flex items-center justify-between">
            <SectionTitle>Sprint Cycle</SectionTitle>
            <div className="flex gap-1.5">
              {[
                { label: "10m", secs: 10 * 60 },
                { label: "15m", secs: 15 * 60 },
                { label: "25m", secs: 25 * 60 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setSelectedDuration(preset.secs);
                    setTimeLeft(preset.secs);
                    setIsTimerRunning(false);
                  }}
                  className={cn(
                    "rounded-xl px-2.5 py-1 text-xs font-bold transition-all",
                    selectedDuration === preset.secs
                      ? "bg-[image:var(--gradient-accent)] text-primary-foreground shadow-sm"
                      : "border border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Timer Readout & Controls */}
          <div className="mt-4 flex flex-col items-center justify-center">
            <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-border/40 bg-[color:var(--glass-bg)] shadow-inner">
              {/* Progress Ring */}
              <svg className="absolute inset-0 h-full w-full -rotate-90">
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="stroke-transparent"
                  strokeWidth="6"
                  fill="none"
                />
                <circle
                  cx="72"
                  cy="72"
                  r="64"
                  className="transition-all duration-500 stroke-[var(--teal)]"
                  strokeWidth="6"
                  strokeDasharray="402"
                  strokeDashoffset={402 - (402 * timerPercent) / 100}
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>

              <div className="text-center z-10">
                <span className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                  {String(timerMin).padStart(2, "0")}:{String(timerSec).padStart(2, "0")}
                </span>
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                  {isTimerRunning ? "Focusing" : "Paused"}
                </p>
              </div>
            </div>

            {/* Play / Pause / Reset Action Row */}
            <div className="mt-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsTimerRunning((prev) => !prev)}
                className="glow-accent flex h-12 w-28 items-center justify-center gap-2 rounded-2xl bg-[image:var(--gradient-accent)] font-bold text-primary-foreground transition-transform active:scale-95 shadow-md"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="h-5 w-5" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" /> Focus
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimeLeft(selectedDuration);
                  setIsTimerRunning(false);
                }}
                className="glass-panel flex h-12 w-12 items-center justify-center rounded-2xl text-muted-foreground hover:text-foreground transition-transform active:scale-95"
                title="Reset timer"
              >
                <RotateCcw className="h-5 w-5" />
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Section 3: Ambient Focus Soundboard */}
        <GlassCard className="mt-3 p-4">
          <div className="flex items-center justify-between">
            <SectionTitle className="flex items-center gap-2">
              <Headphones className="h-4 w-4 text-[var(--violet)]" /> Ambient Soundscape
            </SectionTitle>
            <button
              type="button"
              onClick={toggleMute}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={isMuted ? "Unmute soundscape" : "Mute soundscape"}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-[var(--danger)]" /> : <Volume2 className="h-4 w-4" />}
            </button>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            Zero-latency soundscapes generated in real-time by the Web Audio synthesizer.
          </p>

          <div className="mt-3 grid grid-cols-4 gap-1.5">
            {[
              { id: "off", label: "Mute", icon: VolumeX },
              { id: "brown", label: "Brown", icon: Coffee, desc: "ADHD" },
              { id: "rain", label: "Rain", icon: CloudRain, desc: "Calm" },
              { id: "binaural", label: "432Hz", icon: Radio, desc: "Alpha" },
            ].map((sound) => (
              <button
                key={sound.id}
                type="button"
                onClick={() => handleSelectSoundscape(sound.id as SoundscapeType)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl p-2 text-xs font-semibold transition-all",
                  activeSound === sound.id
                    ? "bg-[image:var(--gradient-accent)] text-primary-foreground shadow-sm"
                    : "glass-panel text-muted-foreground hover:text-foreground",
                )}
              >
                <sound.icon className="h-4 w-4 mb-0.5" />
                <span>{sound.label}</span>
                {sound.desc && <span className="text-[9px] opacity-75">{sound.desc}</span>}
              </button>
            ))}
          </div>

          {activeSound !== "off" && (
            <div className="mt-3 flex items-center gap-2">
              <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-muted accent-[var(--violet)]"
                aria-label="Soundscape volume"
              />
              <span className="text-[11px] tabular-nums text-muted-foreground w-8 text-right">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          )}
        </GlassCard>

        {/* Section 4: AI Micro-Step Deconstructor */}
        <GlassCard className="mt-3 p-4">
          <div className="flex items-center justify-between">
            <div>
              <SectionTitle>Micro-Step Deconstructor</SectionTitle>
              <p className="text-xs text-muted-foreground">
                {completedCount} of {steps.length} completed ({progressPercent}%)
              </p>
            </div>

            <button
              type="button"
              disabled={isDeconstructing}
              onClick={handleDeconstructWithAI}
              className="glow-accent flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-warm)] px-3 py-1 text-xs font-bold text-primary-foreground transition-transform active:scale-95 disabled:opacity-50"
            >
              <Wand2 className={cn("h-3.5 w-3.5", isDeconstructing && "animate-spin")} />
              {isDeconstructing ? "Slicing..." : "AI Slicer"}
            </button>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-[image:var(--gradient-accent)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Checklist */}
          <ul className="mt-4 space-y-2.5">
            {steps.map((step, idx) => {
              const isActive = activeStepIndex === idx && !step.completed;
              return (
                <li
                  key={step.id}
                  className={cn(
                    "glass-panel flex items-start gap-3 rounded-2xl p-3 transition-all",
                    isActive && "border-2 border-[var(--violet)]/60 bg-[color:var(--violet)]/5 shadow-sm",
                    step.completed && "opacity-60 bg-[color:var(--glass-bg)]",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleStep(idx)}
                    aria-label={`Mark step ${idx + 1} complete`}
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-[var(--teal)] transition-colors"
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-5 w-5 text-[var(--teal)]" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Step {idx + 1}
                      </span>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        {step.minutes}m
                      </span>
                      {isActive && (
                        <span className="rounded-full bg-[var(--violet)]/20 px-2 py-0.2 text-[9px] font-bold text-[var(--violet)]">
                          Active Focus
                        </span>
                      )}
                    </div>

                    <p
                      className={cn(
                        "mt-1 text-sm font-semibold text-foreground",
                        step.completed && "line-through text-muted-foreground",
                      )}
                    >
                      {step.title}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Add custom step drawer toggle */}
          {!showAddStep ? (
            <button
              type="button"
              onClick={() => setShowAddStep(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-foreground hover:underline"
            >
              <Plus className="h-3.5 w-3.5" /> Add custom micro-step
            </button>
          ) : (
            <div className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={newStepText}
                onChange={(e) => setNewStepText(e.target.value)}
                placeholder="e.g. Write 2 summary bullet points..."
                className="flex-1 rounded-xl border border-border bg-transparent px-3 py-1.5 text-xs outline-none focus:border-accent"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddCustomStep();
                }}
              />
              <button
                type="button"
                onClick={handleAddCustomStep}
                className="rounded-xl bg-[image:var(--gradient-accent)] px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowAddStep(false)}
                className="rounded-xl border border-border px-2 py-1.5 text-xs text-muted-foreground"
              >
                Cancel
              </button>
            </div>
          )}
        </GlassCard>

        {/* Section 5: "I'm Paralyzed / Stuck" ADHD Emergency Un-Stick Button */}
        <div className="mt-4 pt-2">
          <button
            type="button"
            onClick={() => setIsRescueOpen(true)}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-[var(--violet)]/40 bg-[color:var(--glass-bg)] p-3 text-sm font-bold text-foreground hover:border-[var(--violet)] transition-all shadow-sm active:scale-[0.98]"
          >
            <Zap className="h-4 w-4 text-[var(--violet)]" />
            <span>I'm Stuck / Paralyzed (Emergency Un-Stick)</span>
          </button>
        </div>

        {/* Section 6: Return to Dashboard button */}
        <div className="mt-3 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            Finished with this sprint? Return to Dashboard
          </Link>
        </div>

        {/* ADHD Paralysis Rescue Modal */}
        {isRescueOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="glass-panel w-full max-w-sm rounded-[28px] border-2 border-[var(--violet)]/50 p-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--violet)]/20 text-[var(--violet)]">
                    <Zap className="h-4 w-4" />
                  </span>
                  <h2 className="text-base font-bold">Overcome Task Freeze</h2>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRescueOpen(false);
                    setBoxBreathingActive(false);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Task paralysis is an involuntary executive dysfunction response. You are not lazy; your nervous system is overwhelmed. Choose a compassionate reset:
              </p>

              {/* Option 1: AI Downsize Step */}
              <div className="mt-4 space-y-3">
                <div className="glass-panel rounded-2xl p-3.5 text-left border border-border">
                  <p className="text-xs font-bold text-foreground">
                    Option A: Downsize Next Step (2 Minutes Only)
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    BalanceAI will shrink this step into an effortless 120-second micro-action so small your brain can't resist starting.
                  </p>
                  <button
                    type="button"
                    disabled={isDownsizing}
                    onClick={handleDownsizeStep}
                    className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl bg-[image:var(--gradient-accent)] py-2 text-xs font-bold text-primary-foreground shadow-sm active:scale-95"
                  >
                    <Wand2 className={cn("h-3.5 w-3.5", isDownsizing && "animate-spin")} />
                    {isDownsizing ? "Downsizing..." : "Shrink to 2-Min Starter"}
                  </button>
                </div>

                {/* Option 2: 60-Second Guided Box Breathing */}
                <div className="glass-panel rounded-2xl p-3.5 text-left border border-border">
                  <p className="text-xs font-bold text-foreground">
                    Option B: 60-Second Box Breathing
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    4s Inhale · 4s Hold · 4s Exhale · 4s Rest. Deactivates your nervous system's freeze reflex.
                  </p>

                  {!boxBreathingActive ? (
                    <button
                      type="button"
                      onClick={() => setBoxBreathingActive(true)}
                      className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-xs font-bold text-foreground hover:bg-[color:var(--glass-bg)] active:scale-95"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-[var(--teal)]" />
                      Start 60s Breathing Orb
                    </button>
                  ) : (
                    <div className="mt-3 flex flex-col items-center justify-center py-2">
                      <div
                        className={cn(
                          "flex h-24 w-24 items-center justify-center rounded-full border-2 border-[var(--teal)] text-center transition-all duration-1000",
                          breathPhase === "Inhale" && "scale-125 bg-[var(--teal)]/20 shadow-[0_0_25px_var(--teal)]",
                          breathPhase === "Hold" && "scale-125 bg-[var(--teal)]/30",
                          breathPhase === "Exhale" && "scale-90 bg-transparent opacity-70",
                          breathPhase === "Rest" && "scale-90 opacity-50",
                        )}
                      >
                        <div>
                          <p className="text-xs font-extrabold text-[var(--teal)]">{breathPhase}</p>
                          <p className="text-lg font-extrabold tabular-nums">{breathCount}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setBoxBreathingActive(false)}
                        className="mt-3 text-[11px] font-semibold text-muted-foreground underline"
                      >
                        Stop breathing exercise
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
