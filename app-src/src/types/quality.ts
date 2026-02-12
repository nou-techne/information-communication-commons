// Content Quality Score Types

export interface QualityScore {
  completeness: number // 0-100: How complete/comprehensive is the content?
  relevance: number // 0-100: How relevant to the convergence/topic?
  novelty: number // 0-100: How novel/original is the insight?
  accuracy: number // 0-100: How accurate/verified is the information?
  actionability: number // 0-100: How actionable/implementable?
  overall?: number // Composite score (calculated)
}

export interface QualityWeights {
  completeness: number
  relevance: number
  novelty: number
  accuracy: number
  actionability: number
}

/**
 * Default quality score weights
 */
export const DEFAULT_QUALITY_WEIGHTS: QualityWeights = {
  completeness: 0.2,
  relevance: 0.25,
  novelty: 0.15,
  accuracy: 0.25,
  actionability: 0.15,
}

/**
 * Calculate composite quality score from dimensions
 */
export function calculateComposite(
  scores: Omit<QualityScore, 'overall'>,
  weights: QualityWeights = DEFAULT_QUALITY_WEIGHTS
): number {
  const weighted =
    scores.completeness * weights.completeness +
    scores.relevance * weights.relevance +
    scores.novelty * weights.novelty +
    scores.accuracy * weights.accuracy +
    scores.actionability * weights.actionability

  return Math.round(weighted)
}

/**
 * Calculate quality score with composite
 */
export function calculateQualityScore(
  scores: Omit<QualityScore, 'overall'>,
  weights?: QualityWeights
): QualityScore {
  return {
    ...scores,
    overall: calculateComposite(scores, weights),
  }
}

/**
 * Get quality tier from composite score
 */
export function getQualityTier(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent'
  if (score >= 60) return 'good'
  if (score >= 40) return 'fair'
  return 'poor'
}

/**
 * Get color for quality tier
 */
export function getQualityColor(tier: ReturnType<typeof getQualityTier>): string {
  switch (tier) {
    case 'excellent':
      return '#10b981'
    case 'good':
      return '#3b82f6'
    case 'fair':
      return '#f59e0b'
    case 'poor':
      return '#ef4444'
  }
}

/**
 * Validate quality score (all dimensions 0-100)
 */
export function validateQualityScore(scores: Omit<QualityScore, 'overall'>): boolean {
  return Object.values(scores).every(score => score >= 0 && score <= 100)
}

/**
 * Initialize empty quality score
 */
export function createEmptyQualityScore(): QualityScore {
  return {
    completeness: 0,
    relevance: 0,
    novelty: 0,
    accuracy: 0,
    actionability: 0,
    overall: 0,
  }
}
