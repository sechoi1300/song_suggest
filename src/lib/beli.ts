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
    color: 'from-fuchsia-500 to-violet-600',
    badgeBg: 'bg-fuchsia-500/15',
    textColor: 'text-fuchsia-400',
    borderColor: 'border-fuchsia-500/30',
    minScore: 9.0,
  },
  GREAT: {
    tier: 'GREAT',
    label: 'Great',
    sublabel: 'Must Listen / High Rotation',
    color: 'from-emerald-400 to-teal-600',
    badgeBg: 'bg-emerald-500/15',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
    minScore: 8.0,
  },
  GOOD: {
    tier: 'GOOD',
    label: 'Good',
    sublabel: 'Solid / Worth Returning To',
    color: 'from-sky-400 to-blue-600',
    badgeBg: 'bg-sky-500/15',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/30',
    minScore: 7.0,
  },
  MEDIOCRE: {
    tier: 'MEDIOCRE',
    label: 'Decent',
    sublabel: 'Mixed / A Few Highlights',
    color: 'from-amber-400 to-orange-500',
    badgeBg: 'bg-amber-500/15',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
    minScore: 6.0,
  },
  SKIP: {
    tier: 'SKIP',
    label: 'Not For Me',
    sublabel: 'Disappointing / Skipped',
    color: 'from-rose-500 to-slate-600',
    badgeBg: 'bg-rose-500/15',
    textColor: 'text-rose-400',
    borderColor: 'border-rose-500/30',
    minScore: 0.0,
  },
}

export function getTierFromScore(score: number): TierInfo {
  if (score >= 9.0) return BELI_TIERS.EXCEPTIONAL
  if (score >= 8.0) return BELI_TIERS.GREAT
  if (score >= 7.0) return BELI_TIERS.GOOD
  if (score >= 6.0) return BELI_TIERS.MEDIOCRE
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
    return Math.min(10.0, Number((topScore + 0.3).toFixed(1)))
  }

  // Inserted at bottom (worse than all albums)
  if (insertRank > existingScores.length) {
    const bottomScore = existingScores[existingScores.length - 1]
    return Math.max(3.0, Number((bottomScore - 0.4).toFixed(1)))
  }

  // Inserted between two albums: index insertRank - 2 (above) and insertRank - 1 (below)
  const aboveScore = existingScores[insertRank - 2]
  const belowScore = existingScores[insertRank - 1]

  if (aboveScore === belowScore) {
    return aboveScore
  }

  const midpoint = (aboveScore + belowScore) / 2
  return Number(midpoint.toFixed(1))
}
