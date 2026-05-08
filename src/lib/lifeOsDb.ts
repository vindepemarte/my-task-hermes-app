import { Pool } from "pg";

export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "Low" | "Medium" | "High";
export type DbPriority = "low" | "medium" | "high";
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
  clientId?: string;
  clientName?: string;
  clientProjectId?: string;
  clientProjectTitle?: string;
  dueDate?: string;
  tags: string[];
  source?: string;
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

export type ClientRecord = {
  id: string;
  name: string;
  status: "lead" | "active" | "paused" | "won" | "lost";
  stage: string;
  priority: TaskPriority;
  contactName: string;
  contactChannel: string;
  website: string;
  notes: string;
  nextAction: string;
  nextActionDate: string;
};

export type ClientProject = {
  id: string;
  clientId: string;
  title: string;
  status: "planned" | "doing" | "waiting" | "done" | "paused";
  valueEstimate: number;
  deadline: string;
  notes: string;
};

export type ContentItem = {
  id: string;
  brand: string;
  platform: string;
  title: string;
  status: "idea" | "script" | "recorded" | "editing" | "scheduled" | "published" | "measured";
  ideaSource: string;
  hook: string;
  scriptNotes: string;
  assetUrl: string;
  publishUrl: string;
  plannedDate: string;
  publishedAt: string;
};

export type LexaSuggestion = {
  id: string;
  suggestionType: string;
  title: string;
  body: string;
  priority: TaskPriority;
  status: "open" | "accepted" | "done" | "dismissed";
  relatedEntityType: string;
  relatedEntityId: string;
};

export type DailyJournal = {
  id: string;
  journalDate: string;
  planTopThree: string[];
  doneItems: string[];
  energy: number | null;
  mood: string;
  notes: string;
};

export type BusinessUnitCategory = "our_business" | "client_delivery" | "prospect_pipeline";
export type OperatingConditionCode = "confusione" | "tradimento" | "nemico" | "dubbio" | "non_esistenza" | "pericolo" | "emergenza" | "normale" | "abbondanza" | "potere" | "cambio_potere";

export type BusinessUnit = {
  id: string;
  slug: string;
  name: string;
  category: BusinessUnitCategory;
  purpose: string;
  targetAudience: string;
  coreOffer: string;
  mainFvp: string;
  mainStatistic: string;
  supportingStatistics: string[];
  currentCondition: OperatingConditionCode;
  conditionFormula: string;
  strategicPlan: string;
  owner: string;
  criticalLines: string[];
  status: "active" | "paused" | "completed" | "archived";
  nextReviewAt: string;
};

export type FinalValuableProduct = {
  id: string;
  businessUnitId: string;
  name: string;
  description: string;
  recipient: string;
  proofRequired: string;
  valueType: string;
  status: string;
};

export type AdminStatistic = {
  id: string;
  businessUnitId: string;
  businessUnitName?: string;
  name: string;
  description: string;
  unit: string;
  cadence: "daily" | "weekly" | "monthly" | "event";
  direction: "up" | "down" | "stable";
  isMain: boolean;
  latestValue: number | null;
  previousValue: number | null;
  latestPeriodEnd: string;
};

export type OperatingCondition = {
  code: OperatingConditionCode;
  name: string;
  description: string;
  formulaSteps: string[];
  severity: number;
  requiresHumanReview: boolean;
};

export type BattlePlan = {
  id: string;
  businessUnitId: string;
  businessUnitName?: string;
  planType: "daily" | "weekly" | "monthly" | "program";
  title: string;
  purpose: string;
  periodStart: string;
  periodEnd: string;
  status: "draft" | "active" | "completed" | "cancelled" | "archived";
  reviewNotes: string;
};

export type BattlePlanItem = {
  id: string;
  battlePlanId: string;
  taskId: string;
  title: string;
  outputExpected: string;
  proofRequired: string;
  owner: string;
  dueAt: string;
  status: "todo" | "doing" | "blocked" | "done" | "cancelled";
  sortOrder: number;
};

export type ExecutionReport = {
  id: string;
  businessUnitId: string;
  businessUnitName?: string;
  reportType: string;
  title: string;
  summary: string;
  proofUrl: string;
  nextAction: string;
  reportedAt: string;
};

export type AppState = {
  tasks: Task[];
  logs: TimeLog[];
  inspirations: Inspiration[];
  ideas: Idea[];
  clients: ClientRecord[];
  clientProjects: ClientProject[];
  contentItems: ContentItem[];
  lexaSuggestions: LexaSuggestion[];
  dailyJournals: DailyJournal[];
  businessUnits: BusinessUnit[];
  finalValuableProducts: FinalValuableProduct[];
  adminStatistics: AdminStatistic[];
  operatingConditions: OperatingCondition[];
  battlePlans: BattlePlan[];
  battlePlanItems: BattlePlanItem[];
  executionReports: ExecutionReport[];
};

const connectionString = process.env.LIFE_OS_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

let pool: Pool | undefined;

export function getLifeOsPool() {
  if (!connectionString) throw new Error("Missing LIFE_OS_DATABASE_URL");
  pool ??= new Pool({ connectionString, max: 3, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
  return pool;
}

const defaultTasks: Task[] = [
  {
    id: "task-content-week",
    title: "Record Iacovici.it AI content batch",
    description: "Record the weekly talking-head videos from the prepared scripts. Keep them concise, clear and energetic, with space for captions and animated visual cards.",
    priority: "High",
    status: "todo",
    tags: ["iacovici", "content"],
  },
  {
    id: "task-video-pipeline",
    title: "Run video-use + hyperframes pipeline",
    description: "Process recorded videos on macOS with tight cuts, captions, camera movement, animated keywords and exports for Shorts/Reels.",
    priority: "High",
    status: "todo",
    tags: ["content"],
  },
  {
    id: "task-brand-system",
    title: "Define Iacovici.it brand system",
    description: "Clarify promise, audience, visual rules, recurring series, free community, future course offer and tone of voice.",
    priority: "Medium",
    status: "in-progress",
    tags: ["iacovici", "brand"],
  },
];

export const emptyState: AppState = {
  tasks: defaultTasks,
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

async function ensureDefaultTasks() {
  const db = getLifeOsPool();
  const countResult = await db.query("select count(*)::int as count from life_os.tasks");
  if (Number(countResult.rows[0]?.count || 0) > 0) return;
  for (const task of defaultTasks) {
    await db.query(
      "insert into life_os.tasks (title, notes, priority, status, tags, source) values ($1, $2, $3, $4, $5, 'seed')",
      [task.title, task.description, priorityToDb(task.priority), taskStatusToDb(task.status), task.tags],
    );
  }
}

// Rows come from optional tables whose shape is checked by SQL aliases before mapping.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function optionalQuery(sql: string): Promise<Array<Record<string, any>>> {
  try {
    const result = await getLifeOsPool().query(sql);
    return result.rows;
  } catch (error) {
    if (error instanceof Error && /does not exist|permission denied/i.test(error.message)) return [];
    throw error;
  }
}

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

function priorityToDb(priority: TaskPriority): DbPriority {
  return priority.toLowerCase() as DbPriority;
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

function dateOnly(value: string | Date | null | undefined) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function taskFromDb(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    title: String(row.title || ""),
    description: String(row.notes || ""),
    priority: priorityFromDb(String(row.priority || "medium")),
    status: taskStatusFromDb(String(row.status || "todo")),
    clientId: row.client_id ? String(row.client_id) : undefined,
    clientName: row.client_name ? String(row.client_name) : undefined,
    clientProjectId: row.client_project_id ? String(row.client_project_id) : undefined,
    clientProjectTitle: row.client_project_title ? String(row.client_project_title) : undefined,
    dueDate: row.due_date ? dateOnly(row.due_date as string | Date) : undefined,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    source: row.source ? String(row.source) : undefined,
  };
}

export async function getLifeOsState(): Promise<AppState> {
  const db = getLifeOsPool();
  await ensureDefaultTasks();
  const [tasks, logs, inspirations, ideas, clients, clientProjects, contentItems, lexaSuggestions, dailyJournals, businessUnits, finalValuableProducts, adminStatistics, operatingConditions, battlePlans, battlePlanItems, executionReports] = await Promise.all([
    db.query(`
      select t.id::text, t.title, t.notes, t.priority, t.status,
             t.client_id::text, c.name as client_name,
             t.client_project_id::text, cp.title as client_project_title,
             t.due_date,
             coalesce(t.tags, '{}'::text[]) as tags, t.source
      from life_os.tasks t
      left join life_os.clients c on c.id = t.client_id
      left join life_os.client_projects cp on cp.id = t.client_project_id
      order by t.updated_at desc, t.created_at desc
    `),
    db.query("select id::text, log_date, start_time, end_time, category, hours, note, energy from life_os.time_logs order by log_date desc, created_at desc"),
    db.query("select id::text, url, platform, title, saved_reason, pattern_notes, status from life_os.inspiration_links order by updated_at desc, created_at desc"),
    db.query("select id::text, title, description, score, status, lexa_comment from life_os.business_ideas order by updated_at desc, created_at desc"),
    optionalQuery("select id::text, name, status, stage, priority, contact_name, contact_channel, website, notes, next_action, next_action_date from life_os.clients order by updated_at desc, created_at desc"),
    optionalQuery("select id::text, client_id::text, title, status, value_estimate, deadline, notes from life_os.client_projects order by updated_at desc, created_at desc"),
    optionalQuery("select id::text, brand, platform, title, status, idea_source, hook, script_notes, asset_url, publish_url, planned_date, published_at from life_os.content_items order by updated_at desc, created_at desc"),
    optionalQuery("select id::text, suggestion_type, title, body, priority, status, related_entity_type, related_entity_id::text from life_os.lexa_suggestions order by updated_at desc, created_at desc"),
    optionalQuery("select id::text, journal_date, plan_top_three, done_items, energy, mood, notes from life_os.daily_journals order by journal_date desc limit 14"),
    optionalQuery("select id::text, slug, name, category, purpose, target_audience, core_offer, main_fvp, main_statistic, supporting_statistics, current_condition, condition_formula, strategic_plan, owner, critical_lines, status, next_review_at from life_os.business_units order by case category when 'our_business' then 1 when 'client_delivery' then 2 else 3 end, name"),
    optionalQuery("select id::text, business_unit_id::text, name, description, recipient, proof_required, value_type, status from life_os.final_valuable_products order by updated_at desc"),
    optionalQuery(`
      select s.id::text, s.business_unit_id::text, bu.name as business_unit_name, s.name, s.description, s.unit, s.cadence, s.direction, s.is_main,
             latest.value as latest_value, latest.previous_value, latest.period_end as latest_period_end
      from life_os.admin_statistics s
      left join life_os.business_units bu on bu.id = s.business_unit_id
      left join lateral (
        select value, previous_value, period_end from life_os.statistic_entries se where se.statistic_id = s.id order by period_end desc limit 1
      ) latest on true
      order by s.is_main desc, bu.name, s.name
    `),
    optionalQuery("select code, name, description, formula_steps, severity, requires_human_review from life_os.operating_conditions order by severity desc"),
    optionalQuery("select bp.id::text, bp.business_unit_id::text, bu.name as business_unit_name, bp.plan_type, bp.title, bp.purpose, bp.period_start, bp.period_end, bp.status, bp.review_notes from life_os.battle_plans bp left join life_os.business_units bu on bu.id = bp.business_unit_id order by bp.period_start desc, bp.created_at desc limit 30"),
    optionalQuery("select id::text, battle_plan_id::text, task_id::text, title, output_expected, proof_required, owner, due_at, status, sort_order from life_os.battle_plan_items order by sort_order, created_at"),
    optionalQuery("select er.id::text, er.business_unit_id::text, bu.name as business_unit_name, er.report_type, er.title, er.summary, er.proof_url, er.next_action, er.reported_at from life_os.execution_reports er left join life_os.business_units bu on bu.id = er.business_unit_id order by er.reported_at desc limit 30"),
  ]);

  return {
    tasks: tasks.rows.length
      ? tasks.rows.map(taskFromDb)
      : defaultTasks,
    logs: logs.rows.map((row) => ({ id: row.id, date: dateOnly(row.log_date), slot: [row.start_time?.slice(0, 5), row.end_time?.slice(0, 5)].filter(Boolean).join("–") || "manual entry", category: row.category, hours: Number(row.hours || 0), note: row.note || "", energy: Number(row.energy || 0) })),
    inspirations: inspirations.rows.map((row) => ({ id: row.id, url: row.url, reason: row.saved_reason || row.title || "", pattern: row.pattern_notes || "", platform: platformFromDb(row.platform), status: row.status === "used" ? "adapted" : row.status })),
    ideas: ideas.rows.map((row) => ({ id: row.id, title: row.title, note: [row.description, row.lexa_comment ? `Lexa: ${row.lexa_comment}` : ""].filter(Boolean).join("\n\n"), score: Number(row.score || 0), status: ideaStatusFromDb(row.status) })),
    clients: clients.map((row) => ({ id: row.id, name: row.name, status: row.status, stage: row.stage, priority: priorityFromDb(row.priority), contactName: row.contact_name || "", contactChannel: row.contact_channel || "", website: row.website || "", notes: row.notes || "", nextAction: row.next_action || "", nextActionDate: dateOnly(row.next_action_date) })),
    clientProjects: clientProjects.map((row) => ({ id: row.id, clientId: row.client_id, title: row.title, status: row.status, valueEstimate: Number(row.value_estimate || 0), deadline: dateOnly(row.deadline), notes: row.notes || "" })),
    contentItems: contentItems.map((row) => ({ id: row.id, brand: row.brand, platform: row.platform, title: row.title, status: row.status, ideaSource: row.idea_source || "", hook: row.hook || "", scriptNotes: row.script_notes || "", assetUrl: row.asset_url || "", publishUrl: row.publish_url || "", plannedDate: dateOnly(row.planned_date), publishedAt: row.published_at ? new Date(row.published_at).toISOString() : "" })),
    lexaSuggestions: lexaSuggestions.map((row) => ({ id: row.id, suggestionType: row.suggestion_type, title: row.title, body: row.body || "", priority: priorityFromDb(row.priority), status: row.status, relatedEntityType: row.related_entity_type || "", relatedEntityId: row.related_entity_id || "" })),
    dailyJournals: dailyJournals.map((row) => ({ id: row.id, journalDate: dateOnly(row.journal_date), planTopThree: row.plan_top_three || [], doneItems: row.done_items || [], energy: row.energy === null ? null : Number(row.energy), mood: row.mood || "", notes: row.notes || "" })),
    businessUnits: businessUnits.map((row) => ({ id: row.id, slug: row.slug, name: row.name, category: row.category, purpose: row.purpose || "", targetAudience: row.target_audience || "", coreOffer: row.core_offer || "", mainFvp: row.main_fvp || "", mainStatistic: row.main_statistic || "", supportingStatistics: row.supporting_statistics || [], currentCondition: row.current_condition || "non_esistenza", conditionFormula: row.condition_formula || "", strategicPlan: row.strategic_plan || "", owner: row.owner || "Alexandru", criticalLines: row.critical_lines || [], status: row.status || "active", nextReviewAt: row.next_review_at ? new Date(row.next_review_at).toISOString() : "" })),
    finalValuableProducts: finalValuableProducts.map((row) => ({ id: row.id, businessUnitId: row.business_unit_id, name: row.name, description: row.description || "", recipient: row.recipient || "", proofRequired: row.proof_required || "", valueType: row.value_type || "", status: row.status || "active" })),
    adminStatistics: adminStatistics.map((row) => ({ id: row.id, businessUnitId: row.business_unit_id, businessUnitName: row.business_unit_name || "", name: row.name, description: row.description || "", unit: row.unit || "count", cadence: row.cadence || "weekly", direction: row.direction || "up", isMain: Boolean(row.is_main), latestValue: row.latest_value === null || row.latest_value === undefined ? null : Number(row.latest_value), previousValue: row.previous_value === null || row.previous_value === undefined ? null : Number(row.previous_value), latestPeriodEnd: dateOnly(row.latest_period_end) })),
    operatingConditions: operatingConditions.map((row) => ({ code: row.code, name: row.name, description: row.description || "", formulaSteps: row.formula_steps || [], severity: Number(row.severity || 0), requiresHumanReview: Boolean(row.requires_human_review) })),
    battlePlans: battlePlans.map((row) => ({ id: row.id, businessUnitId: row.business_unit_id || "", businessUnitName: row.business_unit_name || "", planType: row.plan_type, title: row.title, purpose: row.purpose || "", periodStart: dateOnly(row.period_start), periodEnd: dateOnly(row.period_end), status: row.status, reviewNotes: row.review_notes || "" })),
    battlePlanItems: battlePlanItems.map((row) => ({ id: row.id, battlePlanId: row.battle_plan_id, taskId: row.task_id || "", title: row.title, outputExpected: row.output_expected || "", proofRequired: row.proof_required || "", owner: row.owner || "Alexandru", dueAt: row.due_at ? new Date(row.due_at).toISOString() : "", status: row.status || "todo", sortOrder: Number(row.sort_order || 0) })),
    executionReports: executionReports.map((row) => ({ id: row.id, businessUnitId: row.business_unit_id || "", businessUnitName: row.business_unit_name || "", reportType: row.report_type || "completion", title: row.title, summary: row.summary || "", proofUrl: row.proof_url || "", nextAction: row.next_action || "", reportedAt: row.reported_at ? new Date(row.reported_at).toISOString() : "" })),
  };
}

export async function createTask(input: Omit<Task, "id" | "status">) {
  const result = await getLifeOsPool().query(
    `with inserted as (
       insert into life_os.tasks (title, notes, priority, status, client_id, client_project_id, due_date, tags, source)
       values ($1, $2, $3, 'todo', $4, $5, $6, $7, $8)
       returning id, title, notes, priority, status, client_id, client_project_id, due_date, tags, source
     )
     select inserted.id::text, inserted.title, inserted.notes, inserted.priority, inserted.status,
            inserted.client_id::text, c.name as client_name,
            inserted.client_project_id::text, cp.title as client_project_title,
            inserted.due_date,
            inserted.tags, inserted.source
     from inserted
     left join life_os.clients c on c.id = inserted.client_id
     left join life_os.client_projects cp on cp.id = inserted.client_project_id`,
    [input.title, input.description, priorityToDb(input.priority), input.clientId || null, input.clientProjectId || null, input.dueDate || null, input.tags || [], input.source || "web"],
  );
  return taskFromDb(result.rows[0]);
}

export async function createTimeLog(input: Omit<TimeLog, "id" | "date"> & { date?: string; source?: string }) {
  const [startTime, endTime] = input.slot.includes("–") ? input.slot.split("–") : input.slot.split("-");
  const result = await getLifeOsPool().query(
    `insert into life_os.time_logs (log_date, start_time, end_time, category, hours, energy, note, source)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id::text, log_date, start_time, end_time, category, hours, note, energy`,
    [input.date || new Date().toISOString().slice(0, 10), startTime?.trim() || null, endTime?.trim() || null, input.category, input.hours, input.energy, input.note, input.source || "manual"],
  );
  const row = result.rows[0];
  return { id: row.id, date: dateOnly(row.log_date), slot: [row.start_time?.slice(0, 5), row.end_time?.slice(0, 5)].filter(Boolean).join("–") || input.slot || "manual entry", category: row.category, hours: Number(row.hours || 0), note: row.note || "", energy: Number(row.energy || 0) } satisfies TimeLog;
}

export async function createInspiration(input: Omit<Inspiration, "id" | "status">) {
  const result = await getLifeOsPool().query(
    `insert into life_os.inspiration_links (url, platform, saved_reason, pattern_notes, status)
     values ($1, $2, $3, $4, 'saved')
     returning id::text, url, platform, saved_reason, pattern_notes, status`,
    [input.url, input.platform, input.reason, input.pattern],
  );
  const row = result.rows[0];
  return { id: row.id, url: row.url, reason: row.saved_reason || "", pattern: row.pattern_notes || "", platform: platformFromDb(row.platform), status: row.status } satisfies Inspiration;
}

export async function createIdea(input: Omit<Idea, "id" | "status">) {
  const result = await getLifeOsPool().query(
    `insert into life_os.business_ideas (title, description, score, status)
     values ($1, $2, $3, 'raw')
     returning id::text, title, description, score, status`,
    [input.title, input.note, input.score],
  );
  const row = result.rows[0];
  return { id: row.id, title: row.title, note: row.description || "", score: Number(row.score || 0), status: ideaStatusFromDb(row.status) } satisfies Idea;
}

export async function createClient(input: Omit<ClientRecord, "id">) {
  const result = await getLifeOsPool().query(
    `insert into life_os.clients (name, status, stage, priority, contact_name, contact_channel, website, notes, next_action, next_action_date)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     returning id::text, name, status, stage, priority, contact_name, contact_channel, website, notes, next_action, next_action_date`,
    [input.name, input.status, input.stage, priorityToDb(input.priority), input.contactName, input.contactChannel, input.website, input.notes, input.nextAction, input.nextActionDate || null],
  );
  const row = result.rows[0];
  return { id: row.id, name: row.name, status: row.status, stage: row.stage, priority: priorityFromDb(row.priority), contactName: row.contact_name || "", contactChannel: row.contact_channel || "", website: row.website || "", notes: row.notes || "", nextAction: row.next_action || "", nextActionDate: dateOnly(row.next_action_date) } satisfies ClientRecord;
}

export async function createContentItem(input: Omit<ContentItem, "id" | "publishedAt">) {
  const result = await getLifeOsPool().query(
    `insert into life_os.content_items (brand, platform, title, status, idea_source, hook, script_notes, asset_url, publish_url, planned_date)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     returning id::text, brand, platform, title, status, idea_source, hook, script_notes, asset_url, publish_url, planned_date, published_at`,
    [input.brand, input.platform, input.title, input.status, input.ideaSource, input.hook, input.scriptNotes, input.assetUrl, input.publishUrl, input.plannedDate || null],
  );
  const row = result.rows[0];
  return { id: row.id, brand: row.brand, platform: row.platform, title: row.title, status: row.status, ideaSource: row.idea_source || "", hook: row.hook || "", scriptNotes: row.script_notes || "", assetUrl: row.asset_url || "", publishUrl: row.publish_url || "", plannedDate: dateOnly(row.planned_date), publishedAt: row.published_at ? new Date(row.published_at).toISOString() : "" } satisfies ContentItem;
}

export async function createLexaSuggestion(input: Omit<LexaSuggestion, "id" | "status"> & { status?: LexaSuggestion["status"] }) {
  const result = await getLifeOsPool().query(
    `insert into life_os.lexa_suggestions (suggestion_type, title, body, priority, status, related_entity_type, related_entity_id)
     values ($1,$2,$3,$4,$5,$6,$7)
     returning id::text, suggestion_type, title, body, priority, status, related_entity_type, related_entity_id::text`,
    [input.suggestionType, input.title, input.body, priorityToDb(input.priority), input.status || "open", input.relatedEntityType || null, input.relatedEntityId || null],
  );
  const row = result.rows[0];
  return { id: row.id, suggestionType: row.suggestion_type, title: row.title, body: row.body || "", priority: priorityFromDb(row.priority), status: row.status, relatedEntityType: row.related_entity_type || "", relatedEntityId: row.related_entity_id || "" } satisfies LexaSuggestion;
}

export async function upsertDailyJournal(input: Omit<DailyJournal, "id">) {
  const result = await getLifeOsPool().query(
    `insert into life_os.daily_journals (journal_date, plan_top_three, done_items, energy, mood, notes)
     values ($1,$2,$3,$4,$5,$6)
     on conflict (journal_date) do update set plan_top_three=$2, done_items=$3, energy=$4, mood=$5, notes=$6, updated_at=now()
     returning id::text, journal_date, plan_top_three, done_items, energy, mood, notes`,
    [input.journalDate, input.planTopThree, input.doneItems, input.energy, input.mood, input.notes],
  );
  const row = result.rows[0];
  return { id: row.id, journalDate: dateOnly(row.journal_date), planTopThree: row.plan_top_three || [], doneItems: row.done_items || [], energy: row.energy === null ? null : Number(row.energy), mood: row.mood || "", notes: row.notes || "" } satisfies DailyJournal;
}

export async function updateTaskStatus(id: string, status: TaskStatus) {
  const result = await getLifeOsPool().query(
    `with updated as (
       update life_os.tasks set status=$2 where id=$1
       returning id, title, notes, priority, status, client_id, client_project_id, due_date, tags, source
     )
     select updated.id::text, updated.title, updated.notes, updated.priority, updated.status,
            updated.client_id::text, c.name as client_name,
            updated.client_project_id::text, cp.title as client_project_title,
            updated.due_date,
            updated.tags, updated.source
     from updated
     left join life_os.clients c on c.id = updated.client_id
     left join life_os.client_projects cp on cp.id = updated.client_project_id`,
    [id, taskStatusToDb(status)],
  );
  const row = result.rows[0];
  if (!row) throw new Error("Task not found");
  return taskFromDb(row);
}
