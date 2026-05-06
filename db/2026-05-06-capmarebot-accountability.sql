-- CapMareBot / external collaborator accountability tables
-- Purpose: track collaborator reminder tasks, button responses, snoozes, and reminder events.

create table if not exists life_os.external_bot_tasks (
  id uuid primary key default gen_random_uuid(),
  bot_key text not null,
  project text not null,
  assignee_chat_id text not null,
  assignee_name text not null default '',
  title text not null,
  description text not null default '',
  status text not null default 'open' check (status in ('open', 'done', 'snoozed', 'cancelled')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  source text not null default 'alex',
  due_at timestamptz,
  next_remind_at timestamptz,
  last_reminded_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists external_bot_tasks_open_idx
  on life_os.external_bot_tasks (bot_key, project, status, priority, due_at, created_at);

create index if not exists external_bot_tasks_next_remind_idx
  on life_os.external_bot_tasks (bot_key, status, next_remind_at)
  where status in ('open', 'snoozed');

create table if not exists life_os.external_bot_events (
  id uuid primary key default gen_random_uuid(),
  bot_key text not null,
  project text not null,
  task_id uuid references life_os.external_bot_tasks(id) on delete set null,
  event_type text not null check (event_type in (
    'task_created',
    'task_updated',
    'reminder_sent',
    'button_done',
    'button_not_yet',
    'button_later',
    'snooze_scheduled',
    'snooze_sent',
    'ack_sent',
    'error'
  )),
  telegram_update_id bigint,
  telegram_message_id bigint,
  callback_query_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (telegram_update_id),
  unique (callback_query_id)
);

create index if not exists external_bot_events_task_idx
  on life_os.external_bot_events (task_id, created_at desc);

create index if not exists external_bot_events_bot_idx
  on life_os.external_bot_events (bot_key, project, created_at desc);

-- The application role should already own/use life_os tables in this project.
-- If this migration is run as an admin/owner, keep app CRUD rights explicit.
grant select, insert, update, delete on life_os.external_bot_tasks to life_os_app;
grant select, insert, update, delete on life_os.external_bot_events to life_os_app;
