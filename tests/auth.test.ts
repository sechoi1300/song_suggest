import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getOAuthProviders } from '../src/lib/oauthProviders'
import { getSignInErrorMessage } from '../src/lib/signInErrors'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getSignInProviderIds } from '../src/lib/signInProviders'

test('name-and-email sign-in uses the configured credentials ID rather than the provider default', () => {
  const credentials = CredentialsProvider({
    id: 'demo-login',
    credentials: { email: { type: 'email' }, name: { type: 'text' } },
    authorize: async () => null,
  })
  const google = getOAuthProviders({ NODE_ENV: 'test', GOOGLE_CLIENT_ID: 'google-id', GOOGLE_CLIENT_SECRET: 'google-secret' })
  assert.deepEqual(getSignInProviderIds([credentials]), ['demo-login'])
  assert.deepEqual(getSignInProviderIds([credentials, ...google]), ['demo-login', 'google'])
  assert.ok(!getSignInProviderIds([credentials]).includes('credentials'))
})

test('unconfigured and partially configured Google sign-in cannot be offered', () => {
  const base = { NODE_ENV: 'test' } as const
  assert.deepEqual(getOAuthProviders(base), [])
  assert.deepEqual(getOAuthProviders({ ...base, GOOGLE_CLIENT_ID: 'google-id' }), [])
  assert.deepEqual(getOAuthProviders({ ...base, GOOGLE_CLIENT_SECRET: 'google-secret' }), [])
  assert.deepEqual(getOAuthProviders({ ...base, GOOGLE_CLIENT_ID: 'google-id', GOOGLE_CLIENT_SECRET: '   ' }), [])
})

test('Google sign-in becomes available once both credentials are complete', () => {
  const google = { NODE_ENV: 'test', GOOGLE_CLIENT_ID: 'google-id', GOOGLE_CLIENT_SECRET: 'google-secret' } as const
  assert.deepEqual(getOAuthProviders(google).map((provider) => provider.id), ['google'])
})

test('sign-in failures show recovery instructions without reflecting provider details', () => {
  assert.match(getSignInErrorMessage('OAuthAccountNotLinked'), /originally used/)
  assert.match(getSignInErrorMessage('AccessDenied'), /cancelled|denied/)
  assert.match(getSignInErrorMessage('Configuration'), /temporarily unavailable/)
  assert.match(getSignInErrorMessage('CredentialsSignin'), /those details/)
  const unknown = 'invalid_secret=DO_NOT_SHOW_THIS_TO_USERS'
  assert.equal(getSignInErrorMessage(unknown), getSignInErrorMessage('OAuthSignin'))
  assert.doesNotMatch(getSignInErrorMessage(unknown), /DO_NOT_SHOW/)
})
