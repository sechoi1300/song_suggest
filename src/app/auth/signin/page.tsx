import SignInForm from '@/components/SignInForm'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function SignInPage({ searchParams }: {
  searchParams: Promise<{ error?: string | string[] }>
}) {
  const { error } = await searchParams
  return (
    <SignInForm
      availableProviders={authOptions.providers.map((provider) => provider.id)}
      initialError={typeof error === 'string' ? error : undefined}
    />
  )
}
