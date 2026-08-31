import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "light" | "dark";
export type InterfaceMode = "normal" | "adhd" | "autism";

type PrefsValue = {
  theme: Theme;
  mode: InterfaceMode;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  setMode: (m: InterfaceMode) => void;
};

const PrefsContext = createContext<PrefsValue | null>(null);

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mode, setModeState] = useState<InterfaceMode>("normal");

  useEffect(() => {
    const t = localStorage.getItem("balanceai:theme") as Theme | null;
    const m = localStorage.getItem("balanceai:mode") as InterfaceMode | null;
    if (t) setThemeState(t);
    if (m) setModeState(m);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.dataset["mode"] = mode;
  }, [theme, mode]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("balanceai:theme", t);
  }, []);

  const setMode = useCallback((m: InterfaceMode) => {
    setModeState(m);
    localStorage.setItem("balanceai:mode", m);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      mode,
      setTheme,
      setMode,
      toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"),
    }),
    [theme, mode, setTheme, setMode],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside PrefsProvider");
  return ctx;
}
