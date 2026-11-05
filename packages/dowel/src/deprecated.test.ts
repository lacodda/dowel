import { describe, expect, it } from 'vitest'
import { deprecationNote } from './deprecated.js'

describe('what a row says', () => {
  const row = { from: 'old', to: 'new', since: '1.2.0', removeIn: '2.0.0' }

  it('names a token the way a product writes it', () => {
    expect(deprecationNote({ ...row, kind: 'token' })).toBe(
      '`--old` was renamed `--new` in 1.2.0; the old name goes in 2.0.0.',
    )
  })

  it.each(['utility', 'item'] as const)('names a %s as it stands', (kind) => {
    expect(deprecationNote({ ...row, kind })).toBe('`old` was renamed `new` in 1.2.0; the old name goes in 2.0.0.')
  })
})
