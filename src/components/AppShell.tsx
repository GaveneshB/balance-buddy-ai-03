import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Scale, Plus, BarChart3, User, Moon, Sun, MessageSquareText } from "lucide-react";
import type { ReactNode } from "react";
import { usePrefs } from "@/lib/prefs";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, toggleTheme } = usePrefs();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="glass-panel flex h-11 w-11 items-center justify-center rounded-2xl text-foreground transition-transform active:scale-95"
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/balancer", label: "Balance", icon: Scale },
  { to: "/chat", label: "Chat", icon: MessageSquareText },
  { to: "/insights", label: "Insights", icon: BarChart3 },
  { to: "/profile", label: "Profile", icon: User },
] as const;

function BottomNav() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const left = items.slice(0, 2);
  const right = items.slice(2);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-md px-4 pb-4"
    >
      <div className="glass-panel relative flex items-end justify-between gap-1 rounded-[24px] px-3 py-2">
        {left.map((i) => (
          <NavItem key={i.to} {...i} active={path === i.to} />
        ))}

        <div className="flex w-16 justify-center">
          <Link
            to="/chat"
            aria-label="Open the BalanceAI chat assistant"
            className="glow-accent -mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-[image:var(--gradient-accent)] text-primary-foreground transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>

        {right.map((i) => (
          <NavItem key={i.to} {...i} active={path === i.to} />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[44px] w-16 flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[11px] font-medium transition-colors",
        active ? "text-accent-foreground" : "text-muted-foreground",
      )}
    >
      <Icon className={cn("h-5 w-5", active && "drop-shadow-[0_0_8px_var(--glow)]")} />
      <span>{label}</span>
    </Link>
  );
}

export function AppShell({
  children,
  header,
}: {
  children: ReactNode;
  header?: ReactNode;
}) {
  return (
    <div className="app-bg min-h-dvh">
      <div className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-hidden">
        {header}
        <main className="flex-1 space-y-3 overflow-y-auto px-4 pb-32 pt-2 overscroll-contain scrollbar-thin">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
