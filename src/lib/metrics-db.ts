export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export interface WeekRecord {
  d: DayKey;
  v: number;
}

const DB_KEY = "balance_ai_metrics_db";
const LAST_ACTIVE_KEY = "balance_ai_last_active_day";
const DAYS: DayKey[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getTodayKey(): DayKey {
  return DAYS[new Date().getDay()]!;
}

// Default empty table
export function getDefaultTable(): Record<DayKey, number> {
  return {
    Mon: 0,
    Tue: 0,
    Wed: 0,
    Thu: 0,
    Fri: 0,
    Sat: 0,
    Sun: 0,
  };
}

// 1. READ FROM LOCAL DB
export function readDatabase(): Record<DayKey, number> {
  if (typeof window === "undefined") return getDefaultTable();
  try {
    const raw = localStorage.getItem(DB_KEY);
    return raw ? JSON.parse(raw) : getDefaultTable();
  } catch {
    return getDefaultTable();
  }
}

// 2. WRITE ONLY TO TODAY (Past days remain locked)
export function upsertTodayScore(score: number) {
  if (typeof window === "undefined") return;

  const today = getTodayKey();
  const db = readDatabase();
  const lastActive = localStorage.getItem(LAST_ACTIVE_KEY);

  // If it's Monday and the last activity wasn't Monday, roll over to a fresh week
  if (today === "Mon" && lastActive && lastActive !== "Mon") {
    const fresh = getDefaultTable();
    fresh["Mon"] = score;
    localStorage.setItem(DB_KEY, JSON.stringify(fresh));
    localStorage.setItem(LAST_ACTIVE_KEY, today);
      window.dispatchEvent(new Event("balance_ai_db_updated"));
    return;
  }

  // Only mutate today's key. All other days are left untouched!
  db[today] = score;

  localStorage.setItem(DB_KEY, JSON.stringify(db));
  localStorage.setItem(LAST_ACTIVE_KEY, today);
  window.dispatchEvent(new Event("balance_ai_db_updated"));
}

// 3. TRANSFORM TO ARRAY FOR INSIGHTS GRAPH
export function getChartData(): WeekRecord[] {
  const db = readDatabase();
  const displayOrder: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return displayOrder.map((day) => ({
    d: day,
    v: db[day] ?? 0,
  }));
}
