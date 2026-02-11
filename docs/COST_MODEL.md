# commons.id — Token Consumption & Cost Model

*Sprint 12.5: Cost analysis ahead of ETHBoulder*

## Current Architecture

Two AI extraction pipelines, both calling Claude Sonnet 4:

1. **process-contribution** — extracts artifacts, relationships, commitments from observations
2. **process-profile** — extracts participant profile from self-introduction

## Token Estimates Per Call

### Contribution Extraction

| Component | Tokens (est.) |
|-----------|--------------|
| System prompt (REA grammar, schema, guidance) | ~1,200 |
| Avg contribution content (2,000 chars) | ~500 |
| **Total input** | **~1,700** |
| Avg extraction output (JSON) | ~1,600 |
| **Total output** | **~1,600** |

### Profile Extraction

| Component | Tokens (est.) |
|-----------|--------------|
| System prompt (profile schema, guidance) | ~800 |
| Avg profile intro (500 chars) | ~125 |
| **Total input** | **~925** |
| Avg profile output (JSON) | ~400 |
| **Total output** | **~400** |

## Claude Sonnet 4 Pricing

- Input: $3.00 / million tokens
- Output: $15.00 / million tokens

### Per-Call Cost

**Contribution:** (1,700 × $3 + 1,600 × $15) / 1M = $0.0051 + $0.024 = **$0.029 per contribution**
**Profile:** (925 × $3 + 400 × $15) / 1M = $0.003 + $0.006 = **$0.009 per profile**

## Scaling Scenarios

### ETHBoulder (Feb 13-16, 4 days)

| Scenario | Contributions | Profiles | AI Cost |
|----------|--------------|----------|---------|
| Light (50 participants, 2 contributions each) | 100 | 50 | $3.35 |
| Moderate (100 participants, 5 each) | 500 | 100 | $15.40 |
| Heavy (200 participants, 10 each) | 2,000 | 200 | $59.60 |

### Monthly (Ongoing)

| Scenario | Contributions/mo | Profiles/mo | Monthly AI Cost |
|----------|-----------------|-------------|-----------------|
| Low usage | 500 | 50 | $14.95 |
| Medium | 2,000 | 200 | $59.60 |
| High | 10,000 | 1,000 | $299.00 |
| Very high | 50,000 | 5,000 | $1,495.00 |

## Growth Characteristics

**Linear, not exponential.** Each contribution is an independent extraction call with a fixed-size prompt. Cost scales linearly with contribution volume:

- Cost per contribution is constant (~$0.029)
- Cost per profile is constant (~$0.009)
- No compounding — the knowledge graph grows but doesn't increase extraction cost

**Where it COULD become superlinear:**
1. **If we add context-aware extraction** (feeding existing graph context into prompts to improve linking) — input tokens would grow with graph size
2. **If we add re-extraction** (re-processing old contributions with improved prompts) — creates batch cost spikes
3. **If we add summary/synthesis** (periodic graph summarization, trend analysis) — scales with total artifact count

## Cost Controls

**Already in place:**
- Rate limiting: max 10 contributions/hour per user
- Content length: 20-10,000 chars
- No re-extraction on duplicate submissions

**Recommended:**
- Add token usage logging to Edge Functions (track actual vs estimated)
- Set Anthropic API spending limit ($100/month initially)
- Monitor via extraction_health_metrics view (already deployed)
- Consider Haiku for profile extraction (simpler task, ~10x cheaper)

## Supabase Costs (Non-AI)

| Service | Monthly Cost |
|---------|-------------|
| Supabase Pro | $25 |
| Edge Functions (included in Pro) | $0 |
| Database (8GB included) | $0 |
| Realtime (included) | $0 |
| **Total infrastructure** | **$25/mo** |

## Total Cost Projection

| Scenario | AI | Infrastructure | Monthly Total |
|----------|-----|---------------|---------------|
| ETHBoulder only (one-time) | $15-60 | $25 | $40-85 |
| Steady state (medium) | $60 | $25 | $85/mo |
| Growth (high) | $299 | $25 | $324/mo |

## Conclusion

Costs are **linear and predictable** at current architecture. The main cost driver is Claude output tokens (5x more expensive than input). Profile extraction is cheap. Contribution extraction is ~$0.03 each.

**Risk zone:** If we implement context-aware extraction (feeding graph state into prompts), input costs could grow with graph size. This should be gated behind a cost analysis before implementation.

---

*Analysis: Feb 11, 2026 | Based on Claude Sonnet 4 pricing | Supabase Pro plan*
