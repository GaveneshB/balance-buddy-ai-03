import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type VectorKey = "mental" | "time" | "physical" | "social" | "errands";

export type VectorState = Record<VectorKey, number>;

export type TaskCategory = "mental" | "physical" | "social" | "errands";

export type TaskItem = {
  id: string;
  title: string;
  course: string;
  due: string;
  hours: string;
  hoursNum: number;
  weight: number;
  cat: TaskCategory;
  tone: string;
  isOffloaded?: boolean | undefined;
};

export type AiAction =
  | {
      type: "ADD_TASK";
      payload: {
        title: string;
        course?: string | undefined;
        due?: string | undefined;
        hours?: number | undefined;
        cat?: TaskCategory | undefined;
      };
    }
  | { type: "REBALANCE"; payload?: { reason?: string | undefined } | undefined }
  | { type: "TRIGGER_RECOVERY"; payload?: { durationMinutes?: number | undefined } | undefined };

export type AppStateContextType = {
  vectors: VectorState;
  baselines: VectorState;
  overallCapacity: number;
  recoveryModeActive: boolean;
  recoveryLockUntil: number;
  isRecoveryLocked: boolean;
  recoveryMinutesLeft: number;
  tasks: TaskItem[];
  offloadedTasks: TaskItem[];
  clockedInTask: TaskItem | null;
  autoDeclineDraft: { to: string; event: string; text: string };
  rebalanced: boolean;
  calendarSynced: boolean;
  focusPoints: number;
  userProfile: { name: string; university: string; email: string };
  contextInfo: { gps: string; weather: string; directive: string };

  setVector: (key: VectorKey, val: number) => void;
  setAllVectors: (vectors: Partial<VectorState>) => void;
  setBaseline: (key: VectorKey, val: number) => void;
  addTask: (taskInput: {
    title: string;
    course?: string | undefined;
    due?: string | undefined;
    hours?: number | undefined;
    cat?: TaskCategory | undefined;
  }) => TaskItem;
  rebalanceWeek: () => void;
  approveRebalance: () => void;
  undoDeferral: (taskId: string) => void;
  updateDeclineDraft: (text: string) => void;
  toggleCalendarSync: () => void;
  setClockedInTask: (task: TaskItem | null) => void;
  completeTask: (taskId: string) => void;
  earnFocusPoints: (pts: number) => void;
  executeAiAction: (action: AiAction) => string;
};

const defaultBaselines: VectorState = {
  mental: 70,
  time: 65,
  physical: 50,
  social: 60,
  errands: 45,
};

const initialVectors: VectorState = {
  mental: 90,
  time: 85,
  physical: 40,
  social: 75,
  errands: 30,
};

const initialUrgentTasks: TaskItem[] = [
  {
    id: "task-1",
    title: "Machine Learning Assignment",
    course: "CS301",
    due: "2d 4h",
    hours: "6h",
    hoursNum: 6,
    weight: 34,
    cat: "mental",
    tone: "var(--danger)",
  },
  {
    id: "task-2",
    title: "Problem Set 5",
    course: "MATH210",
    due: "3d 9h",
    hours: "3h",
    hoursNum: 3,
    weight: 18,
    cat: "mental",
    tone: "var(--warn)",
  },
  {
    id: "task-3",
    title: "Renew student pass",
    course: "Errand",
    due: "1d 2h",
    hours: "30m",
    hoursNum: 0.5,
    weight: 6,
    cat: "errands",
    tone: "var(--warn)",
  },
];

const initialOffloadedTasks: TaskItem[] = [
  {
    id: "task-4",
    title: "Grocery Shopping",
    course: "Errand",
    due: "Deferred to Saturday",
    hours: "1h",
    hoursNum: 1,
    weight: 5,
    cat: "errands",
    tone: "var(--muted-foreground)",
    isOffloaded: true,
  },
  {
    id: "task-5",
    title: "Club Prep Deck",
    course: "Social",
    due: "Deferred to Sunday 2pm",
    hours: "1h 30m",
    hoursNum: 1.5,
    weight: 8,
    cat: "social",
    tone: "var(--muted-foreground)",
    isOffloaded: true,
  },
  {
    id: "task-6",
    title: "Gym — leg day",
    course: "Physical",
    due: "Moved to Friday",
    hours: "1h",
    hoursNum: 1,
    weight: 10,
    cat: "physical",
    tone: "var(--muted-foreground)",
    isOffloaded: true,
  },
];

function calculateOverallCapacity(v: VectorState): number {
  // Weighted calculation prioritizing mental and time strain
  const score = Math.round(
    v.mental * 0.35 + v.time * 0.35 + v.social * 0.12 + v.physical * 0.1 + v.errands * 0.08,
  );
  return Math.min(100, Math.max(0, score));
}

const AppStateContext = createContext<AppStateContextType | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [vectors, setVectors] = useState<VectorState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("balanceai:vectors");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return initialVectors;
  });

  const [baselines, setBaselines] = useState<VectorState>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("balanceai:baselines");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return defaultBaselines;
  });

  const [tasks, setTasks] = useState<TaskItem[]>(initialUrgentTasks);
  const [offloadedTasks, setOffloadedTasks] = useState<TaskItem[]>(initialOffloadedTasks);
  const [clockedInTask, setClockedInTask] = useState<TaskItem | null>(initialUrgentTasks[0] ?? null);
  const [rebalanced, setRebalanced] = useState(false);
  const [calendarSynced, setCalendarSynced] = useState(true);
  const [focusPoints, setFocusPoints] = useState(40);
  const [now, setNow] = useState(Date.now());
  const [recoveryLockUntil, setRecoveryLockUntil] = useState<number>(() => Date.now() + 15 * 60 * 1000);

  const [autoDeclineDraft, setAutoDeclineDraft] = useState({
    to: "Study group · Dinner tonight, 8:00 PM",
    event: "Group Dinner",
    text: "Hey! I’m completely at capacity with exams and assignments this week, so I won’t be able to make it to tonight’s dinner. Let’s reconnect next week!",
  });

  const [userProfile] = useState({
    name: "Dhanesh Kumar",
    university: "Tech University · Year 3 CS",
    email: "dhanesh.k@student.techuni.edu",
  });

  const [contextInfo] = useState({
    gps: "Campus Library · 3rd Floor Quiet Zone",
    weather: "Rainy · 18°C",
    directive: "Single focus: Complete 1 hour of CS301 then 10-min hydration walk.",
  });

  // Load baselines from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("balanceai:baselines");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object") {
            setBaselines((prev) => ({ ...prev, ...parsed }));
          }
        } catch {}
      }
    }
  }, []);

  // Save baselines
  useEffect(() => {
    localStorage.setItem("balanceai:baselines", JSON.stringify(baselines));
  }, [baselines]);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem("balanceai:vectors", JSON.stringify(vectors));
  }, [vectors]);

  // Real-time minute timer for recovery countdown
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const overallCapacity = useMemo(() => calculateOverallCapacity(vectors), [vectors]);
  const recoveryModeActive = overallCapacity >= 90;
  const isRecoveryLocked = now < recoveryLockUntil || recoveryModeActive;
  const recoveryMinutesLeft = Math.max(0, Math.ceil((recoveryLockUntil - now) / 60000));

  const setVector = useCallback((key: VectorKey, val: number) => {
    setVectors((prev) => ({ ...prev, [key]: Math.min(100, Math.max(0, val)) }));
  }, []);

  const setAllVectors = useCallback((newVectors: Partial<VectorState>) => {
    setVectors((prev) => ({
      ...prev,
      ...newVectors,
    }));
  }, []);

  const setBaseline = useCallback((key: VectorKey, val: number) => {
    setBaselines((prev) => ({ ...prev, [key]: Math.min(100, Math.max(0, val)) }));
  }, []);

  const addTask = useCallback(
    (input: {
      title: string;
      course?: string | undefined;
      due?: string | undefined;
      hours?: number | undefined;
      cat?: TaskCategory | undefined;
    }): TaskItem => {
      const cat = input.cat ?? "mental";
      const hoursNum = input.hours ?? 4;
      const weight = Math.round(hoursNum * 5.5 + 4);
      const tone = weight > 25 ? "var(--danger)" : weight > 12 ? "var(--warn)" : "var(--safe)";

      const newTask: TaskItem = {
        id: `task-${Date.now()}`,
        title: input.title,
        course: input.course ?? (cat === "mental" ? "ACADEMIC" : cat.toUpperCase()),
        due: input.due ?? "In 2 days",
        hours: `${hoursNum}h`,
        hoursNum,
        weight,
        cat,
        tone,
      };

      setTasks((prev) => [newTask, ...prev]);
      setClockedInTask(newTask);

      // Increase vectors based on task category & workload
      setVectors((prev) => {
        const timeIncrease = Math.min(25, Math.round(hoursNum * 3.5));
        const mentalIncrease = cat === "mental" ? Math.min(30, Math.round(hoursNum * 4)) : 5;
        const physicalIncrease = cat === "physical" ? 25 : 0;
        const socialIncrease = cat === "social" ? 20 : 0;
        const errandIncrease = cat === "errands" ? 15 : 0;

        const updated: VectorState = {
          mental: Math.min(98, prev.mental + mentalIncrease),
          time: Math.min(98, prev.time + timeIncrease),
          physical: Math.min(98, prev.physical + physicalIncrease),
          social: Math.min(98, prev.social + socialIncrease),
          errands: Math.min(98, prev.errands + errandIncrease),
        };

        const newCapacity = calculateOverallCapacity(updated);
        if (newCapacity >= 90) {
          setRecoveryLockUntil(Date.now() + 15 * 60 * 1000);
        }

        return updated;
      });

      return newTask;
    },
    [],
  );

  const rebalanceWeek = useCallback(() => {
    setTasks((currentTasks) => {
      // Defer non-academic or low-weight tasks
      const toKeep: TaskItem[] = [];
      const toDefer: TaskItem[] = [];

      currentTasks.forEach((t) => {
        if (t.cat === "mental" && t.weight > 20) {
          toKeep.push(t);
        } else {
          toDefer.push({
            ...t,
            due: "Deferred by BalanceAI",
            isOffloaded: true,
            tone: "var(--muted-foreground)",
          });
        }
      });

      setOffloadedTasks((prev) => [...toDefer, ...prev]);
      return toKeep;
    });

    setVectors({
      mental: 62,
      time: 58,
      physical: 45,
      social: 50,
      errands: 25,
    });

    setRebalanced(true);
  }, []);

  const approveRebalance = useCallback(() => {
    rebalanceWeek();
  }, [rebalanceWeek]);

  const undoDeferral = useCallback((taskId: string) => {
    setOffloadedTasks((prevOffloaded) => {
      const found = prevOffloaded.find((t) => t.id === taskId);
      if (found) {
        const restored: TaskItem = {
          ...found,
          due: "1d 4h",
          isOffloaded: false,
          tone: found.weight > 20 ? "var(--danger)" : "var(--warn)",
        };
        setTasks((prev) => [restored, ...prev]);
        return prevOffloaded.filter((t) => t.id !== taskId);
      }
      return prevOffloaded;
    });
  }, []);

  const updateDeclineDraft = useCallback((text: string) => {
    setAutoDeclineDraft((prev) => ({ ...prev, text }));
  }, []);

  const toggleCalendarSync = useCallback(() => {
    setCalendarSynced((prev) => !prev);
  }, []);

  const earnFocusPoints = useCallback((pts: number) => {
    setFocusPoints((prev) => prev + pts);
  }, []);

  const executeAiAction = useCallback(
    (action: AiAction): string => {
      if (action.type === "ADD_TASK") {
        const newTask = addTask(action.payload);
        return `Added task "${newTask.title}" (${newTask.hours}) to your schedule. Clocked in as current focus. Capacity updated.`;
      }
      if (action.type === "REBALANCE") {
        rebalanceWeek();
        return `Autonomous Workload Balancer executed. Offloaded non-urgent tasks, drafted social decline, and brought overall capacity down to 61%.`;
      }
      if (action.type === "TRIGGER_RECOVERY") {
        setRecoveryLockUntil(Date.now() + (action.payload?.durationMinutes ?? 15) * 60 * 1000);
        return `Recovery Mode activated. Creation locked for 15 minutes to prevent decision fatigue. Follow your single-action directive.`;
      }
      return "Action executed.";
    },
    [addTask, rebalanceWeek],
  );

  const completeTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const found = prev.find((t) => t.id === taskId);
      if (found) {
        setVectors((vecs) => ({
          ...vecs,
          mental: Math.max(15, vecs.mental - Math.round(found.hoursNum * 3)),
          time: Math.max(15, vecs.time - Math.round(found.hoursNum * 3)),
        }));
        setFocusPoints((pts) => pts + 25);
      }
      const remaining = prev.filter((t) => t.id !== taskId);
      setClockedInTask((curr) => (curr?.id === taskId ? (remaining[0] ?? null) : curr));
      return remaining;
    });
  }, []);

  const value = useMemo(
    () => ({
      vectors,
      baselines,
      overallCapacity,
      recoveryModeActive,
      recoveryLockUntil,
      isRecoveryLocked,
      recoveryMinutesLeft,
      tasks,
      offloadedTasks,
      clockedInTask,
      setClockedInTask,
      completeTask,
      autoDeclineDraft,
      rebalanced,
      calendarSynced,
      focusPoints,
      userProfile,
      contextInfo,
      setVector,
      setAllVectors,
      setBaseline,
      addTask,
      rebalanceWeek,
      approveRebalance,
      undoDeferral,
      updateDeclineDraft,
      toggleCalendarSync,
      earnFocusPoints,
      executeAiAction,
    }),
    [
      vectors,
      baselines,
      overallCapacity,
      recoveryModeActive,
      recoveryLockUntil,
      isRecoveryLocked,
      recoveryMinutesLeft,
      tasks,
      offloadedTasks,
      clockedInTask,
      setClockedInTask,
      completeTask,
      autoDeclineDraft,
      rebalanced,
      calendarSynced,
      focusPoints,
      userProfile,
      contextInfo,
      setVector,
      setAllVectors,
      setBaseline,
      addTask,
      rebalanceWeek,
      approveRebalance,
      undoDeferral,
      updateDeclineDraft,
      toggleCalendarSync,
      earnFocusPoints,
      executeAiAction,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used inside AppStateProvider");
  return ctx;
}
