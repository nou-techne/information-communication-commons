# Lighthouse Performance Audit

**Sprint 41** — Performance baseline and optimization recommendations

## Current State

The app is a React SPA built with Vite, deployed to GitHub Pages. No Lighthouse audit has been run yet.

## Known Performance Issues

1. **Large bundle size** — Vite warnings indicate chunks >500kB after minification
2. **No code splitting** — All components load eagerly on initial page load
3. **D3.js bundle** — D3 is ~200kB and only used on Graph page
4. **No lazy loading** — All routes import synchronously
5. **No image optimization** — SVG logos are inline but could be optimized

## Recommended Optimizations

### 1. Route-based Code Splitting
Convert synchronous route imports to dynamic imports:

```typescript
// Before
import { Graph } from './pages/Graph'

// After
const Graph = lazy(() => import('./pages/Graph'))
```

Apply to:
- Graph (largest page, includes D3)
- Dashboard
- Status
- Search
- All dimension views

### 2. D3 Tree-shaking
Import only needed D3 modules instead of entire library:

```typescript
// Before
import * as d3 from 'd3'

// After
import { select } from 'd3-selection'
import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide } from 'd3-force'
import { drag } from 'd3-drag'
import { zoom } from 'd3-zoom'
```

### 3. Component Lazy Loading
Use React.lazy for heavy components:
- Graph visualization
- Large data tables
- Rich text editors (if added)

### 4. Image Optimization
- Compress PNG/JPG assets with `sharp` or `imagemin`
- Use WebP with PNG fallback
- Lazy load images below the fold
- Add `loading="lazy"` to img tags

### 5. Bundle Analysis
Run `npm run build -- --sourcemap` and analyze with `rollup-plugin-visualizer` to identify large dependencies.

### 6. Caching Strategy
- Set aggressive cache headers for assets (1 year)
- Use cache-busting via Vite's content hashing (already enabled)
- Consider service worker for offline support

### 7. Font Loading
- Use `font-display: swap` for system fonts
- Preload critical fonts
- Self-host instead of CDN if using web fonts

## Lighthouse Metrics Target

- **Performance:** ≥ 85 (mobile)
- **Accessibility:** ≥ 90
- **Best Practices:** ≥ 90
- **SEO:** ≥ 90

## Manual Audit Required

To complete this sprint, run Lighthouse:
```bash
npm install -g lighthouse
lighthouse https://ethboulder.commons.id/app/ --view
```

Or use Chrome DevTools → Lighthouse tab.

## Implementation Priority

**High (pre-ETHBoulder):**
- Route-based code splitting for Graph page

**Medium (post-launch):**
- D3 tree-shaking
- Component lazy loading
- Bundle analysis

**Low (future):**
- Image optimization
- Service worker
- Advanced caching

## Notes

- ETHBoulder is Feb 13-16, prioritize stability over performance
- Most users will be on desktop with good connectivity
- Mobile performance less critical for conference use case
- Revisit post-event with real usage data
