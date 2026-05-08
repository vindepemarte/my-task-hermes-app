import { Client } from 'pg';

const connectionString = process.env.LIFE_OS_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const text = process.argv.slice(2).join(' ').trim();

function classifyOperatingText(value) {
  const lower = value.toLowerCase();
  if (/\b(done|fatto|finito|completed|pubblicato|consegnato)\b/.test(lower)) return 'done';
  if (/\b(block|blocked|bloccato|ostacolo|non riesco|stuck)\b/.test(lower)) return 'blocked';
  if (/\b(stat|metrica|numero|views|lead|soldi|€|euro|ore|followers?)\b/.test(lower)) return 'stat';
  if (/\b(decid|decisione|scelgo|approvo|go with)\b/.test(lower)) return 'decision';
  if (/\b(order|ordine|devo|must|bisogna)\b/.test(lower)) return 'order';
  if (/\b(risk|rischio|outness|wrong|errore|pericolo)\b/.test(lower)) return 'risk';
  if (/\b(proof|prova|screenshot|link|commit|url)\b/.test(lower)) return 'proof';
  return 'note';
}

async function findBusinessUnit(client, value) {
  const lower = value.toLowerCase();
  const { rows } = await client.query("select id::text, slug, name from life_os.business_units where status <> 'archived'");
  const direct = rows.find((row) => lower.includes(String(row.slug).replaceAll('-', ' ')) || lower.includes(String(row.name).toLowerCase()));
  if (direct) return direct;
  if (/abc|client/.test(lower)) return rows.find((row) => row.slug === 'client-delivery') || null;
  if (/lead|prospect|demo|follow/.test(lower)) return rows.find((row) => row.slug === 'prospects-lead-pipeline') || null;
  if (/prohappya|crm/.test(lower)) return rows.find((row) => row.slug === 'prohappya') || null;
  if (/zambetin|catalin|youtube copii/.test(lower)) return rows.find((row) => row.slug === 'zambetin-tv') || null;
  if (/vindepemarte.*fun|comedy|meme/.test(lower)) return rows.find((row) => row.slug === 'vindepemarte-fun') || null;
  if (/vindepemarte|song|music|suno/.test(lower)) return rows.find((row) => row.slug === 'vindepemarte-music') || null;
  if (/iacovici|ai content|video|corso/.test(lower)) return rows.find((row) => row.slug === 'iacovici-it') || null;
  return null;
}

async function main() {
  if (!connectionString) throw new Error('Missing LIFE_OS_DATABASE_URL/POSTGRES_URL/DATABASE_URL');
  if (!text) throw new Error('Usage: node scripts/lifeos-ingest.mjs "telegram/update text"');
  const client = new Client({ connectionString });
  await client.connect();
  const eventType = classifyOperatingText(text);
  const unit = await findBusinessUnit(client, text);
  const statistic = unit && eventType === 'stat'
    ? (await client.query("select id::text, name from life_os.admin_statistics where business_unit_id=$1 and status='active' order by is_main desc, created_at limit 1", [unit.id])).rows[0]
    : null;
  const numberMatch = text.match(/-?\d+(?:[\.,]\d+)?/);
  const value = numberMatch ? Number(numberMatch[0].replace(',', '.')) : null;
  const title = eventType === 'done' ? 'Completion update' : eventType === 'blocked' ? 'Blocked flow' : eventType === 'stat' ? 'Statistic update' : eventType === 'decision' ? 'Decision captured' : 'Operating note';
  const result = await client.query(
    `insert into life_os.operating_events (event_type, business_unit_id, statistic_id, title, body, raw_text, value, status, source)
     values ($1,$2,$3,$4,$5,$6,$7,$8,'telegram-script') returning id::text`,
    [eventType, unit?.id || null, statistic?.id || null, title, text, text, value, eventType === 'risk' ? 'needs_review' : 'processed'],
  );
  if (eventType === 'decision') {
    await client.query(
      `insert into life_os.decision_log (business_unit_id, decision, rationale, expected_effect, source)
       values ($1,$2,'Captured by Life OS ingest script','Review impact on statistics in next weekly review','telegram-script')`,
      [unit?.id || null, text],
    );
  }
  if (eventType === 'stat' && statistic?.id && value !== null) {
    const previous = await client.query("select value from life_os.statistic_entries where statistic_id=$1 order by period_end desc limit 1", [statistic.id]);
    await client.query(
      `insert into life_os.statistic_entries (statistic_id, period_start, period_end, value, previous_value, notes, source)
       values ($1,current_date,current_date,$2,$3,$4,'telegram-script')
       on conflict (statistic_id, period_start, period_end) do update set value=$2, previous_value=$3, notes=$4, source='telegram-script', updated_at=now()`,
      [statistic.id, value, previous.rows[0]?.value ?? null, text],
    );
  }
  await client.end();
  console.log(JSON.stringify({ id: result.rows[0].id, eventType, businessUnit: unit?.name || null, statistic: statistic?.name || null, value }));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
