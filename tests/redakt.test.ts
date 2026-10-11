import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/*
 * Nothing in this repository is anybody's.
 *
 * The stand, the demo and every picture taken of them - the visual
 * baselines, the release notes that show those baselines, a screenshot in a
 * README - are drawn on an invented world (`fixtures/world.ts`): people on
 * `example.com`, titles nobody has. That is the default, and this is what
 * keeps it the default. The easiest data to put on a screen is the data
 * already on the screen of whoever is building it - a real address in a
 * field, a path off their disk in a code sample, the IP of a machine on their
 * desk in an example config - and once it is in a picture in a release note
 * it is published.
 *
 * So every tracked text file is read for the four shapes private data comes
 * in, each with the reserved form that is allowed instead:
 *
 * - an email address, on a domain reserved for examples (RFC 2606, 6761);
 * - an IPv4 address, from the documentation ranges (RFC 5737) or loopback;
 * - a path into somebody's home directory;
 * - a host on a private network's names (`.pi`, `.lan`, `.local`).
 *
 * One exception, and it is not private: the package's `author`, which npm
 * publishes on purpose.
 */

const root = resolve(import.meta.dirname, '..')

/** Text the repository tracks, less what is generated from it (scanned at
 * its source) and what is not text. */
const files = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)
  .filter((path) => !/\.(png|jpe?g|ico|webp|gif|woff2?|ttf|otf)$/i.test(path))
  .filter((path) => !/(^|\/)pnpm-lock\.yaml$/.test(path))
  .filter((path) => !path.startsWith('docs/public/'))

interface Finding {
  file: string
  line: number
  text: string
}

function scan(pattern: RegExp, allowed: (match: string, line: string) => boolean): Finding[] {
  const found: Finding[] = []
  for (const file of files) {
    const lines = readFileSync(resolve(root, file), 'utf8').split('\n')
    lines.forEach((line, index) => {
      for (const match of line.matchAll(pattern)) {
        if (!allowed(match[0], line)) found.push({ file, line: index + 1, text: match[0] })
      }
    })
  }
  return found
}

const show = (found: Finding[]) => found.map((entry) => `${entry.file}:${entry.line}  ${entry.text}`).join('\n')

/** Domains set aside for examples: `example.com` and its kin, and the
 * top-level names that will never resolve. */
const RESERVED_DOMAIN = /@(?:[a-z0-9-]+\.)*(?:example\.(?:com|org|net)|example|test|invalid|localhost)$/i

/** Loopback, the unspecified address, and the three documentation ranges. */
const DOCUMENTATION_IP = /^(?:127\.0\.0\.1|0\.0\.0\.0|192\.0\.2\.\d+|198\.51\.100\.\d+|203\.0\.113\.\d+)$/

/** The names a sample path gives its owner instead of a real one. */
const PLACEHOLDER_USER = /^(?:you|me|user|username|name|someone|<[^>]+>|\$\{?\w+\}?|%\w+%)$/i

describe('nothing here is anybody', () => {
  it('reads the repository', () => {
    // A scan that read nothing passes everything.
    expect(files.length).toBeGreaterThan(300)
    expect(files).toContain('fixtures/world.ts')
  })

  it('writes email addresses only on domains reserved for examples', () => {
    const found = scan(/[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}/g, (match, line) => {
      if (RESERVED_DOMAIN.test(match)) return true
      // The package's author, which npm publishes on purpose.
      return /^\s*"author":/.test(line)
    })
    expect(found, `an address off a reserved domain:\n${show(found)}`).toEqual([])
  })

  it('writes IP addresses only from the ranges set aside for documentation', () => {
    const found = scan(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, (match) => DOCUMENTATION_IP.test(match))
    expect(found, `use 192.0.2.x, 198.51.100.x or 203.0.113.x:\n${show(found)}`).toEqual([])
  })

  it('names no home directory', () => {
    const found = scan(/(?:\b[A-Z]:[\\/]+Users[\\/]+|\/home\/|\/Users\/)([^\\/\s'"`)]+)/gi, (match) => {
      const owner = match.replace(/^.*(?:Users[\\/]+|home\/)/i, '')
      return PLACEHOLDER_USER.test(owner)
    })
    expect(found, `a path into somebody's home:\n${show(found)}`).toEqual([])
  })

  it('names no host on a private network', () => {
    const found = scan(/(?:https?:\/\/|@)[A-Za-z0-9.-]+\.(?:pi|lan|local|internal)\b/g, () => false)
    expect(found, `a private host:\n${show(found)}`).toEqual([])
  })
})

describe('the pictures', () => {
  it('are taken in no one in particular\'s language and time zone', () => {
    // A baseline recorded on a machine set to its owner's language and zone
    // would carry both into every picture of a date - and into the release
    // notes that show them. The clock is the world's own (`stand-clock`).
    const config = readFileSync(resolve(root, 'playwright.config.ts'), 'utf8')
    expect(config).toContain("locale: 'en-US'")
    expect(config).toContain("timezoneId: 'UTC'")
  })
})
