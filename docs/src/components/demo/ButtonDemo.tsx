import { Button } from '../../../../registry/ui/button'

/*
 * The buttons on the stand are the real component, hydrated in the browser -
 * the same file a consumer installs. A screenshot would be easier and would
 * drift the first time a token changed.
 */

export function ButtonVariants() {
  return (
    <>
      <Button variant="primary">Save</Button>
      <Button variant="ghost">Cancel</Button>
      <Button variant="soft">Selected</Button>
      <Button variant="danger">Delete</Button>
      <Button variant="icon" size="icon-md" aria-label="More">
        <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden>
          <circle cx="3" cy="8" r="1.4" />
          <circle cx="8" cy="8" r="1.4" />
          <circle cx="13" cy="8" r="1.4" />
        </svg>
      </Button>
    </>
  )
}

export function ButtonSizes() {
  return (
    <>
      <Button variant="primary" size="sm">Small</Button>
      <Button variant="primary" size="md">Medium</Button>
      <Button variant="icon" size="icon-sm" aria-label="Small icon">
        <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden>
          <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      </Button>
    </>
  )
}

export function ButtonStates() {
  return (
    <>
      <Button variant="primary" disabled>Disabled</Button>
      <Button variant="ghost" disabled>Disabled</Button>
      <Button asChild variant="primary">
        <a href="#buttons">As a link</a>
      </Button>
    </>
  )
}
