# Commons.id TypeScript SDK Examples

## Installation

```bash
npm install @commons-id/sdk
```

## Basic Setup

```typescript
import { CommonsClient } from '@commons-id/sdk'

const client = new CommonsClient({
  apiKey: 'cid_live_your_api_key_here',
  baseUrl: 'https://api.commons.id', // optional
})
```

---

## Contributions

### Submit a Contribution

```typescript
const contribution = await client.createContribution({
  content: 'Proposal: Add real-time collaboration features to the platform',
  participant_id: 'participant_uuid', // optional
})

console.log(`Created contribution: ${contribution.contribution_id}`)
console.log(`Status: ${contribution.status}`)
```

### Get Contribution Details

```typescript
const contribution = await client.getContribution('contrib_123')

console.log(`Content: ${contribution.content}`)
console.log(`Artifacts created: ${contribution.artifacts.length}`)
contribution.artifacts.forEach(a => {
  console.log(`  - ${a.title} (${a.id})`)
})
```

### List Recent Contributions

```typescript
const contributions = await client.listContributions(50, 0)

contributions.forEach(c => {
  console.log(`${c.created_at}: ${c.content.slice(0, 100)}...`)
})
```

---

## Threads & Messages

### Create a Thread

```typescript
const thread = await client.createThread({
  channel_id: 'channel_uuid',
  title: 'Discussion: API Rate Limits',
  initial_message: 'What should our default rate limits be?',
})

console.log(`Thread created: ${thread.thread_id}`)
```

### List Threads in a Channel

```typescript
const { threads, total } = await client.listThreads({
  channel_id: 'channel_uuid',
  status: 'open',
  limit: 20,
  offset: 0,
})

threads.forEach(t => {
  console.log(`${t.title} - ${t.message_count} messages (${t.status})`)
})
```

### Send a Message

```typescript
const message = await client.createMessage({
  thread_id: 'thread_uuid',
  content: 'I think 100 requests/minute is reasonable for the standard tier.',
  type: 'text',
})

console.log(`Message sent: ${message.message_id}`)
```

### Resolve a Thread

```typescript
await client.resolveThread('thread_uuid', {
  reason: 'Consensus reached',
  summary: 'Agreed on 100 req/min for standard tier, 1000 req/min for pro tier.',
})

console.log('Thread resolved')
```

---

## Knowledge Graph

### Get Full Graph

```typescript
const graph = await client.getGraph({
  convergence_id: 'ethboulder_2026', // optional
  include_dimensions: true,
})

console.log(`Nodes: ${graph.nodes.length}`)
console.log(`Links: ${graph.links.length}`)

// Find all agent nodes
const agents = graph.nodes.filter(n => n.rea_role === 'agent')
console.log(`Agents: ${agents.length}`)
```

### Get Node Details

```typescript
const node = await client.getNode('artifact_uuid')

console.log(`Title: ${node.title}`)
console.log(`Type: ${node.type}`)
console.log(`Tags: ${node.tags.join(', ')}`)
console.log(`Outgoing: ${node.outgoing.length}`)
console.log(`Incoming: ${node.incoming.length}`)
```

### Explore Neighbors

```typescript
// Get nodes within 2 hops
const { nodes, links } = await client.getNeighbors('artifact_uuid', 2)

console.log(`Found ${nodes.length} connected nodes`)
```

---

## Artifacts & Participants

### Get Artifact

```typescript
const artifact = await client.getArtifact('artifact_uuid')

console.log(`${artifact.title}`)
console.log(`Role: ${artifact.rea_role}`)
console.log(`Tags: ${artifact.tags.join(', ')}`)
artifact.relationships.forEach(rel => {
  console.log(`  ${rel.type} → ${rel.target_id}`)
})
```

### List Artifacts by Dimension

```typescript
const { artifacts, total } = await client.listArtifacts({
  dimension: 'human',
  limit: 50,
})

artifacts.forEach(a => {
  console.log(`${a.title} (${a.rea_role})`)
})
```

### Get Participant Profile

```typescript
const participant = await client.getParticipant('participant_uuid')

console.log(`${participant.name}`)
console.log(`Affiliation: ${participant.affiliation}`)
console.log(`Contributions: ${participant.contribution_count}`)
console.log(`Artifacts: ${participant.artifact_count}`)
```

---

## Search

### Search Across All Content

```typescript
const { results, total } = await client.search({
  query: 'governance',
  type: 'all',
  limit: 20,
})

results.forEach(r => {
  console.log(`[${r.type}] ${r.title}`)
  console.log(`  ${r.snippet}`)
  console.log(`  Score: ${r.score}`)
})
```

### Search Only Artifacts

```typescript
const { results } = await client.search({
  query: 'coordination',
  type: 'artifacts',
})

console.log(`Found ${results.length} matching artifacts`)
```

---

## Error Handling

```typescript
import { CommonsClient, ApiError } from '@commons-id/sdk'

try {
  const contribution = await client.getContribution('invalid_id')
} catch (error) {
  if (error instanceof ApiError) {
    console.error(`API Error ${error.status}: ${error.statusText}`)
    console.error(error.body)
  } else {
    console.error('Unexpected error:', error)
  }
}
```

---

## Batch Operations

### Create Multiple Threads

```typescript
const channelId = 'channel_uuid'
const topics = ['API Design', 'UI/UX Feedback', 'Performance']

const threads = await Promise.all(
  topics.map(topic =>
    client.createThread({
      channel_id: channelId,
      title: topic,
    })
  )
)

console.log(`Created ${threads.length} threads`)
```

### Parallel Graph Exploration

```typescript
const nodeIds = ['node1', 'node2', 'node3']

const neighborhoods = await Promise.all(
  nodeIds.map(id => client.getNeighbors(id, 1))
)

const totalNodes = neighborhoods.reduce((sum, n) => sum + n.nodes.length, 0)
console.log(`Explored ${totalNodes} total nodes`)
```

---

## Advanced: Pagination Helper

```typescript
async function getAllArtifacts() {
  const allArtifacts = []
  let offset = 0
  const limit = 50

  while (true) {
    const { artifacts, total } = await client.listArtifacts({ limit, offset })
    allArtifacts.push(...artifacts)

    if (offset + limit >= total) break
    offset += limit
  }

  return allArtifacts
}

const all = await getAllArtifacts()
console.log(`Fetched ${all.length} artifacts`)
```

---

## License

MIT
