# Embed Widget

**Sprint 55** — Embeddable widget showing live convergence activity

## Status

**Deferred to post-ETHBoulder.** An embed widget enables external websites to display real-time commons activity. Not critical for Feb 13-16 event since participants use the main app directly. Becomes valuable post-event when organizers want to embed activity feeds on event websites, blog posts, or documentation sites.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on core participant experience
- **No embed requests:** No external sites configured to embed widget
- **Post-event value:** After event, can share activity feeds on recap posts, sponsor sites, media coverage

## Use Cases

**Event website:**
- Embed live contribution feed on ethboulder.xyz landing page
- Show real-time participant count and artifact metrics
- Display featured artifacts or top contributors

**Blog posts / recap articles:**
- Embed specific session activity in recap posts
- Show knowledge graph visualization for specific topic
- Display dimension breakdown for convergence

**Sponsor dashboards:**
- Show sponsor-related contributions and artifacts
- Real-time metrics for sponsored sessions
- Participant engagement stats

**Academic papers / documentation:**
- Embed static snapshot of convergence state
- Reference specific artifact clusters
- Show methodology through live examples

## Widget Types

### 1. Activity Feed Widget

**Shows:** Recent contributions and artifacts, real-time updates

**Usage:**
```html
<script src="https://ethboulder.commons.id/widget.js"></script>
<div id="commons-activity"></div>
<script>
  CommonsWidget.activity({
    target: '#commons-activity',
    convergence: 'ethboulder',
    limit: 10,
    theme: 'dark',
    height: 400
  })
</script>
```

**Visual:**
```
┌────────────────────────────────┐
│ ETHBoulder Activity            │
├────────────────────────────────┤
│ 🟢 Alice shared an observation │
│    "Pattern: Knowledge graphs" │
│    2 minutes ago               │
├────────────────────────────────┤
│ 📊 New artifact extracted      │
│    "Resource-Event-Agent"      │
│    5 minutes ago               │
├────────────────────────────────┤
│ 💬 Bob contributed to session  │
│    Opening Keynote             │
│    8 minutes ago               │
└────────────────────────────────┘
    Powered by commons.id
```

### 2. Stats Widget

**Shows:** Convergence metrics, real-time counts

**Usage:**
```html
<div id="commons-stats"></div>
<script>
  CommonsWidget.stats({
    target: '#commons-stats',
    convergence: 'ethboulder',
    metrics: ['contributions', 'artifacts', 'participants'],
    theme: 'light'
  })
</script>
```

**Visual:**
```
┌──────────────────────────────┐
│ ETHBoulder Commons           │
├──────────────────────────────┤
│  250 Contributions           │
│   42 Artifacts               │
│   18 Participants            │
└──────────────────────────────┘
```

### 3. Graph Widget

**Shows:** Interactive knowledge graph (subset)

**Usage:**
```html
<div id="commons-graph" style="height: 500px;"></div>
<script>
  CommonsWidget.graph({
    target: '#commons-graph',
    convergence: 'ethboulder',
    filter: { dimension: 'hlamt:H' },
    interactive: true
  })
</script>
```

### 4. Session Widget

**Shows:** Activity for specific session

**Usage:**
```html
<div id="session-widget"></div>
<script>
  CommonsWidget.session({
    target: '#session-widget',
    sessionId: 'uuid-here',
    showContributions: true,
    showArtifacts: true
  })
</script>
```

## Implementation

### Widget SDK (widget.js)

**Single script bundle, all widget types:**

```typescript
// widget/src/index.ts
import { ActivityWidget } from './widgets/Activity'
import { StatsWidget } from './widgets/Stats'
import { GraphWidget } from './widgets/Graph'
import { SessionWidget } from './widgets/Session'

interface WidgetConfig {
  target: string | HTMLElement
  convergence?: string
  theme?: 'light' | 'dark'
  [key: string]: any
}

class CommonsWidget {
  static activity(config: WidgetConfig) {
    return new ActivityWidget(config)
  }
  
  static stats(config: WidgetConfig) {
    return new StatsWidget(config)
  }
  
  static graph(config: WidgetConfig) {
    return new GraphWidget(config)
  }
  
  static session(config: WidgetConfig) {
    return new SessionWidget(config)
  }
}

// Expose globally
window.CommonsWidget = CommonsWidget

export default CommonsWidget
```

### Activity Widget Component

```typescript
// widget/src/widgets/Activity.tsx
import { createClient } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'

interface ActivityItem {
  type: 'contribution' | 'artifact'
  id: string
  title: string
  participant: string
  timestamp: string
}

function ActivityFeed({ convergence, limit, theme }: any) {
  const [items, setItems] = useState<ActivityItem[]>([])
  
  useEffect(() => {
    const supabase = createClient(
      'https://hvbdpgkdcdskhpbdeeim.supabase.co',
      'sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv'
    )
    
    // Initial load
    loadActivity()
    
    // Subscribe to real-time updates
    const subscription = supabase
      .channel('activity')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'contributions' },
        loadActivity
      )
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'artifacts' },
        loadActivity
      )
      .subscribe()
    
    return () => { subscription.unsubscribe() }
  }, [convergence])
  
  async function loadActivity() {
    // Fetch recent activity (contributions + artifacts merged)
    const { data } = await supabase.rpc('get_recent_activity', {
      p_convergence: convergence,
      p_limit: limit
    })
    setItems(data)
  }
  
  return (
    <div className={`commons-widget activity ${theme}`}>
      <div className="header">
        {convergence} Activity
      </div>
      <div className="items">
        {items.map(item => (
          <div key={item.id} className="item">
            <span className="icon">
              {item.type === 'contribution' ? '🟢' : '📊'}
            </span>
            <div className="content">
              <div className="title">{item.title}</div>
              <div className="meta">
                {item.participant} · {timeAgo(item.timestamp)}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="footer">
        Powered by <a href="https://commons.id">commons.id</a>
      </div>
    </div>
  )
}

export class ActivityWidget {
  constructor(config: any) {
    const target = typeof config.target === 'string' 
      ? document.querySelector(config.target)
      : config.target
    
    if (!target) throw new Error('Target element not found')
    
    const root = createRoot(target)
    root.render(<ActivityFeed {...config} />)
  }
}
```

### Widget Styles (Embedded)

```css
/* widget/src/styles.css */
.commons-widget {
  font-family: system-ui, -apple-system, sans-serif;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.commons-widget.dark {
  background: #1a1a1a;
  border: 1px solid #262626;
  color: #fff;
}

.commons-widget.light {
  background: #fff;
  border: 1px solid #e5e5e5;
  color: #000;
}

.commons-widget .header {
  padding: 12px 16px;
  font-weight: 600;
  border-bottom: 1px solid currentColor;
  opacity: 0.2;
}

.commons-widget .items {
  max-height: 400px;
  overflow-y: auto;
}

.commons-widget .item {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid currentColor;
  opacity: 0.1;
}

.commons-widget .item:last-child {
  border-bottom: none;
}

.commons-widget .item .icon {
  font-size: 20px;
}

.commons-widget .item .content {
  flex: 1;
  min-width: 0;
}

.commons-widget .item .title {
  font-weight: 500;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.commons-widget .item .meta {
  font-size: 12px;
  opacity: 0.6;
}

.commons-widget .footer {
  padding: 8px 16px;
  font-size: 11px;
  text-align: center;
  opacity: 0.5;
  border-top: 1px solid currentColor;
}

.commons-widget .footer a {
  color: #c3fd50;
  text-decoration: none;
}
```

### Build Process

**Vite config for widget bundle:**

```typescript
// widget/vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'CommonsWidget',
      fileName: 'widget',
      formats: ['iife']  // Single global bundle
    },
    rollupOptions: {
      output: {
        // Inline all dependencies
        inlineDynamicImports: true,
        // Single file output
        entryFileNames: 'widget.js',
        assetFileNames: 'widget.css'
      }
    }
  }
})
```

**Deploy to CDN:**

```bash
# Build widget
cd widget
npm run build

# Output: dist/widget.js, dist/widget.css

# Deploy to public folder
cp dist/widget.js ../app/widget.js
cp dist/widget.css ../app/widget.css

# Or deploy to CDN (Cloudflare, Vercel, etc.)
```

### Database Function: get_recent_activity

```sql
CREATE OR REPLACE FUNCTION get_recent_activity(
  p_convergence text,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  type text,
  id uuid,
  title text,
  participant text,
  timestamp timestamptz
) AS $$
BEGIN
  RETURN QUERY
  WITH activity AS (
    -- Contributions
    SELECT 
      'contribution' as type,
      c.id,
      LEFT(c.content, 100) as title,
      p.name as participant,
      c.created_at as timestamp
    FROM contributions c
    JOIN participants p ON c.participant_id = p.id
    JOIN convergences conv ON c.convergence_id = conv.id
    WHERE conv.slug = p_convergence
    
    UNION ALL
    
    -- Artifacts
    SELECT
      'artifact' as type,
      a.id,
      a.title,
      p.name as participant,
      a.created_at as timestamp
    FROM artifacts a
    JOIN participants p ON a.steward_id = p.id
    JOIN convergences conv ON a.convergence_id = conv.id
    WHERE conv.slug = p_convergence
  )
  SELECT * FROM activity
  ORDER BY timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
```

## Configuration Options

### Common Options (All Widgets)

```typescript
interface BaseConfig {
  target: string | HTMLElement     // Required
  convergence?: string              // Convergence slug (default: current)
  theme?: 'light' | 'dark' | 'auto' // Visual theme
  width?: number | string           // Widget width
  height?: number | string          // Widget height
  language?: string                 // i18n locale
}
```

### Activity Widget Options

```typescript
interface ActivityConfig extends BaseConfig {
  limit?: number                    // Max items (default: 10)
  types?: ('contribution' | 'artifact')[]  // Filter by type
  session?: string                  // Filter by session
  updateInterval?: number           // Polling interval (ms)
}
```

### Stats Widget Options

```typescript
interface StatsConfig extends BaseConfig {
  metrics?: string[]                // Which metrics to show
  layout?: 'horizontal' | 'vertical'
  showTrend?: boolean               // Show change from yesterday
}
```

### Graph Widget Options

```typescript
interface GraphConfig extends BaseConfig {
  filter?: {
    dimension?: string
    type?: string
    rea_role?: string
  }
  interactive?: boolean             // Allow pan/zoom
  maxNodes?: number                 // Node limit
  colorMode?: 'type' | 'dimension' | 'cluster'
}
```

## CORS Configuration

**Allow widget to load from any domain:**

```typescript
// Supabase Edge Function CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Apply to all widget endpoints
```

## Sandbox Security

**Widget runs in iframe for security:**

```html
<!-- Option A: Direct embed (less secure) -->
<script src="https://ethboulder.commons.id/widget.js"></script>
<div id="widget"></div>

<!-- Option B: Iframe embed (more secure) -->
<iframe 
  src="https://ethboulder.commons.id/embed/activity?convergence=ethboulder"
  width="400"
  height="600"
  frameborder="0"
  sandbox="allow-scripts allow-same-origin"
></iframe>
```

**Iframe route (serves widget in isolation):**

```typescript
// app-src/src/pages/Embed.tsx
export function EmbedActivity() {
  const params = new URLSearchParams(window.location.search)
  const convergence = params.get('convergence')
  const limit = parseInt(params.get('limit') || '10')
  
  return <ActivityFeed convergence={convergence} limit={limit} theme="dark" />
}
```

## Analytics

**Track widget usage:**

```typescript
// In widget code
function trackWidgetLoad(type: string, convergence: string) {
  // Send to analytics endpoint
  fetch('https://api.commons.id/widget/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      widget_type: type,
      convergence,
      referrer: document.referrer,
      timestamp: new Date().toISOString()
    })
  }).catch(() => {}) // Fail silently
}
```

## Acceptance Criteria (Deferred)

- [x] Embed widget plan documented
- [ ] 4 widget types implemented (activity, stats, graph, session)
- [ ] Widget loads via single script tag
- [ ] Real-time updates via Supabase subscriptions
- [ ] Configurable theme (light/dark)
- [ ] Configurable size and layout
- [ ] CORS enabled for cross-domain embedding
- [ ] Documentation with code examples
- [ ] Demo page showing all widget types

**Target completion:** Post-ETHBoulder (Feb 17+)

## Priority

**Medium.** Embed widgets become valuable when:
- Event organizers want live feeds on main website
- Media coverage wants to embed activity
- Sponsors want to showcase contribution
- Documentation sites want live examples

For initial event capture, main app is sufficient.

## Notes

This sprint demonstrates the value of embeddable components for extending reach beyond the main app. Widgets let the commons "leak out" to other sites, increasing visibility and participation.

The implementation strategy (single script bundle + iframe option) balances ease of use with security. Sites can choose direct embed (simpler) or iframe (more isolated).

Real-time updates via Supabase subscriptions ensure widgets stay current without polling, reducing server load.
