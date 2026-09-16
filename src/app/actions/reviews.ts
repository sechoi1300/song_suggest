'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTierFromScore } from '@/lib/beli'

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
    const {
      albumId,
      score,
      targetRank,
      favoriteTracks = [],
      skipTrack,
      vibes = [],
      listenAgain,
      listenedWith,
      reviewText,
    } = input

    const tierInfo = getTierFromScore(score)

    // Check existing review
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_albumId: {
          userId,
          albumId,
        },
      },
    })

    // Fetch user's other reviews to assign or adjust ranks
    const otherReviews = await prisma.review.findMany({
      where: {
        userId,
        albumId: { not: albumId },
      },
      orderBy: {
        rank: 'asc',
      },
    })

    let assignedRank = targetRank
    if (!assignedRank) {
      // If no explicit targetRank provided, place it where its score naturally falls
      const insertIdx = otherReviews.findIndex((r) => score > r.rating)
      assignedRank = insertIdx === -1 ? otherReviews.length + 1 : insertIdx + 1
    }

    let review
    if (existingReview) {
      review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating: score,
          rank: assignedRank,
          tier: tierInfo.tier,
          favoriteTracks,
          skipTrack: skipTrack || null,
          vibes,
          listenAgain: listenAgain || null,
          listenedWith: listenedWith || null,
          reviewText: reviewText || null,
        },
      })
    } else {
      review = await prisma.review.create({
        data: {
          userId,
          albumId,
          rating: score,
          rank: assignedRank,
          tier: tierInfo.tier,
          favoriteTracks,
          skipTrack: skipTrack || null,
          vibes,
          listenAgain: listenAgain || null,
          listenedWith: listenedWith || null,
          reviewText: reviewText || null,
        },
      })
    }

    // Auto-remove from Want to Listen queue now that it's reviewed/ranked
    try {
      await prisma.wantToListen.deleteMany({
        where: {
          userId,
          albumId,
        },
      })
    } catch {}

    // Resequence all ranks to ensure clean 1, 2, 3 sequence without gaps
    const allUserReviews = await prisma.review.findMany({
      where: { userId },
      orderBy: [
        { rank: 'asc' },
        { rating: 'desc' },
      ],
    })

    // Update ranks sequentially
    for (let i = 0; i < allUserReviews.length; i++) {
      const current = allUserReviews[i]
      const newRank = i + 1
      if (current.rank !== newRank) {
        await prisma.review.update({
          where: { id: current.id },
          data: { rank: newRank },
        })
      }
    }

    revalidatePath(`/albums/${albumId}`)
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

    for (let i = 0; i < reviewIdsInOrder.length; i++) {
      const reviewId = reviewIdsInOrder[i]
      await prisma.review.updateMany({
        where: { id: reviewId, userId },
        data: { rank: i + 1 },
      })
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error reordering reviews:', error)
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

    await prisma.review.delete({
      where: { id: reviewId },
    })

    // Re-sequence remaining reviews
    const remaining = await prisma.review.findMany({
      where: { userId: session.user.id },
      orderBy: { rank: 'asc' },
    })

    for (let i = 0; i < remaining.length; i++) {
      await prisma.review.update({
        where: { id: remaining[i].id },
        data: { rank: i + 1 },
      })
    }

    revalidatePath(`/albums/${albumId}`)
    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error deleting review:', error)
    return { success: false, error: 'Failed to delete review' }
  }
}
