'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function toggleWantToListen(albumId: string, notes?: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return { success: false, error: 'You must be signed in to save albums to your queue' }
    }

    const userId = session.user.id

    const existing = await prisma.wantToListen.findUnique({
      where: {
        userId_albumId: {
          userId,
          albumId,
        },
      },
    })

    if (existing) {
      await prisma.wantToListen.delete({
        where: { id: existing.id },
      })
      revalidatePath(`/albums/${albumId}`)
      revalidatePath('/profile')
      revalidatePath('/queue')
      return { success: true, isBookmarked: false }
    } else {
      await prisma.wantToListen.create({
        data: {
          userId,
          albumId,
          notes: notes || null,
        },
      })
      revalidatePath(`/albums/${albumId}`)
      revalidatePath('/profile')
      revalidatePath('/queue')
      return { success: true, isBookmarked: true }
    }
  } catch (error) {
    console.error('Error toggling want to listen:', error)
    return { success: false, error: 'Failed to update queue' }
  }
}

export async function getUserWantToListen(userId?: string) {
  try {
    let targetUserId = userId
    if (!targetUserId) {
      const session = await getServerSession(authOptions)
      targetUserId = session?.user?.id
    }

    if (!targetUserId) {
      return []
    }

    const bookmarks = await prisma.wantToListen.findMany({
      where: { userId: targetUserId },
      include: {
        album: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return bookmarks
  } catch (error) {
    console.warn('Error fetching want to listen queue:', error)
    return []
  }
}

export async function isAlbumInWantToListen(albumId: string) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return false

    const item = await prisma.wantToListen.findUnique({
      where: {
        userId_albumId: {
          userId: session.user.id,
          albumId,
        },
      },
    })

    return !!item
  } catch {
    return false
  }
}
