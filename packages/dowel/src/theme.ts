import { useCallback, useEffect, useState } from 'react'

/*
 * Choosing a theme.
 *
 * The stylesheet does the work: no class on the root element follows the
 * operating system, `light` or `dark` pins one. This is the small amount of
 * JavaScript around that - remembering the choice, applying it before the
 * first paint, and keeping React in step.
 *
 * Taken from kilna, which had it first, with three things fixed on the way:
 * the storage key was the product's name and so could not be shared; a browser
 * that refuses storage threw where a theme switch should simply not remember;
 * and `system` did not follow the operating system after load, so a reader who
 * changed it kept the old theme until the next reload.
 */

/** `system` follows the operating system; the other two pin a class. */
export type Theme = 'system' | 'light' | 'dark'

const THEMES: readonly Theme[] = ['system', 'light', 'dark']

/** Where the choice is remembered. A product may use its own key; the default
 * is shared, so two products of the line on the same origin agree. */
export const defaultStorageKey = 'dowel.theme'

/** Storage is a convenience, never a requirement: private windows, embedded
 * views and blocked site data all make it throw, and a theme switch that
 * cannot remember should still switch. */
function readStored(key: string): Theme | null {
  try {
    const raw = localStorage.getItem(key)
    return THEMES.includes(raw as Theme) ? (raw as Theme) : null
  } catch {
    return null
  }
}

function writeStored(key: string, theme: Theme): void {
  try {
    localStorage.setItem(key, theme)
  } catch {
    // Nothing to do: the choice applies to this page, it just will not survive.
  }
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('light', theme === 'light')
  root.classList.toggle('dark', theme === 'dark')
}

/** Whether the operating system is asking for a dark theme right now. */
function prefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/**
 * Apply the remembered theme immediately, before React renders.
 *
 * Call this from the entry module, above the first render. Without it the page
 * paints in the default theme and then corrects itself, which a reader who
 * chose light sees as a flash of dark.
 */
export function initTheme(storageKey: string = defaultStorageKey): void {
  applyTheme(readStored(storageKey) ?? 'system')
}

/**
 * The current theme and a way to change it.
 *
 * While the theme is `system` this follows the operating system as it changes,
 * so a reader who switches their machine to dark at sunset does not have to
 * reload the page.
 */
export function useTheme(storageKey: string = defaultStorageKey): {
  theme: Theme
  /** Which theme is showing: `system` resolved against the operating system. */
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
} {
  const [theme, setThemeState] = useState<Theme>(() => readStored(storageKey) ?? 'system')
  const [systemIsDark, setSystemIsDark] = useState(prefersDark)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    // The stylesheet follows the operating system on its own - that is what
    // the `prefers-color-scheme` block is for, and the classes are already
    // right. What has to be tracked in React is `resolved`, because a control
    // that draws a sun or a moon needs to know which one is showing.
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = (event: MediaQueryListEvent) => setSystemIsDark(event.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const setTheme = useCallback(
    (next: Theme) => {
      writeStored(storageKey, next)
      setThemeState(next)
    },
    [storageKey],
  )

  const resolved = theme === 'system' ? (systemIsDark ? 'dark' : 'light') : theme

  return { theme, resolved, setTheme }
}

/** The next theme in a fixed cycle, for a control that is one button rather
 * than three. */
export function nextTheme(current: Theme): Theme {
  const index = THEMES.indexOf(current)
  return THEMES[(index + 1) % THEMES.length] ?? 'system'
}

/**
 * A theme switch, as behaviour without markup.
 *
 * The control itself is the product's: kilna's is a row in its sidebar with an
 * icon and a translated label, and a design system that shipped that would be
 * shipping kilna's sidebar. What is worth sharing is the part every product
 * would otherwise get subtly wrong - the cycle order, the accessible state,
 * and telling assistive technology that a button changes the page's own
 * appearance.
 *
 *   const { theme, buttonProps } = useThemeSwitch()
 *   <button {...buttonProps} aria-label={t(`theme.${theme}`)}>
 *     <Icon /> {t(`theme.${theme}`)}
 *   </button>
 *
 * The label stays with the product: a primitive with a string of its own is a
 * primitive that cannot be translated.
 */
export function useThemeSwitch(storageKey: string = defaultStorageKey): {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  /** Spread onto the button that cycles the theme. */
  buttonProps: {
    type: 'button'
    onClick: () => void
    'aria-live': 'polite'
  }
} {
  const { theme, resolved, setTheme } = useTheme(storageKey)

  const onClick = useCallback(() => setTheme(nextTheme(theme)), [theme, setTheme])

  return {
    theme,
    resolved,
    setTheme,
    buttonProps: {
      type: 'button',
      onClick,
      // The button's own label changes when it is pressed - it names the
      // theme now in force - and a screen reader should hear that.
      'aria-live': 'polite',
    },
  }
}

/**
 * Which theme is showing, right now, outside React.
 *
 * `useTheme` returns the same thing as `resolved` and keeps it current; this
 * is for the places a hook cannot reach - a canvas that has to pick a colour,
 * a chart library told what palette to draw in.
 */
export function resolvedTheme(theme: Theme): 'light' | 'dark' {
  if (theme !== 'system') return theme
  return prefersDark() ? 'dark' : 'light'
}
