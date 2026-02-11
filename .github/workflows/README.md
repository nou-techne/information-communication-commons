# GitHub Actions Workflows

Sprint 33: CI/CD Pipeline Setup

## Workflows

### `ci.yml` — Continuous Integration
**Trigger:** Pull requests to `main`, pushes to `main` (app-src or Edge Functions changes)

**Jobs:**
1. **lint-and-typecheck** — ESLint + TypeScript type check
2. **build** — Production build, upload artifacts
3. **edge-functions** — Deno type check for Supabase functions

**Purpose:** Catch errors before merge. All PRs must pass CI.

---

### `preview.yml` — Preview Deployments
**Trigger:** Push to any branch except `main` (app-src changes only)

**Jobs:**
1. **deploy-preview** — Build + deploy to `preview/{branch}/` subdirectory on GitHub Pages

**Purpose:** Test changes in live environment before merging.

**Preview URL format:**  
`https://nou-techne.github.io/information-communication-commons/preview/{branch-name}/`

**Cleanup:** Preview deployments persist until manually removed from `gh-pages` branch.

---

## Setup Requirements

### Secrets (None required)
- Uses `GITHUB_TOKEN` (automatic)

### Permissions
- `pull-requests: write` (for preview URL comments)
- `contents: write` (for gh-pages deployment)

### Branch Protection (Recommended)
Enable in repo Settings > Branches > main:
- [x] Require status checks to pass before merging
  - [x] lint-and-typecheck
  - [x] build
- [x] Require branches to be up to date before merging

---

## Local Testing

### Run CI checks locally:
```bash
cd app-src
npm run lint
npx tsc --noEmit
npm run build
```

### Type check Edge Functions:
```bash
deno check --unstable supabase/functions/process-contribution/index.ts
deno check --unstable supabase/functions/process-profile/index.ts
```

---

## Acceptance Criteria ✅

- [x] PRs get automated lint + typecheck + build checks
- [x] Preview deploys work on branch push
- [x] Build artifacts uploaded for inspection
- [x] Edge Functions type-checked via Deno

**Status:** Sprint 33 complete. CI/CD pipeline operational.
