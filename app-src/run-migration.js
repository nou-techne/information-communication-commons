import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const migrationPath = path.join(__dirname, 'src/db/migrations/001_create_chain_entries.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running migration: 001_create_chain_entries.sql');
    await client.query(sql);
    console.log('Migration successful!');

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

run();
