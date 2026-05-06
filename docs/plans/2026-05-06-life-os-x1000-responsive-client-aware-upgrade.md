# Life OS x1000 Responsive Client-Aware Upgrade Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Transform Alexandru’s Life OS into a polished, responsive, client-aware command center that looks good on the smallest phone and the largest desktop while keeping tasks, clients, content, reminders, and Lexa proactivity organized.

**Architecture:** Split the current large `KanbanBoard.tsx` into small, reusable UI primitives and feature sections. Add a proper client/project tagging model in Postgres, then wire API and UI filters to explicit relationships instead of fuzzy text matching. Improve every card, form, tab, button, status pill, and modal-like panel with mobile-first layout rules, overflow-safe text, clear labels, and consistent actions.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4 utility classes, Postgres schema `life_os`, `pg`, Vercel deployment.

---

## Product principles for Alexandru

1. **Telegram-first, dashboard-second:** Lexa captures life in Telegram; dashboard shows the clean truth, not a messy dump.
2. **Money/client commitments first:** ABC, ProHappyA, Zâmbetin/Cătălin, Iacovici.it must be easier to see than low-priority experiments.
3. **No shame UI:** stale tasks should be rolled over or grouped, not visually scream failure.
4. **Tiny next action everywhere:** every page/card should answer “what do I do now?”
5. **Responsive from 320px to ultrawide:** no horizontal overflow, no clipped buttons, no tiny tap targets.
6. **Real structure over pretty chaos:** client dashboards must use DB relationships/tags, not only keyword matching.

## Current code facts

- Main UI file: `src/app/KanbanBoard.tsx` — currently ~790 lines, all sections and primitives in one component.
- DB mapper/API: `src/lib/lifeOsDb.ts`.
- API route: `src/app/api/life-os/route.ts`.
- Current tables: `life_os.tasks`, `time_logs`, `clients`, `client_projects`, `content_items`, `business_ideas`, `lexa_suggestions`, `daily_journals`, `external_bot_tasks`, `external_bot_events`.
- Current gap: tasks have no explicit `client_id`, `project_id`, tags, due time, or source metadata in the web model.
- Current client tab uses fuzzy matching: `task.title + task.description` includes client name.
- Current responsive risk: 9 tab buttons in grid, long text cards, no shared overflow/tap-target system, no compact mobile navigation.

## Acceptance criteria

- No horizontal overflow at viewport widths: 320, 375, 430, 768, 1024, 1440, 1920.
- Every button/input has at least ~44px tap height on mobile.
- Tabs become usable on mobile: either horizontal scroll segmented nav or grouped command navigation.
- Tasks can be explicitly linked to client/project/tags in DB and UI.
- Client dashboards show tasks, projects, logs, content, next action, and Lexa suggestions per client.
- Cards clamp/scroll long text safely with `break-words`, `min-w-0`, `whitespace-pre-wrap`, and controlled max heights where needed.
- Add/edit forms are compact, labeled, and usable on phone.
- `npm run lint` and `npm run build` pass.
- DB migration has verifier and grants for `life_os_app`.
- Live Vercel URL is checked after deployment before claiming production success.

---

## Phase 0 — Safety baseline and audit

### Task 0.1: Create a UI responsiveness audit checklist

**Objective:** Establish concrete viewport checks before editing UI.

**Files:**
- Create: `docs/qa/life-os-responsive-audit.md`

**Steps:**
1. Create checklist with viewports: 320, 375, 430, 768, 1024, 1440, 1920.
2. Include checks for header, auth form, tab nav, task board, clients, content, analytics, inspiration, projects, ideas, modes.
3. Include pass/fail fields for: horizontal overflow, clipped text, tiny buttons, unusable inputs, bad wrapping.

**Verification:** File exists and can be used during browser QA.

### Task 0.2: Snapshot current app state

**Objective:** Know exactly what changes are introduced.

**Files:**
- Read: `src/app/KanbanBoard.tsx`
- Read: `src/lib/lifeOsDb.ts`
- Read: `src/app/api/life-os/route.ts`

**Commands:**
```bash
git status --short
npm run lint
npm run build
```

**Expected:** Build/lint baseline known. If failing before work, document it in `docs/qa/life-os-responsive-audit.md`.

---

## Phase 1 — Database model for client-aware tasks

### Task 1.1: Add migration for task tags and relationships

**Objective:** Give tasks explicit client/project/tag metadata.

**Files:**
- Create: `db/2026-05-06-life-os-task-tags-client-links.sql`

**SQL outline:**
```sql
alter table life_os.tasks
  add column if not exists client_id uuid references life_os.clients(id) on delete set null,
  add column if not exists client_project_id uuid references life_os.client_projects(id) on delete set null,
  add column if not exists tags text[] not null default '{}',
  add column if not exists source text not null default 'manual',
  add column if not exists sort_order integer not null default 0;

create index if not exists tasks_client_id_idx on life_os.tasks(client_id);
create index if not exists tasks_client_project_id_idx on life_os.tasks(client_project_id);
create index if not exists tasks_tags_gin_idx on life_os.tasks using gin(tags);
create index if not exists tasks_status_priority_due_idx on life_os.tasks(status, priority, due_date);

grant select, insert, update, delete on life_os.tasks to life_os_app;
grant usage on schema life_os to life_os_app;
```

**Notes:** Existing `tasks.status` remains `todo|doing|done`; web maps `doing` ↔ `in-progress`.

### Task 1.2: Add schema verifier script

**Objective:** Verify migration before UI relies on it.

**Files:**
- Create: `scripts/verify-life-os-task-tags.mjs`

**Verification logic:**
- Connect using `LIFE_OS_DATABASE_URL` from `.env.local`.
- Query `information_schema.columns` for `client_id`, `client_project_id`, `tags`, `source`, `sort_order` on `life_os.tasks`.
- Query indexes from `pg_indexes`.
- Exit `1` if anything missing.

**Command:**
```bash
node scripts/verify-life-os-task-tags.mjs
```

**Expected before migration:** FAIL with missing columns.
**Expected after admin migration:** PASS.

### Task 1.3: Apply migration with admin DSN if required

**Objective:** Safely apply DDL with the root/admin Life OS DSN.

**Files:**
- Use: `/home/alex/my-task-hermes-app/.env.local`
- Use: `/home/alex/.hermes/secrets/life_os_admin.env`

**Rules:**
- Do not print DSN or password.
- Use admin DSN only for DDL.
- Normal app reads/writes continue using `LIFE_OS_DATABASE_URL`.

**Verification:** Run `node scripts/verify-life-os-task-tags.mjs` using app DSN after migration.

### Task 1.4: Backfill obvious task-client links

**Objective:** Connect current tasks to clients/projects without manual UI work.

**Approach:**
- `title/notes ilike '%ABC%'` → ABC client.
- `title/notes ilike '%ProHappyA%'` → ProHappyA client.
- `title/notes ilike '%Zâmbetin%' or '%Catalin%' or '%Cătălin%'` → Catalin YouTube Kids client.
- `title/notes ilike '%Iacovici.it%'` → tag `Iacovici.it`; if no client exists, leave `client_id` null but tags include `Iacovici.it`.
- `title/notes ilike '%vindepemarte%'` → tag `vindepemarte`.

**Files:**
- Create: `scripts/backfill-life-os-task-client-links.mjs`

**Verification:** Print redacted summary counts only, e.g. `{ ABC: 2, ProHappyA: 3, Zambetin: 4, tagged: 8 }`.

---

## Phase 2 — Type/API support

### Task 2.1: Extend TypeScript `Task` model

**Objective:** Expose client/tag metadata to the UI.

**Files:**
- Modify: `src/lib/lifeOsDb.ts`

**Add to `Task`:**
```ts
clientId?: string;
clientName?: string;
clientProjectId?: string;
clientProjectTitle?: string;
dueDate?: string;
tags: string[];
source?: string;
```

**Mapper updates:**
- `getLifeOsState()` task query should left join clients/projects.
- `createTask()` should accept optional metadata.
- `updateTaskStatus()` should preserve metadata.

### Task 2.2: Add task patch support for metadata

**Objective:** Allow UI to change client/project/tags later.

**Files:**
- Modify: `src/lib/lifeOsDb.ts`
- Modify: `src/app/api/life-os/route.ts`

**Add function:** `updateTaskMetadata(id, input)`.

**PATCH body:**
```json
{ "type": "taskMetadata", "id": "...", "data": { "clientId": "...", "clientProjectId": "...", "tags": ["ABC"] } }
```

**Verification:** Use a local API test after login token is available, or direct unit/helper script if easier.

---

## Phase 3 — Component extraction and design system

### Task 3.1: Create shared UI primitives

**Objective:** Stop repeating fragile classes and make responsive rules consistent.

**Files:**
- Create: `src/components/life-os/ui.tsx`

**Components:**
- `Shell`
- `Panel`
- `Card`
- `Pill`
- `Button`
- `Input`
- `Textarea`
- `Select`
- `EmptyState`
- `MetricCard`
- `SectionHeader`

**Responsive rules:**
- Cards: `min-w-0 overflow-hidden break-words`.
- Buttons: `min-h-11` and full-width on tiny screens when inside forms.
- Inputs: `text-base sm:text-sm` to avoid iOS zoom.
- Panels: `rounded-3xl sm:rounded-[2rem] p-4 sm:p-5 md:p-6`.

### Task 3.2: Move constants and helpers out of `KanbanBoard.tsx`

**Objective:** Make main file readable and safer.

**Files:**
- Create: `src/components/life-os/constants.ts`
- Create: `src/components/life-os/helpers.ts`
- Modify: `src/app/KanbanBoard.tsx`

**Move:** `categories`, `tabs`, `lexaModes`, `priorityStyle`, `uid`, task/client/content helper functions.

**Verification:** `npm run lint`.

### Task 3.3: Extract feature sections

**Objective:** Each tab has its own component.

**Files:**
- Create: `src/components/life-os/OverviewSection.tsx`
- Create: `src/components/life-os/TasksSection.tsx`
- Create: `src/components/life-os/ClientsSection.tsx`
- Create: `src/components/life-os/ContentSection.tsx`
- Create: `src/components/life-os/AnalyticsSection.tsx`
- Create: `src/components/life-os/InspirationSection.tsx`
- Create: `src/components/life-os/ProjectsSection.tsx`
- Create: `src/components/life-os/IdeasSection.tsx`
- Create: `src/components/life-os/ModesSection.tsx`

**Verification:** `KanbanBoard.tsx` becomes an orchestrator, not a 790-line mega component.

---

## Phase 4 — Mobile-first navigation x1000

### Task 4.1: Replace 9-column tab grid with responsive nav

**Objective:** Make navigation usable on phone and desktop.

**Files:**
- Create: `src/components/life-os/LifeOsNav.tsx`
- Modify: `src/app/KanbanBoard.tsx`

**Behavior:**
- Mobile: horizontal scroll segmented nav with `overflow-x-auto`, `snap-x`, icons/short labels.
- Tablet: 2–3 columns or wrap pills.
- Desktop: full nav grid with hints.
- Add visible active state and no clipped hint text.

**Recommended nav groups:**
- Today
- Tasks
- Clients
- Content
- Time
- Research
- Projects
- Ideas
- Lexa

### Task 4.2: Add sticky mobile command strip

**Objective:** Keep next action always visible.

**Files:**
- Create: `src/components/life-os/MobileCommandStrip.tsx`

**Shows:**
- Current top task.
- Energy.
- Quick buttons: `Tasks`, `Clients`, `Log`.

**Rule:** only visible on `sm:hidden`, fixed bottom, safe-area padding, no overlap with content.

---

## Phase 5 — Task system upgrade

### Task 5.1: Redesign Add Task form

**Objective:** Capture client/project/tag metadata without clutter.

**Files:**
- Modify: `src/components/life-os/TasksSection.tsx`

**Fields:**
- Title
- Why / next step
- Priority
- Client select
- Project select filtered by client
- Tags quick chips: `Iacovici.it`, `ProHappyA`, `ABC`, `Zâmbetin`, `vindepemarte`, `Health`, `Anti-scroll`

**Responsive:** one column on mobile, two columns where useful.

### Task 5.2: Add task filters

**Objective:** Make task board less overwhelming.

**Filters:**
- Client
- Priority
- Tag
- Status
- Due today / overdue / no date

**Default view:** Today + high priority first, not infinite old backlog.

### Task 5.3: Improve task cards

**Objective:** Every task card should communicate priority and next move fast.

**Card layout:**
- Title
- Client pill if linked
- Priority pill
- Tags row, wrapped
- Due date if present
- Description clamped to 5–8 lines with expand option later
- One primary status button with clearer text:
  - `Start` for todo
  - `Mark done` for in-progress
  - `Reopen` for done

---

## Phase 6 — Client dashboards

### Task 6.1: Build client overview cards

**Objective:** Turn Clients tab into a real CRM command center.

**Files:**
- Modify: `src/components/life-os/ClientsSection.tsx`

**Each client card shows:**
- Status/stage/priority
- Next action
- Open tasks count
- Doing tasks count
- Latest project
- Last log
- Button: `Open client dashboard`

### Task 6.2: Add selected client dashboard panel

**Objective:** Dedicated dashboard per client without needing separate routes yet.

**Behavior:**
- Local state `selectedClientId`.
- Shows: tasks, projects, time logs, content items mentioning/linked to client, suggestions.
- For Zâmbetin: show CapMareBot status/tasks if available later.

**Responsive:**
- Mobile: client list then selected dashboard below.
- Desktop: sidebar client list + main dashboard.

### Task 6.3: Improve client task matching

**Objective:** Prefer explicit `clientId`, fallback to fuzzy matching only if missing.

**Logic:**
```ts
const linkedTasks = tasks.filter(task => task.clientId === client.id);
const fallbackTasks = tasks.filter(task => !task.clientId && includesClientName(task, client.name));
```

---

## Phase 7 — Content and project lanes

### Task 7.1: Make content pipeline brand-aware

**Objective:** Separate Iacovici.it, Zâmbetin TV, vindepemarte, fanpage.

**UI:**
- Brand filter chips.
- Status columns: idea, script, recorded, editing, scheduled, published, measured.
- Highlight current bottleneck.

### Task 7.2: Improve projects tab into operating map

**Objective:** Show all life/business lanes as a strategic map.

**Groups:**
- Money/client work: ABC, ProHappyA, Zâmbetin.
- Authority engine: Iacovici.it.
- Artist: vindepemarte.
- Distribution experiments: fanpage/comedy.
- Health/system: sleep, gym, anti-scroll.

---

## Phase 8 — Copy, labels, and micro UX

### Task 8.1: Rewrite UI text in Alexandru/Lexa voice

**Objective:** Remove generic app copy and make it feel like Alexandru’s private OS.

**Examples:**
- Header: “Life OS — command center for money, content, clients and energy.”
- Empty tasks: “No panic. Add the next tiny action or ask Lexa for a battle plan.”
- Clients empty: “Mention a client in Telegram and Lexa will connect the dots.”
- Proactivity panel: show actual active cron/audit jobs after later wiring.

### Task 8.2: Standardize buttons

**Objective:** Buttons should tell the user exactly what happens.

**Replace:**
- `Move status` → `Start`, `Mark done`, `Reopen`.
- `Add task` → `Save task`.
- `Add time log` → `Save time block`.
- `Save inspiration` → `Save research link`.

### Task 8.3: Overflow hardening pass

**Objective:** Prevent ugly long strings/URLs/descriptions.

**Apply:**
- `min-w-0` to flex/grid children.
- `break-words` on titles/descriptions.
- `break-all` only for URLs.
- `max-h` + `overflow-y-auto` for long detail sections.
- `line-clamp` if Tailwind plugin/support exists; otherwise avoid plugin and use max-height.

---

## Phase 9 — QA, deployment, and verification

### Task 9.1: Run static checks

```bash
npm run lint
npm run build
```

**Expected:** both pass.

### Task 9.2: Browser responsive QA

**Command:**
```bash
npm run dev
```

**Check:** Use browser at local URL and test widths 320/375/430/768/1024/1440/1920.

**Record results:** update `docs/qa/life-os-responsive-audit.md`.

### Task 9.3: Commit changes

**Commit sequence:**
1. `docs: add life os x1000 implementation plan`
2. `feat(db): add task client tags schema`
3. `refactor(life-os): extract ui primitives and sections`
4. `feat(life-os): add client-aware task dashboards`
5. `style(life-os): harden responsive layout and copy`

### Task 9.4: Deploy to Vercel

**Command pattern:**
```bash
set -a; . ~/.hermes/.env; set +a
vercel deploy --prod --yes --token "$VERCEL_TOKEN" --scope iacovici95-gmailcoms-projects
```

**Verify:**
- Inspect production URL.
- Log in.
- Confirm DB sync.
- Confirm no horizontal overflow on mobile.
- Confirm client dashboards show linked tasks.

---

## Suggested execution order

1. Save this plan and DB roadmap record. ✅
2. Implement DB migration + verifier.
3. Backfill task/client links.
4. Refactor component structure without changing UX.
5. Replace nav + shared primitives.
6. Upgrade Tasks tab.
7. Upgrade Clients tab.
8. Upgrade Content/Projects tabs.
9. Copy/overflow polish.
10. Full QA + deploy.

## Do not do yet

- Do not add a heavy UI library unless the current Tailwind stack becomes limiting.
- Do not create separate client routes until dashboard-in-tab is verified.
- Do not claim production success before live Vercel verification.
- Do not delete old task data during migration.

## First implementation slice recommended

The first shippable slice should be:

1. `tasks.client_id`, `client_project_id`, `tags` migration + verifier.
2. Backfill ABC/ProHappyA/Zâmbetin/Iacovici.it/vindepemarte links.
3. UI nav overflow fix.
4. Task cards show client/tags.
5. Clients tab uses explicit links.
6. lint/build.

This slice alone makes the Life OS immediately clearer without risking a giant rewrite.
