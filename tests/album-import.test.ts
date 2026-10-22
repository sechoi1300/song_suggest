import assert from 'node:assert/strict'
import { test } from 'node:test'
import { prisma } from '../src/lib/prisma'
import { getAlbumById, importOrGetAlbumFromApi } from '../src/app/actions/albums'
import { SAMPLE_ALBUMS } from '../src/lib/sampleAlbums'

test('render-time album import returns the persisted album without invalidating the page cache', async (t) => {
  const persisted = {
    id: 'itunes-123456', title: 'Test album', artist: ['Test artist'],
    releaseDate: new Date('2026-01-01'), releaseYear: 2026,
    length: '3:00', numSongs: 1, genres: ['Rock'], coverImageUrl: '',
    tracklist: ['Test track'], averageRating: null, reviewCount: 0, spotifyUrl: null,
    createdAt: new Date('2026-01-02'), updatedAt: new Date('2026-01-02'),
  }
  const album = prisma.album
  const findUnique = album.findUnique
  const createAlbum = album.create
  const find = t.mock.fn(async () => null)
  const create = t.mock.fn(async () => persisted)
  // Prisma delegates expose methods through a Proxy rather than descriptors.
  Object.assign(album, { findUnique: find, create })
  t.after(() => { Object.assign(album, { findUnique, create: createAlbum }) })
  assert.equal(prisma.album.findUnique, find)
  assert.equal(prisma.album.create, create)
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ results: [
    { wrapperType: 'collection', collectionName: 'Test album', artistName: 'Test artist', releaseDate: '2026-01-01', trackCount: 1 },
    { wrapperType: 'track', trackName: 'Test track', trackTimeMillis: 180000, previewUrl: 'https://audio-ssl.itunes.apple.com/preview.m4a' },
  ] }), { headers: { 'Content-Type': 'application/json' } }))
  const warn = t.mock.method(console, 'warn', () => {})

  // Next's revalidatePath throws without a request context. This import must not
  // call it: the same function runs while an album page is rendering.
  const result = await importOrGetAlbumFromApi('itunes-123456')
  assert.equal(create.mock.callCount(), 1)
  assert.equal(result.success, true)
  assert.equal(result.album?.createdAt, persisted.createdAt)
  assert.equal(result.album?.id, persisted.id)
  assert.equal(warn.mock.callCount(), 0)
})

for (const rating of [null, 8.2]) {
  test(`album details use stored ratings (${rating}) instead of sample community scores`, async (t) => {
    const sample = SAMPLE_ALBUMS[0]
    const persisted = { ...sample, averageRating: rating, reviewCount: rating === null ? 0 : 1 }
    const album = prisma.album
    const original = { findUnique: album.findUnique, create: album.create }
    let reads = 0
    Object.assign(album, {
      findUnique: async () => ++reads === 1 ? null : persisted,
    })
    t.after(() => { Object.assign(album, original) })
    const result = await getAlbumById(sample.id)
    assert.equal(result?.averageRating, rating ?? undefined)
    assert.equal(result?.reviewCount, persisted.reviewCount)
  })
}

test('offline album details do not report fabricated sample reviews', async (t) => {
  const album = prisma.album
  const original = { findUnique: album.findUnique, create: album.create }
  Object.assign(album, {
    findUnique: async () => { throw new Error('Database unavailable') },
    create: async () => { throw new Error('Database unavailable') },
  })
  t.after(() => { Object.assign(album, original) })
  t.mock.method(console, 'warn', () => {})
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }))
  const result = await getAlbumById(SAMPLE_ALBUMS[0].id)
  assert.equal(result?.averageRating, undefined)
  assert.equal(result?.reviewCount, 0)
})
