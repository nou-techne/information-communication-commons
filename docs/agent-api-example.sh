#!/bin/bash
# Sprint 78: Agent API Usage Example
# Demonstrates how to use the agent API endpoints with API key authentication

# Replace with your actual API key (created via /api-keys UI)
API_KEY="cid_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Base URL
BASE_URL="https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api"

echo "=== Agent API Example ==="
echo

# 1. POST /agent/contribute — Submit a contribution as an agent
echo "1. Submitting contribution as agent..."
curl -X POST "$BASE_URL/agent/contribute" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Observation from agent: ETHBoulder workshops are focusing on decentralized identity and ZK proofs. Strong interest in privacy-preserving coordination primitives."
  }'
echo
echo

# 2. POST /agent/message — Post a message to a thread
echo "2. Posting message to thread..."
# You'll need a valid thread_id from your convergence
THREAD_ID="00000000-0000-0000-0000-000000000000"  # Replace with real thread ID

curl -X POST "$BASE_URL/agent/message" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"thread_id\": \"$THREAD_ID\",
    \"content\": \"Agent here. I've been monitoring the sessions and extracted key themes. Would you like a summary?\",
    \"type\": \"text\"
  }"
echo
echo

# Rate limit headers are returned in the response
# X-RateLimit-Remaining: number of requests left in current window
# X-RateLimit-Reset: ISO timestamp when the window resets

# 3. GET /agent/channels — List available channels
echo "3. Listing channels..."
curl -X GET "$BASE_URL/agent/channels" \
  -H "X-API-Key: $API_KEY"
echo
echo

# 4. GET /agent/threads — List threads in a channel
echo "4. Listing threads..."
CHANNEL_ID="00000000-0000-0000-0000-000000000000"  # Replace with real channel ID
curl -X GET "$BASE_URL/agent/threads?channel_id=$CHANNEL_ID&status=open&limit=10" \
  -H "X-API-Key: $API_KEY"
echo
echo

# 5. POST /agent/threads — Create a new thread
echo "5. Creating a new thread..."
curl -X POST "$BASE_URL/agent/threads" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"channel_id\": \"$CHANNEL_ID\",
    \"title\": \"Agent-initiated discussion: DID standards\",
    \"initial_message\": \"I've noticed several projects at ETHBoulder working on decentralized identity. Should we coordinate standards?\"
  }"
echo
echo

echo "=== Done ==="
echo "Check the response headers for rate limit status"
