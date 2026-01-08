# Song Suggest

A modern web application for discovering, rating, and reviewing music albums. Built with Next.js, Postgres, and NextAuth.js.

## Features

- 🎵 **Album Discovery**: Browse a collection of music albums
- ⭐ **Rating System**: Rate albums on a 0-10 scale
- 📝 **Reviews**: Write detailed text reviews for albums
- 👤 **User Profiles**: View your review history
- 🔐 **Authentication**: Sign in with Email, Google, or GitHub
- 📊 **Average Ratings**: See aggregated ratings for each album

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: PostgreSQL (via Prisma ORM)
- **Authentication**: NextAuth.js v4
- **Styling**: Tailwind CSS
- **Language**: TypeScript

## Project Structure

```
src/
├── app/
│   ├── actions/          # Server actions for data operations
│   │   ├── albums.ts     # Album CRUD operations
│   │   └── reviews.ts    # Review operations
│   ├── albums/
│   │   ├── [id]/         # Album detail page
│   │   └── new/          # Create album page
│   ├── api/
│   │   └── auth/         # NextAuth API routes
│   ├── auth/
│   │   └── signin/       # Sign in page
│   ├── profile/          # User profile page
│   └── page.tsx          # Home page (album list)
├── components/           # React components
│   ├── AlbumCard.tsx
│   ├── AlbumDetail.tsx
│   ├── AlbumList.tsx
│   ├── CreateAlbumForm.tsx
│   ├── Navbar.tsx
│   ├── ReviewCard.tsx
│   ├── ReviewForm.tsx
│   ├── ReviewList.tsx
│   └── SessionProvider.tsx
└── lib/
    ├── auth.ts           # NextAuth configuration
    └── prisma.ts         # Prisma client instance
```

## Getting Started

See [SETUP.md](./SETUP.md) for detailed setup instructions.

### Quick Start

1. Install dependencies: `npm install`
2. Set up `.env` file with your database URL and auth secrets
3. Generate Prisma client: `npx prisma generate`
4. Push database schema: `npx prisma db push`
5. Run dev server: `npm run dev`

## Database Schema

- **User**: User accounts and profiles
- **Album**: Music albums with metadata
- **Review**: User reviews with ratings (0-10) and text
- **Account**: OAuth account linking
- **Session**: User sessions

## Environment Variables

Required:
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Secret for NextAuth (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL`: Your app URL (e.g., `http://localhost:3000`)

Optional (for OAuth):
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `GITHUB_ID` / `GITHUB_SECRET`
- Email provider settings

## Next Steps

- [ ] Add search functionality
- [ ] Add filtering by genre
- [ ] Add sorting options (rating, date, popularity)
- [ ] Improve UI/UX with better styling
- [ ] Add album cover image upload
- [ ] Add social features (follow users, like reviews)

## License

MIT
