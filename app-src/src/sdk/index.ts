// Commons.id TypeScript SDK

import { ApiClient } from '../lib/api-client'
import type {
  CreateContributionRequest,
  CreateContributionResponse,
  GetContributionResponse,
  CreateThreadRequest,
  CreateThreadResponse,
  ListThreadsRequest,
  ListThreadsResponse,
  CreateMessageRequest,
  CreateMessageResponse,
  ListMessagesRequest,
  ListMessagesResponse,
  GetGraphRequest,
  GetGraphResponse,
  SearchRequest,
  SearchResponse,
  GetParticipantResponse,
  GetArtifactResponse,
  ListArtifactsRequest,
  ListArtifactsResponse,
} from '../types/api'

export interface CommonsClientOptions {
  apiKey: string
  baseUrl?: string
}

export class CommonsClient {
  private client: ApiClient

  constructor(options: CommonsClientOptions) {
    this.client = new ApiClient(options.baseUrl)
    
    // Store API key for use in request headers
    this.apiKey = options.apiKey
  }

  private apiKey: string

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    }
  }

  // ===== Contributions =====

  async createContribution(req: CreateContributionRequest): Promise<CreateContributionResponse> {
    return this.client.post('/api/contributions', req, { headers: this.headers })
  }

  async getContribution(id: string): Promise<GetContributionResponse> {
    return this.client.get(`/api/contributions/${id}`, { headers: this.headers })
  }

  async listContributions(limit?: number, offset?: number): Promise<GetContributionResponse[]> {
    return this.client.get('/api/contributions', {
      headers: this.headers,
      params: { limit, offset } as any,
    })
  }

  // ===== Threads =====

  async createThread(req: CreateThreadRequest): Promise<CreateThreadResponse> {
    return this.client.post('/api/threads', req, { headers: this.headers })
  }

  async getThread(id: string) {
    return this.client.get(`/api/threads/${id}`, { headers: this.headers })
  }

  async listThreads(req: ListThreadsRequest): Promise<ListThreadsResponse> {
    return this.client.get('/api/threads', {
      headers: this.headers,
      params: req as any,
    })
  }

  async resolveThread(id: string, resolution: { reason: string; summary: string }) {
    return this.client.post(`/api/threads/${id}/resolve`, resolution, { headers: this.headers })
  }

  // ===== Messages =====

  async createMessage(req: CreateMessageRequest): Promise<CreateMessageResponse> {
    return this.client.post('/api/messages', req, { headers: this.headers })
  }

  async listMessages(req: ListMessagesRequest): Promise<ListMessagesResponse> {
    return this.client.get('/api/messages', {
      headers: this.headers,
      params: req as any,
    })
  }

  // ===== Artifacts =====

  async getArtifact(id: string): Promise<GetArtifactResponse> {
    return this.client.get(`/api/artifacts/${id}`, { headers: this.headers })
  }

  async listArtifacts(req: ListArtifactsRequest = {}): Promise<ListArtifactsResponse> {
    return this.client.get('/api/artifacts', {
      headers: this.headers,
      params: req as any,
    })
  }

  // ===== Participants =====

  async getParticipant(id: string): Promise<GetParticipantResponse> {
    return this.client.get(`/api/participants/${id}`, { headers: this.headers })
  }

  async listParticipants(limit?: number, offset?: number) {
    return this.client.get('/api/participants', {
      headers: this.headers,
      params: { limit, offset } as any,
    })
  }

  // ===== Graph =====

  async getGraph(req: GetGraphRequest = {}): Promise<GetGraphResponse> {
    return this.client.get('/api/graph', {
      headers: this.headers,
      params: req as any,
    })
  }

  async getNode(id: string) {
    return this.client.get(`/api/graph/nodes/${id}`, { headers: this.headers })
  }

  async getNeighbors(id: string, depth: number = 1) {
    return this.client.get(`/api/graph/neighbors/${id}`, {
      headers: this.headers,
      params: { depth },
    })
  }

  // ===== Search =====

  async search(req: SearchRequest): Promise<SearchResponse> {
    return this.client.get('/api/search', {
      headers: this.headers,
      params: req as any,
    })
  }
}

// Export for convenience
export * from '../types/api'
export { ApiError } from '../lib/api-client'
