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
import { useRef, useState } from "react";
import { AppShell, ThemeToggle } from "@/components/AppShell";
import { GlassCard } from "@/components/Glass";
import { SymbioticAvatar } from "@/components/SymbioticAvatar";
import { askBalanceAI, type ChatMessage } from "@/lib/ai-chat";
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
  actionExecuted?: {
    summary: string;
    actionType: string;
  };
};

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
  const { overallCapacity, executeAiAction, clockedInTask } = useAppState();

  const [cleared, setCleared] = useState(false);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      role: "assistant",
      content:
        "Hey Dhanesh! I’m connected to your 5-vector capacity engine. You can type or speak tasks naturally like 'I just got a CS301 ML assignment due Thursday, 6h' or tell me 'balance my day'. What’s on your mind?",
    },
  ]);

  const askAI = useServerFn(askBalanceAI);

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
      const response = await askAI({
        data: {
          message: typedValue,
          history: nextMessages.map(({ role, content }) => ({ role, content })),
        },
      });

      let actionExecutedSummary: string | undefined;
      let actionType: string | undefined;

      if (response.action) {
        actionExecutedSummary = executeAiAction(response.action);
        actionType = response.action.type;
      }

      setMessages([
        ...nextMessages,
        {
          role: "assistant",
          content: response.text,
          actionExecuted: actionExecutedSummary
            ? { summary: actionExecutedSummary, actionType: actionType || "ACTION" }
            : undefined,
        },
      ]);
    } catch (caughtError) {
      const msg = caughtError instanceof Error ? caughtError.message : "The AI request failed.";
      setError(msg);
    } finally {
      setIsSending(false);
    }
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
