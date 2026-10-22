# Song Suggest

Discover albums, compare them head to head, and build a personal ranked leaderboard.

Built with Next.js 16, React 19, Tailwind CSS 4, NextAuth 4, and PostgreSQL through
Prisma 7's `pg` adapter.

## Features

- Apple US Top 10 Albums with chart ranks, source attribution, and hourly refresh on demand.
- Album search and import through the public iTunes metadata API.
- Track previews with playback progress and visible error messages.
- Personal scores, head-to-head ranking, favorite tracks, and review notes.
- A saved listening queue, taste-based suggestions, and profile statistics.
- Development demo sign-in and optional Google/GitHub OAuth.

The chart is based on iTunes sales. Community scores come from this app's reviews.
Music preview availability depends on Apple's catalog.

## Getting started

Use Node.js 24 LTS. Follow [SETUP.md](SETUP.md) for the Supabase PostgreSQL walkthrough,
environment values, database commands, and troubleshooting.

```powershell
npm install
# Configure .env.local using .env.example and SETUP.md first.
npm run db:generate
npm run db:push
npm run db:check
npm run db:seed
npm run dev
```

Open [localhost:3000](http://localhost:3000). The chart and previews can be explored
without a database; saving ratings, profiles, or queue entries requires PostgreSQL.

## Project layout

| Path | Responsibility |
| --- | --- |
| `src/app/actions/` | Albums, reviews, queue, and suggestions |
| `src/app/api/music/` | Autocomplete, album details, and audio proxy |
| `src/components/` | Album cards, player, ranking, forms, and profiles |
| `src/lib/musicApi.ts` | iTunes search, lookup, and chart refresh |
| `src/lib/trendingAlbums.ts` | Chart parsing and ranks |
| `src/lib/audioProxy.ts` | Validated Apple preview streaming |
| `src/lib/prisma.ts` | PostgreSQL client and connection pool |
| `prisma/schema.prisma` | App tables and relationships |
| `prisma/seed.ts` | Repeatable import of the current top ten |

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run test:music` | Chart and audio proxy regression checks |
| `npm run db:check` | Read-only connection and table check |
| `npm run db:seed` | Sync current chart albums into PostgreSQL |
| `npm run db:studio` | Browse database rows locally |

## License

MIT
