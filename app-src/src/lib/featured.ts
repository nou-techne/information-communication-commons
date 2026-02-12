// Featured Content Curation

import type { QualityScore } from '../types/quality'
import type { HLAMTDimension } from '../types/api'

export interface FeaturedCandidate {
  id: string
  qualityScore?: QualityScore
  reactionCount?: number
  replyCount?: number
  viewCount?: number
  dimension?: HLAMTDimension
  createdAt: string
}

export interface FeaturedItem extends FeaturedCandidate {
  score: number
  rank: number
}

export interface FeaturedWeights {
  quality: number
  engagement: number
  recency: number
  diversity: number
}

/**
 * Default weights for featured content scoring
 */
export const DEFAULT_FEATURED_WEIGHTS: FeaturedWeights = {
  quality: 0.4,
  engagement: 0.3,
  recency: 0.2,
  diversity: 0.1,
}

/**
 * Calculate quality factor (0-1)
 */
function calculateQualityFactor(qualityScore?: QualityScore): number {
  if (!qualityScore) return 0.5 // Neutral if not scored
  return (qualityScore.overall || 0) / 100
}

/**
 * Calculate engagement factor (0-1)
 */
function calculateEngagementFactor(
  reactionCount = 0,
  replyCount = 0,
  viewCount = 0
): number {
  // Weighted engagement score
  const engagementScore = (reactionCount * 1) + (replyCount * 2) + (viewCount * 0.1)
  
  // Logarithmic scaling to prevent outliers dominating
  return Math.min(1, Math.log10(engagementScore + 1) / 2)
}

/**
 * Calculate recency factor (0-1)
 * Uses exponential decay with 7-day half-life
 */
function calculateRecencyFactor(createdAt: string): number {
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  const halfLifeDays = 7
  
  return Math.exp(-0.693 * (ageDays / halfLifeDays))
}

/**
 * Calculate dimension diversity bonus (0-1)
 * Rewards content from under-represented dimensions
 */
function calculateDiversityBonus(
  dimension: HLAMTDimension | undefined,
  dimensionCounts: Map<HLAMTDimension, number>
): number {
  if (!dimension) return 0
  
  const totalDimensions = Array.from(dimensionCounts.values()).reduce((sum, c) => sum + c, 0)
  if (totalDimensions === 0) return 1
  
  const dimensionCount = dimensionCounts.get(dimension) || 0
  const averageCount = totalDimensions / dimensionCounts.size
  
  // Bonus for under-represented dimensions
  if (dimensionCount < averageCount) {
    return 1 - (dimensionCount / averageCount)
  }
  
  return 0
}

/**
 * Get featured content
 */
export function getFeatured<T extends FeaturedCandidate>(
  items: T[],
  limit: number = 10,
  weights: FeaturedWeights = DEFAULT_FEATURED_WEIGHTS
): FeaturedItem[] {
  if (items.length === 0) return []
  
  // Count dimension distribution for diversity bonus
  const dimensionCounts = new Map<HLAMTDimension, number>()
  items.forEach(item => {
    if (item.dimension) {
      dimensionCounts.set(item.dimension, (dimensionCounts.get(item.dimension) || 0) + 1)
    }
  })
  
  // Calculate scores
  const scored = items.map(item => {
    const qualityFactor = calculateQualityFactor(item.qualityScore)
    const engagementFactor = calculateEngagementFactor(
      item.reactionCount,
      item.replyCount,
      item.viewCount
    )
    const recencyFactor = calculateRecencyFactor(item.createdAt)
    const diversityBonus = calculateDiversityBonus(item.dimension, dimensionCounts)
    
    const score =
      qualityFactor * weights.quality +
      engagementFactor * weights.engagement +
      recencyFactor * weights.recency +
      diversityBonus * weights.diversity
    
    return {
      ...item,
      score,
      rank: 0, // Will be assigned after sorting
    }
  })
  
  // Sort by score descending
  scored.sort((a, b) => b.score - a.score)
  
  // Assign ranks
  scored.forEach((item, index) => {
    item.rank = index + 1
  })
  
  return scored.slice(0, limit)
}

/**
 * Get featured content with dimension balance
 * Ensures representation from all dimensions
 */
export function getFeaturedBalanced<T extends FeaturedCandidate>(
  items: T[],
  limit: number = 10,
  minPerDimension: number = 1
): FeaturedItem[] {
  const dimensions: HLAMTDimension[] = ['human', 'language', 'artifact', 'methodology', 'training']
  const selected: FeaturedItem[] = []
  const remaining = [...items]
  
  // First pass: get at least minPerDimension from each dimension
  dimensions.forEach(dim => {
    const dimItems = remaining.filter(item => item.dimension === dim)
    const featured = getFeatured(dimItems, minPerDimension)
    
    selected.push(...featured)
    
    // Remove selected items from remaining
    featured.forEach(f => {
      const index = remaining.findIndex(r => r.id === f.id)
      if (index >= 0) remaining.splice(index, 1)
    })
  })
  
  // Second pass: fill remaining slots with highest scoring items
  const remainingSlots = limit - selected.length
  if (remainingSlots > 0) {
    const additional = getFeatured(remaining, remainingSlots)
    selected.push(...additional)
  }
  
  // Re-rank the final selection
  selected.sort((a, b) => b.score - a.score)
  selected.forEach((item, index) => {
    item.rank = index + 1
  })
  
  return selected.slice(0, limit)
}

/**
 * Get trending content (high recent engagement)
 */
export function getTrending<T extends FeaturedCandidate>(
  items: T[],
  limit: number = 10,
  windowDays: number = 3
): FeaturedItem[] {
  const cutoff = Date.now() - (windowDays * 24 * 60 * 60 * 1000)
  
  const recent = items.filter(item => 
    new Date(item.createdAt).getTime() >= cutoff
  )
  
  return getFeatured(recent, limit, {
    quality: 0.2,
    engagement: 0.6,
    recency: 0.2,
    diversity: 0,
  })
}

/**
 * Get evergreen content (high quality, timeless)
 */
export function getEvergreen<T extends FeaturedCandidate>(
  items: T[],
  limit: number = 10
): FeaturedItem[] {
  return getFeatured(items, limit, {
    quality: 0.7,
    engagement: 0.2,
    recency: 0,
    diversity: 0.1,
  })
}
