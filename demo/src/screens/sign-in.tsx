import { LoginScreen } from '@/components/blocks/login-screen'
import { ProductMark } from '@/components/ui/product-mark'
import { you } from '../../../fixtures/world'

/** The demo's one account. Written on the screen: it is a demo. */
export const DEMO_PASSWORD = 'harbour'

export function SignIn({ onSignedIn }: { onSignedIn: () => void }) {
  return (
    <LoginScreen
      title="Sign in to kilna-lite"
      description="A small product built from dowel's blocks, on invented data."
      mark={<ProductMark product="kilna" size={40} />}
      onSubmit={async ({ identifier, password }) => {
        // A moment's wait, so the button can say what it is doing.
        await new Promise((resolve) => window.setTimeout(resolve, 400))
        if (identifier.trim().toLowerCase() !== you.email || password !== DEMO_PASSWORD) {
          return 'That email and password do not match.'
        }
        onSignedIn()
      }}
      footer={
        <span>
          Sign in as <span className="font-mono text-text">{you.email}</span> with{' '}
          <span className="font-mono text-text">{DEMO_PASSWORD}</span>.
        </span>
      }
      words={{
        identifier: 'Email',
        password: 'Password',
        show: 'Show the password',
        hide: 'Hide the password',
        submit: 'Sign in',
        submitting: 'Signing in…',
        failed: 'The server cannot be reached. Try again in a moment.',
      }}
    />
  )
}
