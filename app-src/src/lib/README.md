# Library Files

Sprint 35: TypeScript Strict Mode

## Database Types

### `database.types.ts`
Auto-generated TypeScript types from Supabase database schema.

**Do not edit manually.** Regenerate after schema changes.

### Regenerating Types

```bash
cd app-src
npm run types:generate
```

Or manually:
```bash
cd information-communication-commons
SUPABASE_ACCESS_TOKEN=sbp_0cbce4730fb4b2e2855f94da69b0c21dd1c778d3 \
  npx supabase gen types typescript --project-id hvbdpgkdcdskhpbdeeim \
  > app-src/src/lib/database.types.ts
```

**When to regenerate:**
- After applying database migrations
- After adding/modifying tables, views, or functions
- When type errors indicate schema mismatch

### Usage

The Supabase client in `supabase.ts` is typed with the generated `Database` type:

```typescript
import { supabase } from './supabase'

// Fully typed queries
const { data, error } = await supabase
  .from('artifacts')
  .select('*')
  .eq('type', 'idea')  // TypeScript validates this!
```

## Strict Mode

TypeScript strict mode is enabled in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Acceptance Criteria:** `npx tsc --strict --noEmit` passes with zero errors ✅

---

Sprint 35 complete. All types generated, strict mode enforced, zero type errors.
