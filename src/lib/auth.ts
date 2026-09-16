import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'beli-music-app-super-secret-key-song-suggest-2025',
  providers: [
    CredentialsProvider({
      id: 'demo-login',
      name: 'Demo Account',
      credentials: {
        email: { label: 'Email', type: 'email' },
        name: { label: 'Name', type: 'text' },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() || 'alex@songsuggest.app'
        const name = credentials?.name?.trim() || 'Alex Morgan'

        try {
          const user = await prisma.user.upsert({
            where: { email },
            update: { name },
            create: {
              email,
              name,
              image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
            },
          })
          return user
        } catch (error) {
          console.error('Error during demo sign-in in DB:', error)
          // Fallback mock user if DB is not reachable yet
          return {
            id: 'demo-user-id',
            email,
            name,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
          }
        }
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
          }),
        ]
      : []),
    ...(process.env.GITHUB_ID
      ? [
          GitHubProvider({
            clientId: process.env.GITHUB_ID,
            clientSecret: process.env.GITHUB_SECRET || '',
          }),
        ]
      : []),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || 'demo-user-id'
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      if ((account?.provider === 'google' || account?.provider === 'github') && user.email) {
        try {
          await prisma.user.upsert({
            where: { email: user.email },
            update: {
              name: user.name,
              image: user.image,
            },
            create: {
              email: user.email,
              name: user.name,
              image: user.image,
            },
          })
        } catch (e) {
          console.error('Error syncing OAuth user to DB:', e)
        }
      }
    },
  },
}
