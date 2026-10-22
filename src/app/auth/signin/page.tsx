import SignInForm from '@/components/SignInForm'
import { authOptions } from '@/lib/auth'
import { getSignInProviderIds } from '@/lib/signInProviders'

export const dynamic = 'force-dynamic'

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const { error } = await searchParams
  return (
    <SignInForm
      availableProviders={getSignInProviderIds(authOptions.providers)}
      initialError={typeof error === 'string' ? error : undefined}
    />
  )
}
