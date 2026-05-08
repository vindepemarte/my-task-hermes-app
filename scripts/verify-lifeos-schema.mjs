import { Client } from 'pg';

const connectionString = process.env.LIFE_OS_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

const expected = {
  clients: ['id', 'name', 'status', 'stage', 'priority', 'contact_name', 'contact_channel', 'website', 'notes', 'next_action', 'next_action_date', 'created_at', 'updated_at'],
  client_projects: ['id', 'client_id', 'title', 'status', 'value_estimate', 'deadline', 'notes', 'created_at', 'updated_at'],
  content_items: ['id', 'brand', 'platform', 'title', 'status', 'idea_source', 'hook', 'script_notes', 'asset_url', 'publish_url', 'planned_date', 'published_at', 'created_at', 'updated_at'],
  lexa_suggestions: ['id', 'suggestion_type', 'title', 'body', 'priority', 'status', 'related_entity_type', 'related_entity_id', 'created_at', 'updated_at'],
  daily_journals: ['id', 'journal_date', 'plan_top_three', 'done_items', 'energy', 'mood', 'notes', 'created_at', 'updated_at'],
  business_units: ['id', 'slug', 'name', 'category', 'purpose', 'target_audience', 'core_offer', 'main_fvp', 'main_statistic', 'supporting_statistics', 'current_condition', 'condition_formula', 'strategic_plan', 'owner', 'critical_lines', 'status', 'next_review_at', 'metadata', 'created_at', 'updated_at'],
  final_valuable_products: ['id', 'business_unit_id', 'name', 'description', 'recipient', 'proof_required', 'value_type', 'status', 'created_at', 'updated_at'],
  admin_statistics: ['id', 'business_unit_id', 'name', 'description', 'unit', 'cadence', 'direction', 'is_main', 'status', 'created_at', 'updated_at'],
  statistic_entries: ['id', 'statistic_id', 'period_start', 'period_end', 'value', 'previous_value', 'delta', 'source', 'evidence_url', 'notes', 'created_at', 'updated_at'],
  operating_conditions: ['code', 'name', 'description', 'formula_steps', 'severity', 'requires_human_review'],
  condition_assignments: ['id', 'business_unit_id', 'condition_code', 'statistic_id', 'rationale', 'assigned_by', 'status', 'assigned_at', 'closed_at', 'created_at', 'updated_at'],
  battle_plans: ['id', 'business_unit_id', 'plan_type', 'title', 'purpose', 'period_start', 'period_end', 'status', 'linked_condition_assignment_id', 'strategic_plan_link', 'review_notes', 'created_by', 'created_at', 'updated_at'],
  battle_plan_items: ['id', 'battle_plan_id', 'task_id', 'final_valuable_product_id', 'statistic_id', 'title', 'output_expected', 'proof_required', 'owner', 'due_at', 'status', 'sort_order', 'created_at', 'updated_at'],
  execution_reports: ['id', 'business_unit_id', 'battle_plan_id', 'battle_plan_item_id', 'task_id', 'report_type', 'title', 'summary', 'proof_url', 'statistic_effect', 'next_action', 'reported_by', 'reported_at', 'created_at', 'updated_at'],
};

async function main() {
  if (!connectionString) throw new Error('Missing LIFE_OS_DATABASE_URL/POSTGRES_URL/DATABASE_URL');
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    select table_name, column_name
    from information_schema.columns
    where table_schema = 'life_os'
    order by table_name, ordinal_position
  `);
  const actual = new Map();
  for (const row of result.rows) {
    if (!actual.has(row.table_name)) actual.set(row.table_name, new Set());
    actual.get(row.table_name).add(row.column_name);
  }
  const missing = [];
  for (const [table, columns] of Object.entries(expected)) {
    if (!actual.has(table)) {
      missing.push(`missing table life_os.${table}`);
      continue;
    }
    for (const column of columns) {
      if (!actual.get(table).has(column)) missing.push(`missing column life_os.${table}.${column}`);
    }
  }
  await client.end();
  if (missing.length) {
    console.error(missing.join('\n'));
    process.exit(1);
  }
  console.log('Life OS schema ok:', Object.keys(expected).join(', '));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
