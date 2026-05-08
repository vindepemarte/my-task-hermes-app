-- Admin Battle Plan Life OS Phase 2
-- Adds non-destructive cleanup, operating events, decision log, and proof/outness tracking.

ALTER TABLE life_os.tasks ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE life_os.tasks ADD COLUMN IF NOT EXISTS proof_url text NOT NULL DEFAULT '';
ALTER TABLE life_os.tasks ADD COLUMN IF NOT EXISTS output_expected text NOT NULL DEFAULT '';
ALTER TABLE life_os.tasks ADD COLUMN IF NOT EXISTS blocked_reason text NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS life_os.operating_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL CHECK (event_type IN ('stat','done','blocked','decision','order','note','risk','outness','proof','cleanup')),
  business_unit_id uuid REFERENCES life_os.business_units(id) ON DELETE SET NULL,
  task_id uuid REFERENCES life_os.tasks(id) ON DELETE SET NULL,
  statistic_id uuid REFERENCES life_os.admin_statistics(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  raw_text text NOT NULL DEFAULT '',
  value numeric,
  proof_url text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','processed','needs_review','closed','archived')),
  source text NOT NULL DEFAULT 'telegram',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_os.decision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid REFERENCES life_os.business_units(id) ON DELETE SET NULL,
  decision text NOT NULL,
  rationale text NOT NULL DEFAULT '',
  expected_effect text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','reversed','superseded','archived')),
  source text NOT NULL DEFAULT 'lexa',
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_os.life_os_cleanup_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL CHECK (action IN ('archive','hide','merge','restore','flag')),
  reason text NOT NULL DEFAULT '',
  performed_by text NOT NULL DEFAULT 'Lexa',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_archived_status ON life_os.tasks (archived_at, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_operating_events_type_status ON life_os.operating_events (event_type, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_operating_events_bu_created ON life_os.operating_events (business_unit_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_log_bu_decided ON life_os.decision_log (business_unit_id, decided_at DESC);

-- Mark old seed/default tasks as archived if they are still open and not connected to today's battle plan.
UPDATE life_os.tasks
SET archived_at = now(),
    tags = array(select distinct unnest(coalesce(tags, '{}'::text[]) || ARRAY['archived-noise']::text[])),
    notes = trim(coalesce(notes,'') || E'\n\nArchived by Life OS cleanup: old seed/default task not useful for current real operating system.'),
    updated_at = now()
WHERE source = 'seed'
  AND status <> 'done'
  AND archived_at IS NULL
  AND NOT ('battle-plan' = ANY(coalesce(tags, '{}'::text[])));

INSERT INTO life_os.life_os_cleanup_log (entity_type, entity_id, action, reason)
SELECT 'task', id, 'archive', 'Old seed/default task hidden from active Life OS; retained for audit.'
FROM life_os.tasks
WHERE 'archived-noise' = ANY(coalesce(tags, '{}'::text[]))
ON CONFLICT DO NOTHING;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA life_os TO life_os_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA life_os TO life_os_app;
