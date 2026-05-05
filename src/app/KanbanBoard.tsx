"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { AppState, Idea, Inspiration, Task, TaskPriority, TaskStatus, TimeCategory, TimeLog } from "@/lib/lifeOsDb";

type TabKey = "overview" | "tasks" | "clients" | "content" | "analytics" | "inspiration" | "projects" | "ideas" | "modes";

type SyncState = "loading" | "synced" | "local" | "login" | "error";
type AuthMode = "checking" | "setup" | "login" | "ready";

const STORAGE_KEY = "iacovici-life-os:v2";
const SESSION_TOKEN_STORAGE = "iacovici-life-os:session-token";

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
  { key: "clients", label: "Clients", hint: "active work" },
  { key: "content", label: "Content", hint: "pipeline" },
  { key: "analytics", label: "Analytics", hint: "time & actions" },
  { key: "inspiration", label: "Inspiration", hint: "saved videos" },
  { key: "projects", label: "Projects", hint: "brands & lanes" },
  { key: "ideas", label: "Ideas", hint: "business lab" },
  { key: "modes", label: "Lexa Modes", hint: "prompts" },
];

const seededTasks: Task[] = [
  {
    id: "task-content-week",
    title: "Record Iacovici.it AI content batch",
    description:
      "Record the weekly talking-head videos from the prepared scripts. Keep each video direct, confident and useful, with room for captions and animated visual cards.",
    priority: "High",
    status: "todo",
  },
  {
    id: "task-video-pipeline",
    title: "Run video-use + hyperframes pipeline",
    description:
      "Process recorded videos on macOS with tight cuts, subtitles, movement, dynamic keywords and exports for YouTube Shorts and Instagram Reels.",
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

const defaultState: AppState = {
  tasks: seededTasks,
  logs: [],
  inspirations: [],
  ideas: [],
};

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
    result: "Monetization, MVP, effort, risk, next step, and whether to build, park or ignore it.",
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

const priorityStyle: Record<TaskPriority, string> = {
  Low: "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
  Medium: "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  High: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
};

function loadLocalState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState;
    const parsed = JSON.parse(saved) as Partial<AppState>;
    return {
      tasks: parsed.tasks?.length ? parsed.tasks : seededTasks,
      logs: parsed.logs ?? [],
      inspirations: parsed.inspirations ?? [],
      ideas: parsed.ideas ?? [],
    };
  } catch {
    return defaultState;
  }
}

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function KanbanBoard() {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [state, setState] = useState<AppState>(() => loadLocalState());
  const [sessionToken, setSessionToken] = useState(() => (typeof window === "undefined" ? "" : window.localStorage.getItem(SESSION_TOKEN_STORAGE) || ""));
  const [authMode, setAuthMode] = useState<AuthMode>("checking");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [syncMessage, setSyncMessage] = useState("Checking Life OS login…");

  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "Medium" as TaskPriority });
  const [logForm, setLogForm] = useState({ slot: "", category: "Produzione" as TimeCategory, hours: "2", note: "", energy: "7" });
  const [inspoForm, setInspoForm] = useState({ url: "", reason: "", pattern: "", platform: "Instagram" as Inspiration["platform"] });
  const [ideaForm, setIdeaForm] = useState({ title: "", note: "", score: "7" });

  useEffect(() => {
    void initializeAuth();
    // Run once on mount; auth state is stored in localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (response.status === 401) {
      setAuthMode("login");
      setSyncState("login");
      throw new Error("Login required");
    }
    if (!response.ok) {
      const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(errorBody?.error || "Life OS API request failed");
    }
    return response.json() as Promise<T>;
  }

  async function initializeAuth() {
    try {
      const statusResponse = await fetch("/api/life-os/auth");
      if (!statusResponse.ok) throw new Error("Could not check Life OS auth status");
      const status = (await statusResponse.json()) as { passwordConfigured: boolean };
      if (!status.passwordConfigured) {
        setAuthMode("setup");
        setSyncState("login");
        setSyncMessage("First visit: create your private Life OS password to unlock database sync.");
        return;
      }
      if (sessionToken) {
        await loadCloudState(sessionToken);
      } else {
        setAuthMode("login");
        setSyncState("login");
        setSyncMessage("Enter your Life OS password to connect this browser to Postgres.");
      }
    } catch (error) {
      setAuthMode("login");
      setSyncState("error");
      setSyncMessage(error instanceof Error ? error.message : "Life OS auth check failed.");
    }
  }

  async function loadCloudState(tokenOverride?: string) {
    const token = tokenOverride ?? sessionToken;
    if (!token) {
      setAuthMode("login");
      setSyncState("login");
      setSyncMessage("Enter your Life OS password to connect this browser to Postgres.");
      return;
    }
    setSyncState("loading");
    setSyncMessage("Connecting to Life OS cloud database…");
    try {
      const response = await fetch("/api/life-os", { headers: { Authorization: `Bearer ${token}` } });
      if (response.status === 401) {
        window.localStorage.removeItem(SESSION_TOKEN_STORAGE);
        setSessionToken("");
        setAuthMode("login");
        setSyncState("login");
        setSyncMessage("Session expired. Enter your Life OS password again.");
        return;
      }
      if (!response.ok) throw new Error("Cloud database did not respond correctly");
      const cloudState = (await response.json()) as AppState;
      setState(cloudState);
      setAuthMode("ready");
      setSyncState("synced");
      setSyncMessage("Cloud sync active. Lexa and the web app can use the same Postgres brain.");
    } catch (error) {
      setSyncState("error");
      setSyncMessage(error instanceof Error ? error.message : "Cloud sync failed. Local backup is still available in this browser.");
    }
  }

  async function submitPassword(event: FormEvent) {
    event.preventDefault();
    setAuthError("");
    try {
      const response = await fetch("/api/life-os/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: authMode === "setup" ? "setup" : "login", password }),
      });
      const body = (await response.json().catch(() => null)) as { token?: string; error?: string } | null;
      if (!response.ok || !body?.token) throw new Error(body?.error || "Authentication failed");
      window.localStorage.setItem(SESSION_TOKEN_STORAGE, body.token);
      setSessionToken(body.token);
      setPassword("");
      await loadCloudState(body.token);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed");
    }
  }

  function logout() {
    window.localStorage.removeItem(SESSION_TOKEN_STORAGE);
    setSessionToken("");
    setAuthMode("login");
    setSyncState("login");
    setSyncMessage("Logged out. Enter your Life OS password to sync again.");
  }

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
    const avgEnergy = state.logs.length ? state.logs.reduce((sum, log) => sum + Number(log.energy || 0), 0) / state.logs.length : 0;
    return { totals, totalHours, productionHours, scrollingHours, avgEnergy };
  }, [state.logs]);

  const commandCenter = useMemo(() => {
    const activeTasks = state.tasks.filter((task) => task.status !== "done");
    const highPriority = activeTasks.filter((task) => task.priority === "High");
    const topThree = [...highPriority, ...activeTasks.filter((task) => task.priority !== "High")].slice(0, 3);
    const done = state.tasks.filter((task) => task.status === "done").slice(0, 5);
    const nextTask = topThree[0];
    const latestEnergy = state.logs[0]?.energy ?? Math.round(analytics.avgEnergy || 0);
    return { activeTasks, topThree, done, nextTask, latestEnergy };
  }, [analytics.avgEnergy, state.logs, state.tasks]);

  const clientMap = useMemo(() => {
    const clients = ["ABC Vetrate Panoramiche", "ProHappyA", "Catalin"];
    return clients.map((client) => ({
      client,
      tasks: state.tasks.filter((task) => `${task.title} ${task.description}`.toLowerCase().includes(client.toLowerCase())),
      logs: state.logs.filter((log) => log.note.toLowerCase().includes(client.toLowerCase())),
    }));
  }, [state.logs, state.tasks]);

  const contentPipeline = useMemo(() => {
    const contentTasks = state.tasks.filter((task) => /iacovici|video|reels|shorts|vindepemarte|content/i.test(`${task.title} ${task.description}`));
    const contentLogs = state.logs.filter((log) => /iacovici|video|reels|shorts|vindepemarte|content/i.test(log.note));
    return { contentTasks, contentLogs, inspirations: state.inspirations.slice(0, 6) };
  }, [state.inspirations, state.logs, state.tasks]);

  const projectMap = useMemo(() => {
    const projects = state.ideas.filter((idea) => idea.title.startsWith("Project:"));
    const accounts = state.ideas.filter((idea) => idea.title.startsWith("Account:"));
    return { projects, accounts };
  }, [state.ideas]);

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!taskForm.title.trim()) return;
    const optimistic: Task = { id: uid("task"), title: taskForm.title.trim(), description: taskForm.description.trim(), priority: taskForm.priority, status: "todo" };
    setState((current) => ({ ...current, tasks: [optimistic, ...current.tasks] }));
    setTaskForm({ title: "", description: "", priority: "Medium" });
    try {
      const saved = await apiFetch<Task>("/api/life-os", { method: "POST", body: JSON.stringify({ type: "task", data: optimistic }) });
      setState((current) => ({ ...current, tasks: current.tasks.map((task) => (task.id === optimistic.id ? saved : task)) }));
      setSyncState("synced");
    } catch (error) {
      setSyncState(error instanceof Error && error.message === "Login required" ? "login" : "local");
      setSyncMessage("Saved locally in this browser. Log in to sync with Postgres.");
    }
  }

  async function addTimeLog(event: FormEvent) {
    event.preventDefault();
    if (!logForm.note.trim()) return;
    const optimistic: TimeLog = {
      id: uid("log"),
      date: new Date().toISOString().slice(0, 10),
      slot: logForm.slot.trim() || "manual entry",
      category: logForm.category,
      hours: Number(logForm.hours || 0),
      note: logForm.note.trim(),
      energy: Number(logForm.energy || 0),
    };
    setState((current) => ({ ...current, logs: [optimistic, ...current.logs] }));
    setLogForm({ slot: "", category: "Produzione", hours: "2", note: "", energy: "7" });
    try {
      const saved = await apiFetch<TimeLog>("/api/life-os", { method: "POST", body: JSON.stringify({ type: "timeLog", data: optimistic }) });
      setState((current) => ({ ...current, logs: current.logs.map((log) => (log.id === optimistic.id ? saved : log)) }));
      setSyncState("synced");
    } catch {
      setSyncState("local");
      setSyncMessage("Saved locally in this browser. Log in to sync with Postgres.");
    }
  }

  async function addInspiration(event: FormEvent) {
    event.preventDefault();
    if (!inspoForm.url.trim()) return;
    const optimistic: Inspiration = { id: uid("inspo"), url: inspoForm.url.trim(), reason: inspoForm.reason.trim(), pattern: inspoForm.pattern.trim(), platform: inspoForm.platform, status: "saved" };
    setState((current) => ({ ...current, inspirations: [optimistic, ...current.inspirations] }));
    setInspoForm({ url: "", reason: "", pattern: "", platform: "Instagram" });
    try {
      const saved = await apiFetch<Inspiration>("/api/life-os", { method: "POST", body: JSON.stringify({ type: "inspiration", data: optimistic }) });
      setState((current) => ({ ...current, inspirations: current.inspirations.map((item) => (item.id === optimistic.id ? saved : item)) }));
      setSyncState("synced");
    } catch {
      setSyncState("local");
      setSyncMessage("Saved locally in this browser. Log in to sync with Postgres.");
    }
  }

  async function addIdea(event: FormEvent) {
    event.preventDefault();
    if (!ideaForm.title.trim()) return;
    const optimistic: Idea = { id: uid("idea"), title: ideaForm.title.trim(), note: ideaForm.note.trim(), score: Number(ideaForm.score || 0), status: "raw" };
    setState((current) => ({ ...current, ideas: [optimistic, ...current.ideas] }));
    setIdeaForm({ title: "", note: "", score: "7" });
    try {
      const saved = await apiFetch<Idea>("/api/life-os", { method: "POST", body: JSON.stringify({ type: "idea", data: optimistic }) });
      setState((current) => ({ ...current, ideas: current.ideas.map((idea) => (idea.id === optimistic.id ? saved : idea)) }));
      setSyncState("synced");
    } catch {
      setSyncState("local");
      setSyncMessage("Saved locally in this browser. Log in to sync with Postgres.");
    }
  }

  async function cycleTask(taskId: string) {
    const next: Record<TaskStatus, TaskStatus> = { todo: "in-progress", "in-progress": "done", done: "todo" };
    const currentTask = state.tasks.find((task) => task.id === taskId);
    if (!currentTask) return;
    const nextStatus = next[currentTask.status];
    setState((current) => ({ ...current, tasks: current.tasks.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)) }));
    try {
      const saved = await apiFetch<Task>("/api/life-os", { method: "PATCH", body: JSON.stringify({ type: "taskStatus", id: taskId, status: nextStatus }) });
      setState((current) => ({ ...current, tasks: current.tasks.map((task) => (task.id === taskId ? saved : task)) }));
      setSyncState("synced");
    } catch {
      setSyncState("local");
      setSyncMessage("Status changed locally. Log in to sync with Postgres.");
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34rem),linear-gradient(135deg,#f8fafc,#eef2ff)] text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-2xl shadow-slate-200/80 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-indigo-600">Iacovici.it Life OS</p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">Tasks, Analytics & Lexa accountability.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                A private cloud-synced dashboard for execution, time tracking, saved content inspiration, business ideas and the exact prompts to activate Lexa modes.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:w-[30rem]">
              <Metric label="Tracked hours" value={`${analytics.totalHours.toFixed(1)}h`} />
              <Metric label="Production" value={`${analytics.productionHours.toFixed(1)}h`} />
              <Metric label="Scrolling" value={`${analytics.scrollingHours.toFixed(1)}h`} danger />
            </div>
          </div>
          <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black text-slate-950">Cloud database</p>
                <p className={`mt-1 text-sm leading-6 ${syncState === "synced" ? "text-emerald-700" : syncState === "error" ? "text-rose-700" : "text-slate-600"}`}>{syncMessage}</p>
                {authError && <p className="mt-1 text-sm font-bold text-rose-700">{authError}</p>}
              </div>
              {authMode === "ready" ? (
                <button onClick={logout} className="rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700 hover:bg-slate-200">Logout</button>
              ) : (
                <form onSubmit={submitPassword} className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={authMode === "setup" ? "Create your password" : "Life OS password"}
                    type="password"
                    minLength={10}
                    className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none ring-indigo-200 transition placeholder:text-slate-400 focus:ring-4 sm:w-72"
                  />
                  <button className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black text-white">{authMode === "setup" ? "Set password" : "Login"}</button>
                </form>
              )}
            </div>
          </div>
        </header>

        <nav className="grid gap-2 rounded-3xl border border-white/70 bg-white/80 p-2 shadow-lg shadow-slate-200/60 backdrop-blur sm:grid-cols-2 lg:grid-cols-9">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`rounded-2xl px-4 py-3 text-left transition ${activeTab === tab.key ? "bg-slate-950 text-white shadow-xl shadow-slate-300" : "text-slate-600 hover:bg-slate-100"}`}>
              <span className="block text-sm font-black">{tab.label}</span>
              <span className="text-xs opacity-70">{tab.hint}</span>
            </button>
          ))}
        </nav>

        {activeTab === "overview" && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <Panel title="Today Command Center" subtitle="What matters now, not an endless list.">
              <div className="grid gap-4 sm:grid-cols-3">
                <ActionCard title="Top 3" body={commandCenter.topThree.map((task) => `• ${task.title}`).join("\n") || "No active top tasks. Ask Lexa for a battle plan."} />
                <ActionCard title="Next move" body={commandCenter.nextTask ? commandCenter.nextTask.description || commandCenter.nextTask.title : "Choose one small money/content/energy action."} />
                <ActionCard title="Energy" body={commandCenter.latestEnergy ? `${commandCenter.latestEnergy}/10 — adjust workload to reality.` : "Log energy in Telegram so Lexa can pace the day."} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-950 ring-1 ring-emerald-100">
                  <p className="font-black">Done journal</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6">
                    {commandCenter.done.length === 0 && <li>No completions yet today.</li>}
                    {commandCenter.done.map((task) => <li key={task.id}>✓ {task.title}</li>)}
                  </ul>
                </div>
                <div className="rounded-3xl bg-indigo-50 p-5 text-indigo-950 ring-1 ring-indigo-100">
                  <p className="font-black">Lexa proactivity</p>
                  <p className="mt-2 text-sm leading-6">Morning plan, pre-call briefs and evening Done Journal are active. Keep Telegram updates short; Lexa structures the rest.</p>
                </div>
              </div>
            </Panel>
            <Panel title="Weekly signal" subtitle="What Lexa should optimize every Sunday.">
              <div className="space-y-3">
                {analytics.totals.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between text-sm font-bold text-slate-700"><span>{item.category}</span><span>{item.hours.toFixed(1)}h</span></div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${analytics.totalHours ? Math.min(100, (item.hours / analytics.totalHours) * 100) : 0}%` }} /></div>
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
                        <div className="flex items-start justify-between gap-3"><h3 className="font-black text-slate-950">{task.title}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityStyle[task.priority]}`}>{task.priority}</span></div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>
                        <button onClick={() => void cycleTask(task.id)} className="mt-4 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">Move status</button>
                      </article>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          </section>
        )}


        {activeTab === "clients" && (
          <section className="grid gap-6 lg:grid-cols-3">
            {clientMap.map((client) => (
              <Panel key={client.client} title={client.client} subtitle={`${client.tasks.length} tasks • ${client.logs.length} logs`}>
                <div className="space-y-3">
                  {client.tasks.length === 0 && client.logs.length === 0 && <EmptyState text="No tracked activity yet. Mention this client in Telegram and Lexa will connect the dots." />}
                  {client.tasks.slice(0, 5).map((task) => <TaskMini key={task.id} task={task} onMove={() => void cycleTask(task.id)} />)}
                  {client.logs.slice(0, 3).map((log) => <p key={log.id} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{log.note}</p>)}
                </div>
              </Panel>
            ))}
          </section>
        )}

        {activeTab === "content" && (
          <section className="grid gap-6 lg:grid-cols-[1fr_.85fr]">
            <Panel title="Content pipeline" subtitle="Iacovici.it, vindepemarte and reusable assets.">
              <div className="grid gap-4 md:grid-cols-2">
                {contentPipeline.contentTasks.length === 0 && <EmptyState text="No content tasks yet. Tell Lexa when a video is scripted, recorded, edited or published." />}
                {contentPipeline.contentTasks.map((task) => <TaskMini key={task.id} task={task} onMove={() => void cycleTask(task.id)} />)}
              </div>
            </Panel>
            <Panel title="Signals & ideas" subtitle="Recent content work and saved inspiration.">
              <div className="space-y-3">
                {contentPipeline.contentLogs.slice(0, 5).map((log) => <p key={log.id} className="rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{log.note}</p>)}
                {contentPipeline.inspirations.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block rounded-2xl bg-fuchsia-50 p-3 text-sm font-bold text-fuchsia-800">{item.platform}: {item.reason || item.url}</a>)}
                {contentPipeline.contentLogs.length === 0 && contentPipeline.inspirations.length === 0 && <EmptyState text="No content signals yet." />}
              </div>
            </Panel>
          </section>
        )}

        {activeTab === "analytics" && (
          <section className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <Panel title="Log time block" subtitle="Use this when you answer Lexa late or want manual tracking.">
              <form onSubmit={addTimeLog} className="space-y-3">
                <Input value={logForm.slot} onChange={(value) => setLogForm({ ...logForm, slot: value })} placeholder="Slot, e.g. 09:00–11:00" />
                <Select value={logForm.category} onChange={(value) => setLogForm({ ...logForm, category: value as TimeCategory })} options={categories} />
                <div className="grid grid-cols-2 gap-3"><Input value={logForm.hours} onChange={(value) => setLogForm({ ...logForm, hours: value })} placeholder="Hours" /><Input value={logForm.energy} onChange={(value) => setLogForm({ ...logForm, energy: value })} placeholder="Energy 1–10" /></div>
                <Textarea value={logForm.note} onChange={(value) => setLogForm({ ...logForm, note: value })} placeholder="What happened?" />
                <button className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-black text-white">Add time log</button>
              </form>
            </Panel>
            <Panel title="Action analytics" subtitle={`Average energy: ${analytics.avgEnergy.toFixed(1)}/10`}>
              <div className="grid gap-4 md:grid-cols-2">
                {state.logs.length === 0 && <EmptyState text="No time logs yet. Reply to Lexa’s check-ins or add a manual block here." />}
                {state.logs.map((log) => (
                  <article key={log.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-500"><span>{log.date}</span><span>•</span><span>{log.slot}</span><span>•</span><span>{log.hours}h</span></div>
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
                {state.inspirations.length === 0 && <EmptyState text="Save strong videos here: hooks, structures, pacing and angles worth adapting." />}
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

        {activeTab === "projects" && (
          <section className="grid gap-6 lg:grid-cols-[1fr_.75fr]">
            <Panel title="Project lanes" subtitle="One private brain, separate public brands.">
              <div className="grid gap-4 md:grid-cols-2">
                {projectMap.projects.length === 0 && <EmptyState text="No project lanes yet. Lexa can turn your brands, products and content lanes into tracked projects here." />}
                {projectMap.projects.map((project) => (
                  <ProjectCard key={project.id} item={project} kind="project" />
                ))}
              </div>
            </Panel>
            <Panel title="Accounts & handles" subtitle="Where each public lane lives.">
              <div className="space-y-4">
                {projectMap.accounts.length === 0 && <EmptyState text="No accounts saved yet. Add handles, channels and fanpages as Account entries." />}
                {projectMap.accounts.map((account) => (
                  <ProjectCard key={account.id} item={account} kind="account" />
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
                {state.ideas.length === 0 && <EmptyState text="Capture raw business ideas here. Good ideas can become experiments, content series or offers." />}
                {state.ideas.map((idea) => (
                  <article key={idea.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3"><h3 className="font-black text-slate-950">{idea.title}</h3><span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">{idea.score}/10</span></div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{idea.note}</p>
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

function ProjectCard({ item, kind }: { item: Idea; kind: "project" | "account" }) {
  const cleanTitle = item.title.replace(/^Project:\s*/, "").replace(/^Account:\s*/, "");
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">{kind === "project" ? "Project lane" : "Public account"}</p>
          <h3 className="mt-2 text-lg font-black text-slate-950">{cleanTitle}</h3>
        </div>
        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{item.status}</span>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.note}</p>
      <p className="mt-4 text-sm font-black text-indigo-700">Priority score: {item.score}/10</p>
    </article>
  );
}

function TaskMini({ task, onMove }: { task: Task; onMove: () => void }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-black text-slate-950">{task.title}</h3>
        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${priorityStyle[task.priority]}`}>{task.priority}</span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>
      <button onClick={onMove} className="mt-4 rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">{task.status}</button>
    </article>
  );
}

function Metric({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return <div className={`rounded-3xl p-4 ring-1 ${danger ? "bg-rose-50 text-rose-950 ring-rose-100" : "bg-slate-950 text-white ring-slate-800"}`}><p className="text-xs font-black uppercase tracking-[0.18em] opacity-70">{label}</p><p className="mt-2 text-2xl font-black">{value}</p></div>;
}

function Panel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return <section className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-xl shadow-slate-200/70 backdrop-blur md:p-6"><div className="mb-5"><h2 className="text-xl font-black capitalize text-slate-950">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p></div>{children}</section>;
}

function ActionCard({ title, body }: { title: string; body: string }) {
  return <article className="rounded-3xl border border-slate-200 bg-white p-5"><h3 className="font-black text-slate-950">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></article>;
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold leading-6 text-slate-500 md:col-span-2">{text}</div>;
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none ring-indigo-200 transition placeholder:text-slate-400 focus:ring-4" />;
}

function Textarea({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder: string }) {
  return <textarea value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} rows={4} className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-slate-950 outline-none ring-indigo-200 transition placeholder:text-slate-400 focus:ring-4" />;
}

function Select({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none ring-indigo-200 transition focus:ring-4">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>;
}
