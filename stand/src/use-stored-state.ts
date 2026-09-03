import { useCallback, useState } from 'react'

/*
 * A piece of stand state that survives a reload.
 *
 * The theme already persists - `useThemeSwitch` keeps it in `localStorage` -
 * and the accent did not, so choosing a product's colour and reloading threw
 * the choice away. On a stand whose whole purpose is comparing a component
 * across accents and themes, half-remembered settings are a papercut you feel
 * on every visit.
 *
 * This lives in the stand rather than the package: remembering a preference is
 * a product's decision about its own users, and dowel ships the theme switch
 * because a theme is part of the system, not because storage is.
 */
export function useStoredState(
  key: string,
  fallback: string,
): [string, (next: string) => void] {
  const [value, setValue] = useState(() => {
    // Storage throws rather than returning null in a private window and under
    // some "block site data" settings, so a read that looks total is not.
    try {
      return window.localStorage.getItem(key) ?? fallback
    } catch {
      return fallback
    }
  })

  const store = useCallback(
    (next: string) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, next)
      } catch {
        // Not being able to remember is not a reason to stop working.
      }
    },
    [key],
  )

  return [value, store]
}
