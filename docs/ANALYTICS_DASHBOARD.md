# Analytics Dashboard

**Sprint 47** — Admin-facing analytics and monitoring

## Status

**Deferred to post-ETHBoulder.** Current Dashboard page has basic stats (total counts, recent artifacts, dimension breakdown). Full analytics with time-series charts and extraction health monitoring are valuable for ongoing operations but not critical for the Feb 13-16 event.

## Rationale

- **Event priority:** ETHBoulder is in 2 days. Focus on participant-facing features and stability
- **Current Dashboard sufficient:** Basic stats page exists and works
- **Post-event value:** Real event data will inform what analytics are actually needed
- **Low usage:** Admin-facing feature used by 1-2 people vs. participant-facing features used by 50-100

## Current Dashboard Features

The existing `/dashboard` route provides:
- Total artifacts, participants, relationships, recent contributions (counts)
- Recent artifacts list (last 10)
- Dimension breakdown (e/H/L/A/M/T distribution)
- Real-time updates via Supabase subscriptions

## Planned Enhancements

### 1. Contributions Over Time (Line Chart)
**Data source:** `contributions` table, group by `created_at` date
**Chart:** Daily contribution count over last 30 days
**Library:** Consider `recharts` or `chart.js` for React compatibility

Query:
```sql
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS count,
  SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS successful,
  SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) AS failed
FROM contributions
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

### 2. Active Users (Bar Chart)
**Data source:** `contributions` or `artifacts` joined with `participants`
**Chart:** Participant contribution count, top 10 contributors
**Metric:** Participants who contributed in last 7 days

Query:
```sql
SELECT 
  p.name,
  COUNT(DISTINCT c.id) AS contribution_count
FROM participants p
JOIN contributions c ON c.participant_id = p.id
WHERE c.created_at >= NOW() - INTERVAL '7 days'
GROUP BY p.id, p.name
ORDER BY contribution_count DESC
LIMIT 10;
```

### 3. Top Dimensions (Already Exists)
Current implementation shows dimension distribution. Could enhance with:
- Trend arrows (↑↓) comparing to previous period
- Click-through to dimension view

### 4. Extraction Health (Stacked Area Chart)
**Data source:** `extraction_health_metrics` view (already exists from Sprint 25)
**Chart:** Success/failure rate over time
**Metrics:**
  - Processing time trend
  - Error rate percentage
  - Contribution volume

Query:
```sql
SELECT 
  DATE_TRUNC('hour', c.created_at) AS hour,
  AVG(EXTRACT(EPOCH FROM (c.processed_at - c.created_at))) AS avg_processing_seconds,
  SUM(CASE WHEN c.status = 'complete' THEN 1 ELSE 0 END)::float / COUNT(*) AS success_rate
FROM contributions c
WHERE c.created_at >= NOW() - INTERVAL '24 hours'
  AND c.processed_at IS NOT NULL
GROUP BY DATE_TRUNC('hour', c.created_at)
ORDER BY hour;
```

## Implementation Guide

### Chart Library

**Recommended:** `recharts` (React-first, declarative)
```bash
npm install recharts
```

**Alternative:** `chart.js` + `react-chartjs-2` (more chart types)

### Dashboard Layout

```
+---------------------------+
| Contributions Over Time   |  (Line chart, 30 days)
+---------------------------+
| Active Users | Top Dims   |  (Bar chart | Pie chart)
+--------------+------------+
| Extraction Health         |  (Stacked area, 24h)
+---------------------------+
| Recent Activity           |  (Existing list)
+---------------------------+
```

### Real-time Updates

Use existing Supabase real-time subscriptions:
```typescript
useEffect(() => {
  const channel = supabase
    .channel('dashboard-updates')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'contributions' 
    }, () => {
      refreshCharts()
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

### Database Views (Recommended)

Create materialized views for heavy aggregations:
```sql
CREATE MATERIALIZED VIEW daily_contribution_stats AS
SELECT 
  DATE(created_at) AS date,
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE status = 'complete') AS successful,
  COUNT(*) FILTER (WHERE status = 'error') AS failed,
  AVG(EXTRACT(EPOCH FROM (processed_at - created_at))) 
    FILTER (WHERE processed_at IS NOT NULL) AS avg_processing_seconds
FROM contributions
GROUP BY DATE(created_at);

-- Refresh daily via cron or trigger
```

## Acceptance Criteria (Deferred)

- [x] Analytics dashboard plan documented
- [ ] 4+ chart types implemented (line, bar, pie, area)
- [ ] Charts render real-time data from Supabase
- [ ] Page load time <2s with 1000+ contributions
- [ ] Charts update on new contribution events

**Target completion:** Post-ETHBoulder (Feb 17+)

## Notes

This sprint demonstrates strategic deferral: recognizing that admin analytics are valuable but not event-critical. The existing basic dashboard is sufficient for ETHBoulder monitoring. Full analytics will be more valuable after the event when we have real usage patterns to visualize and can prioritize which charts provide the most operational insight.

The plan is thorough enough that implementation can begin immediately post-event without re-scoping.
