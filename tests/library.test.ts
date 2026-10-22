import assert from 'node:assert/strict'
import { test, type TestContext } from 'node:test'
import type { Prisma, Review } from '@prisma/client'
import { prisma } from '../src/lib/prisma'
import { saveBeliReview, reorderUserRankedReviews, deleteReview } from '../src/app/actions/reviews'
import { removeWantToListen } from '../src/app/actions/wantToListen'

// Mock the backing CommonJS modules: next-auth exposes a readonly re-export.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const auth = require('next-auth/next') as typeof import('next-auth/next')
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cache = require('next/cache') as typeof import('next/cache')

function review(id: string, rank: number, rating: number, userId = 'user'): Review {
  return {
    id, userId, albumId: `album-${id}`, rank, rating, tier: 'GREAT',
    favoriteTracks: [], skipTrack: null, vibes: [], listenAgain: null,
    listenedWith: null, reviewText: null, createdAt: new Date(), updatedAt: new Date(),
  }
}

function mockLibrary(t: TestContext, initialReviews: Review[] = []) {
  const rows = initialReviews.map((row) => ({ ...row }))
  const albumStats = new Map<string, { averageRating: number | null; reviewCount: number }>()
  const queued = new Set(['album-new'])
  t.mock.method(auth, 'getServerSession', async () => ({ user: { id: 'user' }, expires: '' }))
  const invalidation = t.mock.method(cache, 'revalidatePath', () => {})

  const findMany = async ({ where, orderBy }: Prisma.ReviewFindManyArgs = {}) => {
    let found = rows.filter((row) => {
      if (typeof where?.userId === 'string' && row.userId !== where.userId) return false
      if (typeof where?.albumId === 'string' && row.albumId !== where.albumId) return false
      if (typeof where?.albumId === 'object' && row.albumId === where.albumId.not) return false
      return true
    })
    if (orderBy) found = [...found].sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || b.rating - a.rating)
    return found.map((row) => ({ ...row }))
  }
  const update = async ({ where, data }: { where: { id: string }; data: Partial<Review> }) => {
    const row = rows.find((row) => row.id === where.id)
    assert.ok(row, 'updates must reference an existing review')
    Object.assign(row, data)
    return { ...row }
  }
  const delegates = {
    review: {
      findMany,
      findUnique: async ({ where }: Prisma.ReviewFindUniqueArgs) => {
        const row = rows.find((row) => where.id ? row.id === where.id : (
          row.userId === where.userId_albumId?.userId && row.albumId === where.userId_albumId?.albumId
        ))
        return row ? { ...row } : null
      },
      update,
      create: async ({ data }: { data: Partial<Review> }) => {
        const row = { ...review('new', 1, 8.5), ...data }
        rows.push(row)
        return { ...row }
      },
      delete: async ({ where }: { where: { id: string } }) => {
        const index = rows.findIndex((row) => row.id === where.id)
        assert.notEqual(index, -1)
        return rows.splice(index, 1)[0]
      },
    },
    album: {
      updateMany: async ({ where, data }: { where: { id: string }; data: { averageRating: number | null; reviewCount: number } }) => {
        albumStats.set(where.id, data)
        return { count: 1 }
      },
    },
    wantToListen: {
      deleteMany: t.mock.fn(async ({ where }: { where: { userId: string; albumId: string } }) => {
        assert.equal(where.userId, 'user')
        return { count: queued.delete(where.albumId) ? 1 : 0 }
      }),
    },
  }

  // Prisma delegates are proxies, so save and restore their methods explicitly.
  for (const [name, methods] of Object.entries(delegates)) {
    const delegate = prisma[name as keyof typeof delegates]
    const original = Object.fromEntries(Object.keys(methods).map((key) => [key, Reflect.get(delegate, key)]))
    Object.assign(delegate, methods)
    t.after(() => { Object.assign(delegate, original) })
  }
  const originalTransaction = prisma.$transaction
  const transaction = t.mock.fn(async (run: (tx: typeof prisma) => Promise<unknown>) => run(prisma))
  Object.assign(prisma, { $transaction: transaction })
  t.after(() => { Object.assign(prisma, { $transaction: originalTransaction }) })

  const rankedIds = () => rows.filter((row) => row.userId === 'user').sort((a, b) => a.rank! - b.rank!).map((row) => row.id)
  return { rows, albumStats, queued, invalidation, transaction, rankedIds, delegates }
}

test('saving an explicit comparison rank shifts the album already at that rank', async (t) => {
  const db = mockLibrary(t, [review('a', 1, 9), review('b', 2, 8)])
  const result = await saveBeliReview({ albumId: 'album-new', score: 9, targetRank: 1 })
  assert.equal(result.success, true)
  assert.deepEqual(db.rankedIds(), ['new', 'a', 'b'])
  assert.equal(result.review?.rank, 1)
  assert.equal(db.queued.size, 0)
})

test('moving an existing review down closes its old rank before insertion', async (t) => {
  const db = mockLibrary(t, [review('a', 1, 9), review('b', 2, 8), review('c', 3, 7)])
  const result = await saveBeliReview({ albumId: 'album-a', score: 6, targetRank: 3 })
  assert.equal(result.success, true)
  assert.deepEqual(db.rankedIds(), ['b', 'c', 'a'])
  assert.deepEqual(db.rows.map((row) => row.rank).sort(), [1, 2, 3])
})

test('stale comparison ranks clamp to the actual list and return the saved rank', async (t) => {
  const db = mockLibrary(t, [review('a', 1, 9)])
  const result = await saveBeliReview({ albumId: 'album-new', score: 8, targetRank: 20 })
  assert.equal(result.success, true)
  assert.equal(result.review?.rank, 2)
  assert.deepEqual(db.rankedIds(), ['a', 'new'])
})

for (const [name, ids] of [
  ['incomplete', ['b']], ['duplicate', ['a', 'a']], ['unknown', ['a', 'foreign']],
] as const) {
  test(`${name} reorder requests cannot corrupt the user's ranks`, async (t) => {
    const db = mockLibrary(t, [review('a', 1, 9), review('b', 2, 8), review('foreign', 1, 10, 'someone-else')])
    const result = await reorderUserRankedReviews([...ids])
    assert.equal(result.success, false)
    assert.equal(db.transaction.mock.callCount(), 0)
    assert.deepEqual(db.rankedIds(), ['a', 'b'])
    assert.equal(db.invalidation.mock.callCount(), 0)
  })
}

test('a complete reorder updates ranks and album statistics', async (t) => {
  const db = mockLibrary(t, [review('a', 1, 9), review('b', 2, 8)])
  const result = await reorderUserRankedReviews(['b', 'a'])
  assert.equal(result.success, true)
  assert.deepEqual(db.rankedIds(), ['b', 'a'])
  for (const row of db.rows) assert.deepEqual(db.albumStats.get(row.albumId), { averageRating: Number(row.rating.toFixed(1)), reviewCount: 1 })
})

test('deleting a review derives its album from storage and refreshes homepage statistics', async (t) => {
  const db = mockLibrary(t, [review('a', 1, 9), review('b', 2, 8), { ...review('other', 1, 7, 'other-user'), albumId: 'album-a' }])
  const result = await deleteReview('a')
  assert.equal(result.success, true)
  assert.deepEqual(db.albumStats.get('album-a'), { averageRating: 7, reviewCount: 1 })
  assert.deepEqual(db.rankedIds(), ['b'])
  assert.equal(db.rows.find((row) => row.id === 'b')?.rank, 1)
  assert.ok(db.invalidation.mock.calls.some((call) => call.arguments[0] === '/'))
})

test('removing an already removed queue item is harmless', async (t) => {
  const db = mockLibrary(t)
  assert.equal((await removeWantToListen('album-new')).success, true)
  assert.equal((await removeWantToListen('album-new')).success, true)
  assert.equal(db.queued.size, 0)
  assert.equal(db.delegates.wantToListen.deleteMany.mock.callCount(), 2)
})

test('signed-out mutations and deleting another user’s review do not write data', async (t) => {
  const db = mockLibrary(t, [review('foreign', 1, 9, 'someone-else')])
  assert.equal((await deleteReview('foreign')).success, false)
  t.mock.method(auth, 'getServerSession', async () => null)
  assert.equal((await deleteReview('foreign')).success, false)
  assert.equal((await saveBeliReview({ albumId: 'album-new', score: 8 })).success, false)
  assert.equal((await reorderUserRankedReviews([])).success, false)
  assert.equal((await removeWantToListen('album-new')).success, false)
  assert.equal(db.transaction.mock.callCount(), 0)
  assert.equal(db.delegates.wantToListen.deleteMany.mock.callCount(), 0)
})
