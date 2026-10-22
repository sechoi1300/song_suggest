import GoogleProvider from 'next-auth/providers/google'

export function getOAuthProviders(env: NodeJS.ProcessEnv) {
  const googleId = env.GOOGLE_CLIENT_ID?.trim()
  const googleSecret = env.GOOGLE_CLIENT_SECRET?.trim()
  return googleId && googleSecret
    ? [GoogleProvider({ clientId: googleId, clientSecret: googleSecret })]
    : []
}
