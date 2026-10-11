import { useState } from 'react'
import { LoginScreen, type LoginScreenWords } from '../../../registry/blocks/login-screen'
import { Button } from '../../../registry/ui/button'
import { ProductMark } from '../../../registry/ui/product-mark'
import { you } from '../../../fixtures/world'
import { Row } from '../row'
import { WidthSwitch, Window, type WindowWidth } from './window'

const WORDS: LoginScreenWords = {
  identifier: 'Email',
  password: 'Password',
  show: 'Show the password',
  hide: 'Hide the password',
  submit: 'Sign in',
  submitting: 'Signing in…',
  failed: 'The server cannot be reached. Try again in a moment.',
}

/** The stand's server: slow enough to see the wait, and it answers the three
 * ways a real one does. */
function answer(identifier: string, password: string): Promise<string | void> {
  return new Promise((resolve, reject) => {
    window.setTimeout(() => {
      if (identifier === 'offline@example.com') reject(new Error('no answer'))
      else if (identifier === you.email && password === 'harbour') resolve()
      else resolve('That email and password do not match.')
    }, 700)
  })
}

export function LoginScreenSection() {
  const [width, setWidth] = useState<WindowWidth>('wide')
  const [signedIn, setSignedIn] = useState(false)

  return (
    <Row
      label={`sign in as ${you.email} with "harbour" - any other password is refused, and offline@example.com never gets an answer`}
    >
      <div className="flex w-full flex-col gap-3">
        <WidthSwitch value={width} onChange={setWidth} />
        <Window width={width}>
          {signedIn ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <p className="text-sm text-dim">Signed in as {you.name}.</p>
              <Button size="sm" onClick={() => setSignedIn(false)}>
                Sign out
              </Button>
            </div>
          ) : (
            <LoginScreen
              title="Sign in to kilna"
              description="Use the account whoever runs this server gave you."
              mark={<ProductMark product="kilna" size={40} />}
              onSubmit={async ({ identifier, password }) => {
                const refusal = await answer(identifier, password)
                if (refusal === undefined) setSignedIn(true)
                return refusal
              }}
              extra={
                <a href="#reset" className="text-accent no-underline hover:underline">
                  Forgot your password?
                </a>
              }
              footer="No account? Ask whoever runs this server."
              words={WORDS}
            />
          )}
        </Window>
      </div>
    </Row>
  )
}
