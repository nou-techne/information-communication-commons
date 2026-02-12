import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Code, BookOpen } from 'lucide-react'

const endpoints = [
  {
    category: 'Contributions',
    items: [
      {
        method: 'POST',
        path: '/api/contributions',
        description: 'Submit a new contribution',
        request: {
          content: 'string (20-10000 chars)',
          participant_id: 'string (optional)',
        },
        response: {
          contribution_id: 'string',
          status: "'processing' | 'complete' | 'failed'",
          artifacts: 'string[] (optional)',
        },
      },
      {
        method: 'GET',
        path: '/api/contributions/:id',
        description: 'Get a specific contribution',
        response: {
          id: 'string',
          content: 'string',
          status: 'string',
          created_at: 'string (ISO 8601)',
          artifacts: 'Array<{id, title}>',
        },
      },
    ],
  },
  {
    category: 'Threads',
    items: [
      {
        method: 'POST',
        path: '/api/threads',
        description: 'Create a new thread',
        request: {
          channel_id: 'string',
          title: 'string',
          initial_message: 'string (optional)',
        },
        response: {
          thread_id: 'string',
          status: "'open'",
        },
      },
      {
        method: 'GET',
        path: '/api/threads',
        description: 'List threads in a channel',
        params: {
          channel_id: 'string',
          status: 'string (optional)',
          limit: 'number (optional)',
          offset: 'number (optional)',
        },
        response: {
          threads: 'Array<{id, title, status, message_count, created_at, updated_at}>',
          total: 'number',
        },
      },
      {
        method: 'POST',
        path: '/api/threads/:id/resolve',
        description: 'Resolve a thread with summary',
        request: {
          reason: 'string',
          summary: 'string',
        },
      },
    ],
  },
  {
    category: 'Messages',
    items: [
      {
        method: 'POST',
        path: '/api/messages',
        description: 'Create a message in a thread',
        request: {
          thread_id: 'string',
          content: 'string',
          type: "'text' | 'contribution' | 'system' (optional)",
        },
        response: {
          message_id: 'string',
          created_at: 'string (ISO 8601)',
        },
      },
      {
        method: 'GET',
        path: '/api/messages',
        description: 'List messages in a thread',
        params: {
          thread_id: 'string',
          limit: 'number (optional)',
          offset: 'number (optional)',
        },
        response: {
          messages: 'Array<{id, author_id, content, type, created_at, reactions}>',
          total: 'number',
        },
      },
    ],
  },
  {
    category: 'Graph',
    items: [
      {
        method: 'GET',
        path: '/api/graph',
        description: 'Get knowledge graph nodes and edges',
        params: {
          convergence_id: 'string (optional)',
          include_dimensions: 'boolean (optional)',
        },
        response: {
          nodes: 'Array<{id, title, type, rea_role}>',
          links: 'Array<{source, target, type}>',
        },
      },
      {
        method: 'GET',
        path: '/api/graph/nodes/:id',
        description: 'Get a specific node with relationships',
      },
      {
        method: 'GET',
        path: '/api/graph/neighbors/:id',
        description: 'Get neighboring nodes',
        params: {
          depth: 'number (1-3, default 1)',
        },
      },
    ],
  },
  {
    category: 'Search',
    items: [
      {
        method: 'GET',
        path: '/api/search',
        description: 'Search across all content types',
        params: {
          query: 'string',
          type: "'artifacts' | 'contributions' | 'messages' | 'participants' | 'all' (optional)",
          limit: 'number (optional)',
          offset: 'number (optional)',
        },
        response: {
          results: 'Array<{id, type, title, snippet, score}>',
          total: 'number',
        },
      },
    ],
  },
]

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen className="w-8 h-8 text-[#a6ed2a]" />
          <h1 className="text-3xl font-bold">API Documentation</h1>
        </div>
        <p className="text-gray-400">
          commons.id programmatic API for contributions, threads, messages, and knowledge graph access.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-bold">Authentication</h2>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-300 mb-2">
            Include your API key in the <code className="bg-[#080c16] px-2 py-0.5 rounded text-[#a6ed2a]">Authorization</code> header:
          </p>
          <pre className="bg-[#080c16] p-3 rounded text-xs text-gray-300 overflow-x-auto">
            Authorization: Bearer cid_live_your_api_key_here
          </pre>
        </CardBody>
      </Card>

      <div className="space-y-8">
        {endpoints.map((category) => (
          <div key={category.category}>
            <h2 className="text-2xl font-bold mb-4 text-[#a6ed2a]">{category.category}</h2>
            <div className="space-y-4">
              {category.items.map((endpoint, i) => (
                <Card key={i}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-1 text-xs font-mono rounded font-bold"
                        style={{
                          backgroundColor: endpoint.method === 'GET' ? '#3b82f620' : '#10b98120',
                          color: endpoint.method === 'GET' ? '#3b82f6' : '#10b981',
                        }}
                      >
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-gray-300">{endpoint.path}</code>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">{endpoint.description}</p>
                  </CardHeader>
                  <CardBody>
                    {'params' in endpoint && endpoint.params && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Query Parameters</h4>
                        <pre className="bg-[#080c16] p-3 rounded text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(endpoint.params, null, 2)}
                        </pre>
                      </div>
                    )}
                    {'request' in endpoint && endpoint.request && (
                      <div className="mb-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Request Body</h4>
                        <pre className="bg-[#080c16] p-3 rounded text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(endpoint.request, null, 2)}
                        </pre>
                      </div>
                    )}
                    {'response' in endpoint && endpoint.response && (
                      <div>
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Response</h4>
                        <pre className="bg-[#080c16] p-3 rounded text-xs text-gray-300 overflow-x-auto">
                          {JSON.stringify(endpoint.response, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-[#a6ed2a]" />
            <h2 className="text-lg font-bold">Rate Limits</h2>
          </div>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-gray-300">
            Standard: <strong className="text-white">100 requests/minute</strong>
          </p>
          <p className="text-sm text-gray-300 mt-1">
            Response headers include <code className="bg-[#080c16] px-2 py-0.5 rounded text-[#a6ed2a]">X-RateLimit-Remaining</code> and{' '}
            <code className="bg-[#080c16] px-2 py-0.5 rounded text-[#a6ed2a]">X-RateLimit-Reset</code>.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
