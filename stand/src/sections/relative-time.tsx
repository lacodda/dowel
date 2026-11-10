import { Row } from '../row'
import { RelativeTime } from '../../../registry/ui/relative-time'
import { standNow } from '../clock'

export function RelativeTimeSection() {
  const at = (seconds: number) => new Date(standNow.getTime() - seconds * 1000)

  return (
    <>
      <Row label="hover any of them - the exact date is still there, in the title">
        <div className="flex flex-col gap-1 text-sm">
          {[30, 60 * 8, 60 * 60 * 5, 60 * 60 * 24, 60 * 60 * 24 * 9, 60 * 60 * 24 * 200].map(
            (seconds) => (
              <RelativeTime key={seconds} value={at(seconds)} now={standNow} />
            ),
          )}
        </div>
      </Row>

      <Row label="the phrase is the reader's language, including its special words">
        <div className="flex flex-col gap-1">
          {['en-US', 'de-DE', 'fr-FR', 'ru-RU'].map((locale) => (
            <div key={locale} className="flex items-baseline gap-3 text-xs">
              <span className="w-12 font-mono text-faint">{locale}</span>
              <RelativeTime value={at(60 * 60 * 24)} now={standNow} locale={locale} />
            </div>
          ))}
        </div>
      </Row>

      <Row label="'always', for a column where every row should read the same way">
        <div className="flex gap-8 text-sm">
          <RelativeTime value={at(60 * 60 * 24)} now={standNow} locale="en-US" />
          <RelativeTime value={at(60 * 60 * 24)} now={standNow} locale="en-US" numeric="always" />
          <RelativeTime
            value={new Date(standNow.getTime() + 60 * 60 * 26 * 1000)}
            now={standNow}
            locale="en-US"
          />
        </div>
      </Row>
    </>
  )
}
