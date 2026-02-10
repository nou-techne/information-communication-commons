// Run migrations against Supabase using the service_role key
// Usage: node supabase/run-migrations.mjs

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, 'migrations');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Use the REST SQL endpoint
const SQL_URL = `${SUPABASE_URL}/rest/v1/rpc/`;

async function runSQL(sql, filename) {
  // Use Supabase Management API via pg endpoint
  const resp = await fetch(`${SUPABASE_URL}/pg/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'apikey': SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${filename}: HTTP ${resp.status} — ${text}`);
  }

  return resp.json();
}

async function main() {
  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`Found ${files.length} migration files\n`);

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    console.log(`Running ${file}...`);
    try {
      const result = await runSQL(sql, file);
      console.log(`  ✓ ${file} complete`);
    } catch (err) {
      console.error(`  ✗ ${file} FAILED: ${err.message}`);
      // Try alternative endpoint
      console.log(`  Trying SQL Editor endpoint...`);
      try {
        const resp2 = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({ sql }),
        });
        if (resp2.ok) {
          console.log(`  ✓ ${file} complete (via rpc)`);
        } else {
          const t = await resp2.text();
          console.error(`  ✗ Also failed: ${t}`);
          console.error(`\n  → Run this file manually in Supabase SQL Editor`);
        }
      } catch (e2) {
        console.error(`  ✗ Also failed: ${e2.message}`);
        console.error(`\n  → Run this file manually in Supabase SQL Editor`);
      }
    }
  }
}

main().catch(console.error);
