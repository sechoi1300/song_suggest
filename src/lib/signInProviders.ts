import type { NextAuthOptions } from 'next-auth'

export function getSignInProviderIds(providers: NextAuthOptions['providers']): string[] {
  // NextAuth applies user options over provider defaults when registering routes.
  return providers.map((provider) => provider.options?.id ?? provider.id)
}
