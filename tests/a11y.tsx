import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import axe, { type Result, type RunOptions } from 'axe-core'
import { expect } from 'vitest'

/*
 * The accessibility gate every primitive runs through.
 *
 * A component library's worst failures are the silent ones: a control that
 * cannot be reached by keyboard, a state announced only by colour, an icon
 * button with no name. None of them show up in a screenshot and none of them
 * fail a class-list assertion - they fail for one reader, months later, with
 * nobody to tell.
 *
 * axe is the same engine the browser extensions use. Running it here rather
 * than over a built page is a deliberate trade: it sees the real DOM the
 * component produces, on every test run and before anything is deployed, and
 * it does not see layout or resolved colour. What it cannot check is checked
 * elsewhere - contrast against the real tokens is computed in
 * `contrast.test.ts`, and the stand shows the components in both themes.
 *
 * `axe.run` on jsdom needs a node attached to a real document, which is what
 * testing-library's container already is.
 */

/** Rules that cannot mean anything here, with the reason each is off.
 *
 * Turning a rule off is a claim, so each one has to be defensible: these are
 * the ones jsdom cannot evaluate, not the ones that are inconvenient. */
const NOT_APPLICABLE_IN_JSDOM: RunOptions['rules'] = {
  // jsdom computes no colour: every element resolves to transparent on
  // transparent, so this rule either passes vacuously or reports nonsense.
  // Contrast is checked numerically against the real tokens instead.
  'color-contrast': { enabled: false },
  // A primitive is rendered on its own here, so it is legitimately not inside
  // a landmark and legitimately not the page's only h1. Those are page-level
  // rules, and a page is the product's to build.
  region: { enabled: false },
  'page-has-heading-one': { enabled: false },
  'landmark-one-main': { enabled: false },
  'html-has-lang': { enabled: false },
}

function describeViolations(violations: Result[]): string {
  return violations
    .map((violation) => {
      const where = violation.nodes.map((node) => `      ${node.html}`).join('\n')
      return `  ${violation.id} (${violation.impact}): ${violation.help}\n${where}\n      ${violation.helpUrl}`
    })
    .join('\n\n')
}

/**
 * Render the element and assert that axe finds nothing.
 *
 * Returns what `render` returned, so a test can go on to press keys against
 * the same tree rather than rendering it twice.
 */
export async function expectNoA11yViolations(ui: ReactElement, options?: RunOptions) {
  const rendered = render(ui)
  const results = await axe.run(rendered.container, {
    ...options,
    rules: { ...NOT_APPLICABLE_IN_JSDOM, ...options?.rules },
  })

  expect(
    results.violations,
    results.violations.length
      ? `axe found ${results.violations.length} violation(s):\n\n${describeViolations(results.violations)}`
      : '',
  ).toEqual([])

  return rendered
}
