"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AppState, ClientRecord, ContentItem, Idea, Inspiration, LexaSuggestion, Task, TaskPriority, TaskStatus, TimeCategory, TimeLog } from "@/lib/lifeOsDb";
import { LifeOsNav } from "@/components/life-os/LifeOsNav";
import { MobileCommandStrip } from "@/components/life-os/MobileCommandStrip";
import { categories, lexaModes, priorityStyle, type TabKey } from "@/components/life-os/constants";
import { ensureTaskMetadata, taskBelongsToClient, taskStatusLabel, uid } from "@/components/life-os/helpers";
import { ActionCard, Button, EmptyState, Input, MetricCard as Metric, Panel, Select, Textarea } from "@/components/life-os/ui";

type SyncState = "loading" | "synced" | "local" | "login" | "error";
type AuthMode = "checking" | "setup" | "login" | "ready";

const STORAGE_KEY = "iacovici-life-os:v2";
const SESSION_TOKEN_STORAGE = "iacovici-life-os:session-token";


const seededTasks: Task[] = [
  {
    id: "task-content-week",
    title: "Record Iacovici.it AI content batch",
    description:
      "Record the weekly talking-head videos from the prepared scripts. Keep each video direct, confident and useful, with room for captions and animated visual cards.",
    priority: "High",
    status: "todo",
    tags: ["iacovici", "content"],
  },
  {
    id: "task-video-pipeline",
    title: "Run video-use + hyperframes pipeline",
    description:
      "Process recorded videos on macOS with tight cuts, subtitles, movement, dynamic keywords and exports for YouTube Shorts and Instagram Reels.",
    priority: "High",
    status: "todo",
    tags: ["content"],
  },
  {
    id: "task-brand-system",
    title: "Define Iacovici.it brand system",
    description:
      "Clarify promise, audience, visual rules, recurring series, free community, future course offer and tone of voice.",
    priority: "Medium",
    status: "in-progress",
    tags: ["iacovici", "brand"],
  },
];

const defaultState: AppState = {
  tasks: seededTasks,
  logs: [],
  inspirations: [],
  ideas: [],
  clients: [],
  clientProjects: [],
  contentItems: [],
  lexaSuggestions: [],
  dailyJournals: [],
  businessUnits: [],
  finalValuableProducts: [],
  adminStatistics: [],
  operatingConditions: [],
  battlePlans: [],
  battlePlanItems: [],
  executionReports: [],
};


function loadLocalState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return defaultState;
    const parsed = JSON.parse(saved) as Partial<AppState>;
    return {
      tasks: parsed.tasks?.length ? ensureTaskMetadata(parsed.tasks) : seededTasks,
      logs: parsed.logs ?? [],
      inspirations: parsed.inspirations ?? [],
      ideas: parsed.ideas ?? [],
      clients: parsed.clients ?? [],
      clientProjects: parsed.clientProjects ?? [],
      contentItems: parsed.contentItems ?? [],
      lexaSuggestions: parsed.lexaSuggestions ?? [],
      dailyJournals: parsed.dailyJournals ?? [],
      businessUnits: parsed.businessUnits ?? [],
      finalValuableProducts: parsed.finalValuableProducts ?? [],
      adminStatistics: parsed.adminStatistics ?? [],
      operatingConditions: parsed.operatingConditions ?? [],
      battlePlans: parsed.battlePlans ?? [],
      battlePlanItems: parsed.battlePlanItems ?? [],
      executionReports: parsed.executionReports ?? [],
    };
  } catch {
    return defaultState;
  }
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

  const [taskForm, setTaskForm] = useState({ title: "", description: "", priority: "Medium" as TaskPriority, clientId: "", clientProjectId: "", dueDate: "", tags: [] as string[] });
  const [taskFilter, setTaskFilter] = useState({ status: "all", clientId: "all", tag: "all" });
  const [selectedClientKey, setSelectedClientKey] = useState("");
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

  const allTaskTags = useMemo(() => [...new Set(state.tasks.flatMap((task) => task.tags ?? []))].sort(), [state.tasks]);

  const clientMap = useMemo(() => {
    const structuredClients = state.clients.map((client) => ({
      client: client.name,
      record: client,
      projects: state.clientProjects.filter((project) => project.clientId === client.id),
      tasks: state.tasks.filter((task) => taskBelongsToClient(task, client)),
      logs: state.logs.filter((log) => log.note.toLowerCase().includes(client.name.toLowerCase())),
      content: state.contentItems.filter((item) => `${item.brand} ${item.title} ${item.scriptNotes}`.toLowerCase().includes(client.name.toLowerCase())),
      suggestions: state.lexaSuggestions.filter((suggestion) => suggestion.relatedEntityId === client.id || `${suggestion.title} ${suggestion.body}`.toLowerCase().includes(client.name.toLowerCase())),
    }));
    if (structuredClients.length) return structuredClients;
    const fallbackClients = ["ABC Vetrate Panoramiche", "ProHappyA", "Catalin"];
    return fallbackClients.map((client) => ({
      client,
      record: null as ClientRecord | null,
      projects: [],
      tasks: state.tasks.filter((task) => task.tags.some((tag) => client.toLowerCase().includes(tag.toLowerCase())) || `${task.title} ${task.description}`.toLowerCase().includes(client.toLowerCase())),
      logs: state.logs.filter((log) => log.note.toLowerCase().includes(client.toLowerCase())),
      content: state.contentItems.filter((item) => `${item.brand} ${item.title}`.toLowerCase().includes(client.toLowerCase())),
      suggestions: state.lexaSuggestions.filter((suggestion) => `${suggestion.title} ${suggestion.body}`.toLowerCase().includes(client.toLowerCase())),
    }));
  }, [state.clientProjects, state.clients, state.contentItems, state.lexaSuggestions, state.logs, state.tasks]);

  const selectedClient = clientMap.find((client) => (client.record?.id || client.client) === selectedClientKey) ?? clientMap[0];

  const adminOverview = useMemo(() => {
    const conditions = new Map(state.operatingConditions.map((condition) => [condition.code, condition]));
    const statsByUnit = new Map<string, typeof state.adminStatistics>();
    for (const stat of state.adminStatistics) {
      statsByUnit.set(stat.businessUnitId, [...(statsByUnit.get(stat.businessUnitId) ?? []), stat]);
    }
    const fvpsByUnit = new Map<string, typeof state.finalValuableProducts>();
    for (const fvp of state.finalValuableProducts) {
      fvpsByUnit.set(fvp.businessUnitId, [...(fvpsByUnit.get(fvp.businessUnitId) ?? []), fvp]);
    }
    return { conditions, statsByUnit, fvpsByUnit };
  }, [state]);

  const visibleTasks = useMemo(() => {
    return state.tasks.filter((task) => {
      if (taskFilter.status !== "all" && task.status !== taskFilter.status) return false;
      if (taskFilter.clientId !== "all") {
        const client = state.clients.find((item) => item.id === taskFilter.clientId);
        if (client && !taskBelongsToClient(task, client)) return false;
      }
      if (taskFilter.tag !== "all" && !task.tags.includes(taskFilter.tag)) return false;
      return true;
    });
  }, [state.clients, state.tasks, taskFilter]);

  const openVisibleTasks = visibleTasks.filter((task) => task.status !== "done");
  const doneVisibleTasks = visibleTasks.filter((task) => task.status === "done");
  const urgentVisibleTasks = openVisibleTasks.filter((task) => task.priority === "High").slice(0, 3);

  const battlePlan = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const tasks = state.tasks
      .filter((task) => task.dueDate === today && (task.tags ?? []).includes("battle-plan"))
      .sort((a, b) => {
        const aDone = a.status === "done" ? 1 : 0;
        const bDone = b.status === "done" ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;
        const priorityRank: Record<TaskPriority, number> = { High: 0, Medium: 1, Low: 2 };
        return priorityRank[a.priority] - priorityRank[b.priority];
      });
    const done = tasks.filter((task) => task.status === "done").length;
    const next = tasks.find((task) => task.status !== "done");
    const percent = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return { today, tasks, done, next, percent };
  }, [state.tasks]);

  const contentPipeline = useMemo(() => {
    const contentTasks = state.tasks.filter((task) => /iacovici|video|reels|shorts|vindepemarte|content|zâmbetin|youtube/i.test(`${task.title} ${task.description} ${task.tags.join(" ")}`));
    const contentLogs = state.logs.filter((log) => /iacovici|video|reels|shorts|vindepemarte|content/i.test(log.note));
    return { items: state.contentItems, contentTasks, contentLogs, inspirations: state.inspirations.slice(0, 6) };
  }, [state.contentItems, state.inspirations, state.logs, state.tasks]);

  const projectMap = useMemo(() => {
    const projects = state.ideas.filter((idea) => idea.title.startsWith("Project:"));
    const accounts = state.ideas.filter((idea) => idea.title.startsWith("Account:"));
    return { projects, accounts };
  }, [state.ideas]);

  async function addTask(event: FormEvent) {
    event.preventDefault();
    if (!taskForm.title.trim()) return;
    const selectedClient = state.clients.find((client) => client.id === taskForm.clientId);
    const selectedProject = state.clientProjects.find((project) => project.id === taskForm.clientProjectId);
    const optimistic: Task = {
      id: uid("task"),
      title: taskForm.title.trim(),
      description: taskForm.description.trim(),
      priority: taskForm.priority,
      status: "todo",
      clientId: taskForm.clientId || undefined,
      clientName: selectedClient?.name,
      clientProjectId: taskForm.clientProjectId || undefined,
      clientProjectTitle: selectedProject?.title,
      dueDate: taskForm.dueDate || undefined,
      tags: taskForm.tags,
      source: "web",
    };
    setState((current) => ({ ...current, tasks: [optimistic, ...current.tasks] }));
    setTaskForm({ title: "", description: "", priority: "Medium", clientId: "", clientProjectId: "", dueDate: "", tags: [] });
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
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-xl shadow-slate-200/60 backdrop-blur md:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-indigo-600">Iacovici.it Life OS</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">Today: one clear next move.</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
                This screen should reduce noise, not create it. Open the full archive only when you need context.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:w-[24rem]">
              <Metric label="Open" value={`${commandCenter.activeTasks.length}`} />
              <Metric label="Done" value={`${state.tasks.filter((task) => task.status === "done").length}`} />
              <Metric label="Scroll" value={`${analytics.scrollingHours.toFixed(1)}h`} danger />
            </div>
          </div>
          <details className="mt-4 rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <summary className="cursor-pointer text-sm font-black text-slate-700">Sync + login</summary>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
          </details>
        </header>

        <MobileCommandStrip nextTaskTitle={commandCenter.nextTask?.title || "Choose one money/content action"} energy={commandCenter.latestEnergy || 0} onChangeTab={setActiveTab} />
        <LifeOsNav activeTab={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" && (
          <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
            <Panel title="Today Command Center" subtitle="What matters now, not an endless list.">
              <div className="grid gap-4 sm:grid-cols-3">
                <ActionCard title="Battle plan" body={battlePlan.next ? `${battlePlan.done}/${battlePlan.tasks.length} done • Next: ${battlePlan.next.title}` : "No Battle Plan for today yet. Ask Lexa to create one."} />
                <ActionCard title="Next move" body={battlePlan.next ? battlePlan.next.description || battlePlan.next.title : commandCenter.nextTask ? commandCenter.nextTask.description || commandCenter.nextTask.title : "Choose one small money/content/energy action."} />
                <ActionCard title="Energy" body={commandCenter.latestEnergy ? `${commandCenter.latestEnergy}/10 — adjust workload to reality.` : "Log energy in Telegram so Lexa can pace the day."} />
              </div>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl bg-emerald-50 p-5 text-emerald-950 ring-1 ring-emerald-100">
                  <p className="font-black">Done journal</p>
                  <ul className="mt-2 space-y-2 text-sm leading-6">
                    {state.dailyJournals[0]?.doneItems.length ? state.dailyJournals[0].doneItems.map((item) => <li key={item}>✓ {item}</li>) : null}
                    {!state.dailyJournals[0]?.doneItems.length && commandCenter.done.length === 0 && <li>No completions yet today.</li>}
                    {!state.dailyJournals[0]?.doneItems.length && commandCenter.done.map((task) => <li key={task.id}>✓ {task.title}</li>)}
                  </ul>
                  {state.dailyJournals[0]?.notes && <p className="mt-3 text-sm leading-6">{state.dailyJournals[0].notes}</p>}
                </div>
                <div className="rounded-3xl bg-indigo-50 p-5 text-indigo-950 ring-1 ring-indigo-100">
                  <p className="font-black">Lexa proactivity</p>
                  <p className="mt-2 text-sm leading-6">Morning plan, pre-call briefs and evening Done Journal are active. Keep Telegram updates short; Lexa structures the rest.</p>
                  <div className="mt-4 space-y-2">
                    {state.lexaSuggestions.slice(0, 2).map((suggestion) => <SuggestionMini key={suggestion.id} suggestion={suggestion} />)}
                  </div>
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

        {activeTab === "admin" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.72fr]">
            <Panel title="Administrative Scale" subtitle="Scopo → FVP → statistiche → condizione → formula → battle plan → rapporto.">
              <div className="grid gap-4 md:grid-cols-2">
                {state.businessUnits.map((unit) => {
                  const condition = adminOverview.conditions.get(unit.currentCondition);
                  const unitStats = adminOverview.statsByUnit.get(unit.id) ?? [];
                  const unitFvps = adminOverview.fvpsByUnit.get(unit.id) ?? [];
                  return (
                    <article key={unit.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-500">{unit.category.replace("_", " ")}</p>
                          <h3 className="mt-2 text-lg font-black text-slate-950">{unit.name}</h3>
                        </div>
                        <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">{condition?.name || unit.currentCondition}</span>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-slate-600">{unit.purpose}</p>
                      <div className="mt-4 grid gap-3">
                        <ActionCard title="FVP" body={unitFvps[0]?.name || unit.mainFvp || "Missing final valuable product"} />
                        <ActionCard title="Main statistic" body={unitStats[0] ? `${unitStats[0].name}: ${unitStats[0].latestValue ?? "no data yet"} ${unitStats[0].unit}` : unit.mainStatistic || "Missing statistic"} />
                        <ActionCard title="Formula" body={condition?.formulaSteps?.slice(0, 3).join(" → ") || unit.conditionFormula || "No formula attached"} />
                      </div>
                      <details className="mt-4 rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <summary className="cursor-pointer text-sm font-black text-slate-600">Strategic plan + lines</summary>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{unit.strategicPlan}</p>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {unit.criticalLines.map((line) => <span key={line} className="rounded-full bg-white px-2.5 py-1 text-[11px] font-black text-indigo-700 ring-1 ring-indigo-100">{line}</span>)}
                        </div>
                      </details>
                    </article>
                  );
                })}
                {state.businessUnits.length === 0 && <EmptyState text="Admin Battle Plan schema is not loaded yet. Run the migration or log in to cloud sync." />}
              </div>
            </Panel>
            <div className="space-y-5 min-w-0">
              <Panel title="Portfolio lanes" subtitle="Approved separation.">
                <div className="space-y-3">
                  <ActionCard title="Business nostri" body="Iacovici.it • ProHappyA • Vindepemarte Music/Fun • Zâmbetin TV" />
                  <ActionCard title="Client Delivery" body="ABC and future clients: track only Alexandru deliverables, proofs, approved follow-ups and payments." />
                  <ActionCard title="Prospects / Lead pipeline" body="Potential clients not closed yet: research, demos, outreach only when approved, next-stage evidence." />
                </div>
              </Panel>
              <Panel title="Battle plans & reports" subtitle="Execution must end with proof.">
                <div className="space-y-3">
                  {state.battlePlans.slice(0, 4).map((plan) => <ActionCard key={plan.id} title={plan.title} body={`${plan.businessUnitName || "Portfolio"} • ${plan.planType} • ${plan.status}\n${plan.periodStart} → ${plan.periodEnd}`} />)}
                  {state.battlePlans.length === 0 && <EmptyState text="No formal battle plan stored yet. Lexa can now create daily/weekly plans against business units and statistics." />}
                  {state.executionReports.slice(0, 3).map((report) => <ActionCard key={report.id} title={report.title} body={`${report.businessUnitName || "Portfolio"} • ${report.reportType}\n${report.summary || report.nextAction}`} />)}
                </div>
              </Panel>
            </div>
          </section>
        )}

        {activeTab === "battle" && (
          <section className="grid gap-5 xl:grid-cols-[1fr_.72fr]">
            <Panel title="Battle Plan of Today" subtitle={`Database view for ${battlePlan.today}: ${battlePlan.done}/${battlePlan.tasks.length} checked • ${battlePlan.percent}% complete.`}>
              <div className="overflow-hidden rounded-full bg-slate-100">
                <div className="h-3 rounded-full bg-slate-950 transition-all" style={{ width: `${battlePlan.percent}%` }} />
              </div>
              {battlePlan.next && (
                <div className="mt-5 rounded-3xl bg-indigo-50 p-5 text-indigo-950 ring-1 ring-indigo-100">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Next one</p>
                  <h2 className="mt-2 text-xl font-black text-slate-950">{battlePlan.next.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{battlePlan.next.description}</p>
                  <button onClick={() => void cycleTask(battlePlan.next!.id)} className="mt-4 min-h-11 rounded-full bg-slate-950 px-5 py-2 text-sm font-black text-white hover:bg-indigo-700">{taskStatusLabel(battlePlan.next.status)}</button>
                </div>
              )}
              <div className="mt-5 grid gap-3">
                {battlePlan.tasks.map((task) => <TaskMini key={task.id} task={task} onMove={() => void cycleTask(task.id)} compact />)}
                {battlePlan.tasks.length === 0 && <EmptyState text="No daily Battle Plan tasks yet. Tell Lexa what must be done today and they will appear here." />}
              </div>
            </Panel>
            <div className="space-y-5 min-w-0">
              <Panel title="19:00 finish line" subtitle="Use this to avoid scope creep.">
                <div className="space-y-3">
                  <ActionCard title="Must finish" body="Iacovici.it 2 videos • Godfather song 4/6 • 2 vindepemarte music reels" />
                  <ActionCard title="Support tasks" body="Google Drive OAuth setup • ProHappyA structure • ABC response check" />
                  <ActionCard title="Rule" body="Check each task after it is done. Click Details to see exactly what output is expected." />
                </div>
              </Panel>
              <Panel title="General Tasks stays clean" subtitle="Battle is just today's filtered view.">
                <p className="text-sm leading-6 text-slate-600">The main Tasks tab remains the full execution board. This tab only shows tasks tagged <strong>battle-plan</strong> with today&apos;s due date, so Lexa can update the day without sending you another file.</p>
              </Panel>
            </div>
          </section>
        )}

        {activeTab === "tasks" && (
          <section className="grid gap-5">
            <Panel title="Focus board" subtitle={`${openVisibleTasks.length} open commitments. Done items stay hidden unless you ask for them.`}>
              <div className="grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <Select value={taskFilter.status === "done" ? "all" : taskFilter.status} onChange={(value) => setTaskFilter({ ...taskFilter, status: value })} options={["all", "todo", "in-progress"]} />
                <select value={taskFilter.clientId} onChange={(event) => setTaskFilter({ ...taskFilter, clientId: event.target.value })} className="w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 outline-none ring-indigo-200 transition focus:ring-4">
                  <option value="all">all clients</option>
                  {state.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                </select>
                <button onClick={() => setTaskFilter({ status: "all", clientId: "all", tag: "all" })} className="min-h-11 rounded-2xl bg-slate-100 px-4 text-sm font-black text-slate-700">Reset</button>
              </div>
              {urgentVisibleTasks.length > 0 && (
                <div className="mt-4 rounded-3xl bg-rose-50 p-4 ring-1 ring-rose-100">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-rose-700">Needs attention</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {urgentVisibleTasks.map((task) => <TaskMini key={task.id} task={task} onMove={() => void cycleTask(task.id)} compact />)}
                  </div>
                </div>
              )}
            </Panel>

            <div className="grid gap-4 lg:grid-cols-2">
              {(["todo", "in-progress"] as TaskStatus[]).map((status) => {
                const laneTasks = visibleTasks.filter((task) => task.status === status).slice(0, 6);
                return (
                  <Panel key={status} title={status === "todo" ? "Next" : "Doing"} subtitle={`${laneTasks.length} shown. Keep the page breathable.`}>
                    <div className="space-y-3">
                      {laneTasks.map((task) => <TaskMini key={task.id} task={task} onMove={() => void cycleTask(task.id)} compact />)}
                      {laneTasks.length === 0 && <EmptyState text="Nothing here. Good — do not fill space just because it exists." />}
                    </div>
                  </Panel>
                );
              })}
            </div>

            <details className="rounded-[1.75rem] border border-white/80 bg-white/80 p-4 shadow-lg shadow-slate-200/40">
              <summary className="cursor-pointer text-sm font-black text-slate-700">Add task / archive / advanced filters</summary>
              <div className="mt-4 grid gap-5 xl:grid-cols-[360px_1fr]">
                <form onSubmit={addTask} className="space-y-3 rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-100">
                  <Input value={taskForm.title} onChange={(value) => setTaskForm({ ...taskForm, title: value })} placeholder="Task title" />
                  <Textarea value={taskForm.description} onChange={(value) => setTaskForm({ ...taskForm, description: value })} placeholder="Why it matters / next concrete step" rows={3} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Select value={taskForm.priority} onChange={(value) => setTaskForm({ ...taskForm, priority: value as TaskPriority })} options={["Low", "Medium", "High"]} />
                    <Input value={taskForm.dueDate} onChange={(value) => setTaskForm({ ...taskForm, dueDate: value })} placeholder="Due date YYYY-MM-DD" />
                  </div>
                  <select value={taskForm.clientId} onChange={(event) => setTaskForm({ ...taskForm, clientId: event.target.value, clientProjectId: "" })} className="w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-950 outline-none ring-indigo-200 transition focus:ring-4 sm:text-sm">
                    <option value="">No client / personal</option>
                    {state.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
                  </select>
                  <select value={taskForm.clientProjectId} onChange={(event) => setTaskForm({ ...taskForm, clientProjectId: event.target.value })} className="w-full min-h-11 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-950 outline-none ring-indigo-200 transition focus:ring-4 sm:text-sm">
                    <option value="">No project</option>
                    {state.clientProjects.filter((project) => taskForm.clientId && project.clientId === taskForm.clientId).map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                  </select>
                  <Button className="w-full bg-slate-950 text-white hover:bg-indigo-700">Add task</Button>
                </form>
                <div className="space-y-4 min-w-0">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Select value={taskFilter.tag} onChange={(value) => setTaskFilter({ ...taskFilter, tag: value })} options={["all", ...allTaskTags]} />
                    <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-500 ring-1 ring-slate-100">{doneVisibleTasks.length} done items hidden from the main board.</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {doneVisibleTasks.slice(0, 8).map((task) => <TaskMini key={task.id} task={task} onMove={() => void cycleTask(task.id)} compact />)}
                  </div>
                </div>
              </div>
            </details>
          </section>
        )}


        {activeTab === "clients" && (
          <section className="grid gap-6 xl:grid-cols-[320px_1fr]">
            <Panel title="Client command" subtitle="Pick the account, then execute the next visible commitment.">
              <div className="space-y-2">
                {clientMap.map((client) => (
                  <button key={client.client} onClick={() => setSelectedClientKey(client.record?.id || client.client)} className={`w-full rounded-2xl p-3 text-left transition ${selectedClient?.client === client.client ? "bg-slate-950 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"}`}>
                    <span className="block break-words text-sm font-black">{client.client}</span>
                    <span className="mt-1 block text-xs opacity-70">{client.projects.length} projects • {client.tasks.filter((task) => task.status !== "done").length} open • {client.logs.length} logs</span>
                  </button>
                ))}
              </div>
            </Panel>
            {selectedClient && (
              <Panel title={selectedClient.client} subtitle="One account, one next action. Secondary history is collapsed below.">
                <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
                  <article className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-700 ring-1 ring-slate-100">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-white px-2 py-1 text-xs font-black uppercase text-slate-500">{selectedClient.record?.status || "tracked"}</span>
                      {selectedClient.record?.priority && <span className={`rounded-full px-2 py-1 text-xs font-black uppercase ${priorityStyle[selectedClient.record.priority]}`}>{selectedClient.record.priority}</span>}
                    </div>
                    {selectedClient.record?.nextAction && <p className="mt-3 rounded-2xl bg-white p-3 font-black text-slate-950">Next: {selectedClient.record.nextAction}</p>}
                    {selectedClient.record?.notes && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-xs font-black uppercase tracking-wide text-slate-400">Client context</summary>
                        <p className="mt-2 break-words whitespace-pre-wrap">{selectedClient.record.notes}</p>
                      </details>
                    )}
                  </article>
                  <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
                    <Metric label="Open" value={`${selectedClient.tasks.filter((task) => task.status !== "done").length}`} />
                    <Metric label="Projects" value={`${selectedClient.projects.length}`} />
                    <Metric label="Signals" value={`${selectedClient.logs.length + selectedClient.content.length}`} />
                  </div>
                </div>
                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Visible commitments</h3>
                    {selectedClient.tasks.filter((task) => task.status !== "done").slice(0, 4).map((task) => <TaskMini key={task.id} task={task} onMove={() => void cycleTask(task.id)} compact />)}
                    {selectedClient.tasks.filter((task) => task.status !== "done").length === 0 && <EmptyState text="No open task for this client." />}
                  </div>
                  <div className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-[0.18em] text-slate-500">Projects</h3>
                    {selectedClient.projects.slice(0, 3).map((project) => <ProjectMini key={project.id} project={project} />)}
                    {selectedClient.projects.length === 0 && <EmptyState text="No project attached yet." />}
                    <details className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                      <summary className="cursor-pointer text-sm font-black text-slate-600">Logs, content & Lexa archive</summary>
                      <div className="mt-3 space-y-3">
                        {selectedClient.logs.slice(0, 4).map((log) => <p key={log.id} className="break-words rounded-2xl bg-white p-3 text-sm leading-6 text-slate-600">{log.note}</p>)}
                        {selectedClient.content.slice(0, 3).map((item) => <ContentMini key={item.id} item={item} />)}
                        {selectedClient.suggestions.slice(0, 3).map((suggestion) => <SuggestionMini key={suggestion.id} suggestion={suggestion} />)}
                        {selectedClient.logs.length + selectedClient.content.length + selectedClient.suggestions.length === 0 && <EmptyState text="No recent signal yet." />}
                      </div>
                    </details>
                  </div>
                </div>
              </Panel>
            )}
          </section>
        )}

        {activeTab === "content" && (
          <section className="grid gap-6 xl:grid-cols-[1fr_.85fr]">
            <Panel title="Content command room" subtitle="Separate Iacovici.it, vindepemarte and client content without losing production momentum.">
              <div className="grid gap-4 md:grid-cols-2">
                {contentPipeline.items.length === 0 && contentPipeline.contentTasks.length === 0 && <EmptyState text="No content tasks yet. Tell Lexa when a video is scripted, recorded, edited or published." />}
                {contentPipeline.items.slice(0, 4).map((item) => <ContentMini key={item.id} item={item} />)}
                {contentPipeline.contentTasks.filter((task) => task.status !== "done").slice(0, 6).map((task) => <TaskMini key={task.id} task={task} onMove={() => void cycleTask(task.id)} compact />)}
              </div>
            </Panel>
            <div className="space-y-6 min-w-0">
              <Panel title="Signals" subtitle="Research should become output, not another scroll loop.">
                <div className="space-y-3">
                  {contentPipeline.contentLogs.slice(0, 4).map((log) => <p key={log.id} className="break-words rounded-2xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">{log.note}</p>)}
                  {contentPipeline.inspirations.slice(0, 4).map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer" className="block break-words rounded-2xl bg-fuchsia-50 p-3 text-sm font-bold text-fuchsia-800">{item.platform}: {item.reason || item.url}</a>)}
                  {contentPipeline.contentLogs.length === 0 && contentPipeline.inspirations.length === 0 && <EmptyState text="No content signals yet." />}
                </div>
              </Panel>
              <Panel title="Lexa packaging rules" subtitle="Use this as the creative operating system guardrail.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <ActionCard title="Iacovici.it" body="Italian + English practical AI workflow content. Save proof, prompt, screen recording and CTA together." />
                  <ActionCard title="vindepemarte" body="Music/lore lane stays separate from comedy. Track language, audience signal and release asset status." />
                  <ActionCard title="Zâmbetin TV" body="Romanian kids channel: calm, playful, 2–4 years old. Long video first, Shorts pack after." />
                  <ActionCard title="Anti-scroll rule" body="Every saved inspiration needs a pattern: hook, pacing, visual device or offer angle." />
                </div>
              </Panel>
            </div>
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
                {state.logs.slice(0, 8).map((log) => (
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
                {state.inspirations.slice(0, 8).map((item) => (
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
          <section className="grid gap-6 xl:grid-cols-[1fr_.75fr]">
            <Panel title="Business project lanes" subtitle="Client delivery, internal products and public brands in one clean map.">
              <div className="grid gap-4 md:grid-cols-2">
                {state.clientProjects.slice(0, 6).map((project) => <ProjectMini key={project.id} project={project} />)}
                {projectMap.projects.slice(0, 6).map((project) => (
                  <ProjectCard key={project.id} item={project} kind="project" />
                ))}
                {state.clientProjects.length === 0 && projectMap.projects.length === 0 && <EmptyState text="No project lanes yet. Lexa can turn your brands, products and content lanes into tracked projects here." />}
              </div>
            </Panel>
            <div className="space-y-6 min-w-0">
              <Panel title="Money-first focus" subtitle="Make client commitments impossible to miss.">
                <div className="space-y-3">
                  {clientMap.slice(0, 5).map((client) => <ActionCard key={client.client} title={client.client} body={`Next: ${client.record?.nextAction || "define next action"}\nOpen tasks: ${client.tasks.filter((task) => task.status !== "done").length}\nProjects: ${client.projects.length}`} />)}
                </div>
              </Panel>
              <Panel title="Accounts & handles" subtitle="Where each public lane lives.">
                <div className="space-y-4">
                  {projectMap.accounts.length === 0 && <EmptyState text="No accounts saved yet. Add handles, channels and fanpages as Account entries." />}
                  {projectMap.accounts.slice(0, 6).map((account) => (
                    <ProjectCard key={account.id} item={account} kind="account" />
                  ))}
                </div>
              </Panel>
            </div>
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
                {state.ideas.slice(0, 8).map((idea) => (
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

function TaskMini({ task, onMove, compact = false }: { task: Task; onMove: () => void; compact?: boolean }) {
  return (
    <article className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 break-words font-black text-slate-950">{task.title}</h3>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${priorityStyle[task.priority]}`}>{task.priority}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
        {task.clientName && <span>{task.clientName}</span>}
        {task.dueDate && <span className="text-amber-700">Due {task.dueDate}</span>}
      </div>
      {!compact && <TaskMetaBadges task={task} />}
      {!compact && task.description && <p className="mt-3 break-words whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>}
      {compact && task.description && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-black text-slate-500">Details</summary>
          <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-slate-600">{task.description}</p>
          <TaskMetaBadges task={task} />
        </details>
      )}
      <button onClick={onMove} className="mt-4 min-h-11 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200">{taskStatusLabel(task.status)}</button>
    </article>
  );
}

function TaskMetaBadges({ task }: { task: Task }) {
  const chips = [task.clientName, task.clientProjectTitle, ...task.tags].filter(Boolean).slice(0, 6);
  if (!chips.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <span key={chip} className="max-w-full break-words rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-black text-indigo-700 ring-1 ring-indigo-100">
          {chip}
        </span>
      ))}
    </div>
  );
}

function ProjectMini({ project }: { project: { title: string; status: string; notes: string; deadline: string; valueEstimate: number } }) {
  return (
    <article className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-indigo-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-black">{project.title}</h3>
        <span className="rounded-full bg-white px-2.5 py-1 text-xs font-black uppercase text-indigo-700">{project.status}</span>
      </div>
      {project.notes && <p className="mt-2 text-sm leading-6">{project.notes}</p>}
      {(project.deadline || project.valueEstimate > 0) && <p className="mt-3 text-xs font-black uppercase tracking-wide opacity-70">{project.deadline || "No deadline"} {project.valueEstimate > 0 ? `• €${project.valueEstimate}` : ""}</p>}
    </article>
  );
}

function ContentMini({ item }: { item: ContentItem }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-fuchsia-500">{item.brand} • {item.platform}</p>
          <h3 className="mt-2 font-black text-slate-950">{item.title}</h3>
        </div>
        <span className="rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-black uppercase text-fuchsia-700">{item.status}</span>
      </div>
      {item.hook && <p className="mt-3 text-sm font-bold leading-6 text-slate-800">Hook: {item.hook}</p>}
      {item.scriptNotes && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{item.scriptNotes}</p>}
      {(item.plannedDate || item.publishUrl) && <p className="mt-3 text-xs font-black uppercase tracking-wide text-slate-400">{item.plannedDate || "published"} {item.publishUrl ? "• live link saved" : ""}</p>}
    </article>
  );
}

function SuggestionMini({ suggestion }: { suggestion: LexaSuggestion }) {
  return (
    <article className="rounded-2xl bg-white/70 p-3 text-sm leading-6 ring-1 ring-indigo-100">
      <div className="flex items-start justify-between gap-2"><p className="font-black">{suggestion.title}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${priorityStyle[suggestion.priority]}`}>{suggestion.priority}</span></div>
      {suggestion.body && <p className="mt-1 text-indigo-900/80">{suggestion.body}</p>}
    </article>
  );
}
