import '../scripts/load-env'
import { prisma } from '../src/lib/prisma'
import { getTopAlbumsChart, getAlbumDetailsFromMusicApi } from '../src/lib/musicApi'

async function main() {
  console.log('Syncing Apple US Top 10 Albums...')
  const chart = await getTopAlbumsChart()
  if (chart.isStale || chart.albums.length !== 10) {
    throw new Error('Could not retrieve a fresh top ten chart; no albums were seeded')
  }

  for (const entry of chart.albums) {
    const album = await getAlbumDetailsFromMusicApi(entry.collectionId)
    if (!album) throw new Error(`Could not retrieve details for ${entry.title}`)
    await prisma.album.upsert({
      where: { id: album.id },
      update: {
        title: album.title,
        artist: album.artist,
        releaseDate: new Date(album.releaseDate),
        releaseYear: album.releaseYear,
        length: album.length,
        numSongs: album.numSongs,
        genres: album.genres,
        coverImageUrl: album.coverImageUrl,
        tracklist: album.tracklist || [],
      },
      create: {
        id: album.id,
        title: album.title,
        artist: album.artist,
        releaseDate: new Date(album.releaseDate),
        releaseYear: album.releaseYear,
        length: album.length,
        numSongs: album.numSongs,
        genres: album.genres,
        coverImageUrl: album.coverImageUrl,
        tracklist: album.tracklist || [],
      },
    })
  }

  console.log(`Synced ${chart.albums.length} chart albums. Existing ratings and reviews were preserved.`)
}

main()
  .catch((e) => {
    console.error('Seeding error:', e)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
