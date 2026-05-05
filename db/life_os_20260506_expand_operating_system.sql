-- Life OS production schema expansion: clients, content pipeline, suggestions, daily journals.
-- Assumes existing life_os schema and gen_random_uuid() support already used by the app tables.

create table if not exists life_os.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('lead', 'active', 'paused', 'won', 'lost')),
  stage text not null default 'discovery',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  contact_name text,
  contact_channel text,
  website text,
  notes text not null default '',
  next_action text,
  next_action_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists life_os.client_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references life_os.clients(id) on delete cascade,
  title text not null,
  status text not null default 'planned' check (status in ('planned', 'doing', 'waiting', 'done', 'paused')),
  value_estimate numeric(10,2),
  deadline date,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists life_os.content_items (
  id uuid primary key default gen_random_uuid(),
  brand text not null default 'Iacovici.it',
  platform text not null default 'YouTube',
  title text not null,
  status text not null default 'idea' check (status in ('idea', 'script', 'recorded', 'editing', 'scheduled', 'published', 'measured')),
  idea_source text,
  hook text,
  script_notes text not null default '',
  asset_url text,
  publish_url text,
  planned_date date,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists life_os.lexa_suggestions (
  id uuid primary key default gen_random_uuid(),
  suggestion_type text not null default 'next_action',
  title text not null,
  body text not null default '',
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'open' check (status in ('open', 'accepted', 'done', 'dismissed')),
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists life_os.daily_journals (
  id uuid primary key default gen_random_uuid(),
  journal_date date not null unique default current_date,
  plan_top_three text[] not null default '{}',
  done_items text[] not null default '{}',
  energy integer check (energy between 0 and 10),
  mood text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clients_status_priority_idx on life_os.clients(status, priority);
create index if not exists client_projects_client_id_idx on life_os.client_projects(client_id);
create index if not exists content_items_status_planned_idx on life_os.content_items(status, planned_date);
create index if not exists lexa_suggestions_status_priority_idx on life_os.lexa_suggestions(status, priority);
create index if not exists daily_journals_date_idx on life_os.daily_journals(journal_date desc);

insert into life_os.clients (name, status, stage, priority, contact_name, contact_channel, website, notes, next_action)
values
  ('ABC Vetrate Panoramiche', 'active', 'delivery', 'high', null, 'WhatsApp / call', null, 'Client work lane for vetrate panoramiche website, sales assets and follow-up execution.', 'Prepare next concrete deliverable and client update.'),
  ('ProHappyA', 'active', 'product build', 'high', null, 'GitHub / operations', null, 'Operational CRM/order/pricing/settlement platform rebuild for assignment demos.', 'Keep platform work moving with verified milestones.'),
  ('Catalin YouTube Kids', 'lead', 'offer shaping', 'medium', 'Catalin', 'Telegram / WhatsApp', null, 'Potential YouTube kids content/support project.', 'Clarify offer, scope and decision timeline.')
on conflict do nothing;

insert into life_os.client_projects (client_id, title, status, notes)
select id, 'Production-ready client asset system', 'doing', 'Track demos, follow-ups, screenshots, copy and next action for selling website work.'
from life_os.clients
where name = 'ABC Vetrate Panoramiche'
on conflict do nothing;

insert into life_os.content_items (brand, platform, title, status, idea_source, hook, script_notes)
values
  ('Iacovici.it', 'YouTube Shorts / Instagram Reels', 'Weekly AI workflow batch', 'script', 'Lexa weekly research', 'Most people use AI like a toy; here is how to turn it into a client asset.', 'Prepare concise practical scripts, captions and visual examples.'),
  ('vindepemarte', 'TikTok / Reels / Shorts', 'Tri-lingual artist story clip', 'idea', 'Artist lane', 'I come from Mars, but the feeling is human.', 'Keep separate from comedy and Iacovici.it business content.')
on conflict do nothing;

insert into life_os.lexa_suggestions (suggestion_type, title, body, priority)
values
  ('next_action', 'Build the real client/demo CRM spine', 'Move prospects, demo links, screenshots, follow-up scripts and next calls into structured records instead of scattered notes.', 'high'),
  ('content', 'Ask for prior-week content metrics before Tuesday batch', 'Collect views, retention, followers, comments and saves so the next batch improves instead of guessing.', 'medium')
on conflict do nothing;

insert into life_os.daily_journals (journal_date, plan_top_three, done_items, energy, mood, notes)
values (current_date, array['Money/client commitment', 'Content asset that can create clients', 'Energy-preserving execution block'], '{}', null, 'ready', 'Daily journal initialized for morning plan and evening Done Journal.')
on conflict (journal_date) do nothing;
