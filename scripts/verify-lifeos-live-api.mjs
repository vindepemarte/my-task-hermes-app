#!/usr/bin/env node
import { createHash } from 'node:crypto';
import pg from 'pg';

const { Pool } = pg;

const LIVE_URL = process.env.LIFE_OS_LIVE_URL || 'https://my-task-hermes-app.vercel.app';
const sessionSecret = process.env.LIFE_OS_SESSION_SECRET;
const databaseUrl = process.env.LIFE_OS_DATABASE_URL;

if (!sessionSecret) throw new Error('Missing LIFE_OS_SESSION_SECRET');
if (!databaseUrl) throw new Error('Missing LIFE_OS_DATABASE_URL');

function createSessionToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 1000 * 60 * 15 })).toString('base64url');
  const signature = createHash('sha256').update(`${payload}.${sessionSecret}`).digest('base64url');
  return `${payload}.${signature}`;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(`${LIVE_URL}${path}`, options);
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

const marker = `phase5-live-api-smoke-${Date.now()}`;
const token = createSessionToken();
const pool = new Pool({ connectionString: databaseUrl, ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined });

try {
  const unauth = await fetchJson('/api/life-os');
  if (unauth.response.status !== 401) throw new Error(`Expected unauthenticated GET 401, got ${unauth.response.status}`);

  const auth = await fetchJson('/api/life-os', { headers: { Authorization: `Bearer ${token}` } });
  if (!auth.response.ok) throw new Error(`Authenticated GET failed: ${auth.response.status}`);
  const requiredKeys = ['businessUnits', 'finalValuableProducts', 'adminStatistics', 'operatingEvents', 'decisionLog'];
  for (const key of requiredKeys) {
    if (!Array.isArray(auth.body?.[key])) throw new Error(`Authenticated state missing array: ${key}`);
  }

  const post = await fetchJson('/api/life-os', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'operatingUpdate',
      data: {
        text: `risk outness ${marker} Life OS live API closure verification; archive after smoke`,
        source: 'phase5-live-api-smoke',
        title: 'Phase 5 live API smoke verification',
      },
    }),
  });
  if (!post.response.ok) throw new Error(`Authenticated POST failed: ${post.response.status} ${JSON.stringify(post.body)}`);
  if (post.body?.eventType !== 'risk' || post.body?.status !== 'needs_review') {
    throw new Error(`Unexpected POST result: ${JSON.stringify({ eventType: post.body?.eventType, status: post.body?.status })}`);
  }

  const client = await pool.connect();
  try {
    await client.query('begin');
    const archived = await client.query(
      `update life_os.operating_events
       set status='archived',
           metadata = metadata || jsonb_build_object('archived_by','verify-lifeos-live-api','archived_reason','phase5 live API smoke test completed'),
           updated_at=now()
       where source='phase5-live-api-smoke' and raw_text like $1
       returning id`,
      [`%${marker}%`],
    );
    if (archived.rowCount !== 1) throw new Error(`Expected to archive 1 smoke event, archived ${archived.rowCount}`);
    await client.query(
      `insert into life_os.life_os_cleanup_log (entity_type, entity_id, action, reason, performed_by)
       values ('operating_event', $1, 'archive', $2, 'Lexa')`,
      [archived.rows[0].id, 'Phase 5 live API smoke event archived after successful authenticated POST verification.'],
    );
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }

  console.log(JSON.stringify({
    ok: true,
    liveUrl: LIVE_URL,
    unauthenticatedGet: unauth.response.status,
    authenticatedGet: auth.response.status,
    authenticatedPost: post.response.status,
    archivedSmokeEvent: true,
    adminStateArraysVerified: requiredKeys,
  }));
} finally {
  await pool.end();
}
