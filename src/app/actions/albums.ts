'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SAMPLE_ALBUMS } from '@/lib/sampleAlbums'

export interface AlbumFilterOptions {
  search?: string
  genre?: string
  sort?: 'rating' | 'newest' | 'reviews' | 'title'
}

export async function getAlbums(options?: AlbumFilterOptions) {
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

    if (albums.length === 0) {
      // Fallback to sample catalog if database has not been seeded yet
      return applyFiltersToAlbums(SAMPLE_ALBUMS, options)
    }

    const formatted = albums.map((album) => {
      const ratings = album.reviews.map((r) => r.rating)
      const averageRating =
        ratings.length > 0
          ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1))
          : undefined

      return {
        ...album,
        averageRating,
        reviewCount: album.reviews.length,
      }
    })

    return applyFiltersToAlbums(formatted, options)
  } catch (error) {
    console.warn('Database offline or unreachable, serving sample catalog:', error)
    return applyFiltersToAlbums(SAMPLE_ALBUMS, options)
  }
}

function applyFiltersToAlbums<T extends { title: string; artist: string[]; genres: string[]; averageRating?: number; releaseDate: Date; reviewCount?: number }>(
  albums: T[],
  options?: AlbumFilterOptions
): T[] {
  let result = [...albums]

  if (options?.search) {
    const q = options.search.toLowerCase()
    result = result.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.artist.some((art) => art.toLowerCase().includes(q)) ||
        a.genres.some((g) => g.toLowerCase().includes(q))
    )
  }

  if (options?.genre && options.genre !== 'ALL') {
    result = result.filter((a) =>
      a.genres.some((g) => g.toLowerCase() === options.genre?.toLowerCase())
    )
  }

  if (options?.sort) {
    switch (options.sort) {
      case 'rating':
        result.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0))
        break
      case 'newest':
        result.sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
        break
      case 'reviews':
        result.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
        break
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title))
        break
    }
  }

  return result
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

    if (album) {
      const ratings = album.reviews.map((r) => r.rating)
      const averageRating =
        ratings.length > 0
          ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1))
          : undefined

      return {
        ...album,
        averageRating,
        reviewCount: album.reviews.length,
      }
    }
  } catch (error) {
    console.warn('Prisma getAlbumById failed, searching fallback catalog:', error)
  }

  // Fallback to sample catalog
  const sample = SAMPLE_ALBUMS.find((a) => a.id === id)
  if (!sample) return null

  return {
    ...sample,
    createdAt: new Date(),
    updatedAt: new Date(),
    spotifyUrl: null,
    releaseYear: sample.releaseYear ?? null,
    reviews: [],
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
    const tracklistInput = formData.get('tracklist') as string

    const artist = artistInput
      .split(',')
      .map((a) => a.trim())
      .filter((a) => a.length > 0)
    const genres = genresInput
      .split(',')
      .map((g) => g.trim())
      .filter((g) => g.length > 0)
    const tracklist = tracklistInput
      ? tracklistInput
          .split('\n')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : []

    const relDate = new Date(releaseDate)
    const album = await prisma.album.create({
      data: {
        title,
        artist,
        releaseDate: relDate,
        releaseYear: relDate.getFullYear(),
        length: length || null,
        numSongs: numSongs ? parseInt(numSongs) : (tracklist.length || null),
        genres,
        coverImageUrl: coverImageUrl || null,
        tracklist,
      },
    })

    revalidatePath('/')
    return { success: true, album }
  } catch (error) {
    console.error('Error creating album:', error)
    return { success: false, error: 'Failed to create album' }
  }
}
