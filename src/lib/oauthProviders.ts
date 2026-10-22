import GoogleProvider from 'next-auth/providers/google'
import GitHubProvider from 'next-auth/providers/github'

export function getOAuthProviders(env: NodeJS.ProcessEnv) {
  const googleId = env.GOOGLE_CLIENT_ID?.trim()
  const googleSecret = env.GOOGLE_CLIENT_SECRET?.trim()
  const githubId = env.GITHUB_ID?.trim()
  const githubSecret = env.GITHUB_SECRET?.trim()
  return [
    ...(googleId && googleSecret ? [GoogleProvider({ clientId: googleId, clientSecret: googleSecret })] : []),
    ...(githubId && githubSecret ? [GitHubProvider({ clientId: githubId, clientSecret: githubSecret })] : []),
  ]
}
