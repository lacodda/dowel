import { RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import { noImplicitLocale } from './no-implicit-locale.js'

/*
 * The rule that keeps a date from being written in the browser's language.
 *
 * The pair that matters: a call with no locale, which is the defect, and a
 * call with a variable, which is the fix - the rule must tell them apart
 * without trying to guess where the variable came from.
 */

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
})

ruleTester.run('no-implicit-locale', noImplicitLocale, {
  valid: [
    // The fix: a locale, named.
    { code: 'date.toLocaleDateString(locale)' },
    { code: "date.toLocaleDateString('en', { weekday: 'short' })" },
    { code: 'new Intl.DateTimeFormat(locale, { dateStyle: "long" })' },
    { code: 'new Intl.NumberFormat(useLocale()).format(n)' },
    // Not a formatter.
    { code: 'name.toLocaleUpperCase()' },
    { code: 'new Intl.Locale(tag)' },
    { code: 'new Foo.DateTimeFormat()' },
    { code: 'value.toString()' },
  ],
  invalid: [
    // The kasl-server defect, exactly.
    { code: "date.toLocaleDateString([], { weekday: 'short' })", errors: 1 },
    { code: 'n.toLocaleString()', errors: 1 },
    { code: 'd.toLocaleTimeString(undefined, { hour: "2-digit" })', errors: 1 },
    { code: 'new Intl.DateTimeFormat()', errors: 1 },
    { code: 'new Intl.NumberFormat(undefined, { style: "percent" })', errors: 1 },
    { code: 'new Intl.RelativeTimeFormat([])', errors: 1 },
    { code: 'new Intl.Collator()', errors: 1 },
  ],
})
