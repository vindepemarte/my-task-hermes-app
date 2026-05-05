import { Client } from 'pg';

const connectionString = process.env.LIFE_OS_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;

const expected = {
  clients: ['id', 'name', 'status', 'stage', 'priority', 'contact_name', 'contact_channel', 'website', 'notes', 'next_action', 'next_action_date', 'created_at', 'updated_at'],
  client_projects: ['id', 'client_id', 'title', 'status', 'value_estimate', 'deadline', 'notes', 'created_at', 'updated_at'],
  content_items: ['id', 'brand', 'platform', 'title', 'status', 'idea_source', 'hook', 'script_notes', 'asset_url', 'publish_url', 'planned_date', 'published_at', 'created_at', 'updated_at'],
  lexa_suggestions: ['id', 'suggestion_type', 'title', 'body', 'priority', 'status', 'related_entity_type', 'related_entity_id', 'created_at', 'updated_at'],
  daily_journals: ['id', 'journal_date', 'plan_top_three', 'done_items', 'energy', 'mood', 'notes', 'created_at', 'updated_at'],
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
