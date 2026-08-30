/*
 * `pnpm new-component <name>` - the four files a primitive is made of.
 *
 * A component here is not one file. It is the component, a test, a page on the
 * stand, and a demo island for that page; the registry entry is derived from
 * the source, so it is the one part nobody has to write. Miss any of the four
 * and the component half-exists: untested, or undocumented, or documented with
 * a screenshot that will drift.
 *
 * The generator exists because "four files" is exactly the kind of rule that
 * decays. Not because typing them is slow.
 *
 * What it writes is a skeleton that already passes the gates: tokens rather
 * than raw values, no strings of its own, a real element underneath. What it
 * cannot write is the reason the component exists - the block comment at the
 * top is left for a person, and the registry reads it as the description.
 */
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')

const name = process.argv[2]
if (!name) {
  console.error('usage: pnpm new-component <name>    e.g. pnpm new-component input')
  process.exit(1)
}
if (!/^[a-z][a-z0-9-]*$/.test(name)) {
  console.error(`\`${name}\` is not a component name: lower case, digits and dashes, starting with a letter.`)
  process.exit(1)
}

const Pascal = name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('')

const files = [
  {
    path: `registry/ui/${name}.tsx`,
    content: `import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'dowel-ui'

/*
 * ${Pascal}.
 *
 * Say here what this is for and why it looks the way it does - the registry
 * reads this paragraph as the component's description, so it is what someone
 * sees before they install it.
 */
export const ${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Variants = cva('', {
  variants: {
    variant: {
      default: '',
    },
  },
  defaultVariants: { variant: 'default' },
})

export interface ${Pascal}Props
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof ${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Variants> {}

export function ${Pascal}({ variant, className, ...props }: ${Pascal}Props) {
  return (
    <div
      className={cn(${name.replace(/-([a-z])/g, (_, c) => c.toUpperCase())}Variants({ variant }), className)}
      {...props}
    />
  )
}
`,
  },
  {
    path: `registry/ui/${name}.test.tsx`,
    content: `// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ${Pascal} } from './${name}'

describe('${Pascal}', () => {
  it('renders what it is given', () => {
    render(<${Pascal}>content</${Pascal}>)
    expect(screen.getByText('content')).toBeDefined()
  })

  it('lets the caller win a conflict', () => {
    // \`cn\` resolves by utility group, so a caller's class beats the
    // component's rather than the two fighting over source order.
    const { container } = render(<${Pascal} className="rounded-full" />)
    expect(container.firstElementChild?.className).toContain('rounded-full')
  })

  it('carries no colour outside the vocabulary', () => {
    // The rule the system rests on: a primitive never writes a raw colour and
    // never uses a \`dark:\` utility, because the theme swaps underneath.
    const { container } = render(<${Pascal} />)
    const className = container.firstElementChild?.className ?? ''
    expect(className).not.toMatch(/\\bdark:/)
    expect(className).not.toMatch(/#[0-9a-f]{3,8}\\b/i)
  })
})
`,
  },
  {
    path: `docs/src/components/demo/${Pascal}Demo.tsx`,
    content: `import { ${Pascal} } from '../../../../registry/ui/${name}'

/* The stand renders the real component, hydrated in the browser - the same
 * file a consumer installs. */

export function ${Pascal}Variants() {
  return <${Pascal}>content</${Pascal}>
}
`,
  },
  {
    path: `docs/src/content/docs/components/${name}.mdx`,
    content: `---
title: ${Pascal}
description: Say in one line what this is for.
---

import Stand from '../../../components/Stand.astro'
import { ${Pascal}Variants } from '../../../components/demo/${Pascal}Demo'

\`\`\`console
$ npx shadcn@latest add https://lacodda.github.io/dowel/r/${name}.json
\`\`\`

## Variants

<Stand caption="Say what the reader is looking at.">
  <${Pascal}Variants client:load />
</Stand>

## Props

| Prop | Type | Default | |
| --- | --- | --- | --- |
| \`variant\` | \`default\` | \`default\` | |
| \`className\` | \`string\` | | Merged so the caller wins a conflict |
`,
  },
]

const existing = files.filter((file) => existsSync(resolve(root, file.path)))
if (existing.length > 0) {
  console.error(`\`${name}\` already exists:`)
  for (const file of existing) console.error(`  ${file.path}`)
  process.exit(1)
}

for (const file of files) {
  const full = resolve(root, file.path)
  mkdirSync(dirname(full), { recursive: true })
  writeFileSync(full, file.content)
  console.log(`  ${file.path}`)
}

console.log(`
${Pascal} is four files. Next:
  1. Write the component, and the block comment saying what it is for.
  2. Make the test say what would be wrong if it broke.
  3. Show every variant on the stand, in both themes.
  4. \`pnpm build\` to put it in the registry, then install it somewhere real.`)
