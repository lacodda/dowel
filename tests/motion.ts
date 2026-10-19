import { classLists, registrySources, utilityOf, type Source } from './classes'

export { compileClasses as compiled } from './compile'
export { hasRule, selectorOf, utilityOf, withoutComments } from './classes'

/*
 * The classes of motion the set writes, found in its source.
 *
 * Shared by the motion gate and the browser that measures it: both have to
 * agree on what counts as motion, or the browser measures one list and the
 * gate holds another. What counts as a class at all is `classes.ts`'s, the
 * same for every gate that reads one.
 */

export type MotionSource = Source

/** Every primitive and block, as shipped. */
export const motionSources = registrySources

/** Whether a class moves something, or says how fast something moves. */
export function isMotion(name: string): boolean {
  const utility = utilityOf(name)
  return /^(transition|duration|ease|delay|animate)(-|$)/.test(utility) || /^\[(transition|animation)[a-z-]*:/.test(utility)
}

/** The motion each string of a source writes, one entry per string that has
 * any - wherever the string stands: a class of motion is told from every
 * other word by its shape alone. */
export function motionStrings(source: MotionSource): string[][] {
  return classLists(source)
    .map((list) => list.classes.filter(isMotion))
    .filter((classes) => classes.length > 0)
}

/** Whether an animation repeats - the kind the theme's rule would run once
 * and leave wherever it stopped. */
export function isLoop(name: string): boolean {
  const utility = utilityOf(name)
  return /^animate-(spin|pulse|ping|bounce)$/.test(utility) || (/^animate-\[/.test(utility) && utility.includes('infinite'))
}
