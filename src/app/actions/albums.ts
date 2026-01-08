'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getAlbums() {
  try {
    const albums = await prisma.album.findMany({
      include: {
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return albums.map((album) => {
      const ratings = album.reviews.map((r) => r.rating)
      const averageRating =
        ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : undefined

      return {
        ...album,
        averageRating,
        reviewCount: album.reviews.length,
      }
    })
  } catch (error) {
    console.error('Error fetching albums:', error)
    return []
  }
}

export async function getAlbumById(id: string) {
  try {
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        reviews: {
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
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    })

    if (!album) {
      return null
    }

    const ratings = album.reviews.map((r) => r.rating)
    const averageRating =
      ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : undefined

    return {
      ...album,
      averageRating,
      reviewCount: album.reviews.length,
    }
  } catch (error) {
    console.error('Error fetching album:', error)
    return null
  }
}

export async function createAlbum(formData: FormData) {
  try {
    const title = formData.get('title') as string
    const artistInput = formData.get('artist') as string
    const releaseDate = formData.get('releaseDate') as string
    const length = formData.get('length') as string
    const numSongs = formData.get('numSongs') as string
    const genresInput = formData.get('genres') as string
    const coverImageUrl = formData.get('coverImageUrl') as string

    const artist = artistInput
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0)
    const genres = genresInput
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0)

    const album = await prisma.album.create({
      data: {
        title,
        artist,
        releaseDate: new Date(releaseDate),
        length: length || null,
        numSongs: numSongs ? parseInt(numSongs) : null,
        genres,
        coverImageUrl: coverImageUrl || null,
      },
    })

    revalidatePath('/')
    return { success: true, album }
  } catch (error) {
    console.error('Error creating album:', error)
    return { success: false, error: 'Failed to create album' }
  }
}
