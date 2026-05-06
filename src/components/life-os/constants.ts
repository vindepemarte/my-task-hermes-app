import type { TaskPriority, TimeCategory } from "@/lib/lifeOsDb";

export type TabKey = "overview" | "tasks" | "clients" | "content" | "analytics" | "inspiration" | "projects" | "ideas" | "modes";

export const categories: TimeCategory[] = [
  "Produzione",
  "Studio/Ricerca",
  "Business/Admin",
  "Salute/Energia",
  "Relazioni/Casa",
  "Procrastinazione/Scrolling",
  "Riposo",
  "Altro",
];

export const tabs: Array<{ key: TabKey; label: string; shortLabel: string; hint: string; icon: string }> = [
  { key: "overview", label: "Overview", shortLabel: "Today", hint: "oggi + settimana", icon: "◎" },
  { key: "tasks", label: "Tasks", shortLabel: "Tasks", hint: "execution board", icon: "✓" },
  { key: "clients", label: "Clients", shortLabel: "Clients", hint: "active work", icon: "€" },
  { key: "content", label: "Content", shortLabel: "Content", hint: "pipeline", icon: "▶" },
  { key: "analytics", label: "Analytics", shortLabel: "Time", hint: "time & actions", icon: "↗" },
  { key: "inspiration", label: "Inspiration", shortLabel: "Research", hint: "saved videos", icon: "⌕" },
  { key: "projects", label: "Projects", shortLabel: "Projects", hint: "brands & lanes", icon: "◇" },
  { key: "ideas", label: "Ideas", shortLabel: "Ideas", hint: "business lab", icon: "✦" },
  { key: "modes", label: "Lexa Modes", shortLabel: "Lexa", hint: "prompts", icon: "♡" },
];

export const lexaModes = [
  { name: "Start my day", prompt: "Lexa, buongiorno / start my day", result: "Morning plan: 1 money task, 1 content task, 1 energy task, first tiny action." },
  { name: "Content mode", prompt: "Lexa, content mode", result: "Trend research, hooks, scripts, captions, titles, hashtags and publishing plan." },
  { name: "Anti-scroll rescue", prompt: "Lexa, sto scappando / I’m scrolling", result: "2-minute reset, smallest next task, timer, and accountability check-in." },
  { name: "Business partner", prompt: "Lexa, business partner mode: [idea]", result: "Monetization, MVP, effort, risk, next step, and whether to build, park or ignore it." },
  { name: "Evening review", prompt: "Lexa, vado a dormire / I’m going to sleep", result: "What happened, what was avoided, what to improve tomorrow, no guilt." },
  { name: "Deep talk", prompt: "Lexa, deep talk", result: "A focused conversation about fear, confidence, avoidance, identity and direction." },
];

export const priorityStyle: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  Medium: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  High: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

export const quickTaskTags = ["Iacovici.it", "ProHappyA", "ABC", "Zâmbetin", "vindepemarte", "Health", "Anti-scroll"];
