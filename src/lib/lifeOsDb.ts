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

export type OperatingEvent = {
  id: string;
  eventType: "stat" | "done" | "blocked" | "decision" | "order" | "note" | "risk" | "outness" | "proof" | "cleanup";
  businessUnitId: string;
  businessUnitName?: string;
  taskId: string;
  statisticId: string;
  statisticName?: string;
  title: string;
  body: string;
  rawText: string;
  value: number | null;
  proofUrl: string;
  status: "open" | "processed" | "needs_review" | "closed" | "archived";
  source: string;
  createdAt: string;
};

export type DecisionLogEntry = {
  id: string;
  businessUnitId: string;
  businessUnitName?: string;
  decision: string;
  rationale: string;
  expectedEffect: string;
  status: "active" | "reversed" | "superseded" | "archived";
  source: string;
  decidedAt: string;
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
  operatingEvents: OperatingEvent[];
  decisionLog: DecisionLogEntry[];
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
  operatingEvents: [],
  decisionLog: [],
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

function isoDateTime(value: string | Date | null | undefined) {
  return value ? new Date(value).toISOString() : "";
}

export async function getLifeOsState(): Promise<AppState> {
  const db = getLifeOsPool();
  await ensureDefaultTasks();
  const [tasks, logs, inspirations, ideas, clients, clientProjects, contentItems, lexaSuggestions, dailyJournals, businessUnits, finalValuableProducts, adminStatistics, operatingConditions, battlePlans, battlePlanItems, executionReports, operatingEvents, decisionLog] = await Promise.all([
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
        select value, previous_value, period_end from life_os.statistic_entries se      where se.statistic_id = s.id order by period_end desc limit 1
      ) latest on true
      where s.status = 'active'
      order by s.is_main desc, bu.name, s.name
    `),
    optionalQuery("select code, name, description, formula_steps, severity, requires_human_review from life_os.operating_conditions order by severity desc"),
    optionalQuery("select bp.id::text, bp.business_unit_id::text, bu.name as business_unit_name, bp.plan_type, bp.title, bp.purpose, bp.period_start, bp.period_end, bp.status, bp.review_notes from life_os.battle_plans bp left join life_os.business_units bu on bu.id = bp.business_unit_id order by bp.period_start desc, bp.created_at desc limit 30"),
    optionalQuery("select id::text, battle_plan_id::text, task_id::text, title, output_expected, proof_required, owner, due_at, status, sort_order from life_os.battle_plan_items order by sort_order, created_at"),
    optionalQuery("select er.id::text, er.business_unit_id::text, bu.name as business_unit_name, er.report_type, er.title, er.summary, er.proof_url, er.next_action, er.reported_at from life_os.execution_reports er left join life_os.business_units bu on bu.id = er.business_unit_id order by er.reported_at desc limit 30"),
    optionalQuery("select oe.id::text, oe.event_type, oe.business_unit_id::text, bu.name as business_unit_name, oe.task_id::text, oe.statistic_id::text, s.name as statistic_name, oe.title, oe.body, oe.raw_text, oe.value, oe.proof_url, oe.status, oe.source, oe.created_at from life_os.operating_events oe left join life_os.business_units bu on bu.id = oe.business_unit_id left join life_os.admin_statistics s on s.id = oe.statistic_id where oe.status <> 'archived' order by oe.created_at desc limit 50"),
    optionalQuery("select dl.id::text, dl.business_unit_id::text, bu.name as business_unit_name, dl.decision, dl.rationale, dl.expected_effect, dl.status, dl.source, dl.decided_at from life_os.decision_log dl left join life_os.business_units bu on bu.id = dl.business_unit_id where dl.status <> 'archived' order by dl.decided_at desc limit 30"),
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
    executionReports: executionReports.map((row) => ({ id: row.id, businessUnitId: row.business_unit_id || "", businessUnitName: row.business_unit_name || "", reportType: row.report_type || "completion", title: row.title, summary: row.summary || "", proofUrl: row.proof_url || "", nextAction: row.next_action || "", reportedAt: isoDateTime(row.reported_at) })),
    operatingEvents: operatingEvents.map((row) => ({ id: row.id, eventType: row.event_type, businessUnitId: row.business_unit_id || "", businessUnitName: row.business_unit_name || "", taskId: row.task_id || "", statisticId: row.statistic_id || "", statisticName: row.statistic_name || "", title: row.title, body: row.body || "", rawText: row.raw_text || "", value: row.value === null || row.value === undefined ? null : Number(row.value), proofUrl: row.proof_url || "", status: row.status || "open", source: row.source || "telegram", createdAt: isoDateTime(row.created_at) })),
    decisionLog: decisionLog.map((row) => ({ id: row.id, businessUnitId: row.business_unit_id || "", businessUnitName: row.business_unit_name || "", decision: row.decision, rationale: row.rationale || "", expectedEffect: row.expected_effect || "", status: row.status || "active", source: row.source || "lexa", decidedAt: isoDateTime(row.decided_at) })),
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


export async function createStatisticEntry(input: { statisticId: string; value: number; periodStart?: string; periodEnd?: string; evidenceUrl?: string; notes?: string; source?: string }) {
  const periodEnd = input.periodEnd || new Date().toISOString().slice(0, 10);
  const periodStart = input.periodStart || periodEnd;
  const previous = await getLifeOsPool().query("select value from life_os.statistic_entries where statistic_id=$1 and period_end < $2 order by period_end desc limit 1", [input.statisticId, periodEnd]);
  const previousValue = previous.rows[0]?.value ?? null;
  const result = await getLifeOsPool().query(
    `insert into life_os.statistic_entries (statistic_id, period_start, period_end, value, previous_value, evidence_url, notes, source)
     values ($1,$2,$3,$4,$5,$6,$7,$8)
     on conflict (statistic_id, period_start, period_end) do update set value=$4, previous_value=$5, evidence_url=$6, notes=$7, source=$8, updated_at=now()
     returning id::text, statistic_id::text, period_start, period_end, value, previous_value, evidence_url, notes, source`,
    [input.statisticId, periodStart, periodEnd, input.value, previousValue, input.evidenceUrl || "", input.notes || "", input.source || "manual"],
  );
  return result.rows[0];
}

export async function createBattlePlanItem(input: { battlePlanId: string; title: string; outputExpected?: string; proofRequired?: string; owner?: string; dueAt?: string; statisticId?: string; finalValuableProductId?: string; sortOrder?: number }) {
  const result = await getLifeOsPool().query(
    `insert into life_os.battle_plan_items (battle_plan_id, title, output_expected, proof_required, owner, due_at, statistic_id, final_valuable_product_id, sort_order)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     returning id::text, battle_plan_id::text, task_id::text, title, output_expected, proof_required, owner, due_at, status, sort_order`,
    [input.battlePlanId, input.title, input.outputExpected || "", input.proofRequired || "proof/report required", input.owner || "Alexandru", input.dueAt || null, input.statisticId || null, input.finalValuableProductId || null, input.sortOrder || 0],
  );
  const row = result.rows[0];
  return { id: row.id, battlePlanId: row.battle_plan_id, taskId: row.task_id || "", title: row.title, outputExpected: row.output_expected || "", proofRequired: row.proof_required || "", owner: row.owner || "Alexandru", dueAt: isoDateTime(row.due_at), status: row.status || "todo", sortOrder: Number(row.sort_order || 0) } satisfies BattlePlanItem;
}

export async function createExecutionReport(input: { businessUnitId?: string; battlePlanId?: string; battlePlanItemId?: string; taskId?: string; reportType?: string; title: string; summary?: string; proofUrl?: string; nextAction?: string; reportedBy?: string }) {
  const result = await getLifeOsPool().query(
    `insert into life_os.execution_reports (business_unit_id, battle_plan_id, battle_plan_item_id, task_id, report_type, title, summary, proof_url, next_action, reported_by)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     returning id::text, business_unit_id::text, report_type, title, summary, proof_url, next_action, reported_at`,
    [input.businessUnitId || null, input.battlePlanId || null, input.battlePlanItemId || null, input.taskId || null, input.reportType || "completion", input.title, input.summary || "", input.proofUrl || "", input.nextAction || "", input.reportedBy || "Lexa"],
  );
  const row = result.rows[0];
  return { id: row.id, businessUnitId: row.business_unit_id || "", reportType: row.report_type || "completion", title: row.title, summary: row.summary || "", proofUrl: row.proof_url || "", nextAction: row.next_action || "", reportedAt: isoDateTime(row.reported_at) };
}

function classifyOperatingText(text: string): OperatingEvent["eventType"] {
  const lower = text.toLowerCase();
  if (/\b(done|fatto|finito|completed|pubblicato|consegnato)\b/.test(lower)) return "done";
  if (/\b(block|blocked|bloccato|ostacolo|non riesco|stuck)\b/.test(lower)) return "blocked";
  if (/\b(stat|metrica|numero|views|lead|soldi|€|euro|ore|followers?)\b/.test(lower)) return "stat";
  if (/\b(decid|decisione|scelgo|approvo|go with)\b/.test(lower)) return "decision";
  if (/\b(order|ordine|devo|must|bisogna)\b/.test(lower)) return "order";
  if (/\b(risk|rischio|outness|wrong|errore|pericolo)\b/.test(lower)) return "risk";
  if (/\b(proof|prova|screenshot|link|commit|url)\b/.test(lower)) return "proof";
  return "note";
}

async function findBusinessUnitForText(text: string) {
  const lower = text.toLowerCase();
  const result = await getLifeOsPool().query("select id::text, slug, name from life_os.business_units where status <> 'archived'");
  const rows = result.rows;
  const direct = rows.find((row) => lower.includes(String(row.slug).replaceAll('-', ' ')) || lower.includes(String(row.name).toLowerCase()));
  if (direct) return direct;
  if (/abc|client/.test(lower)) return rows.find((row) => row.slug === 'client-delivery') || null;
  if (/lead|prospect|demo|follow/.test(lower)) return rows.find((row) => row.slug === 'prospects-lead-pipeline') || null;
  if (/prohappya|crm/.test(lower)) return rows.find((row) => row.slug === 'prohappya') || null;
  if (/zambetin|catalin|youtube copii/.test(lower)) return rows.find((row) => row.slug === 'zambetin-tv') || null;
  if (/vindepemarte.*fun|comedy|meme/.test(lower)) return rows.find((row) => row.slug === 'vindepemarte-fun') || null;
  if (/vindepemarte|song|music|suno/.test(lower)) return rows.find((row) => row.slug === 'vindepemarte-music') || null;
  if (/iacovici|ai content|video|corso/.test(lower)) return rows.find((row) => row.slug === 'iacovici-it') || null;
  return null;
}

async function findMainStatisticForUnit(businessUnitId?: string) {
  if (!businessUnitId) return null;
  const result = await getLifeOsPool().query("select id::text, name from life_os.admin_statistics where business_unit_id=$1 and status='active' order by is_main desc, created_at limit 1", [businessUnitId]);
  return result.rows[0] || null;
}

export async function ingestOperatingUpdate(input: { text: string; source?: string; proofUrl?: string; value?: number; title?: string }) {
  const text = input.text.trim();
  if (!text) throw new Error("Missing text");
  const eventType = classifyOperatingText(text);
  const businessUnit = await findBusinessUnitForText(text);
  const statistic = eventType === "stat" ? await findMainStatisticForUnit(businessUnit?.id) : null;
  const numberMatch = text.match(/-?\d+(?:[\.,]\d+)?/);
  const value = input.value ?? (numberMatch ? Number(numberMatch[0].replace(',', '.')) : null);
  const title = input.title || (eventType === "done" ? "Completion update" : eventType === "blocked" ? "Blocked flow" : eventType === "stat" ? "Statistic update" : eventType === "decision" ? "Decision captured" : "Operating note");
  const client = await getLifeOsPool().connect();
  try {
    await client.query('begin');
    let taskId: string | null = null;
    let reportId: string | null = null;
    if (eventType === "done") {
      const task = await client.query(
        `insert into life_os.tasks (title, notes, priority, status, due_date, tags, source, proof_url, output_expected)
         values ($1,$2,'medium','done',current_date,ARRAY['telegram','done','proof-required'], $3, $4, $5)
         returning id::text`,
        [title, text, input.source || "telegram", input.proofUrl || "", "Completion with proof/report"],
      );
      taskId = task.rows[0].id;
      const report = await client.query(
        `insert into life_os.execution_reports (business_unit_id, task_id, report_type, title, summary, proof_url, next_action, reported_by)
         values ($1,$2,'completion',$3,$4,$5,'Check stat/proof and choose next action','Lexa') returning id::text`,
        [businessUnit?.id || null, taskId, title, text, input.proofUrl || ""],
      );
      reportId = report.rows[0].id;
    }
    if (eventType === "blocked") {
      const task = await client.query(
        `insert into life_os.tasks (title, notes, priority, status, due_date, tags, source, blocked_reason)
         values ($1,$2,'high','doing',current_date,ARRAY['telegram','blocked','outness'], $3, $4)
         returning id::text`,
        [title, text, input.source || "telegram", text],
      );
      taskId = task.rows[0].id;
    }
    if (eventType === "stat" && statistic?.id && value !== null) {
      const prev = await client.query("select value from life_os.statistic_entries where statistic_id=$1 order by period_end desc limit 1", [statistic.id]);
      await client.query(
        `insert into life_os.statistic_entries (statistic_id, period_start, period_end, value, previous_value, evidence_url, notes, source)
         values ($1,current_date,current_date,$2,$3,$4,$5,$6)
         on conflict (statistic_id, period_start, period_end) do update set value=$2, previous_value=$3, evidence_url=$4, notes=$5, source=$6, updated_at=now()`,
        [statistic.id, value, prev.rows[0]?.value ?? null, input.proofUrl || "", text, input.source || "telegram"],
      );
    }
    if (eventType === "decision") {
      await client.query(
        `insert into life_os.decision_log (business_unit_id, decision, rationale, expected_effect, source)
         values ($1,$2,$3,$4,$5)`,
        [businessUnit?.id || null, text, "Captured from natural Telegram/update text", "Review impact on statistics in next weekly review", input.source || "telegram"],
      );
    }
    const event = await client.query(
      `insert into life_os.operating_events (event_type, business_unit_id, task_id, statistic_id, title, body, raw_text, value, proof_url, status, source, metadata)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       returning id::text, event_type, business_unit_id::text, task_id::text, statistic_id::text, title, body, raw_text, value, proof_url, status, source, created_at`,
      [eventType, businessUnit?.id || null, taskId, statistic?.id || null, title, text, text, value, input.proofUrl || "", eventType === "risk" ? "needs_review" : "processed", input.source || "telegram", { reportId }],
    );
    await client.query('commit');
    const row = event.rows[0];
    return { id: row.id, eventType: row.event_type, businessUnitId: row.business_unit_id || "", businessUnitName: businessUnit?.name || "", taskId: row.task_id || "", statisticId: row.statistic_id || "", statisticName: statistic?.name || "", title: row.title, body: row.body || "", rawText: row.raw_text || "", value: row.value === null || row.value === undefined ? null : Number(row.value), proofUrl: row.proof_url || "", status: row.status || "processed", source: row.source || "telegram", createdAt: isoDateTime(row.created_at) } satisfies OperatingEvent;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
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
