'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTierFromScore, calculateScoreFromRankPlacement } from '@/lib/beli'
import { z } from 'zod'

function sanitizeText(str?: string | null): string | null {
  if (!str) return null
  return str.replace(/<[^>]*>?/gm, '').trim() || null
}

const saveBeliReviewSchema = z.object({
  albumId: z.string().trim().min(1, 'Album ID is required').max(100),
  score: z.number().min(0.0, 'Score must be at least 0.0').max(10.0, 'Score cannot exceed 10.0'),
  targetRank: z.number().int().positive().optional(),
  favoriteTracks: z.array(z.string().trim().max(200)).max(30).optional().default([]),
  skipTrack: z.string().trim().max(200).optional().nullable(),
  vibes: z.array(z.string().trim().max(50)).max(20).optional().default([]),
  listenAgain: z.string().trim().max(50).optional().nullable(),
  listenedWith: z.string().trim().max(50).optional().nullable(),
  reviewText: z.string().trim().max(5000, 'Review text cannot exceed 5000 characters').optional().nullable(),
})

export interface SaveBeliReviewInput {
  albumId: string
  score: number // e.g. 9.4
  targetRank?: number // 1-based rank position
  favoriteTracks?: string[]
  skipTrack?: string
  vibes?: string[]
  listenAgain?: string
  listenedWith?: string
  reviewText?: string
}

export async function saveBeliReview(input: SaveBeliReviewInput) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: 'You must be signed in to rate an album' }
    }

    const userId = session.user.id

    // Strict input validation with Zod
    const parsed = saveBeliReviewSchema.safeParse(input)
    if (!parsed.success) {
      const msg = parsed.error.issues.map((i) => i.message).join(', ')
      return { success: false, error: msg || 'Invalid input data' }
    }

    const valid = parsed.data
    const sanitizedReviewText = sanitizeText(valid.reviewText)
    const sanitizedSkipTrack = sanitizeText(valid.skipTrack)
    const sanitizedFavoriteTracks = (valid.favoriteTracks || [])
      .map((t) => sanitizeText(t))
      .filter((t): t is string => Boolean(t))
    const sanitizedVibes = (valid.vibes || [])
      .map((v) => sanitizeText(v))
      .filter((v): v is string => Boolean(v))

    const tierInfo = getTierFromScore(valid.score)

    // Execute review save, rank resequence, and album stat recalculations in atomic transaction
    const review = await prisma.$transaction(async (tx) => {
      // 1. Check existing review
      const existingReview = await tx.review.findUnique({
        where: {
          userId_albumId: {
            userId,
            albumId: valid.albumId,
          },
        },
      })

      // 2. Fetch other user reviews to determine target rank
      const otherReviews = await tx.review.findMany({
        where: {
          userId,
          albumId: { not: valid.albumId },
        },
        orderBy: {
          rank: 'asc',
        },
      })

      let assignedRank = valid.targetRank
      if (!assignedRank) {
        const insertIdx = otherReviews.findIndex((r) => valid.score > r.rating)
        assignedRank = insertIdx === -1 ? otherReviews.length + 1 : insertIdx + 1
      }

      let savedReview
      if (existingReview) {
        savedReview = await tx.review.update({
          where: { id: existingReview.id },
          data: {
            rating: valid.score,
            rank: assignedRank,
            tier: tierInfo.tier,
            favoriteTracks: sanitizedFavoriteTracks,
            skipTrack: sanitizedSkipTrack,
            vibes: sanitizedVibes,
            listenAgain: valid.listenAgain || null,
            listenedWith: valid.listenedWith || null,
            reviewText: sanitizedReviewText,
          },
        })
      } else {
        savedReview = await tx.review.create({
          data: {
            userId,
            albumId: valid.albumId,
            rating: valid.score,
            rank: assignedRank,
            tier: tierInfo.tier,
            favoriteTracks: sanitizedFavoriteTracks,
            skipTrack: sanitizedSkipTrack,
            vibes: sanitizedVibes,
            listenAgain: valid.listenAgain || null,
            listenedWith: valid.listenedWith || null,
            reviewText: sanitizedReviewText,
          },
        })
      }

      // 3. Remove from WantToListen queue
      await tx.wantToListen.deleteMany({
        where: {
          userId,
          albumId: valid.albumId,
        },
      })

      // 4. Resequence ranks cleanly
      const allUserReviews = await tx.review.findMany({
        where: { userId },
        orderBy: [
          { rank: 'asc' },
          { rating: 'desc' },
        ],
      })

      for (let i = 0; i < allUserReviews.length; i++) {
        const current = allUserReviews[i]
        const newRank = i + 1
        if (current.rank !== newRank) {
          await tx.review.update({
            where: { id: current.id },
            data: { rank: newRank },
          })
        }
      }

      // 5. Recalculate & persist album's denormalized averageRating & reviewCount
      const albumReviews = await tx.review.findMany({
        where: { albumId: valid.albumId },
        select: { rating: true },
      })
      const reviewCount = albumReviews.length
      const averageRating =
        reviewCount > 0
          ? Number((albumReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
          : null

      await tx.album.updateMany({
        where: { id: valid.albumId },
        data: {
          averageRating,
          reviewCount,
        },
      })

      return savedReview
    })

    revalidatePath(`/albums/${valid.albumId}`)
    revalidatePath('/profile')
    revalidatePath('/')
    revalidatePath('/queue')

    return { success: true, review }
  } catch (error) {
    console.error('Error saving Beli review:', error)
    return { success: false, error: 'Failed to save album review' }
  }
}

// Backward compatible helper
export async function createReview(albumId: string, rating: number, reviewText?: string) {
  return saveBeliReview({
    albumId,
    score: rating,
    reviewText,
  })
}

export async function getUserRankedReviews(userId?: string) {
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const session = await getServerSession(authOptions)
      targetUserId = session?.user?.id
    }

    if (!targetUserId) {
      return []
    }

    const reviews = await prisma.review.findMany({
      where: { userId: targetUserId },
      include: {
        album: true,
      },
      orderBy: [
        { rank: 'asc' },
        { rating: 'desc' },
      ],
    })

    return reviews
  } catch (error) {
    console.warn('Error fetching user ranked reviews:', error)
    return []
  }
}

export async function getUserExistingRatingsForComparison() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return []

    const reviews = await prisma.review.findMany({
      where: { userId: session.user.id },
      include: {
        album: {
          select: {
            id: true,
            title: true,
            artist: true,
            coverImageUrl: true,
            releaseYear: true,
          },
        },
      },
      orderBy: {
        rank: 'asc',
      },
    })

    return reviews.map((r) => ({
      reviewId: r.id,
      albumId: r.albumId,
      title: r.album.title,
      artist: r.album.artist,
      coverImageUrl: r.album.coverImageUrl,
      rank: r.rank ?? 1,
      rating: r.rating,
      tier: r.tier,
    }))
  } catch (error) {
    console.warn('Error fetching ratings for comparison:', error)
    return []
  }
}

export async function reorderUserRankedReviews(reviewIdsInOrder: string[]) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    const userId = session.user.id

    // Fetch existing reviews in current state
    const currentReviews = await prisma.review.findMany({
      where: {
        userId,
        id: { in: reviewIdsInOrder },
      },
      include: {
        album: {
          select: {
            id: true,
            title: true,
            artist: true,
            coverImageUrl: true,
            genres: true,
            releaseYear: true,
          },
        },
      },
    })

    const reviewMap = new Map(currentReviews.map((r) => [r.id, r]))
    const orderedReviews = reviewIdsInOrder
      .map((id) => reviewMap.get(id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined)

    if (orderedReviews.length === 0) {
      return { success: true, reviews: [] }
    }

    // Reassign ranks and recalculate dynamic Beli scores & tiers
    const updatedReviews = orderedReviews.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }))

    // Recalculate dynamic Beli scores based on new rank positions and neighbors
    for (let i = 0; i < updatedReviews.length; i++) {
      const otherScores = updatedReviews
        .filter((_, idx) => idx !== i)
        .map((r) => r.rating)

      const calculatedScore = calculateScoreFromRankPlacement(i + 1, otherScores)
      updatedReviews[i].rating = calculatedScore
      updatedReviews[i].tier = getTierFromScore(calculatedScore).tier
    }

    // Ensure strict monotonicity without score collisions
    for (let i = 1; i < updatedReviews.length; i++) {
      if (updatedReviews[i].rating >= updatedReviews[i - 1].rating) {
        const precedingScores = updatedReviews.slice(0, i).map((r) => r.rating)
        const adjustedScore = calculateScoreFromRankPlacement(i + 1, precedingScores)
        updatedReviews[i].rating = adjustedScore
        updatedReviews[i].tier = getTierFromScore(adjustedScore).tier
      }
    }

    // Wrap all re-ordering updates in a single atomic Prisma transaction
    await prisma.$transaction(async (tx) => {
      for (const item of updatedReviews) {
        await tx.review.update({
          where: { id: item.id },
          data: {
            rank: item.rank,
            rating: item.rating,
            tier: item.tier,
          },
        })

        // Recalculate denormalized album stats for affected albums
        const albumReviews = await tx.review.findMany({
          where: { albumId: item.albumId },
          select: { rating: true },
        })
        const reviewCount = albumReviews.length
        const averageRating =
          reviewCount > 0
            ? Number((albumReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
            : null

        await tx.album.updateMany({
          where: { id: item.albumId },
          data: {
            averageRating,
            reviewCount,
          },
        })
      }
    })

    revalidatePath('/profile')
    revalidatePath('/')
    return { success: true, reviews: updatedReviews }
  } catch (error) {
    console.error('Error reordering reviews in transaction:', error)
    return { success: false, error: 'Failed to reorder ranked list' }
  }
}

export async function deleteReview(reviewId: string, albumId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: 'You must be signed in' }
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    })

    if (!review || review.userId !== session.user.id) {
      return { success: false, error: 'You can only delete your own reviews' }
    }

    // Delete review, re-sequence ranks, and recalculate album stats in a single transaction
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({
        where: { id: reviewId },
      })

      // Re-sequence remaining reviews for user
      const remaining = await tx.review.findMany({
        where: { userId: session.user.id },
        orderBy: { rank: 'asc' },
      })

      for (let i = 0; i < remaining.length; i++) {
        await tx.review.update({
          where: { id: remaining[i].id },
          data: { rank: i + 1 },
        })
      }

      // Recalculate denormalized stats for album
      const albumReviews = await tx.review.findMany({
        where: { albumId },
        select: { rating: true },
      })
      const reviewCount = albumReviews.length
      const averageRating =
        reviewCount > 0
          ? Number((albumReviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount).toFixed(1))
          : null

      await tx.album.updateMany({
        where: { id: albumId },
        data: {
          averageRating,
          reviewCount,
        },
      })
    })

    revalidatePath(`/albums/${albumId}`)
    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error deleting review:', error)
    return { success: false, error: 'Failed to delete review' }
  }
}
