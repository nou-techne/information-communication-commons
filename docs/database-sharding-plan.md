# Database Sharding Plan

**Sprint 92** | Backend Engineer | Layer: State (2)

## Overview

As the Information & Communications Commons grows from a single convergence (ETHBoulder 2026) to a multi-instance federated network, the PostgreSQL database will face scaling challenges. This document analyzes growth projections and designs a partitioning strategy to maintain performance at scale.

## Current State (Baseline)

**Database:** Supabase-hosted PostgreSQL 17  
**Region:** Single-region (us-east-1)  
**Size:** ~50 MB (post-ETHBoulder estimate)  
**Tables:** 27 total (12 core entities, 8 junction, 7 system)

### Table Sizes (Estimated Post-ETHBoulder)

| Table | Rows | Size | Growth Rate |
|-------|------|------|-------------|
| `artifacts` | 500 | 2 MB | High (per convergence) |
| `contributions` | 1,200 | 5 MB | High (per convergence) |
| `participants` | 300 | 1 MB | Medium |
| `convergences` | 1 | <1 MB | Low |
| `relationships` | 800 | 1 MB | High (scales with artifacts²) |
| `artifact_dimensions` | 2,500 | 2 MB | High (6x artifacts avg) |
| `sessions` | 25 | <1 MB | Medium |
| `messages` | 0 | 0 | **Very High** (future) |
| `threads` | 0 | 0 | High (future) |
| `channels` | 0 | 0 | Low (future) |

**Total Current:** ~12 MB data, ~25 MB with indexes

---

## Growth Projections

### Scenario 1: Single Instance, Multiple Convergences

**Assumptions:**
- 10 convergences per year
- Average convergence: 200 contributions, 500 artifacts, 100 participants
- 5-year horizon

**Year 5 Totals:**
- Convergences: 50
- Contributions: 10,000
- Artifacts: 25,000
- Relationships: 40,000
- Participants: 5,000 (with deduplication across convergences)

**Database Size:** ~1.5 GB data, ~3 GB with indexes

**Assessment:** Single-region PostgreSQL handles this comfortably. Partitioning optional but recommended for query performance.

---

### Scenario 2: Federated Network (10 Instances)

**Assumptions:**
- 10 independent instances
- Each instance: 5 convergences/year, same metrics as Scenario 1
- Federation: each instance imports 30% of artifacts from trusted peers
- 5-year horizon

**Per-Instance Year 5:**
- Local artifacts: 12,500
- Federated artifacts: 37,500 (from 9 peers × 30% import rate)
- Total artifacts: 50,000
- Contributions: 5,000 (local only, not federated)
- Relationships: 80,000 (local + cross-instance)

**Database Size Per Instance:** ~3 GB data, ~6 GB with indexes

**Assessment:** Still manageable on single-region PostgreSQL with read replicas. Partitioning recommended for artifacts and relationships.

---

### Scenario 3: Messaging Layer Active (Communication Intensive)

**Assumptions:**
- Communication layer (Sprints 57-88) implemented
- Active convergence: 200 participants, 14-day event
- Average: 50 messages/day per participant
- Post-event archive (90% of messages consolidated or archived)

**Per-Event Messages:**
- Active event: 200 × 50 × 14 = 140,000 messages
- Post-consolidation: 14,000 messages retained
- 50 convergences over 5 years: 700,000 messages

**Additional Tables:**
- `messages`: 700k rows, ~350 MB
- `threads`: 35k rows, ~20 MB
- `channels`: 500 rows, <1 MB
- `message_reactions`: 1.4M rows, ~70 MB

**Total with Messaging:** ~5 GB data, ~10 GB with indexes (per instance)

**Assessment:** Partitioning required for `messages` and `message_reactions`. Time-series partitioning by month for efficient archival and pruning.

---

## Sharding Strategy

### Phase 1: Logical Partitioning (No Physical Shards)

Use PostgreSQL native partitioning (declarative partitioning since PostgreSQL 10).

#### Tables to Partition

1. **`artifacts` — by convergence_id**
   - Partition key: `convergence_id`
   - Partition type: LIST
   - Reason: Queries mostly scoped to single convergence
   - Benefit: Faster convergence-specific queries, easier archival

2. **`contributions` — by convergence_id**
   - Partition key: `convergence_id`
   - Partition type: LIST
   - Reason: Same as artifacts
   - Benefit: Isolate event data, prune old events

3. **`relationships` — by convergence_id (of source artifact)**
   - Partition key: `convergence_id` (denormalized from `source_artifact_id`)
   - Partition type: LIST
   - Reason: Most relationships within same convergence
   - Benefit: Co-locate related data

4. **`messages` — by created_at (monthly)**
   - Partition key: `created_at`
   - Partition type: RANGE
   - Partitions: One per month (e.g., `messages_2026_02`)
   - Reason: Time-series data, queries mostly recent
   - Benefit: Archive old partitions to cold storage, fast pruning

5. **`message_reactions` — by created_at (monthly)**
   - Partition key: `created_at`
   - Partition type: RANGE
   - Reason: Same as messages
   - Benefit: Drop old reactions when messages are archived

#### Migration Example (Artifacts)

```sql
-- Create partitioned table
CREATE TABLE artifacts_partitioned (
  LIKE artifacts INCLUDING ALL
) PARTITION BY LIST (convergence_id);

-- Create partition for each convergence
CREATE TABLE artifacts_convergence_ethboulder_2026
  PARTITION OF artifacts_partitioned
  FOR VALUES IN ('uuid-of-ethboulder-2026');

-- Default partition for new convergences
CREATE TABLE artifacts_convergence_default
  PARTITION OF artifacts_partitioned
  DEFAULT;

-- Migrate data
INSERT INTO artifacts_partitioned SELECT * FROM artifacts;

-- Swap tables (in transaction)
BEGIN;
  ALTER TABLE artifacts RENAME TO artifacts_old;
  ALTER TABLE artifacts_partitioned RENAME TO artifacts;
  DROP TABLE artifacts_old;
COMMIT;

-- Future: Automate partition creation on new convergence
CREATE OR REPLACE FUNCTION create_artifact_partition()
RETURNS TRIGGER AS $$
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS artifacts_convergence_%s PARTITION OF artifacts FOR VALUES IN (%L)',
    NEW.id, NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_artifact_partition
  AFTER INSERT ON convergences
  FOR EACH ROW
  EXECUTE FUNCTION create_artifact_partition();
```

---

### Phase 2: Read Replicas (Horizontal Read Scaling)

As query load increases, add read replicas.

**Supabase Supports:**
- Read replicas in same region (low latency)
- Automatic failover
- Connection pooling (PgBouncer)

**Configuration:**
```typescript
// Supabase client with read replica routing
const supabaseRead = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  db: {
    schema: 'public',
    // Route read-only queries to replica
    // (Supabase automatically routes if configured)
  }
});

// Use for heavy read operations (feed, graph, search)
const { data } = await supabaseRead.from('artifacts').select('*');
```

**When to Add:**
- Primary DB CPU > 70% sustained
- Read query latency P95 > 500ms
- Federated sync jobs compete with user queries

---

### Phase 3: Federated Data Separation

Keep local and federated data in separate logical namespaces.

**Option A: Separate Tables**
- `artifacts` — local artifacts only
- `federated_artifacts` — imported from remote instances
- Views unify for queries: `CREATE VIEW all_artifacts AS ...`

**Option B: Separate Schemas**
- `public.artifacts` — local
- `federated.artifacts` — remote
- Application routes queries based on context

**Recommendation:** Option A (already implemented in Sprint 91)

**Benefits:**
- Clear ownership boundaries
- Different retention policies (local = permanent, federated = cache)
- Easier to prune federated data
- Security: RLS policies differ (local = writable, federated = read-only)

---

### Phase 4: Geo-Distributed Multi-Region (Future)

If global user base requires low-latency reads worldwide.

**Supabase Multi-Region (Planned Feature):**
- Primary region for writes (us-east-1)
- Read replicas in eu-west-1, ap-southeast-1
- Global CDN (Cloudflare) routes to nearest replica

**Challenges:**
- Replication lag (eventual consistency)
- Cross-region federation sync (higher latency)
- Increased cost

**When to Consider:**
- >50% of traffic outside US
- Users complain about latency (>1s page loads)
- Federated instances span multiple continents

**Alternative:** Edge caching via Cloudflare Workers + KV for read-heavy queries (artifact detail, session detail, stats).

---

## Sharding Anti-Patterns to Avoid

### 1. Premature Optimization

**Don't shard until:**
- Database size > 100 GB
- Query latency consistently > 500ms
- Single-region read replica exhausted

**Why:** Sharding adds complexity. Maintain simplicity as long as possible.

### 2. Hash-Based Sharding

**Don't use:** `PARTITION BY HASH(id)`

**Why:**
- Queries can't be scoped to single convergence
- No natural archival boundary
- Cross-partition joins expensive

**Use instead:** List or range partitioning on meaningful dimension (convergence, time).

### 3. Sharding Small Tables

**Don't partition:**
- `participants` — queries require global view (user can contribute to multiple convergences)
- `convergences` — tiny table, partitioning overhead outweighs benefit
- `instances` — federated directory, global view required

**Partition only:**
- High-growth tables (artifacts, contributions, messages)
- Tables with natural partition keys (convergence_id, created_at)

---

## Migration Path (Rollout Plan)

### Timeline

| Phase | When | Trigger | Tables |
|-------|------|---------|--------|
| **Phase 0** (Baseline) | Now | N/A | No partitioning |
| **Phase 1a** | After 10 convergences | DB > 2 GB | Partition `artifacts`, `contributions` by convergence |
| **Phase 1b** | Communication layer launch | Messages table exists | Partition `messages`, `message_reactions` by month |
| **Phase 2** | Read latency degrades | P95 > 500ms | Add read replica |
| **Phase 3** | Already implemented | Federation enabled | Separate `federated_artifacts` table |
| **Phase 4** | Global user base | >50% non-US traffic | Multi-region replicas |

### Rollback Plan

If partitioning causes issues:
1. Disable partition creation trigger
2. Query from `*_old` tables (keep for 30 days)
3. Drop partitioned tables
4. Restore from backup if needed

---

## Performance Testing Strategy

Before applying partitions to production:

1. **Synthetic Data Generation**
   ```sql
   -- Generate 50 convergences with realistic data
   SELECT generate_convergence_data(50, 200, 500);
   ```

2. **Benchmark Queries**
   ```sql
   -- Before partitioning
   EXPLAIN ANALYZE SELECT * FROM artifacts WHERE convergence_id = 'uuid';
   
   -- After partitioning
   EXPLAIN ANALYZE SELECT * FROM artifacts WHERE convergence_id = 'uuid';
   ```

3. **Load Testing**
   - Use `pgbench` or `k6` to simulate concurrent queries
   - Measure P50, P95, P99 latency before/after
   - Target: <10% latency increase post-partitioning

4. **Migration Dry Run**
   - Test on production snapshot (Supabase allows backup → new project)
   - Measure downtime (aim for <5 min)
   - Validate data integrity (row counts match)

---

## Monitoring & Alerts

### Metrics to Track

1. **Table Sizes**
   ```sql
   SELECT 
     schemaname,
     tablename,
     pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
   FROM pg_tables
   WHERE schemaname = 'public'
   ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
   ```

2. **Query Performance**
   - Slow queries (pg_stat_statements)
   - Partition pruning effectiveness (EXPLAIN shows only accessed partitions)
   - Index hit ratio (should be >99%)

3. **Partition Count**
   ```sql
   SELECT 
     parent.relname AS parent_table,
     COUNT(*) AS partition_count
   FROM pg_inherits
   JOIN pg_class parent ON parent.oid = inhparent
   GROUP BY parent.relname;
   ```

### Alerts

- Table size growth >50% month-over-month
- Slow query count spike (>10 queries >1s in 5 min)
- Partition creation failure (should auto-create)
- Replication lag >10s (if using replicas)

---

## Cost Implications

### Current (Supabase Free Tier)

- Database size: <500 MB
- Bandwidth: <2 GB
- Cost: $0/month

### Projected (Scenario 3, Year 5)

- Database size: 10 GB
- Read replica: +10 GB
- Bandwidth: ~20 GB/month (federation sync)
- **Estimated Cost:** $25-50/month (Supabase Pro tier)

### Cost Optimization

1. **Archive Old Partitions to S3**
   - Monthly `messages` partitions >6 months old → pg_dump → S3 → DROP TABLE
   - Cost: $0.023/GB/month (S3 Standard)

2. **Prune Federated Artifacts**
   - Keep only verified/trusted instances
   - Remove untrusted after 90 days
   - Reduces `federated_artifacts` by ~50%

3. **Compression**
   - PostgreSQL TOAST compression (automatic for large text fields)
   - `content` field (artifacts, contributions) already compressed

---

## Conclusion

**Current Status:** No sharding required. Single-region PostgreSQL sufficient for ETHBoulder and ~10 convergences.

**Phase 1 Trigger:** Database >2 GB or 10+ convergences. Partition `artifacts` and `contributions` by `convergence_id`.

**Phase 1b Trigger:** Communication layer launch. Partition `messages` by month for efficient archival.

**Phase 2 Trigger:** Read latency >500ms P95. Add read replica.

**Long-term:** Multi-region replicas if global user base emerges. Federated data already separated for flexible retention policies.

**Migration Risk:** Low. PostgreSQL declarative partitioning is mature (since v10). Rollback plan documented.

**Recommendation:** Monitor table sizes and query performance. Implement Phase 1a when database approaches 2 GB. Test on snapshot before production migration.

---

## References

- [PostgreSQL Partitioning Documentation](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Supabase Performance Best Practices](https://supabase.com/docs/guides/platform/performance)
- [Citus Data Sharding Guide](https://www.citusdata.com/blog/2016/08/19/how-to-choose-a-shard-key/)
- [TimescaleDB Time-Series Partitioning](https://docs.timescale.com/use-timescale/latest/hypertables/)

---

*Sprint 92 · Federation Foundations (Cycle 11 Ebb) · 2026-02-12*
