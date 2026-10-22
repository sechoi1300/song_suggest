import './load-env'
import { prisma } from '../src/lib/prisma'

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in .env.local before checking the database')
  await prisma.$queryRaw`SELECT 1`
  const [users, albums, reviews, queued] = await Promise.all([
    prisma.user.count(), prisma.album.count(), prisma.review.count(), prisma.wantToListen.count(),
  ])
  console.log('Database connected; application tables are ready.', { users, albums, reviews, queued })
}

main().catch((error: unknown) => {
  const code = (error as { code?: string }).code
  console.error(`Database check failed${code ? ` (${code})` : ''}. Check DATABASE_URL, project status, and run npm run db:push.`)
  process.exitCode = 1
}).finally(() => prisma.$disconnect())
