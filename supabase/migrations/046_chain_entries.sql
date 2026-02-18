-- Migration 041: Chain Entries Table for Perpetual Convergences
-- Sprint Q32: Add merkle chain infrastructure for Techne economic events
-- Author: TIO Sprint Runner
-- Date: 2026-02-18

-- Add convergence_type column to distinguish bounded vs perpetual convergences
alter table public.convergences
  add column if not exists convergence_type text not null default 'bounded'
  check (convergence_type in ('bounded', 'perpetual'));

comment on column public.convergences.convergence_type is 
  'bounded = time-boxed event (ETHBoulder), perpetual = ongoing cooperative (Techne)';

-- Create chain_entries table for append-only merkle chain
create table if not exists public.chain_entries (
  id uuid primary key default gen_random_uuid(),
  chain_index bigint not null,
  convergence_id uuid not null references public.convergences(id),
  
  -- Event identity
  event_type text not null,           -- e.g. 'convergence.created', 'people.member.created'
  aggregate_id uuid not null,         -- entity this affects
  aggregate_type text not null,       -- 'convergence' | 'member' | 'contribution' | 'period' | 'allocation'
  
  -- Payload (event-specific structure)
  payload jsonb not null default '{}',
  
  -- Pattern layer (1-7): Identity, State, Relationship, Event, Flow, Constraint, View
  pattern_layer smallint not null check (pattern_layer between 1 and 7),
  
  -- Merkle chain
  content_hash text not null,         -- SHA-256 of (prev_hash || event_type || aggregate_id || payload_canonical)
  prev_hash text not null,            -- hash of previous entry ('genesis' for entry #0)
  
  -- Metadata
  actor_id uuid,                      -- who triggered this (references participants)
  correlation_id uuid,                -- groups related entries (e.g. all genesis entries)
  causation_id uuid,                  -- entry that caused this entry (for audit trail)
  nl_source text,                     -- original natural language input (for contribution extraction)
  schema_version text not null default '1.0',
  
  created_at timestamptz not null default now(),
  
  -- Constraints
  unique (convergence_id, chain_index),  -- sequential integrity per convergence
  unique (content_hash)                  -- no duplicate entries
);

-- Indexes for efficient chain operations
create index idx_chain_entries_convergence_index 
  on public.chain_entries (convergence_id, chain_index);

create index idx_chain_entries_event_type 
  on public.chain_entries (event_type);

create index idx_chain_entries_aggregate 
  on public.chain_entries (aggregate_type, aggregate_id);

create index idx_chain_entries_correlation 
  on public.chain_entries (correlation_id) 
  where correlation_id is not null;

create index idx_chain_entries_created_at 
  on public.chain_entries (created_at desc);

-- RLS: append-only chain, readable by all authenticated users
alter table public.chain_entries enable row level security;

-- Read policy: public read (for now; can restrict to convergence members later)
create policy "chain_entries_select" 
  on public.chain_entries
  for select 
  using (true);

-- Insert policy: service role only (entries must come through validated API)
create policy "chain_entries_insert" 
  on public.chain_entries
  for insert 
  with check (auth.role() = 'service_role');

-- No update or delete policies - the chain is append-only
-- Corrections are made via new entries (e.g. 'contribution.voided' references original)

comment on table public.chain_entries is 
  'Append-only merkle chain for perpetual convergence economic events (contributions, allocations, distributions)';
comment on column public.chain_entries.chain_index is 
  'Sequential index per convergence, starting at 0';
comment on column public.chain_entries.content_hash is 
  'SHA-256 of (prev_hash || event_type || aggregate_id || canonical_payload)';
comment on column public.chain_entries.prev_hash is 
  'Content hash of previous entry, or ''genesis'' for entry #0';
comment on column public.chain_entries.pattern_layer is 
  '1=Identity, 2=State, 3=Relationship, 4=Event, 5=Flow, 6=Constraint, 7=View';
