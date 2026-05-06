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
        return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^['"]|['"]$/g, '')];
      }),
  );
}

const env = { ...process.env, ...loadEnv(path.join(process.cwd(), '.env.local')) };
const connectionString = env.LIFE_OS_DATABASE_URL || env.POSTGRES_URL || env.DATABASE_URL;
if (!connectionString) {
  console.error('FAIL missing LIFE_OS_DATABASE_URL');
  process.exit(1);
}

const pool = new pg.Pool({ connectionString, max: 1, idleTimeoutMillis: 5_000, connectionTimeoutMillis: 10_000 });
const clientAliases = [
  ['ABC', ['abc', 'vetrate']],
  ['ProHappyA', ['prohappya', 'prohappy a']],
  ['Zambetin', ['zâmbetin', 'zambetin', 'cătălin', 'catalin', 'youtube bambini', 'youtube kids']],
  ['Iacovici.it', ['iacovici.it', 'iacovici']],
  ['vindepemarte', ['vindepemarte']],
];

function includesAny(value, aliases) {
  const normalized = (value || '').toLowerCase();
  return aliases.some((alias) => normalized.includes(alias));
}

try {
  const clients = await pool.query(`select id, name from life_os.clients`);
  const projects = await pool.query(`select id, client_id from life_os.client_projects order by updated_at desc nulls last, created_at desc nulls last`);
  const tasks = await pool.query(`select id, title, notes, client_id, client_project_id, coalesce(tags, '{}'::text[]) as tags from life_os.tasks`);
  const summary = Object.fromEntries(clientAliases.map(([label]) => [label, 0]));
  summary.tagged = 0;

  for (const task of tasks.rows) {
    const title = (task.title || '').toLowerCase();
    const full = `${task.title || ''} ${task.notes || ''}`.toLowerCase();
    const tags = new Set();
    let clientId = task.client_id || null;
    let projectId = task.client_project_id || null;
    for (const existingTag of task.tags || []) tags.add(existingTag);

    if (title.startsWith('life os') || title.includes('life os')) tags.add('life-os');
    if (/(content|video|shorts|reels|youtube|tiktok|instagram)/i.test(full)) tags.add('content');
    if (/(call|cliente|client)/i.test(title)) tags.add('client-call');

    if (!title.startsWith('life os')) {
      for (const [label, aliases] of clientAliases) {
        if (!includesAny(title, aliases)) continue;
        tags.add(label === 'Iacovici.it' ? 'iacovici' : label === 'Zambetin' ? 'zâmbetin' : label.toLowerCase());
        summary[label] += 1;
        const matchedClient = clients.rows.find((client) => includesAny(client.name, aliases));
        if (matchedClient && !clientId) {
          clientId = matchedClient.id;
          const project = projects.rows.find((item) => item.client_id === clientId);
          projectId = project?.id || null;
        }
      }
    }

    if (tags.size) summary.tagged += 1;
    await pool.query(
      `update life_os.tasks
       set client_id=coalesce($2, client_id),
           client_project_id=coalesce($3, client_project_id),
           tags=coalesce((select array_agg(distinct tag order by tag) from unnest(coalesce(tags, '{}'::text[]) || $4::text[]) as tag), '{}'::text[]),
           source=case when source='manual' and cardinality($4::text[]) > 0 then 'lexa-backfill' else source end,
           updated_at=now()
       where id=$1`,
      [task.id, clientId, projectId, [...tags].sort()],
    );
  }

  console.log(JSON.stringify(summary));
} finally {
  await pool.end();
}
