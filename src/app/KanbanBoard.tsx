"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type TabKey = "overview" | "tasks" | "analytics" | "inspiration" | "ideas" | "modes";
type TaskStatus = "todo" | "in-progress" | "done";
type TaskPriority = "Low" | "Medium" | "High";
type TimeCategory =
  | "Produzione"
  | "Studio/Ricerca"
  | "Business/Admin"
  | "Salute/Energia"
  | "Relazioni/Casa"
  | "Procrastinazione/Scrolling"
  | "Riposo"
  | "Altro";

type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type TimeLog = {
  id: string;
  date: string;
  slot: string;
  category: TimeCategory;
  hours: number;
  note: string;
  energy: number;
};

type Inspiration = {
  id: string;
  url: string;
  reason: string;
  pattern: string;
  platform: "Instagram" | "YouTube" | "TikTok" | "X/Twitter" | "Other";
  status: "saved" | "analyzed" | "adapted";
};

type Idea = {
  id: string;
  title: string;
  note: string;
  score: number;
  status: "raw" | "research" | "build" | "paused";
};

const STORAGE_KEY = "iacovici-life-os:v1";

const categories: TimeCategory[] = [
  "Produzione",
  "Studio/Ricerca",
  "Business/Admin",
  "Salute/Energia",
  "Relazioni/Casa",
  "Procrastinazione/Scrolling",
  "Riposo",
  "Altro",
];

const tabs: Array<{ key: TabKey; label: string; hint: string }> = [
  { key: "overview", label: "Overview", hint: "oggi + settimana" },
  { key: "tasks", label: "Tasks", hint: "execution board" },
  { key: "analytics", label: "Analytics", hint: "time & actions" },
  { key: "inspiration", label: "Inspiration", hint: "saved videos" },
  { key: "ideas", label: "Ideas", hint: "business lab" },
  { key: "modes", label: "Lexa Modes", hint: "prompts" },
];

const seededTasks: Task[] = [
  {
    id: "task-content-week",
    title: "Record Iacovici.it AI Week 01",
    description:
      "Batch record 7 talking-head videos from the prepared scripts. Keep each video 35–55 seconds, no screen recording, leave room for captions and animated cards.",
    priority: "High",
    status: "todo",
  },
  {
    id: "task-video-pipeline",
    title: "Run video-use + hyperframes pipeline",
    description:
      "Process the recorded videos on macOS: auto cuts, captions, camera movement, animated keywords, exports for YouTube Shorts and Instagram Reels.",
    priority: "High",
    status: "todo",
  },
  {
    id: "task-posting",
    title: "Publish or schedule daily Shorts/Reels",
    description:
      "Use Lexa captions/titles/hashtags. YouTube can be automated later; Instagram/TikTok can stay manual until API setup is ready.",
    priority: "High",
    status: "todo",
  },
  {
    id: "task-brand-system",
    title: "Define Iacovici.it brand system",
    description:
      "Clarify promise, audience, visual rules, recurring series, free community, future course offer and tone of voice.",
    priority: "Medium",
    status: "in-progress",
  },
];

const seededLogs: TimeLog[] = [
  {
    id: "seed-log-1",
    date: new Date().toISOString().slice(0, 10),
    slot: "09:00–11:00",
    category: "Produzione",
    hours: 2,
    note: "Example: record one AI video or build a concrete asset.",
    energy: 7,
  },
];

const seededInspirations: Inspiration[] = [
  {
    id: "seed-inspo-1",
    url: "https://youtube.com/shorts/example",
    reason: "Strong hook + fast visual rhythm. Replace this with a real saved video.",
    pattern: "Shock hook → 3 quick points → soft CTA",
    platform: "YouTube",
    status: "saved",
  },
];

const seededIdeas: Idea[] = [
  {
    id: "seed-idea-1",
    title: "Iacovici.it AI community",
    note:
      "Teach practical AI workflows in Italian and English, build trust with daily content, then launch a deeper 10–15 video pro course/community.",
    score: 9,
    status: "research",
  },
];

const lexaModes = [
  {
    name: "Start my day",
    prompt: "Lexa, buongiorno / start my day",
    result: "Morning plan: 1 money task, 1 content task, 1 energy task, first tiny action.",
  },
  {
    name: "Content mode",
    prompt: "Lexa, content mode",
    result: "Trend research, hooks, scripts, captions, titles, hashtags and publishing plan.",
  },
  {
    name: "Anti-scroll rescue",
    prompt: "Lexa, sto scappando / I’m scrolling",
    result: "2-minute reset, smallest next task, timer, and accountability check-in.",
  },
  {
    name: "Business partner",
    prompt: "Lexa, business partner mode: [idea]",
    result: "Monetization, MVP, effort, risk, next step, and whether to build/ignore it.",
  },
  {
    name: "Evening review",
    prompt: "Lexa, vado a dormire / I’m going to sleep",
    result: "What happened, what was avoided, what to improve tomorrow, no guilt.",
  },
  {
    name: "Deep talk",
    prompt: "Lexa, deep talk",
    result: "A focused conversation about fear, confidence, avoidance, identity and direction.",
  },
];

const defaultState = {
  tasks: seededTasks,
  logs: seededLogs,
  inspirations: seededInspirations,
  ideas: seededIdeas,
};

type AppState = typeof defaultState;

function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState;
    const parsed = JSON.parse(saved) as Partial<AppState>;
    return {
      tasks: parsed.tasks?.length ? parsed.tasks : seededTasks,
      logs: parsed.logs?.length ? parsed.logs : seededLogs,
      inspirations: parsed.inspirations?.length ? parsed.inspirations : seededInspirations,
      ideas: parsed.ideas?.length ? parsed.ideas : seededIdeas,
    };
  } catch {
    return defaultState;
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const priorityStyle: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  Medium: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  High: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

export default function KanbanBoard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [state, setState] = useState<AppState>(() => loadState());

  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "Medium" as TaskPriority });
  const [logForm, setLogForm] = useState({
    slot: "",
    category: "Produzione" as TimeCategory,
    hours: "2",
    note: "",
    energy: "7",
  });
  const [inspoForm, setInspoForm] = useState({ url: "", reason: "", pattern: "", platform: "Instagram" as Inspiration["platform"] });
  const [ideaForm, setIdeaForm] = useState({ title: "", note: "", score: "7" });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const analytics = useMemo(() => {
    const totals = categories.map((category) => ({
      category,
      hours: state.logs.filter((log) => log.category === category).reduce((sum, log) => sum + Number(log.hours || 0), 0),
    }));
    const totalHours = totals.reduce((sum, item) => sum + item.hours, 0);
    const productionHours = totals
      .filter((item) => ["Produzione", "Studio/Ricerca", "Business/Admin"].includes(item.category))
      .reduce((sum, item) => sum + item.hours, 0);
    const scrollingHours = totals.find((item) => item.category === "Procrastinazione/Scrolling")?.hours ?? 0;
    const avgEnergy = state.logs.length
      ? state.logs.reduce((sum, log) => sum + Number(log.energy || 0), 0) / state.logs.length
      : 0;
    return { totals, totalHours, productionHours, scrollingHours, avgEnergy };
  }, [state.logs]);

  function addTask(event: FormEvent) {
    event.preventDefault();
    if (!taskForm.title.trim()) return;
    setState((current) => ({
      ...current,
      tasks: [
        { id: uid("task"), title: taskForm.title.trim(), description: taskForm.description.trim(), priority: taskForm.priority, status: "todo" },
        ...current.tasks,
      ],
    }));
    setTaskForm({ title: "", description: "", priority: "Medium" });
  }

  function addTimeLog(event: FormEvent) {
    event.preventDefault();
    if (!logForm.note.trim()) return;
    setState((current) => ({
      ...current,
      logs: [
        {
          id: uid("log"),
          date: new Date().toISOString().slice(0, 10),
          slot: logForm.slot.trim() || "manual entry",
          category: logForm.category,
          hours: Number(logForm.hours || 0),
          note: logForm.note.trim(),
          energy: Number(logForm.energy || 0),
        },
        ...current.logs,
      ],
    }));
    setLogForm({ slot: "", category: "Produzione", hours: "2", note: "", energy: "7" });
  }

  function addInspiration(event: FormEvent) {
    event.preventDefault();
    if (!inspoForm.url.trim()) return;
    setState((current) => ({
      ...current,
      inspirations: [
        { id: uid("inspo"), url: inspoForm.url.trim(), reason: inspoForm.reason.trim(), pattern: inspoForm.pattern.trim(), platform: inspoForm.platform, status: "saved" },
        ...current.inspirations,
      ],
    }));
    setInspoForm({ url: "", reason: "", pattern: "", platform: "Instagram" });
  }

  function addIdea(event: FormEvent) {
    event.preventDefault();
    if (!ideaForm.title.trim()) return;
    setState((current) => ({
      ...current,
      ideas: [
        { id: uid("idea"), title: ideaForm.title.trim(), note: ideaForm.note.trim(), score: Number(ideaForm.score || 0), status: "raw" },
        ...current.ideas,
      ],
    }));
    setIdeaForm({ title: "", note: "", score: "7" });
  }

  function cycleTask(taskId: string) {
    const next: Record<TaskStatus, TaskStatus> = { todo: "in-progress", "in-progress": "done", done: "todo" };
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, status: next[task.status] } : task)),
    }));
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34rem),linear-gradient(135deg,#f8fafc,#eef2ff)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-200/80 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600">Iacovici.it Life OS</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
                Tasks, Analytics & Lexa accountability.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                A private local-first dashboard for execution, time tracking, saved content inspiration, business ideas and the exact prompts to activate Lexa modes.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[30rem]">
              <Metric label="Tracked hours" value={`${analytics.totalHours.toFixed(1)}h`} />
              <Metric label="Production" value={`${analytics.productionHours.toFixed(1)}h`} />
              <Metric label="Scrolling" value={`${analytics.scrollingHours.toFixed(1)}h`} danger />
            </div>
          </div>
        </header>

        <nav className="grid gap-2 rounded-3xl border border-white/70 bg-white/80 p-2 shadow-lg shadow-slate-200/60 backdrop-blur sm:grid-cols-2 lg:grid-cols-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`rounded-2xl px-4 py-3 text-left transition ${
                activeTab === tab.key ? "bg-slate-950 text-white shadow-xl shadow-slate-300" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span className="block text-sm font-black">{tab.label}</span>
              <span className="text-xs opacity-70">{tab.hint}</span>
            </button>
          ))}
        </nav>

        {activeTab === "overview" && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <Panel title="Today’s operating system" subtitle="Keep the day simple: money, content, energy.">
              <div className="grid gap-4 sm:grid-cols-3">
                <ActionCard title="Money" body="One action that can create revenue, leads, offers or useful assets." />
                <ActionCard title="Content" body="Record, edit, publish, analyze, or research one concrete piece." />
                <ActionCard title="Energy" body="Walk, eat, clean, sleep, breathe. Low energy destroys execution." />
              </div>
              <div className="mt-6 rounded-3xl bg-indigo-50 p-5 text-indigo-950 ring-1 ring-indigo-100">
                <p className="font-black">Cron accountability is active:</p>
                <p className="mt-2 text-sm leading-6">
                  Lexa asks every 2 hours from 09:00 to 21:00 what happened. If you answer late, summarize the full period and split it into 2-hour blocks here.
                </p>
              </div>
            </Panel>
            <Panel title="Weekly signal" subtitle="What Lexa should optimize every Sunday.">
              <div className="space-y-3">
                {analytics.totals.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                      <span>{item.category}</span>
                      <span>{item.hours.toFixed(1)}h</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${analytics.totalHours ? Math.min(100, (item.hours / analytics.totalHours) * 100) : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === "tasks" && (
          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Panel title="Add task" subtitle="Execution only, not fantasy planning.">
              <form onSubmit={addTask} className="space-y-3">
                <Input value={taskForm.title} onChange={(value) => setTaskForm({ ...taskForm, title: value })} placeholder="Task title" />
                <Textarea value={taskForm.description} onChange={(value) => setTaskForm({ ...taskForm, description: value })} placeholder="Why it matters / next step" />
                <Select value={taskForm.priority} onChange={(value) => setTaskForm({ ...taskForm, priority: value as TaskPriority })} options={["Low", "Medium", "High"]} />
                <button className="w-full rounded-2xl bg-slate-950 px-4 py-3 font-black text-white">Add task</button>
              </form>
            </Panel>
            <div className="grid gap-4 lg:grid-cols-3">
              {(["todo", "in-progress", "done"] as TaskStatus[]).map((status) => (
                <Panel key={status} title={status.replace("-", " ")} subtitle={`${state.tasks.filter((task) => task.status === status).length} items`}>
                  <div className="space-y-3">
                    {state.tasks.filter((task) => task.status === status).map((task) => (
                      <article key={task.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="font-black text-slate-950">{task.title}</h3>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityStyle[task.priority]}`}>{task.priority}</span>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>
                        <button onClick={() => cycleTask(task.id)} className="mt-4 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">
                          Move status
                        </button>
                      </article>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          </section>
        )}

        {activeTab === "analytics" && (
          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Panel title="Log time block" subtitle="Use this when you answer Lexa late or want manual tracking.">
              <form onSubmit={addTimeLog} className="space-y-3">
                <Input value={logForm.slot} onChange={(value) => setLogForm({ ...logForm, slot: value })} placeholder="Slot e.g. 09:00–11:00" />
                <Select value={logForm.category} onChange={(value) => setLogForm({ ...logForm, category: value as TimeCategory })} options={categories} />
                <div className="grid grid-cols-2 gap-3">
                  <Input value={logForm.hours} onChange={(value) => setLogForm({ ...logForm, hours: value })} placeholder="Hours" />
                  <Input value={logForm.energy} onChange={(value) => setLogForm({ ...logForm, energy: value })} placeholder="Energy 1–10" />
                </div>
                <Textarea value={logForm.note} onChange={(value) => setLogForm({ ...logForm, note: value })} placeholder="What happened?" />
                <button className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-black text-white">Add time log</button>
              </form>
            </Panel>
            <Panel title="Action analytics" subtitle={`Average energy: ${analytics.avgEnergy.toFixed(1)}/10`}>
              <div className="grid gap-4 md:grid-cols-2">
                {state.logs.map((log) => (
                  <article key={log.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500">
                      <span>{log.date}</span><span>•</span><span>{log.slot}</span><span>•</span><span>{log.hours}h</span>
                    </div>
                    <h3 className="mt-2 font-black text-slate-950">{log.category}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{log.note}</p>
                    <p className="mt-3 text-sm font-bold text-indigo-700">Energy: {log.energy}/10</p>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === "inspiration" && (
          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Panel title="Save video link" subtitle="Turn scrolling into research.">
              <form onSubmit={addInspiration} className="space-y-3">
                <Input value={inspoForm.url} onChange={(value) => setInspoForm({ ...inspoForm, url: value })} placeholder="Video URL" />
                <Select value={inspoForm.platform} onChange={(value) => setInspoForm({ ...inspoForm, platform: value as Inspiration["platform"] })} options={["Instagram", "YouTube", "TikTok", "X/Twitter", "Other"]} />
                <Textarea value={inspoForm.reason} onChange={(value) => setInspoForm({ ...inspoForm, reason: value })} placeholder="Why did you save it?" />
                <Textarea value={inspoForm.pattern} onChange={(value) => setInspoForm({ ...inspoForm, pattern: value })} placeholder="Hook / structure / visual pattern" />
                <button className="w-full rounded-2xl bg-fuchsia-600 px-4 py-3 font-black text-white">Save inspiration</button>
              </form>
            </Panel>
            <Panel title="Research library" subtitle="Links you saved with reasons and patterns.">
              <div className="grid gap-4 md:grid-cols-2">
                {state.inspirations.map((item) => (
                  <article key={item.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-black text-fuchsia-700">{item.platform}</span><span className="text-xs font-bold text-slate-400">{item.status}</span></div>
                    <a href={item.url} target="_blank" className="mt-3 block break-all text-sm font-bold text-indigo-700" rel="noreferrer">{item.url}</a>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.reason}</p>
                    <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm font-semibold text-slate-700">{item.pattern}</p>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === "ideas" && (
          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Panel title="Capture idea" subtitle="Do not lose sparks. Score them later.">
              <form onSubmit={addIdea} className="space-y-3">
                <Input value={ideaForm.title} onChange={(value) => setIdeaForm({ ...ideaForm, title: value })} placeholder="Idea title" />
                <Textarea value={ideaForm.note} onChange={(value) => setIdeaForm({ ...ideaForm, note: value })} placeholder="What is it? Why could it work?" />
                <Input value={ideaForm.score} onChange={(value) => setIdeaForm({ ...ideaForm, score: value })} placeholder="Score 1–10" />
                <button className="w-full rounded-2xl bg-emerald-600 px-4 py-3 font-black text-white">Save idea</button>
              </form>
            </Panel>
            <Panel title="Business idea history" subtitle="Lexa can comment and turn good ideas into MVPs.">
              <div className="grid gap-4 md:grid-cols-2">
                {state.ideas.map((idea) => (
                  <article key={idea.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3"><h3 className="font-black text-slate-950">{idea.title}</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{idea.score}/10</span></div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{idea.note}</p>
                    <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-400">{idea.status}</p>
                  </article>
                ))}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === "modes" && (
          <Panel title="Lexa Modes" subtitle="Write these exact prompts in Telegram to activate a mode.">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {lexaModes.map((mode) => (
                <article key={mode.name} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-black text-slate-950">{mode.name}</h3>
                  <code className="mt-3 block rounded-2xl bg-slate-950 p-3 text-sm font-bold text-white">{mode.prompt}</code>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{mode.result}</p>
                </article>
              ))}
            </div>
          </Panel>
        )}
      </section>
    </main>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded-3xl p-4 ring-1 ${danger ? "bg-rose-50 text-rose-950 ring-rose-100" : "bg-slate-950 text-white ring-slate-800"}`}>
      <p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/70 backdrop-blur md:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-black capitalize text-slate-950">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function ActionCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5">
      <h3 className="font-black text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none ring-indigo-200 transition placeholder:text-slate-400 focus:ring-4" />;
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none ring-indigo-200 transition placeholder:text-slate-400 focus:ring-4" />;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none ring-indigo-200 transition focus:ring-4">
      {options.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  );
}
