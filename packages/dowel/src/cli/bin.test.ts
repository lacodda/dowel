import { afterEach, describe, expect, it, vi } from 'vitest'

/*
 * The executable is three lines, and the one that matters is the handing on:
 * the arguments after the script's own path, and the code the command returns
 * set as the process's, rather than an exit that would cut its output short.
 */

const run = vi.fn<(args: string[]) => number>(() => 3)
vi.mock('./index.js', () => ({ run }))

afterEach(() => {
  process.exitCode = undefined
})

describe('the dowel executable', () => {
  it('hands the command its arguments and leaves its code on the process', async () => {
    const argv = process.argv
    process.argv = ['node', '/usr/bin/dowel', 'check', '--json']
    try {
      await import('./bin')
    } finally {
      process.argv = argv
    }
    expect(run).toHaveBeenCalledWith(['check', '--json'])
    expect(process.exitCode).toBe(3)
  })
})
