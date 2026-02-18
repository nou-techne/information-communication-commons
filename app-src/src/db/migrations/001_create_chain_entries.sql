-- Migration: Create chain_entries table (Q32)
-- Author: TIO Sprint Runner (unblocked)

create table if not exists chain_entries (
  id uuid default gen_random_uuid() primary key,
  chain_index bigint not null,
  convergence_id uuid not null,
  
  -- Event Identity
  event_type text not null,
  aggregate_id text not null,
  aggregate_type text not null,
  
  -- Payload (stored as JSONB for flexibility)
  payload jsonb not null default '{}'::jsonb,
  
  -- Seven-Layer Pattern Classification
  pattern_layer smallint check (pattern_layer between 1 and 7),
  
  -- Merkle Chain
  content_hash text not null,
  prev_hash text not null,
  
  -- Metadata
  actor_id text,
  correlation_id text,
  causation_id text,
  nl_source text,
  schema_version text default '1.0',
  
  created_at timestamptz default now(),
  
  -- Constraints
  unique(convergence_id, chain_index),
  unique(convergence_id, content_hash) -- hash collision protection
);

-- Indexing
create index if not exists idx_chain_entries_convergence_id on chain_entries(convergence_id);
create index if not exists idx_chain_entries_aggregate_id on chain_entries(aggregate_id);
create index if not exists idx_chain_entries_event_type on chain_entries(event_type);

-- RLS (Row Level Security)
alter table chain_entries enable row level security;

-- Policy: Everyone can read (public verifiability)
create policy "Public read access"
  on chain_entries for select
  using (true);

-- Policy: Service role only can insert (controlled by API/Chain Engine)
-- Note: 'postgres' role bypasses RLS, anon/authenticated need explicit policy if inserting directly.
-- We'll restrict direct inserts to service role for integrity.
