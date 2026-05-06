-- Life OS x1000 first slice: explicit task → client/project/tag metadata.
-- Use admin/root DSN for DDL; normal app reads/writes keep using life_os_app.

alter table life_os.tasks
  add column if not exists client_id uuid references life_os.clients(id) on delete set null,
  add column if not exists client_project_id uuid references life_os.client_projects(id) on delete set null,
  add column if not exists tags text[] not null default '{}',
  add column if not exists source text not null default 'manual',
  add column if not exists sort_order integer not null default 0,
  add column if not exists due_date date;

create index if not exists tasks_client_id_idx on life_os.tasks(client_id);
create index if not exists tasks_client_project_id_idx on life_os.tasks(client_project_id);
create index if not exists tasks_tags_gin_idx on life_os.tasks using gin(tags);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'life_os' and table_name = 'tasks' and column_name = 'due_date'
  ) then
    create index if not exists tasks_status_priority_due_idx on life_os.tasks(status, priority, due_date);
  else
    create index if not exists tasks_status_priority_idx on life_os.tasks(status, priority);
  end if;
end $$;

-- Conservative backfill: use task titles for client assignment so internal Life OS roadmap
-- notes that mention many clients do not get linked to the wrong account.
with client_aliases(tag, aliases) as (
  values
    ('prohappya', array['prohappya','prohappy a']),
    ('zâmbetin', array['zâmbetin','zambetin','cătălin','catalin','youtube bambini','youtube kids']),
    ('iacovici', array['iacovici.it','iacovici']),
    ('vindepemarte', array['vindepemarte']),
    ('abc', array['abc','vetrate'])
), task_matches as (
  select
    t.id as task_id,
    ca.tag,
    (
      select c.id
      from life_os.clients c
      where exists (select 1 from unnest(ca.aliases) a where lower(c.name) like '%' || a || '%')
      order by c.updated_at desc nulls last, c.created_at desc nulls last
      limit 1
    ) as client_id
  from life_os.tasks t
  join client_aliases ca on lower(t.title) like any (select '%' || a || '%' from unnest(ca.aliases) a)
  where lower(t.title) not like 'life os%'
), task_backfill as (
  select
    t.id,
    min(tm.client_id::text)::uuid as client_id,
    array_remove(array[
      case when lower(t.title) like 'life os%' then 'life-os' end,
      case when lower(coalesce(t.title,'') || ' ' || coalesce(t.notes,'')) ~ '(content|video|shorts|reels|youtube|tiktok|instagram)' then 'content' end,
      case when lower(t.title) ~ '(call|cliente|client)' then 'client-call' end
    ], null) || coalesce(array_agg(distinct tm.tag) filter (where tm.tag is not null), '{}'::text[]) as tags
  from life_os.tasks t
  left join task_matches tm on tm.task_id = t.id
  group by t.id, t.title, t.notes
)
update life_os.tasks t
set client_id = coalesce(t.client_id, tb.client_id),
    tags = (select array(select distinct unnest(coalesce(t.tags, '{}'::text[]) || tb.tags))),
    source = case when t.source = 'manual' and cardinality(tb.tags) > 0 then 'lexa-backfill' else t.source end,
    updated_at = now()
from task_backfill tb
where tb.id = t.id and (tb.client_id is not null or cardinality(tb.tags) > 0);

update life_os.tasks t
set client_project_id = (
      select cp.id
      from life_os.client_projects cp
      where cp.client_id = t.client_id
      order by cp.updated_at desc nulls last, cp.created_at desc nulls last
      limit 1
    ),
    updated_at = now()
where t.client_id is not null
  and t.client_project_id is null
  and exists (select 1 from life_os.client_projects cp where cp.client_id = t.client_id);

grant usage on schema life_os to life_os_app;
grant select, insert, update, delete on life_os.tasks to life_os_app;
grant select on life_os.clients to life_os_app;
grant select on life_os.client_projects to life_os_app;
