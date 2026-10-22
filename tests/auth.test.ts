import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getOAuthProviders } from '../src/lib/oauthProviders'
import { getSignInErrorMessage } from '../src/lib/signInErrors'

test('unconfigured and partially configured OAuth providers cannot be offered for sign-in', () => {
  const base = { NODE_ENV: 'test' } as const
  assert.deepEqual(getOAuthProviders(base), [])
  assert.deepEqual(getOAuthProviders({ ...base, GOOGLE_CLIENT_ID: 'google-id' }), [])
  assert.deepEqual(getOAuthProviders({ ...base, GOOGLE_CLIENT_SECRET: 'google-secret' }), [])
  assert.deepEqual(getOAuthProviders({ ...base, GITHUB_ID: 'github-id' }), [])
  assert.deepEqual(getOAuthProviders({ ...base, GITHUB_SECRET: 'github-secret' }), [])
  assert.deepEqual(getOAuthProviders({ ...base, GOOGLE_CLIENT_ID: 'google-id', GOOGLE_CLIENT_SECRET: '   ' }), [])
})

test('each provider becomes available independently once its credentials are complete', () => {
  const google = { NODE_ENV: 'test', GOOGLE_CLIENT_ID: 'google-id', GOOGLE_CLIENT_SECRET: 'google-secret' } as const
  const github = { NODE_ENV: 'test', GITHUB_ID: 'github-id', GITHUB_SECRET: 'github-secret' } as const
  assert.deepEqual(getOAuthProviders(google).map((provider) => provider.id), ['google'])
  assert.deepEqual(getOAuthProviders(github).map((provider) => provider.id), ['github'])
  assert.deepEqual(getOAuthProviders({ ...google, ...github }).map((provider) => provider.id), ['google', 'github'])
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
