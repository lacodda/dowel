/* A fixed moment, so the relative phrases on the stand do not drift as the
 * page is left open - and so the visual snapshots do not change every run.
 * The snapshots pin the browser's clock to the same moment, for everything
 * that asks the browser for today; `tests/stand-clock.test.ts` keeps the two
 * the same. */
export const standNow = new Date('2026-09-09T12:00:00Z')
