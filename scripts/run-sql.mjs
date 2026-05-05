import fs from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';

const connectionString = process.env.LIFE_OS_DATABASE_URL || process.env.POSTGRES_URL || process.env.DATABASE_URL;
const migrationPath = process.argv[2];

async function main() {
  if (!connectionString) throw new Error('Missing LIFE_OS_DATABASE_URL/POSTGRES_URL/DATABASE_URL');
  if (!migrationPath) throw new Error('Usage: node scripts/run-sql.mjs <path.sql>');
  const sql = fs.readFileSync(path.resolve(migrationPath), 'utf8');
  const client = new Client({ connectionString });
  await client.connect();
  await client.query(sql);
  await client.end();
  console.log(`Applied ${migrationPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
