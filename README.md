# Song Suggest 🎵 (The Beli for Music Albums)

A modern, high-polish web application for rating, ranking, and discovering albums — modeled directly on the beloved **Beli** restaurant ranking experience, adapted for music enthusiasts and vinyl collectors.

Built with **Next.js 16 (App Router)**, **PostgreSQL (via Prisma ORM & pg driver adapter)**, **NextAuth.js**, and **Tailwind CSS**.

---

## ✨ Core Beli-Inspired Features

### ⚔️ 1. Head-to-Head Pairwise Matchups
- When ranking a new album against your existing catalog, Song Suggest initiates a binary-search battle: *"Which album do you prefer: Album A or Album B?"*
- In 2 to 4 rapid choices, the system pinpoints your exact personal rank (`#1`, `#2`, `#3`...) and dynamically calculates a decimal score (e.g., `9.4 / 10.0`).
- Prefer manual scoring? Toggle decimal sliders (0.0 to 10.0) anytime.

### 🏆 2. Curated Personal Leaderboard
- View your ranked albums sorted cleanly from `#1` down to `#N` with podium badges (🥇 `#1`, 🥈 `#2`, 🥉 `#3`).
- Re-order with one click (Move Up / Down) or delete albums from your leaderboard.
- Filter your personal board by Beli Tiers or by search.

### 🏷️ 3. The 5 Beli Rating Tiers
- **Exceptional ★ (9.0 - 10.0)**: Masterpiece / Holy Grail
- **Great ★ (8.0 - 8.9)**: Must Listen / High Rotation
- **Good ★ (7.0 - 7.9)**: Solid / Worth Returning To
- **Decent ★ (6.0 - 6.9)**: Mixed / A Few Highlights
- **Not For Me ★ (< 6.0)**: Disappointing / Skipped

### 🎼 4. Album Log Details
- **Standout Tracks**: Select up to 4 favorite tracks from the full tracklist.
- **Skip Track**: Mark your least favorite song.
- **Mood & Vibe Tags**: Multi-select tags like *Late Night*, *Summer Drive*, *Deep Focus*, *Melancholy*, *Gym Pump*, *Sunday Vinyl*, etc.
- **Listening Context**: Note whether you listened via Headphones, Car Stereo, Vinyl, Speakers, or Live.
- **Repeat Factor**: *On Repeat 🔁*, *Right Mood 🌙*, or *One & Done 🛑*.

### 🔖 5. "Want to Listen" Queue (Bucket List)
- Bookmark upcoming releases or friend recommendations.
- When you rank an album, it automatically moves from your queue to your personal leaderboard!

### 🌐 6. Free Music Metadata API & Search-First Auto-Complete
- Connected to Apple Music/iTunes free public metadata API (no API key required).
- **Search-First with Auto-Complete**: On the Add Album page, users are greeted with a clean search bar that queries the live API as they type.
- Selecting any suggestion pulls high-resolution artwork, tracklist, duration, release date, and genre automatically into the form for review.
- **"Or, add manually" Option**: Can't find an obscure or unreleased album? Clicking "Or, add manually" reveals the blank manual entry fields to add anything custom.
- In **Discover / Search**, selecting any suggested album automatically loads it so you can immediately rate it, rank it head-to-head, or save it to your queue.

### ✨ 7. AI & Taste Profile Suggestion Engine (`/suggest`)
- Computes affinity matches based on your top-rated albums, favorite genres, and shared artists.
- **Spin the Record (Surprise Me)**: Picks an album suited for your day.
- **Mood / Setting Filter**: Instant suggestions tailored for late night, gym, focus, or chill sessions.
- **Queue Roulette**: Filters suggestions strictly from your saved queue.

### 🔐 8. Instant 1-Click Demo Testing
- Click **"Sign in as Alex Morgan"** or **"Jordan Lee"** to start testing the ranking flow instantly without configuring OAuth credentials.
- Also supports Google OAuth, GitHub OAuth, or custom credentials.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (Turbopack, App Router, React 19)
- **Database**: PostgreSQL with Prisma ORM 7 (`@prisma/adapter-pg` & `pg`)
- **Authentication**: NextAuth.js v4 (JWT session, Credentials Demo, OAuth)
- **Styling**: Tailwind CSS v4 (Sleek dark vinyl aesthetic)
- **Type Safety**: TypeScript 5

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
A ready-to-use `.env` template is provided:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/song_suggest?schema=public"
AUTH_SECRET="beli-music-app-super-secret-key-song-suggest-2025"
NEXTAUTH_URL="http://localhost:3000"
```
*(If PostgreSQL is not running yet, Song Suggest gracefully serves its rich sample catalog of iconic albums so you can explore and test the UI without roadblocks!)*

### 3. Push Database Schema & Seed (When PostgreSQL is connected)
```bash
npx prisma db push
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to test the app!

---

## 📁 Project Architecture

```
src/
├── app/
│   ├── actions/
│   │   ├── albums.ts        # Album catalog, filtering & creation
│   │   ├── reviews.ts       # Beli ranking, head-to-head reordering
│   │   ├── suggest.ts       # Taste profile recommendation engine
│   │   └── wantToListen.ts  # Want to listen bookmark queue
│   ├── albums/
│   │   ├── [id]/page.tsx    # Album detail & Beli rating arena
│   │   └── new/page.tsx     # Add new album with tracklist
│   ├── api/auth/            # NextAuth API route
│   ├── auth/signin/page.tsx # 1-Click Demo & OAuth sign-in
│   ├── profile/page.tsx     # Personal leaderboard, queue & stats
│   ├── suggest/page.tsx     # Suggestion engine & surprise roulette
│   └── page.tsx             # Home discovery feed & tier guide
├── components/
│   ├── AlbumCard.tsx        # Album card with Beli badge
│   ├── AlbumDetail.tsx      # Vinyl record sleeve display
│   ├── AlbumList.tsx        # Search, genre filtering, and sorting
│   ├── CreateAlbumForm.tsx  # Add album with tracklist
│   ├── HeadToHeadRanker.tsx # Binary matchup arena (A vs B)
│   ├── Navbar.tsx           # Navigation with live auth state
│   ├── PersonalLeaderboard.tsx # Ranked list (#1..#N) with reordering
│   ├── ReviewCard.tsx       # Beli review card with track highlights
│   ├── ReviewForm.tsx       # Rating submission with Beli tiers
│   ├── SuggestionStudio.tsx # Discovery studio & vibe wheel
│   ├── UserProfileTabs.tsx  # Tabs for Leaderboard, Queue, and Stats
│   └── WantToListenList.tsx # Bucket list queue
└── lib/
    ├── auth.ts              # NextAuth configuration & demo login
    ├── beli.ts              # Beli ranking algorithm & tier formulas
    ├── prisma.ts            # Prisma client with pg driver adapter
    └── sampleAlbums.ts      # Curated catalog of iconic albums
```

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
