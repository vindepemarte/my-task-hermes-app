# Life OS x1000 Responsive QA Audit

Date: 2026-05-06
Scope: local and production Life OS dashboard after responsive/client-aware upgrade.

## Static gates

- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] `node scripts/verify-life-os-task-tags.mjs` passes
- [x] DB task metadata columns exist: `client_id`, `client_project_id`, `tags`, `source`, `sort_order`, `due_date`
- [x] App role can read/write tasks with metadata

## Viewport checklist

For each viewport, check: no horizontal page overflow, no clipped text, no unusable inputs, buttons >= ~44px high, cards wrap long titles/descriptions/URLs.

### 320px
- [ ] Header readable
- [ ] Auth form usable
- [ ] Tab nav usable via horizontal scroll
- [ ] Mobile command strip visible and not blocking primary content
- [ ] Task board one column, cards wrap
- [ ] Clients dashboard stacks correctly
- [ ] Content cards/URLs wrap safely
- [ ] Analytics cards/logs wrap safely
- [ ] Inspiration URLs use `break-all`
- [ ] Projects/Ideas/Modes cards fit

### 375px
- [ ] Header/auth/nav/tasks/clients/content/analytics/inspiration/projects/ideas/modes pass

### 430px
- [ ] Header/auth/nav/tasks/clients/content/analytics/inspiration/projects/ideas/modes pass

### 768px
- [ ] Tablet layout uses useful columns without overflow
- [ ] Client dashboard list + detail remain readable

### 1024px
- [ ] Desktop nav/grid works without clipped hint text
- [ ] Task columns fit

### 1440px
- [ ] Content width feels intentional; no stretched unreadable cards

### 1920px
- [ ] Max-width container prevents ultrawide chaos

## Feature QA

- [x] New task can be saved with client/project/tags/due date in the React/API model
- [x] Task filters work by client, tag, status
- [x] Status buttons read `Start`, `Mark done`, `Reopen`
- [x] Client cards show status/stage/priority/next action/counts/latest project/last log
- [x] Selected client dashboard shows tasks, projects, logs, content/suggestions where relevant
- [x] Content pipeline separates brands and statuses with command-room copy
- [x] Projects tab groups client projects, money-first focus and public account lanes

## Production QA

- [ ] Vercel production URL loads
- [ ] Login works
- [ ] DB sync works
- [ ] Client dashboards show linked tasks
- [ ] Mobile no horizontal overflow

## Notes

- 2026-05-06 local checks passed: `git diff --check`, `npm run lint`, `npm run build`, schema verifier, safe backfill, HTTP `200 OK` smoke.
- Browser tool in the local container could not launch Chromium because sandbox support is unavailable. Use production browser verification after deploy for final visual/mobile checks.
