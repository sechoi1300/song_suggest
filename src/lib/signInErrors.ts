export function getSignInErrorMessage(error: string): string {
  switch (error) {
    case 'OAuthAccountNotLinked':
      return 'This email is already associated with another sign-in method. Please use the method you originally used.'
    case 'AccessDenied':
      return 'Sign-in was cancelled or access was denied. Please try again.'
    case 'CredentialsSignin':
      return 'Could not sign in with those details. Please try again.'
    case 'Configuration':
      return 'Sign-in is temporarily unavailable. Please use another option.'
    case 'SessionRequired':
      return 'Please sign in to continue.'
    default:
      return 'Could not complete sign-in. Please try again or use another option.'
  }
}
