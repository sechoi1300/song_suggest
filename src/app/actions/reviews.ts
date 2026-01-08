'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function createReview(albumId: string, rating: number, reviewText?: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: 'You must be signed in to create a review' }
    }

    // Check if user already has a review for this album
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_albumId: {
          userId: session.user.id,
          albumId,
        },
      },
    })

    if (existingReview) {
      // Update existing review
      const review = await prisma.review.update({
        where: { id: existingReview.id },
        data: {
          rating,
          reviewText: reviewText || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      })

      revalidatePath(`/albums/${albumId}`)
      return { success: true, review }
    } else {
      // Create new review
      const review = await prisma.review.create({
        data: {
          userId: session.user.id,
          albumId,
          rating,
          reviewText: reviewText || null,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
              email: true,
            },
          },
        },
      })

      revalidatePath(`/albums/${albumId}`)
      return { success: true, review }
    }
  } catch (error) {
    console.error('Error creating review:', error)
    return { success: false, error: 'Failed to create review' }
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

    revalidatePath(`/albums/${albumId}`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting review:', error)
    return { success: false, error: 'Failed to delete review' }
  }
}
