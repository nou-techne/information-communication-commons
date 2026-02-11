# Search UI Enhancements

**Sprint 50** — Autocomplete, recent searches, filters, result highlighting

## Status

**Deferred to post-ETHBoulder.** Current search page is functional with full-text search, ranked results, and snippet highlighting. Advanced UX features (autocomplete, recent searches, faceted filters) are valuable polish but not critical for the Feb 13-16 event.

## Rationale

- **Event priority:** ETHBoulder is in 36 hours. Focus on stability and core functionality
- **Current search works:** `/search` page has full-text search with results, snippets, and ranking
- **Polish vs. critical:** Autocomplete and filters improve UX but aren't blocking participant contributions
- **Post-event value:** Real event usage will inform which search features are actually needed

## Current Search Implementation

The existing `/search` page provides:
- Full-text search input with submit button
- Ranked results from both artifacts and contributions
- Context snippets (via `ts_headline`)
- Result type badges
- Created date display
- Click-through to artifact/contribution detail pages

## Planned Enhancements

### 1. Autocomplete / Search Suggestions

**Implementation approach:**
```typescript
import { useState, useEffect } from 'react'

function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  
  useEffect(() => {
    if (query.length < 2) return
    
    const timer = setTimeout(async () => {
      // Option A: Trigram similarity (requires pg_trgm extension)
      const { data } = await supabase.rpc('search_suggestions', { 
        prefix: query 
      })
      
      // Option B: Simple prefix match on common terms
      const { data } = await supabase
        .from('search_terms')  // Materialized view of common words
        .select('term')
        .ilike('term', `${query}%`)
        .limit(5)
      
      setSuggestions(data?.map(d => d.term) || [])
    }, 150)  // Debounce
    
    return () => clearTimeout(timer)
  }, [query])
  
  return suggestions
}
```

**Database support:**
```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Materialized view of common search terms
CREATE MATERIALIZED VIEW search_terms AS
SELECT 
  unnest(regexp_split_to_array(lower(title), '\s+')) AS term,
  COUNT(*) AS frequency
FROM artifacts
WHERE title IS NOT NULL
GROUP BY term
HAVING LENGTH(term) > 3 AND COUNT(*) > 2
ORDER BY frequency DESC;

CREATE INDEX idx_search_terms_trgm ON search_terms USING gin (term gin_trgm_ops);
```

### 2. Recent Searches (Local Storage)

**Implementation:**
```typescript
const RECENT_SEARCHES_KEY = 'commons:recentSearches'
const MAX_RECENT = 5

function saveRecentSearch(query: string) {
  const recent = JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
  const updated = [query, ...recent.filter(q => q !== query)].slice(0, MAX_RECENT)
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
}

function getRecentSearches(): string[] {
  return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]')
}
```

**UI placement:**
- Show recent searches below empty search input
- Click to re-run search
- Clear button to wipe history

### 3. Faceted Filters

**Filter dimensions:**
- **Type:** idea, proposal, commitment, pattern, synthesis, question, reflection
- **Dimension:** e/, H/, L/, A/, M/, T/
- **Date range:** Last 24h, week, month, all time
- **Result type:** Artifacts only, Contributions only, Both

**Implementation:**
```typescript
interface SearchFilters {
  types: string[]
  dimensions: string[]
  dateRange: 'day' | 'week' | 'month' | 'all'
  resultTypes: ('artifact' | 'contribution')[]
}

// Modify search query
async function searchWithFilters(query: string, filters: SearchFilters) {
  let builder = supabase.rpc('search_content', { query_text: query })
  
  if (filters.resultTypes.length > 0) {
    builder = builder.in('result_type', filters.resultTypes)
  }
  
  // For type/dimension filtering, need to join results with artifacts table
  // Or create separate search function that accepts filter parameters
}
```

**Database enhancement:**
```sql
CREATE OR REPLACE FUNCTION search_content_filtered(
  query_text text,
  p_types text[] DEFAULT NULL,
  p_dimensions text[] DEFAULT NULL,
  p_date_start timestamptz DEFAULT NULL,
  p_result_types text[] DEFAULT NULL
) RETURNS TABLE(...) AS $$
-- Implementation with WHERE clause filters
$$;
```

### 4. Result Highlighting

**Already implemented** via `ts_headline()` in `search_content()` function. Snippet generation includes context around matched terms.

**Frontend enhancement:**
- Parse snippet HTML and style `<b>` tags with `text-[#c3fd50]`
- Or use custom highlight delimiter and replace in React

### 5. Search Analytics (Optional)

**Track search queries:**
```sql
CREATE TABLE search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  query text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  result_count int,
  clicked_result_id uuid,
  created_at timestamptz DEFAULT now()
);

-- Use for:
-- - Popular searches dashboard
-- - Query refinement suggestions
-- - Understanding user intent
```

## UI Mockup

```
┌─────────────────────────────────────────────┐
│ Search                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ knowledge graph          🔍             │ │
│ └─────────────────────────────────────────┘ │
│ ↓ Suggestions:                              │
│   • knowledge management                    │
│   • graph visualization                     │
│                                             │
│ Recent: collective intelligence, AI agents  │
│                                             │
│ Filters: ☑ All types  ☑ All dimensions    │
│          ☑ Artifacts  ☑ Contributions      │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ [artifact] Pattern: Knowledge graphs... │ │
│ │ ...collective intelligence via **graph** │ │
│ │ structures... ⭐ 0.85  📅 2d ago        │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Acceptance Criteria (Deferred)

- [x] Search UI enhancement plan documented
- [ ] Autocomplete shows suggestions in <150ms
- [ ] Recent searches persist in localStorage
- [ ] Type and dimension filters work independently
- [ ] Result highlighting emphasizes matched terms
- [ ] Search "feels instant" (subjective but <300ms perceived)

**Target completion:** Post-ETHBoulder (Feb 17+)

## Notes

This sprint demonstrates strategic prioritization: the current search is sufficient for event participants to find artifacts and contributions. Advanced UX polish (autocomplete, filters) will be more valuable after the event when we can observe real search patterns and understand which enhancements provide the most value.

The implementation plan is detailed enough for immediate post-event work, including specific code patterns and database migrations.
