import { Pool } from "pg";

export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "Low" | "Medium" | "High";
export type TimeCategory =
  | "Produzione"
  | "Studio/Ricerca"
  | "Business/Admin"
  | "Salute/Energia"
  | "Relazioni/Casa"
  | "Procrastinazione/Scrolling"
  | "Riposo"
  | "Altro";

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
};

export type TimeLog = {
  id: string;
  date: string;
  slot: string;
  category: TimeCategory;
  hours: number;
  note: string;
  energy: number;
};

export type Inspiration = {
  id: string;
  url: string;
  reason: string;
  pattern: string;
  platform: "Instagram" | "YouTube" | "TikTok" | "X/Twitter" | "Other";
  status: "saved" | "analyzed" | "adapted";
};

export type Idea = {
  id: string;
  title: string;
  note: string;
  score: number;
  status: "raw" | "research" | "build" | "paused";
};

export type AppState = {
  tasks: Task[];
  logs: TimeLog[];
  inspirations: Inspiration[];
  ideas: Idea[];
};

const connectionString = process.env.LIFE_OS_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

let pool: Pool | undefined;

function getPool() {
  if (!connectionString) {
    throw new Error("Missing LIFE_OS_DATABASE_URL");
  }
  pool ??= new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
  return pool;
}

const defaultTasks: Task[] = [
  {
    id: "task-content-week",
    title: "Record Iacovici.it AI content batch",
    description:
      "Record the weekly talking-head videos from the prepared scripts. Keep them concise, clear and energetic, with space for captions and animated visual cards.",
    priority: "High",
    status: "todo",
  },
  {
    id: "task-video-pipeline",
    title: "Run video-use + hyperframes pipeline",
    description:
      "Process recorded videos on macOS with tight cuts, captions, camera movement, animated keywords and exports for Shorts/Reels.",
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

export const emptyState: AppState = {
  tasks: defaultTasks,
  logs: [],
  inspirations: [],
  ideas: [],
};

function taskStatusFromDb(status: string): TaskStatus {
  return status === "doing" ? "in-progress" : (status as TaskStatus);
}

function taskStatusToDb(status: TaskStatus) {
  return status === "in-progress" ? "doing" : status;
}

function priorityFromDb(priority: string): TaskPriority {
  if (priority === "high") return "High";
  if (priority === "low") return "Low";
  return "Medium";
}

function priorityToDb(priority: TaskPriority) {
  return priority.toLowerCase();
}

function platformFromDb(platform: string): Inspiration["platform"] {
  if (["Instagram", "YouTube", "TikTok", "X/Twitter", "Other"].includes(platform)) return platform as Inspiration["platform"];
  return "Other";
}

function ideaStatusFromDb(status: string): Idea["status"] {
  if (status === "researching") return "research";
  if (status === "building") return "build";
  if (status === "parked") return "paused";
  return "raw";
}

export async function getLifeOsState(): Promise<AppState> {
  const db = getPool();
  const [tasks, logs, inspirations, ideas] = await Promise.all([
    db.query("select id::text, title, notes, priority, status from life_os.tasks order by updated_at desc, created_at desc"),
    db.query("select id::text, log_date, start_time, end_time, category, hours, note, energy from life_os.time_logs order by log_date desc, created_at desc"),
    db.query("select id::text, url, platform, title, saved_reason, pattern_notes, status from life_os.inspiration_links order by updated_at desc, created_at desc"),
    db.query("select id::text, title, description, score, status, lexa_comment from life_os.business_ideas order by updated_at desc, created_at desc"),
  ]);

  return {
    tasks: tasks.rows.length
      ? tasks.rows.map((row) => ({
          id: row.id,
          title: row.title,
          description: row.notes || "",
          priority: priorityFromDb(row.priority),
          status: taskStatusFromDb(row.status),
        }))
      : defaultTasks,
    logs: logs.rows.map((row) => ({
      id: row.id,
      date: row.log_date ? new Date(row.log_date).toISOString().slice(0, 10) : "",
      slot: [row.start_time?.slice(0, 5), row.end_time?.slice(0, 5)].filter(Boolean).join("–") || "manual entry",
      category: row.category,
      hours: Number(row.hours || 0),
      note: row.note || "",
      energy: Number(row.energy || 0),
    })),
    inspirations: inspirations.rows.map((row) => ({
      id: row.id,
      url: row.url,
      reason: row.saved_reason || row.title || "",
      pattern: row.pattern_notes || "",
      platform: platformFromDb(row.platform),
      status: row.status === "used" ? "adapted" : row.status,
    })),
    ideas: ideas.rows.map((row) => ({
      id: row.id,
      title: row.title,
      note: [row.description, row.lexa_comment ? `Lexa: ${row.lexa_comment}` : ""].filter(Boolean).join("\n\n"),
      score: Number(row.score || 0),
      status: ideaStatusFromDb(row.status),
    })),
  };
}

export async function createTask(input: Omit<Task, "id" | "status">) {
  const result = await getPool().query(
    "insert into life_os.tasks (title, notes, priority, status) values ($1, $2, $3, 'todo') returning id::text, title, notes, priority, status",
    [input.title, input.description, priorityToDb(input.priority)],
  );
  const row = result.rows[0];
  return { id: row.id, title: row.title, description: row.notes || "", priority: priorityFromDb(row.priority), status: taskStatusFromDb(row.status) } satisfies Task;
}

export async function createTimeLog(input: Omit<TimeLog, "id" | "date"> & { date?: string; source?: string }) {
  const [startTime, endTime] = input.slot.includes("–") ? input.slot.split("–") : input.slot.split("-");
  const result = await getPool().query(
    `insert into life_os.time_logs (log_date, start_time, end_time, category, hours, energy, note, source)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id::text, log_date, start_time, end_time, category, hours, note, energy`,
    [input.date || new Date().toISOString().slice(0, 10), startTime?.trim() || null, endTime?.trim() || null, input.category, input.hours, input.energy, input.note, input.source || "manual"],
  );
  const row = result.rows[0];
  return {
    id: row.id,
    date: new Date(row.log_date).toISOString().slice(0, 10),
    slot: [row.start_time?.slice(0, 5), row.end_time?.slice(0, 5)].filter(Boolean).join("–") || input.slot || "manual entry",
    category: row.category,
    hours: Number(row.hours || 0),
    note: row.note || "",
    energy: Number(row.energy || 0),
  } satisfies TimeLog;
}

export async function createInspiration(input: Omit<Inspiration, "id" | "status">) {
  const result = await getPool().query(
    `insert into life_os.inspiration_links (url, platform, saved_reason, pattern_notes, status)
     values ($1, $2, $3, $4, 'saved')
     returning id::text, url, platform, saved_reason, pattern_notes, status`,
    [input.url, input.platform, input.reason, input.pattern],
  );
  const row = result.rows[0];
  return { id: row.id, url: row.url, reason: row.saved_reason || "", pattern: row.pattern_notes || "", platform: platformFromDb(row.platform), status: row.status } satisfies Inspiration;
}

export async function createIdea(input: Omit<Idea, "id" | "status">) {
  const result = await getPool().query(
    `insert into life_os.business_ideas (title, description, score, status)
     values ($1, $2, $3, 'raw')
     returning id::text, title, description, score, status`,
    [input.title, input.note, input.score],
  );
  const row = result.rows[0];
  return { id: row.id, title: row.title, note: row.description || "", score: Number(row.score || 0), status: ideaStatusFromDb(row.status) } satisfies Idea;
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const result = await getPool().query(
    "update life_os.tasks set status=$2 where id=$1 returning id::text, title, notes, priority, status",
    [id, taskStatusToDb(status)],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Task not found");
  return { id: row.id, title: row.title, description: row.notes || "", priority: priorityFromDb(row.priority), status: taskStatusFromDb(row.status) } satisfies Task;
}
