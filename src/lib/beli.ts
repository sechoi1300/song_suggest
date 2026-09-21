export type BeliTier = 'EXCEPTIONAL' | 'GREAT' | 'GOOD' | 'MEDIOCRE' | 'SKIP'

export interface TierInfo {
  tier: BeliTier
  label: string
  sublabel: string
  color: string
  badgeBg: string
  textColor: string
  borderColor: string
  minScore: number
}

export const BELI_TIERS: Record<BeliTier, TierInfo> = {
  EXCEPTIONAL: {
    tier: 'EXCEPTIONAL',
    label: 'Exceptional',
    sublabel: 'Masterpiece / Holy Grail',
    color: 'from-amber-700 to-amber-900',
    badgeBg: 'bg-amber-100/80',
    textColor: 'text-amber-900',
    borderColor: 'border-amber-300',
    minScore: 9.0,
  },
  GREAT: {
    tier: 'GREAT',
    label: 'Great',
    sublabel: 'Must Listen / High Rotation',
    color: 'from-stone-700 to-stone-900',
    badgeBg: 'bg-[#EAE4D9]',
    textColor: 'text-stone-900',
    borderColor: 'border-[#D9D1C3]',
    minScore: 8.0,
  },
  GOOD: {
    tier: 'GOOD',
    label: 'Good',
    sublabel: 'Solid / Worth Returning To',
    color: 'from-stone-500 to-stone-700',
    badgeBg: 'bg-[#F3EDE2]',
    textColor: 'text-[#615243]',
    borderColor: 'border-[#E0D7C9]',
    minScore: 7.0,
  },
  MEDIOCRE: {
    tier: 'MEDIOCRE',
    label: 'OK / Average',
    sublabel: 'Decent / Mixed Highlights',
    color: 'from-stone-400 to-stone-600',
    badgeBg: 'bg-stone-100',
    textColor: 'text-stone-600',
    borderColor: 'border-stone-200',
    minScore: 5.0,
  },
  SKIP: {
    tier: 'SKIP',
    label: 'Below Average',
    sublabel: 'Disappointing / Skip',
    color: 'from-stone-300 to-stone-400',
    badgeBg: 'bg-stone-100/60',
    textColor: 'text-stone-500',
    borderColor: 'border-stone-200',
    minScore: 0.0,
  },
}

export function getTierFromScore(score: number): TierInfo {
  if (score >= 9.0) return BELI_TIERS.EXCEPTIONAL
  if (score >= 8.0) return BELI_TIERS.GREAT
  if (score >= 7.0) return BELI_TIERS.GOOD
  if (score >= 5.0) return BELI_TIERS.MEDIOCRE
  return BELI_TIERS.SKIP
}

export const BELI_VIBES = [
  'Late Night',
  'Deep Focus',
  'Summer Drive',
  'Melancholy',
  'Gym Pump',
  'Heartbreak Healing',
  'Sunday Vinyl',
  'Psychedelic',
  'Party Anthem',
  'Cozy & Warm',
  'Rainy Day',
  'High Energy',
]

export const LISTEN_AGAIN_OPTIONS = [
  { value: 'ON_REPEAT', label: 'On Repeat 🔁', desc: 'Will listen many times' },
  { value: 'RIGHT_MOOD', label: 'Right Mood 🌙', desc: 'Will return for specific vibes' },
  { value: 'ONE_AND_DONE', label: 'One & Done 🛑', desc: 'Glad I heard it, but moving on' },
]

export const LISTENED_WITH_OPTIONS = [
  'Headphones 🎧',
  'Car Stereo 🚗',
  'Vinyl Record 💿',
  'Home Speakers 🔊',
  'With Friends 👥',
  'Live Concert 🎤',
]

/**
 * Calculates a dynamic Beli-style decimal score based on rank placement among user's sorted albums.
 * Prevents decimal collisions between closely spaced ratings (e.g. 9.1 and 9.0) by preserving
 * precise fractional steps or shifting slightly so distinct ranks never share an identical score.
 */
export function calculateScoreFromRankPlacement(
  insertRank: number, // 1-based rank position (1 = top)
  existingScores: number[] // sorted descending (e.g. [9.6, 9.1, 8.4, 7.8, 6.5])
): number {
  if (existingScores.length === 0) {
    return 8.5
  }

  // Inserted at #1 (better than best album)
  if (insertRank === 1) {
    const topScore = existingScores[0]
    if (topScore >= 10.0) return 10.0
    const next1 = Number((topScore + 0.2).toFixed(1))
    if (next1 > topScore && next1 <= 10.0) {
      return next1
    }
    const next2 = Number((topScore + 0.05).toFixed(2))
    return Math.min(10.0, next2 > topScore ? next2 : topScore)
  }

  // Inserted at bottom (worse than all albums)
  if (insertRank > existingScores.length) {
    const bottomScore = existingScores[existingScores.length - 1]
    if (bottomScore <= 0.0) return 0.0
    const next1 = Number((bottomScore - 0.2).toFixed(1))
    if (next1 < bottomScore && next1 >= 0.0) {
      return next1
    }
    const next2 = Number((bottomScore - 0.05).toFixed(2))
    return Math.max(0.0, next2 < bottomScore ? next2 : Math.max(0.0, bottomScore - 0.01))
  }

  // Inserted between two albums: index insertRank - 2 (above) and insertRank - 1 (below)
  const aboveScore = existingScores[insertRank - 2]
  const belowScore = existingScores[insertRank - 1]

  // If both neighbors share the exact same score, shift slightly
  if (aboveScore === belowScore) {
    const shifted = Number((aboveScore - 0.05).toFixed(2))
    return Math.max(0.0, Math.min(10.0, shifted))
  }

  // Try standard 1 decimal place midpoint
  const midpoint = (aboveScore + belowScore) / 2
  const oneDecimal = Number(midpoint.toFixed(1))
  if (oneDecimal > belowScore && oneDecimal < aboveScore) {
    return oneDecimal
  }

  // Preserve fractional step to 2 decimal places to avoid collision (e.g. 9.1 and 9.0 -> 9.05)
  const twoDecimal = Number(midpoint.toFixed(2))
  if (twoDecimal > belowScore && twoDecimal < aboveScore) {
    return twoDecimal
  }

  // For very narrow gaps, preserve 3 decimal places
  const threeDecimal = Number(midpoint.toFixed(3))
  if (threeDecimal > belowScore && threeDecimal < aboveScore) {
    return threeDecimal
  }

  return midpoint
}
