-- Admin Battle Plan Life OS System
-- Approved portfolio structure: Our Businesses, Client Delivery, Prospects/Lead Pipeline.
-- ABC Vetrate is Client Delivery only: track Alexandru's deliverables, follow-ups, proofs and payments; do not manage ABC internal business.

-- pgcrypto/gen_random_uuid() and the life_os schema already exist in the app database.

CREATE TABLE IF NOT EXISTS life_os.business_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('our_business','client_delivery','prospect_pipeline')),
  purpose text NOT NULL DEFAULT '',
  target_audience text NOT NULL DEFAULT '',
  core_offer text NOT NULL DEFAULT '',
  main_fvp text NOT NULL DEFAULT '',
  main_statistic text NOT NULL DEFAULT '',
  supporting_statistics text[] NOT NULL DEFAULT '{}'::text[],
  current_condition text NOT NULL DEFAULT 'non_esistenza',
  condition_formula text NOT NULL DEFAULT '',
  strategic_plan text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT 'Alexandru',
  critical_lines text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','completed','archived')),
  next_review_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_os.final_valuable_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid NOT NULL REFERENCES life_os.business_units(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  recipient text NOT NULL DEFAULT '',
  proof_required text NOT NULL DEFAULT '',
  value_type text NOT NULL DEFAULT 'attention' CHECK (value_type IN ('money','attention','asset','relationship','goodwill','learning','system')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_unit_id, name)
);

CREATE TABLE IF NOT EXISTS life_os.admin_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid NOT NULL REFERENCES life_os.business_units(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  unit text NOT NULL DEFAULT 'count',
  cadence text NOT NULL DEFAULT 'weekly' CHECK (cadence IN ('daily','weekly','monthly','event')),
  direction text NOT NULL DEFAULT 'up' CHECK (direction IN ('up','down','stable')),
  is_main boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_unit_id, name)
);

CREATE TABLE IF NOT EXISTS life_os.statistic_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  statistic_id uuid NOT NULL REFERENCES life_os.admin_statistics(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  period_end date NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  previous_value numeric,
  delta numeric GENERATED ALWAYS AS (CASE WHEN previous_value IS NULL THEN NULL ELSE value - previous_value END) STORED,
  source text NOT NULL DEFAULT 'manual',
  evidence_url text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (statistic_id, period_start, period_end)
);

CREATE TABLE IF NOT EXISTS life_os.operating_conditions (
  code text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  formula_steps text[] NOT NULL DEFAULT '{}'::text[],
  severity integer NOT NULL DEFAULT 50 CHECK (severity BETWEEN 1 AND 100),
  requires_human_review boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS life_os.condition_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid NOT NULL REFERENCES life_os.business_units(id) ON DELETE CASCADE,
  condition_code text NOT NULL REFERENCES life_os.operating_conditions(code),
  statistic_id uuid REFERENCES life_os.admin_statistics(id) ON DELETE SET NULL,
  rationale text NOT NULL DEFAULT '',
  assigned_by text NOT NULL DEFAULT 'Lexa',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','superseded','closed')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_os.battle_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid REFERENCES life_os.business_units(id) ON DELETE CASCADE,
  plan_type text NOT NULL CHECK (plan_type IN ('daily','weekly','monthly','program')),
  title text NOT NULL,
  purpose text NOT NULL DEFAULT '',
  period_start date NOT NULL,
  period_end date NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','completed','cancelled','archived')),
  linked_condition_assignment_id uuid REFERENCES life_os.condition_assignments(id) ON DELETE SET NULL,
  strategic_plan_link text NOT NULL DEFAULT '',
  review_notes text NOT NULL DEFAULT '',
  created_by text NOT NULL DEFAULT 'Lexa',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_os.battle_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  battle_plan_id uuid NOT NULL REFERENCES life_os.battle_plans(id) ON DELETE CASCADE,
  task_id uuid REFERENCES life_os.tasks(id) ON DELETE SET NULL,
  final_valuable_product_id uuid REFERENCES life_os.final_valuable_products(id) ON DELETE SET NULL,
  statistic_id uuid REFERENCES life_os.admin_statistics(id) ON DELETE SET NULL,
  title text NOT NULL,
  output_expected text NOT NULL DEFAULT '',
  proof_required text NOT NULL DEFAULT '',
  owner text NOT NULL DEFAULT 'Alexandru',
  due_at timestamptz,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','doing','blocked','done','cancelled')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_os.execution_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid REFERENCES life_os.business_units(id) ON DELETE SET NULL,
  battle_plan_id uuid REFERENCES life_os.battle_plans(id) ON DELETE SET NULL,
  battle_plan_item_id uuid REFERENCES life_os.battle_plan_items(id) ON DELETE SET NULL,
  task_id uuid REFERENCES life_os.tasks(id) ON DELETE SET NULL,
  report_type text NOT NULL DEFAULT 'completion' CHECK (report_type IN ('completion','daily_close','weekly_review','monthly_review','incident','handoff')),
  title text NOT NULL,
  summary text NOT NULL DEFAULT '',
  proof_url text NOT NULL DEFAULT '',
  statistic_effect jsonb NOT NULL DEFAULT '{}'::jsonb,
  next_action text NOT NULL DEFAULT '',
  reported_by text NOT NULL DEFAULT 'Lexa',
  reported_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_os.admin_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid REFERENCES life_os.business_units(id) ON DELETE CASCADE,
  name text NOT NULL,
  line_type text NOT NULL DEFAULT 'communication' CHECK (line_type IN ('communication','production','sales','delivery','finance','content','support','data')),
  source_terminal text NOT NULL DEFAULT '',
  destination_terminal text NOT NULL DEFAULT '',
  flow_description text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','blocked','unclear','retired')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS life_os.hats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_unit_id uuid REFERENCES life_os.business_units(id) ON DELETE CASCADE,
  role_name text NOT NULL,
  purpose text NOT NULL DEFAULT '',
  responsibilities text[] NOT NULL DEFAULT '{}'::text[],
  final_valuable_product text NOT NULL DEFAULT '',
  statistics text[] NOT NULL DEFAULT '{}'::text[],
  procedures text[] NOT NULL DEFAULT '{}'::text[],
  lines text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','retired')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (business_unit_id, role_name)
);

CREATE INDEX IF NOT EXISTS idx_business_units_category_status ON life_os.business_units (category, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_statistics_bu_main ON life_os.admin_statistics (business_unit_id, is_main, status);
CREATE INDEX IF NOT EXISTS idx_statistic_entries_stat_period ON life_os.statistic_entries (statistic_id, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_condition_assignments_bu_status ON life_os.condition_assignments (business_unit_id, status, assigned_at DESC);
CREATE INDEX IF NOT EXISTS idx_battle_plans_type_period ON life_os.battle_plans (plan_type, period_start DESC, status);
CREATE INDEX IF NOT EXISTS idx_battle_plan_items_plan_status ON life_os.battle_plan_items (battle_plan_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_execution_reports_bu_reported ON life_os.execution_reports (business_unit_id, reported_at DESC);

INSERT INTO life_os.operating_conditions (code, name, description, formula_steps, severity, requires_human_review) VALUES
('confusione','Confusione','Dati/area non chiari: scoprire dove si è prima di ordinare.', ARRAY['Definisci area e scena reale','Identifica owner e prodotto','Trova dati mancanti','Stabilisci prima comunicazione utile'], 95, false),
('tradimento','Tradimento','Ruolo non assunto o responsabilità scaricata.', ARRAY['Scopri che sei il terminale responsabile','Scrivi hat minimo','Assumi responsabilità del prodotto','Esegui il primo atto utile'], 90, false),
('nemico','Nemico/Rischio','Rischio grave o intenzioni distruttive: richiede revisione umana.', ARRAY['Non automatizzare giudizi','Raccogli prove','Blocca danni immediati','Chiedi revisione umana'], 100, true),
('dubbio','Dubbio','Area/persona/strategia incerta: decidere con dati e maggiore bene.', ARRAY['Raccogli intenzioni e attività','Confronta statistiche','Decidi il lato da aiutare','Aiuta il lato scelto a migliorare statistiche'], 75, false),
('non_esistenza','Non Esistenza','Nuova area/offerta o linee non stabilite.', ARRAY['Trova linee di comunicazione','Fatti conoscere','Scopri cosa serve/è desiderato','Produci e presenta il prodotto','Mantieni le linee','Migliora il prodotto'], 65, false),
('pericolo','Pericolo','Crash o bypass necessario.', ARRAY['Bypassa solo quanto necessario','Risolvi la situazione immediata','Assegna il pericolo','Riorganizza area/linea','Crea policy per prevenire ricorrenza'], 85, false),
('emergenza','Emergenza','Statistiche giù o piatte dopo periodo migliore.', ARRAY['Promuovi/produci','Cambia base operativa','Economizza','Preparati a consegnare','Stringi disciplina/etica'], 70, false),
('normale','Normale Operatività','Funziona abbastanza: non cambiare ciò che alza le stats.', ARRAY['Non cambiare ciò che funziona','Rafforza ciò che migliora statistiche','Correggi subito ciò che peggiora','Mantieni ritmo'], 45, false),
('abbondanza','Abbondanza','Statistiche fortemente in salita.', ARRAY['Economizza azioni/spese inutili','Paga conti/obblighi','Investi in capacità di delivery','Trova e rinforza la causa'], 30, false),
('potere','Potere','Alto livello stabilizzato.', ARRAY['Non disconnetterti','Scrivi account completo','Rendi trasferibile il sistema','Mantieni connessioni'], 20, false),
('cambio_potere','Cambio di Potere','Nuovo responsabile entra in area funzionante.', ARRAY['Non cambiare nulla subito','Studia org/policy/linee','Emetti solo ordini di routine','Scrivi handoff'], 35, false)
ON CONFLICT (code) DO UPDATE SET name=excluded.name, description=excluded.description, formula_steps=excluded.formula_steps, severity=excluded.severity, requires_human_review=excluded.requires_human_review;

WITH upsert_units AS (
  INSERT INTO life_os.business_units (slug, name, category, purpose, target_audience, core_offer, main_fvp, main_statistic, supporting_statistics, current_condition, condition_formula, strategic_plan, critical_lines, metadata)
  VALUES
  ('iacovici-it','Iacovici.it','our_business','Build Alexandru as practical AI/web creative operator and educator.','Italian/English creators, small businesses and future course buyers.','Practical AI workflows, web/app builds, content, future course/community.','Published useful AI workflow content and client-ready assets.','Published useful videos per week', ARRAY['qualified leads','course/community waitlist','client inquiries','content assets completed'], 'non_esistenza', 'Find lines, publish useful products, maintain lines, improve offer.', 'Create visible trust through weekly content, polished demos, and future course path.', ARRAY['Telegram ↔ Life OS','YouTube/Instagram publishing','GitHub/Vercel delivery','Lead capture'], '{"portfolio_group":"our_business"}'::jsonb),
  ('prohappya','ProHappyA','our_business','Build clean-room operational CRM/order/pricing/settlement platform for Assignment Demos.','Assignment Demos/internal operators needing multi-role CRM workflows.','Operational CRM platform with roles, orders, pricing, settlements and reporting.','Working deployable product increments.','Completed product increments per week', ARRAY['features shipped','bugs closed','demo flows verified','deployment health'], 'non_esistenza', 'Clarify product, build minimum valuable flows, verify demos, improve.', 'Ship a credible CRM platform step-by-step with verifiable demo workflows.', ARRAY['Repo','DB schema','Vercel deploy','User workflows'], '{"portfolio_group":"our_business"}'::jsonb),
  ('vindepemarte-music','Vindepemarte Music','our_business','Grow Alexandru digital artist identity through multilingual songs and lore.','Mainly Romanian audience now; later Italian/Romanian/global listeners.','Songs, visuals, lyric pages, releases, reels and artist lore.','Released song/reel package.','Published music assets per week', ARRAY['song drafts','reels published','views/engagement','follower delta'], 'non_esistenza', 'Find audience lines, publish products, maintain signals, improve language mix.', 'Separate music/lore from comedy and build consistent release rhythm.', ARRAY['Suno/music pipeline','TikTok/Instagram/Facebook/YouTube','Lyrics pages','Analytics'], '{"portfolio_group":"our_business"}'::jsonb),
  ('vindepemarte-fun','Vindepemarte Fun','our_business','Explore comedy/entertainment separately from music lore.','Short-form comedy audience.','Comedy clips, characters, experiments and future vindepemarte.fun assets.','Tested comedy asset.','Validated experiments per month', ARRAY['clips published','retention signals','comments','repeatable formats'], 'non_esistenza', 'Pilot separately; do not pollute music lane.', 'Run small safe experiments only after music lane stays protected.', ARRAY['Content ideas','Posting channel','Metrics'], '{"portfolio_group":"our_business"}'::jsonb),
  ('zambetin-tv','Zâmbetin TV / Cătălin','our_business','Create safe Romanian kids content with Cătălin/Zâmbetin IP.','Romanian children/families, calm playful 2–4 years old lane.','Long videos, Shorts packs, characters, story assets.','Finished kid-safe video package.','Finished video packages per month', ARRAY['raw assets processed','videos edited','shorts derived','publishing consistency'], 'non_esistenza', 'Establish pipeline, produce safe assets, publish, measure.', 'Build RAW → Video Editor Pipeline → ready clips workflow into reliable family/kids channel.', ARRAY['Drive raw assets','Video editor pipeline','YouTube channel','Safety review'], '{"portfolio_group":"our_business"}'::jsonb),
  ('client-delivery','Client Delivery','client_delivery','Track Alexandru work delivered to clients without managing their internal businesses.','ABC Vetrate and future paying/non-paying delivery clients.','Websites, web apps, business cards, changes, proofs, follow-ups, payment tracking.','Client asset delivered with proof.','Client deliverables completed', ARRAY['open client tasks','follow-ups approved','payments/incassi tracked','proofs saved'], 'normale', 'Do not change what works; make commitments visible; correct missing proof/payment.', 'Make every client promise visible, provable, and monetizable.', ARRAY['Client communication','Asset delivery','Proof storage','Invoice/payment tracking'], '{"portfolio_group":"client_delivery","abc_rule":"Track Alexandru delivery only; never manage ABC internal business statistics or conditions."}'::jsonb),
  ('prospects-lead-pipeline','Prospects / Lead Pipeline','prospect_pipeline','Track potential clients not yet closed and convert via useful prepared assets.','Local/online prospects for websites, apps, AI workflows and content systems.','Lead records, tailored demos, outreach, follow-ups and conversion evidence.','Qualified prospect moved to next stage.','Qualified leads advanced', ARRAY['new prospects','demos prepared','follow-ups sent after approval','meetings booked','deals won'], 'non_esistenza', 'Find lines, make useful offer known, present product, maintain follow-up line.', 'Build a low-pressure pipeline of real prospects with polished prepared assets.', ARRAY['Research','Demo preparation','Approved outreach','CRM follow-up'], '{"portfolio_group":"prospect_pipeline"}'::jsonb)
  ON CONFLICT (slug) DO UPDATE SET
    name=excluded.name, category=excluded.category, purpose=excluded.purpose, target_audience=excluded.target_audience,
    core_offer=excluded.core_offer, main_fvp=excluded.main_fvp, main_statistic=excluded.main_statistic,
    supporting_statistics=excluded.supporting_statistics, current_condition=excluded.current_condition,
    condition_formula=excluded.condition_formula, strategic_plan=excluded.strategic_plan,
    critical_lines=excluded.critical_lines, metadata=life_os.business_units.metadata || excluded.metadata, updated_at=now()
  RETURNING id, slug, main_fvp, main_statistic, critical_lines
), fvp_seed AS (
  INSERT INTO life_os.final_valuable_products (business_unit_id, name, description, recipient, proof_required, value_type)
  SELECT id, main_fvp, 'Primary final valuable product for ' || slug, 'Target audience/customer', 'URL, screenshot, file, commit, published link, or client confirmation', CASE WHEN slug='client-delivery' THEN 'money' WHEN slug='prospects-lead-pipeline' THEN 'relationship' ELSE 'attention' END
  FROM upsert_units
  ON CONFLICT (business_unit_id, name) DO UPDATE SET description=excluded.description, proof_required=excluded.proof_required, value_type=excluded.value_type, updated_at=now()
), stat_seed AS (
  INSERT INTO life_os.admin_statistics (business_unit_id, name, description, unit, cadence, direction, is_main)
  SELECT id, main_statistic, 'Main statistic for ' || slug, 'count', 'weekly', 'up', true
  FROM upsert_units
  ON CONFLICT (business_unit_id, name) DO UPDATE SET description=excluded.description, is_main=true, updated_at=now()
)
INSERT INTO life_os.hats (business_unit_id, role_name, purpose, responsibilities, final_valuable_product, statistics, procedures, lines)
SELECT id, 'Owner / Operator', 'Operate the lane by statistics, FVP, condition and battle plan.', ARRAY['Maintain purpose and offer','Produce final valuable products','Update statistics','Execute battle plan','File proof/reports'], main_fvp, ARRAY[main_statistic], ARRAY['Review stats','Assign condition','Follow formula','Create battle plan','Report execution'], critical_lines
FROM upsert_units
ON CONFLICT (business_unit_id, role_name) DO UPDATE SET purpose=excluded.purpose, responsibilities=excluded.responsibilities, final_valuable_product=excluded.final_valuable_product, statistics=excluded.statistics, procedures=excluded.procedures, lines=excluded.lines, updated_at=now();

-- ABC as a Client Delivery record, not as a business unit.
INSERT INTO life_os.clients (name, status, stage, priority, contact_name, contact_channel, website, notes, next_action, next_action_date)
VALUES ('ABC Vetrate', 'active', 'Client Delivery', 'medium', '', '', '', 'Client Delivery only: website/web-app and business-card work by Alexandru. Track deliverables, requested/completed changes, approved follow-ups, proofs of delivery, and related payments/incassi. Do not track/manage ABC internal business operations, statistics or conditions.', 'Wait for approved follow-up or client reply; do not send without confirmation.', NULL)
ON CONFLICT DO NOTHING;

-- If an older ABC name exists, make the rule explicit there too.
UPDATE life_os.clients
SET stage = CASE WHEN stage = '' THEN 'Client Delivery' ELSE stage END,
    notes = CASE WHEN notes ILIKE '%Do not track/manage ABC internal business%' THEN notes ELSE trim(notes || E'\n\nClient Delivery only: track Alexandru delivery/proofs/follow-ups/payments; do not manage ABC internal business statistics or conditions.') END,
    updated_at = now()
WHERE name ILIKE '%ABC%';

-- When this migration is run by the admin/owner role, keep runtime access for the Life OS app role.
GRANT USAGE ON SCHEMA life_os TO life_os_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA life_os TO life_os_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA life_os TO life_os_app;
