import companion from "@/assets/companion.png";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export type MascotMood = "happy" | "balanced" | "focused" | "stressed" | "exhausted";

export function getMascotMood(capacity: number): {
  mood: MascotMood;
  label: string;
  emoji: string;
  color: string;
  quote: string;
} {
  if (capacity <= 45) {
    return {
      mood: "happy",
      label: "Ecstatic & Energized",
      emoji: "😄",
      color: "var(--safe)",
      quote: "“I’m feeling super energized! Let’s crush some goals today!”",
    };
  }
  if (capacity <= 65) {
    return {
      mood: "balanced",
      label: "Happy & Balanced",
      emoji: "😊",
      color: "var(--teal)",
      quote: "“Your capacity is nicely balanced. Smooth sailing ahead.”",
    };
  }
  if (capacity <= 84) {
    return {
      mood: "focused",
      label: "Focused & Busy",
      emoji: "😐",
      color: "var(--warn)",
      quote: "“Workload is picking up. I’m staying sharp and focused.”",
    };
  }
  if (capacity <= 89) {
    return {
      mood: "stressed",
      label: "Stressed & Overloaded",
      emoji: "😫",
      color: "var(--danger)",
      quote: "“Phew! Workload is getting way too high! Let’s rebalance soon!”",
    };
  }
  return {
    mood: "exhausted",
    label: "Exhausted / Burnout Lock",
    emoji: "😴",
    color: "var(--danger)",
    quote: "“Total overload! I’m completely slumped... step away for a reset!”",
  };
}

export function SymbioticAvatar({
  capacity,
  size = "md",
  className,
  showQuote = false,
}: {
  capacity: number;
  size?: "sm" | "md" | "lg";
  className?: string;
  showQuote?: boolean;
}) {
  const { mode } = usePrefs();
  const info = getMascotMood(capacity);

  const sizeClasses = {
    sm: "h-12 w-12 rounded-2xl",
    md: "h-40 w-40 rounded-[28px]",
    lg: "h-52 w-52 rounded-[32px]",
  }[size];

  const imgSizeClasses = {
    sm: "h-9 w-9",
    md: "h-32 w-32",
    lg: "h-40 w-40",
  }[size];

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center transition-all duration-500 overflow-hidden",
          sizeClasses,
        )}
        style={{
          background: `color-mix(in oklab, ${info.color} ${info.mood === "stressed" || info.mood === "exhausted" ? "24%" : "14%"}, transparent)`,
          boxShadow: `inset 0 0 45px -10px ${info.color}, 0 10px 30px -15px ${info.color}`,
        }}
      >
        {/* Dynamic ambient aura border */}
        {mode !== "autism" && (
          <div
            className={cn(
              "absolute inset-0 rounded-inherit opacity-40 transition-all duration-500",
              info.mood === "stressed"
                ? "animate-pulse"
                : info.mood === "happy" || info.mood === "balanced"
                  ? "float-soft"
                  : "",
            )}
            style={{
              border: `2px solid ${info.color}`,
            }}
          />
        )}

        {/* Base mascot image */}
        <img
          src={companion}
          alt={`BalanceAI mascot: ${info.label}`}
          width={768}
          height={768}
          className={cn(
            "object-contain transition-all duration-500",
            imgSizeClasses,
            info.mood === "happy" && mode === "normal" && "animate-bounce duration-1000",
            info.mood === "balanced" && mode === "normal" && "float-soft",
            info.mood === "focused" && "scale-100",
            info.mood === "stressed" && "rotate-[-4deg] scale-95 opacity-90 animate-pulse",
            info.mood === "exhausted" && "rotate-[-8deg] scale-90 opacity-80",
          )}
        />

        {/* Dynamic Facial Expressions & Particles Overlay */}
        {size !== "sm" && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Happy / Energetic Expression */}
            {info.mood === "happy" && (
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1 text-xs animate-ping opacity-75">
                ✨ 🌟 ✨
              </div>
            )}

            {/* Stressed Sweat Drops */}
            {info.mood === "stressed" && (
              <div className="absolute top-3 right-3 text-sm animate-bounce">
                💦
              </div>
            )}

            {/* Exhausted Sleep zZz particles */}
            {info.mood === "exhausted" && (
              <div className="absolute top-2 right-4 text-xs font-bold text-[var(--violet)] animate-pulse tracking-widest">
                z Z Z... 💤
              </div>
            )}
          </div>
        )}

        {/* Emotion Badge Pill */}
        {size !== "sm" && (
          <span
            className="absolute bottom-2.5 flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-md backdrop-blur-md transition-all duration-300"
            style={{ backgroundColor: info.color }}
          >
            <span>{info.emoji}</span>
            <span>{info.label}</span>
          </span>
        )}
      </div>

      {size === "sm" && (
        <span
          className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] shadow-sm"
          style={{ backgroundColor: info.color, color: "#fff" }}
          title={info.label}
        >
          {info.emoji}
        </span>
      )}

      {showQuote && (
        <p className="mt-3 text-xs text-center font-medium italic text-muted-foreground max-w-xs">
          {info.quote}
        </p>
      )}
    </div>
  );
}
