import { PrismaClient } from '@prisma/client'
import { SAMPLE_ALBUMS } from '../src/lib/sampleAlbums'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding albums...')

  for (const album of SAMPLE_ALBUMS) {
    await prisma.album.upsert({
      where: { id: album.id },
      update: {
        title: album.title,
        artist: album.artist,
        releaseDate: album.releaseDate,
        releaseYear: album.releaseYear,
        length: album.length,
        numSongs: album.numSongs,
        genres: album.genres,
        coverImageUrl: album.coverImageUrl,
        tracklist: album.tracklist,
      },
      create: {
        id: album.id,
        title: album.title,
        artist: album.artist,
        releaseDate: album.releaseDate,
        releaseYear: album.releaseYear,
        length: album.length,
        numSongs: album.numSongs,
        genres: album.genres,
        coverImageUrl: album.coverImageUrl,
        tracklist: album.tracklist,
      },
    })
  }

  console.log(`Seeded ${SAMPLE_ALBUMS.length} albums successfully!`)
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
