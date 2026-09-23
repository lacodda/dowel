import { createContext, createElement, useContext, useSyncExternalStore, type ReactNode } from 'react'

/*
 * The language an application speaks, as the one place dates and numbers ask.
 *
 * kasl-server's interface was English and its week headings came out in
 * Russian: `toLocaleDateString([])` asks for the *browser's* language, and the
 * browser belonged to someone in Moscow. Nothing was wrong with the call, and
 * nothing was wrong with the browser - the formatting simply asked a different
 * question from the one the interface answers. Every product that formats a
 * date without naming a locale carries the same defect, waiting for a reader
 * whose browser speaks a language the product does not.
 *
 * So the question is asked of the application, and the application answers
 * in one place it already has to fill in: `<html lang>`. That attribute is
 * what a screen reader pronounces the page in and what axe insists on, so a
 * product sets it anyway; from now on it also decides how a Tuesday is
 * written. It is watched, so a product that switches language by setting the
 * attribute re-renders every date without a provider.
 *
 * `LocaleProvider` is for a part of the page that speaks another language than
 * the rest - a preview of a document in its own language, a settings screen
 * showing the choice before it is applied. An explicit `locale` prop on a
 * primitive beats both.
 *
 * When nothing is declared the answer is English, the line's default - never
 * the browser's language, which is the defect this exists to close.
 */

/** The answer when nothing on the page names a language. */
export const fallbackLocale = 'en'

/** The page's declared language, or the fallback. Safe outside a browser. */
export function documentLocale(): string {
  if (typeof document === 'undefined') return fallbackLocale
  return document.documentElement.lang.trim() || fallbackLocale
}

function subscribe(onChange: () => void): () => void {
  if (typeof MutationObserver === 'undefined' || typeof document === 'undefined') return () => undefined
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  return () => observer.disconnect()
}

const LocaleContext = createContext<string | null>(null)

export interface LocaleProviderProps {
  /** A BCP 47 tag, as `<html lang>` takes it: `en`, `pt-BR`, `ru`. */
  locale: string
  children?: ReactNode
}

/** Sets the language for a part of the page that speaks another one. */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  return createElement(LocaleContext.Provider, { value: locale }, children)
}

/** The language to format in: an explicit one if given, else the nearest
 * `LocaleProvider`, else `<html lang>`, else English. */
export function useLocale(explicit?: string): string {
  const provided = useContext(LocaleContext)
  const declared = useSyncExternalStore(subscribe, documentLocale, () => fallbackLocale)
  return explicit ?? provided ?? declared
}
