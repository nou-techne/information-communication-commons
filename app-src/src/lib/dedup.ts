// Content Deduplication Utility

export interface DuplicateGroup<T> {
  items: T[]
  similarity: number
}

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim()
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity(set1: Set<string>, set2: Set<string>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)))
  const union = new Set([...set1, ...set2])
  
  return union.size === 0 ? 0 : intersection.size / union.size
}

/**
 * Convert text to word set
 */
function textToWordSet(text: string): Set<string> {
  const normalized = normalizeText(text)
  return new Set(normalized.split(/\s+/).filter(word => word.length > 2))
}

/**
 * Calculate similarity between two texts
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const set1 = textToWordSet(text1)
  const set2 = textToWordSet(text2)
  
  return jaccardSimilarity(set1, set2)
}

/**
 * Find duplicate groups in a collection
 */
export function findDuplicates<T extends { id: string; content: string }>(
  items: T[],
  threshold: number = 0.8
): DuplicateGroup<T>[] {
  const groups: DuplicateGroup<T>[] = []
  const processed = new Set<string>()

  for (let i = 0; i < items.length; i++) {
    if (processed.has(items[i].id)) continue

    const group: T[] = [items[i]]
    processed.add(items[i].id)

    for (let j = i + 1; j < items.length; j++) {
      if (processed.has(items[j].id)) continue

      const similarity = calculateSimilarity(items[i].content, items[j].content)

      if (similarity >= threshold) {
        group.push(items[j])
        processed.add(items[j].id)
      }
    }

    // Only create group if duplicates found
    if (group.length > 1) {
      // Calculate average similarity within group
      let totalSimilarity = 0
      let comparisons = 0

      for (let a = 0; a < group.length; a++) {
        for (let b = a + 1; b < group.length; b++) {
          totalSimilarity += calculateSimilarity(group[a].content, group[b].content)
          comparisons++
        }
      }

      groups.push({
        items: group,
        similarity: comparisons > 0 ? totalSimilarity / comparisons : 1,
      })
    }
  }

  // Sort by group size (largest first) then by similarity
  return groups.sort((a, b) => {
    if (a.items.length !== b.items.length) {
      return b.items.length - a.items.length
    }
    return b.similarity - a.similarity
  })
}

/**
 * Find exact duplicates (content hash match)
 */
export function findExactDuplicates<T extends { id: string; content: string }>(
  items: T[]
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  items.forEach(item => {
    const normalized = normalizeText(item.content)
    
    if (!groups.has(normalized)) {
      groups.set(normalized, [])
    }
    groups.get(normalized)!.push(item)
  })

  // Filter to only groups with duplicates
  const duplicates = new Map<string, T[]>()
  groups.forEach((items, key) => {
    if (items.length > 1) {
      duplicates.set(key, items)
    }
  })

  return duplicates
}

/**
 * Check if two items are duplicates
 */
export function isDuplicate(
  text1: string,
  text2: string,
  threshold: number = 0.8
): boolean {
  return calculateSimilarity(text1, text2) >= threshold
}

/**
 * Get duplicate candidates for a single item
 */
export function findCandidates<T extends { id: string; content: string }>(
  item: T,
  candidates: T[],
  threshold: number = 0.8
): Array<{ item: T; similarity: number }> {
  return candidates
    .filter(candidate => candidate.id !== item.id)
    .map(candidate => ({
      item: candidate,
      similarity: calculateSimilarity(item.content, candidate.content),
    }))
    .filter(result => result.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
}

/**
 * Calculate deduplication statistics
 */
export function getDeduplicationStats<T extends { id: string; content: string }>(
  items: T[],
  threshold: number = 0.8
): {
  total: number
  duplicates: number
  unique: number
  groups: number
  compressionRatio: number
} {
  const groups = findDuplicates(items, threshold)
  const duplicateCount = groups.reduce((sum, g) => sum + g.items.length, 0)
  const uniqueCount = items.length - duplicateCount + groups.length

  return {
    total: items.length,
    duplicates: duplicateCount,
    unique: uniqueCount,
    groups: groups.length,
    compressionRatio: items.length > 0 ? uniqueCount / items.length : 1,
  }
}
