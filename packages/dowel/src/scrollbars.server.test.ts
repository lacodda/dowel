// @vitest-environment node
import { expect, it } from 'vitest'
import { overlayScrollbars } from './scrollbars'

// In a file of its own, because a test environment with a document will not let
// it be taken away.
it('asks nothing of a server, where there is no document', () => {
  expect(typeof document).toBe('undefined')
  const stop = overlayScrollbars()
  expect(() => stop()).not.toThrow()
})
