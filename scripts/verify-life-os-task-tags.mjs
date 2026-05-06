#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import pg from 'pg';

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs.readFileSync(filePath, 'utf8')
      .split(/\r?\n/)
      .filter((line) => line && !line.trim().startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index).trim();
        const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
        return [key, value];
      }),
  );
}

const env = { ...process.env, ...loadEnv(path.join(process.cwd(), '.env.local')) };
const connectionString = env.LIFE_OS_DATABASE_URL || env.POSTGRES_URL || env.DATABASE_URL;
if (!connectionString) {
  console.error('FAIL missing LIFE_OS_DATABASE_URL');
  process.exit(1);
}

const requiredColumns = ['client_id', 'client_project_id', 'tags', 'source', 'sort_order', 'due_date'];
const requiredIndexes = ['tasks_client_id_idx', 'tasks_client_project_id_idx', 'tasks_tags_gin_idx'];
const pool = new pg.Pool({ connectionString, max: 1, idleTimeoutMillis: 5_000, connectionTimeoutMillis: 10_000 });

try {
  const columns = await pool.query(
    `select column_name from information_schema.columns where table_schema='life_os' and table_name='tasks' and column_name = any($1::text[])`,
    [requiredColumns],
  );
  const foundColumns = new Set(columns.rows.map((row) => row.column_name));
  const missingColumns = requiredColumns.filter((column) => !foundColumns.has(column));

  const indexes = await pool.query(
    `select indexname from pg_indexes where schemaname='life_os' and tablename='tasks' and indexname = any($1::text[])`,
    [requiredIndexes],
  );
  const foundIndexes = new Set(indexes.rows.map((row) => row.indexname));
  const missingIndexes = requiredIndexes.filter((index) => !foundIndexes.has(index));

  const counts = await pool.query(
    `select count(*)::int as total,
            count(client_id)::int as linked,
            count(*) filter (where cardinality(tags)>0)::int as tagged
     from life_os.tasks`,
  );

  if (missingColumns.length || missingIndexes.length) {
    console.error(JSON.stringify({ ok: false, missingColumns, missingIndexes, counts: counts.rows[0] }));
    process.exit(1);
  }

  console.log(JSON.stringify({ ok: true, columns: requiredColumns.length, indexes: requiredIndexes.length, counts: counts.rows[0] }));
} finally {
  await pool.end();
}
