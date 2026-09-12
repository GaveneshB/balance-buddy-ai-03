import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Eraser,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Plus,
  Zap,
  MessageSquareOff,
  LoaderCircle,
  CheckCircle2,
  CalendarCheck,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard } from "@/components/Glass";
import { SymbioticAvatar } from "@/components/SymbioticAvatar";
import { askMultiAgentAI, type AgentId, type ChatMessage, type ChatMode } from "@/lib/ai-chat";
import { useAppState, type AiAction } from "@/lib/app-state";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "Central AI Command Chat | BalanceAI" },
      {
        name: "description",
        content:
          "Talk or speak to your BalanceAI companion: log assignments naturally, trigger autonomous workload rebalancing, and watch capacity update live.",
      },
      { property: "og:title", content: "Central AI Command Chat | BalanceAI" },
      {
        property: "og:description",
        content:
          "Single conversational input to log tasks, rebalance your week, and protect against burnout.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: ChatScreen,
});

type MessageItem = ChatMessage & {
  agent?: AgentId | undefined;
  actionExecuted?: {
    summary: string;
    actionType: string;
  } | undefined;
};

type TaskDraft = Extract<AiAction, { type: "PROPOSE_TASK" }>['payload'];

const quickChips = [
  {
    icon: Plus,
    label: "Add Assignment",
    prompt: "I just got a CS301 Machine Learning assignment due Thursday, high priority, takes 6 hours",
  },
  {
    icon: Zap,
    label: "Balance My Week",
    prompt: "Can you balance my day and offload non-urgent errands?",
  },
  {
    icon: Sparkles,
    label: "Draft Decline Text",
    prompt: "Generate a polite decline text for my social commitments tonight",
  },
];

export function ChatScreen() {
  const { overallCapacity, executeAiAction, clockedInTask, isRecoveryLocked, recoveryMinutesLeft } = useAppState();

  const [cleared, setCleared] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [chatMode, setChatMode] = useState<ChatMode>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("balanceai:chat-mode");
      if (saved === "both" || saved === "task" || saved === "wellbeing") return saved;
    }
    return "both";
  });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      role: "assistant",
      agent: "task",
      content:
        "Hey Dhanesh! I’m your Task Agent. Tell me about any assignments, deadlines, or projects, and I'll break them down into actionable micro-steps for you.",
    },
    {
      role: "assistant",
      agent: "wellbeing",
      content:
        "And I’m your Wellbeing Agent! I monitor your 5-vector capacity, energy levels, and stress to protect you from burnout. How are you feeling today?",
    },
  ]);

  const askAI = useServerFn(askMultiAgentAI);

  useEffect(() => {
    localStorage.setItem("balanceai:chat-mode", chatMode);
  }, [chatMode]);

  // Web Speech API Integration
  function toggleVoiceInput() {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in this browser environment.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setDraft(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = (e: any) => {
        console.error("Speech error", e);
        setIsListening(false);
        setError("Voice input could not detect speech. Please try typing.");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setError("Unable to access microphone.");
    }
  }

  async function submitCurrentMessage(nextValue?: string) {
    const typedValue = (nextValue ?? inputRef.current?.value ?? draft).trim();

    if (!typedValue || isSending) {
      if (!typedValue) {
        setError("Please type or speak a message before sending it to BalanceAI.");
      }
      return;
    }

    const userMessage: MessageItem = { role: "user", content: typedValue };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setIsSending(true);

    try {
      if (taskDraft && /^(yes|yep|yeah|looks good|perfect|approve|create it|add it|go ahead)/i.test(typedValue)) {
        if (isRecoveryLocked) {
          setError(`I can keep refining this draft, but task creation is locked for ${recoveryMinutesLeft} more minute(s).`);
        } else {
          const summary = executeAiAction({ type: "ADD_TASK", payload: taskDraft });
          setTaskDraft(null);
          setMessages([
            ...nextMessages,
            { role: "assistant", content: "Done — I used the breakdown you approved and added the task to your focus queue.", actionExecuted: { summary, actionType: "ADD_TASK" } },
          ]);
        }
        return;
      }

      const response = await askAI({
        data: {
          message: typedValue,
          history: nextMessages.map(({ role, content }) => ({ role, content })),
          mode: chatMode,
          taskDraft: taskDraft ?? undefined,
        },
      });

      const assistantMessages: MessageItem[] = response.responses.map((agentResponse) => {
        let actionExecutedSummary: string | undefined;
        let actionType: string | undefined;

        if (agentResponse.agent === "task" && agentResponse.action?.type === "PROPOSE_TASK") {
          setTaskDraft(agentResponse.action.payload);
        } else if (
          agentResponse.agent === "wellbeing" &&
          (agentResponse.action?.type === "UPDATE_GAUGE" || agentResponse.action?.type === "TRIGGER_RECOVERY")
        ) {
          actionExecutedSummary = executeAiAction(agentResponse.action);
          actionType = agentResponse.action.type;
        }

        return {
          role: "assistant",
          agent: agentResponse.agent,
          content: agentResponse.text,
          actionExecuted: actionExecutedSummary
            ? { summary: actionExecutedSummary, actionType: actionType || "ACTION" }
            : undefined,
        };
      });

      setMessages([
        ...nextMessages,
        ...assistantMessages,
      ]);
    } catch (caughtError) {
      const msg = caughtError instanceof Error ? caughtError.message : "The AI request failed.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
  }

  function approveTaskDraft() {
    if (!taskDraft) return;
    if (isRecoveryLocked) {
      setError(`I can keep refining this draft, but task creation is locked for ${recoveryMinutesLeft} more minute(s).`);
      return;
    }
    const summary = executeAiAction({ type: "ADD_TASK", payload: taskDraft });
    setTaskDraft(null);
    setMessages((current) => [
      ...current,
      { role: "assistant", content: "Done — your approved task breakdown is now saved with the task.", actionExecuted: { summary, actionType: "ADD_TASK" } },
    ]);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formValue = (new FormData(event.currentTarget).get("message") ?? "").toString();
    await submitCurrentMessage(formValue || inputRef.current?.value || draft);
  }

  return (
    <AppShell
      header={
      <header className="sticky top-0 z-30 px-4 pt-5 pb-3">
          <div className="glass-panel flex items-center gap-3 px-3 py-2.5">
            <SymbioticAvatar capacity={overallCapacity} size="sm" />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-sm font-bold tracking-tight">Central AI Command</h1>
              <span
                className="mt-0.5 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  borderColor: overallCapacity >= 85 ? "var(--danger)" : "var(--safe)",
                  color: overallCapacity >= 85 ? "var(--danger)" : "var(--safe)",
                  backgroundColor: `color-mix(in oklab, ${overallCapacity >= 85 ? "var(--danger)" : "var(--safe)"} 12%, transparent)`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: overallCapacity >= 85 ? "var(--danger)" : "var(--safe)" }}
                />
                Capacity: {overallCapacity}% · {overallCapacity >= 85 ? "High Load" : "Balanced"}
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
          <div className="mt-3 grid grid-cols-3 gap-1 rounded-2xl border border-border/70 bg-[color:var(--glass-bg)]/70 p-1">
            {(["both", "task", "wellbeing"] as ChatMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setChatMode(mode)}
                className={cn(
                  "min-h-[38px] rounded-xl px-2 text-[11px] font-bold transition-colors",
                  chatMode === mode
                    ? "bg-[image:var(--gradient-accent)] text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {mode === "both" ? "Both Agents" : mode === "task" ? "Task Agent" : "Wellbeing Agent"}
              </button>
            ))}
          </div>
        </header>
      }
    >
      {clockedInTask && (
        <div className="glass-panel flex items-center justify-between gap-3 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-2 truncate">
            <CalendarCheck className="h-4 w-4 shrink-0 text-accent-foreground" />
            <span className="truncate text-muted-foreground">
              Clocked in focus: <strong className="text-foreground">{clockedInTask.title}</strong> ({clockedInTask.hours})
            </span>
          </div>
          <span className="shrink-0 font-semibold text-[var(--safe)]">Active</span>
        </div>
      )}

      {cleared ? (
        <GlassCard className="flex flex-col items-center gap-3 py-10 text-center">
          <MessageSquareOff className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Chat cleared. Your conversation can be restored anytime.
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
          <div className="space-y-3.5">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={cn("flex flex-col", message.role === "user" ? "items-end" : "items-start")}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-[22px] px-4 py-3 text-sm leading-relaxed shadow-[0_12px_34px_-18px_var(--glow)]",
                    message.role === "user"
                      ? "rounded-br-md bg-[image:var(--gradient-accent)] text-primary-foreground"
                      : "rounded-bl-md border border-border/70 bg-[color:var(--glass-bg)]/80 text-foreground",
                  )}
                >
                  {message.agent && (
                    <p className={cn(
                      "mb-1 text-[10px] font-bold uppercase tracking-wider",
                      message.agent === "task" ? "text-[var(--violet)]" : "text-[var(--teal)]",
                    )}
                    >
                      {message.agent === "task" ? "Task Agent" : "Wellbeing Agent"}
                    </p>
                  )}
                  {message.content}
                </div>

                {/* Automated execution badge inside chat */}
                {message.actionExecuted && (
                  <div className="mt-2 max-w-[88%] rounded-2xl border border-[var(--safe)]/40 bg-[color:var(--safe)]/10 p-3 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-[var(--safe)]">
                      <CheckCircle2 className="h-4 w-4" /> Autonomous Execution Done
                    </div>
                    <p className="mt-1 leading-relaxed text-foreground">
                      {message.actionExecuted.summary}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {taskDraft && (
            <GlassCard className="border-[var(--violet)]/40 bg-[color:var(--violet)]/5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--violet)]">Task draft</p>
                  <h2 className="mt-1 text-base font-bold">{taskDraft.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {taskDraft.course} · Due {taskDraft.due} · {taskDraft.hours}h
                  </p>
                </div>
                <span className="rounded-full bg-[var(--violet)]/15 px-2 py-1 text-[10px] font-bold text-[var(--violet)]">
                  {taskDraft.microSteps.length} steps
                </span>
              </div>
              <ol className="mt-4 space-y-2">
                {taskDraft.microSteps.map((step, index) => (
                  <li key={step.id} className="flex gap-2 rounded-xl border border-border/60 px-3 py-2 text-xs">
                    <span className="font-bold text-[var(--violet)]">{index + 1}.</span>
                    <span className="flex-1">{step.title}</span>
                    <span className="shrink-0 text-muted-foreground">{step.minutes}m</span>
                  </li>
                ))}
              </ol>
              <p className="mt-3 text-xs text-muted-foreground">
                Tell me how you want to shape the breakdown—more or fewer steps, simpler actions, different time limits, or changes to any specific step. When it feels right, say “approve” or use the button.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={approveTaskDraft}
                  disabled={isRecoveryLocked}
                  className="flex-1 rounded-xl bg-[image:var(--gradient-accent)] px-3 py-2 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRecoveryLocked ? `Locked · ${recoveryMinutesLeft}m` : "Approve & Add Task"}
                </button>
                <button
                  type="button"
                  onClick={() => setTaskDraft(null)}
                  className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </GlassCard>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Central Input Floating Bar */}
      <div className="sticky bottom-0 z-20 mt-2 rounded-[22px] border border-border/70 bg-[color:var(--glass-bg)]/90 p-2.5 shadow-[0_-10px_25px_-20px_var(--glow)] backdrop-blur-xl">
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickChips.map(({ icon: Icon, label, prompt }) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setDraft(prompt);
                submitCurrentMessage(prompt);
              }}
              className="glass-panel flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-foreground hover:border-accent"
            >
              <Icon className="h-3.5 w-3.5" style={{ color: "var(--violet)" }} />
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="glass-panel flex items-center gap-2 px-2.5 py-2">
          <label htmlFor="chat-input" className="sr-only">
            Message BalanceAI Command Chat
          </label>
          <input
            ref={inputRef}
            id="chat-input"
            name="message"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              isListening
                ? "Listening... Speak now..."
                : "Type or speak assignment e.g. CS301 due Thursday 6h..."
            }
            className={cn(
              "min-h-[40px] min-w-0 flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground",
              isListening && "animate-pulse text-[var(--violet)] font-medium",
            )}
            disabled={isSending}
          />
          <button
            type="button"
            onClick={toggleVoiceInput}
            aria-label={isListening ? "Stop voice listening" : "Start voice input"}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl border border-border transition-colors",
              isListening
                ? "bg-[var(--danger)] text-white animate-pulse"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {isListening ? <MicOff className="h-4.5 w-4.5" /> : <Mic className="h-4.5 w-4.5" />}
          </button>
          <button
            type="submit"
            aria-label={isSending ? "Sending command" : "Send command"}
            disabled={isSending}
            className="glow-accent flex h-10 w-10 items-center justify-center rounded-xl bg-[image:var(--gradient-accent)] text-primary-foreground disabled:cursor-not-allowed disabled:opacity-70 active:scale-95"
          >
            {isSending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
