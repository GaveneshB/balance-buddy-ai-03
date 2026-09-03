import React, { useState, useMemo } from 'react';

export type TaskCategory = 'mental' | 'physical' | 'social' | 'errands' | 'time';

export interface TaskItem {
  id: string;
  title: string;
  category: TaskCategory;
  energyDrain: 1 | 2 | 3; // 1: Low, 2: Medium, 3: High
  deadline: string;       // YYYY-MM-DD
  createdAt: string;      // ISO timestamp for future calendar sync
  emoji: string;          // User-selected emoji
  urgencyScore: number;   // Computed dynamically from deadline
}

const CATEGORIES: { key: TaskCategory; label: string; defaultEmoji: string }[] = [
  { key: 'mental', label: 'Mental', defaultEmoji: '🧠' },
  { key: 'physical', label: 'Physical', defaultEmoji: '⚡' },
  { key: 'social', label: 'Social', defaultEmoji: '👥' },
  { key: 'errands', label: 'Errands', defaultEmoji: '🛒' },
  { key: 'time', label: 'Time Crunch', defaultEmoji: '⏳' },
];

const DRAIN_LEVELS: { value: 1 | 2 | 3; label: string; color: string }[] = [
  { value: 1, label: 'Low', color: 'bg-emerald-500 text-white' },
  { value: 2, label: 'Medium', color: 'bg-amber-500 text-white' },
  { value: 3, label: 'High', color: 'bg-rose-500 text-white' },
];

const POPULAR_EMOJIS = ['🧠', '📚', '⚡', '🏋️', '👥', '💬', '🛒', '🧹', '⏳', '🔥', '🎯', '✨'];

const RECOVERY_ACTIONS = [
  {
    title: '15-Minute Sunlight Walk',
    category: 'Physical Reset',
    desc: 'Step away from screens, get outdoor light, and reset cortisol.',
  },
  {
    title: '20-Minute Power Nap',
    category: 'Cognitive Reboot',
    desc: 'Dark room, phone on silent, eyes closed. No scrolling.',
  },
  {
    title: 'Sensory Decompression Pause',
    category: 'Sensory Rest',
    desc: 'Put on noise-canceling audio, drink water, and practice steady breathing.',
  },
];

export const TaskOffloader: React.FC = () => {
  const [capacityScore] = useState<number>(76);
  const [recoveryDismissed, setRecoveryDismissed] = useState<boolean>(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('mental');
  const [energyDrain, setEnergyDrain] = useState<1 | 2 | 3>(2);
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0] ?? '');
  const [emoji, setEmoji] = useState('🧠');

  const [tasks, setTasks] = useState<TaskItem[]>([
    {
      id: '1',
      title: 'Submit AI Project Report',
      category: 'mental',
      energyDrain: 3,
      deadline: new Date().toISOString().split('T')[0] ?? '',
      createdAt: new Date().toISOString(),
      emoji: '🧠',
      urgencyScore: 10,
    },
    {
      id: '2',
      title: 'Pick up weekly groceries',
      category: 'errands',
      energyDrain: 1,
      deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] ?? '',
      createdAt: new Date().toISOString(),
      emoji: '🛒',
      urgencyScore: 4,
    },
  ]);

  // Derive urgency score (1-10) dynamically based on days until deadline
  const calculateUrgency = (targetDate: string): number => {
    if (!targetDate) return 5;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(targetDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 10; // Due today or overdue
    if (diffDays === 1) return 8;  // Due tomorrow
    if (diffDays <= 3) return 6;   // Due this week
    return 3;                      // Later
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask: TaskItem = {
      id: Date.now().toString(),
      title: title.trim(),
      category,
      energyDrain,
      deadline,
      createdAt: new Date().toISOString(), // Timestamp for future calendar integration
      emoji,
      urgencyScore: calculateUrgency(deadline),
    };

    setTasks((prev) => [newTask, ...prev]);

    // Reset Form
    setTitle('');
    setCategory('mental');
    setEnergyDrain(2);
    setEmoji('🧠');
  };

  // Centralized removal helper
  const handleRemoveTask = (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  // Re-order queue dynamically based on energy drain and deadlines
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aWeight = capacityScore >= 80
        ? a.urgencyScore * 2 - a.energyDrain * 1.5
        : a.urgencyScore * 1.5 + a.energyDrain;

      const bWeight = capacityScore >= 80
        ? b.urgencyScore * 2 - b.energyDrain * 1.5
        : b.urgencyScore * 1.5 + b.energyDrain;

      return bWeight - aWeight;
    });
  }, [tasks, capacityScore]);

  const nextTask = sortedTasks[0];
  const queueTasks = sortedTasks.slice(1);
  const activeRecovery = RECOVERY_ACTIONS[0]!;

  return (
    <div className="max-w-xl mx-auto space-y-6 font-sans">

      {/* Structured Task Dump Card */}
      <form onSubmit={handleAddTask} className="p-4 bg-card border border-border rounded-2xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Add New Task</h3>

        {/* 1. Task Name + Emoji Header */}
        <div className="flex gap-2">
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-14 text-center text-xl bg-muted/50 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent"
            title="Custom Emoji"
          />
          <input
            type="text"
            placeholder="Task name (e.g., Train DCGAN model, Finish Lab 3)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1 px-4 py-2 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Quick Emoji Pickers */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-muted-foreground mr-1">Quick pick:</span>
          {POPULAR_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setEmoji(em)}
              className={`h-7 w-7 rounded-lg text-sm flex items-center justify-center border transition-all ${
                emoji === em ? 'border-accent bg-accent/20 scale-110' : 'border-transparent hover:bg-muted'
              }`}
            >
              {em}
            </button>
          ))}
        </div>

        {/* 2. Category Selector */}
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Category</label>
          <div className="mt-1.5 grid grid-cols-5 gap-1.5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  setCategory(cat.key);
                  setEmoji(cat.defaultEmoji);
                }}
                className={`py-1.5 px-2 text-xs rounded-xl border text-center transition-all ${
                  category === cat.key
                    ? 'border-accent bg-accent text-accent-foreground font-semibold shadow-xs'
                    : 'border-border bg-card/40 text-muted-foreground hover:border-accent/50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Energy Drain (1-3 Linear Scale) & 4. Deadline */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Energy Drain</label>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {DRAIN_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setEnergyDrain(lvl.value)}
                  className={`py-1.5 text-xs rounded-xl border font-semibold transition-all ${
                    energyDrain === lvl.value
                      ? `${lvl.color} border-transparent shadow-xs`
                      : 'border-border bg-card/40 text-muted-foreground hover:border-border'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1.5 w-full px-3 py-1.5 bg-muted/30 border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold shadow-sm hover:opacity-90 transition-all active:scale-[0.99]"
        >
          Add to Queue
        </button>
      </form>

      {/* Flagship: Forced Recovery Window (>=90%) OR "Do This Next" */}
      {capacityScore >= 90 && !recoveryDismissed ? (
        <div className="bg-red-50 border-2 border-red-500 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-red-700">🚨 Severe Burnout Warning</span>
            <span className="bg-red-200 text-red-900 text-xs px-2.5 py-0.5 rounded-full font-medium">
              Mandatory Recovery
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-red-950">{activeRecovery.title}</h3>
            <p className="text-sm text-red-800 mt-1">{activeRecovery.desc}</p>
          </div>
          <button
            onClick={() => setRecoveryDismissed(true)}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            I've Finished Resting (Resume Queue)
          </button>
        </div>
      ) : (
        nextTask && (
          <div className="bg-blue-50/60 dark:bg-blue-950/20 border-2 border-blue-500 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  🎯 Do This Next
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 text-xs px-2.5 py-0.5 rounded-full font-semibold capitalize">
                  {nextTask.category}
                </span>
              </div>

              {/* Dismiss/Skip top task */}
              <button
                type="button"
                onClick={() => handleRemoveTask(nextTask.id)}
                className="text-muted-foreground hover:text-red-500 text-sm font-bold px-2 py-0.5 transition-colors"
                title="Dismiss task"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl">{nextTask.emoji}</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex-1">{nextTask.title}</h3>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>Drain: <strong className="text-foreground">{nextTask.energyDrain === 3 ? 'High' : nextTask.energyDrain === 2 ? 'Medium' : 'Low'}</strong></span>
                <span>Deadline: <strong className="text-foreground">{nextTask.deadline || 'No date'}</strong></span>
              </div>

              {/* Complete Task Button */}
              <button
                type="button"
                onClick={() => handleRemoveTask(nextTask.id)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg transition-colors shadow-xs active:scale-95"
              >
                ✓ Complete
              </button>
            </div>
          </div>
        )
      )}

      {/* Task Queue Below */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground">Upcoming Queue ({queueTasks.length})</h4>
          <span className="text-xs text-muted-foreground">Auto-balanced</span>
        </div>

        <div className="space-y-2">
          {queueTasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-3.5 bg-card border border-border rounded-xl shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{task.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                    <span className="capitalize">{task.category}</span>
                    <span>•</span>
                    <span>Drain: {task.energyDrain}/3</span>
                    <span>•</span>
                    <span>Due: {task.deadline}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRemoveTask(task.id)}
                className="text-muted-foreground hover:text-red-500 text-base px-2 transition-colors"
                title="Remove task"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};