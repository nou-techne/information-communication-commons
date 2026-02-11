# TypeScript SDK

**Sprint 56** — TypeScript SDK wrapping the REST API

## Status

**Deferred to post-ETHBoulder.** A TypeScript SDK provides type-safe programmatic access to the commons API. Depends on Sprint 53 (Public REST API v1) being implemented first. Not critical for Feb 13-16 event since participants use the web UI directly. Becomes valuable post-event when developers want to build external tools.

## Rationale

- **Event priority:** ETHBoulder starts in ~36 hours. Focus on participant-facing features
- **Dependency:** Requires Sprint 53 (Public REST API) to be implemented first
- **No external developers:** No third-party tools requesting SDK access
- **Post-event value:** After event, SDK enables external integrations and automation scripts

## Use Cases

**Automation scripts:**
- Bulk import contributions from external sources
- Export artifacts to other formats
- Sync convergence data to other platforms

**Third-party applications:**
- Mobile apps accessing commons data
- Desktop tools for offline editing
- Browser extensions for cross-platform contribution

**Data analysis:**
- Research scripts analyzing contribution patterns
- Statistical analysis of dimension distributions
- Network analysis of artifact relationships

**Bot integrations:**
- Discord/Slack bots posting updates
- Automated contribution parsing from chat
- Cross-platform notification systems

## Package Structure

```
@commons-id/sdk/
├── src/
│   ├── client.ts           # Main client class
│   ├── resources/
│   │   ├── artifacts.ts    # Artifact endpoints
│   │   ├── contributions.ts
│   │   ├── participants.ts
│   │   ├── dimensions.ts
│   │   ├── sessions.ts
│   │   └── search.ts
│   ├── types/
│   │   ├── index.ts        # Exported types
│   │   ├── artifact.ts
│   │   ├── contribution.ts
│   │   └── common.ts
│   └── index.ts            # Main export
├── package.json
├── tsconfig.json
├── README.md
└── examples/
    ├── basic.ts
    ├── batch-import.ts
    └── realtime.ts
```

## API Design

### Client Initialization

```typescript
import { CommonsClient } from '@commons-id/sdk'

const client = new CommonsClient({
  apiKey: 'ck_live_abc123...',
  convergence: 'ethboulder',
  baseUrl: 'https://api.commons.id/v1'  // Optional, defaults to production
})
```

### Type Definitions

```typescript
// types/artifact.ts
export interface Artifact {
  id: string
  title: string
  body: string
  summary: string
  type: ArtifactType
  state: ArtifactState
  rea_role: 'resource' | 'event' | 'agent'
  created_at: string
  updated_at: string
  steward: {
    id: string
    name: string
  }
  dimensions: Dimension[]
  relationships: Relationship[]
  tags: string[]
  url: string
}

export type ArtifactType = 
  | 'idea' 
  | 'proposal' 
  | 'commitment' 
  | 'pattern' 
  | 'synthesis' 
  | 'question' 
  | 'reflection'

export type ArtifactState = 'draft' | 'active' | 'archived'

export interface Dimension {
  key: string
  label: string
  weight: number
}

export interface Relationship {
  type: RelationType
  to: {
    id: string
    title: string
  }
  weight?: number
}

export type RelationType = 
  | 'extends' 
  | 'implements' 
  | 'depends-on' 
  | 'related-to' 
  | 'supports'

// types/contribution.ts
export interface Contribution {
  id: string
  content: string
  status: 'pending' | 'processing' | 'complete' | 'error'
  created_at: string
  processed_at?: string
  participant?: {
    id: string
    name: string
  }
  session?: {
    id: string
    title: string
  }
  artifacts_extracted: number
  url: string
}

// types/common.ts
export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    limit: number
    offset: number
    next?: string
  }
  meta: {
    generated_at: string
    api_version: string
  }
}

export interface CommonsError {
  error: string
  message: string
  details?: any
}
```

### Resource Classes

```typescript
// resources/artifacts.ts
export class ArtifactsResource {
  constructor(private client: CommonsClient) {}
  
  async list(params?: {
    limit?: number
    offset?: number
    type?: ArtifactType
    dimension?: string
  }): Promise<PaginatedResponse<Artifact>> {
    return this.client.request('GET', '/artifacts', { params })
  }
  
  async get(id: string): Promise<Artifact> {
    return this.client.request('GET', `/artifacts/${id}`)
  }
  
  async search(query: string, options?: {
    limit?: number
    type?: ArtifactType
  }): Promise<{ results: Artifact[], total: number }> {
    return this.client.request('GET', '/search', {
      params: { q: query, ...options }
    })
  }
  
  // Future: write operations
  async create(data: Partial<Artifact>): Promise<Artifact> {
    return this.client.request('POST', '/artifacts', { body: data })
  }
  
  async update(id: string, data: Partial<Artifact>): Promise<Artifact> {
    return this.client.request('PATCH', `/artifacts/${id}`, { body: data })
  }
}

// resources/contributions.ts
export class ContributionsResource {
  constructor(private client: CommonsClient) {}
  
  async list(params?: {
    limit?: number
    status?: Contribution['status']
    session?: string
  }): Promise<PaginatedResponse<Contribution>> {
    return this.client.request('GET', '/contributions', { params })
  }
  
  async get(id: string): Promise<Contribution> {
    return this.client.request('GET', `/contributions/${id}`)
  }
  
  async create(content: string, options?: {
    session_id?: string
  }): Promise<Contribution> {
    return this.client.request('POST', '/contributions', {
      body: { content, ...options }
    })
  }
}

// resources/participants.ts
export class ParticipantsResource {
  constructor(private client: CommonsClient) {}
  
  async list(params?: { limit?: number }): Promise<PaginatedResponse<Participant>> {
    return this.client.request('GET', '/participants', { params })
  }
  
  async get(id: string): Promise<Participant> {
    return this.client.request('GET', `/participants/${id}`)
  }
}

// resources/dimensions.ts
export class DimensionsResource {
  constructor(private client: CommonsClient) {}
  
  async list(): Promise<Dimension[]> {
    const response = await this.client.request('GET', '/dimensions')
    return response.data
  }
  
  async get(key: string): Promise<Dimension & { artifacts: Artifact[] }> {
    return this.client.request('GET', `/dimensions/${key}`)
  }
}
```

### Main Client

```typescript
// client.ts
export interface CommonsClientConfig {
  apiKey: string
  convergence?: string
  baseUrl?: string
  timeout?: number
}

export class CommonsClient {
  private config: Required<CommonsClientConfig>
  
  public artifacts: ArtifactsResource
  public contributions: ContributionsResource
  public participants: ParticipantsResource
  public dimensions: DimensionsResource
  public sessions: SessionsResource
  
  constructor(config: CommonsClientConfig) {
    this.config = {
      baseUrl: 'https://api.commons.id/v1',
      convergence: '',
      timeout: 30000,
      ...config
    }
    
    // Initialize resources
    this.artifacts = new ArtifactsResource(this)
    this.contributions = new ContributionsResource(this)
    this.participants = new ParticipantsResource(this)
    this.dimensions = new DimensionsResource(this)
    this.sessions = new SessionsResource(this)
  }
  
  async request<T>(
    method: string,
    path: string,
    options?: {
      params?: Record<string, any>
      body?: any
    }
  ): Promise<T> {
    const url = new URL(this.config.baseUrl + path)
    
    // Add query params
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }
    
    // Add default convergence if not in params
    if (this.config.convergence && !url.searchParams.has('convergence')) {
      url.searchParams.append('convergence', this.config.convergence)
    }
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
    
    try {
      const response = await fetch(url.toString(), {
        method,
        headers: {
          'X-API-Key': this.config.apiKey,
          'Content-Type': 'application/json',
          'User-Agent': '@commons-id/sdk/1.0.0'
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const error: CommonsError = await response.json()
        throw new CommonsAPIError(error.message, response.status, error)
      }
      
      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        throw new CommonsAPIError('Request timeout', 408)
      }
      
      throw error
    }
  }
}

export class CommonsAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'CommonsAPIError'
  }
}
```

### Index Export

```typescript
// index.ts
export { CommonsClient } from './client'
export type { CommonsClientConfig } from './client'
export * from './types'
export { CommonsAPIError } from './client'
```

## Usage Examples

### Basic Usage

```typescript
import { CommonsClient } from '@commons-id/sdk'

const client = new CommonsClient({
  apiKey: process.env.COMMONS_API_KEY!,
  convergence: 'ethboulder'
})

// List artifacts
const { data: artifacts } = await client.artifacts.list({
  limit: 20,
  type: 'pattern'
})

console.log(`Found ${artifacts.length} patterns`)

// Get specific artifact
const artifact = await client.artifacts.get('artifact-id')
console.log(artifact.title)

// Search
const { results } = await client.artifacts.search('knowledge graph', {
  limit: 10
})
```

### Batch Import

```typescript
// examples/batch-import.ts
import { CommonsClient } from '@commons-id/sdk'
import { readFileSync } from 'fs'

const client = new CommonsClient({
  apiKey: process.env.COMMONS_API_KEY!,
  convergence: 'ethboulder'
})

// Import contributions from JSON file
const contributions = JSON.parse(
  readFileSync('contributions.json', 'utf-8')
)

for (const item of contributions) {
  try {
    const contribution = await client.contributions.create(item.content, {
      session_id: item.session_id
    })
    
    console.log(`✓ Created contribution ${contribution.id}`)
    
    // Rate limit: wait 100ms between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  } catch (error) {
    console.error(`✗ Failed: ${error.message}`)
  }
}
```

### Real-time Updates

```typescript
// examples/realtime.ts
import { CommonsClient } from '@commons-id/sdk'
import { createClient } from '@supabase/supabase-js'

const client = new CommonsClient({
  apiKey: process.env.COMMONS_API_KEY!,
  convergence: 'ethboulder'
})

// Subscribe to new contributions via Supabase
const supabase = createClient(
  'https://hvbdpgkdcdskhpbdeeim.supabase.co',
  'sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv'
)

supabase
  .channel('contributions')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'contributions' },
    async (payload) => {
      const contribution = await client.contributions.get(payload.new.id)
      console.log('New contribution:', contribution.content)
    }
  )
  .subscribe()
```

### Data Export

```typescript
// examples/export.ts
import { CommonsClient } from '@commons-id/sdk'
import { writeFileSync } from 'fs'

const client = new CommonsClient({
  apiKey: process.env.COMMONS_API_KEY!,
  convergence: 'ethboulder'
})

// Export all artifacts to JSON
let allArtifacts = []
let offset = 0
const limit = 100

while (true) {
  const { data, pagination } = await client.artifacts.list({ limit, offset })
  allArtifacts.push(...data)
  
  if (offset + limit >= pagination.total) break
  offset += limit
}

writeFileSync(
  'artifacts-export.json',
  JSON.stringify(allArtifacts, null, 2)
)

console.log(`Exported ${allArtifacts.length} artifacts`)
```

## Package Configuration

### package.json

```json
{
  "name": "@commons-id/sdk",
  "version": "1.0.0",
  "description": "TypeScript SDK for commons.id API",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["commons", "knowledge-graph", "convergence", "rea"],
  "author": "Techne",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/nou-techne/information-communication-commons"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.0.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "examples"]
}
```

## Testing

```typescript
// src/__tests__/client.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { CommonsClient } from '../client'

describe('CommonsClient', () => {
  let client: CommonsClient
  
  beforeEach(() => {
    client = new CommonsClient({
      apiKey: 'test-key',
      convergence: 'test',
      baseUrl: 'https://api.test.commons.id/v1'
    })
  })
  
  it('initializes resources', () => {
    expect(client.artifacts).toBeDefined()
    expect(client.contributions).toBeDefined()
    expect(client.participants).toBeDefined()
  })
  
  it('constructs URLs correctly', async () => {
    // Mock fetch to capture request
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ data: [] })
      })
    )
    
    await client.artifacts.list({ limit: 20 })
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/artifacts?limit=20&convergence=test'),
      expect.any(Object)
    )
  })
  
  it('handles errors', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: async () => ({ error: 'not_found', message: 'Artifact not found' })
      })
    )
    
    await expect(client.artifacts.get('invalid-id')).rejects.toThrow('Artifact not found')
  })
})
```

## Documentation

### README.md

```markdown
# @commons-id/sdk

TypeScript SDK for commons.id API

## Installation

\`\`\`bash
npm install @commons-id/sdk
\`\`\`

## Quick Start

\`\`\`typescript
import { CommonsClient } from '@commons-id/sdk'

const client = new CommonsClient({
  apiKey: 'your-api-key',
  convergence: 'ethboulder'
})

// List artifacts
const { data } = await client.artifacts.list()

// Search
const { results } = await client.artifacts.search('knowledge graph')

// Get specific artifact
const artifact = await client.artifacts.get('artifact-id')
\`\`\`

## Documentation

Full API documentation: https://docs.commons.id/sdk

## Examples

See `examples/` directory for:
- Basic usage
- Batch import
- Real-time subscriptions
- Data export

## License

MIT
```

## Publishing

```bash
# Build
npm run build

# Test
npm test

# Publish to npm
npm publish --access public

# Or publish with tag
npm publish --tag beta
```

## Acceptance Criteria (Deferred)

- [x] TypeScript SDK plan documented
- [ ] SDK wraps all API endpoints (artifacts, contributions, participants, dimensions, search)
- [ ] Full TypeScript type definitions
- [ ] Error handling with custom error class
- [ ] Rate limit handling (respect 429 responses)
- [ ] Pagination helpers
- [ ] Published to npm as `@commons-id/sdk`
- [ ] README with examples
- [ ] Unit tests (80%+ coverage)
- [ ] Examples directory with common use cases

**Target completion:** Post-ETHBoulder (Feb 17+), after Sprint 53 (Public REST API v1)

## Priority

**Medium.** TypeScript SDK becomes valuable when:
- External developers build integrations
- Automation scripts need type safety
- Third-party tools access API programmatically
- Mobile/desktop apps need consistent API layer

For initial event capture, direct API calls or Supabase client sufficient.

## Notes

This sprint demonstrates the value of SDK-first API design. A well-typed SDK makes integration easier and catches errors at compile time rather than runtime.

The SDK should be published early (even as beta) to gather feedback on API ergonomics before finalizing the public API design in Sprint 53.

Zero runtime dependencies keeps the package lightweight. Only development dependencies (TypeScript, Vitest) are needed.
