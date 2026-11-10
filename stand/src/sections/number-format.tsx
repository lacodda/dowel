import { cn } from 'dowel-ui'
import { Row } from '../row'
import { NumberFormat } from '../../../registry/ui/number-format'

export function NumberFormatSection() {
  return (
    <>
      <Row label="the separators are the reader's - same number, four languages">
        <div className="flex flex-col gap-1">
          {['en-US', 'de-DE', 'fr-FR', 'ru-RU'].map((locale) => (
            <div key={locale} className="flex items-baseline gap-3 font-mono text-xs">
              <span className="w-12 text-faint">{locale}</span>
              <NumberFormat value={1234567.89} locale={locale} maximumFractionDigits={2} />
            </div>
          ))}
        </div>
      </Row>

      <Row label="money, percentages and a compact number - one component, Intl's options">
        <div className="flex flex-col gap-1 font-mono text-xs">
          <NumberFormat value={1299.5} locale="en-US" style="currency" currency="USD" />
          <NumberFormat value={0.427} locale="en-US" style="percent" maximumFractionDigits={1} />
          <NumberFormat value={1200000} locale="en-US" notation="compact" />
          <NumberFormat value={42} locale="en-US" style="unit" unit="megabyte" />
        </div>
      </Row>

      <Row label="the figures line up - in a font whose digits differ in width">
        {/* The rows are 1s against 8s on purpose: those are the two digits
          * whose proportional widths differ most, and a column of mixed
          * numbers hides the effect by averaging it out.
          *
          * `w-fit` matters as much. Inside a stretched column both variants
          * end up the same width and the demonstration shows nothing - which
          * is what the first version of this section did.
          *
          * The two columns look identical wherever the rendering font has
          * uniform digits anyway - the CI container is one such place, and its
          * baseline photograph shows no difference. That is the font, not the
          * component: `tabular-nums` asks, and a font that has nothing to
          * change changes nothing. The rule still earns its place, because the
          * fonts a product actually ships to are the other kind. */}
        <div className="flex gap-8">
          {[
            ['tabular', 'tabular-nums'],
            ['proportional', '[font-variant-numeric:proportional-nums]'],
          ].map(([label, variant]) => (
            <div key={label} className="flex w-fit flex-col items-end">
              <span className="mb-1 text-2xs uppercase tracking-caption text-dim">{label}</span>
              {[1111, 8888, 1818, 8181].map((value) => (
                <span key={value} className={cn('text-sm', variant)}>
                  {value}
                </span>
              ))}
            </div>
          ))}
        </div>
      </Row>
    </>
  )
}
