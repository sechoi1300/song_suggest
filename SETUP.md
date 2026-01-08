# Setup Instructions

## Prerequisites
- Node.js installed
- PostgreSQL database (Supabase, Neon, or local)
- DATABASE_URL configured in `.env` file

## Installation Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL="your-postgres-connection-string"

# NextAuth
AUTH_SECRET="generate-a-random-secret-here"  # Run: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional but recommended)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_ID="your-github-client-id"
GITHUB_SECRET="your-github-client-secret"

# Email Provider (optional)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@yourapp.com"
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Push Database Schema
```bash
npx prisma db push
```

This will create all the tables in your database.

### 5. Run Development Server
```bash
npm run dev
```

Visit http://localhost:3000

## Setting Up OAuth Providers

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env`

### GitHub OAuth
1. Go to GitHub Settings > Developer settings > OAuth Apps
2. Create a new OAuth App
3. Set Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and Client Secret to `.env`

## Features

- ✅ Album listing with average ratings
- ✅ Album detail pages
- ✅ Create new albums
- ✅ Rate albums (0-10 scale)
- ✅ Write text reviews
- ✅ User authentication (Email, Google, GitHub)
- ✅ User profiles with review history
- ✅ Delete your own reviews

## Next Steps

- Add search functionality
- Add filtering by genre
- Add sorting options
- Improve UI/UX
- Add album cover image upload
- Add social features (follow users, like reviews)
