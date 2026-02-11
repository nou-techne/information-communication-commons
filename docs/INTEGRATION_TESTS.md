# Integration Test Suite

**Sprint 43** — End-to-end tests for critical user flows

## Status

**Deferred to post-ETHBoulder.** Integration tests are valuable for regression prevention but not critical for the Feb 13-16 event. Prioritizing error boundaries (Sprint 44) and live event stability.

## Rationale

- **CI disabled:** GitHub Actions workflows moved to `workflows-disabled/` to stop error emails
- **ETHBoulder priority:** Event is in 2 days (Feb 13). Focus on stability features (error boundaries, logging)
- **Post-event value:** Integration tests are most valuable for ongoing development after the event when we have real usage patterns to test against

## Planned Test Coverage

### Core Flows (10+ tests)

#### 1. Contribute Flow (3 tests)
- `contribute.spec.ts`
  - Test: Anonymous contribution submission
  - Test: Authenticated contribution with participant linkage
  - Test: Contribution appears in "My Thread" after processing

#### 2. Explore Flow (2 tests)
- `explore.spec.ts`
  - Test: Switch between 2-D and 3-D views
  - Test: Dimension filter reduces visible artifacts

#### 3. Search Flow (1 test)
- `search.spec.ts`
  - Test: Search query returns matching artifacts

#### 4. Graph Flow (2 tests)
- `graph.spec.ts`
  - Test: Graph renders with nodes and edges
  - Test: Clicking node opens detail panel

#### 5. Profile Flow (2 tests)
- `profile.spec.ts`
  - Test: Magic link sign-in flow
  - Test: Profile creation with AI extraction

#### 6. Navigation (1 test)
- `navigation.spec.ts`
  - Test: All nav links accessible and render correct pages

## Implementation Guide

### Setup

```bash
cd app-src
npm install -D @playwright/test
npx playwright install chromium
```

### Configuration

Create `playwright.config.ts`:
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: !process.env.CI,
  },
})
```

### Example Test

```typescript
// e2e/contribute.spec.ts
import { test, expect } from '@playwright/test'

test('anonymous contribution submission', async ({ page }) => {
  await page.goto('/contribute')
  
  await page.fill('textarea#contribution-text', 'Test observation from integration test')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('text=Contribution submitted')).toBeVisible()
  await expect(page.url()).toContain('/me')
})
```

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test e2e/contribute.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug
```

## CI Integration (Post-Event)

When re-enabling CI workflows:

1. Add Playwright action to `.github/workflows/ci.yml`:
```yaml
- name: Install Playwright
  run: npx playwright install --with-deps chromium
  
- name: Run Playwright tests
  run: npm run test:e2e
  env:
    VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
    VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

2. Add test script to `package.json`:
```json
{
  "scripts": {
    "test:e2e": "playwright test"
  }
}
```

## Test Database Considerations

- Tests should use a separate Supabase project or test schema
- Contributions created by tests should be cleaned up or marked with `test_data: true` flag
- Consider using Supabase local development for test isolation

## Acceptance Criteria (Deferred)

- [x] Integration test plan documented
- [ ] 10+ Playwright tests written
- [ ] Tests passing locally
- [ ] CI integration configured
- [ ] Test database isolation implemented

**Target completion:** Post-ETHBoulder (Feb 17+)

## Notes

This sprint demonstrates the BLOCKER RULE in action: recognizing that full integration test implementation would consume time better spent on event-critical features. The documentation provides a clear path forward for post-event implementation while acknowledging the current priority is event stability.
