// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { expectNoA11yViolations } from '../../tests/a11y'
import { LoginScreen, type LoginScreenProps, type LoginScreenWords } from './login-screen'

const WORDS: LoginScreenWords = {
  identifier: 'Email',
  password: 'Password',
  show: 'Show the password',
  hide: 'Hide the password',
  submit: 'Sign in',
  submitting: 'Signing in…',
  failed: 'The server cannot be reached.',
}

function Screen(props: Partial<LoginScreenProps>) {
  return <LoginScreen title="Sign in to the demo" onSubmit={async () => {}} words={WORDS} {...props} />
}

const email = () => screen.getByLabelText(/^Email/) as HTMLInputElement
const password = () => screen.getByLabelText(/^Password/) as HTMLInputElement

async function signIn(name = 'ines@example.com', secret = 'hunter2') {
  await userEvent.type(email(), name)
  await userEvent.type(password(), secret)
  await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
}

/** A promise the test settles by hand. */
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: unknown) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

describe('LoginScreen', () => {
  it('is the page, titled', () => {
    render(<Screen description="Use the account you were given." />)
    expect(screen.getByRole('main')).toBeDefined()
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in to the demo' })).toBeDefined()
    expect(screen.getByText('Use the account you were given.')).toBeDefined()
  })

  it('hands over what was typed', async () => {
    const onSubmit = vi.fn(async () => {})
    render(<Screen onSubmit={onSubmit} />)
    await signIn()
    expect(onSubmit).toHaveBeenCalledWith({ identifier: 'ines@example.com', password: 'hunter2' })
  })

  it('marks the boxes the way a password manager reads them', () => {
    render(<Screen />)
    expect(email().getAttribute('autocomplete')).toBe('username')
    expect(email().type).toBe('email')
    expect(password().getAttribute('autocomplete')).toBe('current-password')
    expect(password().type).toBe('password')
  })

  it('asks for a user name as text when that is what it is', () => {
    render(<Screen identifier="username" words={{ ...WORDS, identifier: 'User name' }} />)
    const field = screen.getByLabelText(/^User name/) as HTMLInputElement
    expect(field.type).toBe('text')
    expect(field.getAttribute('autocomplete')).toBe('username')
  })

  it('cannot be sent twice while the first attempt is on its way', async () => {
    const answer = deferred<void>()
    const onSubmit = vi.fn(() => answer.promise)
    render(<Screen onSubmit={onSubmit} />)
    await signIn()
    const button = screen.getByRole('button', { name: 'Signing in…' })
    expect((button as HTMLButtonElement).disabled).toBe(true)
    expect(button.getAttribute('aria-busy')).toBe('true')
    // Enter in the field submits the form, past a disabled button.
    await userEvent.type(password(), '{Enter}')
    expect(onSubmit).toHaveBeenCalledOnce()
    // And a submission by any other road - a script, a second submit button
    // the product added - is refused while the first is out.
    fireEvent.submit(document.querySelector('form')!)
    expect(onSubmit).toHaveBeenCalledOnce()
    answer.resolve()
  })

  it('says why, when refused, and selects the password for the next try', async () => {
    render(<Screen onSubmit={async () => 'That email and password do not match.'} />)
    await signIn()
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toBe('That email and password do not match.')
    expect(document.activeElement).toBe(password())
    expect(password().selectionStart).toBe(0)
    expect(password().selectionEnd).toBe('hunter2'.length)
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined()
  })

  it('says the server is out of reach when there was no answer at all', async () => {
    render(
      <Screen
        onSubmit={async () => {
          throw new Error('offline')
        }}
      />,
    )
    await signIn()
    expect((await screen.findByRole('alert')).textContent).toBe('The server cannot be reached.')
  })

  it('takes nothing, null or false as a yes', async () => {
    for (const yes of [undefined, null, false]) {
      const { unmount } = render(<Screen onSubmit={async () => yes} />)
      await signIn()
      expect(screen.queryByRole('alert')).toBeNull()
      unmount()
    }
  })

  it('clears the last refusal when trying again', async () => {
    const answers = ['Wrong.', undefined]
    render(<Screen onSubmit={async () => answers.shift()} />)
    await signIn()
    expect(await screen.findByRole('alert')).toBeDefined()
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('puts the extra under the password and the footer under the panel', () => {
    render(<Screen extra={<a href="#reset">Forgot your password?</a>} footer={<span>No account? Ask.</span>} />)
    const form = document.querySelector('form')!
    expect(form.contains(screen.getByRole('link', { name: 'Forgot your password?' }))).toBe(true)
    const panel = form.parentElement!
    expect(panel.contains(screen.getByText('No account? Ask.'))).toBe(false)
    expect(screen.getByRole('main').contains(screen.getByText('No account? Ask.'))).toBe(true)
  })

  it('has no accessibility violations', async () => {
    await expectNoA11yViolations(<Screen extra={<a href="#reset">Forgot your password?</a>} />)
  })

  it('has no accessibility violations with a refusal showing', async () => {
    const { container } = render(<Screen onSubmit={async () => 'Wrong.'} />)
    await signIn()
    await screen.findByRole('alert')
    const { default: axe } = await import('axe-core')
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false }, region: { enabled: false } } })
    expect(results.violations.map((violation) => violation.id)).toEqual([])
  })
})
